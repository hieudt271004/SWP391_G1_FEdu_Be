import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, Filter, UserPlus, Edit2, Trash2, Eye, 
  ChevronLeft, ChevronRight, List, Grid, MoreVertical, 
  ChevronRight as ChevronRightIcon, ArrowUpDown, Loader2, AlertCircle, ArrowUp, ArrowDown 
} from "lucide-react";
import { UserDetailModal } from "./UserDetailModal";
import { adminService } from "../../services/admin.service";
import type { AdminUserResponse } from "../../services/admin.service";
import { UserRole } from "@/types/user";
import { useAuth } from "../../context/AuthContext";
import { useConfirm } from "../../context/ConfirmContext";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

type ViewMode = "list" | "grid";

interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  gender: "Male" | "Female" | "Other";
  dateOfBirth: string;
  role: string;
  roleKey: UserRole;
  joinedDate: string;
  createdAtRaw?: number;
  status: "active" | "inactive";
  avatar: string;
  avatarUrl: string;
}

// Fixed BE UserResponse → AdminUser (display) with correct runtime mapping for gender
function beUserToAdminUser(u: AdminUserResponse): AdminUser {
  const fname = u.firstName || "";
  const lname = u.lastName || "";
  const initials = ((fname[0] || "") + (lname[0] || "")).toUpperCase() || "??";
  
  const roleLabel = u.roles?.includes("TEACHER")
    ? "Giảng viên"
    : u.roles?.includes("STUDENT")
    ? "Học viên"
    : u.roles?.[0] || "USER";
    
  const roleKey: UserRole = u.roles?.includes("TEACHER") 
    ? "TEACHER"
    : u.roles?.includes("STUDENT") 
    ? "STUDENT"
    : ((u.roles?.[0] as UserRole) || "USER");

  // Fix runtime gender mapping (BE values: MALE/FEMALE/OTHER -> display: Male/Female/Other)
  const normalizedGender = u.gender === "MALE" 
    ? "Male" 
    : u.gender === "FEMALE" 
    ? "Female" 
    : "Other";

  return {
    id: u.userId,
    name: `${fname} ${lname}`.trim(),
    email: u.email,
    phone: u.phone || "—",
    gender: normalizedGender,
    dateOfBirth: u.bod || "—",
    role: roleLabel,
    roleKey,
    joinedDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString("vi-VN") : "—",
    createdAtRaw: u.createdAt ? new Date(u.createdAt).getTime() : 0,
    status: u.status === "ACTIVE" ? "active" : "inactive",
    avatar: initials,
    avatarUrl: u.avatarUrl || "",
  };
}

interface UserManagementPageProps {
  filterRole?: "all" | "STUDENT" | "TEACHER";
}

