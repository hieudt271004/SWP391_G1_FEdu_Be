import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Users, Loader2, GraduationCap, X, Map, CheckCircle } from "lucide-react";
import { subjectService } from "../../services/subject.service";
import { classroomService } from "../../services/classroom.service";
import { adminService } from "../../services/admin.service";
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

  const isSubjectPublished = subject?.status === "published";

  const totalStudents = classroomSubjects.reduce((sum, cs) => sum + cs.studentCount, 0);
  const enrolledClassroomIds = new Set(classroomSubjects.map((cs) => cs.classroomId));
  const availableClassrooms = allClassrooms.filter(
    (c) => c.status === "active" && !enrolledClassroomIds.has(c.classroomId)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" style={{ color: "#6b7280" }} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>
              {subject?.subjectCode} — {subject?.subjectName}
            </h1>
            {subject?.status && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                style={subject.status === "published"
                  ? { backgroundColor: "#d1fae5", color: "#065f46" }
                  : { backgroundColor: "#fef3c7", color: "#92400e" }}>
                {subject.status === "published" ? "Đã xuất bản" : "Bản nháp"}
              </span>
            )}
          </div>
          {subject?.description && (
            <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>{subject.description}</p>
          )}
        </div>
        {/* Stats */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg"
            style={{ backgroundColor: "#eef2ff", fontSize: "0.875rem", color: "#4338ca", fontWeight: 600 }}>
            <GraduationCap className="w-4 h-4" />
            {classroomSubjects.length} lớp học
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg"
            style={{ backgroundColor: "#f0fdf4", fontSize: "0.875rem", color: "#15803d", fontWeight: 600 }}>
            <Users className="w-4 h-4" />
            {totalStudents} học sinh
          </div>
          {subject && (subject.status === "published" ? (
            <button onClick={handleUnpublish} disabled={publishing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-55 disabled:opacity-50"
              style={{ border: "1px solid #e5e7eb", backgroundColor: "white", color: "#374151", cursor: publishing ? "not-allowed" : "pointer" }}>
              {publishing && <Loader2 className="w-4 h-4 animate-spin" />} Gỡ xuất bản
            </button>
          ) : (
            <button onClick={handlePublish} disabled={publishing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "#059669", border: "none", cursor: publishing ? "not-allowed" : "pointer" }}>
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Xuất bản
            </button>
          ))}
        </div>
      </div>

      {/* Classrooms List Section */}
      <div className="rounded-xl p-6 bg-white border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900">
              Lớp đang học môn này ({classroomSubjects.length})
            </h2>
          </div>
          <button
            onClick={() => { setShowAddClass(true); setNewClassId(0); setNewClassLecturerId(0); setAddClassError(null); }}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-white transition-opacity hover:opacity-90 font-semibold"
            style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)", border: "none", cursor: "pointer" }}
          >
            <Plus className="w-4 h-4" /> Thêm lớp
          </button>
        </div>

        {classroomSubjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <GraduationCap className="w-12 h-12 text-gray-300" />
            <p className="text-sm text-gray-500">Chưa có lớp nào học môn này</p>
            <button
              onClick={() => { setShowAddClass(true); setNewClassId(0); setNewClassLecturerId(0); setAddClassError(null); }}
              className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm text-white font-semibold"
              style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)", border: "none", cursor: "pointer" }}
            >
              <Plus className="w-4 h-4" /> Thêm lớp
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {classroomSubjects.map((cs) => (
              <div
                key={cs.classroomSubjectId}
                className="p-4 rounded-xl border border-gray-200 hover:shadow-md transition-all bg-white"
              >
                <div className="mb-2">
                  <span className="font-bold text-gray-900 text-base">
                    {cs.className}
                  </span>
                </div>
                <div className="text-xs mb-3 truncate text-gray-400" title={cs.lecturerName}>
                  GV: {cs.lecturerName}
                </div>
                <div className="flex items-center gap-2 mb-4 text-gray-500 text-sm">
                  <Users className="w-4 h-4 text-gray-450" />
                  <span>{cs.studentCount} học sinh</span>
                </div>
                <button
                  onClick={() => navigate(`/admin/classes/${cs.classroomId}/subjects/${cs.classroomSubjectId}`)}
                  className="w-full py-2 rounded-lg text-white text-sm font-semibold transition-opacity hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #334155, #111827)", border: "none", cursor: "pointer" }}
                >
                  Vào lớp-môn
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Learning path (single differentiated path) */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 pl-1">
          <Map className="w-5 h-5 text-indigo-600" />
          Thiết kế lộ trình học tập
        </h2>
        <LearningPathManager subjectId={subjectId} />
      </div>

      {/* MODAL THÊM LỚP */}
      {showAddClass && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowAddClass(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-150">
              <h2 className="text-lg font-bold text-gray-900">Thêm lớp vào môn này</h2>
              <button onClick={() => setShowAddClass(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-4">
              {addClassError && (
                <div className="px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>{addClassError}</div>
              )}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Lớp (đang hoạt động) *</label>
                <select
                  value={newClassId}
                  onChange={(e) => setNewClassId(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value={0} disabled>-- Chọn lớp --</option>
                  {availableClassrooms.length === 0 ? (
                    <option value={0} disabled>(Không còn lớp đang hoạt động nào chưa học môn này)</option>
                  ) : availableClassrooms.map((c) => (
                    <option key={c.classroomId} value={c.classroomId}>{c.className}{c.semester ? ` · ${c.semester}` : ""}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Giảng viên phụ trách *</label>
                <select
                  value={newClassLecturerId}
                  onChange={(e) => setNewClassLecturerId(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value={0} disabled>-- Chọn giảng viên --</option>
                  {teachers.map((t) => (
                    <option key={t.userId} value={t.userId}>{t.firstName} {t.lastName} ({t.email})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-gray-100">
              <button onClick={() => setShowAddClass(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50">Hủy</button>
              <button onClick={handleAddClass} disabled={addClassLoading || !newClassId || !newClassLecturerId}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)" }}>
                {addClassLoading && <Loader2 className="w-4 h-4 animate-spin" />} Thêm vào môn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE TEMPLATE MODAL */}
    </div>
  );
}
