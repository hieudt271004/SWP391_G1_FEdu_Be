import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Plus, Edit2, Trash2, Eye, ChevronLeft, ChevronRight, List, Grid, ChevronRight as ChevronRightIcon, ArrowUpDown, Loader2, AlertCircle, MoreVertical, ArrowUp, ArrowDown } from "lucide-react";
import { classroomService } from "../../services/classroom.service";
import type { ClassroomResponse } from "../../types/classroom";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { useConfirm } from "../../context/ConfirmContext";
import { toast } from "sonner";

// Map ClassroomResponse (BE) → ClassRecord (display)
interface ClassRecord {
  id: number;
  className: string;
  courseName: string;
  students: number;
  status: "active" | "inactive" | "completed";
  thumbnail: string;
}

function classroomToRecord(c: ClassroomResponse): ClassRecord {
  const initials = (c.className || "CL").slice(0, 2).toUpperCase();
  return {
    id: c.classroomId,
    className: c.className,
    courseName: `${c.subjectCount ?? 0} môn học`,
    students: c.studentCount,
    status: (c.status as ClassRecord["status"]) || (c.studentCount > 0 ? "active" : "inactive"),
    thumbnail: initials,
  };
}

type ViewMode = "list" | "grid";

export function ClassListPage() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "completed">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [sortField, setSortField] = useState<"className" | "subjects" | "students" | "status" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchClassrooms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await classroomService.getAll();
      setClasses(data.map(classroomToRecord));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Không tải được danh sách lớp học");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClassrooms(); }, [fetchClassrooms]);

  const handleDelete = async (id: number) => {
    const classRec = classes.find(c => c.id === id);
    const className = classRec ? ` "${classRec.className}"` : "";
    
    const isConfirmed = await confirm({
      title: "Xác nhận xóa lớp học",
      message: `Bạn có chắc chắn muốn xóa lớp học${className}? Hành động này sẽ xóa vĩnh viễn lớp học và các liên kết liên quan.`,
      confirmText: "Xóa",
      cancelText: "Hủy",
      type: "danger"
    });

    if (!isConfirmed) return;
    try {
      await classroomService.delete(id);
      setClasses(prev => prev.filter(c => c.id !== id));
      toast.success(`Đã xóa lớp học${className} thành công.`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Xóa thất bại");
    }
  };

  const handleSort = (field: "className" | "subjects" | "students" | "status") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: "className" | "subjects" | "students" | "status") => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 opacity-40 shrink-0" />;
    }
    return sortDirection === "asc" 
      ? <ArrowUp className="w-3.5 h-3.5 text-primary-foreground shrink-0" />
      : <ArrowDown className="w-3.5 h-3.5 text-primary-foreground shrink-0" />;
  };

  const filteredClasses = classes.filter((c) => {
    const matchSearch = searchQuery === "" || c.className.toLowerCase().includes(searchQuery.toLowerCase()) || c.courseName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const sortedClasses = [...filteredClasses].sort((a, b) => {
    if (!sortField) return 0;
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];
    if (sortField === "subjects") {
      aVal = parseInt(a.courseName) || 0;
      bVal = parseInt(b.courseName) || 0;
    }
    if (typeof aVal === "string") {
      return sortDirection === "asc" 
        ? aVal.localeCompare(bVal) 
        : bVal.localeCompare(aVal);
    }
    return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
  });

  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);
  const paginatedClasses = sortedClasses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-2">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground">Đang tải lớp học...</span>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-foreground">
      <AlertCircle className="w-10 h-10 text-destructive" />
      <p className="font-semibold text-sm">{error}</p>
      <Button onClick={fetchClassrooms}>Thử lại</Button>
    </div>
  );

  const getStatusBadge = (status: ClassRecord["status"]) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent font-semibold">
            Đang hoạt động
          </Badge>
        );
      case "inactive":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-transparent font-semibold">
            Chưa bắt đầu
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-transparent font-semibold">
            Đã hoàn thành
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 text-foreground bg-background">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Tất cả lớp học</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Quản lý Lớp học</span><ChevronRightIcon className="w-4 h-4" />
          <span className="text-foreground font-semibold">Tất cả lớp học</span>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          {(["list", "grid"] as ViewMode[]).map((mode) => (
            <Button
              key={mode}
              variant={viewMode === mode ? "default" : "outline"}
              onClick={() => setViewMode(mode)}
              className="gap-2 h-9 text-xs"
            >
              {mode === "list" ? <><List className="w-4 h-4" />Dạng bảng</> : <><Grid className="w-4 h-4" />Dạng lưới</>}
            </Button>
          ))}
        </div>
        <Button onClick={() => navigate('/admin/classes/add')} className="gap-2 h-9 text-xs font-semibold">
          <Plus className="w-4 h-4" /> Thêm mới
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-card text-card-foreground border border-border rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Hiển thị</span>
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="px-3 py-1.5 text-xs outline-none cursor-pointer bg-muted text-foreground border border-input rounded-md font-medium"
            >
              <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
            </select>
            <span className="text-sm text-muted-foreground">mục</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="px-3 py-1.5 text-xs outline-none cursor-pointer bg-muted text-foreground border border-input rounded-md font-medium"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Chưa bắt đầu</option>
                <option value="completed">Đã hoàn thành</option>
              </select>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted text-muted-foreground border border-input rounded-md min-w-[250px] focus-within:ring-2 focus-within:ring-ring focus-within:bg-background transition-all">
              <Search className="w-4 h-4 shrink-0 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm..."
                className="flex-1 bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </div>
      </div>

      {/* List View */}
      {viewMode === "list" && (
        <div className="overflow-hidden bg-card text-card-foreground border border-border rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-primary text-primary-foreground border-b border-border">
                  <th 
                    className="text-left px-6 py-4 cursor-pointer select-none hover:bg-primary-dark transition-colors"
                    onClick={() => handleSort("className")}
                  >
                    <span className="flex items-center gap-1 text-[11px] font-bold text-primary-foreground uppercase tracking-wider">
                      TÊN LỚP {getSortIcon("className")}
                    </span>
                  </th>
                  <th 
                    className="text-left px-6 py-4 cursor-pointer select-none hover:bg-primary-dark transition-colors"
                    onClick={() => handleSort("subjects")}
                  >
                    <span className="flex items-center gap-1 text-[11px] font-bold text-primary-foreground uppercase tracking-wider">
                      SỐ MÔN {getSortIcon("subjects")}
                    </span>
                  </th>
                  <th 
                    className="text-left px-6 py-4 cursor-pointer select-none hover:bg-primary-dark transition-colors"
                    onClick={() => handleSort("students")}
                  >
                    <span className="flex items-center gap-1 text-[11px] font-bold text-primary-foreground uppercase tracking-wider">
                      HỌC VIÊN {getSortIcon("students")}
                    </span>
                  </th>
                  <th 
                    className="text-left px-6 py-4 cursor-pointer select-none hover:bg-primary-dark transition-colors"
                    onClick={() => handleSort("status")}
                  >
                    <span className="flex items-center gap-1 text-[11px] font-bold text-primary-foreground uppercase tracking-wider">
                      TRẠNG THÁI {getSortIcon("status")}
                    </span>
                  </th>
                  <th className="text-left px-6 py-4">
                    <span className="flex items-center gap-1 text-[11px] font-bold text-primary-foreground uppercase tracking-wider">
                      HÀNH ĐỘNG
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedClasses.map((c) => {
                  return (
                    <tr key={c.id} className="hover:bg-accent/40 transition-colors">
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 flex items-center justify-center shrink-0 bg-primary text-primary-foreground rounded-lg font-bold text-xs">
                            {c.thumbnail}
                          </div>
                          <div className="text-sm font-semibold text-foreground">{c.className}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className="text-sm text-muted-foreground">{c.courseName}</span>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className="text-sm text-muted-foreground">{c.students > 0 ? `${c.students} học viên` : "—"}</span>
                      </td>
                      <td className="px-6 py-4.5">
                        {getStatusBadge(c.status)}
                      </td>
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-foreground hover:bg-accent"
                            onClick={() => navigate(`/admin/classes/${c.id}`)}
                            title="Xem"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:bg-accent"
                            onClick={() => navigate(`/admin/classes/${c.id}/edit`)}
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(c.id)}
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-6 py-5 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Hiển thị {(currentPage - 1) * itemsPerPage + 1} – {Math.min(currentPage * itemsPerPage, filteredClasses.length)} trong tổng số {filteredClasses.length} lớp học
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  onClick={() => setCurrentPage(page)}
                  className="w-9 h-9 text-xs"
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedClasses.map((c) => {
              return (
                <div key={c.id} className="relative overflow-hidden transition-all bg-card text-card-foreground border border-border rounded-xl shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="w-full h-36 flex items-center justify-center bg-primary text-primary-foreground border-b border-border">
                      <span className="text-4xl font-bold">{c.thumbnail}</span>
                    </div>
                    
                    <div className="absolute top-4 right-4" ref={dropdownRef}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setOpenDropdown(openDropdown === c.id ? null : c.id)}
                        className="h-8 w-8 text-white hover:bg-white/20"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                      {openDropdown === c.id && (
                        <div className="absolute right-0 top-full mt-2 w-40 overflow-hidden z-10 bg-popover text-popover-foreground border border-border rounded-lg shadow-lg">
                          <button
                            onClick={() => { navigate(`/admin/classes/${c.id}`); setOpenDropdown(null); }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-accent text-xs font-medium text-foreground transition-colors border-none bg-transparent cursor-pointer text-left"
                          >
                            <Eye className="w-4 h-4" /> Xem chi tiết
                          </button>
                          <button
                            onClick={() => { navigate(`/admin/classes/${c.id}/edit`); setOpenDropdown(null); }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-accent text-xs font-medium text-foreground transition-colors border-none bg-transparent cursor-pointer text-left"
                          >
                            <Edit2 className="w-4 h-4" /> Chỉnh sửa
                          </button>
                          <button
                            onClick={() => { handleDelete(c.id); setOpenDropdown(null); }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-destructive/10 text-xs font-medium text-destructive transition-colors border-none bg-transparent cursor-pointer text-left"
                          >
                            <Trash2 className="w-4 h-4" /> Xóa
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-5">
                      <h3 className="text-base font-bold text-foreground mb-1">{c.className}</h3>
                      <p className="text-xs text-muted-foreground mb-3 truncate">{c.courseName}</p>
                      
                      <div className="flex flex-col gap-2 mb-4">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <svg className="w-4 h-4 shrink-0 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span>
                            {c.students > 0 ? `${c.students} học viên` : "Chưa có học viên"}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        {getStatusBadge(c.status)}
                      </div>
                    </div>
                  </div>
                  <div className="px-5 pb-5">
                    <Button variant="outline" onClick={() => navigate(`/admin/classes/${c.id}`)} className="w-full text-xs font-semibold py-1.5">
                      Xem chi tiết
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Pagination */}
          <div className="bg-card text-card-foreground border border-border rounded-xl mt-6">
            <div className="flex items-center justify-between px-6 py-5">
              <div className="text-sm text-muted-foreground">
                Hiển thị {(currentPage - 1) * itemsPerPage + 1} – {Math.min(currentPage * itemsPerPage, filteredClasses.length)} trong tổng số {filteredClasses.length} lớp học
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    onClick={() => setCurrentPage(page)}
                    className="w-9 h-9 text-xs"
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
