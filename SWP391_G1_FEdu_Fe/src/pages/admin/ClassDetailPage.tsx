import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Plus, X, Search, UserPlus, Loader2, AlertCircle,
  Trash2, BookOpen, ChevronDown, ChevronUp, Pencil,
} from "lucide-react";
import { classroomService } from "../../services/classroom.service";
import { subjectService } from "../../services/subject.service";
import { adminService } from "../../services/admin.service";
import type { ClassroomResponse } from "../../types/classroom";
import type { ClassroomSubjectResponse } from "../../types/classroomSubject";
import type { StudentInClass } from "../../types/student";
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
  const [systemStudents, setSystemStudents] = useState<AdminUserResponse[]>([]);

  // Thêm môn vào lớp
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectId, setNewSubjectId] = useState(0);
  const [newLecturerId, setNewLecturerId] = useState(0);
  const [addSubjectLoading, setAddSubjectLoading] = useState(false);
  const [addSubjectError, setAddSubjectError] = useState<string | null>(null);

  // Đổi giảng viên inline
  const [editingLecturerCsId, setEditingLecturerCsId] = useState<number | null>(null);

  // Roster theo lớp-môn
  const [expandedCsId, setExpandedCsId] = useState<number | null>(null);
  const [rosters, setRosters] = useState<Record<number, StudentInClass[]>>({});
  const [rosterLoading, setRosterLoading] = useState(false);

  // Modal thêm sinh viên (gắn với 1 lớp-môn)
  const [addStudentCsId, setAddStudentCsId] = useState<number | null>(null);
  const [addEmail, setAddEmail] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);

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

  // Tải danh mục subject + user (teacher/student) cho các modal
  useEffect(() => {
    const load = async () => {
      try {
        const [subs, users] = await Promise.all([
          subjectService.getAll(),
          adminService.getAllUsers(),
        ]);
        setAllSubjects(subs);
        setTeachers(users.filter((u) => u.roles?.includes("TEACHER")));
        setSystemStudents(users.filter((u) => u.roles?.includes("STUDENT") && u.status === "ACTIVE"));
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

  const toggleRoster = async (csId: number) => {
    if (expandedCsId === csId) { setExpandedCsId(null); return; }
    setExpandedCsId(csId);
    if (!rosters[csId]) {
      try {
        setRosterLoading(true);
        const st = await classroomService.getStudents(csId);
        setRosters((prev) => ({ ...prev, [csId]: st }));
      } catch (e) {
        console.error("Lỗi tải roster:", e);
        setRosters((prev) => ({ ...prev, [csId]: [] }));
      } finally {
        setRosterLoading(false);
      }
    }
  };

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

  const handleAddStudent = async () => {
    if (!addStudentCsId || !addEmail.trim()) return;
    try {
      setAddLoading(true);
      setAddError(null);
      const newStudent = await classroomService.addStudent(addStudentCsId, { email: addEmail });
      setRosters((prev) => ({
        ...prev,
        [addStudentCsId]: [...(prev[addStudentCsId] || []), newStudent],
      }));
      setSubjects((prev) => prev.map((s) =>
        s.classroomSubjectId === addStudentCsId ? { ...s, studentCount: s.studentCount + 1 } : s));
      setAddEmail("");
      setAddStudentCsId(null);
    } catch (e: unknown) {
      setAddError(e instanceof Error ? e.message : "Thêm học sinh thất bại");
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveStudent = async (csId: number, studentId: number) => {
    if (!confirm("Xác nhận xóa học sinh khỏi lớp-môn?")) return;
    try {
      await classroomService.removeStudent(csId, studentId);
      setRosters((prev) => ({
        ...prev,
        [csId]: (prev[csId] || []).filter((s) => s.userId !== studentId),
      }));
      setSubjects((prev) => prev.map((s) =>
        s.classroomSubjectId === csId ? { ...s, studentCount: Math.max(0, s.studentCount - 1) } : s));
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

  const suggestionsFor = (csId: number) => {
    const inClass = rosters[csId] || [];
    const query = addEmail.toLowerCase().trim();
    return systemStudents.filter((s) => {
      if (inClass.some((st) => st.email === s.email)) return false;
      if (!query) return true;
      const fullName = `${s.firstName || ""} ${s.lastName || ""}`.toLowerCase();
      return s.email.toLowerCase().includes(query) || fullName.includes(query);
    });
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/admin/classes")} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5" style={{ color: "#6b7280" }} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>{classroom?.className}</h1>
              {classroom?.status && (() => {
                const badge = getStatusBadge(classroom.status);
                return (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: badge.bg, color: badge.color }}>
                    {badge.label}
                  </span>
                );
              })()}
            </div>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "0.25rem" }}>
              {subjects.length} môn học{classroom?.semester ? ` · Học kỳ: ${classroom.semester}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {classroom?.status === "inactive" && (
            <button onClick={() => handleUpdateStatus("active")} disabled={updatingStatus}
              className="px-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
              style={{ backgroundColor: "#059669", border: "none", cursor: updatingStatus ? "not-allowed" : "pointer" }}>
              {updatingStatus && <Loader2 className="w-4 h-4 animate-spin" />} Bắt đầu lớp học
            </button>
          )}
          {classroom?.status === "active" && (
            <button onClick={() => handleUpdateStatus("completed")} disabled={updatingStatus}
              className="px-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
              style={{ backgroundColor: "#4338ca", border: "none", cursor: updatingStatus ? "not-allowed" : "pointer" }}>
              {updatingStatus && <Loader2 className="w-4 h-4 animate-spin" />} Kết thúc lớp học
            </button>
          )}
        </div>
      </div>

      {/* Danh sách lớp-môn */}
      <div className="rounded-xl p-6" style={{ backgroundColor: "white", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#111827" }}>Các môn học của lớp</h2>
          <button onClick={() => setShowAddSubject(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)", border: "none", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600 }}>
            <Plus className="w-4 h-4" /> Thêm môn
          </button>
        </div>

        {subjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <BookOpen className="w-12 h-12" style={{ color: "#d1d5db" }} />
            <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>Lớp chưa có môn nào. Bấm "Thêm môn" để gán môn + giảng viên.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {subjects.map((cs) => {
              const expanded = expandedCsId === cs.classroomSubjectId;
              const roster = rosters[cs.classroomSubjectId] || [];
              return (
                <div key={cs.classroomSubjectId} className="rounded-xl" style={{ border: "1px solid #e5e7eb" }}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "#eef2ff" }}>
                      <BookOpen className="w-5 h-5" style={{ color: "#4338ca" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#111827" }}>{cs.displayName}</div>
                      <div className="flex items-center gap-2 mt-0.5" style={{ fontSize: "0.8125rem", color: "#6b7280" }}>
                        <span>{cs.subjectName}</span>
                        <span>·</span>
                        {editingLecturerCsId === cs.classroomSubjectId ? (
                          <select
                            autoFocus
                            defaultValue={cs.lecturerId}
                            onChange={(e) => handleChangeLecturer(cs.classroomSubjectId, Number(e.target.value))}
                            onBlur={() => setEditingLecturerCsId(null)}
                            className="px-2 py-1 rounded border text-xs"
                            style={{ borderColor: "#e5e7eb" }}
                          >
                            {teachers.map((t) => (
                              <option key={t.userId} value={t.userId}>{t.firstName} {t.lastName} ({t.email})</option>
                            ))}
                          </select>
                        ) : (
                          <span className="flex items-center gap-1">
                            GV: {cs.lecturerName}
                            <button onClick={() => setEditingLecturerCsId(cs.classroomSubjectId)} className="p-0.5 rounded hover:bg-gray-100" title="Đổi giảng viên">
                              <Pencil className="w-3 h-3" style={{ color: "#9ca3af" }} />
                            </button>
                          </span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => toggleRoster(cs.classroomSubjectId)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50"
                      style={{ border: "1px solid #e5e7eb", color: "#4338ca", fontWeight: 600 }}>
                      {cs.studentCount} SV {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleRemoveSubject(cs.classroomSubjectId)} className="p-1.5 rounded-lg hover:bg-red-50" title="Gỡ môn khỏi lớp">
                      <Trash2 className="w-4 h-4" style={{ color: "#ef4444" }} />
                    </button>
                  </div>

                  {expanded && (
                    <div className="px-4 pb-4" style={{ borderTop: "1px solid #f3f4f6" }}>
                      <div className="flex items-center justify-between py-3">
                        <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#6b7280" }}>Danh sách sinh viên</span>
                        <button onClick={() => { setAddStudentCsId(cs.classroomSubjectId); setAddEmail(""); setAddError(null); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs hover:opacity-90"
                          style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)", border: "none", cursor: "pointer", fontWeight: 600 }}>
                          <UserPlus className="w-3.5 h-3.5" /> Thêm SV
                        </button>
                      </div>
                      {rosterLoading && expanded ? (
                        <div className="flex items-center justify-center py-6"><Loader2 className="w-5 h-5 animate-spin" style={{ color: "#4338ca" }} /></div>
                      ) : roster.length === 0 ? (
                        <p style={{ color: "#9ca3af", fontSize: "0.8125rem", padding: "0.5rem 0" }}>Chưa có sinh viên.</p>
                      ) : (
                        <div className="space-y-2">
                          {roster.map((student) => {
                            const initials = ((student.firstName?.[0] || "") + (student.lastName?.[0] || "")).toUpperCase() || "??";
                            return (
                              <div key={student.userId} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50" style={{ border: "1px solid #f3f4f6" }}>
                                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)" }}>
                                  <span className="text-white text-xs font-bold">{initials}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#111827" }}>{student.firstName} {student.lastName}</div>
                                  <div style={{ fontSize: "0.8125rem", color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{student.email}</div>
                                </div>
                                <button onClick={() => handleRemoveStudent(cs.classroomSubjectId, student.userId)} className="p-1.5 rounded-lg hover:bg-red-50" title="Xóa khỏi lớp-môn">
                                  <Trash2 className="w-4 h-4" style={{ color: "#ef4444" }} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal thêm môn */}
      {showAddSubject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddSubject(false)}>
          <div className="rounded-2xl w-full max-w-md overflow-hidden" style={{ backgroundColor: "white" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #e5e7eb" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#111827" }}>Thêm môn vào lớp</h3>
              <button onClick={() => setShowAddSubject(false)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" style={{ color: "#6b7280" }} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {addSubjectError && (
                <div className="px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>{addSubjectError}</div>
              )}
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#374151", marginBottom: "0.5rem" }}>Môn học <span style={{ color: "#ef4444" }}>*</span></label>
                <select value={newSubjectId} onChange={(e) => setNewSubjectId(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-lg outline-none cursor-pointer" style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", fontSize: "0.875rem" }}>
                  <option value={0} disabled>-- Chọn môn học --</option>
                  {allSubjects
                    .filter((s) => !subjects.some((cs) => cs.subjectId === s.subjectId))
                    .map((s) => (<option key={s.subjectId} value={s.subjectId}>{s.subjectCode} - {s.subjectName}</option>))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#374151", marginBottom: "0.5rem" }}>Giảng viên phụ trách <span style={{ color: "#ef4444" }}>*</span></label>
                <select value={newLecturerId} onChange={(e) => setNewLecturerId(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-lg outline-none cursor-pointer" style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", fontSize: "0.875rem" }}>
                  <option value={0} disabled>-- Chọn giảng viên --</option>
                  {teachers.map((t) => (<option key={t.userId} value={t.userId}>{t.firstName} {t.lastName} ({t.email})</option>))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: "1px solid #e5e7eb" }}>
              <button onClick={() => setShowAddSubject(false)} className="px-5 py-2.5 rounded-lg hover:bg-gray-100" style={{ border: "1px solid #e5e7eb", backgroundColor: "white", color: "#374151", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}>Hủy</button>
              <button onClick={handleAddSubject} disabled={addSubjectLoading || !newSubjectId || !newLecturerId}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)", border: "none", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}>
                {addSubjectLoading && <Loader2 className="w-4 h-4 animate-spin" />} Thêm môn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal thêm sinh viên (theo lớp-môn) */}
      {addStudentCsId !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setAddStudentCsId(null)}>
          <div className="rounded-2xl w-full max-w-md overflow-hidden" style={{ backgroundColor: "white" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #e5e7eb" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#111827" }}>Thêm học sinh vào lớp-môn</h3>
              <button onClick={() => setAddStudentCsId(null)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" style={{ color: "#6b7280" }} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {addError && (<div className="px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>{addError}</div>)}
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg mb-3" style={{ backgroundColor: "#f3f4f6", border: "1px solid #e5e7eb" }}>
                <Search className="w-4 h-4 shrink-0" style={{ color: "#9ca3af" }} />
                <input type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddStudent()}
                  placeholder="Nhập email hoặc tên học sinh..." className="flex-1 bg-transparent outline-none text-sm" style={{ color: "#111827" }} autoFocus />
              </div>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100" style={{ backgroundColor: "#fafafa" }}>
                {suggestionsFor(addStudentCsId).length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-500">Không tìm thấy học sinh phù hợp (hoặc đã ở trong lớp-môn)</div>
                ) : (
                  suggestionsFor(addStudentCsId).map((s) => {
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
              <button onClick={() => setAddStudentCsId(null)} className="px-5 py-2.5 rounded-lg hover:bg-gray-100" style={{ border: "1px solid #e5e7eb", backgroundColor: "white", color: "#374151", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}>Hủy</button>
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
