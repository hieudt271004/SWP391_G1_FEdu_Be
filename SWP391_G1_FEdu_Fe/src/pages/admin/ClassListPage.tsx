import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Plus, Edit2, Trash2, Eye, ChevronLeft, ChevronRight, List, Grid, ChevronRight as ChevronRightIcon, ArrowUpDown, Loader2, AlertCircle, MoreVertical } from "lucide-react";
import { classroomService } from "../../services/classroom.service";
import type { ClassroomResponse } from "../../types/classroom";

// Map ClassroomResponse (BE) → ClassRecord (display)
interface ClassRecord {
  id: number;
  className: string;
  courseName: string;
  instructor: string;
  students: number;
  status: "active" | "inactive" | "completed";
  thumbnail: string;
}

function classroomToRecord(c: ClassroomResponse): ClassRecord {
  const initials = (c.subjectCode || c.subjectName || "CL").slice(0, 2).toUpperCase();
  return {
    id: c.classroomId,
    className: c.className,
    courseName: c.subjectName || c.subjectCode || "—",
    instructor: c.lecturerFirstName
      ? `${c.lecturerFirstName} ${c.lecturerLastName}`
      : (c.lecturerName || "—"),
    students: c.studentCount,
    status: c.studentCount > 0 ? "active" : "inactive",
    thumbnail: initials,
  };
}

type ViewMode = "list" | "grid";

