import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Plus, Edit2, Trash2, MoreVertical, Eye, ChevronLeft, ChevronRight, List, Grid, ChevronRight as ChevronRightIcon, ArrowUpDown, Loader2, AlertCircle } from "lucide-react";
import { subjectService } from "../../services/subject.service";
import { classroomService } from "../../services/classroom.service";
import type { Subject } from "../../types/subject";
import type { ClassroomResponse } from "../../types/classroom";
import { SubjectEditModal } from "./SubjectEditModal";

// Map Subject (BE) → AdminCourse (display)
interface AdminCourse {
  id: number;
  title: string;
  code: string;
  instructor: string;
  status: "draft" | "published";
  thumbnail: string;
  students: number;
  category: string;
  description: string;
  activeClasses: number;
}

function subjectToAdminCourse(s: Subject, classroomsOfSubject: ClassroomResponse[] = []): AdminCourse {
  const initials = s.subjectCode?.slice(0, 2).toUpperCase() || "SC";
  const studentCount = classroomsOfSubject.reduce((sum, c) => sum + c.studentCount, 0);
  const activeClassesCount = classroomsOfSubject.length;
  return {
    id: s.subjectId,
    title: s.subjectName,
    code: s.subjectCode,
    instructor: s.createdBy ? `${s.createdBy.firstName} ${s.createdBy.lastName}` : "—",
    status: (s.status === "published" || s.status === "draft") ? s.status : (activeClassesCount > 0 ? "published" : "draft"),
    thumbnail: initials,
    students: studentCount,
    category: "Môn học",
    description: s.description || "",
    activeClasses: activeClassesCount,
  };
}

type ViewMode = "list" | "grid";
type SortField = "title" | "code" | "instructor" | "students" | "status";
type SortOrder = "asc" | "desc";

const sortMap: Record<string, SortField> = {
  "MÔN HỌC": "title",
  "GIẢNG VIÊN": "instructor",
  "HỌC VIÊN": "students",
  "TRẠNG THÁI": "status"
};

