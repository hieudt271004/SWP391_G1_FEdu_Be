import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Plus, Edit2, Trash2, MoreVertical, Eye, ChevronLeft, ChevronRight, List, Grid, ChevronRight as ChevronRightIcon, ArrowUpDown, Loader2, AlertCircle, ArrowUp, ArrowDown } from "lucide-react";
import { subjectService } from "../../services/subject.service";
import { classroomService } from "../../services/classroom.service";
import type { Subject } from "../../types/subject";
import type { ClassroomSubjectResponse } from "../../types/classroomSubject";
import { SubjectEditModal } from "./SubjectEditModal";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { useConfirm } from "../../context/ConfirmContext";
import { toast } from "sonner";

// Map Subject (BE) → AdminCourse (display)
interface AdminCourse {
  id: number;
  title: string;
  code: string;
  instructor: string;
  students: number;
  activeClasses: number;
  status: "published" | "draft";
  description: string;
  thumbnail: string;
}

function subjectToRecord(s: Subject, classMap: Record<number, ClassroomSubjectResponse[]>): AdminCourse {
  const codeInitials = (s.subjectCode || "SB").slice(0, 2).toUpperCase();
  const linkedClasses = classMap[s.subjectId] || [];
  
  // Calculate students count
  const studentsCount = linkedClasses.reduce((sum, c) => sum + (c.studentCount || 0), 0);
  
  // Calculate active classes count
  const activeClassesCount = linkedClasses.length;

  return {
    id: s.subjectId,
    title: s.subjectName || "",
    code: s.subjectCode || "",
    instructor: linkedClasses.length > 0 ? `${linkedClasses.length} lớp được mở` : "Chưa mở lớp",
    students: studentsCount,
    activeClasses: activeClassesCount,
    status: s.status === "active" ? "published" : "draft",
    description: s.description || "",
    thumbnail: codeInitials,
  };
}

type ViewMode = "list" | "grid";

