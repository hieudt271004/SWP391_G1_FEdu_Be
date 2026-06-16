import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Plus, Edit2, Trash2, Users, Loader2,
  AlertCircle, BookOpen, GraduationCap, X,
  ChevronRight, Map, GitFork, AlertTriangle, CheckCircle,
  Video as VideoIcon, FileText, ArrowUp, ArrowDown
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
import type { LearningPathResponse, LearningNodeResponse, NodeEdgeResponse, NodeContentResponse, BranchType } from "../../services/learningPath.service";
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
  const [isAddEdgeOpen, setIsAddEdgeOpen] = useState(false);
  const [showNodeDeleteConfirm, setShowNodeDeleteConfirm] = useState(false);
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [isAddTestOpen, setIsAddTestOpen] = useState(false);

  // Form states - Template
  const [newTplDesc, setNewTplDesc] = useState("");
  const [newTplLevel, setNewTplLevel] = useState<"BASIC" | "ADVANCED">("BASIC");
  const [editTplName, setEditTplName] = useState("");
  const [editTplDesc, setEditTplDesc] = useState("");

  // Form states - Node
  const [nodeToEdit, setNodeToEdit] = useState<LearningNodeResponse | null>(null);
  const [nodeToDelete, setNodeToDelete] = useState<{ nodeId: number; title: string } | null>(null);
  const [newNodeTitle, setNewNodeTitle] = useState("");
  const [newNodeDesc, setNewNodeDesc] = useState("");
  const [newNodeType, setNewNodeType] = useState<'AT_HOME' | 'ON_CLASS'>('AT_HOME');
  const [newNodeStatus, setNewNodeStatus] = useState<'LOCKED' | 'OPEN' | 'HIDDEN'>('OPEN');
  const [newNodeRequired, setNewNodeRequired] = useState(true);
  const [newNodeBranch, setNewNodeBranch] = useState<BranchType | "">("");
  const [newNodePredecessor, setNewNodePredecessor] = useState<string>("");
  const [newNodeOrder, setNewNodeOrder] = useState<number>(1);
  const [addNodeParent, setAddNodeParent] = useState<LearningNodeResponse | null>(null);
  const [branchMode, setBranchMode] = useState<'MAIN' | 'SUB'>('MAIN');
  const [addingNode, setAddingNode] = useState(false);
  const submittingNodeRef = useRef(false);

  // Form states - Edge
  const [edgeMinScore, setEdgeMinScore] = useState("");
  const [edgeMaxScore, setEdgeMaxScore] = useState("");
  const [edgeFromNodeId, setEdgeFromNodeId] = useState("");
  const [edgeToNodeId, setEdgeToNodeId] = useState("");
  const [edgeBranch, setEdgeBranch] = useState<BranchType | "">("");

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

  const [testTitle, setTestTitle] = useState("");
  const [testDesc, setTestDesc] = useState("");
  const [testDuration, setTestDuration] = useState("15");
  const [testPassPercent, setTestPassPercent] = useState("80.00");

  // Fetch subject-level learning path templates
  const fetchTemplates = useCallback(async () => {
    if (!subjectId) return;
    try {
      const list = await learningPathService.getAdminSubjectTemplates(subjectId);
      setTemplates(list);
      if (list.length > 0) {
        // Automatically select the first template if none is currently selected
        setSelectedTemplateId((prev) => {
          if (prev && list.some((t) => t.pathId === prev)) {
            return prev;
          }
          return list[0].pathId;
        });
      } else {
        setSelectedTemplateId(null);
        setNodes([]);
        setEdges([]);
        setNodeContents({});
      }
    } catch (e) {
      console.error("Failed to load templates", e);
      toast.error("Không tải được danh sách lộ trình mẫu");
    }
  }, [subjectId]);

  // Fetch graph details for the selected template path
  const fetchGraph = useCallback(async (pathId: number) => {
    try {
      setLoadingGraph(true);
      const graph = await learningPathService.getAdminTemplateGraph(pathId);
      setNodes(graph.nodes || []);
      setEdges(graph.edges || []);
      // Nạp sẵn nội dung tất cả node để hiện thống kê kiểu Coursera
      const allNodes = graph.nodes || [];
      const contentEntries = await Promise.all(
        allNodes.map(async (n) => {
          try { return [n.nodeId, await learningPathService.getAdminNodeContent(n.nodeId)] as const; }
          catch { return [n.nodeId, { materials: [], tests: [] } as NodeContentResponse] as const; }
        })
      );
      setNodeContents(Object.fromEntries(contentEntries));
    } catch (e: any) {
      toast.error(e.message || "Không tải được cấu trúc lộ trình");
    } finally {
      setLoadingGraph(false);
    }
  }, []);

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

  // Load template graph when selection changes
  useEffect(() => {
    if (selectedTemplateId) {
      fetchGraph(selectedTemplateId);
    }
  }, [selectedTemplateId, fetchGraph]);

  const handleSelectTemplate = (id: number) => {
    setSelectedTemplateId(id);
    setExpandedNodes({});
    setNodeContents({});
  };

  // Lộ trình gốc chỉ có 2 loại (cơ bản/nâng cao); mỗi loại tối đa 1 cho mỗi môn
  const existingLevels = new Set(templates.map((t) => t.level));
  const bothLevelsExist = existingLevels.has("BASIC") && existingLevels.has("ADVANCED");

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
  // Tự đánh số "Bài N" theo vị trí (node phụ = "Bài {N cha} phụ"); bỏ tiền tố "Bài N:" cũ trong title
  const stripLessonPrefix = (t: string) => (t || "").replace(/^\s*Bài\s+\d+(\s*phụ)?\s*:?\s*/i, "").trim();
  const nodeLabels: Record<number, string> = {};
  let lessonCounter = 0;
  for (const n of sortedNodes) {
    if (isSubNode(n)) {
      const pe = edges.find((e) => e.toNodeId === n.nodeId);
      const parentLabel = pe ? nodeLabels[pe.fromNodeId] : undefined;
      nodeLabels[n.nodeId] = parentLabel ? `${parentLabel} phụ` : `Bài ${lessonCounter} phụ`;
    } else {
      lessonCounter += 1;
      nodeLabels[n.nodeId] = `Bài ${lessonCounter}`;
    }
  }

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
    try {
      const created = await learningPathService.createAdminTemplate({
        subjectId,
        pathName: newTplLevel === "ADVANCED" ? "Lộ trình nâng cao" : "Lộ trình cơ bản",
        description: newTplDesc,
        level: newTplLevel,
      });
      toast.success("Tạo lộ trình mẫu thành công");
      setIsCreateTemplateOpen(false);
      setNewTplDesc("");
      setNewTplLevel("BASIC");
      setSelectedTemplateId(created.pathId);
      await fetchTemplates();
    } catch (err: any) {
      toast.error(err.message || "Tạo lộ trình mẫu thất bại");
    }
  };

  const handleEditTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplateId) return;
    try {
      await learningPathService.updateAdminTemplate(selectedTemplateId, {
        pathName: editTplName,
        description: editTplDesc,
      });
      toast.success("Cập nhật lộ trình mẫu thành công");
      setIsEditTemplateOpen(false);
      await fetchTemplates();
    } catch (err: any) {
      toast.error(err.message || "Cập nhật lộ trình mẫu thất bại");
    }
  };

  const handleDeleteTemplateConfirm = async () => {
    if (!selectedTemplateId) return;
    try {
      await learningPathService.deleteAdminTemplate(selectedTemplateId);
      toast.success("Đã xóa lộ trình mẫu");
      setIsDeleteTplConfirmOpen(false);
      setSelectedTemplateId(null);
      await fetchTemplates();
    } catch (err: any) {
      toast.error(err.message || "Xóa lộ trình mẫu thất bại");
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
    const isSub = !!parent && branchMode === "SUB";
    if (isSub && !edgeMinScore) {
      toast.error("Vui lòng nhập điểm tối thiểu cho nhánh phụ");
      return;
    }
    if (submittingNodeRef.current) return; // đang tạo → bỏ qua click thứ 2
    submittingNodeRef.current = true;
    setAddingNode(true);
    try {
      const mainNodes = nodes.filter((n) => (n.branchName || "MAIN") !== "SUB");
      const branchName = isSub ? "SUB" : "MAIN";
      let order: number;

      if (!parent) {
        // nối tiếp cuối xương sống
        order = mainNodes.reduce((m, n) => Math.max(m, n.displayOrder), 0) + 1;
      } else {
        // có parent (chính hoặc phụ): chèn ngay sau node cha, dồn các node sau lên +1
        // (cao->thấp để tránh trùng thứ tự) → node mới luôn nằm ngay sau cha, không trùng order
        order = parent.displayOrder + 1;
        const toShift = nodes
          .filter((n) => n.displayOrder >= order)
          .sort((a, b) => b.displayOrder - a.displayOrder);
        for (const n of toShift) {
          await learningPathService.updateAdminNode(n.nodeId, nodeToReq(n, n.displayOrder + 1));
        }
      }

      const createdNode = await learningPathService.createAdminNode({
        learningPathId: selectedTemplateId,
        title: newNodeTitle,
        description: newNodeDesc,
        nodeType: newNodeType,
        branchName,
        displayOrder: order,
        status: newNodeStatus,
        isRequired: newNodeRequired,
      });

      if (parent) {
        if (isSub) {
          // Nhánh phụ = đi xuống khi điểm test DƯỚI ngưỡng tối thiểu (maxScore = ngưỡng)
          await learningPathService.createAdminEdge({
            fromNodeId: parent.nodeId,
            toNodeId: createdNode.nodeId,
            branchName: "SUB",
            maxScore: Number(edgeMinScore),
          });
        } else {
          await learningPathService.createAdminEdge({
            fromNodeId: parent.nodeId,
            toNodeId: createdNode.nodeId,
            branchName: "MAIN",
          });
        }
      } else {
        // top-level: nối từ node cuối của xương sống (nếu có)
        const lastMain = [...mainNodes].sort((a, b) => b.displayOrder - a.displayOrder)[0];
        if (lastMain) {
          await learningPathService.createAdminEdge({
            fromNodeId: lastMain.nodeId,
            toNodeId: createdNode.nodeId,
            branchName: "MAIN",
          });
        }
      }

      toast.success("Thêm bài học thành công");
      setIsAddNodeOpen(false);
      setAddNodeParent(null);
      resetNodeForm();
      await fetchGraph(selectedTemplateId);
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
      await fetchGraph(selectedTemplateId);
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
      await fetchGraph(selectedTemplateId);
    } catch (err: any) {
      toast.error(err.message || "Không xóa được bài học");
    }
  };

  // Edge CRUD actions
  const handleAddEdgeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edgeFromNodeId || !edgeToNodeId || !selectedTemplateId) {
      toast.error("Vui lòng chọn đầy đủ các bài học liên kết");
      return;
    }
    if (edgeFromNodeId === edgeToNodeId) {
      toast.error("Không thể tự liên kết bài học với chính nó");
      return;
    }
    try {
      await learningPathService.createAdminEdge({
        fromNodeId: Number(edgeFromNodeId),
        toNodeId: Number(edgeToNodeId),
        branchName: edgeBranch || undefined,
        minScore: edgeMinScore ? Number(edgeMinScore) : undefined,
        maxScore: edgeMaxScore ? Number(edgeMaxScore) : undefined,
      });
      toast.success("Tạo liên kết tiên quyết thành công");
      setIsAddEdgeOpen(false);
      setEdgeFromNodeId("");
      setEdgeToNodeId("");
      setEdgeBranch("");
      setEdgeMinScore("");
      setEdgeMaxScore("");
      await fetchGraph(selectedTemplateId);
    } catch (err: any) {
      toast.error(err.message || "Không thể tạo liên kết. Có thể hành động này gây ra vòng lặp vô hạn (cycle)!");
    }
  };

  const handleDeleteEdge = async (edgeId: number) => {
    if (!selectedTemplateId) return;
    try {
      await learningPathService.deleteAdminEdge(edgeId);
      toast.success("Đã xóa liên kết tiên quyết");
      await fetchGraph(selectedTemplateId);
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

  // UI Helpers
  // Viền xanh mép trái chỉ hiện khi MÔN đã xuất bản; bản nháp thì trung tính
  const isSubjectPublished = subject?.status === "published";

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#4338ca" }} />
      <span style={{ marginLeft: "0.75rem", color: "#6b7280" }}>Đang tải môn học...</span>
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
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Interactive Roadmap Template Builder */}
        <div className="rounded-xl p-6" style={{ backgroundColor: "white", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          {/* Template Selection Header */}
          <div className="pb-5 mb-5 border-b border-gray-100 space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" style={{ color: "#4338ca" }} />
                <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#111827" }}>
                  Lộ trình mẫu
                </h2>
              </div>
              <button
                disabled={bothLevelsExist}
                onClick={() => {
                  const firstAvailable = (["BASIC", "ADVANCED"] as const).find((lv) => !existingLevels.has(lv));
                  if (firstAvailable) setNewTplLevel(firstAvailable);
                  setIsCreateTemplateOpen(true);
                }}
                title={bothLevelsExist ? "Đã đủ 2 lộ trình (cơ bản + nâng cao)" : "Tạo lộ trình mẫu mới"}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)", border: "none", cursor: "pointer" }}
              >
                <Plus className="w-3.5 h-3.5" /> Tạo mẫu mới
              </button>
            </div>

            {templates.length > 0 ? (
              <div className="flex items-center gap-2">
                <select
                  value={selectedTemplateId || ""}
                  onChange={(e) => handleSelectTemplate(Number(e.target.value))}
                  className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {templates.map((t) => (
                    <option key={t.pathId} value={t.pathId}>
                      {t.pathName}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    const currentTpl = templates.find((t) => t.pathId === selectedTemplateId);
                    if (currentTpl) {
                      setEditTplName(currentTpl.pathName);
                      setEditTplDesc(currentTpl.description || "");
                      setIsEditTemplateOpen(true);
                    }
                  }}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Sửa mô tả lộ trình"
                >
                  <Edit2 className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => setIsDeleteTplConfirmOpen(true)}
                  className="p-2 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  title="Xóa lộ trình mẫu"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                Không tìm thấy lộ trình mẫu nào. Click "Tạo mẫu mới" để thiết lập một lộ trình khung cho môn học này.
              </div>
            )}
          </div>

          {/* Graph Nodes and Designer Section */}
          {selectedTemplateId && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Thiết kế bài học & Liên kết</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={openTopLevelAddNode}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors border border-indigo-150"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm bài học
                  </button>
                  <button
                    disabled={nodes.length < 2}
                    onClick={() => setIsAddEdgeOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors border border-teal-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <GitFork className="w-3.5 h-3.5" /> Liên kết tiên quyết
                  </button>
                </div>
              </div>

              {sortedNodes.length > 0 && (
                <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 pb-1" style={{ fontSize: "0.8125rem", color: "#4b5563" }}>
                  <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-indigo-600" /> {sortedNodes.length} bài học</span>
                  <span className="flex items-center gap-1.5"><VideoIcon className="w-4 h-4 text-purple-600" /> {nodeTotals.videos} video</span>
                  <span className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-indigo-600" /> {nodeTotals.docs} tài liệu</span>
                  <span className="flex items-center gap-1.5"><GraduationCap className="w-4 h-4 text-teal-600" /> {nodeTotals.tests} bài test</span>
                </div>
              )}

              {loadingGraph ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  <span className="ml-2 text-sm text-gray-400">Đang tải cấu trúc lộ trình...</span>
                </div>
              ) : nodes.length === 0 ? (
                <div className="text-center py-12 text-gray-400 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                  <Map className="w-8 h-8 mx-auto text-gray-300 mb-2 animate-pulse" />
                  <p className="text-sm">Chưa có bài học nào trong lộ trình mẫu này.</p>
                  <button
                    onClick={() => setIsAddNodeOpen(true)}
                    className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Tạo bài học đầu tiên
                  </button>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 shadow-sm">
                  {sortedNodes.map((node) => {
                    const isExpanded = !!expandedNodes[node.nodeId];
                    const incomingEdges = edges.filter((e) => e.toNodeId === node.nodeId);
                    const incomingNodesInfo = incomingEdges
                      .map((e) => {
                        const fromNode = nodes.find((n) => n.nodeId === e.fromNodeId);
                        return {
                          edgeId: e.edgeId,
                          fromTitle: fromNode ? fromNode.title : `Node #${e.fromNodeId}`,
                          minScore: e.minScore,
                          maxScore: e.maxScore,
                        };
                      });

                    return (
                      <div key={node.nodeId} className={`transition-all duration-200 ${isSubjectPublished ? "border-l-4 border-l-green-500 hover:bg-green-50/5" : "hover:bg-gray-50"}`}>
                        {/* Expandable node header */}
                        <div
                          onClick={() => toggleNode(node.nodeId)}
                          className="flex items-center justify-between p-4 cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`p-0.5 rounded transition-transform duration-200 shrink-0 ${isExpanded ? "rotate-90" : ""}`}>
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`font-semibold text-sm ${node.status === "LOCKED" ? "text-gray-500" : "text-gray-900"}`}>
                                  {nodeLabels[node.nodeId]}: {stripLessonPrefix(node.title)}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium">
                                  {node.nodeType === "ON_CLASS" ? "Lên lớp" : "Tự học"}
                                </span>
                                {node.isRequired && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-100 font-medium">
                                    Bắt buộc
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-1 bg-gray-50/50 border-t border-gray-150 space-y-3">
                            <p className="text-sm text-gray-600 leading-relaxed pt-1">
                              {node.description || "Chưa có mô tả chi tiết."}
                            </p>

                            {/* Node settings summary */}
                            <div className="text-xs text-gray-500">
                              <div>Nhánh: <span className="font-semibold text-gray-700">{node.branchName || "Main"}</span></div>
                            </div>

                            {/* Prerequisites edges details */}
                            {incomingNodesInfo.length > 0 && (
                              <div className="text-xs border border-gray-200 bg-white rounded-lg p-3 space-y-2">
                                <div className="font-semibold text-gray-700 flex items-center gap-1">
                                  <GitFork className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>Điều kiện tiên quyết (Prerequisites):</span>
                                </div>
                                <div className="divide-y divide-gray-100">
                                  {incomingNodesInfo.map((info) => (
                                    <div key={info.edgeId} className="flex items-center justify-between py-1.5">
                                      <span className="text-gray-600 font-medium">
                                        Sau khi hoàn thành: <strong className="text-gray-800">{info.fromTitle}</strong>
                                      </span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteEdge(info.edgeId);
                                        }}
                                        className="p-1 rounded text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                                        title="Xóa liên kết này"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Materials and Tests details card */}
                            <div className="border border-gray-200 rounded-lg p-3 bg-white space-y-3">
                              {/* Unified Header */}
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-750 flex items-center gap-1.5">
                                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                                  Nội dung & Bài kiểm tra
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedNodeForContent(node);
                                      setIsAddMaterialOpen(true);
                                    }}
                                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-850 hover:underline transition-colors"
                                  >
                                    + Thêm tài liệu
                                  </button>
                                  <span className="text-gray-300 text-[10px]">|</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedNodeForContent(node);
                                      setIsAddTestOpen(true);
                                    }}
                                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-850 hover:underline transition-colors"
                                  >
                                    + Thêm bài kiểm tra
                                  </button>
                                </div>
                              </div>

                              {loadingContents[node.nodeId] ? (
                                <div className="flex items-center gap-2 py-2 text-xs text-gray-400">
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  Đang tải nội dung...
                                </div>
                              ) : (() => {
                                const sortedItems = getSortedTimelineItems(node.nodeId);
                                if (sortedItems.length === 0) {
                                  return (
                                    <div className="text-xs text-gray-400 italic py-2 text-center bg-gray-50 rounded border border-dashed border-gray-200">
                                      Chưa có tài liệu hoặc bài kiểm tra.
                                    </div>
                                  );
                                }
                                return (
                                  <div className="space-y-2">
                                    {sortedItems.map((item, index) => {
                                      const isMaterial = item.type === "MATERIAL";
                                      const m = isMaterial ? item.data : null;
                                      const t = !isMaterial ? item.data : null;

                                      return (
                                        <div
                                          key={item.key}
                                          className="flex items-start gap-2 p-2 bg-gray-50 rounded border border-gray-150 text-xs hover:border-indigo-200 transition-colors"
                                        >
                                          {/* Reorder Buttons Column */}
                                          <div className="flex flex-col gap-0.5 shrink-0 pt-0.5">
                                            <button
                                              disabled={index === 0}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleReorderContent(node.nodeId, item.id, item.type, "up");
                                              }}
                                              className={`p-0.5 rounded transition-colors ${
                                                index === 0
                                                  ? "text-gray-350 cursor-not-allowed opacity-50"
                                                  : "text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                                              }`}
                                              title="Di chuyển lên"
                                            >
                                              <ArrowUp className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              disabled={index === sortedItems.length - 1}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleReorderContent(node.nodeId, item.id, item.type, "down");
                                              }}
                                              className={`p-0.5 rounded transition-colors ${
                                                index === sortedItems.length - 1
                                                  ? "text-gray-350 cursor-not-allowed opacity-50"
                                                  : "text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                                              }`}
                                              title="Di chuyển xuống"
                                            >
                                              <ArrowDown className="w-3.5 h-3.5" />
                                            </button>
                                          </div>

                                          {/* Main Content Info */}
                                          <div className="space-y-1 flex-1 pr-1 min-w-0">
                                            <div className="font-semibold text-gray-800 flex items-center gap-1.5 flex-wrap">
                                              {isMaterial ? (
                                                <>
                                                  <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                                  <span className="truncate">{item.title}</span>
                                                  {m?.required && (
                                                    <span className="text-[9px] px-1 bg-red-50 text-red-500 rounded font-bold border border-red-100 shrink-0">
                                                      Bắt buộc
                                                    </span>
                                                  )}
                                                </>
                                              ) : (
                                                <>
                                                  <GraduationCap className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                                                  <span className="truncate">{item.title}</span>
                                                </>
                                              )}
                                            </div>

                                            {/* Sub-details depending on subtype */}
                                            {isMaterial && m?.video && (
                                              <div className="text-gray-500 flex items-center gap-1.5 flex-wrap text-[11px]">
                                                <span className="px-1 py-0.2 bg-teal-50 text-teal-700 border border-teal-100 rounded text-[9px] font-semibold flex items-center gap-0.5 shrink-0">
                                                  <VideoIcon className="w-2.5 h-2.5" /> Video
                                                </span>
                                                <a
                                                  href={m.video.videoUrl}
                                                  target="_blank"
                                                  rel="noreferrer"
                                                  className="text-indigo-600 hover:underline truncate max-w-[200px]"
                                                  title={m.video.videoUrl}
                                                >
                                                  {m.video.videoUrl}
                                                </a>
                                              </div>
                                            )}
                                            {isMaterial && m?.file && (
                                              <div className="text-gray-500 flex items-center gap-1.5 flex-wrap text-[11px]">
                                                <span className="px-1 py-0.2 bg-orange-50 text-orange-700 border border-orange-100 rounded text-[9px] font-semibold flex items-center gap-0.5 shrink-0">
                                                  <FileText className="w-2.5 h-2.5" /> File
                                                </span>
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    const f = m!.file!;
                                                    const url = f.fileUrl.startsWith("/") ? `${API_BASE_URL}${f.fileUrl}` : f.fileUrl;
                                                    setPreviewFile({ url, type: f.fileType || "", name: f.fileName || "Tài liệu" });
                                                  }}
                                                  className="text-indigo-600 hover:underline truncate max-w-[200px] text-left"
                                                  title="Xem tài liệu"
                                                >
                                                  {m.file.fileName || "Tài liệu"}
                                                </button>
                                              </div>
                                            )}
                                            {!isMaterial && t && (
                                              <div className="text-[10px] text-gray-500">
                                                Thời gian làm bài:{" "}
                                                <span className="font-semibold text-gray-700">
                                                  {t.durationMinutes || "—"} phút
                                                </span>
                                                {t.passingPercentage !== undefined && (
                                                  <span className="ml-3">
                                                    Điểm chuẩn:{" "}
                                                    <span className="font-semibold text-gray-700">
                                                      {t.passingPercentage}%
                                                    </span>
                                                  </span>
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
                                            className="p-1 rounded text-red-500 hover:bg-red-50 hover:text-red-750 shrink-0 transition-colors self-center"
                                            title={isMaterial ? "Xóa tài liệu" : "Xóa bài kiểm tra"}
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Actions bar */}
                            <div className="flex items-center gap-2 pt-2 border-t border-gray-200/50">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openChildAddNode(node);
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-xs font-semibold text-indigo-700 transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" /> Thêm node mới
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNodeToEdit(node);
                                  setIsEditNodeOpen(true);
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 bg-white hover:bg-gray-100 rounded-lg text-xs font-semibold text-gray-700 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" /> Chỉnh sửa
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNodeToDelete({ nodeId: node.nodeId, title: node.title });
                                  setShowNodeDeleteConfirm(true);
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 border border-red-200 bg-white hover:bg-red-50 rounded-lg text-xs font-semibold text-red-600 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Xóa bài học
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Instructor and Classrooms list */}
        <div className="space-y-6">
          {/* Lớp đang học môn này */}
          <div className="rounded-xl p-6" style={{ backgroundColor: "white", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" style={{ color: "#7c3aed" }} />
                <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#111827" }}>
                  Lớp đang học môn này ({classroomSubjects.length})
                </h2>
              </div>
              <button
                onClick={() => { setShowAddClass(true); setNewClassId(0); setNewClassLecturerId(0); setAddClassError(null); }}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-white transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)", border: "none", cursor: "pointer", fontWeight: 600 }}
              >
                <Plus className="w-4 h-4" /> Thêm lớp
              </button>
            </div>

            {classroomSubjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <GraduationCap className="w-12 h-12" style={{ color: "#d1d5db" }} />
                <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>Chưa có lớp nào học môn này</p>
                <button
                  onClick={() => { setShowAddClass(true); setNewClassId(0); setNewClassLecturerId(0); setAddClassError(null); }}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm text-white"
                  style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)", border: "none", cursor: "pointer", fontWeight: 600 }}
                >
                  <Plus className="w-4 h-4" /> Thêm lớp
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {classroomSubjects.map((cs) => (
                  <div
                    key={cs.classroomSubjectId}
                    className="p-4 rounded-xl hover:shadow-md transition-all"
                    style={{ border: "1px solid #e5e7eb" }}
                  >
                    <div className="mb-3">
                      <span style={{ fontSize: "1rem", fontWeight: 700, color: "#111827" }}>
                        {cs.className}
                      </span>
                    </div>
                    <div className="text-xs mb-3 truncate" style={{ color: "#9ca3af" }} title={cs.lecturerName}>
                      GV: {cs.lecturerName}
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="w-4 h-4" style={{ color: "#6b7280" }} />
                      <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                        {cs.studentCount} học sinh
                      </span>
                    </div>
                    <button
                      onClick={() => navigate(`/admin/classes/${cs.classroomId}/subjects/${cs.classroomSubjectId}`)}
                      className="w-full py-2 rounded-lg text-white text-sm transition-opacity hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, #334155, #111827)", border: "none", cursor: "pointer", fontWeight: 600 }}
                    >
                      Vào lớp-môn
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
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
                  onChange={(e) => setNewTplLevel(e.target.value as "BASIC" | "ADVANCED")}
                >
                  <option value="BASIC" disabled={existingLevels.has("BASIC")}>Lộ trình cơ bản{existingLevels.has("BASIC") ? " (đã có)" : ""}</option>
                  <option value="ADVANCED" disabled={existingLevels.has("ADVANCED")}>Lộ trình nâng cao{existingLevels.has("ADVANCED") ? " (đã có)" : ""}</option>
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
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-55 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                  style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)" }}
                >
                  Tạo lộ trình
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
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-55 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                  style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)" }}
                >
                  Cập nhật
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
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-55 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteTemplateConfirm}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
              >
                Xác nhận xóa
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Thứ tự hiển thị</label>
                  <input
                    type="number"
                    required
                    min={1}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newNodeOrder}
                    onChange={(e) => setNewNodeOrder(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Tên nhánh (Optional)</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    value={newNodeBranch}
                    onChange={(e) => setNewNodeBranch(e.target.value as BranchType)}
                  >
                    <option value="">-- Chọn nhánh --</option>
                    <option value="MAIN">MAIN (Nhánh chính)</option>
                    <option value="SUB">SUB (Nhánh phụ)</option>
                  </select>
                </div>
              </div>

              {/* Edge Connection Section */}
              <div className="space-y-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 uppercase">Điều kiện tiên quyết ban đầu</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    value={newNodePredecessor}
                    onChange={(e) => setNewNodePredecessor(e.target.value)}
                  >
                    <option value="">-- Không có điều kiện (Tự do) --</option>
                    {nodes.map((n) => (
                      <option key={n.nodeId} value={n.nodeId}>
                        Sau khi hoàn thành: {n.title} (Thứ tự: {n.displayOrder})
                      </option>
                    ))}
                  </select>
                </div>

                {newNodePredecessor && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
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
                  </div>
                )}
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
                  Mốc bắt buộc hoàn thành (Required)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { setIsAddNodeOpen(false); setAddNodeParent(null); }}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-55 transition-colors"
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
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-55 transition-colors"
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
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-55 transition-colors"
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

      {/* ADD EDGE MODAL */}
      {isAddEdgeOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-150">
              <h2 className="text-lg font-bold text-gray-900">Tạo liên kết tiên quyết</h2>
              <button onClick={() => setIsAddEdgeOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddEdgeSubmit} className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Bài học nguồn (Phải hoàn thành trước) *</label>
                <select
                  required
                  value={edgeFromNodeId}
                  onChange={(e) => setEdgeFromNodeId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">-- Chọn bài học tiên quyết --</option>
                  {nodes.map((n) => (
                    <option key={n.nodeId} value={n.nodeId}>
                      {n.title} (Thứ tự: {n.displayOrder})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Bài học đích (Bài học bị mở sau đó) *</label>
                <select
                  required
                  value={edgeToNodeId}
                  onChange={(e) => setEdgeToNodeId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">-- Chọn bài học bị khóa --</option>
                  {nodes.map((n) => (
                    <option key={n.nodeId} value={n.nodeId}>
                      {n.title} (Thứ tự: {n.displayOrder})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Tên nhánh liên kết (Optional)</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  value={edgeBranch}
                  onChange={(e) => setEdgeBranch(e.target.value as BranchType)}
                >
                  <option value="">-- Chọn nhánh --</option>
                  <option value="MAIN">MAIN (Nhánh chính)</option>
                  <option value="SUB">SUB (Nhánh phụ)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Điểm tối thiểu (Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ví dụ: 8.0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={edgeMinScore}
                    onChange={(e) => setEdgeMinScore(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Điểm tối đa (Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ví dụ: 10.0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={edgeMaxScore}
                    onChange={(e) => setEdgeMaxScore(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddEdgeOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-55 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                  style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)" }}
                >
                  Tạo liên kết
                </button>
              </div>
            </form>
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
                if (t === "application/pdf" || ext === "pdf")
                  return <iframe src={previewFile.url} title={previewFile.name} style={{ width: "100%", height: "78vh", border: "none" }} />;
                if (is("video/", ["mp4", "webm", "ogv", "mov"]))
                  return <video src={previewFile.url} controls style={{ maxWidth: "100%", maxHeight: "78vh" }} />;
                if (is("audio/", ["mp3", "wav", "m4a", "ogg"]))
                  return <audio src={previewFile.url} controls />;
                return (
                  <div className="text-center text-sm text-gray-500 py-10">
                    Không xem trực tiếp được định dạng này (vd Word/Excel).
                    <div className="mt-2">
                      <a href={previewFile.url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-semibold">Tải về để xem</a>
                    </div>
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
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-55 transition-colors"
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
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-55 transition-colors"
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
