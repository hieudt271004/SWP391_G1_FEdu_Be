import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, UserPlus, Edit2, Trash2, Eye, ChevronLeft, ChevronRight, List, Grid, MoreVertical, ChevronRight as ChevronRightIcon, ArrowUpDown, Loader2, AlertCircle } from "lucide-react";
import { UserDetailModal } from "./UserDetailModal";
import { adminService } from "../../services/admin.service";
import type { AdminUserResponse } from "../../services/admin.service";
import { UserRole } from "@/types/user";

type ViewMode = "list" | "grid";

// Map BE UserResponse → AdminUser (display)
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
  status: "active" | "inactive";
  avatar: string;
  avatarUrl: string;
}

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
  return {
    id: u.userId,
    name: `${fname} ${lname}`.trim(),
    email: u.email,
    phone: u.phone || "—",
    gender: (u.gender as "Male" | "Female" | "Other") || "Other",
    dateOfBirth: u.bod || "—",
    role: roleLabel,
    roleKey,
    joinedDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString("vi-VN") : "—",
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

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => { setRoleFilter(filterRole); setCurrentPage(1); }, [filterRole]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.relative')) setOpenDropdown(null);
    };
    if (openDropdown !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openDropdown]);

  const handleAddUser = () => { setModalMode("add"); setSelectedUser(null); setModalOpen(true); };
  const handleEditUser = (user: AdminUser) => { setModalMode("edit"); setSelectedUser(user); setModalOpen(true); };
  const handleViewUser = (user: AdminUser) => { navigate(`/admin/users/${user.id}`); };
  const handleDeleteUser = async (userId: number) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    if (!confirm(`Xác nhận xóa "${user.name}"?`)) return;
    try {
      await adminService.deleteUser(user.email);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Xóa thất bại");
    }
    setOpenDropdown(null);
  };
  const handleToggleStatus = async (user: AdminUser) => {
    const newStatus = user.status === "active" ? "INACTIVE" : "ACTIVE";
    try {
      await adminService.updateUserStatus(user.email, newStatus as "ACTIVE" | "INACTIVE" | "NONE");
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus === "ACTIVE" ? "active" : "inactive" } : u));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Cập nhật thất bại");
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchSearch = searchQuery === "" || user.name.toLowerCase().includes(searchQuery.toLowerCase()) || user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = roleFilter === "all" || user.roleKey === roleFilter;
    return matchSearch && matchRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const pageTitle = filterRole === "STUDENT" ? "Học viên" : filterRole === "TEACHER" ? "Giảng viên" : "Tất cả người dùng";

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#4338ca" }} />
      <span style={{ marginLeft: "0.75rem", color: "#6b7280" }}>Đang tải người dùng...</span>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <AlertCircle className="w-10 h-10" style={{ color: "#ef4444" }} />
      <p style={{ color: "#374151" }}>{error}</p>
      <button onClick={fetchUsers} className="px-4 py-2 rounded-lg text-white text-sm" style={{ background: "#4338ca" }}>Thử lại</button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Title */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827", marginBottom: "0.5rem" }}>{pageTitle}</h1>
        </div>
        <div className="flex items-center gap-2" style={{ fontSize: "0.875rem", color: "#6b7280" }}>
          <span>Quản lý Người dùng</span>
          <ChevronRightIcon className="w-4 h-4" />
          <span style={{ color: "#4338ca", fontWeight: 600 }}>{pageTitle}</span>
        </div>
      </div>

      {/* View Toggle & Add Button */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode("list")} className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors" style={{ backgroundColor: viewMode === "list" ? "#4338ca" : "white", color: viewMode === "list" ? "white" : "#6b7280", border: "1px solid #e5e7eb", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600 }}>
            <List className="w-4 h-4" /> Dạng bảng
          </button>
          <button onClick={() => setViewMode("grid")} className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors" style={{ backgroundColor: viewMode === "grid" ? "#4338ca" : "white", color: viewMode === "grid" ? "white" : "#6b7280", border: "1px solid #e5e7eb", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600 }}>
            <Grid className="w-4 h-4" /> Dạng lưới
          </button>
        </div>
        {filterRole === "all" && (
          <button onClick={handleAddUser} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white transition-opacity hover:opacity-90" style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)", border: "none", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600 }}>
            <UserPlus className="w-4 h-4" /> Thêm mới
          </button>
        )}
      </div>

      {/* Filters & Controls */}
      <div className="rounded-xl p-4" style={{ backgroundColor: "white", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>Hiển thị</span>
            <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="px-3 py-2 rounded-lg text-sm outline-none cursor-pointer" style={{ backgroundColor: "#f3f4f6", border: "1px solid #e5e7eb", color: "#111827", fontWeight: 500 }}>
              <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
            </select>
            <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>mục</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {filterRole === "all" && (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" style={{ color: "#6b7280" }} />
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)} className="px-3 py-2 rounded-lg text-sm outline-none cursor-pointer" style={{ backgroundColor: "#f3f4f6", border: "1px solid #e5e7eb", color: "#111827", fontWeight: 500 }}>
                  <option value="all">Tất cả vai trò</option>
                  <option value="STUDENT">Học viên</option>
                  <option value="TEACHER">Giảng viên</option>
                </select>
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg min-w-[250px]" style={{ backgroundColor: "#f3f4f6", border: "1px solid #e5e7eb" }}>
              <Search className="w-4 h-4 shrink-0" style={{ color: "#9ca3af" }} />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Tìm kiếm..." className="flex-1 bg-transparent outline-none text-sm" style={{ color: "#111827" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === "list" ? (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "white", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "#334155", borderBottom: "1px solid #475569" }}>
                  {["Name", "EMAIL", "NGÀY THAM GIA", "ROLE", "STATUS", "ACTIONS"].map((h) => (
                    <th key={h} className="text-left px-6 py-4">
                      {h !== "ACTIONS" ? (
                        <button className="flex items-center gap-1.5 p-1 -ml-1 rounded hover:bg-slate-600 transition-colors" style={{ fontSize: "0.8125rem", fontWeight: 600, color: "white", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          {h} <ArrowUpDown className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "white", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          {h}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)" }}>
                          <span className="text-white text-sm font-semibold">{user.avatar}</span>
                        </div>
                        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#111827" }}>{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span style={{ fontSize: "0.875rem", color: "#6b7280" }}>{user.email}</span></td>
                    <td className="px-6 py-4"><span style={{ fontSize: "0.875rem", color: "#6b7280" }}>{user.joinedDate}</span></td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs" style={{ backgroundColor: user.role === "Giảng viên" ? "#fdf2f8" : "#eef2ff", color: user.role === "Giảng viên" ? "#db2777" : "#4338ca", fontWeight: 600 }}>{user.role}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs" style={{ backgroundColor: user.status === "active" ? "#ecfdf5" : "#fef2f2", color: user.status === "active" ? "#059669" : "#dc2626", fontWeight: 600, cursor: "pointer" }} onClick={() => handleToggleStatus(user)}>
                        {user.status === "active" ? "Hoạt động" : "Ngưng"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleViewUser(user)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Xem chi tiết"><Eye className="w-4 h-4" style={{ color: "#4338ca" }} /></button>
                        <button onClick={() => handleEditUser(user)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Chỉnh sửa"><Edit2 className="w-4 h-4" style={{ color: "#6b7280" }} /></button>
                        <button onClick={() => handleDeleteUser(user.id)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Xóa"><Trash2 className="w-4 h-4" style={{ color: "#dc2626" }} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
              Hiển thị {(currentPage - 1) * itemsPerPage + 1} – {Math.min(currentPage * itemsPerPage, filteredUsers.length)} trong tổng số {filteredUsers.length} người dùng
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-4 h-4" style={{ color: "#6b7280" }} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button key={page} onClick={() => setCurrentPage(page)} className="w-8 h-8 rounded-lg transition-colors" style={{ backgroundColor: currentPage === page ? "#4338ca" : "transparent", color: currentPage === page ? "white" : "#6b7280", fontWeight: currentPage === page ? 600 : 500, fontSize: "0.875rem" }}>{page}</button>
              ))}
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="w-4 h-4" style={{ color: "#6b7280" }} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {paginatedUsers.map((user) => (
            <div key={user.id} className="rounded-xl p-6 relative" style={{ backgroundColor: "white", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div className="absolute top-4 right-4 relative">
                <button onClick={() => setOpenDropdown(openDropdown === user.id ? null : user.id)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <MoreVertical className="w-4 h-4" style={{ color: "#6b7280" }} />
                </button>
                {openDropdown === user.id && (
                  <div className="absolute right-0 top-full mt-2 w-40 rounded-lg shadow-lg overflow-hidden z-10" style={{ backgroundColor: "#2d3748", border: "1px solid #4a5568" }}>
                    <button onClick={() => { handleEditUser(user); setOpenDropdown(null); }} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-700 transition-colors" style={{ backgroundColor: "transparent", border: "none", color: "white", fontSize: "0.875rem", cursor: "pointer" }}>
                      <Edit2 className="w-4 h-4" /> Chỉnh sửa
                    </button>
                    <button onClick={() => handleDeleteUser(user.id)} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-700 transition-colors" style={{ backgroundColor: "transparent", border: "none", color: "#fc8181", fontSize: "0.875rem", cursor: "pointer" }}>
                      <Trash2 className="w-4 h-4" /> Xóa
                    </button>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center text-center mb-4">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-3" style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)" }}>
                  <span className="text-white text-2xl font-bold">{user.avatar}</span>
                </div>
                <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#111827", marginBottom: "0.25rem" }}>{user.name}</h3>
                <p style={{ fontSize: "0.8125rem", color: "#6b7280" }}>{user.role}</p>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: "0.8125rem", color: "#6b7280" }}>Giới tính:</span>
                  <span style={{ fontSize: "0.8125rem", color: "#111827", fontWeight: 500 }}>{user.gender === "Male" ? "Nam" : user.gender === "Female" ? "Nữ" : "Khác"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: "0.8125rem", color: "#6b7280" }}>SĐT:</span>
                  <span style={{ fontSize: "0.8125rem", color: "#111827", fontWeight: 500 }}>{user.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: "0.8125rem", color: "#6b7280" }}>Địa chỉ:</span>
                  <span style={{ fontSize: "0.8125rem", color: "#111827", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Hà Nội, VN</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: "0.8125rem", color: "#6b7280" }}>Email:</span>
                  <span style={{ fontSize: "0.8125rem", color: "#111827", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</span>
                </div>
              </div>
              <button onClick={() => handleViewUser(user)} className="w-full py-2 rounded-lg transition-colors hover:bg-indigo-50" style={{ border: "1px solid #4338ca", color: "#4338ca", backgroundColor: "transparent", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600 }}>
                Xem chi tiết
              </button>
            </div>
          ))}
        </div>
      )}

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
