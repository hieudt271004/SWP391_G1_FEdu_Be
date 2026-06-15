import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Search, UserPlus, Loader2, AlertCircle, Trash2,
  BookOpen, GraduationCap, Mail, Pencil, X, Route as RouteIcon,
  Lock, Unlock, EyeOff, CheckCircle2, FileText,
} from "lucide-react";
import { classroomService } from "../../services/classroom.service";
import { adminService } from "../../services/admin.service";
import { learningPathService } from "../../services/learningPath.service";
import type { ClassroomSubjectResponse } from "../../types/classroomSubject";
import type { StudentInClass } from "../../types/student";
import type { ClassroomGraphResponse, LearningNodeResponse } from "../../services/learningPath.service";
import type { AdminUserResponse } from "../../services/admin.service";

const pathStateBadge = (state: ClassroomGraphResponse["state"]) => {
  switch (state) {
    case "PUBLISHED": return { label: "Đã xuất bản", bg: "#d1fae5", color: "#065f46" };
    case "DRAFT": return { label: "Bản nháp", bg: "#fef3c7", color: "#92400e" };
    default: return { label: "Chưa có lộ trình", bg: "#f3f4f6", color: "#6b7280" };
  }
};

const nodeStatusBadge = (status: LearningNodeResponse["status"]) => {
  switch (status) {
    case "OPEN": return { label: "Mở", bg: "#d1fae5", color: "#065f46", Icon: Unlock };
    case "HIDDEN": return { label: "Ẩn", bg: "#f3f4f6", color: "#6b7280", Icon: EyeOff };
    default: return { label: "Khóa", bg: "#fef3c7", color: "#92400e", Icon: Lock };
  }
};

