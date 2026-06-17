import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, CheckCircle2, Circle, Plus, X, Search,
  UserPlus, Loader2, AlertCircle, Trash2, BookOpen, Mail,
} from "lucide-react";
import { classroomService } from "../../services/classroom.service";
import { adminService } from "../../services/admin.service";
import type { ClassroomResponse } from "../../types/classroom";
import type { StudentInClass } from "../../types/student";
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
  const [students, setStudents] = useState<StudentInClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);

  const [systemStudents, setSystemStudents] = useState<AdminUserResponse[]>([]);
  const [fetchingStudents, setFetchingStudents] = useState(false);

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

  useEffect(() => {
    if (searchParams.get("addStudent") === "true") {
      setShowAddModal(true);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("addStudent");
      navigate({ search: newParams.toString() }, { replace: true });
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    if (showAddModal) {
      const fetchSystemStudents = async () => {
        try {
          setFetchingStudents(true);
          const users = await adminService.getAllUsers();
          const activeStudents = users.filter(
            (u) => u.roles?.includes("STUDENT") && u.status === "ACTIVE"
          );
          setSystemStudents(activeStudents);
        } catch (e: unknown) {
          console.error("Lỗi khi tải danh sách học sinh:", e);
        } finally {
          setFetchingStudents(false);
        }
      };
      fetchSystemStudents();
    }
  }, [showAddModal]);


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

  const handleUpdateStatus = async (newStatus: string) => {
    if (!classroom) return;
    const actionText = newStatus === "active" ? "bắt đầu" : "kết thúc";
    if (!confirm(`Bạn có chắc chắn muốn ${actionText} lớp học này không?`)) return;

    try {
      setUpdatingStatus(true);
      await classroomService.update(classroomId, {
        subjectId: classroom.subjectId,
        className: classroom.className,
        semester: classroom.semester || "",
        description: classroom.description || "",
        lecturerId: classroom.lecturerId,
        status: newStatus,
      });
      // Refresh data
      const updatedClassroom = await classroomService.getById(classroomId);
      setClassroom(updatedClassroom);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Cập nhật trạng thái thất bại");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredSuggestions = systemStudents.filter((s) => {
    const isAlreadyInClass = students.some((st) => st.email === s.email);
    if (isAlreadyInClass) return false;

    const query = addEmail.toLowerCase().trim();
    if (!query) return true;

    const fullName = `${s.firstName || ""} ${s.lastName || ""}`.toLowerCase();
    return s.email.toLowerCase().includes(query) || fullName.includes(query);
  });

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
            <div className="flex items-center gap-3">
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>
                {classroom?.className} — {classroom?.subjectName || classroom?.subjectCode}
              </h1>
              {classroom?.status && (() => {
                const badge = getStatusBadge(classroom.status);
                return (
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-semibold animate-pulse"
                    style={{ backgroundColor: badge.bg, color: badge.color, animationDuration: "3s" }}
                  >
                    {badge.label}
                  </span>
                );
              })()}
            </div>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "0.25rem" }}>
              Giảng viên: {classroom?.lecturerFirstName
                ? `${classroom.lecturerFirstName} ${classroom.lecturerLastName}`
                : classroom?.lecturerName || "—"}
              {classroom?.semester && ` · Học kỳ: ${classroom.semester}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {classroom?.status === "inactive" && (
            <button
              onClick={() => handleUpdateStatus("active")}
              disabled={updatingStatus}
              className="px-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
              style={{ backgroundColor: "#059669", border: "none", cursor: updatingStatus ? "not-allowed" : "pointer" }}
            >
              {updatingStatus && <Loader2 className="w-4 h-4 animate-spin" />}
              Bắt đầu lớp học
            </button>
          )}
          {classroom?.status === "active" && (
            <button
              onClick={() => handleUpdateStatus("completed")}
              disabled={updatingStatus}
              className="px-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
              style={{ backgroundColor: "#4338ca", border: "none", cursor: updatingStatus ? "not-allowed" : "pointer" }}
            >
              {updatingStatus && <Loader2 className="w-4 h-4 animate-spin" />}
              Kết thúc lớp học
            </button>
          )}
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
              Môn học
            </h2>
          </div>
          <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#111827", marginBottom: "0.5rem" }}>
            {classroom?.subjectName || "Đang tải..."}
          </h3>
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            Mã môn học: <span style={{ fontWeight: 600, color: "#111827" }}>{classroom?.subjectCode || "—"}</span>
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
        {/* Left: Class Roadmap - Removed hardcoded timeline */}
        <div></div>

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
                  Tìm kiếm hoặc Email học sinh
                </label>
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg mb-3" style={{ backgroundColor: "#f3f4f6", border: "1px solid #e5e7eb" }}>
                  <Search className="w-4 h-4 shrink-0" style={{ color: "#9ca3af" }} />
                  <input
                    type="email"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddStudent()}
                    placeholder="Nhập email hoặc tên học sinh..."
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{ color: "#111827" }}
                    autoFocus
                  />
                </div>

                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#6b7280", marginBottom: "0.375rem" }}>
                  Gợi ý học sinh từ hệ thống
                </label>
                {fetchingStudents ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#4338ca" }} />
                    <span className="text-xs text-gray-500 ml-2">Đang tải danh sách học sinh...</span>
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100" style={{ backgroundColor: "#fafafa" }}>
                    {filteredSuggestions.length === 0 ? (
                      <div className="p-4 text-center text-xs text-gray-500">
                        Không tìm thấy học sinh phù hợp (hoặc đã ở trong lớp)
                      </div>
                    ) : (
                      filteredSuggestions.map((s) => {
                        const initials = ((s.firstName?.[0] || "") + (s.lastName?.[0] || "")).toUpperCase() || "??";
                        const isSelected = addEmail === s.email;
                        return (
                          <button
                            key={s.userId}
                            type="button"
                            onClick={() => setAddEmail(s.email)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-100 transition-colors"
                            style={{ backgroundColor: isSelected ? "#eef2ff" : "transparent" }}
                          >
                            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold" style={{ background: isSelected ? "linear-gradient(135deg, #4338ca, #7c3aed)" : "linear-gradient(135deg, #9ca3af, #4b5563)" }}>
                              {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-gray-900 truncate">
                                {s.firstName} {s.lastName}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {s.email}
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
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
