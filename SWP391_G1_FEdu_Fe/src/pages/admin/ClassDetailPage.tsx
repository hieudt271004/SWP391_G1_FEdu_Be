import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Plus, X, Loader2, AlertCircle,
  Trash2, BookOpen, ChevronRight, Pencil,
} from "lucide-react";
import { classroomService } from "../../services/classroom.service";
import { subjectService } from "../../services/subject.service";
import { adminService } from "../../services/admin.service";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import type { ClassroomResponse } from "../../types/classroom";
import type { ClassroomSubjectResponse } from "../../types/classroomSubject";
import type { Subject } from "../../types/subject";
import type { AdminUserResponse } from "../../services/admin.service";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active": return { label: "Đang hoạt động", bg: "#d1fae5", color: "#065f46" };
    case "inactive": return { label: "Chưa bắt đầu", bg: "#fef3c7", color: "#92400e" };
    case "completed": return { label: "Đã hoàn thành", bg: "#e0e7ff", color: "#3730a3" };
    default: return { label: "Chưa bắt đầu", bg: "#fef3c7", color: "#92400e" };
  }
};

export function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const classroomId = Number(id);

  const [classroom, setClassroom] = useState<ClassroomResponse | null>(null);
  const [subjects, setSubjects] = useState<ClassroomSubjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Danh mục dùng cho modal
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<AdminUserResponse[]>([]);

  // Thêm môn vào lớp
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectId, setNewSubjectId] = useState(0);
  const [newLecturerId, setNewLecturerId] = useState(0);
  const [addSubjectLoading, setAddSubjectLoading] = useState(false);
  const [addSubjectError, setAddSubjectError] = useState<string | null>(null);

  // Đổi giảng viên inline
  const [editingLecturerCsId, setEditingLecturerCsId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    if (!classroomId) return;
    try {
      setLoading(true);
      setError(null);
      const [cr, cs] = await Promise.all([
        classroomService.getById(classroomId),
        classroomService.getSubjectsOfClassroom(classroomId),
      ]);
      setClassroom(cr);
      setSubjects(cs);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Không tải được dữ liệu lớp học");
    } finally {
      setLoading(false);
    }
  }, [classroomId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Tải danh mục subject + teacher cho các modal
  useEffect(() => {
    const load = async () => {
      try {
        const [subs, users] = await Promise.all([
          subjectService.getAll(),
          adminService.getAllUsers(),
        ]);
        setAllSubjects(subs);
        setTeachers(users.filter((u) => u.roles?.includes("TEACHER")));
      } catch (e) {
        console.error("Lỗi tải danh mục:", e);
      }
    };
    load();
  }, []);

  // Mở modal thêm môn nếu vừa tạo lớp xong (?addSubject=true)
  useEffect(() => {
    if (searchParams.get("addSubject") === "true") {
      setShowAddSubject(true);
      const p = new URLSearchParams(searchParams);
      p.delete("addSubject");
      navigate({ search: p.toString() }, { replace: true });
    }
  }, [searchParams, navigate]);

  const handleAddSubject = async () => {
    if (!newSubjectId || !newLecturerId) {
      setAddSubjectError("Vui lòng chọn môn và giảng viên.");
      return;
    }
    try {
      setAddSubjectLoading(true);
      setAddSubjectError(null);
      const created = await classroomService.addSubject(classroomId, {
        subjectId: newSubjectId,
        lecturerId: newLecturerId,
      });
      setSubjects((prev) => [...prev, created]);
      setShowAddSubject(false);
      setNewSubjectId(0);
      setNewLecturerId(0);
    } catch (e: unknown) {
      setAddSubjectError(e instanceof Error ? e.message : "Thêm môn thất bại");
    } finally {
      setAddSubjectLoading(false);
    }
  };

  const handleChangeLecturer = async (csId: number, lecturerId: number) => {
    try {
      const updated = await classroomService.changeLecturer(csId, { lecturerId });
      setSubjects((prev) => prev.map((s) => (s.classroomSubjectId === csId ? updated : s)));
      setEditingLecturerCsId(null);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Đổi giảng viên thất bại");
    }
  };

  const handleRemoveSubject = async (csId: number) => {
    if (!confirm("Gỡ môn này khỏi lớp? Toàn bộ sinh viên & lộ trình của lớp-môn sẽ bị xóa.")) return;
    try {
      await classroomService.removeSubject(csId);
      setSubjects((prev) => prev.filter((s) => s.classroomSubjectId !== csId));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Gỡ môn thất bại");
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!classroom) return;
    const actionText = newStatus === "active" ? "bắt đầu" : "kết thúc";
    if (!confirm(`Bạn có chắc chắn muốn ${actionText} lớp học này không?`)) return;
    try {
      setUpdatingStatus(true);
      await classroomService.update(classroomId, {
        className: classroom.className,
        semester: classroom.semester || "",
        description: classroom.description || "",
        status: newStatus,
      });
      setClassroom(await classroomService.getById(classroomId));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Cập nhật trạng thái thất bại");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <span className="ml-3 text-sm text-muted-foreground">Đang tải lớp học...</span>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <AlertCircle className="w-10 h-10 text-destructive" />
      <p className="text-sm text-muted-foreground">{error}</p>
      <Button onClick={fetchData} variant="outline">Thử lại</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-lg">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{classroom?.className}</h1>
              {classroom?.status && (() => {
                const badge = getStatusBadge(classroom.status);
                return (
                  <Badge variant="outline" className="px-2.5 py-1 rounded-full text-xs font-semibold border-transparent" style={{ backgroundColor: badge.bg, color: badge.color }}>
                    {badge.label}
                  </Badge>
                );
              })()}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {subjects.length} môn học{classroom?.semester ? ` · Học kỳ: ${classroom.semester}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {classroom?.status === "active" && (
            <Button onClick={() => handleUpdateStatus("completed")} disabled={updatingStatus} className="gap-1.5">
              {updatingStatus && <Loader2 className="w-4 h-4 animate-spin" />} Kết thúc lớp học
            </Button>
          )}
        </div>
      </div>

      {/* Danh sách lớp-môn */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-foreground">Các môn học của lớp</h2>
            <Button onClick={() => setShowAddSubject(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Thêm môn
            </Button>
          </div>

          {subjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <BookOpen className="w-12 h-12 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Lớp chưa có môn nào. Bấm "Thêm môn" để gán môn + giảng viên.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {subjects.map((cs) => (
                <div
                  key={cs.classroomSubjectId}
                  onClick={() => navigate(`/admin/classes/${classroomId}/subjects/${cs.classroomSubjectId}`)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border cursor-pointer hover:bg-accent hover:shadow-sm transition-all"
                  title="Mở chi tiết lớp-môn"
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-secondary text-foreground">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground">{cs.displayName}</div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <span>{cs.subjectName}</span>
                      <span>·</span>
                      {editingLecturerCsId === cs.classroomSubjectId ? (
                        <select
                          autoFocus
                          defaultValue={cs.lecturerId}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => { e.stopPropagation(); handleChangeLecturer(cs.classroomSubjectId, Number(e.target.value)); }}
                          onBlur={() => setEditingLecturerCsId(null)}
                          className="px-2 py-1 rounded border bg-background text-foreground text-xs focus:ring-1 focus:ring-ring outline-none"
                        >
                          {teachers.map((t) => (
                            <option key={t.userId} value={t.userId}>{t.firstName} {t.lastName} ({t.email})</option>
                          ))}
                        </select>
                      ) : (
                        <span className="flex items-center gap-1">
                          GV: {cs.lecturerName}
                          <button onClick={(e) => { e.stopPropagation(); setEditingLecturerCsId(cs.classroomSubjectId); }} className="p-0.5 rounded hover:bg-background border-none bg-transparent cursor-pointer" title="Đổi giảng viên">
                            <Pencil className="w-3 h-3 text-muted-foreground/60 hover:text-foreground" />
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-foreground bg-accent/25 border-border">
                    {cs.studentCount} SV
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                    onClick={(e) => { e.stopPropagation(); handleRemoveSubject(cs.classroomSubjectId); }}
                    title="Gỡ môn khỏi lớp"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <ChevronRight className="w-5 h-5 shrink-0 text-muted-foreground/50" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal thêm môn */}
      {showAddSubject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddSubject(false)}>
          <div className="rounded-xl w-full max-w-md overflow-hidden border bg-background text-foreground shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Thêm môn vào lớp</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowAddSubject(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {addSubjectError && (
                <div className="px-4 py-3 rounded-lg text-sm bg-destructive/10 border border-destructive/20 text-destructive">{addSubjectError}</div>
              )}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">Môn học <span className="text-destructive">*</span></label>
                <select value={newSubjectId} onChange={(e) => setNewSubjectId(Number(e.target.value))}
                  className="flex h-9 w-full rounded-md border border-input bg-input-background px-3 py-1 text-sm shadow-sm transition-colors cursor-pointer outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] text-foreground"
                >
                  <option value={0} disabled>-- Chọn môn học --</option>
                  {allSubjects
                    .filter((s) => !subjects.some((cs) => cs.subjectId === s.subjectId))
                    .map((s) => (<option key={s.subjectId} value={s.subjectId}>{s.subjectCode} - {s.subjectName}</option>))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">Giảng viên phụ trách <span className="text-destructive">*</span></label>
                <select value={newLecturerId} onChange={(e) => setNewLecturerId(Number(e.target.value))}
                  className="flex h-9 w-full rounded-md border border-input bg-input-background px-3 py-1 text-sm shadow-sm transition-colors cursor-pointer outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] text-foreground"
                >
                  <option value={0} disabled>-- Chọn giảng viên --</option>
                  {teachers.map((t) => (<option key={t.userId} value={t.userId}>{t.firstName} {t.lastName} ({t.email})</option>))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t">
              <Button variant="outline" onClick={() => setShowAddSubject(false)}>Hủy</Button>
              <Button onClick={handleAddSubject} disabled={addSubjectLoading || !newSubjectId || !newLecturerId} className="gap-2">
                {addSubjectLoading && <Loader2 className="w-4 h-4 animate-spin" />} Thêm môn
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
