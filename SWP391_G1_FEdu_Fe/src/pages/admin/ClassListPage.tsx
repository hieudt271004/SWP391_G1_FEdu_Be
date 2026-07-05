import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Plus, Edit2, Trash2, Eye, ChevronLeft, ChevronRight, List, Grid, ChevronRight as ChevronRightIcon, ArrowUpDown, Loader2, AlertCircle, MoreVertical } from "lucide-react";
import { classroomService } from "../../services/classroom.service";
import type { ClassroomResponse } from "../../types/classroom";
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

  const filteredClasses = classes.filter((c) => {
    const matchSearch = searchQuery === "" || c.className.toLowerCase().includes(searchQuery.toLowerCase()) || c.courseName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);
  const paginatedClasses = filteredClasses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#030213" }} />
      <span style={{ marginLeft: "0.75rem", color: "#717182", fontFamily: "Outfit, sans-serif" }}>Đang tải lớp học...</span>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ fontFamily: "Outfit, sans-serif" }}>
      <AlertCircle className="w-10 h-10" style={{ color: "#dc2626" }} />
      <p style={{ color: "#000000" }}>{error}</p>
      <button onClick={fetchClassrooms} className="px-4 py-2 text-white text-sm hover:bg-[#1c1b2d] transition-colors border-none cursor-pointer" style={{ backgroundColor: "#030213", borderRadius: "6px", fontWeight: 600 }}>Thử lại</button>
    </div>
  );

  const getStatusBadge = (status: ClassRecord["status"]) => {
    switch (status) {
      case "active": return { label: "Đang hoạt động", bg: "#d1fae5", color: "#065f46" };
      case "inactive": return { label: "Chưa bắt đầu", bg: "#fef3c7", color: "#b45309" };
      case "completed": return { label: "Đã hoàn thành", bg: "#e0f2fe", color: "#0369a1" };
    }
  };

  return (
    <div className="space-y-6" style={{ fontFamily: "Outfit, sans-serif" }}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#030213" }}>Tất cả lớp học</h1>
        <div className="flex items-center gap-2" style={{ fontSize: "0.875rem", color: "#717182" }}>
          <span>Quản lý Lớp học</span><ChevronRightIcon className="w-4 h-4" />
          <span style={{ color: "#030213", fontWeight: 600 }}>Tất cả lớp học</span>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          {(["list", "grid"] as ViewMode[]).map((mode) => (
            <button key={mode} onClick={() => setViewMode(mode)} className="flex items-center gap-2 px-4 py-2 transition-colors" style={{ backgroundColor: viewMode === mode ? "#030213" : "white", color: viewMode === mode ? "white" : "#717182", border: "1px solid rgba(0, 0, 0, 0.1)", borderRadius: "6px", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600 }}>
              {mode === "list" ? <><List className="w-4 h-4" />Dạng bảng</> : <><Grid className="w-4 h-4" />Dạng lưới</>}
            </button>
          ))}
        </div>
        <button onClick={() => navigate('/admin/classes/add')} className="flex items-center gap-2 px-4 py-2.5 text-white transition-colors hover:bg-[#1c1b2d] border-none cursor-pointer" style={{ backgroundColor: "#030213", borderRadius: "6px", fontSize: "0.875rem", fontWeight: 600 }}>
          <Plus className="w-4 h-4" /> Thêm mới
        </button>
      </div>

      {/* Filters */}
      <div style={{ backgroundColor: "white", border: "1px solid rgba(0, 0, 0, 0.1)", borderRadius: "10px", padding: "16px" }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: "0.875rem", color: "#717182" }}>Hiển thị</span>
            <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="px-3 py-2 text-sm outline-none cursor-pointer" style={{ backgroundColor: "#ececf0", border: "none", borderRadius: "6px", color: "#000000", fontWeight: 500 }}>
              <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
            </select>
            <span style={{ fontSize: "0.875rem", color: "#717182" }}>mục</span>
          </div>
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <Filter className="w-4 h-4" style={{ color: "#717182" }} />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="px-3 py-2 text-sm outline-none cursor-pointer" style={{ backgroundColor: "#ececf0", border: "none", borderRadius: "6px", color: "#000000", fontWeight: 500 }}>
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Chưa bắt đầu</option>
                <option value="completed">Đã hoàn thành</option>
              </select>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 min-w-[250px] shrink-0" style={{ backgroundColor: "#ececf0", border: "none", borderRadius: "6px" }}>
              <Search className="w-4 h-4 shrink-0" style={{ color: "#717182" }} />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Tìm kiếm..." className="flex-1 bg-transparent outline-none text-sm" style={{ color: "#000000" }} />
            </div>
          </div>
        </div>
      </div>

      {/* List View */}
      {viewMode === "list" && (
        <div className="overflow-hidden" style={{ backgroundColor: "white", border: "1px solid rgba(0, 0, 0, 0.1)", borderRadius: "10px" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "#030213", borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
                  {["TÊN LỚP", "SỐ MÔN", "HỌC VIÊN", "TRẠNG THÁI", "HÀNH ĐỘNG"].map((h) => (
                    <th key={h} className="text-left px-6 py-4">
                      <span className="flex items-center gap-1" style={{ fontSize: "0.8125rem", fontWeight: 600, color: "white", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {h} {h !== "HÀNH ĐỘNG" && <ArrowUpDown className="w-3.5 h-3.5 inline" />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedClasses.map((c, index) => {
                  const statusInfo = getStatusBadge(c.status);
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.1)" }}>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 flex items-center justify-center shrink-0" style={{ backgroundColor: "#030213", borderRadius: "6px" }}>
                            <span className="text-white" style={{ fontSize: "0.875rem", fontWeight: 700 }}>{c.thumbnail}</span>
                          </div>
                          <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#030213" }}>{c.className}</div>
                        </div>
                      </td>
                      <td className="px-6 py-5"><span style={{ fontSize: "0.9375rem", color: "#717182" }}>{c.courseName}</span></td>
                      <td className="px-6 py-5"><span style={{ fontSize: "0.9375rem", color: "#717182" }}>{c.students > 0 ? `${c.students} học viên` : "—"}</span></td>
                      <td className="px-6 py-5">
                        <span className="px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: statusInfo?.bg, color: statusInfo?.color, borderRadius: "6px" }}>{statusInfo?.label}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => navigate(`/admin/classes/${c.id}`)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors border-none bg-transparent cursor-pointer" title="Xem"><Eye className="w-4 h-4" style={{ color: "#030213" }} /></button>
                          <button onClick={() => navigate(`/admin/classes/${c.id}/edit`)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors border-none bg-transparent cursor-pointer" title="Chỉnh sửa"><Edit2 className="w-4 h-4" style={{ color: "#717182" }} /></button>
                          <button onClick={() => handleDelete(c.id)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors border-none bg-transparent cursor-pointer" title="Xóa"><Trash2 className="w-4 h-4" style={{ color: "#991b1b" }} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-6 py-5" style={{ borderTop: "1px solid rgba(0, 0, 0, 0.1)" }}>
            <div style={{ fontSize: "0.9375rem", color: "#717182" }}>
              Hiển thị {(currentPage - 1) * itemsPerPage + 1} – {Math.min(currentPage * itemsPerPage, filteredClasses.length)} trong tổng số {filteredClasses.length} lớp học
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 transition-colors border-none bg-transparent cursor-pointer hover:bg-gray-100" style={{ border: "1px solid rgba(0, 0, 0, 0.1)", borderRadius: "6px" }}><ChevronLeft className="w-4 h-4" style={{ color: "#717182" }} /></button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button key={page} onClick={() => setCurrentPage(page)} className="w-9 h-9 transition-colors border-none cursor-pointer" style={{ backgroundColor: currentPage === page ? "#030213" : "transparent", color: currentPage === page ? "white" : "#717182", fontWeight: currentPage === page ? 600 : 500, fontSize: "0.875rem", border: currentPage === page ? "none" : "1px solid rgba(0, 0, 0, 0.1)", borderRadius: "6px" }}>{page}</button>
              ))}
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 transition-colors border-none bg-transparent cursor-pointer hover:bg-gray-100" style={{ border: "1px solid rgba(0, 0, 0, 0.1)", borderRadius: "6px" }}><ChevronRight className="w-4 h-4" style={{ color: "#717182" }} /></button>
            </div>
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedClasses.map((c) => {
              const statusInfo = getStatusBadge(c.status);
              return (
                <div key={c.id} className="relative overflow-hidden transition-all hover:bg-gray-50" style={{ backgroundColor: "white", border: "1px solid rgba(0, 0, 0, 0.1)", borderRadius: "10px" }}>
                  <div className="w-full h-36 flex items-center justify-center" style={{ backgroundColor: "#030213", borderTopLeftRadius: "10px", borderTopRightRadius: "10px" }}>
                    <span className="text-white" style={{ fontSize: "2.5rem", fontWeight: 700 }}>{c.thumbnail}</span>
                  </div>
                  
                  <div className="absolute top-4 right-4" ref={dropdownRef}>
                    <button onClick={() => setOpenDropdown(openDropdown === c.id ? null : c.id)} className="p-1.5 rounded-lg border-none cursor-pointer" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                      <MoreVertical className="w-4 h-4" style={{ color: "white" }} />
                    </button>
                    {openDropdown === c.id && (
                      <div className="absolute right-0 top-full mt-2 w-40 overflow-hidden z-10" style={{ backgroundColor: "#030213", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "6px" }}>
                        <button onClick={() => { navigate(`/admin/classes/${c.id}`); setOpenDropdown(null); }} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-[#1c1b2d] transition-colors" style={{ backgroundColor: "transparent", border: "none", color: "white", fontSize: "0.875rem", cursor: "pointer" }}>
                          <Eye className="w-4 h-4" /> Xem chi tiết
                        </button>
                        <button onClick={() => { navigate(`/admin/classes/${c.id}/edit`); setOpenDropdown(null); }} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-[#1c1b2d] transition-colors" style={{ backgroundColor: "transparent", border: "none", color: "white", fontSize: "0.875rem", cursor: "pointer" }}>
                          <Edit2 className="w-4 h-4" /> Chỉnh sửa
                        </button>
                        <button onClick={() => setOpenDropdown(null)} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-[#1c1b2d] transition-colors" style={{ backgroundColor: "transparent", border: "none", color: "#fca5a5", fontSize: "0.875rem", cursor: "pointer" }}>
                          <Trash2 className="w-4 h-4" /> Xóa
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-5">
                    <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#030213", marginBottom: "0.5rem" }}>{c.className}</h3>
                    <p style={{ fontSize: "0.875rem", color: "#717182", marginBottom: "0.75rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.courseName}</p>
                    
                    <div className="flex flex-col gap-2 mb-4">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 shrink-0 text-[#717182]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span style={{ fontSize: "0.875rem", color: "#717182" }}>
                          {c.students > 0 ? `${c.students} học viên` : "Chưa có học viên"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <span className="px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: statusInfo?.bg, color: statusInfo?.color, borderRadius: "6px" }}>{statusInfo?.label}</span>
                    </div>
                    <button onClick={() => navigate(`/admin/classes/${c.id}`)} className="w-full py-2.5 transition-colors hover:bg-gray-100" style={{ border: "1px solid #030213", backgroundColor: "white", fontSize: "0.9375rem", color: "#030213", fontWeight: 600, cursor: "pointer", borderRadius: "6px" }}>
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Pagination */}
          <div className="overflow-hidden" style={{ backgroundColor: "white", border: "1px solid rgba(0, 0, 0, 0.1)", borderRadius: "10px" }}>
            <div className="flex items-center justify-between px-6 py-5">
              <div style={{ fontSize: "0.9375rem", color: "#717182" }}>
                Hiển thị {(currentPage - 1) * itemsPerPage + 1} – {Math.min(currentPage * itemsPerPage, filteredClasses.length)} trong tổng số {filteredClasses.length} lớp học
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 transition-colors border-none bg-transparent cursor-pointer hover:bg-gray-100" style={{ border: "1px solid rgba(0, 0, 0, 0.1)", borderRadius: "6px" }}><ChevronLeft className="w-4 h-4" style={{ color: "#717182" }} /></button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button key={page} onClick={() => setCurrentPage(page)} className="w-9 h-9 transition-colors border-none cursor-pointer" style={{ backgroundColor: currentPage === page ? "#030213" : "transparent", color: currentPage === page ? "white" : "#717182", fontWeight: currentPage === page ? 600 : 500, fontSize: "0.875rem", border: currentPage === page ? "none" : "1px solid rgba(0, 0, 0, 0.1)", borderRadius: "6px" }}>{page}</button>
                ))}
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 transition-colors border-none bg-transparent cursor-pointer hover:bg-gray-100" style={{ border: "1px solid rgba(0, 0, 0, 0.1)", borderRadius: "6px" }}><ChevronRight className="w-4 h-4" style={{ color: "#717182" }} /></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
