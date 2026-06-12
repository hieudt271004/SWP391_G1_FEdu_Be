import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, CheckCircle2, Circle, Plus, X, Search,
  UserPlus, Loader2, AlertCircle, Trash2, BookOpen, Mail,
} from "lucide-react";
import { classroomService } from "../../services/classroom.service";
import type { ClassroomResponse } from "../../types/classroom";
import type { StudentInClass } from "../../types/student";

const mockModuleProgress = [
  { id: "1", title: "Module 1: Introduction", status: "completed" as const },
  { id: "2", title: "Module 2: Requirements", status: "completed" as const },
  { id: "3", title: "Module 3: Design", status: "in-progress" as const },
  { id: "4", title: "Module 4: Implementation", status: "not-started" as const },
  { id: "5", title: "Module 5: Testing", status: "not-started" as const },
];

export function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const classroomId = Number(id);

  const [classroom, setClassroom] = useState<ClassroomResponse | null>(null);
  const [students, setStudents] = useState<StudentInClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!classroomId) return;
    try {
      setLoading(true);
      setError(null);
      const [cr, st] = await Promise.all([
        classroomService.getById(classroomId),
        classroomService.getStudents(classroomId),
      ]);
      setClassroom(cr);
      setStudents(st);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Không tải được dữ liệu lớp học");
    } finally {
      setLoading(false);
    }
  }, [classroomId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  };

  const handleAddStudent = async () => {
    if (!addEmail.trim()) return;
    try {
      setAddLoading(true);
      setAddError(null);
      const newStudent = await classroomService.addStudent(classroomId, { email: addEmail });
      setStudents((prev) => [...prev, newStudent]);
      setAddEmail("");
      setShowAddModal(false);
    } catch (e: unknown) {
      setAddError(e instanceof Error ? e.message : "Thêm học sinh thất bại");
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId: number) => {
    if (!confirm("Xác nhận xóa học sinh khỏi lớp?")) return;
    try {
      await classroomService.removeStudent(classroomId, studentId);
      setStudents((prev) => prev.filter((s) => s.userId !== studentId));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Xóa thất bại");
    }
  };

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
      <button onClick={fetchData} className="px-4 py-2 rounded-lg text-white text-sm" style={{ background: "#4338ca" }}>Thử lại</button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/admin/classes")} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5" style={{ color: "#6b7280" }} />
          </button>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>
              {classroom?.className} — {classroom?.subjectName || classroom?.subjectCode}
            </h1>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "0.25rem" }}>
              Giảng viên: {classroom?.lecturerFirstName
                ? `${classroom.lecturerFirstName} ${classroom.lecturerLastName}`
                : classroom?.lecturerName || "—"}
              {classroom?.semester && ` · Học kỳ: ${classroom.semester}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-lg" style={{ backgroundColor: "#eef2ff", fontSize: "0.875rem", color: "#4338ca", fontWeight: 600 }}>
            {students.length} học sinh
          </div>
        </div>
      </div>

      {/* Course and Instructor Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Course Info */}
        <div
          className="rounded-xl p-6 cursor-pointer hover:shadow-md transition-shadow"
          style={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
          onClick={() => classroom?.subjectId && navigate(`/admin/courses/${classroom.subjectId}`)}
        >
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-5 h-5" style={{ color: "#4338ca" }} />
            <h2 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>
              Khóa học
            </h2>
          </div>
          <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#111827", marginBottom: "0.5rem" }}>
            {classroom?.subjectName || "Đang tải..."}
          </h3>
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            Mã khóa học: <span style={{ fontWeight: 600, color: "#111827" }}>{classroom?.subjectCode || "—"}</span>
          </p>
        </div>

        {/* Instructor Info */}
        <div
          className="rounded-xl p-6 cursor-pointer hover:shadow-md transition-shadow"
          style={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
          onClick={() => classroom?.lecturerId && navigate(`/admin/users/${classroom.lecturerId}`)}
        >
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#4338ca", color: "white", fontSize: "0.625rem", fontWeight: 600 }}
            >
              GV
            </div>
            <h2 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>
              Giảng viên
            </h2>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)" }}
            >
              <span className="text-white text-sm font-bold">
                {(classroom?.lecturerFirstName?.[0] || "").toUpperCase()}{(classroom?.lecturerLastName?.[0] || "").toUpperCase() || ""}
              </span>
            </div>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#111827" }}>
              {classroom?.lecturerFirstName
                ? `${classroom.lecturerFirstName} ${classroom.lecturerLastName || ''}`
                : classroom?.lecturerName || "Chưa phân công"}
            </h3>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm" style={{ color: "#6b7280" }}>
              <Mail className="w-4 h-4" />
              <span>{classroom?.lecturerEmail || "—"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Class Roadmap */}
        <div className="rounded-xl p-6" style={{ backgroundColor: "white", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#111827", marginBottom: "1.5rem" }}>Lộ trình Lớp học</h2>
          <div className="space-y-4">
            {mockModuleProgress.map((module, index) => {
              const isExpanded = expandedModules.includes(module.id);
              const statusColor = module.status === "completed" ? "#059669" : module.status === "in-progress" ? "#4338ca" : "#d1d5db";
              return (
                <div key={module.id}>
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: module.status === "completed" ? "#ecfdf5" : module.status === "in-progress" ? "#eef2ff" : "white", border: `2px solid ${statusColor}` }}>
                        {module.status === "completed"
                          ? <CheckCircle2 className="w-5 h-5" style={{ color: statusColor }} />
                          : <Circle className="w-4 h-4" style={{ color: statusColor }} />}
                      </div>
                      {index < mockModuleProgress.length - 1 && (
                        <div className="w-0.5 h-12 mt-1" style={{ backgroundColor: "#e5e7eb" }} />
                      )}
                    </div>
                    <div className="flex-1">
                      <button onClick={() => toggleModule(module.id)} className="text-left w-full">
                        <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#111827", marginBottom: "0.25rem" }}>{module.title}</h3>
                        <p style={{ fontSize: "0.8125rem", color: module.status === "completed" ? "#059669" : module.status === "in-progress" ? "#4338ca" : "#9ca3af" }}>
                          {module.status === "completed" ? "Đã hoàn thành" : module.status === "in-progress" ? "Đang học" : "Chưa bắt đầu"}
                        </p>
                      </button>
                      {isExpanded && (
                        <div className="mt-3 space-y-2">
                          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50" style={{ color: "#4338ca", fontWeight: 500 }}>
                            <Plus className="w-4 h-4" /> Thêm Nội dung
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Student List */}
        <div className="rounded-xl p-6" style={{ backgroundColor: "white", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div className="flex items-center justify-between mb-6">
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#111827" }}>Danh sách Học sinh</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)", border: "none", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600 }}
            >
              <UserPlus className="w-4 h-4" /> Thêm học sinh
            </button>
          </div>

          {students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <UserPlus className="w-12 h-12" style={{ color: "#d1d5db" }} />
              <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>Chưa có học sinh trong lớp</p>
            </div>
          ) : (
            <div className="space-y-2">
              {students.map((student) => {
                const initials = ((student.firstName?.[0] || "") + (student.lastName?.[0] || "")).toUpperCase() || "??";
                return (
                  <div key={student.userId} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors" style={{ border: "1px solid #e5e7eb" }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)" }}>
                      <span className="text-white text-xs font-bold">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#111827" }}>
                        {student.firstName} {student.lastName}
                      </div>
                      <div style={{ fontSize: "0.8125rem", color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {student.email}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveStudent(student.userId)}
                      className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      title="Xóa khỏi lớp"
                    >
                      <Trash2 className="w-4 h-4" style={{ color: "#ef4444" }} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="rounded-2xl w-full max-w-md overflow-hidden" style={{ backgroundColor: "white" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #e5e7eb" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#111827" }}>Thêm học sinh vào lớp</h3>
              <button onClick={() => { setShowAddModal(false); setAddEmail(""); setAddError(null); }} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" style={{ color: "#6b7280" }} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {addError && (
                <div className="px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>
                  {addError}
                </div>
              )}
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#374151", marginBottom: "0.5rem" }}>
                  Email học sinh
                </label>
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg" style={{ backgroundColor: "#f3f4f6", border: "1px solid #e5e7eb" }}>
                  <Search className="w-4 h-4 shrink-0" style={{ color: "#9ca3af" }} />
                  <input
                    type="email"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddStudent()}
                    placeholder="example@email.com"
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{ color: "#111827" }}
                    autoFocus
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: "1px solid #e5e7eb" }}>
              <button onClick={() => { setShowAddModal(false); setAddEmail(""); setAddError(null); }}
                className="px-5 py-2.5 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ border: "1px solid #e5e7eb", backgroundColor: "white", color: "#374151", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}>
                Hủy
              </button>
              <button onClick={handleAddStudent} disabled={!addEmail.trim() || addLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)", border: "none", fontSize: "0.875rem", fontWeight: 600, cursor: addEmail.trim() ? "pointer" : "not-allowed" }}>
                {addLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Thêm vào lớp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