export function SubjectManagementPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [sortField, setSortField] = useState<SortField>("title");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<AdminCourse | null>(null);

  const fetchSubjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const subjectsData = await subjectService.getAll();
      // 1 lớp có thể nhiều môn → lấy lớp của từng môn qua API classroom-subject
      const classesPerSubject = await Promise.all(
        subjectsData.map((s) => classroomService.getBySubject(s.subjectId).catch(() => [] as ClassroomResponse[]))
      );
      setCourses(subjectsData.map((s, i) => subjectToAdminCourse(s, classesPerSubject[i])));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Không tải được danh sách môn học");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSubjects(); }, [fetchSubjects]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const handleDelete = async (id: number) => {
    const course = courses.find(c => c.id === id);
    if (!course) return;

    let confirmMsg = "Xác nhận xóa môn học này?";
    if (course.activeClasses > 0) {
      confirmMsg = `CẢNH BÁO: Môn học này hiện đang có ${course.activeClasses} lớp học đang hoạt động và ${course.students} học viên! Việc xóa môn học có thể làm ảnh hưởng hoặc mất mát dữ liệu lớp học liên quan.\n\nBạn có chắc chắn VẪN MUỐN XÓA môn học này không?`;
    }

    if (!confirm(confirmMsg)) return;
    try {
      await subjectService.delete(id);
      setCourses(prev => prev.filter(c => c.id !== id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Xóa thất bại");
    }
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = searchQuery === "" ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.category.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === "all" || course.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedCourses = [...filteredCourses].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortOrder === "asc"
        ? aValue.localeCompare(bValue, "vi")
        : bValue.localeCompare(aValue, "vi");
    }
    // Number columns (students, activeClasses, id)
    return sortOrder === "asc"
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  const paginatedCourses = sortedCourses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#030213" }} />
      <span style={{ marginLeft: "0.75rem", color: "#717182", fontFamily: "Outfit, sans-serif" }}>Đang tải môn học...</span>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ fontFamily: "Outfit, sans-serif" }}>
      <AlertCircle className="w-10 h-10" style={{ color: "#dc2626" }} />
      <p style={{ color: "#000000" }}>{error}</p>
      <button onClick={fetchSubjects} className="px-4 py-2 text-white text-sm hover:bg-[#1c1b2d] transition-colors border-none cursor-pointer" style={{ backgroundColor: "#030213", borderRadius: "6px", fontWeight: 600 }}>Thử lại</button>
    </div>
  );

  return (
    <div className="space-y-6" style={{ fontFamily: "Outfit, sans-serif" }}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#030213" }}>Tất cả môn học</h1>
        <div className="flex items-center gap-2" style={{ fontSize: "0.875rem", color: "#717182" }}>
          <span>Quản lý Môn học</span><ChevronRightIcon className="w-4 h-4" />
          <span style={{ color: "#030213", fontWeight: 600 }}>Tất cả môn học</span>
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
        <button onClick={() => navigate('/admin/subjects/add')} className="flex items-center gap-2 px-4 py-2.5 text-white transition-colors hover:bg-[#1c1b2d] border-none cursor-pointer" style={{ backgroundColor: "#030213", borderRadius: "6px", fontSize: "0.875rem", fontWeight: 600 }}>
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
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" style={{ color: "#717182" }} />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm outline-none cursor-pointer" style={{ backgroundColor: "#ececf0", border: "none", borderRadius: "6px", color: "#000000", fontWeight: 500 }}>
                <option value="all">Tất cả trạng thái</option>
                <option value="draft">Bản nháp</option>
                <option value="published">Đã xuất bản</option>
              </select>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 min-w-[250px]" style={{ backgroundColor: "#ececf0", border: "none", borderRadius: "6px" }}>
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
                  {["MÔN HỌC", "GIẢNG VIÊN", "HỌC VIÊN", "TRẠNG THÁI", "HÀNH ĐỘNG"].map((h) => {
                    const field = sortMap[h];
                    const isSorted = field === sortField;
                    return (
                      <th 
                        key={h} 
                        className={`text-left px-6 py-4 border-none bg-transparent ${field ? "cursor-pointer select-none hover:bg-[#1c1b2d] transition-colors" : ""}`}
                        onClick={() => field && handleSort(field)}
                      >
                        <span className="flex items-center gap-1" style={{ fontSize: "0.8125rem", fontWeight: 600, color: "white", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          {h} 
                          {field && (
                            <ArrowUpDown 
                              className="w-3.5 h-3.5 inline" 
                              style={{ 
                                color: isSorted ? "white" : "#717182",
                                transform: isSorted && sortOrder === "desc" ? "rotate(180deg)" : "none",
                                transition: "transform 0.2s"
                              }} 
                            />
                          )}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {paginatedCourses.map((course, index) => (
                  <tr key={course.id} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.1)" }}>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 flex items-center justify-center shrink-0" style={{ backgroundColor: "#030213", borderRadius: "6px" }}>
                          <span className="text-white" style={{ fontSize: "0.875rem", fontWeight: 700 }}>{course.thumbnail}</span>
                        </div>
                        <div>
                          <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#030213", marginBottom: "0.125rem" }}>{course.title}</div>
                          <div style={{ fontSize: "0.8125rem", color: "#717182" }}>{course.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5"><span style={{ fontSize: "0.9375rem", color: "#717182" }}>{course.instructor}</span></td>
                    <td className="px-6 py-5">
                      <div style={{ fontSize: "0.9375rem", color: "#717182" }}>{course.students > 0 ? `${course.students} học viên` : "—"}</div>
                      <div style={{ fontSize: "0.8125rem", color: "#717182" }}>{course.activeClasses > 0 ? `${course.activeClasses} lớp đang hoạt động` : "Chưa có lớp học"}</div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: course.status === "published" ? "#d1fae5" : "#fef3c7", color: course.status === "published" ? "#065f46" : "#b45309", borderRadius: "6px" }}>
                        {course.status === "published" ? "Xuất bản" : "Nháp"}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => navigate(`/admin/subjects/${course.id}`)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors border-none bg-transparent cursor-pointer" title="Xem"><Eye className="w-4 h-4" style={{ color: "#030213" }} /></button>
                        <button onClick={() => { setSelectedCourse(course); setEditModalOpen(true); }} className="p-2 rounded-lg hover:bg-gray-100 transition-colors border-none bg-transparent cursor-pointer" title="Chỉnh sửa"><Edit2 className="w-4 h-4" style={{ color: "#717182" }} /></button>
                        <button onClick={() => handleDelete(course.id)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors border-none bg-transparent cursor-pointer" title="Xóa"><Trash2 className="w-4 h-4" style={{ color: "#991b1b" }} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-5" style={{ borderTop: "1px solid rgba(0, 0, 0, 0.1)" }}>
            <div style={{ fontSize: "0.9375rem", color: "#717182" }}>
              Hiển thị {(currentPage - 1) * itemsPerPage + 1} – {Math.min(currentPage * itemsPerPage, filteredCourses.length)} trong tổng số {filteredCourses.length} môn học
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 transition-colors border-none bg-transparent cursor-pointer hover:bg-gray-100" style={{ border: "1px solid rgba(0, 0, 0, 0.1)", borderRadius: "6px" }}>
                <ChevronLeft className="w-4 h-4" style={{ color: "#717182" }} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button key={page} onClick={() => setCurrentPage(page)} className="w-9 h-9 transition-colors border-none cursor-pointer" style={{ backgroundColor: currentPage === page ? "#030213" : "transparent", color: currentPage === page ? "white" : "#717182", fontWeight: currentPage === page ? 600 : 500, fontSize: "0.875rem", border: currentPage === page ? "none" : "1px solid rgba(0, 0, 0, 0.1)", borderRadius: "6px" }}>{page}</button>
              ))}
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 transition-colors border-none bg-transparent cursor-pointer hover:bg-gray-100" style={{ border: "1px solid rgba(0, 0, 0, 0.1)", borderRadius: "6px" }}>
                <ChevronRight className="w-4 h-4" style={{ color: "#717182" }} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedCourses.map((course) => (
            <div key={course.id} className="relative overflow-hidden transition-all hover:bg-gray-50" style={{ backgroundColor: "white", border: "1px solid rgba(0, 0, 0, 0.1)", borderRadius: "10px" }}>
              <div className="w-full h-36 flex items-center justify-center" style={{ backgroundColor: "#030213", borderTopLeftRadius: "10px", borderTopRightRadius: "10px" }}>
                <span className="text-white" style={{ fontSize: "2.5rem", fontWeight: 700 }}>{course.thumbnail}</span>
              </div>
              <div className="dropdown-container absolute top-4 right-4">
                <button onClick={() => setOpenDropdown(openDropdown === course.id ? null : course.id)} className="p-1.5 rounded-lg border-none cursor-pointer" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                  <MoreVertical className="w-4 h-4" style={{ color: "white" }} />
                </button>
                {openDropdown === course.id && (
                  <div className="absolute right-0 top-full mt-2 w-40 overflow-hidden z-10" style={{ backgroundColor: "#030213", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "6px" }}>
                    <button onClick={() => { setSelectedCourse(course); setEditModalOpen(true); setOpenDropdown(null); }} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-[#1c1b2d] transition-colors" style={{ backgroundColor: "transparent", border: "none", color: "white", fontSize: "0.875rem", cursor: "pointer" }}>
                      <Edit2 className="w-4 h-4" /> Chỉnh sửa
                    </button>
                    <button onClick={() => { handleDelete(course.id); setOpenDropdown(null); }} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-[#1c1b2d] transition-colors" style={{ backgroundColor: "transparent", border: "none", color: "#fca5a5", fontSize: "0.875rem", cursor: "pointer" }}>
                      <Trash2 className="w-4 h-4" /> Xóa
                    </button>
                  </div>
                )}
              </div>
              <div className="p-5">
                <span className="px-2.5 py-1 inline-block mb-3 text-xs font-semibold" style={{ backgroundColor: "#ececf0", color: "#030213", borderRadius: "6px" }}>{course.category}</span>
                <h3 style={{ fontSize: "1.0625rem", fontWeight: 600, color: "#030213", marginBottom: "0.5rem", lineHeight: 1.4 }}>{course.title}</h3>
                <p style={{ fontSize: "0.9375rem", color: "#717182", marginBottom: "1rem" }}>{course.instructor}</p>
                <div className="flex flex-col gap-2 mb-4">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 shrink-0 text-[#717182]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span style={{ fontSize: "0.875rem", color: "#717182" }}>
                      {course.students > 0 ? `${course.students} học viên` : "Chưa có học viên"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 shrink-0 text-[#717182]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span style={{ fontSize: "0.875rem", color: "#717182" }}>
                      {course.activeClasses > 0 ? `${course.activeClasses} lớp hoạt động` : "Chưa có lớp học"}
                    </span>
                  </div>
                </div>
                <div className="mb-4 flex items-center justify-between">
                  <span className="px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: course.status === "published" ? "#d1fae5" : "#fef3c7", color: course.status === "published" ? "#065f46" : "#b45309", borderRadius: "6px" }}>
                    {course.status === "published" ? "Xuất bản" : "Nháp"}
                  </span>
                </div>
                <button onClick={() => navigate(`/admin/subjects/${course.id}`)} className="w-full py-2.5 transition-colors hover:bg-gray-100" style={{ border: "1px solid #030213", backgroundColor: "white", fontSize: "0.9375rem", color: "#030213", fontWeight: 600, cursor: "pointer", borderRadius: "6px" }}>
                  Xem chi tiết
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <SubjectEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        course={selectedCourse}
        onSuccess={fetchSubjects}
      />
    </div>
  );
}