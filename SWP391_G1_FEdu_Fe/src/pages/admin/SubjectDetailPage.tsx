import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Plus, Edit2, Trash2, Users, Loader2,
  AlertCircle, BookOpen, GraduationCap, X,
  ChevronRight, Map, GitFork, AlertTriangle, CheckCircle,
  Video as VideoIcon, FileText, ArrowUp, ArrowDown, Download
} from "lucide-react";
import { subjectService } from "../../services/subject.service";
import { classroomService } from "../../services/classroom.service";
import { learningPathService } from "../../services/learningPath.service";
import { adminService } from "../../services/admin.service";
import { API_BASE_URL } from "../../services/api.client";
import type { AdminUserResponse } from "../../services/admin.service";
import type { Subject } from "../../types/subject";
import type { ClassroomResponse } from "../../types/classroom";
import type { ClassroomSubjectResponse } from "../../types/classroomSubject";
import type { LearningPathResponse, LearningNodeResponse, NodeEdgeResponse, NodeContentResponse } from "../../services/learningPath.service";
import { toast } from "sonner";

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

  // Template states
  const [templates, setTemplates] = useState<LearningPathResponse[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [nodes, setNodes] = useState<LearningNodeResponse[]>([]);
  const [edges, setEdges] = useState<NodeEdgeResponse[]>([]);
  const [graphs, setGraphs] = useState<Record<number, { nodes: LearningNodeResponse[]; edges: NodeEdgeResponse[] }>>({});
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({});

  // Node content states (materials & tests)
  const [nodeContents, setNodeContents] = useState<Record<number, NodeContentResponse>>({});
  const [loadingContents, setLoadingContents] = useState<Record<number, boolean>>({});

  // Modals state
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);
  const [isEditTemplateOpen, setIsEditTemplateOpen] = useState(false);
  const [isDeleteTplConfirmOpen, setIsDeleteTplConfirmOpen] = useState(false);
  const [isAddNodeOpen, setIsAddNodeOpen] = useState(false);
  const [isEditNodeOpen, setIsEditNodeOpen] = useState(false);
  const [showNodeDeleteConfirm, setShowNodeDeleteConfirm] = useState(false);
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [isAddTestOpen, setIsAddTestOpen] = useState(false);

  // Form states - Template
  const [newTplDesc, setNewTplDesc] = useState("");
  const [newTplLevel, setNewTplLevel] = useState<1 | 2 | 3>(1);
  const [editTplName, setEditTplName] = useState("");
  const [editTplDesc, setEditTplDesc] = useState("");
  const [isSubmittingTemplate, setIsSubmittingTemplate] = useState(false);

  // Form states - Node
  const [nodeToEdit, setNodeToEdit] = useState<LearningNodeResponse | null>(null);
  const [nodeToDelete, setNodeToDelete] = useState<{ nodeId: number; title: string } | null>(null);
  const [newNodeTitle, setNewNodeTitle] = useState("");
  const [newNodeDesc, setNewNodeDesc] = useState("");
  const [newNodeType, setNewNodeType] = useState<'AT_HOME' | 'ON_CLASS'>('AT_HOME');
  const [newNodeStatus, setNewNodeStatus] = useState<'LOCKED' | 'OPEN' | 'HIDDEN'>('OPEN');
  const [newNodeRequired, setNewNodeRequired] = useState(true);
  const [newNodeStageOrder, setNewNodeStageOrder] = useState<number>(1);
  const [newNodeLevel, setNewNodeLevel] = useState<number | "">("");
  const [addNodeParent, setAddNodeParent] = useState<LearningNodeResponse | null>(null);
  const [branchMode, setBranchMode] = useState<'MAIN' | 'SUB'>('MAIN');
  const [addingNode, setAddingNode] = useState(false);
  const submittingNodeRef = useRef(false);

  // Điểm tối thiểu để qua nhánh phụ (dùng khi thêm node nhánh phụ)
  const [edgeMinScore, setEdgeMinScore] = useState("");

  // Form states - Node Content (Materials & Tests)
  const [selectedNodeForContent, setSelectedNodeForContent] = useState<LearningNodeResponse | null>(null);
  const [materialTitle, setMaterialTitle] = useState("");
  const [materialRequired, setMaterialRequired] = useState(true);
  const [materialType, setMaterialType] = useState<'video' | 'file'>('video');
  const [materialVideoUrl, setMaterialVideoUrl] = useState("");
  const [materialVideoDesc, setMaterialVideoDesc] = useState("");
  const [materialVideoDur, setMaterialVideoDur] = useState("");
  const [materialFileUrl, setMaterialFileUrl] = useState("");
  const [materialFileName, setMaterialFileName] = useState("");
  const [materialFileDesc, setMaterialFileDesc] = useState("");
  const [materialSelectedFile, setMaterialSelectedFile] = useState<File | null>(null);
  // Xem trước tài liệu theo đúng định dạng
  const [previewFile, setPreviewFile] = useState<{ url: string; type: string; name: string } | null>(null);
  // PDF được tải dạng blob để xem trực tiếp (tránh X-Frame-Options chặn iframe cross-origin :5173 -> :8080)
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  const [testTitle, setTestTitle] = useState("");
  const [testDesc, setTestDesc] = useState("");
  const [testDuration, setTestDuration] = useState("15");
  const [testPassPercent, setTestPassPercent] = useState("80.00");

  // Fetch subject-level learning path templates
  const fetchTemplates = useCallback(async () => {
    if (!subjectId) return;
    try {
      setLoadingGraph(true);
      const list = await learningPathService.getAdminSubjectTemplates(subjectId);
      setTemplates(list);
      
      const newGraphs: Record<number, { nodes: LearningNodeResponse[]; edges: NodeEdgeResponse[] }> = {};
      const newContents: Record<number, NodeContentResponse> = {};
      
      if (list.length > 0) {
        await Promise.all(
          list.map(async (t) => {
            try {
              const graph = await learningPathService.getAdminTemplateGraph(t.pathId);
              newGraphs[t.pathId] = { nodes: graph.nodes || [], edges: graph.edges || [] };
              
              const allNodes = graph.nodes || [];
              const contentEntries = await Promise.all(
                allNodes.map(async (n) => {
                  try {
                    const content = await learningPathService.getAdminNodeContent(n.nodeId);
                    return [n.nodeId, content] as const;
                  } catch {
                    return [n.nodeId, { materials: [], tests: [] } as NodeContentResponse] as const;
                  }
                })
              );
              
              contentEntries.forEach(([nodeId, content]) => {
                newContents[nodeId] = content;
              });
            } catch (err) {
              console.error(`Failed to load graph for template ${t.pathId}`, err);
            }
          })
        );
        
        setGraphs(newGraphs);
        setNodeContents((prev) => ({ ...prev, ...newContents }));
        
        setSelectedTemplateId((prev) => {
          if (prev && list.some((t) => t.pathId === prev)) {
            return prev;
          }
          return list[0].pathId;
        });
      } else {
        setSelectedTemplateId(null);
        setGraphs({});
        setNodes([]);
        setEdges([]);
        setNodeContents({});
      }
    } catch (e) {
      console.error("Failed to load templates", e);
      toast.error("Không tải được danh sách lộ trình mẫu");
    } finally {
      setLoadingGraph(false);
    }
  }, [subjectId]);



  // Fetch node specific materials and tests
  const fetchNodeContent = async (nodeId: number) => {
    try {
      setLoadingContents((prev) => ({ ...prev, [nodeId]: true }));
      const content = await learningPathService.getAdminNodeContent(nodeId);
      setNodeContents((prev) => ({ ...prev, [nodeId]: content }));
    } catch (err: any) {
      console.error("Failed to load node content", err);
    } finally {
      setLoadingContents((prev) => ({ ...prev, [nodeId]: false }));
    }
  };

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
      await fetchTemplates();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Không tải được dữ liệu môn học");
    } finally {
      setLoading(false);
    }
  }, [subjectId, fetchTemplates]);

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

  // Sync nodes and edges for the currently selected template
  useEffect(() => {
    if (selectedTemplateId && graphs[selectedTemplateId]) {
      setNodes(graphs[selectedTemplateId].nodes);
      setEdges(graphs[selectedTemplateId].edges);
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [selectedTemplateId, graphs]);

  // Khi mở xem trước PDF: tải về dạng blob rồi nhúng bằng object URL.
  // Iframe trỏ thẳng tới :8080 bị Spring Security chặn (X-Frame-Options: DENY),
  // còn blob: cùng origin với trang FE nên hiển thị được.
  useEffect(() => {
    setPreviewBlobUrl(null);
    setPreviewError(false);
    if (!previewFile) return;

    const t = (previewFile.type || "").toLowerCase();
    const ext = (previewFile.url.split(/[?#]/)[0].split(".").pop() || "").toLowerCase();
    const isPdf = t === "application/pdf" || ext === "pdf";
    if (!isPdf) return;

    let objectUrl: string | null = null;
    let cancelled = false;
    setPreviewLoading(true);
    fetch(previewFile.url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPreviewBlobUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setPreviewError(true);
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [previewFile]);

  const handleSelectTemplate = (id: number) => {
    setSelectedTemplateId(id);
    setExpandedNodes({});
    setNodeContents({});
  };

  // Lộ trình theo mức (1=Yếu, 2=Trung bình, 3=Khá)
  const existingLevels = new Set(templates.map((t) => t.level));
  const allThreeExist = existingLevels.has(1) && existingLevels.has(2) && existingLevels.has(3);

  // Sắp xếp node theo thứ tự hiển thị (tie-break nodeId cho ổn định khi trùng order)
  const sortedNodes = [...nodes].sort((a, b) => (a.displayOrder - b.displayOrder) || (a.nodeId - b.nodeId));
  const nodeTotals = sortedNodes.reduce(
    (acc, n) => {
      const c = nodeContents[n.nodeId];
      if (c) {
        acc.videos += c.materials.filter((m) => m.video).length;
        acc.docs += c.materials.filter((m) => m.file).length;
        acc.tests += c.tests.length;
      }
      return acc;
    },
    { videos: 0, docs: 0, tests: 0 }
  );

  // Node "phụ" = có branchName Phụ HOẶC có cạnh fail đi vào (maxScore != null) — bền với data cũ/Unicode
  const isSubNode = (n: LearningNodeResponse) =>
    (n.branchName || "").normalize("NFC").trim().toLowerCase() === "phụ" ||
    edges.some((e) => e.toNodeId === n.nodeId && e.maxScore != null);
  // Node đã có cạnh rẽ nhánh phụ (mang ngưỡng điểm) đi ra hay chưa
  const hasSubChild = (nodeId: number) => edges.some((e) => e.fromNodeId === nodeId && e.maxScore != null);
  // Độ sâu trong nhánh phụ: 0 = node chính, 1 = node phụ #1, 2 = node phụ #2 (nghiệp vụ: tối đa 2)
  const subDepth = (n: LearningNodeResponse, seen: Set<number> = new Set()): number => {
    if (!isSubNode(n)) return 0;
    if (seen.has(n.nodeId)) return 1; // chặn vòng lặp do cạnh loop-back (phụ#2 → phụ#1)
    seen.add(n.nodeId);
    const pe = edges.find((e) => e.toNodeId === n.nodeId);
    const parent = pe ? nodes.find((x) => x.nodeId === pe.fromNodeId) : undefined;
    return parent ? subDepth(parent, seen) + 1 : 1;
  };
  // Tự đánh số "Bài N"; node phụ = "Bài N phụ k" (k = 1, 2) — không nối đệ quy "phụ phụ"
  const stripLessonPrefix = (t: string) => (t || "").replace(/^\s*Bài\s+\d+(\s*phụ(\s*\d+)?)?\s*:?\s*/i, "").trim();
  const nodeLabels: Record<number, string> = {};
  const subInfo: Record<number, { base: string; idx: number }> = {};
  let lessonCounter = 0;
  for (const n of sortedNodes) {
    if (isSubNode(n)) {
      const pe = edges.find((e) => e.toNodeId === n.nodeId);
      const parentId = pe?.fromNodeId;
      const parentSub = parentId != null ? subInfo[parentId] : undefined;
      const base = parentSub
        ? parentSub.base
        : parentId != null
          ? nodeLabels[parentId] || `Bài ${lessonCounter}`
          : `Bài ${lessonCounter}`;
      const idx = parentSub ? parentSub.idx + 1 : 1;
      subInfo[n.nodeId] = { base, idx };
      nodeLabels[n.nodeId] = `${base} phụ ${idx}`;
    } else {
      lessonCounter += 1;
      nodeLabels[n.nodeId] = `Bài ${lessonCounter}`;
    }
  }

  const handlePublish = async () => {
    if (!subject) return;

    // Validate that all 3 roadmaps (Yếu = 1, Trung bình = 2, Khá = 3) are present
    const levels = new Set(templates.map((t) => t.level));
    const missing: string[] = [];
    if (!levels.has(1)) missing.push("Yếu");
    if (!levels.has(2)) missing.push("Trung bình");
    if (!levels.has(3)) missing.push("Khá");

    if (missing.length > 0) {
      toast.error(`Môn học phải có đủ 3 lộ trình (Yếu, Trung bình, Khá) trước khi xuất bản. Còn thiếu: ${missing.join(", ")}`);
      return;
    }

    const requiredLength = subject.learningpathLength || 0;
    if (requiredLength <= 0) {
      toast.error("Môn học chưa cấu hình số chặng (learningpathLength) hợp lệ.");
      return;
    }

    // Validate each roadmap's main node count
    for (const t of templates) {
      const colNodes = graphs[t.pathId]?.nodes || [];
      const mainNodes = colNodes.filter((n) => (n.branchName || "MAIN") !== "SUB");
      if (mainNodes.length !== requiredLength) {
        toast.error(`Lộ trình "${t.pathName}" có ${mainNodes.length} bài học chính, chưa đúng với số chặng yêu cầu của môn học (${requiredLength} bài).`);
        return;
      }
    }

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

  const toggleNode = async (id: number) => {
    const nextState = !expandedNodes[id];
    setExpandedNodes((prev) => ({
      ...prev,
      [id]: nextState,
    }));
    if (nextState && !nodeContents[id]) {
      await fetchNodeContent(id);
    }
  };

  // Template CRUD actions
  const handleCreateTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingTemplate) return;
    try {
      setIsSubmittingTemplate(true);
      const pathName = newTplLevel === 1 ? "Lộ trình Yếu" : newTplLevel === 2 ? "Lộ trình Trung bình" : "Lộ trình Khá";
      const created = await learningPathService.createAdminTemplate({
        subjectId,
        pathName,
        description: newTplDesc,
        level: newTplLevel,
      });

      // Copy existing "Chung" (level === null) nodes from other templates to the newly created template
      const existingTpl = templates.find((t) => graphs[t.pathId]?.nodes?.length > 0);
      if (existingTpl) {
        const existNodes = graphs[existingTpl.pathId].nodes;
        const existEdges = graphs[existingTpl.pathId].edges;
        const chungNodes = existNodes.filter((n) => n.level === null || n.level === undefined);
        
        const idMap: Record<number, number> = {};
        for (const cn of chungNodes) {
          const createdNode = await learningPathService.createAdminNode({
            learningPathId: created.pathId,
            title: cn.title,
            description: cn.description,
            nodeType: cn.nodeType,
            branchName: cn.branchName || "MAIN",
            displayOrder: cn.displayOrder,
            status: cn.status,
            isRequired: cn.isRequired,
            stageOrder: cn.stageOrder || 1,
            level: null,
          });
          idMap[cn.nodeId] = createdNode.nodeId;
        }

        const chungNodeIds = new Set(chungNodes.map((n) => n.nodeId));
        const chungEdges = existEdges.filter(
          (e) => chungNodeIds.has(e.fromNodeId) && chungNodeIds.has(e.toNodeId)
        );
        for (const ce of chungEdges) {
          await learningPathService.createAdminEdge({
            fromNodeId: idMap[ce.fromNodeId],
            toNodeId: idMap[ce.toNodeId],
            branchName: ce.branchName || "MAIN",
            maxScore: ce.maxScore,
          });
        }
      }

      toast.success("Tạo lộ trình mẫu thành công");
      setIsCreateTemplateOpen(false);
      setNewTplDesc("");
      const newExisting = new Set([...templates.map((t) => t.level), created.level]);
      const nextAvailable = ([1, 2, 3] as const).find((lv) => !newExisting.has(lv)) || 1;
      setNewTplLevel(nextAvailable);
      setSelectedTemplateId(created.pathId);
      await fetchTemplates();
    } catch (err: any) {
      toast.error(err.message || "Tạo lộ trình mẫu thất bại");
    } finally {
      setIsSubmittingTemplate(false);
    }
  };

  const handleEditTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplateId || isSubmittingTemplate) return;
    try {
      setIsSubmittingTemplate(true);
      await learningPathService.updateAdminTemplate(selectedTemplateId, {
        pathName: editTplName,
        description: editTplDesc,
      });
      toast.success("Cập nhật lộ trình mẫu thành công");
      setIsEditTemplateOpen(false);
      await fetchTemplates();
    } catch (err: any) {
      toast.error(err.message || "Cập nhật lộ trình mẫu thất bại");
    } finally {
      setIsSubmittingTemplate(false);
    }
  };

  const handleDeleteTemplateConfirm = async () => {
    if (!selectedTemplateId || isSubmittingTemplate) return;
    try {
      setIsSubmittingTemplate(true);
      await learningPathService.deleteAdminTemplate(selectedTemplateId);
      toast.success("Đã xóa lộ trình mẫu");
      setIsDeleteTplConfirmOpen(false);
      setSelectedTemplateId(null);
      await fetchTemplates();
    } catch (err: any) {
      toast.error(err.message || "Xóa lộ trình mẫu thất bại");
    } finally {
      setIsSubmittingTemplate(false);
    }
  };

  // Node CRUD actions
  const resetNodeForm = () => {
    setNewNodeTitle("");
    setNewNodeDesc("");
    setNewNodeType("AT_HOME");
    setNewNodeStatus("OPEN");
    setNewNodeRequired(true);
    setEdgeMinScore("");
    setBranchMode("MAIN");
    setNewNodeStageOrder(1);
    setNewNodeLevel("");
  };

  // "Thêm bài học" ở header = thêm node vào nhánh chính (xương sống), nối tiếp ở cuối
  const openTopLevelAddNode = () => {
    resetNodeForm();
    setAddNodeParent(null);
    setIsAddNodeOpen(true);
  };

  // "Thêm node mới" trong popup 1 node = thêm node sau node đó, chọn nhánh chính/phụ
  const openChildAddNode = (parent: LearningNodeResponse) => {
    resetNodeForm();
    setAddNodeParent(parent);
    // Node nối sau 1 node phụ luôn là node phụ #2 (tiếp nối nhánh phụ)
    if (isSubNode(parent)) setBranchMode("SUB");
    setIsAddNodeOpen(true);
  };

  // Map 1 node -> request (dùng khi cần dồn lại thứ tự khi chèn giữa)
  const nodeToReq = (n: LearningNodeResponse, orderOverride: number) => ({
    title: n.title,
    description: n.description,
    nodeType: n.nodeType,
    branchName: n.branchName || undefined,
    displayOrder: orderOverride,
    status: n.status,
    isRequired: n.isRequired,
  });

  const handleAddNodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeTitle.trim() || !selectedTemplateId) {
      toast.error("Tên bài học không được để trống");
      return;
    }
    const parent = addNodeParent;
    const parentIsSub = !!parent && isSubNode(parent);
    // Nghiệp vụ: nhánh phụ tối đa 2 node → không cho nối thêm sau node phụ #2
    if (parent && subDepth(parent) >= 2) {
      toast.error("Nhánh phụ chỉ gồm tối đa 2 node");
      return;
    }
    // Node nối sau node phụ luôn là node phụ tiếp theo, dù chọn nhánh nào
    const isSub = parentIsSub || (!!parent && branchMode === "SUB");
    // Mỗi node chính chỉ rẽ được 1 nhánh phụ
    if (isSub && parent && !parentIsSub && hasSubChild(parent.nodeId)) {
      toast.error("Mỗi node chỉ có 1 nhánh phụ");
      return;
    }
    if (isSub && !edgeMinScore) {
      toast.error("Vui lòng nhập điểm tối thiểu cho nhánh phụ");
      return;
    }
    if (submittingNodeRef.current) return; // đang tạo → bỏ qua click thứ 2
    submittingNodeRef.current = true;
    setAddingNode(true);
    try {
      const branchName = isSub ? "SUB" : "MAIN";

      const targetLevels: number[] = [];
      if (newNodeLevel === "") {
        // Chung: Add to all templates
        targetLevels.push(1, 2, 3);
      } else {
        // Specific level: only add to that template
        targetLevels.push(Number(newNodeLevel));
      }

      for (const lv of targetLevels) {
        const t = templates.find((x) => x.level != null && Number(x.level) === lv);
        if (!t) continue; // template of this level doesn't exist yet

        const colNodes = graphs[t.pathId]?.nodes || [];
        const mainNodes = colNodes.filter((n) => (n.branchName || "MAIN") !== "SUB");
        
        let parentInTpl = null;
        if (parent) {
          // If parent belongs to the target template, use it directly
          if (parent.learningPathId === t.pathId) {
            parentInTpl = parent;
          } else {
            // Find corresponding parent node in the target template
            parentInTpl = colNodes.find(
              (n) => n.title === parent.title || n.displayOrder === parent.displayOrder
            ) || null;
          }
        }

        let order: number;
        if (!parentInTpl) {
          order = mainNodes.reduce((m, n) => Math.max(m, n.displayOrder), 0) + 1;
        } else {
          order = parentInTpl.displayOrder + 1;
          const toShift = colNodes
            .filter((n) => n.displayOrder >= order)
            .sort((a, b) => b.displayOrder - a.displayOrder);
          for (const n of toShift) {
            await learningPathService.updateAdminNode(n.nodeId, nodeToReq(n, n.displayOrder + 1));
          }
        }

        const createdNode = await learningPathService.createAdminNode({
          learningPathId: t.pathId,
          title: newNodeTitle,
          description: newNodeDesc,
          nodeType: newNodeType,
          branchName,
          displayOrder: order,
          status: newNodeStatus,
          isRequired: newNodeRequired,
          stageOrder: newNodeStageOrder,
          level: newNodeLevel !== "" ? Number(newNodeLevel) : null,
        });

        if (parentInTpl) {
          if (isSub) {
            await learningPathService.createAdminEdge({
              fromNodeId: parentInTpl.nodeId,
              toNodeId: createdNode.nodeId,
              branchName: "SUB",
              maxScore: Number(edgeMinScore),
            });
          } else {
            await learningPathService.createAdminEdge({
              fromNodeId: parentInTpl.nodeId,
              toNodeId: createdNode.nodeId,
              branchName: "MAIN",
            });
          }
        } else {
          const lastMain = [...mainNodes].sort((a, b) => b.displayOrder - a.displayOrder)[0];
          if (lastMain) {
            await learningPathService.createAdminEdge({
              fromNodeId: lastMain.nodeId,
              toNodeId: createdNode.nodeId,
              branchName: "MAIN",
            });
          }
        }
      }

      toast.success("Thêm bài học thành công");
      setIsAddNodeOpen(false);
      setAddNodeParent(null);
      resetNodeForm();
      await fetchTemplates();
    } catch (err: any) {
      toast.error(err.message || "Không tạo được bài học mới");
    } finally {
      submittingNodeRef.current = false;
      setAddingNode(false);
    }
  };

  const handleEditNodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeToEdit || !selectedTemplateId) return;
    try {
      await learningPathService.updateAdminNode(nodeToEdit.nodeId, {
        title: nodeToEdit.title,
        description: nodeToEdit.description,
        nodeType: nodeToEdit.nodeType,
        status: nodeToEdit.status,
        displayOrder: nodeToEdit.displayOrder,
        isRequired: nodeToEdit.isRequired,
        branchName: nodeToEdit.branchName || undefined,
      });
      toast.success("Cập nhật bài học thành công");
      setIsEditNodeOpen(false);
      setNodeToEdit(null);
      await fetchTemplates();
    } catch (err: any) {
      toast.error(err.message || "Cập nhật bài học thất bại");
    }
  };

  const handleDeleteNodeConfirm = async () => {
    if (!nodeToDelete || !selectedTemplateId) return;
    try {
      const deleted = nodes.find((n) => n.nodeId === nodeToDelete.nodeId);
      await learningPathService.deleteAdminNode(nodeToDelete.nodeId);
      // Dồn thứ tự: các node sau node bị xóa giảm 1 (thấp->cao để tránh trùng)
      if (deleted) {
        const toShift = nodes
          .filter((n) => n.nodeId !== nodeToDelete.nodeId && n.displayOrder > deleted.displayOrder)
          .sort((a, b) => a.displayOrder - b.displayOrder);
        for (const n of toShift) {
          await learningPathService.updateAdminNode(n.nodeId, nodeToReq(n, n.displayOrder - 1));
        }
      }
      toast.success(`Đã xóa bài học "${nodeToDelete.title}"`);
      setShowNodeDeleteConfirm(false);
      setNodeToDelete(null);
      await fetchTemplates();
    } catch (err: any) {
      toast.error(err.message || "Không xóa được bài học");
    }
  };

  // Edge CRUD actions
  const handleDeleteEdge = async (edgeId: number) => {
    if (!selectedTemplateId) return;
    try {
      await learningPathService.deleteAdminEdge(edgeId);
      toast.success("Đã xóa liên kết tiên quyết");
      await fetchTemplates();
    } catch (err: any) {
      toast.error(err.message || "Xóa liên kết tiên quyết thất bại");
    }
  };

  // Node Content CRUD actions
  const handleAddMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialTitle.trim() || !selectedNodeForContent) {
      toast.error("Vui lòng nhập tiêu đề tài liệu");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("title", materialTitle);
      formData.append("required", String(materialRequired));

      if (materialType === 'video') {
        if (!materialVideoUrl.trim()) {
          toast.error("Vui lòng nhập link video");
          return;
        }
        formData.append("videoUrl", materialVideoUrl);
        formData.append("videoTitle", materialTitle);
        if (materialVideoDur) {
          formData.append("videoDuration", materialVideoDur);
        }
        formData.append("videoDescription", materialVideoDesc);
      } else {
        if (materialSelectedFile) {
          formData.append("file", materialSelectedFile);
        } else if (materialFileUrl.trim()) {
          formData.append("fileUrl", materialFileUrl);
        } else {
          toast.error("Vui lòng chọn file tải lên hoặc nhập link file");
          return;
        }
        formData.append("fileName", materialFileName || materialSelectedFile?.name || "Tài liệu");
        formData.append("fileDescription", materialFileDesc);
      }

      await learningPathService.addAdminNodeMaterial(selectedNodeForContent.nodeId, formData);
      toast.success("Thêm tài liệu học tập thành công");
      setIsAddMaterialOpen(false);

      // Reset form
      const targetNodeId = selectedNodeForContent.nodeId;
      setMaterialTitle("");
      setMaterialRequired(true);
      setMaterialVideoUrl("");
      setMaterialVideoDesc("");
      setMaterialVideoDur("");
      setMaterialFileUrl("");
      setMaterialFileName("");
      setMaterialFileDesc("");
      setMaterialSelectedFile(null);
      setSelectedNodeForContent(null);

      await fetchNodeContent(targetNodeId);
    } catch (err: any) {
      toast.error(err.message || "Thêm tài liệu thất bại");
    }
  };

  const handleAddTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle.trim() || !selectedNodeForContent) {
      toast.error("Vui lòng nhập tiêu đề bài kiểm tra");
      return;
    }
    try {
      const targetNodeId = selectedNodeForContent.nodeId;
      await learningPathService.addAdminNodeTest(targetNodeId, {
        title: testTitle,
        description: testDesc,
        durationMinutes: testDuration ? Number(testDuration) : undefined,
        passingPercentage: testPassPercent ? Number(testPassPercent) : undefined,
      });
      toast.success("Thêm bài kiểm tra thành công");
      setIsAddTestOpen(false);

      // Reset form
      setTestTitle("");
      setTestDesc("");
      setTestDuration("15");
      setTestPassPercent("80.00");
      setSelectedNodeForContent(null);

      await fetchNodeContent(targetNodeId);
    } catch (err: any) {
      toast.error(err.message || "Thêm bài kiểm tra thất bại");
    }
  };

  const handleDeleteMaterial = async (materialId: number, nodeId: number) => {
    try {
      await learningPathService.deleteAdminNodeMaterial(materialId);
      toast.success("Đã xóa tài liệu học tập");
      await fetchNodeContent(nodeId);
    } catch (err: any) {
      toast.error(err.message || "Xóa tài liệu thất bại");
    }
  };

  const handleDeleteTest = async (testId: number, nodeId: number) => {
    try {
      await learningPathService.deleteAdminNodeTest(testId);
      toast.success("Đã xóa bài kiểm tra");
      await fetchNodeContent(nodeId);
    } catch (err: any) {
      toast.error(err.message || "Xóa bài kiểm tra thất bại");
    }
  };

  const getSortedTimelineItems = (nodeId: number) => {
    const content = nodeContents[nodeId];
    if (!content) return [];
    const materials = (content.materials || []).map((m) => ({
      key: `material-${m.materialId}`,
      id: m.materialId,
      type: "MATERIAL" as const,
      title: m.title,
      orderIndex: m.orderIndex ?? 9999,
      data: m,
    }));
    const tests = (content.tests || []).map((t) => ({
      key: `test-${t.testId}`,
      id: t.testId,
      type: "TEST" as const,
      title: t.title,
      orderIndex: t.orderIndex ?? 9999,
      data: t,
    }));
    return [...materials, ...tests].sort((a, b) => a.orderIndex - b.orderIndex);
  };

  const handleReorderContent = async (
    nodeId: number,
    itemId: number,
    type: "MATERIAL" | "TEST",
    direction: "up" | "down"
  ) => {
    const items = getSortedTimelineItems(nodeId);
    const index = items.findIndex((item) => item.id === itemId && item.type === type);
    if (index === -1) return;

    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === items.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    const requests = newItems.map((item, idx) => ({
      id: item.id,
      type: item.type,
      orderIndex: idx + 1,
    }));

    try {
      // Optimistic update
      const updatedMaterials = (nodeContents[nodeId]?.materials || []).map((m) => {
        const req = requests.find((r) => r.id === m.materialId && r.type === "MATERIAL");
        return req ? { ...m, orderIndex: req.orderIndex } : m;
      });
      const updatedTests = (nodeContents[nodeId]?.tests || []).map((t) => {
        const req = requests.find((r) => r.id === t.testId && r.type === "TEST");
        return req ? { ...t, orderIndex: req.orderIndex } : t;
      });
      setNodeContents((prev) => ({
        ...prev,
        [nodeId]: {
          materials: updatedMaterials,
          tests: updatedTests,
        },
      }));

      await learningPathService.reorderAdminNodeContent(nodeId, requests);
      toast.success("Cập nhật thứ tự thành công");
      await fetchNodeContent(nodeId);
    } catch (err: any) {
      toast.error(err.message || "Cập nhật thứ tự thất bại");
      await fetchNodeContent(nodeId);
    }
  };

  const isSubjectPublished = subject?.status === "published";

  const renderRoadmapColumn = (level: 1 | 2 | 3, title: string, defaultDesc: string) => {
    const tpl = templates.find((t) => t.level === level);

    if (!tpl) {
      return (
        <div className="rounded-xl p-6 bg-white border border-gray-200 shadow-sm flex flex-col justify-between min-h-[400px]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-gray-400" />
              <h3 className="font-bold text-lg text-gray-900">{title}</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6">{defaultDesc}</p>
            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <Map className="w-8 h-8 mx-auto text-gray-300 mb-2" />
              <p className="text-xs text-gray-400">Chưa thiết lập lộ trình cho mức này.</p>
            </div>
          </div>
          <button
            onClick={() => {
              setNewTplLevel(level);
              setIsCreateTemplateOpen(true);
            }}
            className="w-full mt-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-lg border border-indigo-200 transition-colors"
          >
            + Khởi tạo lộ trình
          </button>
        </div>
      );
    }

    const colNodes = graphs[tpl.pathId]?.nodes || [];
    const colEdges = graphs[tpl.pathId]?.edges || [];
    
    // Sort nodes by displayOrder, then nodeId
    const sortedColNodes = [...colNodes].sort((a, b) => (a.displayOrder - b.displayOrder) || (a.nodeId - b.nodeId));

    // Helper functions for this column
    const isColSubNode = (n: LearningNodeResponse) =>
      (n.branchName || "").normalize("NFC").trim().toLowerCase() === "phụ" ||
      colEdges.some((e) => e.toNodeId === n.nodeId && e.maxScore != null);

    const hasColSubChild = (nodeId: number) => colEdges.some((e) => e.fromNodeId === nodeId && e.maxScore != null);

    const colSubDepth = (n: LearningNodeResponse, seen: Set<number> = new Set()): number => {
      if (!isColSubNode(n)) return 0;
      if (seen.has(n.nodeId)) return 1;
      seen.add(n.nodeId);
      const pe = colEdges.find((e) => e.toNodeId === n.nodeId);
      const parent = pe ? colNodes.find((x) => x.nodeId === pe.fromNodeId) : undefined;
      return parent ? colSubDepth(parent, seen) + 1 : 1;
    };

    // Build node labels for this column
    const colNodeLabels: Record<number, string> = {};
    const colSubInfo: Record<number, { base: string; idx: number }> = {};
    let colLessonCounter = 0;
    for (const n of sortedColNodes) {
      if (isColSubNode(n)) {
        const pe = colEdges.find((e) => e.toNodeId === n.nodeId);
        const parentId = pe?.fromNodeId;
        const parentSub = parentId != null ? colSubInfo[parentId] : undefined;
        const base = parentSub
          ? parentSub.base
          : parentId != null
            ? colNodeLabels[parentId] || `Bài ${colLessonCounter}`
            : `Bài ${colLessonCounter}`;
        const idx = parentSub ? parentSub.idx + 1 : 1;
        colSubInfo[n.nodeId] = { base, idx };
        colNodeLabels[n.nodeId] = `${base} phụ ${idx}`;
      } else {
        colLessonCounter += 1;
        colNodeLabels[n.nodeId] = `Bài ${colLessonCounter}`;
      }
    }

    // Totals for this column
    const colTotals = sortedColNodes.reduce(
      (acc, n) => {
        const c = nodeContents[n.nodeId];
        if (c) {
          acc.videos += c.materials.filter((m) => m.video).length;
          acc.docs += c.materials.filter((m) => m.file).length;
          acc.tests += c.tests.length;
        }
        return acc;
      },
      { videos: 0, docs: 0, tests: 0 }
    );

    return (
      <div className="rounded-xl p-6 bg-white border border-gray-200 shadow-sm flex flex-col justify-between min-h-[500px]">
        <div>
          {/* Column Header */}
          <div className="pb-4 mb-4 border-b border-gray-200 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-5 h-5 text-indigo-600 shrink-0" />
                <h3 className="font-bold text-lg text-gray-900 truncate">{tpl.pathName}</h3>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2" title={tpl.description || ""}>
                {tpl.description || "Chưa có mô tả chi tiết."}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => {
                  setSelectedTemplateId(tpl.pathId);
                  setEditTplName(tpl.pathName);
                  setEditTplDesc(tpl.description || "");
                  setIsEditTemplateOpen(true);
                }}
                className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Sửa mô tả lộ trình"
              >
                <Edit2 className="w-3.5 h-3.5 text-gray-500" />
              </button>
              <button
                onClick={() => {
                  setSelectedTemplateId(tpl.pathId);
                  setIsDeleteTplConfirmOpen(true);
                }}
                className="p-1.5 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                title="Xóa lộ trình mẫu"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          {sortedColNodes.length > 0 && (
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 pb-3 mb-3 border-b border-gray-200 text-[11px] text-gray-500">
              <span className="flex items-center gap-1 font-medium"><BookOpen className="w-3.5 h-3.5 text-indigo-600" /> {sortedColNodes.length} bài</span>
              <span className="flex items-center gap-1"><VideoIcon className="w-3.5 h-3.5 text-purple-500" /> {colTotals.videos} video</span>
              <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-orange-500" /> {colTotals.docs} tài liệu</span>
              <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5 text-teal-500" /> {colTotals.tests} test</span>
            </div>
          )}

          {/* Timeline Tree Nodes */}
          {sortedColNodes.length === 0 ? (
            <div className="text-center py-12 text-gray-400 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
              <Map className="w-8 h-8 mx-auto text-gray-300 mb-2 animate-pulse" />
              <p className="text-xs">Chưa có bài học nào trong lộ trình mẫu này.</p>
              <button
                onClick={() => {
                  setSelectedTemplateId(tpl.pathId);
                  resetNodeForm();
                  setAddNodeParent(null);
                  setIsAddNodeOpen(true);
                }}
                className="mt-3 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors"
              >
                Tạo bài học đầu tiên
              </button>
            </div>
          ) : (
            <div className="relative border-l border-indigo-150 ml-3 pl-4 space-y-4 py-2">
              {sortedColNodes.map((node) => {
                const isExpanded = !!expandedNodes[node.nodeId];
                const isSub = isColSubNode(node);
                const depth = colSubDepth(node);
                const incomingEdges = colEdges.filter((e) => e.toNodeId === node.nodeId);
                const incomingNodesInfo = incomingEdges.map((e) => {
                  const fromNode = colNodes.find((n) => n.nodeId === e.fromNodeId);
                  return {
                    edgeId: e.edgeId,
                    fromTitle: fromNode ? fromNode.title : `Node #${e.fromNodeId}`,
                    minScore: e.minScore,
                    maxScore: e.maxScore,
                  };
                });
                const canAddChild = isSub ? depth < 2 && !hasColSubChild(node.nodeId) : true;

                return (
                  <div
                    key={node.nodeId}
                    className={`relative group transition-all duration-200 ${
                      isSub ? "ml-6 pl-2" : ""
                    }`}
                  >
                    {/* Node Dot / Branch Connector */}
                    {isSub ? (
                      // Branch connector drawing
                      <div className="absolute -left-[30px] top-[14px] flex items-center">
                        <div className="w-[18px] h-0.5 bg-indigo-200"></div>
                        <div className="w-2.5 h-2.5 rounded-full border border-indigo-400 bg-indigo-50"></div>
                      </div>
                    ) : (
                      // Main timeline dot
                      <div
                        className={`absolute -left-[22px] top-[12px] w-3 h-3 rounded-full border-2 bg-white transition-colors duration-200 ${
                          isSubjectPublished
                            ? "border-green-500 group-hover:bg-green-100"
                            : "border-indigo-500 group-hover:bg-indigo-100"
                        }`}
                      />
                    )}

                    {/* Node Box */}
                    <div
                      className={`rounded-xl border transition-all overflow-hidden ${
                        isExpanded
                          ? "bg-white border-indigo-300 shadow-sm"
                          : "bg-gray-50/50 hover:bg-white hover:border-gray-300 border-gray-200"
                      }`}
                    >
                      {/* Node Header */}
                      <div
                        onClick={() => toggleNode(node.nodeId)}
                        className="flex items-center justify-between p-3.5 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className={`p-0.5 rounded transition-transform duration-200 shrink-0 ${isExpanded ? "rotate-90" : ""}`}>
                            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`font-semibold text-xs ${node.status === "LOCKED" ? "text-gray-500" : "text-gray-900"}`}>
                                {colNodeLabels[node.nodeId]}: {stripLessonPrefix(node.title)}
                              </span>
                              {isSub && (
                                <span className="text-[9px] px-1 bg-amber-50 text-amber-700 border border-amber-200 rounded font-medium shrink-0 flex items-center gap-0.5">
                                  <GitFork className="w-2.5 h-2.5" /> Nhánh phụ
                                </span>
                              )}
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium shrink-0">
                                {node.nodeType === "ON_CLASS" ? "Lên lớp" : "Tự học"}
                              </span>
                              {node.isRequired && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-50 text-red-600 border border-red-100 font-medium shrink-0">
                                  Bắt buộc
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Node Expanded Body */}
                      {isExpanded && (
                        <div className="px-3.5 pb-3.5 pt-1.5 bg-gray-50/30 border-t border-gray-150 space-y-3">
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {node.description || "Chưa có mô tả chi tiết."}
                          </p>



                          {/* Prerequisites info */}
                          {incomingNodesInfo.length > 0 && (
                            <div className="text-[11px] border border-gray-150 bg-white rounded-lg p-2.5 space-y-1.5">
                              <div className="font-semibold text-gray-700 flex items-center gap-1">
                                <GitFork className="w-3 h-3 text-indigo-600" />
                                <span>Điều kiện tiên quyết:</span>
                              </div>
                              <div className="divide-y divide-gray-100">
                                {incomingNodesInfo.map((info) => (
                                  <div key={info.edgeId} className="flex items-center justify-between py-1">
                                    <span className="text-gray-600 truncate max-w-[85%]">
                                      Sau: <strong className="text-gray-800">{info.fromTitle}</strong>
                                      {info.maxScore !== null && (
                                        <span className="text-red-500 font-semibold ml-1">
                                          (Điểm dưới {info.maxScore})
                                        </span>
                                      )}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedTemplateId(tpl.pathId);
                                        handleDeleteEdge(info.edgeId);
                                      }}
                                      className="p-0.5 rounded text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors shrink-0"
                                      title="Xóa liên kết"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Materials & Tests Card */}
                          <div className="border border-gray-200 rounded-lg p-2.5 bg-white space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-gray-700 flex items-center gap-1">
                                <BookOpen className="w-3 h-3 text-indigo-600" />
                                Nội dung học tập
                              </span>
                              <div className="flex items-center gap-1.5 text-[9px] font-bold text-indigo-600">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTemplateId(tpl.pathId);
                                    setSelectedNodeForContent(node);
                                    setIsAddMaterialOpen(true);
                                  }}
                                  className="hover:text-indigo-850 hover:underline"
                                >
                                  + Tài liệu
                                </button>
                                <span className="text-gray-300">|</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTemplateId(tpl.pathId);
                                    setSelectedNodeForContent(node);
                                    setIsAddTestOpen(true);
                                  }}
                                  className="hover:text-indigo-850 hover:underline"
                                >
                                  + Test
                                </button>
                              </div>
                            </div>

                            {loadingContents[node.nodeId] ? (
                              <div className="flex items-center gap-1.5 py-1 text-[11px] text-gray-400">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Đang tải...
                              </div>
                            ) : (() => {
                              const sortedItems = getSortedTimelineItems(node.nodeId);
                              if (sortedItems.length === 0) {
                                return (
                                  <div className="text-[10px] text-gray-400 italic py-1.5 text-center bg-gray-50 rounded border border-dashed border-gray-200">
                                    Chưa có tài liệu/bài test.
                                  </div>
                                );
                              }
                              return (
                                <div className="space-y-1.5">
                                  {sortedItems.map((item, index) => {
                                    const isMaterial = item.type === "MATERIAL";
                                    const m = isMaterial ? item.data : null;
                                    const t = !isMaterial ? item.data : null;

                                    return (
                                      <div
                                        key={item.key}
                                        className="flex items-start gap-1.5 p-1.5 bg-gray-50 rounded border border-gray-150 text-[11px] hover:border-indigo-200 transition-colors"
                                      >
                                        {/* Reorder Buttons */}
                                        <div className="flex flex-col gap-0.5 shrink-0 pt-0.5">
                                          <button
                                            disabled={index === 0}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleReorderContent(node.nodeId, item.id, item.type, "up");
                                            }}
                                            className={`p-0.5 rounded ${
                                              index === 0
                                                ? "text-gray-300 cursor-not-allowed opacity-50"
                                                : "text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                                            }`}
                                            title="Di chuyển lên"
                                          >
                                            <ArrowUp className="w-3 h-3" />
                                          </button>
                                          <button
                                            disabled={index === sortedItems.length - 1}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleReorderContent(node.nodeId, item.id, item.type, "down");
                                            }}
                                            className={`p-0.5 rounded ${
                                              index === sortedItems.length - 1
                                                ? "text-gray-300 cursor-not-allowed opacity-50"
                                                : "text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                                            }`}
                                            title="Di chuyển xuống"
                                          >
                                            <ArrowDown className="w-3 h-3" />
                                          </button>
                                        </div>

                                        {/* Item Info */}
                                        <div className="space-y-0.5 flex-1 pr-1 min-w-0">
                                          <div className="font-semibold text-gray-800 flex items-center gap-1 flex-wrap">
                                            {isMaterial ? (
                                              <>
                                                <BookOpen className="w-3 h-3 text-indigo-500 shrink-0" />
                                                <span className="truncate max-w-[120px]" title={item.title}>{item.title}</span>
                                                {m?.required && (
                                                  <span className="text-[8px] px-0.5 bg-red-50 text-red-500 rounded font-bold border border-red-100 shrink-0">
                                                    Yêu cầu
                                                  </span>
                                                )}
                                              </>
                                            ) : (
                                              <>
                                                <GraduationCap className="w-3 h-3 text-teal-500 shrink-0" />
                                                <span className="truncate max-w-[120px]" title={item.title}>{item.title}</span>
                                              </>
                                            )}
                                          </div>

                                          {isMaterial && m?.video && (
                                            <div className="text-gray-500 flex items-center gap-1 text-[10px]">
                                              <span className="px-0.5 py-0.1 bg-teal-50 text-teal-700 border border-teal-100 rounded text-[8px] font-semibold shrink-0">Video</span>
                                              <a
                                                href={m.video.videoUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-indigo-600 hover:underline truncate max-w-[100px]"
                                                title={m.video.videoUrl}
                                              >
                                                Xem video
                                              </a>
                                            </div>
                                          )}
                                          {isMaterial && m?.file && (
                                            <div className="text-gray-500 flex items-center gap-1 text-[10px]">
                                              <span className="px-0.5 py-0.1 bg-orange-50 text-orange-700 border border-orange-100 rounded text-[8px] font-semibold shrink-0">File</span>
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  const f = m!.file!;
                                                  const url = f.fileUrl.startsWith("/") ? `${API_BASE_URL}${f.fileUrl}` : f.fileUrl;
                                                  setPreviewFile({ url, type: f.fileType || "", name: f.fileName || "Tài liệu" });
                                                }}
                                                className="text-indigo-600 hover:underline truncate max-w-[100px] text-left"
                                              >
                                                {m.file.fileName || "Tài liệu"}
                                              </button>
                                            </div>
                                          )}
                                          {!isMaterial && t && (
                                            <div className="text-[9px] text-gray-500">
                                              <span>{t.durationMinutes || "—"}p</span>
                                              {t.passingPercentage !== undefined && (
                                                <span className="ml-1.5">chuẩn: {t.passingPercentage}%</span>
                                              )}
                                            </div>
                                          )}
                                        </div>

                                        {/* Actions (Delete) */}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (isMaterial) {
                                              handleDeleteMaterial(item.id, node.nodeId);
                                            } else {
                                              handleDeleteTest(item.id, node.nodeId);
                                            }
                                          }}
                                          className="p-0.5 rounded text-red-500 hover:bg-red-50 hover:text-red-700 shrink-0 self-center"
                                          title={isMaterial ? "Xóa tài liệu" : "Xóa bài kiểm tra"}
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5 pt-2 border-t border-gray-200/50">
                            {canAddChild && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTemplateId(tpl.pathId);
                                  openChildAddNode(node);
                                }}
                                className="flex items-center gap-0.5 px-2 py-1 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 rounded-md text-[10px] font-bold text-indigo-700 transition-colors"
                              >
                                <Plus className="w-3 h-3" /> Node mới
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTemplateId(tpl.pathId);
                                setNodeToEdit(node);
                                setIsEditNodeOpen(true);
                              }}
                              className="flex items-center gap-0.5 px-2 py-1 border border-gray-300 bg-white hover:bg-gray-100 rounded-md text-[10px] font-bold text-gray-700 transition-colors"
                            >
                              <Edit2 className="w-3 h-3" /> Sửa
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTemplateId(tpl.pathId);
                                setNodeToDelete({ nodeId: node.nodeId, title: node.title });
                                setShowNodeDeleteConfirm(true);
                              }}
                              className="flex items-center gap-0.5 px-2 py-1 border border-red-200 bg-white hover:bg-red-50 rounded-md text-[10px] font-bold text-red-600 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" /> Xóa
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Column Footer: "+ Thêm bài học" */}
        <button
          onClick={() => {
            setSelectedTemplateId(tpl.pathId);
            openTopLevelAddNode();
          }}
          className="w-full mt-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Thêm bài học
        </button>
      </div>
    );
  };

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
          onClick={() => navigate("/admin/subjects")}
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

      {/* Parallel Roadmap Columns Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 pl-1">
          <Map className="w-5 h-5 text-indigo-600" />
          Thiết kế lộ trình học tập song song
        </h2>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {renderRoadmapColumn(1, "Lộ trình Yếu", "Lộ trình dành cho học sinh có năng lực yếu, tập trung bổ trợ kiến thức cơ bản.")}
          {renderRoadmapColumn(2, "Lộ trình Trung bình", "Lộ trình chuẩn cho học sinh có năng lực trung bình, bám sát khung chương trình chính.")}
          {renderRoadmapColumn(3, "Lộ trình Khá", "Lộ trình nâng cao cho học sinh khá giỏi, tích hợp các bài toán/chủ đề chuyên sâu.")}
        </div>
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
      {isCreateTemplateOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-150">
              <h2 className="text-lg font-bold text-gray-900">Tạo lộ trình mẫu mới</h2>
              <button onClick={() => setIsCreateTemplateOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTemplateSubmit} className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Loại lộ trình *</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newTplLevel}
                  onChange={(e) => setNewTplLevel(Number(e.target.value) as 1 | 2 | 3)}
                >
                  <option value={1} disabled={existingLevels.has(1)}>Lộ trình Yếu{existingLevels.has(1) ? " (đã có)" : ""}</option>
                  <option value={2} disabled={existingLevels.has(2)}>Lộ trình Trung bình{existingLevels.has(2) ? " (đã có)" : ""}</option>
                  <option value={3} disabled={existingLevels.has(3)}>Lộ trình Khá{existingLevels.has(3) ? " (đã có)" : ""}</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Mô tả ngắn</label>
                <textarea
                  placeholder="Mô tả tóm tắt nội dung lộ trình này..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newTplDesc}
                  onChange={(e) => setNewTplDesc(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreateTemplateOpen(false)}
                  disabled={isSubmittingTemplate}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTemplate}
                  className="px-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)" }}
                >
                  {isSubmittingTemplate ? "Đang tạo..." : "Tạo lộ trình"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TEMPLATE MODAL */}
      {isEditTemplateOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-150">
              <h2 className="text-lg font-bold text-gray-900">Sửa lộ trình mẫu</h2>
              <button onClick={() => setIsEditTemplateOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditTemplateSubmit} className="p-4 space-y-4">
              <div className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-150 text-sm text-gray-600">
                Lộ trình: <span className="font-semibold text-gray-800">{editTplName}</span>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Mô tả ngắn</label>
                <textarea
                  placeholder="Mô tả tóm tắt..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={editTplDesc}
                  onChange={(e) => setEditTplDesc(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditTemplateOpen(false)}
                  disabled={isSubmittingTemplate}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTemplate}
                  className="px-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)" }}
                >
                  {isSubmittingTemplate ? "Đang cập nhật..." : "Cập nhật"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE TEMPLATE CONFIRM MODAL */}
      {isDeleteTplConfirmOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200 p-6 space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              <h2 className="text-lg font-bold">Xác nhận xóa lộ trình</h2>
            </div>
            <p className="text-sm text-gray-600">
              Bạn có chắc chắn muốn xóa lộ trình mẫu này? Hành động này sẽ xóa tất cả các bài học và liên kết nằm trong lộ trình này, không thể khôi phục.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsDeleteTplConfirmOpen(false)}
                disabled={isSubmittingTemplate}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteTemplateConfirm}
                disabled={isSubmittingTemplate}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {isSubmittingTemplate ? "Đang xóa..." : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD NODE MODAL */}
      {isAddNodeOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-150">
              <h2 className="text-lg font-bold text-gray-900">{addNodeParent ? `Thêm node sau: ${addNodeParent.title}` : "Thêm bài học"}</h2>
              <button onClick={() => { setIsAddNodeOpen(false); setAddNodeParent(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddNodeSubmit} className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Tên bài học *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Bảng chữ cái Hiragana"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newNodeTitle}
                  onChange={(e) => setNewNodeTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Mô tả bài học</label>
                <textarea
                  placeholder="Nội dung, mục tiêu của bài học này..."
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newNodeDesc}
                  onChange={(e) => setNewNodeDesc(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Loại bài học</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  value={newNodeType}
                  onChange={(e) => setNewNodeType(e.target.value as any)}
                >
                  <option value="AT_HOME">Tự học</option>
                  <option value="ON_CLASS">Lên lớp</option>
                </select>
              </div>
              {addNodeParent && (
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Nhánh</label>
                  {isSubNode(addNodeParent) ? (
                    <div className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600">
                      Nhánh phụ – node thứ 2
                    </div>
                  ) : (
                    <>
                      <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        value={branchMode}
                        onChange={(e) => setBranchMode(e.target.value as 'MAIN' | 'SUB')}
                      >
                        <option value="MAIN">Nhánh chính</option>
                        {!hasSubChild(addNodeParent.nodeId) && <option value="SUB">Nhánh phụ</option>}
                      </select>
                      {hasSubChild(addNodeParent.nodeId) && (
                        <p className="text-xs text-gray-500">Node này đã có nhánh phụ nên chỉ thêm được nhánh chính.</p>
                      )}
                    </>
                  )}
                </div>
              )}

              {addNodeParent && branchMode === "SUB" && (
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Điểm tối thiểu để qua *</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder="VD: 80"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={edgeMinScore}
                    onChange={(e) => setEdgeMinScore(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Chặng (stageOrder)</label>
                <input
                  type="number"
                  min={1}
                  placeholder="Ví dụ: 1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newNodeStageOrder}
                  onChange={(e) => setNewNodeStageOrder(Number(e.target.value))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Mức năng lực (level)</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  value={newNodeLevel}
                  onChange={(e) => setNewNodeLevel(e.target.value === "" ? "" : Number(e.target.value))}
                >
                  <option value="">Chung (Mọi mức đều học)</option>
                  <option value={1}>Yếu (1)</option>
                  <option value={2}>Trung bình (2)</option>
                  <option value={3}>Khá (3)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="newNodeRequiredChk"
                  className="rounded text-indigo-600 focus:ring-indigo-500 size-4 cursor-pointer"
                  checked={newNodeRequired}
                  onChange={(e) => setNewNodeRequired(e.target.checked)}
                />
                <label htmlFor="newNodeRequiredChk" className="text-sm font-semibold text-gray-700 cursor-pointer select-none">
                  Mốc bắt buộc hoàn thành
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { setIsAddNodeOpen(false); setAddNodeParent(null); }}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={addingNode}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)" }}
                >
                  {addingNode && <Loader2 className="w-4 h-4 animate-spin" />} Tạo bài học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT NODE MODAL */}
      {isEditNodeOpen && nodeToEdit && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-150">
              <h2 className="text-lg font-bold text-gray-900">Sửa bài học</h2>
              <button onClick={() => { setIsEditNodeOpen(false); setNodeToEdit(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditNodeSubmit} className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Tên bài học *</label>
                <input
                  type="text"
                  required
                  placeholder="Tên bài học..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={nodeToEdit.title}
                  onChange={(e) => setNodeToEdit({ ...nodeToEdit, title: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Mô tả bài học</label>
                <textarea
                  placeholder="Mô tả..."
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={nodeToEdit.description || ""}
                  onChange={(e) => setNodeToEdit({ ...nodeToEdit, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Loại bài học</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    value={nodeToEdit.nodeType}
                    onChange={(e) => setNodeToEdit({ ...nodeToEdit, nodeType: e.target.value as any })}
                  >
                    <option value="AT_HOME">Tự học</option>
                    <option value="ON_CLASS">Lên lớp</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Trạng thái mở</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    value={nodeToEdit.status}
                    onChange={(e) => setNodeToEdit({ ...nodeToEdit, status: e.target.value as any })}
                  >
                    <option value="LOCKED">Khóa</option>
                    <option value="OPEN">Mở</option>
                    <option value="HIDDEN">Ẩn</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Thứ tự hiển thị</label>
                  <input
                    type="number"
                    required
                    min={1}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={nodeToEdit.displayOrder}
                    onChange={(e) => setNodeToEdit({ ...nodeToEdit, displayOrder: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Tên nhánh (Optional)</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    value={nodeToEdit.branchName || ""}
                    onChange={(e) => setNodeToEdit({ ...nodeToEdit, branchName: e.target.value as any })}
                  >
                    <option value="">-- Chọn nhánh --</option>
                    <option value="MAIN">MAIN (Nhánh chính)</option>
                    <option value="SUB">SUB (Nhánh phụ)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editNodeRequiredChk"
                  className="rounded text-indigo-600 focus:ring-indigo-500 size-4 cursor-pointer"
                  checked={nodeToEdit.isRequired}
                  onChange={(e) => setNodeToEdit({ ...nodeToEdit, isRequired: e.target.checked })}
                />
                <label htmlFor="editNodeRequiredChk" className="text-sm font-semibold text-gray-700 cursor-pointer select-none">
                  Mốc bắt buộc hoàn thành (Required)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { setIsEditNodeOpen(false); setNodeToEdit(null); }}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                  style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)" }}
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE NODE CONFIRM MODAL */}
      {showNodeDeleteConfirm && nodeToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200 p-6 space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              <h2 className="text-lg font-bold">Xác nhận xóa bài học</h2>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa bài học <strong>"{nodeToDelete.title}"</strong>? 
              Mọi liên kết điều kiện tiên quyết liên quan đến bài học này cũng sẽ bị xóa vĩnh viễn khỏi lộ trình mẫu.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => { setShowNodeDeleteConfirm(false); setNodeToDelete(null); }}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteNodeConfirm}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD MATERIAL MODAL */}
      {/* PREVIEW TÀI LIỆU theo đúng định dạng */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setPreviewFile(null)}>
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b border-gray-150">
              <span className="text-sm font-semibold text-gray-800 truncate pr-3">{previewFile.name}</span>
              <div className="flex items-center gap-3 shrink-0">
                <a href={previewFile.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-indigo-600 hover:underline">Mở/Tải về</a>
                <button onClick={() => setPreviewFile(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="p-3 overflow-auto flex items-center justify-center bg-gray-50" style={{ minHeight: "300px" }}>
              {(() => {
                const t = (previewFile.type || "").toLowerCase();
                const ext = (previewFile.url.split(/[?#]/)[0].split(".").pop() || "").toLowerCase();
                const is = (mime: string, exts: string[]) => t.startsWith(mime) || exts.includes(ext);
                if (is("image/", ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"]))
                  return <img src={previewFile.url} alt={previewFile.name} style={{ maxWidth: "100%", maxHeight: "78vh" }} />;
                if (t === "application/pdf" || ext === "pdf") {
                  if (previewLoading)
                    return (
                      <div className="flex flex-col items-center gap-3 text-gray-500 py-16">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="text-sm">Đang tải tài liệu…</span>
                      </div>
                    );
                  if (previewError || !previewBlobUrl)
                    return (
                      <div className="text-center text-sm text-gray-500 py-10">
                        Không tải được bản xem trước.
                        <div className="mt-2">
                          <a href={previewFile.url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-semibold">Mở trong tab mới / Tải về</a>
                        </div>
                      </div>
                    );
                  return <iframe src={previewBlobUrl} title={previewFile.name} style={{ width: "100%", height: "78vh", border: "none" }} />;
                }
                if (is("video/", ["mp4", "webm", "ogv", "mov"]))
                  return <video src={previewFile.url} controls style={{ maxWidth: "100%", maxHeight: "78vh" }} />;
                if (is("audio/", ["mp3", "wav", "m4a", "ogg"]))
                  return <audio src={previewFile.url} controls />;
                return (
                  <div className="flex flex-col items-center gap-4 text-center py-12 px-6">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                      <FileText className="w-8 h-8 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 break-all">{previewFile.name}</p>
                      <p className="text-xs text-gray-500 mt-1">Định dạng Word/Excel/PowerPoint không xem trực tiếp trên trình duyệt được.</p>
                    </div>
                    <a
                      href={previewFile.url}
                      target="_blank"
                      rel="noreferrer"
                      download={previewFile.name}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                      style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)" }}
                    >
                      <Download className="w-4 h-4" /> Tải về để xem
                    </a>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {isAddMaterialOpen && selectedNodeForContent && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-150">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Thêm tài liệu học tập</h2>
                <p className="text-xs text-gray-500">Bài học: {selectedNodeForContent.title}</p>
              </div>
              <button onClick={() => { setIsAddMaterialOpen(false); setSelectedNodeForContent(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddMaterialSubmit} className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Tiêu đề tài liệu *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Slide bài giảng React, Video hướng dẫn..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={materialTitle}
                  onChange={(e) => setMaterialTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Loại tài liệu</label>
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="materialType"
                      value="video"
                      checked={materialType === 'video'}
                      onChange={() => setMaterialType('video')}
                      className="text-indigo-650 focus:ring-indigo-550"
                    />
                    Link Video (Youtube...)
                  </label>
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="materialType"
                      value="file"
                      checked={materialType === 'file'}
                      onChange={() => setMaterialType('file')}
                      className="text-indigo-650 focus:ring-indigo-550"
                    />
                    Tập tin (Upload file tĩnh)
                  </label>
                </div>
              </div>

              {materialType === 'video' ? (
                <div className="space-y-3 p-3 bg-gray-50 border border-gray-200 rounded-lg animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-750">Đường dẫn Video (YouTube URL) *</label>
                    <input
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={materialVideoUrl}
                      onChange={(e) => setMaterialVideoUrl(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-750">Mô tả video</label>
                    <textarea
                      placeholder="Nhập mô tả ngắn..."
                      rows={2}
                      className="w-full border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={materialVideoDesc}
                      onChange={(e) => setMaterialVideoDesc(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 p-3 bg-gray-50 border border-gray-200 rounded-lg animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-750">Chọn tập tin tải lên</label>
                    <input
                      type="file"
                      className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                      onChange={(e) => setMaterialSelectedFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  <div className="text-center text-xs text-gray-400 font-semibold py-1">HOẶC</div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-750">Hoặc nhập link file bên ngoài (Google Drive...)</label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/..."
                      className="w-full border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={materialFileUrl}
                      onChange={(e) => setMaterialFileUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-750">Tên file hiển thị (Optional)</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: React Cheatsheet PDF"
                      className="w-full border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={materialFileName}
                      onChange={(e) => setMaterialFileName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-750">Mô tả tài liệu</label>
                    <textarea
                      placeholder="Nhập mô tả..."
                      rows={2}
                      className="w-full border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={materialFileDesc}
                      onChange={(e) => setMaterialFileDesc(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="materialRequiredChk"
                  className="rounded text-indigo-600 focus:ring-indigo-500 size-4 cursor-pointer"
                  checked={materialRequired}
                  onChange={(e) => setMaterialRequired(e.target.checked)}
                />
                <label htmlFor="materialRequiredChk" className="text-sm font-semibold text-gray-700 cursor-pointer select-none">
                  Bắt buộc hoàn thành để qua môn (Required)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { setIsAddMaterialOpen(false); setSelectedNodeForContent(null); }}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                  style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)" }}
                >
                  Thêm tài liệu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD TEST MODAL */}
      {isAddTestOpen && selectedNodeForContent && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-150">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Thêm bài kiểm tra</h2>
                <p className="text-xs text-gray-500">Bài học: {selectedNodeForContent.title}</p>
              </div>
              <button onClick={() => { setIsAddTestOpen(false); setSelectedNodeForContent(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddTestSubmit} className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Tiêu đề bài kiểm tra *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Quiz 1, Kiểm tra định kỳ..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Mô tả bài kiểm tra</label>
                <textarea
                  placeholder="Mô tả nội dung bài kiểm tra..."
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={testDesc}
                  onChange={(e) => setTestDesc(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Thời lượng (phút)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={testDuration}
                    onChange={(e) => setTestDuration(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Phần trăm điểm đạt (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min={0}
                    max={100}
                    placeholder="e.g. 80.00"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={testPassPercent}
                    onChange={(e) => setTestPassPercent(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { setIsAddTestOpen(false); setSelectedNodeForContent(null); }}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                  style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)" }}
                >
                  Thêm bài kiểm tra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