export function SubjectManagementPage() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedCourse, setSelectedCourse] = useState<AdminCourse | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [sortField, setSortField] = useState<"code" | "title" | "classes" | "students" | "status" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const fetchSubjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all subjects
      const subjects = await subjectService.getAll();
      
      // Get linked classrooms per subject
      const classMap: Record<number, ClassroomSubjectResponse[]> = {};
      await Promise.all(
        subjects.map(async (s) => {
          try {
            const classes = await classroomService.getClassroomsBySubject(s.subjectId);
            classMap[s.subjectId] = classes;
          } catch {
            classMap[s.subjectId] = [];
          }
        })
      );

      setCourses(subjects.map(s => subjectToRecord(s, classMap)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Không tải được danh sách môn học");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  // Handle clicking outside to close dropdowns
  useEffect(() => {
    function handleClickOutside() {
      setOpenDropdown(null);
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

    const isConfirmed = await confirm({
      title: "Xác nhận xóa môn học",
      message: confirmMsg,
      confirmText: "Xóa",
      cancelText: "Hủy",
      type: "danger"
    });

    if (!isConfirmed) return;
    try {
      await subjectService.delete(id);
      setCourses(prev => prev.filter(c => c.id !== id));
      toast.success(`Đã xóa môn học "${course.title}" thành công.`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Xóa thất bại");
    }
  };

  const handleSort = (field: "code" | "title" | "classes" | "students" | "status") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: "code" | "title" | "classes" | "students" | "status") => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 opacity-40 shrink-0" />;
    }
    return sortDirection === "asc" 
      ? <ArrowUp className="w-3.5 h-3.5 text-primary-foreground shrink-0" />
      : <ArrowDown className="w-3.5 h-3.5 text-primary-foreground shrink-0" />;
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = searchQuery === "" ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || course.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedCourses = [...filteredCourses].sort((a, b) => {
    if (!sortField) return 0;
    
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];
    
    if (sortField === "classes") {
      aVal = parseInt(a.instructor) || 0;
      bVal = parseInt(b.instructor) || 0;
    }
    
    if (typeof aVal === "string") {
      return sortDirection === "asc" 
        ? aVal.localeCompare(bVal) 
        : bVal.localeCompare(aVal);
    }
    
    return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
  });

  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  const paginatedCourses = sortedCourses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-2">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground">Đang tải môn học...</span>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <AlertCircle className="w-10 h-10 text-destructive" />
      <p className="font-semibold text-sm text-foreground">{error}</p>
      <Button onClick={fetchSubjects}>Thử lại</Button>
    </div>
  );

  const getStatusBadge = (status: AdminCourse["status"]) => {
    switch (status) {
      case "published":
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent font-semibold">
            Đã xuất bản
          </Badge>
        );
      case "draft":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-transparent font-semibold">
            Nháp
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 text-foreground bg-background">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Tất cả môn học</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Quản lý Môn học</span>
          <ChevronRightIcon className="w-4 h-4 text-muted-foreground/60" />
          <span className="text-foreground font-semibold">Tất cả môn học</span>
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
              {mode === "list" ? (
                <><List className="w-4 h-4" /> Dạng bảng</>
              ) : (
                <><Grid className="w-4 h-4" /> Dạng lưới</>
              )}
            </Button>
          ))}
        </div>
        <Button onClick={() => navigate('/admin/subjects/add')} className="gap-2 h-9 text-xs font-semibold">
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
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
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
                <option value="published">Đã xuất bản</option>
                <option value="draft">Bản nháp</option>
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
                    onClick={() => handleSort("code")}
                  >
                    <span className="flex items-center gap-1 text-[11px] font-bold text-primary-foreground uppercase tracking-wider">
                      MÃ MÔN {getSortIcon("code")}
                    </span>
                  </th>
                  <th 
                    className="text-left px-6 py-4 cursor-pointer select-none hover:bg-primary-dark transition-colors"
                    onClick={() => handleSort("title")}
                  >
                    <span className="flex items-center gap-1 text-[11px] font-bold text-primary-foreground uppercase tracking-wider">
                      TÊN MÔN HỌC {getSortIcon("title")}
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
                {paginatedCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-accent/40 transition-colors">
                    <td className="px-6 py-4.5">
                      <span className="text-sm font-semibold text-foreground">{course.code}</span>
                    </td>
                    <td className="px-6 py-4.5">
                      <div className="text-sm font-semibold text-foreground">{course.title}</div>
                      <div className="text-xs text-muted-foreground max-w-[300px] truncate mt-0.5">{course.description}</div>
                    </td>
                    <td className="px-6 py-4.5">
                      <span className="text-sm text-muted-foreground">
                        {course.students > 0 ? `${course.students} học viên` : "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4.5">
                      {getStatusBadge(course.status)}
                    </td>
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-foreground hover:bg-accent"
                          onClick={() => navigate(`/admin/subjects/${course.id}`)}
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:bg-accent"
                          onClick={() => { setSelectedCourse(course); setEditModalOpen(true); }}
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(course.id)}
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-5 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Hiển thị {(currentPage - 1) * itemsPerPage + 1} – {Math.min(currentPage * itemsPerPage, filteredCourses.length)} trong tổng số {filteredCourses.length} môn học
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
            {paginatedCourses.map((course) => (
              <div key={course.id} className="relative overflow-hidden transition-all bg-card text-card-foreground border border-border rounded-xl shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-full h-36 flex items-center justify-center bg-primary text-primary-foreground border-b border-border">
                    <span className="text-4xl font-bold">{course.thumbnail}</span>
                  </div>
                  <div className="dropdown-container absolute top-4 right-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setOpenDropdown(openDropdown === course.id ? null : course.id)}
                      className="h-8 w-8 text-white hover:bg-white/20"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                    {openDropdown === course.id && (
                      <div className="absolute right-0 top-full mt-2 w-40 overflow-hidden z-10 bg-popover text-popover-foreground border border-border rounded-lg shadow-lg">
                        <button
                          onClick={() => { setSelectedCourse(course); setEditModalOpen(true); setOpenDropdown(null); }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-accent text-xs font-medium text-foreground transition-colors border-none bg-transparent cursor-pointer text-left"
                        >
                          <Edit2 className="w-4 h-4" /> Chỉnh sửa
                        </button>
                        <button
                          onClick={() => { handleDelete(course.id); setOpenDropdown(null); }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-destructive/10 text-xs font-medium text-destructive transition-colors border-none bg-transparent cursor-pointer text-left"
                        >
                          <Trash2 className="w-4 h-4" /> Xóa
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <span className="px-2.5 py-0.5 inline-block mb-3 text-[10px] font-bold uppercase tracking-wider bg-secondary text-secondary-foreground border border-border rounded-md">{course.title}</span>
                    <h3 className="text-base font-bold text-foreground mb-1 leading-snug">{course.code}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{course.instructor}</p>
                    <div className="flex flex-col gap-2 mb-4">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <svg className="w-4 h-4 shrink-0 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>
                          {course.students > 0 ? `${course.students} học viên` : "Chưa có học viên"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <svg className="w-4 h-4 shrink-0 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span>
                          {course.activeClasses > 0 ? `${course.activeClasses} lớp hoạt động` : "Chưa có lớp học"}
                        </span>
                      </div>
                    </div>
                    <div className="mb-4">
                      {getStatusBadge(course.status)}
                    </div>
                  </div>
                </div>
                <div className="px-5 pb-5">
                  <Button variant="outline" onClick={() => navigate(`/admin/subjects/${course.id}`)} className="w-full text-xs font-semibold py-1.5">
                    Xem chi tiết
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="bg-card text-card-foreground border border-border rounded-xl mt-6">
            <div className="flex items-center justify-between px-6 py-5">
              <div className="text-sm text-muted-foreground">
                Hiển thị {(currentPage - 1) * itemsPerPage + 1} – {Math.min(currentPage * itemsPerPage, filteredCourses.length)} trong tổng số {filteredCourses.length} môn học
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

      {/* Edit Modal */}
      <SubjectEditModal
        isOpen={editModalOpen}
        onClose={() => { setSelectedCourse(null); setEditModalOpen(false); }}
        onSuccess={fetchSubjects}
        subject={selectedCourse}
      />
    </div>
  );
}