export function ClassListPage() {
  const navigate = useNavigate();
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
    if (!confirm("Xác nhận xóa lớp học này?")) return;
    try {
      await classroomService.delete(id);
      setClasses(prev => prev.filter(c => c.id !== id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Xóa thất bại");
    }
  };

  const filteredClasses = classes.filter((c) => {
    const matchSearch = searchQuery === "" || c.className.toLowerCase().includes(searchQuery.toLowerCase()) || c.courseName.toLowerCase().includes(searchQuery.toLowerCase()) || c.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);
  const paginatedClasses = filteredClasses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#4338ca" }} />
      <span style={{ marginLeft: "0.75rem", color: "#6b7280" }}>Đang tải lớp học...</span>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <AlertCircle className="w-10 h-10" style={{ color: "#ef4444" }} />
      <p style={{ color: "#374151" }}>{error}</p>
      <button onClick={fetchClassrooms} className="px-4 py-2 rounded-lg text-white text-sm" style={{ background: "#4338ca" }}>Thử lại</button>
    </div>
  );

  const getStatusBadge = (status: ClassRecord["status"]) => {
    switch (status) {
      case "active": return { label: "Đang hoạt động", bg: "#d1fae5", color: "#065f46" };
      case "inactive": return { label: "Chưa bắt đầu", bg: "#fef3c7", color: "#92400e" };
      case "completed": return { label: "Đã hoàn thành", bg: "#e0e7ff", color: "#3730a3" };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>Tất cả lớp học</h1>
        <div className="flex items-center gap-2" style={{ fontSize: "0.875rem", color: "#6b7280" }}>
          <span>Quản lý Lớp học</span><ChevronRightIcon className="w-4 h-4" />
          <span style={{ color: "#4338ca", fontWeight: 600 }}>Tất cả lớp học</span>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          {(["list", "grid"] as ViewMode[]).map((mode) => (
            <button key={mode} onClick={() => setViewMode(mode)} className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors" style={{ backgroundColor: viewMode === mode ? "#4338ca" : "white", color: viewMode === mode ? "white" : "#6b7280", border: "1px solid #e5e7eb", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600 }}>
              {mode === "list" ? <><List className="w-4 h-4" />Dạng bảng</> : <><Grid className="w-4 h-4" />Dạng lưới</>}
            </button>
          ))}
        </div>
        <button onClick={() => navigate('/admin/classes/add')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white transition-opacity hover:opacity-90" style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)", border: "none", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600 }}>
          <Plus className="w-4 h-4" /> Thêm mới
        </button>
      </div>

      {/* Filters */}
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
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" style={{ color: "#6b7280" }} />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="px-3 py-2 rounded-lg text-sm outline-none cursor-pointer" style={{ backgroundColor: "#f3f4f6", border: "1px solid #e5e7eb", color: "#111827", fontWeight: 500 }}>
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Chưa bắt đầu</option>
                <option value="completed">Đã hoàn thành</option>
              </select>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg min-w-[250px]" style={{ backgroundColor: "#f3f4f6", border: "1px solid #e5e7eb" }}>
              <Search className="w-4 h-4 shrink-0" style={{ color: "#9ca3af" }} />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Tìm kiếm..." className="flex-1 bg-transparent outline-none text-sm" style={{ color: "#111827" }} />
            </div>
          </div>
        </div>
      </div>

      {/* List View */}
      {viewMode === "list" && (
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "#334155", borderBottom: "1px solid #475569" }}>
                  {["TÊN LỚP", "THUỘC KHÓA HỌC", "GIẢNG VIÊN", "HỌC VIÊN", "TRẠNG THÁI", "HÀNH ĐỘNG"].map((h) => (
                    <th key={h} className="text-left px-6 py-4">
                      <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "white", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {h} {h !== "HÀNH ĐỘNG" && <ArrowUpDown className="w-3.5 h-3.5 inline ml-1" />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedClasses.map((c, index) => {
                  const statusInfo = getStatusBadge(c.status);
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: index < paginatedClasses.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "#5b21b6" }}>
                            <span className="text-white" style={{ fontSize: "0.875rem", fontWeight: 700 }}>{c.thumbnail}</span>
                          </div>
                          <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#111827" }}>{c.className}</div>
                        </div>
                      </td>
                      <td className="px-6 py-5"><span style={{ fontSize: "0.9375rem", color: "#6b7280" }}>{c.courseName}</span></td>
                      <td className="px-6 py-5"><span style={{ fontSize: "0.9375rem", color: "#6b7280" }}>{c.instructor}</span></td>
                      <td className="px-6 py-5"><span style={{ fontSize: "0.9375rem", color: "#6b7280" }}>{c.students > 0 ? `${c.students} học viên` : "—"}</span></td>
                      <td className="px-6 py-5">
                        <span className="px-3 py-1.5 rounded-md" style={{ backgroundColor: statusInfo.bg, color: statusInfo.color, fontSize: "0.8125rem", fontWeight: 600 }}>{statusInfo.label}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => navigate(`/admin/classes/${c.id}`)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Xem"><Eye className="w-4 h-4" style={{ color: "#4338ca" }} /></button>
                          <button onClick={() => navigate(`/admin/classes/${c.id}/edit`)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Chỉnh sửa"><Edit2 className="w-4 h-4" style={{ color: "#6b7280" }} /></button>
                          <button onClick={() => handleDelete(c.id)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Xóa"><Trash2 className="w-4 h-4" style={{ color: "#ef4444" }} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-6 py-5" style={{ borderTop: "1px solid #f3f4f6" }}>
            <div style={{ fontSize: "0.9375rem", color: "#6b7280" }}>
              Hiển thị {(currentPage - 1) * itemsPerPage + 1} – {Math.min(currentPage * itemsPerPage, filteredClasses.length)} trong tổng số {filteredClasses.length} lớp học
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed" style={{ border: "1px solid #e5e7eb" }}><ChevronLeft className="w-4 h-4" style={{ color: "#6b7280" }} /></button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button key={page} onClick={() => setCurrentPage(page)} className="w-9 h-9 rounded-lg" style={{ backgroundColor: currentPage === page ? "#5b21b6" : "transparent", color: currentPage === page ? "white" : "#6b7280", fontWeight: currentPage === page ? 600 : 500, fontSize: "0.875rem", border: currentPage === page ? "none" : "1px solid #e5e7eb" }}>{page}</button>
              ))}
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed" style={{ border: "1px solid #e5e7eb" }}><ChevronRight className="w-4 h-4" style={{ color: "#6b7280" }} /></button>
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
                <div key={c.id} className="relative rounded-2xl overflow-hidden transition-all hover:shadow-lg" style={{ backgroundColor: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                  <div className="w-full h-36 flex items-center justify-center rounded-t-2xl" style={{ backgroundColor: "#5b21b6" }}>
                    <span className="text-white" style={{ fontSize: "2.5rem", fontWeight: 700 }}>{c.thumbnail}</span>
                  </div>
                  
                  <div className="absolute top-4 right-4" ref={dropdownRef}>
                    <button onClick={() => setOpenDropdown(openDropdown === c.id ? null : c.id)} className="p-1.5 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                      <MoreVertical className="w-4 h-4" style={{ color: "white" }} />
                    </button>
                    {openDropdown === c.id && (
                      <div className="absolute right-0 top-full mt-2 w-40 rounded-lg shadow-lg overflow-hidden z-10" style={{ backgroundColor: "#2d3748", border: "1px solid #4a5568" }}>
                        <button onClick={() => { navigate(`/admin/classes/${c.id}`); setOpenDropdown(null); }} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-700 transition-colors" style={{ backgroundColor: "transparent", border: "none", color: "white", fontSize: "0.875rem", cursor: "pointer" }}>
                          <Eye className="w-4 h-4" /> Xem chi tiết
                        </button>
                        <button onClick={() => { navigate(`/admin/classes/${c.id}/edit`); setOpenDropdown(null); }} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-700 transition-colors" style={{ backgroundColor: "transparent", border: "none", color: "white", fontSize: "0.875rem", cursor: "pointer" }}>
                          <Edit2 className="w-4 h-4" /> Chỉnh sửa
                        </button>
                        <button onClick={() => setOpenDropdown(null)} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-700 transition-colors" style={{ backgroundColor: "transparent", border: "none", color: "#fc8181", fontSize: "0.875rem", cursor: "pointer" }}>
                          <Trash2 className="w-4 h-4" /> Xóa
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-5">
                    <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#111827", marginBottom: "0.5rem" }}>{c.className}</h3>
                    <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.75rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.courseName}</p>
                    
                    <div className="flex flex-col gap-2 mb-4">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 shrink-0" style={{ color: "#6b7280" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span style={{ fontSize: "0.875rem", color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {c.instructor}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 shrink-0" style={{ color: "#6b7280" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                          {c.students > 0 ? `${c.students} học viên` : "Chưa có học viên"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <span className="px-3 py-1 rounded-md inline-block" style={{ backgroundColor: statusInfo.bg, color: statusInfo.color, fontSize: "0.75rem", fontWeight: 600 }}>{statusInfo.label}</span>
                    </div>
                    <button onClick={() => navigate(`/admin/classes/${c.id}`)} className="w-full py-2.5 rounded-xl transition-colors hover:bg-indigo-50" style={{ border: "1px solid #5b21b6", backgroundColor: "white", fontSize: "0.9375rem", color: "#5b21b6", fontWeight: 600, cursor: "pointer" }}>
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-5 rounded-2xl" style={{ backgroundColor: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: "0.9375rem", color: "#6b7280" }}>
              Hiển thị {(currentPage - 1) * itemsPerPage + 1} – {Math.min(currentPage * itemsPerPage, filteredClasses.length)} trong tổng số {filteredClasses.length} lớp học
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed" style={{ border: "1px solid #e5e7eb" }}><ChevronLeft className="w-4 h-4" style={{ color: "#6b7280" }} /></button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button key={page} onClick={() => setCurrentPage(page)} className="w-9 h-9 rounded-lg" style={{ backgroundColor: currentPage === page ? "#5b21b6" : "transparent", color: currentPage === page ? "white" : "#6b7280", fontWeight: currentPage === page ? 600 : 500, fontSize: "0.875rem", border: currentPage === page ? "none" : "1px solid #e5e7eb" }}>{page}</button>
              ))}
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed" style={{ border: "1px solid #e5e7eb" }}><ChevronRight className="w-4 h-4" style={{ color: "#6b7280" }} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
