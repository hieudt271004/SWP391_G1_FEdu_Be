import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Search, UserPlus, Loader2, AlertCircle, Trash2,
  BookOpen, GraduationCap, Mail, Pencil, X, Route as RouteIcon,
  Lock, CheckCircle2, FileText, Upload, Download,
  Video, ClipboardCheck,
} from "lucide-react";
import { classroomService } from "../../services/classroom.service";
import { adminService } from "../../services/admin.service";
import { learningPathService } from "../../services/learningPath.service";
import { LearningPathFlow } from "../../components/learningPath/LearningPathFlow";
import { NodeContentReadOnlyPanel } from "../../components/learningPath/NodeContentReadOnlyPanel";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import type { ClassroomSubjectResponse } from "../../types/classroomSubject";
import type { StudentInClass, ImportStudentsResult } from "../../types/student";
import type { ClassroomGraphResponse, LearningNodeResponse, NodeContentResponse } from "../../services/learningPath.service";
import type { AdminUserResponse } from "../../services/admin.service";

const pathStateBadge = (state: ClassroomGraphResponse["state"]) => {
  switch (state) {
    case "PUBLISHED": return { label: "Đã xuất bản", bg: "#d1fae5", color: "#065f46" };
    case "DRAFT": return { label: "Bản nháp", bg: "#fef3c7", color: "#92400e" };
    default: return { label: "Chưa có lộ trình", bg: "#f3f4f6", color: "#6b7280" };
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

  // Node đang chọn trên cây → hiện nội dung read-only bên panel phải
  const [selectedNode, setSelectedNode] = useState<LearningNodeResponse | null>(null);

  // Nội dung node (tài liệu + bài test) — admin xem read-only, fetch khi mở node
  const [expandedNodeId, setExpandedNodeId] = useState<number | null>(null);
  const [nodeContent, setNodeContent] = useState<Record<number, NodeContentResponse>>({});
  const [nodeContentLoading, setNodeContentLoading] = useState<Record<number, boolean>>({});

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

  // Modal import sinh viên bằng Excel
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportStudentsResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Quản lý tab hiển thị: 'roadmap' (Lộ trình học) hoặc 'students' (Danh sách sinh viên)
  const [activeTab, setActiveTab] = useState<'roadmap' | 'students'>('roadmap');

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

  // Coursera-style: nạp sẵn nội dung tất cả node → hiện thống kê + mở tức thì, mở sẵn node đầu
  useEffect(() => {
    if (!graph || graph.nodes.length === 0) return;
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        graph.nodes.map(async (n) => {
          try { return [n.nodeId, await learningPathService.getAdminNodeContent(n.nodeId)] as const; }
          catch { return [n.nodeId, { materials: [], tests: [] } as NodeContentResponse] as const; }
        })
      );
      if (cancelled) return;
      setNodeContent(Object.fromEntries(entries));
      const firstId = [...graph.nodes].sort((a, b) => a.displayOrder - b.displayOrder)[0]?.nodeId ?? null;
      setExpandedNodeId((prev) => prev ?? firstId);
    })();
    return () => { cancelled = true; };
  }, [graph]);

  const toggleNode = async (nodeId: number) => {
    if (expandedNodeId === nodeId) { setExpandedNodeId(null); return; }
    setExpandedNodeId(nodeId);
    if (nodeContent[nodeId] || nodeContentLoading[nodeId]) return;
    try {
      setNodeContentLoading((p) => ({ ...p, [nodeId]: true }));
      const content = await learningPathService.getAdminNodeContent(nodeId);
      setNodeContent((p) => ({ ...p, [nodeId]: content }));
    } catch (e) {
      console.error("Lỗi tải nội dung node:", e);
    } finally {
      setNodeContentLoading((p) => ({ ...p, [nodeId]: false }));
    }
  };

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

  const openImport = () => {
    setShowImport(true);
    setImportFile(null);
    setImportResult(null);
    setImportError(null);
  };

  const handleDownloadTemplate = async () => {
    if (!cs) return;
    try {
      await classroomService.downloadImportTemplate(cs.classroomSubjectId);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Tải file mẫu thất bại");
    }
  };

  const handleImport = async () => {
    if (!cs || !importFile) return;
    try {
      setImporting(true);
      setImportError(null);
      setImportResult(null);
      const result = await classroomService.importStudents(cs.classroomSubjectId, importFile);
      setImportResult(result);
      await fetchData(); // refresh roster + studentCount
    } catch (e: unknown) {
      setImportError(e instanceof Error ? e.message : "Import thất bại");
    } finally {
      setImporting(false);
    }
  };

  const handleRemoveStudent = async (studentId: number) => {
    if (graph?.state === "PUBLISHED") {
      alert("Lớp đã bắt đầu (lộ trình đã xuất bản) — không thể xóa sinh viên. Dữ liệu được giữ lại, SV chỉ là không qua môn.");
      return;
    }
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
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <span className="ml-3 text-sm text-muted-foreground">Đang tải lớp-môn...</span>
    </div>
  );

  if (error || !cs) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <AlertCircle className="w-10 h-10 text-destructive" />
      <p className="text-sm text-muted-foreground">{error || "Không tìm thấy lớp-môn"}</p>
      <Button onClick={() => navigate(`/admin/classes/${classroomId}`)} variant="default">Quay lại lớp</Button>
    </div>
  );

  const sortedNodes = graph ? [...graph.nodes].sort((a, b) => (a.displayOrder - b.displayOrder) || (a.nodeId - b.nodeId)) : [];
  const stBadge = graph ? pathStateBadge(graph.state) : pathStateBadge("NO_PATH");

  const isPublished = graph?.state === "PUBLISHED";
  const totals = sortedNodes.reduce(
    (acc, n) => {
      const c = nodeContent[n.nodeId];
      if (c) {
        acc.videos += (c.materials || []).filter((m) => m.video).length;
        acc.docs += (c.materials || []).filter((m) => m.file).length;
        acc.tests += (c.tests || []).length;
      }
      return acc;
    },
    { videos: 0, docs: 0, tests: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-lg">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{cs.displayName}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {cs.subjectCode} · {cs.subjectName} · {cs.className}
          </p>
        </div>
      </div>

      {/* Thông tin giảng viên */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-5 h-5 text-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Giảng viên phụ trách</h2>
          </div>
          {editingLecturer ? (
            <div className="flex items-center gap-3">
              <select
                autoFocus
                defaultValue={cs.lecturerId}
                onChange={(e) => handleChangeLecturer(Number(e.target.value))}
                className="flex-1 px-3 py-2 rounded-md outline-none cursor-pointer border bg-background text-foreground text-sm focus:border-ring focus:ring-1 focus:ring-ring"
              >
                {teachers.map((t) => (
                  <option key={t.userId} value={t.userId}>{t.firstName} {t.lastName} ({t.email})</option>
                ))}
              </select>
              <Button variant="outline" onClick={() => setEditingLecturer(false)}>Hủy</Button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer rounded-lg hover:bg-accent -mx-1 px-1 py-1 transition-colors"
                onClick={() => cs.lecturerId && navigate(`/admin/users/${cs.lecturerId}`)} title="Xem chi tiết giảng viên">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-primary text-primary-foreground">
                  <span className="text-sm font-semibold">
                    {((cs.lecturerName?.split(" ").slice(-2).map((s) => s[0]).join("")) || "??").toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">{cs.lecturerName}</div>
                  {lecturer?.email && (
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                      <Mail className="w-3.5 h-3.5" /> {lecturer.email}
                    </div>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setEditingLecturer(true)} className="gap-1.5">
                <Pencil className="w-3.5 h-3.5" /> Đổi GV
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('roadmap')}
          className={`py-3 px-6 text-sm font-medium transition-colors border-b-2 cursor-pointer bg-transparent border-none ${
            activeTab === 'roadmap'
              ? 'border-primary text-foreground font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
          }`}
        >
          Lộ trình học tập
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`py-3 px-6 text-sm font-medium transition-colors border-b-2 cursor-pointer bg-transparent border-none ${
            activeTab === 'students'
              ? 'border-primary text-foreground font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
          }`}
        >
          Danh sách sinh viên ({cs.studentCount})
        </button>
      </div>

      {/* Lộ trình học — giao diện kiểu Coursera, read-only cho admin */}
      {activeTab === 'roadmap' && (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <RouteIcon className="w-5 h-5 text-foreground" />
              <h2 className="text-lg font-semibold text-foreground">Lộ trình học</h2>
            </div>
            <Badge variant="outline" className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: stBadge.bg, color: stBadge.color, borderColor: "transparent" }}>
              {stBadge.label}
            </Badge>
          </div>

          {sortedNodes.length > 0 && (
            <div className="flex items-center flex-wrap gap-x-5 gap-y-1.5 pb-4 mb-4 text-xs text-muted-foreground border-b border-border">
              <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> {sortedNodes.length} bài học</span>
              <span className="flex items-center gap-1.5"><Video className="w-4 h-4" /> {totals.videos} video</span>
              <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" /> {totals.docs} tài liệu</span>
              <span className="flex items-center gap-1.5"><ClipboardCheck className="w-4 h-4" /> {totals.tests} bài test</span>
            </div>
          )}

          {graph?.publishedAt && (
            <p className="flex items-center gap-1.5 mb-3 text-xs text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Xuất bản lúc {new Date(graph.publishedAt).toLocaleString("vi-VN")}
            </p>
          )}

          {sortedNodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <RouteIcon className="w-12 h-12 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Lớp-môn này chưa có lộ trình. Giảng viên phụ trách sẽ clone lộ trình gốc (cơ bản/nâng cao) và xuất bản.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
              <div className="max-h-[70vh] overflow-auto rounded-xl border border-border bg-slate-50/40 dark:bg-slate-900/10 p-3 lg:max-h-[calc(100vh-2rem)] lg:w-[544px] lg:flex-shrink-0">
                <LearningPathFlow
                  nodes={graph?.nodes || []}
                  edges={graph?.edges || []}
                  selectedNodeId={selectedNode?.nodeId ?? null}
                  onNodeClick={(node) => setSelectedNode(node)}
                />
              </div>
              <aside className="overflow-y-auto rounded-xl border border-border bg-card lg:max-h-[calc(100vh-2rem)] lg:flex-1 lg:min-w-[360px]">
                {!selectedNode ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    Chọn một bài học trên lộ trình để xem nội dung.
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="mb-3">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {selectedNode.nodeType === "AT_HOME" ? "Tự học" : "Trên lớp"}
                      </div>
                      <h3 className="text-base font-semibold text-foreground">{selectedNode.title}</h3>
                      {selectedNode.description && (
                        <p className="mt-0.5 text-sm text-muted-foreground">{selectedNode.description}</p>
                      )}
                    </div>
                    <NodeContentReadOnlyPanel nodeId={selectedNode.nodeId} />
                  </div>
                )}
              </aside>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Danh sách sinh viên */}
      {activeTab === 'students' && (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-foreground" />
              <h2 className="text-lg font-semibold text-foreground">Sinh viên ({cs.studentCount})</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={openImport} className="gap-2">
                <Upload className="w-4 h-4" /> Import Excel
              </Button>
              <Button onClick={() => { setShowAddStudent(true); setAddEmail(""); setAddError(null); }} className="gap-2">
                <UserPlus className="w-4 h-4" /> Thêm SV
              </Button>
            </div>
          </div>

          {roster.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">Chưa có sinh viên.</p>
          ) : (
            <div className="space-y-2">
              {roster.map((student) => {
                const initials = ((student.firstName?.[0] || "") + (student.lastName?.[0] || "")).toUpperCase() || "??";
                return (
                  <div key={student.userId} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => navigate(`/admin/users/${student.userId}`)} title="Xem chi tiết học sinh">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-primary text-primary-foreground">
                      <span className="text-xs font-semibold">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">{student.firstName} {student.lastName}</div>
                      <div className="text-xs text-muted-foreground truncate">{student.email}</div>
                    </div>
                    {isPublished ? (
                      <span className="p-1.5 shrink-0" title="Lớp đã bắt đầu — không thể xóa SV (giữ dữ liệu, SV chỉ là không qua môn)">
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      </span>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                        onClick={(e) => { e.stopPropagation(); handleRemoveStudent(student.userId); }}
                        title="Xóa khỏi lớp-môn"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Modal thêm sinh viên */}
      {showAddStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddStudent(false)}>
          <div className="rounded-xl w-full max-w-md overflow-hidden border bg-background text-foreground shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Thêm học sinh vào lớp-môn</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowAddStudent(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {addError && (
                <div className="px-4 py-3 rounded-lg text-sm bg-destructive/10 border border-destructive/20 text-destructive">
                  {addError}
                </div>
              )}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-input-background focus-within:ring-ring/50 focus-within:ring-[3px] focus-within:border-ring transition-[color,box-shadow]">
                <Search className="w-4 h-4 shrink-0 text-muted-foreground" />
                <input type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddStudent()}
                  placeholder="Nhập email hoặc tên học sinh..." className="flex-1 bg-transparent outline-none text-sm text-foreground" autoFocus />
              </div>
              <div className="max-h-48 overflow-y-auto border rounded-md divide-y bg-accent/30">
                {suggestions().length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">Không tìm thấy học sinh phù hợp (hoặc đã ở trong lớp-môn)</div>
                ) : (
                  suggestions().map((s) => {
                    const initials = ((s.firstName?.[0] || "") + (s.lastName?.[0] || "")).toUpperCase() || "??";
                    const isSelected = addEmail === s.email;
                    return (
                      <button key={s.userId} type="button" onClick={() => setAddEmail(s.email)}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-accent transition-colors ${isSelected ? "bg-accent" : "bg-transparent"}`}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-primary-foreground text-xs font-semibold bg-primary">{initials}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-foreground truncate">{s.firstName} {s.lastName}</div>
                          <div className="text-xs text-muted-foreground truncate">{s.email}</div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t">
              <Button variant="outline" onClick={() => setShowAddStudent(false)}>Hủy</Button>
              <Button onClick={handleAddStudent} disabled={!addEmail.trim() || addLoading} className="gap-2">
                {addLoading && <Loader2 className="w-4 h-4 animate-spin" />} Thêm vào lớp-môn
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal import sinh viên bằng Excel */}
      {showImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !importing && setShowImport(false)}>
          <div className="rounded-xl w-full max-w-lg overflow-hidden border bg-background text-foreground shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Import sinh viên bằng Excel</h3>
              <Button variant="ghost" size="icon" onClick={() => !importing && setShowImport(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg border bg-accent/50 text-foreground text-sm">
                <FileText className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
                <div>File <b>.xlsx</b> gồm cột <b>email, Họ, Tên</b> (bắt buộc) + Giới tính, Ngày sinh, SĐT (tùy chọn). SV chưa có tài khoản sẽ được tạo mới (mật khẩu mặc định <b>123456</b>) và nhận email.</div>
              </div>

              <Button variant="link" onClick={handleDownloadTemplate} className="h-auto p-0 flex items-center gap-2 text-primary">
                <Download className="w-4 h-4" /> Tải file mẫu
              </Button>

              <input type="file" accept=".xlsx"
                onChange={(e) => { setImportFile(e.target.files?.[0] ?? null); setImportResult(null); setImportError(null); }}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:text-xs file:font-medium file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/80 cursor-pointer" />

              {importError && (
                <div className="px-4 py-3 rounded-lg text-sm bg-destructive/10 border border-destructive/20 text-destructive">
                  {importError}
                </div>
              )}

              {importResult && (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { label: "Tạo mới", value: importResult.created, textClass: "text-emerald-600 dark:text-emerald-400" },
                      { label: "Vào lớp", value: importResult.enrolled, textClass: "text-primary" },
                      { label: "Bỏ qua", value: importResult.skipped, textClass: "text-amber-600 dark:text-amber-400" },
                      { label: "Lỗi", value: importResult.failed, textClass: "text-destructive" },
                    ].map((s) => (
                      <div key={s.label} className="rounded-lg py-2 border bg-accent/20">
                        <div className={`text-lg font-bold ${s.textClass}`}>{s.value}</div>
                        <div className="text-[10px] text-muted-foreground">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="max-h-48 overflow-y-auto rounded-lg border border-destructive/20">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-destructive/10 text-destructive font-medium">
                            <th className="text-left px-3 py-2">Dòng</th>
                            <th className="text-left px-3 py-2">Email</th>
                            <th className="text-left px-3 py-2">Lý do</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importResult.errors.map((er, idx) => (
                            <tr key={idx} className="border-t border-destructive/10 hover:bg-destructive/5 text-foreground">
                              <td className="px-3 py-1.5">{er.rowNumber}</td>
                              <td className="px-3 py-1.5 font-mono">{er.email}</td>
                              <td className="px-3 py-1.5 text-destructive">{er.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t">
              <Button variant="outline" onClick={() => setShowImport(false)} disabled={importing}>
                {importResult ? "Đóng" : "Hủy"}
              </Button>
              <Button onClick={handleImport} disabled={!importFile || importing} className="gap-2">
                {importing && <Loader2 className="w-4 h-4 animate-spin" />} {importResult ? "Import lại" : "Tải lên"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
