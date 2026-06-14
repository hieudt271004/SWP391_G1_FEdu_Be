import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Plus, Edit2, Trash2, Users, Loader2,
  AlertCircle, BookOpen, GraduationCap, X, ChevronDown,
  ChevronRight, Map, GitFork, AlertTriangle, Settings, CheckCircle,
  HelpCircle, Circle, Video as VideoIcon, FileText, ArrowUp, ArrowDown
} from "lucide-react";
import { subjectService } from "../../services/subject.service";
import { classroomService } from "../../services/classroom.service";
import { learningPathService } from "../../services/learningPath.service";
import type { Subject } from "../../types/subject";
import type { ClassroomResponse } from "../../types/classroom";
import type { LearningPathResponse, LearningNodeResponse, NodeEdgeResponse, NodeContentResponse } from "../../services/learningPath.service";
import { toast } from "sonner";

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const subjectId = Number(id);

  // Subject and classroom data
  const [subject, setSubject] = useState<Subject | null>(null);
  const [classrooms, setClassrooms] = useState<ClassroomResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  const [newTplName, setNewTplName] = useState("");
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
  const [newNodeStatus, setNewNodeStatus] = useState<'LOCKED' | 'OPEN' | 'HIDDEN'>('LOCKED');
  const [newNodeOrder, setNewNodeOrder] = useState<number>(1);
  const [newNodeRequired, setNewNodeRequired] = useState(true);
  const [newNodeBranch, setNewNodeBranch] = useState("");
  const [newNodePredecessor, setNewNodePredecessor] = useState<string>("");

  // Form states - Edge
  const [edgeMinScore, setEdgeMinScore] = useState("");
  const [edgeMaxScore, setEdgeMaxScore] = useState("");
  const [edgeFromNodeId, setEdgeFromNodeId] = useState("");
  const [edgeToNodeId, setEdgeToNodeId] = useState("");
  const [edgeBranch, setEdgeBranch] = useState("");

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
      setNewNodeOrder((graph.nodes?.length || 0) + 1);
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
        classroomService.getBySubject(subjectId),
      ]);
      setSubject(subj);
      setClassrooms(classes);
      await fetchTemplates();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Không tải được dữ liệu khóa học");
    } finally {
      setLoading(false);
    }
  }, [subjectId, fetchTemplates]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    if (!newTplName.trim()) {
      toast.error("Vui lòng nhập tên lộ trình");
      return;
    }
    try {
      const created = await learningPathService.createAdminTemplate({
        subjectId,
        pathName: newTplName,
        description: newTplDesc,
        level: newTplLevel,
      });
      toast.success("Tạo lộ trình mẫu thành công");
      setIsCreateTemplateOpen(false);
      setNewTplName("");
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
    if (!selectedTemplateId || !editTplName.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }
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
  const handleAddNodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeTitle.trim() || !selectedTemplateId) {
      toast.error("Tên bài học không được để trống");
      return;
    }
    try {
      const createdNode = await learningPathService.createAdminNode({
        learningPathId: selectedTemplateId,
        title: newNodeTitle,
        description: newNodeDesc,
        nodeType: newNodeType,
        branchName: newNodeBranch || undefined,
        displayOrder: newNodeOrder,
        status: newNodeStatus,
        isRequired: newNodeRequired,
      });

      if (newNodePredecessor) {
        await learningPathService.createAdminEdge({
          fromNodeId: Number(newNodePredecessor),
          toNodeId: createdNode.nodeId,
          branchName: newNodeBranch || undefined,
          minScore: edgeMinScore ? Number(edgeMinScore) : undefined,
          maxScore: edgeMaxScore ? Number(edgeMaxScore) : undefined,
        });
      }

      toast.success("Thêm bài học thành công");
      setIsAddNodeOpen(false);

      // Reset form
      setNewNodeTitle("");
      setNewNodeDesc("");
      setNewNodeType("AT_HOME");
      setNewNodeStatus("LOCKED");
      setNewNodeBranch("");
      setNewNodePredecessor("");
      setEdgeMinScore("");
      setEdgeMaxScore("");

      await fetchGraph(selectedTemplateId);
    } catch (err: any) {
      toast.error(err.message || "Không tạo được bài học mới");
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
      await learningPathService.deleteAdminNode(nodeToDelete.nodeId);
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
  const getNodeColorClass = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'border-l-4 border-l-green-500 hover:bg-green-50/5';
      case 'LOCKED':
        return 'border-l-4 border-l-gray-300 hover:bg-gray-50 opacity-90';
      case 'HIDDEN':
        return 'border-l-4 border-l-yellow-500 hover:bg-yellow-50/5 opacity-70';
      default:
        return 'border-l-4 border-l-gray-300 hover:bg-gray-50';
    }
  };

  const getNodeIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'LOCKED':
        return <Circle className="w-5 h-5 text-gray-400" />;
      case 'HIDDEN':
        return <HelpCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Circle className="w-5 h-5" />;
    }
  };

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
                onClick={() => setIsCreateTemplateOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold hover:opacity-90 transition-opacity"
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
                  title="Sửa tên lộ trình"
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
                    onClick={() => setIsAddNodeOpen(true)}
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
                  {nodes.map((node) => {
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
                      <div key={node.nodeId} className={`transition-all duration-200 ${getNodeColorClass(node.status)}`}>
                        {/* Expandable node header */}
                        <div
                          onClick={() => toggleNode(node.nodeId)}
                          className="flex items-center justify-between p-4 cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`p-0.5 rounded transition-transform duration-200 shrink-0 ${isExpanded ? "rotate-90" : ""}`}>
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="shrink-0">{getNodeIcon(node.status)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`font-semibold text-sm ${node.status === "LOCKED" ? "text-gray-500" : "text-gray-900"}`}>
                                  {node.title}
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
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider shrink-0 pl-3">
                            Thứ tự: {node.displayOrder}
                          </div>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-1 bg-gray-50/50 border-t border-gray-150 space-y-3">
                            <p className="text-sm text-gray-600 leading-relaxed pt-1">
                              {node.description || "Chưa có mô tả chi tiết."}
                            </p>

                            {/* Node settings summary */}
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                              <div>Nhánh: <span className="font-semibold text-gray-700">{node.branchName || "Main"}</span></div>
                              <div>Trạng thái ban đầu: <span className="font-semibold text-gray-700">{node.status}</span></div>
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
                                        {(info.minScore !== undefined || info.maxScore !== undefined) && (
                                          <span className="text-[10px] text-indigo-600 ml-1">
                                            ({info.minScore !== undefined ? `Min: ${info.minScore}` : ""}
                                            {info.minScore !== undefined && info.maxScore !== undefined ? ", " : ""}
                                            {info.maxScore !== undefined ? `Max: ${info.maxScore}` : ""})
                                          </span>
                                        )}
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
                                                <a
                                                  href={
                                                    m.file.fileUrl.startsWith("/")
                                                      ? `http://localhost:8080${m.file.fileUrl}`
                                                      : m.file.fileUrl
                                                  }
                                                  target="_blank"
                                                  rel="noreferrer"
                                                  className="text-indigo-600 hover:underline truncate max-w-[200px]"
                                                  title={m.file.fileName}
                                                >
                                                  {m.file.fileName || "Tải tài liệu"}
                                                </a>
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
          {/* Instructor details */}
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

          {/* Active Classrooms */}
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
                <label className="text-sm font-semibold text-gray-700">Tên lộ trình *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Lộ trình cơ bản, Lộ trình nâng cao..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newTplName}
                  onChange={(e) => setNewTplName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Loại lộ trình *</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newTplLevel}
                  onChange={(e) => setNewTplLevel(e.target.value as "BASIC" | "ADVANCED")}
                >
                  <option value="BASIC">Cơ bản (BASIC)</option>
                  <option value="ADVANCED">Nâng cao (ADVANCED)</option>
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
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Tên lộ trình *</label>
                <input
                  type="text"
                  required
                  placeholder="Nhập tên lộ trình..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={editTplName}
                  onChange={(e) => setEditTplName(e.target.value)}
                />
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
              <h2 className="text-lg font-bold text-gray-900">Thêm bài học mới</h2>
              <button onClick={() => setIsAddNodeOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddNodeSubmit} className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Tên bài học *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Giới thiệu môn học, Bài 1..."
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Loại bài học</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    value={newNodeType}
                    onChange={(e) => setNewNodeType(e.target.value as any)}
                  >
                    <option value="AT_HOME">Tự học (At home)</option>
                    <option value="ON_CLASS">Lên lớp (On class)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Trạng thái mở</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    value={newNodeStatus}
                    onChange={(e) => setNewNodeStatus(e.target.value as any)}
                  >
                    <option value="LOCKED">Khóa (Locked)</option>
                    <option value="OPEN">Mở (Open)</option>
                    <option value="HIDDEN">Ẩn (Hidden)</option>
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
                    value={newNodeOrder}
                    onChange={(e) => setNewNodeOrder(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Tên nhánh (Optional)</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Nhánh phụ, Nâng cao..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newNodeBranch}
                    onChange={(e) => setNewNodeBranch(e.target.value)}
                  />
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
                      <label className="text-[10px] font-semibold text-indigo-900">Điểm tối thiểu (Optional)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 8.0"
                        className="w-full border border-gray-350 bg-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={edgeMinScore}
                        onChange={(e) => setEdgeMinScore(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-indigo-900">Điểm tối đa (Optional)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 10.0"
                        className="w-full border border-gray-350 bg-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={edgeMaxScore}
                        onChange={(e) => setEdgeMaxScore(e.target.value)}
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
                  onClick={() => setIsAddNodeOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-55 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                  style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)" }}
                >
                  Tạo bài học
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
                  <input
                    type="text"
                    placeholder="Tên nhánh..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={nodeToEdit.branchName || ""}
                    onChange={(e) => setNodeToEdit({ ...nodeToEdit, branchName: e.target.value })}
                  />
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
                <input
                  type="text"
                  placeholder="Ví dụ: Main, Optional..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={edgeBranch}
                  onChange={(e) => setEdgeBranch(e.target.value)}
                />
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