export function UserManagementPage({ filterRole = "all" }: UserManagementPageProps) {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const confirm = useConfirm();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "STUDENT" | "TEACHER">(filterRole);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [sortField, setSortField] = useState<"name" | "email" | "joinedDate" | "role" | "status" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getAllUsers();
      setUsers(data.map(beUserToAdminUser));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Không tải được danh sách người dùng");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setRoleFilter(filterRole);
    setCurrentPage(1);
  }, [filterRole]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".relative")) setOpenDropdown(null);
    };
    if (openDropdown !== null) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openDropdown]);

  const handleAddUser = () => {
    setModalMode("add");
    setSelectedUser(null);
    setModalOpen(true);
  };

  const handleEditUser = (user: AdminUser) => {
    setModalMode("edit");
    setSelectedUser(user);
    setModalOpen(true);
  };

  const handleViewUser = (user: AdminUser) => {
    navigate(`/admin/users/${user.id}`);
  };

  const handleDeleteUser = async (userId: number) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    
    const isConfirmed = await confirm({
      title: "Xác nhận xóa tài khoản",
      message: `Bạn có chắc chắn muốn xóa người dùng "${user.name}"? Hành động này sẽ loại bỏ tài khoản khỏi hệ thống và không thể hoàn tác.`,
      confirmText: "Xóa",
      cancelText: "Hủy",
      type: "danger"
    });
    
    if (!isConfirmed) return;
    
    try {
      await adminService.deleteUser(user.email);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success(`Đã xóa người dùng "${user.name}" thành công.`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Xóa thất bại");
    }
    setOpenDropdown(null);
  };

  const handleToggleStatus = async (user: AdminUser) => {
    const newStatus = user.status === "active" ? "INACTIVE" : "ACTIVE";
    try {
      await adminService.updateUserStatus(user.email, newStatus as "ACTIVE" | "INACTIVE" | "NONE");
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, status: newStatus === "ACTIVE" ? "active" : "inactive" } : u
        )
      );
      toast.success(`Đã cập nhật trạng thái của "${user.name}" thành ${newStatus === "ACTIVE" ? "Hoạt động" : "Ngưng hoạt động"}.`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Cập nhật thất bại");
    }
  };

  const handleSort = (field: "name" | "email" | "joinedDate" | "role" | "status") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: "name" | "email" | "joinedDate" | "role" | "status") => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 opacity-60 shrink-0" />;
    }
    return sortDirection === "asc" 
      ? <ArrowUp className="w-3.5 h-3.5 text-primary-foreground shrink-0" />
      : <ArrowDown className="w-3.5 h-3.5 text-primary-foreground shrink-0" />;
  };

  const filteredUsers = users.filter((user) => {
    // Exclude currently logged in admin
    if (currentUser && user.email === currentUser.email) {
      return false;
    }
    const matchSearch =
      searchQuery === "" ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = roleFilter === "all" || user.roleKey === roleFilter;
    return matchSearch && matchRole;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortField) return 0;
    
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];
    
    if (sortField === "joinedDate") {
      aVal = a.createdAtRaw || 0;
      bVal = b.createdAtRaw || 0;
    }
    
    if (typeof aVal === "string") {
      return sortDirection === "asc" 
        ? aVal.localeCompare(bVal) 
        : bVal.localeCompare(aVal);
    }
    
    return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const pageTitle =
    filterRole === "STUDENT" ? "Học viên" : filterRole === "TEACHER" ? "Giảng viên" : "Tất cả người dùng";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 font-sans">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Đang tải danh sách người dùng...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 max-w-md mx-auto text-center font-sans">
        <div className="p-4 rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="w-10 h-10" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-foreground text-lg">Đã xảy ra lỗi</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
        <button
          onClick={fetchUsers}
          className="px-5 py-2 text-white bg-primary hover:bg-primary/90 text-sm font-semibold rounded-lg shadow-sm transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* Breadcrumb & Title */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{pageTitle}</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-accent/30 px-3 py-1.5 rounded-lg border border-border/30">
          <span>Quản lý Người dùng</span>
          <ChevronRightIcon className="w-4 h-4 text-muted-foreground/60" />
          <span className="text-foreground font-semibold">{pageTitle}</span>
        </div>
      </div>

      {/* View Toggle & Add Button */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2 bg-accent/40 p-1 rounded-lg border border-border/40">
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 cursor-pointer ${
              viewMode === "list"
                ? "bg-primary text-primary-foreground shadow-sm animate-in fade-in-50 duration-150"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/65"
            }`}
          >
            <List className="w-4 h-4" /> Dạng bảng
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 cursor-pointer ${
              viewMode === "grid"
                ? "bg-primary text-primary-foreground shadow-sm animate-in fade-in-50 duration-150"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/65"
            }`}
          >
            <Grid className="w-4 h-4" /> Dạng lưới
          </button>
        </div>
        {filterRole === "all" && (
          <Button
            onClick={handleAddUser}
            className="gap-2 h-9 text-xs font-semibold"
          >
            <UserPlus className="w-4 h-4" /> Thêm mới
          </Button>
        )}
      </div>

      {/* Filters & Controls */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm text-muted-foreground">Hiển thị</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 text-xs outline-none cursor-pointer bg-muted text-foreground border border-input rounded-md font-medium"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm text-muted-foreground">mục</span>
          </div>
          
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full sm:w-auto justify-end">
            {filterRole === "all" && (
              <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-md border border-input focus-within:ring-2 focus-within:ring-primary/10 w-full sm:w-auto shrink-0">
                <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
                  className="bg-transparent border-none text-sm text-foreground font-semibold outline-none cursor-pointer w-full"
                >
                  <option value="all">Tất cả vai trò</option>
                  <option value="STUDENT">Học viên</option>
                  <option value="TEACHER">Giảng viên</option>
                </select>
              </div>
            )}
            
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md border border-input focus-within:ring-2 focus-within:ring-primary/10 w-full sm:w-[280px] shrink-0">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm theo tên, email..."
                className="flex-1 bg-transparent outline-none border-none text-xs text-foreground placeholder:text-muted-foreground focus:ring-0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === "list" ? (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden transition-all duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-primary text-primary-foreground border-b border-border">
                  <th 
                    className="text-left px-6 py-4 font-semibold text-xs uppercase tracking-wider cursor-pointer select-none hover:bg-primary-dark transition-colors"
                    onClick={() => handleSort("name")}
                  >
                    <span className="flex items-center gap-1.5 font-semibold text-primary-foreground uppercase tracking-wider">
                      HỌ VÀ TÊN {getSortIcon("name")}
                    </span>
                  </th>
                  <th 
                    className="text-left px-6 py-4 font-semibold text-xs uppercase tracking-wider cursor-pointer select-none hover:bg-primary-dark transition-colors"
                    onClick={() => handleSort("email")}
                  >
                    <span className="flex items-center gap-1.5 font-semibold text-primary-foreground uppercase tracking-wider">
                      EMAIL {getSortIcon("email")}
                    </span>
                  </th>
                  <th 
                    className="text-left px-6 py-4 font-semibold text-xs uppercase tracking-wider cursor-pointer select-none hover:bg-primary-dark transition-colors"
                    onClick={() => handleSort("joinedDate")}
                  >
                    <span className="flex items-center gap-1.5 font-semibold text-primary-foreground uppercase tracking-wider">
                      NGÀY THAM GIA {getSortIcon("joinedDate")}
                    </span>
                  </th>
                  <th 
                    className="text-left px-6 py-4 font-semibold text-xs uppercase tracking-wider cursor-pointer select-none hover:bg-primary-dark transition-colors"
                    onClick={() => handleSort("role")}
                  >
                    <span className="flex items-center gap-1.5 font-semibold text-primary-foreground uppercase tracking-wider">
                      VAI TRÒ {getSortIcon("role")}
                    </span>
                  </th>
                  <th 
                    className="text-left px-6 py-4 font-semibold text-xs uppercase tracking-wider cursor-pointer select-none hover:bg-primary-dark transition-colors"
                    onClick={() => handleSort("status")}
                  >
                    <span className="flex items-center gap-1.5 font-semibold text-primary-foreground uppercase tracking-wider">
                      TRẠNG THÁI {getSortIcon("status")}
                    </span>
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-xs uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 font-semibold text-primary-foreground uppercase tracking-wider">
                      HÀNH ĐỘNG
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {paginatedUsers.length > 0 ? (
                  paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/20 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-border/80 shadow-sm bg-accent/40 overflow-hidden">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-foreground font-bold text-sm">{user.avatar}</span>
                            )}
                          </div>
                          <span className="font-semibold text-foreground">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                      <td className="px-6 py-4 text-muted-foreground">{user.joinedDate}</td>
                      <td className="px-6 py-4">
                        <span 
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md ${
                            user.roleKey === "TEACHER" 
                              ? "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300" 
                              : user.roleKey === "ADMIN"
                              ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                              : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          disabled={user.roleKey === "ADMIN"}
                          onClick={() => handleToggleStatus(user)}
                          title={user.roleKey === "ADMIN" ? "Không thể thay đổi trạng thái Admin khác" : "Click để thay đổi"}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all border-none cursor-pointer active:scale-95 ${
                            user.status === "active"
                              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200"
                              : "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 hover:bg-rose-200"
                          } ${user.roleKey === "ADMIN" ? "opacity-75 cursor-not-allowed hover:bg-emerald-100 active:scale-100" : ""}`}
                        >
                          {user.status === "active" ? "Hoạt động" : "Ngưng"}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleViewUser(user)}
                            className="p-2 rounded-lg text-primary hover:bg-accent transition-all duration-200 border-none bg-transparent cursor-pointer active:scale-90"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={() => handleEditUser(user)}
                            disabled={user.roleKey === "ADMIN"}
                            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all duration-200 border-none bg-transparent cursor-pointer active:scale-90"
                            title={user.roleKey === "ADMIN" ? "Không thể chỉnh sửa Admin khác" : "Chỉnh sửa"}
                          >
                            <Edit2 className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={user.roleKey === "ADMIN"}
                            className="p-2 rounded-lg text-destructive hover:bg-destructive/10 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all duration-200 border-none bg-transparent cursor-pointer active:scale-90"
                            title={user.roleKey === "ADMIN" ? "Không thể xóa Admin khác" : "Xóa"}
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground font-medium">
                      Không tìm thấy người dùng phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {filteredUsers.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-card">
              <div className="text-sm text-muted-foreground">
                Hiển thị {(currentPage - 1) * itemsPerPage + 1} –{" "}
                {Math.min(currentPage * itemsPerPage, filteredUsers.length)} trong tổng số{" "}
                {filteredUsers.length} người dùng
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg hover:bg-accent text-muted-foreground disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors border border-border bg-card cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 font-semibold text-sm rounded-lg transition-all cursor-pointer border-none ${
                      currentPage === page
                        ? "bg-primary text-primary-foreground shadow-sm animate-in zoom-in-95 duration-100"
                        : "text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg hover:bg-accent text-muted-foreground disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors border border-border bg-card cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {paginatedUsers.length > 0 ? (
            paginatedUsers.map((user) => (
              <div
                key={user.id}
                className="p-6 relative bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col justify-between"
              >
                {/* Dropdown Options */}
                <div className="absolute top-4 right-4">
                  {user.roleKey !== "ADMIN" && (
                    <div className="relative">
                      <button
                        onClick={() => setOpenDropdown(openDropdown === user.id ? null : user.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors border-none bg-transparent cursor-pointer active:scale-95"
                      >
                        <MoreVertical className="w-4.5 h-4.5" />
                      </button>
                      {openDropdown === user.id && (
                        <div className="absolute right-0 top-full mt-2 w-40 rounded-lg shadow-lg border border-border bg-card py-1.5 z-10 animate-in fade-in-50 slide-in-from-top-2 duration-150">
                          <button
                            onClick={() => {
                              handleEditUser(user);
                              setOpenDropdown(null);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 hover:bg-accent text-foreground text-sm font-semibold text-left border-none bg-transparent cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4 text-muted-foreground" /> Chỉnh sửa
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="w-full flex items-center gap-2 px-4 py-2 hover:bg-destructive/10 text-destructive text-sm font-semibold text-left border-none bg-transparent cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" /> Xóa
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Profile Card Header */}
                <div className="flex flex-col items-center text-center mb-4">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mb-3.5 border border-border shadow-sm bg-accent/40 overflow-hidden">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-foreground font-bold text-xl">{user.avatar}</span>
                    )}
                  </div>
                  <h3 className="font-bold text-foreground text-base tracking-tight mb-1 group-hover:text-primary transition-colors">
                    {user.name}
                  </h3>
                  <span 
                    className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full uppercase tracking-wider ${
                      user.roleKey === "TEACHER" 
                        ? "bg-pink-100 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400" 
                        : user.roleKey === "ADMIN"
                        ? "bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400"
                        : "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                    }`}
                  >
                    {user.role}
                  </span>
                </div>

                {/* Details Section */}
                <div className="space-y-2 mb-5 border-t border-b border-border/50 py-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Giới tính:</span>
                    <span className="text-foreground font-semibold">
                      {user.gender === "Male" ? "Nam" : user.gender === "Female" ? "Nữ" : "Khác"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">SĐT:</span>
                    <span className="text-foreground font-semibold">{user.phone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="text-foreground font-semibold max-w-[150px] truncate" title={user.email}>
                      {user.email}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <button
                  onClick={() => handleViewUser(user)}
                  className="w-full py-2.5 text-sm font-semibold text-primary border border-primary hover:bg-primary hover:text-white rounded-lg transition-all duration-200 shadow-sm cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                >
                  Xem chi tiết
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-16 text-muted-foreground font-medium bg-card border border-border rounded-xl">
              Không tìm thấy người dùng phù hợp.
            </div>
          )}
        </div>
      )}

      {/* User Detail Modal */}
      <UserDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        user={selectedUser}
        mode={modalMode}
        onSuccess={fetchUsers}
      />
    </div>
  );
}
