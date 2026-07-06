import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Users, Loader2, GraduationCap, X, Map, CheckCircle } from "lucide-react";
import { subjectService } from "../../services/subject.service";
import { classroomService } from "../../services/classroom.service";
import { adminService } from "../../services/admin.service";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import type { AdminUserResponse } from "../../services/admin.service";
import type { Subject } from "../../types/subject";
import type { ClassroomResponse } from "../../types/classroom";
import type { ClassroomSubjectResponse } from "../../types/classroomSubject";
import { toast } from "sonner";
import { LearningPathManager } from "../../components/learningPath/LearningPathManager";

export function SubjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const subjectId = Number(id);

  // Subject and classroom data
  const [subject, setSubject] = useState<Subject | null>(null);
  const [classroomSubjects, setClassroomSubjects] = useState<ClassroomSubjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  // Modal "Thêm lớp" (gán môn này vào 1 lớp active có sẵn)
  const [showAddClass, setShowAddClass] = useState(false);
  const [allClassrooms, setAllClassrooms] = useState<ClassroomResponse[]>([]);
  const [teachers, setTeachers] = useState<AdminUserResponse[]>([]);
  const [newClassId, setNewClassId] = useState(0);
  const [newClassLecturerId, setNewClassLecturerId] = useState(0);
  const [addClassLoading, setAddClassLoading] = useState(false);
  const [addClassError, setAddClassError] = useState<string | null>(null);

  // Fetch all core page data
  const fetchData = useCallback(async () => {
    if (!subjectId) return;
    try {
      setLoading(true);
      setError(null);
      const [subj, classes] = await Promise.all([
        subjectService.getById(subjectId),
        classroomService.getClassroomsBySubject(subjectId),
      ]);
      setSubject(subj);
      setClassroomSubjects(classes);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Không tải được dữ liệu môn học");
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Danh mục lớp active + giảng viên cho modal "Thêm lớp"
  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const [cls, users] = await Promise.all([
          classroomService.getAll(),
          adminService.getAllUsers(),
        ]);
        setAllClassrooms(cls);
        setTeachers(users.filter((u) => u.roles?.includes("TEACHER")));
      } catch (e) {
        console.error("Lỗi tải danh mục lớp/giảng viên:", e);
      }
    };
    loadCatalog();
  }, []);

  const handlePublish = async () => {
    if (!subject) return;
    try {
      setPublishing(true);
      const updated = await subjectService.publish(subject.subjectId);
      setSubject((prev) => (prev ? { ...prev, status: updated.status } : prev));
      toast.success("Đã xuất bản môn học");
    } catch (err: any) {
      toast.error(err.message || "Xuất bản thất bại");
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!subject) return;
    try {
      setPublishing(true);
      const updated = await subjectService.unpublish(subject.subjectId);
      setSubject((prev) => (prev ? { ...prev, status: updated.status } : prev));
      toast.success("Đã chuyển môn học về bản nháp");
    } catch (err: any) {
      toast.error(err.message || "Thao tác thất bại");
    } finally {
      setPublishing(false);
    }
  };

  const handleAddClass = async () => {
    if (!newClassId || !newClassLecturerId) {
      setAddClassError("Vui lòng chọn lớp và giảng viên.");
      return;
    }
    try {
      setAddClassLoading(true);
      setAddClassError(null);
      const created = await classroomService.addSubject(newClassId, {
        subjectId,
        lecturerId: newClassLecturerId,
      });
      setClassroomSubjects((prev) => [...prev, created]);
      setShowAddClass(false);
      setNewClassId(0);
      setNewClassLecturerId(0);
    } catch (err: any) {
      setAddClassError(err.message || "Thêm lớp thất bại");
    } finally {
      setAddClassLoading(false);
    }
  };

  const totalStudents = classroomSubjects.reduce((sum, cs) => sum + cs.studentCount, 0);
  const enrolledClassroomIds = new Set(classroomSubjects.map((cs) => cs.classroomId));
  const availableClassrooms = allClassrooms.filter(
    (c) => c.status === "active" && !enrolledClassroomIds.has(c.classroomId)
  );

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <span className="ml-3 text-sm text-muted-foreground">Đang tải môn học...</span>
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
      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-lg">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {subject?.subjectCode} — {subject?.subjectName}
            </h1>
            {subject?.status && (
              <Badge variant="outline" className="px-2.5 py-1 rounded-full text-xs font-semibold border-transparent"
                style={subject.status === "published"
                  ? { backgroundColor: "#d1fae5", color: "#065f46" }
                  : { backgroundColor: "#fef3c7", color: "#92400e" }}>
                {subject.status === "published" ? "Đã xuất bản" : "Bản nháp"}
              </Badge>
            )}
          </div>
          {subject?.description && (
            <p className="text-sm text-muted-foreground">{subject.description}</p>
          )}
        </div>
        {/* Stats */}
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="outline" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border-transparent"
            style={{ backgroundColor: "#eef2ff", color: "#3730a3" }}>
            <GraduationCap className="w-4 h-4" />
            {classroomSubjects.length} lớp học
          </Badge>
          <Badge variant="outline" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border-transparent"
            style={{ backgroundColor: "#f0fdf4", color: "#166534" }}>
            <Users className="w-4 h-4" />
            {totalStudents} học sinh
          </Badge>
          {subject && (subject.status === "published" ? (
            <Button onClick={handleUnpublish} disabled={publishing} variant="outline" className="gap-1.5">
              {publishing && <Loader2 className="w-4 h-4 animate-spin" />} Gỡ xuất bản
            </Button>
          ) : (
            <Button onClick={handlePublish} disabled={publishing} className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white border-transparent">
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Xuất bản
            </Button>
          ))}
        </div>
      </div>

      {/* Classrooms List Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-foreground" />
              <h2 className="text-lg font-bold text-foreground">
                Lớp đang học môn này ({classroomSubjects.length})
              </h2>
            </div>
            <Button onClick={() => { setShowAddClass(true); setNewClassId(0); setNewClassLecturerId(0); setAddClassError(null); }} className="gap-2">
              <Plus className="w-4 h-4" /> Thêm lớp
            </Button>
          </div>

          {classroomSubjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <GraduationCap className="w-12 h-12 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Chưa có lớp nào học môn này</p>
              <Button onClick={() => { setShowAddClass(true); setNewClassId(0); setNewClassLecturerId(0); setAddClassError(null); }} className="gap-2">
                <Plus className="w-4 h-4" /> Thêm lớp
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {classroomSubjects.map((cs) => (
                <div
                  key={cs.classroomSubjectId}
                  className="p-4 rounded-xl border border-border hover:shadow-md transition-all bg-card text-card-foreground flex flex-col justify-between"
                >
                  <div className="space-y-1.5 mb-4">
                    <span className="font-bold text-foreground text-base block">
                      {cs.className}
                    </span>
                    <div className="text-xs truncate text-muted-foreground" title={cs.lecturerName}>
                      GV: {cs.lecturerName}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Users className="w-4 h-4" />
                      <span>{cs.studentCount} học sinh</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate(`/admin/classes/${cs.classroomId}/subjects/${cs.classroomSubjectId}`)}
                    className="w-full"
                    variant="default"
                  >
                    Vào lớp-môn
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Learning path (single differentiated path) */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2 pl-1">
          <Map className="w-5 h-5 text-foreground" />
          Thiết kế lộ trình học tập
        </h2>
        <LearningPathManager subjectId={subjectId} />
      </div>

      {/* MODAL THÊM LỚP */}
      {showAddClass && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddClass(false)}>
          <div className="rounded-xl w-full max-w-md overflow-hidden border bg-background text-foreground shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Thêm lớp vào môn này</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowAddClass(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {addClassError && (
                <div className="px-4 py-3 rounded-lg text-sm bg-destructive/10 border border-destructive/20 text-destructive">{addClassError}</div>
              )}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">Lớp (đang hoạt động) *</label>
                <select
                  value={newClassId}
                  onChange={(e) => setNewClassId(Number(e.target.value))}
                  className="flex h-9 w-full rounded-md border border-input bg-input-background px-3 py-1 text-sm shadow-sm transition-colors cursor-pointer outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] text-foreground"
                >
                  <option value={0} disabled>-- Chọn lớp --</option>
                  {availableClassrooms.length === 0 ? (
                    <option value={0} disabled>(Không còn lớp đang hoạt động nào chưa học môn này)</option>
                  ) : availableClassrooms.map((c) => (
                    <option key={c.classroomId} value={c.classroomId}>{c.className}{c.semester ? ` · ${c.semester}` : ""}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">Giảng viên phụ trách *</label>
                <select
                  value={newClassLecturerId}
                  onChange={(e) => setNewClassLecturerId(Number(e.target.value))}
                  className="flex h-9 w-full rounded-md border border-input bg-input-background px-3 py-1 text-sm shadow-sm transition-colors cursor-pointer outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] text-foreground"
                >
                  <option value={0} disabled>-- Chọn giảng viên --</option>
                  {teachers.map((t) => (
                    <option key={t.userId} value={t.userId}>{t.firstName} {t.lastName} ({t.email})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t">
              <Button variant="outline" onClick={() => setShowAddClass(false)}>Hủy</Button>
              <Button onClick={handleAddClass} disabled={addClassLoading || !newClassId || !newClassLecturerId} className="gap-2">
                {addClassLoading && <Loader2 className="w-4 h-4 animate-spin" />} Thêm vào môn
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