export function ClassroomSubjectDetailPage() {
  const { classroomId: classroomIdParam, csId: csIdParam } = useParams<{ classroomId: string; csId: string }>();
  const navigate = useNavigate();
  const classroomId = Number(classroomIdParam);
  const csId = Number(csIdParam);

  const [cs, setCs] = useState<ClassroomSubjectResponse | null>(null);
  const [roster, setRoster] = useState<StudentInClass[]>([]);
  const [graph, setGraph] = useState<ClassroomGraphResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Danh mục dùng cho modal/đổi GV
  const [teachers, setTeachers] = useState<AdminUserResponse[]>([]);
  const [systemStudents, setSystemStudents] = useState<AdminUserResponse[]>([]);

  // Đổi giảng viên
  const [editingLecturer, setEditingLecturer] = useState(false);

  // Modal thêm sinh viên
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!classroomId || !csId) return;
    try {
      setLoading(true);
      setError(null);
      const [subjects, students, classroomGraph] = await Promise.all([
        classroomService.getSubjectsOfClassroom(classroomId),
        classroomService.getStudents(csId),
        learningPathService.getAdminClassroomGraph(csId).catch(() => null),
      ]);
      const found = subjects.find((s) => s.classroomSubjectId === csId) || null;
      if (!found) {
        setError("Không tìm thấy lớp-môn này.");
        return;
      }
      setCs(found);
      setRoster(students);
      setGraph(classroomGraph);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Không tải được dữ liệu lớp-môn");
    } finally {
      setLoading(false);
    }
  }, [classroomId, csId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Danh mục teacher/student cho đổi GV + gợi ý thêm SV
  useEffect(() => {
    const load = async () => {
      try {
        const users = await adminService.getAllUsers();
        setTeachers(users.filter((u) => u.roles?.includes("TEACHER")));
        setSystemStudents(users.filter((u) => u.roles?.includes("STUDENT") && u.status === "ACTIVE"));
      } catch (e) {
        console.error("Lỗi tải danh mục:", e);
      }
    };
    load();
  }, []);

  const lecturer = teachers.find((t) => t.userId === cs?.lecturerId);

  const handleChangeLecturer = async (lecturerId: number) => {
    if (!cs) return;
    try {
      const updated = await classroomService.changeLecturer(cs.classroomSubjectId, { lecturerId });
      setCs(updated);
      setEditingLecturer(false);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Đổi giảng viên thất bại");
    }
  };

  const handleAddStudent = async () => {
    if (!cs || !addEmail.trim()) return;
    try {
      setAddLoading(true);
      setAddError(null);
      const newStudent = await classroomService.addStudent(cs.classroomSubjectId, { email: addEmail });
      setRoster((prev) => [...prev, newStudent]);
      setCs((prev) => (prev ? { ...prev, studentCount: prev.studentCount + 1 } : prev));
      setAddEmail("");
      setShowAddStudent(false);
    } catch (e: unknown) {
      setAddError(e instanceof Error ? e.message : "Thêm học sinh thất bại");
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId: number) => {
    if (!cs || !confirm("Xác nhận xóa học sinh khỏi lớp-môn?")) return;
    try {
      await classroomService.removeStudent(cs.classroomSubjectId, studentId);
      setRoster((prev) => prev.filter((s) => s.userId !== studentId));
      setCs((prev) => (prev ? { ...prev, studentCount: Math.max(0, prev.studentCount - 1) } : prev));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Xóa thất bại");
    }
  };

  const suggestions = () => {
    const query = addEmail.toLowerCase().trim();
    return systemStudents.filter((s) => {
      if (roster.some((st) => st.email === s.email)) return false;
      if (!query) return true;
      const fullName = `${s.firstName || ""} ${s.lastName || ""}`.toLowerCase();
      return s.email.toLowerCase().includes(query) || fullName.includes(query);
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#4338ca" }} />
      <span style={{ marginLeft: "0.75rem", color: "#6b7280" }}>Đang tải lớp-môn...</span>
    </div>
  );

  if (error || !cs) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <AlertCircle className="w-10 h-10" style={{ color: "#ef4444" }} />
      <p style={{ color: "#374151" }}>{error || "Không tìm thấy lớp-môn"}</p>
      <button onClick={() => navigate(`/admin/classes/${classroomId}`)} className="px-4 py-2 rounded-lg text-white text-sm" style={{ background: "#4338ca" }}>Quay lại lớp</button>
    </div>
  );

  const sortedNodes = graph ? [...graph.nodes].sort((a, b) => a.displayOrder - b.displayOrder) : [];
  const stBadge = graph ? pathStateBadge(graph.state) : pathStateBadge("NO_PATH");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(`/admin/classes/${classroomId}`)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5" style={{ color: "#6b7280" }} />
        </button>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>{cs.displayName}</h1>
          <p style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "0.25rem" }}>
            {cs.subjectCode} · {cs.subjectName} · {cs.className}
          </p>
        </div>
      </div>

      {/* Thông tin giảng viên */}
      <div className="rounded-xl p-6" style={{ backgroundColor: "white", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div className="flex items-center gap-2 mb-4">
          <GraduationCap className="w-5 h-5" style={{ color: "#4338ca" }} />
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#111827" }}>Giảng viên phụ trách</h2>
        </div>
        {editingLecturer ? (
          <div className="flex items-center gap-3">
            <select
              autoFocus
              defaultValue={cs.lecturerId}
              onChange={(e) => handleChangeLecturer(Number(e.target.value))}
              className="flex-1 px-4 py-2.5 rounded-lg outline-none cursor-pointer"
              style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", fontSize: "0.875rem" }}
            >
              {teachers.map((t) => (
                <option key={t.userId} value={t.userId}>{t.firstName} {t.lastName} ({t.email})</option>
              ))}
            </select>
            <button onClick={() => setEditingLecturer(false)} className="px-4 py-2.5 rounded-lg hover:bg-gray-100" style={{ border: "1px solid #e5e7eb", color: "#374151", fontSize: "0.875rem", fontWeight: 600 }}>Hủy</button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer rounded-lg hover:bg-gray-50 -mx-1 px-1 py-1"
              onClick={() => cs.lecturerId && navigate(`/admin/users/${cs.lecturerId}`)} title="Xem chi tiết giảng viên">
              <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)" }}>
                <span className="text-white text-sm font-bold">
                  {((cs.lecturerName?.split(" ").slice(-2).map((s) => s[0]).join("")) || "??").toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#111827" }}>{cs.lecturerName}</div>
                {lecturer?.email && (
                  <div className="flex items-center gap-1.5 mt-0.5" style={{ fontSize: "0.8125rem", color: "#6b7280" }}>
                    <Mail className="w-3.5 h-3.5" /> {lecturer.email}
                  </div>
                )}
              </div>
            </div>
            <button onClick={() => setEditingLecturer(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50 shrink-0" style={{ border: "1px solid #e5e7eb", color: "#4338ca", fontWeight: 600 }}>
              <Pencil className="w-3.5 h-3.5" /> Đổi GV
            </button>
          </div>
        )}
      </div>

      {/* Lộ trình học (read-only) */}
      <div className="rounded-xl p-6" style={{ backgroundColor: "white", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <RouteIcon className="w-5 h-5" style={{ color: "#4338ca" }} />
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#111827" }}>Lộ trình học</h2>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: stBadge.bg, color: stBadge.color }}>
            {stBadge.label}
          </span>
        </div>

        {graph?.publishedAt && (
          <p className="flex items-center gap-1.5 mb-4" style={{ fontSize: "0.8125rem", color: "#6b7280" }}>
            <CheckCircle2 className="w-4 h-4" style={{ color: "#059669" }} />
            Xuất bản lúc {new Date(graph.publishedAt).toLocaleString("vi-VN")}
          </p>
        )}

        {sortedNodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <RouteIcon className="w-12 h-12" style={{ color: "#d1d5db" }} />
            <p style={{ color: "#9ca3af", fontSize: "0.875rem", textAlign: "center" }}>
              Lớp-môn này chưa có lộ trình. Giảng viên phụ trách sẽ clone lộ trình gốc (cơ bản/nâng cao) và xuất bản.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedNodes.map((node) => {
              const nb = nodeStatusBadge(node.status);
              return (
                <div key={node.nodeId} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ border: "1px solid #f3f4f6" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold" style={{ backgroundColor: "#eef2ff", color: "#4338ca" }}>
                    {node.displayOrder}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#111827" }}>{node.title}</div>
                    <div className="flex items-center gap-2 mt-0.5" style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                      <span className="flex items-center gap-1">
                        {node.nodeType === "AT_HOME" ? <FileText className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                        {node.nodeType === "AT_HOME" ? "Tự học" : "Trên lớp"}
                      </span>
                      {node.branchName && (<><span>·</span><span>{node.branchName}</span></>)}
                    </div>
                  </div>
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0" style={{ backgroundColor: nb.bg, color: nb.color }}>
                    <nb.Icon className="w-3 h-3" /> {nb.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Danh sách sinh viên */}
      <div className="rounded-xl p-6" style={{ backgroundColor: "white", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" style={{ color: "#4338ca" }} />
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#111827" }}>Sinh viên ({cs.studentCount})</h2>
          </div>
          <button onClick={() => { setShowAddStudent(true); setAddEmail(""); setAddError(null); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)", border: "none", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600 }}>
            <UserPlus className="w-4 h-4" /> Thêm SV
          </button>
        </div>

        {roster.length === 0 ? (
          <p style={{ color: "#9ca3af", fontSize: "0.875rem", padding: "0.5rem 0" }}>Chưa có sinh viên.</p>
        ) : (
          <div className="space-y-2">
            {roster.map((student) => {
              const initials = ((student.firstName?.[0] || "") + (student.lastName?.[0] || "")).toUpperCase() || "??";
              return (
                <div key={student.userId} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 cursor-pointer" style={{ border: "1px solid #f3f4f6" }}
                  onClick={() => navigate(`/admin/users/${student.userId}`)} title="Xem chi tiết học sinh">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)" }}>
                    <span className="text-white text-xs font-bold">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#111827" }}>{student.firstName} {student.lastName}</div>
                    <div style={{ fontSize: "0.8125rem", color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{student.email}</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleRemoveStudent(student.userId); }} className="p-1.5 rounded-lg hover:bg-red-50" title="Xóa khỏi lớp-môn">
                    <Trash2 className="w-4 h-4" style={{ color: "#ef4444" }} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal thêm sinh viên */}
      {showAddStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddStudent(false)}>
          <div className="rounded-2xl w-full max-w-md overflow-hidden" style={{ backgroundColor: "white" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #e5e7eb" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#111827" }}>Thêm học sinh vào lớp-môn</h3>
              <button onClick={() => setShowAddStudent(false)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" style={{ color: "#6b7280" }} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {addError && (<div className="px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>{addError}</div>)}
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg mb-3" style={{ backgroundColor: "#f3f4f6", border: "1px solid #e5e7eb" }}>
                <Search className="w-4 h-4 shrink-0" style={{ color: "#9ca3af" }} />
                <input type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddStudent()}
                  placeholder="Nhập email hoặc tên học sinh..." className="flex-1 bg-transparent outline-none text-sm" style={{ color: "#111827" }} autoFocus />
              </div>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100" style={{ backgroundColor: "#fafafa" }}>
                {suggestions().length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-500">Không tìm thấy học sinh phù hợp (hoặc đã ở trong lớp-môn)</div>
                ) : (
                  suggestions().map((s) => {
                    const initials = ((s.firstName?.[0] || "") + (s.lastName?.[0] || "")).toUpperCase() || "??";
                    const isSelected = addEmail === s.email;
                    return (
                      <button key={s.userId} type="button" onClick={() => setAddEmail(s.email)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-100" style={{ backgroundColor: isSelected ? "#eef2ff" : "transparent" }}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold" style={{ background: isSelected ? "linear-gradient(135deg, #4338ca, #7c3aed)" : "linear-gradient(135deg, #9ca3af, #4b5563)" }}>{initials}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-gray-900 truncate">{s.firstName} {s.lastName}</div>
                          <div className="text-xs text-gray-500 truncate">{s.email}</div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: "1px solid #e5e7eb" }}>
              <button onClick={() => setShowAddStudent(false)} className="px-5 py-2.5 rounded-lg hover:bg-gray-100" style={{ border: "1px solid #e5e7eb", backgroundColor: "white", color: "#374151", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}>Hủy</button>
              <button onClick={handleAddStudent} disabled={!addEmail.trim() || addLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)", border: "none", fontSize: "0.875rem", fontWeight: 600, cursor: addEmail.trim() ? "pointer" : "not-allowed" }}>
                {addLoading && <Loader2 className="w-4 h-4 animate-spin" />} Thêm vào lớp-môn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
