import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Plus, Edit2, Trash2, Users, Loader2,
  AlertCircle, BookOpen, GraduationCap,
} from "lucide-react";
import { subjectService } from "../../services/subject.service";
import { classroomService } from "../../services/classroom.service";
import type { Subject } from "../../types/subject";
import type { ClassroomResponse } from "../../types/classroom";

// Module lộ trình vẫn dùng mock (BE chưa có learning-path cho Subject level)
const mockModules = [
  { id: "1", title: "Module 1: Giới thiệu", description: "Tổng quan môn học, công cụ và môi trường" },
  { id: "2", title: "Module 2: Kiến thức nền", description: "Các khái niệm cốt lõi và lý thuyết cơ bản" },
  { id: "3", title: "Module 3: Thực hành", description: "Bài tập thực hành và project nhỏ" },
  { id: "4", title: "Module 4: Dự án", description: "Triển khai dự án cuối kỳ" },
];

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const subjectId = Number(id);

  const [subject, setSubject] = useState<Subject | null>(null);
  const [classrooms, setClassrooms] = useState<ClassroomResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!subjectId) return;
    try {
      setLoading(true);
      setError(null);
      const [subj, classes] = await Promise.all([
        subjectService.getById(subjectId),
        classroomService.getBySubject(subjectId),
      ]);
      setSubject(subj);
      setClassrooms(classes);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Không tải được dữ liệu khóa học");
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#4338ca" }} />
      <span style={{ marginLeft: "0.75rem", color: "#6b7280" }}>Đang tải khóa học...</span>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <AlertCircle className="w-10 h-10" style={{ color: "#ef4444" }} />
      <p style={{ color: "#374151" }}>{error}</p>
      <button
        onClick={fetchData}
        className="px-4 py-2 rounded-lg text-white text-sm"
        style={{ background: "#4338ca" }}
      >
        Thử lại
      </button>
    </div>
  );

  const totalStudents = classrooms.reduce((sum, c) => sum + c.studentCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <button
          onClick={() => navigate("/admin/courses")}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" style={{ color: "#6b7280" }} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827", marginBottom: "0.25rem" }}>
            {subject?.subjectCode} — {subject?.subjectName}
          </h1>
          {subject?.description && (
            <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>{subject.description}</p>
          )}
        </div>
        {/* Stats */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg"
            style={{ backgroundColor: "#eef2ff", fontSize: "0.875rem", color: "#4338ca", fontWeight: 600 }}>
            <GraduationCap className="w-4 h-4" />
            {classrooms.length} lớp học
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg"
            style={{ backgroundColor: "#f0fdf4", fontSize: "0.875rem", color: "#15803d", fontWeight: 600 }}>
            <Users className="w-4 h-4" />
            {totalStudents} học sinh
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Course Roadmap (mock – BE chưa có LP cho Subject) */}
        <div className="rounded-xl p-6" style={{ backgroundColor: "white", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" style={{ color: "#4338ca" }} />
              <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#111827" }}>
                Lộ trình Khóa học
              </h2>
            </div>
            <button
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-white transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)", border: "none", cursor: "pointer", fontSize: "0.8125rem", fontWeight: 600 }}
            >
              <Plus className="w-4 h-4" /> Thêm Module
            </button>
          </div>
          <div className="space-y-3">
            {mockModules.map((module, index) => (
              <div
                key={module.id}
                className="flex items-start gap-3 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                style={{ border: "1px solid #e5e7eb" }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: "#eef2ff", border: "2px solid #c7d2fe", color: "#4338ca", fontSize: "0.75rem", fontWeight: 700 }}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#111827", marginBottom: "0.25rem" }}>
                    {module.title}
                  </h3>
                  <p style={{ fontSize: "0.8125rem", color: "#6b7280", lineHeight: 1.5 }}>
                    {module.description}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button className="p-1.5 rounded hover:bg-gray-100 transition-colors" title="Chỉnh sửa">
                    <Edit2 className="w-4 h-4" style={{ color: "#6b7280" }} />
                  </button>
                  <button className="p-1.5 rounded hover:bg-red-50 transition-colors" title="Xóa">
                    <Trash2 className="w-4 h-4" style={{ color: "#dc2626" }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Instructor (createdBy = giảng viên phụ trách) */}
          <div className="rounded-xl p-6" style={{ backgroundColor: "white", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#111827", marginBottom: "1.5rem" }}>
              Giảng viên phụ trách
            </h2>
            <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors" style={{ border: "1px solid #e5e7eb" }}>
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)" }}
              >
                <span className="text-white text-lg font-bold">
                  {((subject?.createdBy?.firstName?.[0]) || (subject?.createdBy?.lastName?.[0]) || "A").toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#111827", marginBottom: "0.25rem" }}>
                  {subject?.createdBy ? `${subject.createdBy.firstName} ${subject.createdBy.lastName}` : "Quản trị viên"}
                </h3>
                <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: "#eef2ff", color: "#4338ca", fontWeight: 600 }}>Người tạo khóa học</span>
              </div>
            </div>
          </div>

          {/* Active Classrooms (real API) */}
          <div className="rounded-xl p-6" style={{ backgroundColor: "white", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" style={{ color: "#7c3aed" }} />
              <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#111827" }}>
                Lớp học ({classrooms.length})
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/admin/classes")}
                className="px-3 py-2 rounded-lg text-sm transition-colors hover:bg-indigo-50"
                style={{ border: "1px solid #c7d2fe", color: "#4338ca", fontWeight: 600, cursor: "pointer", backgroundColor: "white" }}
              >
                Xem tất cả
              </button>
              <button
                onClick={() => navigate(`/admin/classes/add?subjectId=${subjectId}`)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-white transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)", border: "none", cursor: "pointer", fontWeight: 600 }}
              >
                <Plus className="w-4 h-4" /> Thêm lớp
              </button>
            </div>
          </div>

          {classrooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <GraduationCap className="w-12 h-12" style={{ color: "#d1d5db" }} />
              <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>Chưa có lớp học nào</p>
              <button
                onClick={() => navigate(`/admin/classes/add?subjectId=${subjectId}`)}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm text-white"
                style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)", border: "none", cursor: "pointer", fontWeight: 600 }}
              >
                <Plus className="w-4 h-4" /> Tạo lớp học
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {classrooms.map((c) => {
                const lecturerName = c.lecturerFirstName
                  ? `${c.lecturerFirstName} ${c.lecturerLastName}`
                  : c.lecturerName || "—";
                return (
                  <div
                    key={c.classroomId}
                    className="p-4 rounded-xl hover:shadow-md transition-all"
                    style={{ border: "1px solid #e5e7eb" }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span style={{ fontSize: "1rem", fontWeight: 700, color: "#111827" }}>
                        {c.className}
                      </span>
                      {c.semester && (
                        <span
                          className="px-2 py-0.5 rounded-full text-xs"
                          style={{ backgroundColor: "#f3f4f6", color: "#6b7280", fontWeight: 500 }}
                        >
                          {c.semester}
                        </span>
                      )}
                    </div>
                    <div
                      className="text-xs mb-3 truncate"
                      style={{ color: "#9ca3af" }}
                      title={lecturerName}
                    >
                      GV: {lecturerName}
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="w-4 h-4" style={{ color: "#6b7280" }} />
                      <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                        {c.studentCount} học sinh
                      </span>
                    </div>
                    <button
                      onClick={() => navigate(`/admin/classes/${c.classroomId}`)}
                      className="w-full py-2 rounded-lg text-white text-sm transition-opacity hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, #334155, #111827)", border: "none", cursor: "pointer", fontWeight: 600 }}
                    >
                      Vào lớp học
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
