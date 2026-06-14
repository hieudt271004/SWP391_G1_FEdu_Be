import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Circle, 
  Map, 
  Loader, 
  ChevronRight, 
  Plus, 
  Trash2, 
  BookOpen, 
  X, 
  HelpCircle,
  AlertTriangle,
  Edit2,
  GitFork,
  Video as VideoIcon,
  FileText,
  ArrowUp,
  ArrowDown,
  GraduationCap,
  Play,
  Undo2
} from 'lucide-react';
import { teacherService } from '../../../services/teacher.service';
import { 
  learningPathService, 
  LearningNodeResponse, 
  NodeEdgeResponse, 
  ClassroomGraphResponse 
} from '../../../services/learningPath.service';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Checkbox } from '../../../components/ui/checkbox';

interface Student {
  id: string;
  fullName: string;
  progress: number;
}

export function ClassOverviewPage() {
  const navigate = useNavigate();
  const { classroomId } = useParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [classInfo, setClassInfo] = useState({ classCode: '', courseCode: '', subjectId: 0 });
  const [nodes, setNodes] = useState<LearningNodeResponse[]>([]);
  const [edges, setEdges] = useState<NodeEdgeResponse[]>([]);
  const [pathId, setPathId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({});

  // Classroom Publish Flow State
  const [graphData, setGraphData] = useState<ClassroomGraphResponse | null>(null);
  const [actionState, setActionState] = useState<'idle' | 'cloning' | 'publishing' | 'unpublishing' | 'deleting'>('idle');
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [understandPublish, setUnderstandPublish] = useState(false);
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);
  const [understandUnpublish, setUnderstandUnpublish] = useState(false);
  const [showUnpublishError, setShowUnpublishError] = useState(false);
  const [unpublishErrorMsg, setUnpublishErrorMsg] = useState<string | null>(null);
  const [seededCount, setSeededCount] = useState<number | null>(null);

  // Modals state
  const [isAddNodeOpen, setIsAddNodeOpen] = useState(false);
  const [isEditNodeOpen, setIsEditNodeOpen] = useState(false);
  const [nodeToEdit, setNodeToEdit] = useState<LearningNodeResponse | null>(null);
  const [isAddEdgeOpen, setIsAddEdgeOpen] = useState(false);
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [isAddTestOpen, setIsAddTestOpen] = useState(false);
  const [selectedNodeForContent, setSelectedNodeForContent] = useState<LearningNodeResponse | null>(null);

  // Node Contents & Loading States
  const [nodeContents, setNodeContents] = useState<Record<number, any>>({});
  const [loadingContents, setLoadingContents] = useState<Record<number, boolean>>({});

  // Custom delete confirm dialog state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState<{ nodeId: number, title: string } | null>(null);
  const [understandDelete, setUnderstandDelete] = useState(false);

  // New Node Form State
  const [newNodeTitle, setNewNodeTitle] = useState('');
  const [newNodeDesc, setNewNodeDesc] = useState('');
  const [newNodeType, setNewNodeType] = useState<'AT_HOME' | 'ON_CLASS'>('AT_HOME');
  const [newNodeStatus, setNewNodeStatus] = useState<'LOCKED' | 'OPEN' | 'HIDDEN'>('LOCKED');
  const [newNodeOrder, setNewNodeOrder] = useState<number>(1);
  const [newNodeRequired, setNewNodeRequired] = useState(true);
  const [newNodeBranch, setNewNodeBranch] = useState('');
  const [newNodePredecessor, setNewNodePredecessor] = useState<string>('');

  // Edge score requirements state
  const [isPredecessorLocked, setIsPredecessorLocked] = useState(false);
  const [edgeMinScore, setEdgeMinScore] = useState('');
  const [edgeMaxScore, setEdgeMaxScore] = useState('');

  // Edge Creation Form State (standalone)
  const [edgeFromNodeId, setEdgeFromNodeId] = useState('');
  const [edgeToNodeId, setEdgeToNodeId] = useState('');
  const [edgeBranch, setEdgeBranch] = useState('');

  // Node Material Form State
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialRequired, setMaterialRequired] = useState(true);
  const [materialType, setMaterialType] = useState<'video' | 'file'>('video');
  const [materialVideoUrl, setMaterialVideoUrl] = useState('');
  const [materialVideoDesc, setMaterialVideoDesc] = useState('');
  const [materialVideoDur, setMaterialVideoDur] = useState('');
  const [materialFileUrl, setMaterialFileUrl] = useState('');
  const [materialFileName, setMaterialFileName] = useState('');
  const [materialFileDesc, setMaterialFileDesc] = useState('');
  const [materialSelectedFile, setMaterialSelectedFile] = useState<File | null>(null);

  // Node Test Form State
  const [testTitle, setTestTitle] = useState('');
  const [testDesc, setTestDesc] = useState('');
  const [testDuration, setTestDuration] = useState('15');
  const [testPassPercent, setTestPassPercent] = useState('80.00');

  const fetchNodeContent = async (nodeId: number) => {
    setLoadingContents((prev) => ({ ...prev, [nodeId]: true }));
    try {
      const content = await learningPathService.getTeacherNodeContent(nodeId);
      setNodeContents((prev) => ({ ...prev, [nodeId]: content }));
    } catch (err: any) {
      console.error("Failed to load node content", err);
    } finally {
      setLoadingContents((prev) => ({ ...prev, [nodeId]: false }));
    }
  };

  const toggleNode = (id: number) => {
    const nextState = !expandedNodes[id];
    setExpandedNodes((prev) => ({
      ...prev,
      [id]: nextState,
    }));
    if (nextState && !nodeContents[id]) {
      fetchNodeContent(id);
    }
  };

  const handleEditNodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeToEdit || !nodeToEdit.title.trim()) {
      toast.error("Tên bài học không được để trống");
      return;
    }
    try {
      await learningPathService.updateLearningNode(nodeToEdit.nodeId, {
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
      if (classroomId) {
        await fetchGraphData(Number(classroomId));
      }
    } catch (err: any) {
      toast.error(err.message || "Cập nhật bài học thất bại");
    }
  };

  const handleAddEdgeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edgeFromNodeId || !edgeToNodeId) {
      toast.error("Vui lòng chọn đầy đủ bài học nguồn và đích");
      return;
    }
    if (edgeFromNodeId === edgeToNodeId) {
      toast.error("Bài học nguồn và đích không được trùng nhau");
      return;
    }
    try {
      await learningPathService.createNodeEdge({
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
      if (classroomId) {
        await fetchGraphData(Number(classroomId));
      }
    } catch (err: any) {
      toast.error(err.message || "Tạo liên kết tiên quyết thất bại");
    }
  };

  const handleDeleteEdge = async (edgeId: number) => {
    try {
      await learningPathService.deleteTeacherEdge(edgeId);
      toast.success("Đã xóa liên kết tiên quyết");
      if (classroomId) {
        await fetchGraphData(Number(classroomId));
      }
    } catch (err: any) {
      toast.error(err.message || "Xóa liên kết tiên quyết thất bại");
    }
  };

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

      await learningPathService.addTeacherNodeMaterial(selectedNodeForContent.nodeId, formData);
      toast.success("Thêm tài liệu học tập thành công");
      setIsAddMaterialOpen(false);

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
      await learningPathService.addTeacherNodeTest(targetNodeId, {
        title: testTitle,
        description: testDesc,
        durationMinutes: testDuration ? Number(testDuration) : undefined,
        passingPercentage: testPassPercent ? Number(testPassPercent) : undefined,
      });
      toast.success("Thêm bài kiểm tra thành công");
      setIsAddTestOpen(false);

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
      await learningPathService.deleteTeacherNodeMaterial(materialId);
      toast.success("Đã xóa tài liệu học tập");
      await fetchNodeContent(nodeId);
    } catch (err: any) {
      toast.error(err.message || "Xóa tài liệu thất bại");
    }
  };

  const handleDeleteTest = async (testId: number, nodeId: number) => {
    try {
      await learningPathService.deleteTeacherNodeTest(testId);
      toast.success("Đã xóa bài kiểm tra");
      await fetchNodeContent(nodeId);
    } catch (err: any) {
      toast.error(err.message || "Xóa bài kiểm tra thất bại");
    }
  };

  const getSortedTimelineItems = (nodeId: number) => {
    const content = nodeContents[nodeId];
    if (!content) return [];
    const materials = (content.materials || []).map((m: any) => ({
      key: `material-${m.materialId}`,
      id: m.materialId,
      type: "MATERIAL" as const,
      title: m.title,
      orderIndex: m.orderIndex ?? 9999,
      data: m,
    }));
    const tests = (content.tests || []).map((t: any) => ({
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
      const updatedMaterials = (nodeContents[nodeId]?.materials || []).map((m: any) => {
        const req = requests.find((r) => r.id === m.materialId && r.type === "MATERIAL");
        return req ? { ...m, orderIndex: req.orderIndex } : m;
      });
      const updatedTests = (nodeContents[nodeId]?.tests || []).map((t: any) => {
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

      await learningPathService.reorderTeacherNodeContent(nodeId, requests);
      toast.success("Cập nhật thứ tự thành công");
      await fetchNodeContent(nodeId);
    } catch (err: any) {
      toast.error(err.message || "Cập nhật thứ tự thất bại");
      await fetchNodeContent(nodeId);
    }
  };

  const handleClone = async () => {
    if (!classroomId || !selectedTemplateId) return;
    try {
      setActionState('cloning');
      await learningPathService.cloneFromTemplate(Number(classroomId), selectedTemplateId);
      toast.success("Clone lộ trình thành công");
      
      await fetchGraphData(Number(classroomId));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to clone learning path');
    } finally {
      setActionState('idle');
    }
  };

  const handlePublish = async () => {
    if (!classroomId || !pathId) return;
    try {
      setActionState('publishing');
      const res = await learningPathService.publishClassroomPath(Number(classroomId), pathId);
      setSeededCount(res.seededStudents);
      toast.success(`Publish lộ trình thành công! Đã seed tiến trình cho ${res.seededStudents} học sinh.`);
      
      await fetchGraphData(Number(classroomId));
      setShowPublishConfirm(false);
      setUnderstandPublish(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to publish learning path');
    } finally {
      setActionState('idle');
    }
  };

  const handleUnpublish = async () => {
    if (!classroomId || !pathId) return;
    try {
      setActionState('unpublishing');
      await learningPathService.unpublishClassroomPath(Number(classroomId), pathId);
      toast.success("Rút lại lộ trình thành công");
      
      await fetchGraphData(Number(classroomId));
      setShowUnpublishConfirm(false);
      setUnderstandUnpublish(false);
    } catch (err: any) {
      if (err.response?.status === 409) {
        setUnpublishErrorMsg(err.response?.data?.message || 'Không thể unpublish — đã có học sinh hoàn thành node.');
        setShowUnpublishError(true);
      } else {
        toast.error(err.response?.data?.message || 'Failed to unpublish learning path');
      }
    } finally {
      setActionState('idle');
    }
  };

  const handleDeleteDraft = async () => {
    if (!classroomId || !pathId) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa bản nháp này không? Lộ trình sẽ bị xóa vĩnh viễn.')) return;
    
    try {
      setActionState('deleting');
      await learningPathService.deleteDraftPath(Number(classroomId), pathId);
      toast.success("Đã xóa bản nháp thành công");
      
      setSelectedTemplateId(null);
      await fetchGraphData(Number(classroomId));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete draft');
    } finally {
      setActionState('idle');
    }
  };

  const fetchGraphData = async (classroomIdVal: number) => {
    try {
      const graph = await learningPathService.getClassroomGraph(classroomIdVal);
      setGraphData(graph);
      setPathId(graph.pathId); 
      setNodes(graph.nodes || []);
      setEdges(graph.edges || []);
      setNewNodeOrder((graph.nodes?.length || 0) + 1);

      // Expand the first node by default if available and not expanded yet
      if (graph.nodes && graph.nodes.length > 0 && Object.keys(expandedNodes).length === 0) {
        const firstNodeId = graph.nodes[0].nodeId;
        setExpandedNodes({ [firstNodeId]: true });
        await fetchNodeContent(firstNodeId);
      }
    } catch (err) {
      console.error('Error fetching classroom learning path graph:', err);
    }
  };

  useEffect(() => {
    const fetchClassroomData = async () => {
      if (!classroomId) return;

      try {
        setLoading(true);
        const [classData, studentsData] = await Promise.all([
          teacherService.getClassroomById(Number(classroomId)),
          teacherService.getStudentsInClassroom(Number(classroomId)),
        ]);
        setClassInfo({
          classCode: classData.className,       
          courseCode: classData.subjectCode,     
          subjectId: classData.subjectId,       
        });
        const formatted = (studentsData ?? []).map((item) => ({
          id: item.email?.split('@')[0].toUpperCase() || `ST${item.userId}`,
          fullName: (item.lastName || item.firstName)
            ? `${item.lastName || ''} ${item.firstName || ''}`.trim()
            : `Student ${item.userId}`,
          progress: 0,
        }));
        setStudents(formatted);
        await fetchGraphData(Number(classroomId));
      } catch (err: any) {
        console.error('Error loading classroom management:', err);
        setError(err.response?.data?.message || 'Failed to load classroom data');
      } finally {
        setLoading(false);
      }
    };

    fetchClassroomData();
  }, [classroomId]);

  // Auto-select template if there's only one template available
  useEffect(() => {
    if (graphData?.state === 'NO_PATH' && graphData.availableTemplates) {
      if (graphData.availableTemplates.length === 1) {
        setSelectedTemplateId(graphData.availableTemplates[0].pathId);
      }
    }
  }, [graphData]);

  // Cross-tab consistency
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && classroomId) {
        fetchGraphData(Number(classroomId))
          .catch(err => console.error('Error auto-refreshing graph:', err));
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [classroomId]);

  const handleAddNodeClick = () => {
    setNewNodeTitle('');
    setNewNodeDesc('');
    setNewNodeType('AT_HOME');
    setNewNodeStatus('LOCKED');
    setNewNodeRequired(true);
    setNewNodeBranch('');
    setNewNodePredecessor('');
    setIsPredecessorLocked(false);
    setEdgeMinScore('');
    setEdgeMaxScore('');
    setIsAddNodeOpen(true);
  };

  const handleAddNextNodeClick = (node: LearningNodeResponse) => {
    setNewNodeTitle('');
    setNewNodeDesc('');
    setNewNodeType('AT_HOME');
    setNewNodeStatus('LOCKED');
    setNewNodeRequired(true);
    setNewNodeBranch(node.branchName || '');
    setNewNodePredecessor(node.nodeId.toString());
    setIsPredecessorLocked(true);
    setEdgeMinScore('');
    setEdgeMaxScore('');
    setIsAddNodeOpen(true);
  };

  const triggerRemoveNodeDialog = (nodeId: number, title: string) => {
    setNodeToDelete({ nodeId, title });
    setUnderstandDelete(false);
    setShowDeleteConfirm(true);
  };

  const handleRemoveNodeConfirm = async () => {
    if (!nodeToDelete) return;
    try {
      await learningPathService.deleteLearningNode(nodeToDelete.nodeId);
      toast.success(`Node "${nodeToDelete.title}" deleted successfully`);
      setShowDeleteConfirm(false);
      setNodeToDelete(null);
      if (classroomId) {
        await fetchGraphData(Number(classroomId));
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete node');
    }
  };

  const handleAddNodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeTitle.trim()) {
      toast.error('Node title is required');
      return;
    }
    if (!pathId) {
      toast.error('Learning path template not loaded');
      return;
    }

    try {
      const createdNode = await learningPathService.createLearningNode({
        classroomPathId: pathId,
        title: newNodeTitle,
        description: newNodeDesc,
        nodeType: newNodeType,
        branchName: newNodeBranch || undefined,
        displayOrder: newNodeOrder,
        status: newNodeStatus,
        isRequired: newNodeRequired
      });

      if (newNodePredecessor) {
        await learningPathService.createNodeEdge({
          fromNodeId: Number(newNodePredecessor),
          toNodeId: createdNode.nodeId,
          branchName: newNodeBranch || undefined,
          minScore: edgeMinScore ? Number(edgeMinScore) : undefined,
          maxScore: edgeMaxScore ? Number(edgeMaxScore) : undefined
        });
      }

      toast.success('Node created successfully');
      setIsAddNodeOpen(false);

      // Reset Form State
      setNewNodeTitle('');
      setNewNodeDesc('');
      setNewNodeType('AT_HOME');
      setNewNodeStatus('LOCKED');
      setNewNodeRequired(true);
      setNewNodeBranch('');
      setNewNodePredecessor('');
      setEdgeMinScore('');
      setEdgeMaxScore('');

      if (classroomId) {
        await fetchGraphData(Number(classroomId));
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create node');
    }
  };

  const getNodeColorClass = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'border-l-4 border-l-green-500 hover:bg-green-50/5';
      case 'LOCKED':
        return 'border-l-4 border-l-gray-300 hover:bg-muted/5 opacity-85';
      case 'HIDDEN':
        return 'border-l-4 border-l-yellow-500 hover:bg-yellow-50/5 opacity-70';
      default:
        return 'border-l-4 border-l-gray-300 hover:bg-muted/5';
    }
  };

  const getNodeIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <CheckCircle2 className="size-5 text-green-600" />;
      case 'LOCKED':
        return <Circle className="size-5 text-gray-400" />;
      case 'HIDDEN':
        return <HelpCircle className="size-5 text-yellow-500" />;
      default:
        return <Circle className="size-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => navigate('/teacher/courses')}>
          Back to Courses
        </Button>
      </div>
    );
  }  const isPublished = graphData?.state === 'PUBLISHED';
  const isEditorLocked = false;
  const lockTooltip = "Lộ trình đã xuất bản. Các chỉnh sửa sẽ áp dụng trực tiếp cho học sinh.";
  const isNonIdle = actionState !== 'idle';
  return (
    <div className={`space-y-6 relative ${isNonIdle ? 'pointer-events-none opacity-60' : ''}`} aria-busy={isNonIdle}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)} disabled={isNonIdle}>
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            Lớp {classInfo.classCode} - {classInfo.courseCode}
          </h1>
        </div>
      </div>

      {/* Hero pub/unpub state zones */}
      {graphData?.state === 'NO_PATH' && (
        <Card className="border-indigo-100 bg-indigo-50/10">
          <CardContent className="pt-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <h2 className="text-lg font-semibold text-indigo-900">Chọn template để bắt đầu</h2>
              <p className="text-sm text-muted-foreground">Lớp học này chưa cấu hình lộ trình. Vui lòng chọn một lộ trình mẫu từ khoa.</p>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto shrink-0 flex-wrap">
              {graphData.availableTemplates && graphData.availableTemplates.length > 0 ? (
                <>
                  <select 
                    id="template-select"
                    className="flex h-9 w-full md:w-64 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring bg-white"
                    value={selectedTemplateId || ''}
                    onChange={(e) => setSelectedTemplateId(Number(e.target.value) || null)}
                    disabled={isNonIdle}
                  >
                    <option value="">-- Chọn lộ trình mẫu --</option>
                    {graphData.availableTemplates.map((t) => (
                      <option key={t.pathId} value={t.pathId}>
                        {t.pathName} ({t.nodeCount} bài học)
                      </option>
                    ))}
                  </select>
                  <Button 
                    onClick={handleClone} 
                    disabled={isNonIdle || !selectedTemplateId} 
                    className="w-full md:w-auto"
                  >
                    {actionState === 'cloning' ? <Loader className="size-4 animate-spin mr-1" /> : <Play className="size-4 mr-1" />}
                    Clone lộ trình
                  </Button>
                </>
              ) : (
                <div className="text-sm text-red-600 bg-red-50 py-2 px-3 rounded-md border border-red-100">
                  Môn học này chưa có template. Liên hệ admin. <a href="/contact" className="underline font-semibold hover:text-red-700">Liên hệ admin</a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {graphData?.state === 'DRAFT' && (
        <Card className="border-amber-100 bg-amber-50/10" role="alert">
          <CardContent className="pt-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-900 font-semibold">
                <AlertTriangle className="size-5 text-amber-600" />
                <span>Bản nháp — chưa publish</span>
              </div>
              <p className="text-sm text-muted-foreground">Bạn có thể chỉnh sửa tự do bài học, liên kết tiên quyết và tài liệu. Học sinh sẽ không nhìn thấy lộ trình này cho đến khi bạn publish.</p>
            </div>
            
            <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
              <Button 
                variant="outline" 
                onClick={handleDeleteDraft} 
                disabled={isNonIdle}
                className="w-full md:w-auto text-red-700 hover:text-red-800 hover:bg-red-50 border-red-200"
              >
                <Trash2 className="size-4 mr-1" />
                Xóa bản nháp
              </Button>
              <Button 
                onClick={() => setShowPublishConfirm(true)} 
                disabled={isNonIdle}
                className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                <Play className="size-4 mr-1" />
                Xuất bản lộ trình
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {graphData?.state === 'PUBLISHED' && (
        <Card className="border-emerald-100 bg-emerald-50/10" role="alert">
          <CardContent className="pt-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-950 font-semibold">
                <CheckCircle2 className="size-5 text-emerald-600" />
                <span>Đã publish lộ trình học</span>
              </div>
              <p className="text-sm text-muted-foreground">Lộ trình học đã được mở cho học sinh. Mọi tiến độ học tập đang được ghi nhận và các chỉnh sửa đã bị khóa.</p>
            </div>
            
            <div className="shrink-0 w-full md:w-auto">
              <Button 
                variant="outline"
                onClick={() => setShowUnpublishConfirm(true)} 
                disabled={isNonIdle}
                className="w-full md:w-auto text-amber-700 hover:text-amber-850 hover:bg-amber-55/10 border-amber-300"
              >
                <Undo2 className="size-4 mr-1" />
                Rút lại lộ trình
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Interactive Classroom Roadmap Builder */}
        <div className="rounded-xl p-6" style={{ backgroundColor: "white", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          {/* Header & Designer Section */}
          <div className="pb-5 mb-5 border-b border-gray-100 space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" style={{ color: "#4338ca" }} />
                <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#111827" }}>
                  Lộ trình lớp học
                </h2>
              </div>
              {graphData?.state !== 'NO_PATH' && (
                <div className="flex items-center gap-2">
                  <button
                    disabled={isEditorLocked}
                    onClick={handleAddNodeClick}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: isEditorLocked ? "#9ca3af" : "linear-gradient(135deg, #4338ca, #7c3aed)", border: "none", cursor: isEditorLocked ? "not-allowed" : "pointer" }}
                    title={isEditorLocked ? lockTooltip : undefined}
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm bài học
                  </button>
                  <button
                    disabled={nodes.length < 2 || isEditorLocked}
                    onClick={() => setIsAddEdgeOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors border border-teal-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={isEditorLocked ? lockTooltip : undefined}
                  >
                    <GitFork className="w-3.5 h-3.5" /> Liên kết tiên quyết
                  </button>
                </div>
              )}
            </div>

            {/* Publish / Unpublish actions block */}
            {graphData && graphData.state !== 'NO_PATH' && (
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/50 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-500 dark:text-gray-400">Trạng thái lộ trình:</span>
                  {isPublished ? (
                    <span className="px-2 py-0.5 rounded bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400 font-bold border border-green-200 dark:border-green-900/30">
                      ĐÃ XUẤT BẢN
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-450 font-bold border border-amber-200 dark:border-amber-900/30">
                      BẢN NHÁP
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!isPublished ? (
                    <>
                      <button
                        type="button"
                        onClick={handleDeleteDraft}
                        className="px-2.5 py-1 text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 border border-red-200 dark:border-red-900/30 rounded-lg transition-colors cursor-pointer"
                      >
                        Xóa bản nháp
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPublishConfirm(true)}
                        className="px-2.5 py-1 text-xs font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-950/50 border border-green-200 dark:border-green-900/30 rounded-lg transition-colors cursor-pointer"
                      >
                        Xuất bản
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowUnpublishConfirm(true)}
                      className="px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50 border border-amber-200 dark:border-amber-900/30 rounded-lg transition-colors cursor-pointer"
                    >
                      Hủy xuất bản
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {nodes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-gray-200 rounded-lg">
                <Map className="size-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm mb-4">
                  {graphData?.state === 'NO_PATH' 
                    ? "Chưa cấu hình lộ trình. Chọn template ở trên để clone và bắt đầu." 
                    : "Chưa có bài học nào trong lộ trình lớp học."}
                </p>
                {graphData?.state !== 'NO_PATH' && (
                  <div title={isEditorLocked ? lockTooltip : undefined}>
                    <Button onClick={handleAddNodeClick} disabled={isEditorLocked} size="sm">
                      Tạo bài học đầu tiên
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden divide-y divide-border shadow-sm">
                {nodes.map((node) => {
                  const isExpanded = !!expandedNodes[node.nodeId];
                  const incomingEdges = edges.filter((e) => e.toNodeId === node.nodeId);
                  const incomingNodesInfo = incomingEdges
                    .map((e) => {
                      const fromNode = nodes.find((n) => n.nodeId === e.fromNodeId);
                      return {
                        edgeId: e.edgeId,
                        fromTitle: fromNode ? fromNode.title : `Bài học #${e.fromNodeId}`,
                        minScore: e.minScore,
                        maxScore: e.maxScore,
                      };
                    });

                  return (
                    <div
                      key={node.nodeId}
                      className={`transition-all duration-200 ${getNodeColorClass(node.status)}`}
                    >
                      {/* Header */}
                      <div
                        onClick={() => toggleNode(node.nodeId)}
                        className="flex items-center justify-between p-4 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`p-1 rounded transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-90' : ''}`}>
                            <ChevronRight className="size-4 text-muted-foreground" />
                          </div>
                          <div className="shrink-0">
                            {getNodeIcon(node.status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-semibold text-sm ${node.status === 'LOCKED' ? 'text-muted-foreground' : 'text-foreground'}`}>
                                {node.title}
                              </span>
                              <Badge variant="outline" className="text-[10px] py-0 px-1 font-normal bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-indigo-200">
                                {node.nodeType === 'ON_CLASS' ? 'Lên lớp' : 'Tự học'}
                              </Badge>
                              {node.isRequired && (
                                <Badge className="text-[10px] py-0 px-1 font-normal bg-red-50 text-red-700 hover:bg-red-50 border-red-200" variant="outline">
                                  Bắt buộc
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider pl-4 shrink-0">
                          Thứ tự: {node.displayOrder}
                        </div>
                      </div>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-2 bg-muted/5 border-t border-muted/20 space-y-3">
                          <p className="text-sm text-muted-foreground">
                            {node.description || 'Chưa có mô tả chi tiết.'}
                          </p>

                          {/* Prerequisites (edges) */}
                          {incomingNodesInfo.length > 0 && (
                            <div className="text-xs border border-gray-200 bg-white rounded-lg p-3 space-y-2 shadow-sm">
                              <div className="font-semibold text-gray-700 flex items-center gap-1">
                                <GitFork className="w-3.5 h-3.5 text-indigo-650" />
                                <span>Điều kiện tiên quyết (Prerequisites):</span>
                              </div>
                              <div className="divide-y divide-gray-100">
                                {incomingNodesInfo.map((info) => (
                                  <div key={info.edgeId} className="flex items-center justify-between py-1.5">
                                    <span className="text-gray-650 font-medium">
                                      Sau khi hoàn thành: <strong className="text-gray-800">{info.fromTitle}</strong>
                                      {(info.minScore !== undefined || info.maxScore !== undefined) && (
                                        <span className="text-[10px] text-indigo-600 ml-1">
                                          ({info.minScore !== undefined ? `Min: ${info.minScore}` : ""}
                                          {info.minScore !== undefined && info.maxScore !== undefined ? ", " : ""}
                                          {info.maxScore !== undefined ? `Max: ${info.maxScore}` : ""})
                                        </span>
                                      )}
                                    </span>
                                    {!isEditorLocked && (
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
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="text-xs text-muted-foreground">
                            Nhánh: <span className="font-semibold text-foreground">{node.branchName || "Main"}</span>
                            <span className="ml-4">Trạng thái ban đầu: <span className="font-semibold text-foreground">{node.status}</span></span>
                          </div>

                          {/* Node Content (Materials & Tests) Timeline */}
                          <div className="border border-gray-200 rounded-lg p-3 bg-white space-y-3 shadow-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-gray-705 flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                                Tài liệu & Bài kiểm tra
                              </span>
                              {!isEditorLocked && (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedNodeForContent(node);
                                      setIsAddMaterialOpen(true);
                                    }}
                                    className="text-[10px] font-bold text-indigo-650 hover:text-indigo-850 hover:underline transition-colors"
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
                                    className="text-[10px] font-bold text-indigo-650 hover:text-indigo-850 hover:underline transition-colors"
                                  >
                                    + Thêm bài kiểm tra
                                  </button>
                                </div>
                              )}
                            </div>

                            {loadingContents[node.nodeId] ? (
                              <div className="flex items-center gap-2 py-2 text-xs text-gray-400">
                                <Loader className="w-3.5 h-3.5 animate-spin" />
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
                                        {/* Reorder Buttons */}
                                        {!isEditorLocked && (
                                          <div className="flex flex-col gap-0.5 shrink-0 pt-0.5">
                                            <button
                                              disabled={index === 0}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleReorderContent(node.nodeId, item.id, item.type, "up");
                                              }}
                                              className={`p-0.5 rounded transition-colors ${
                                                index === 0
                                                  ? "text-gray-300 cursor-not-allowed opacity-50"
                                                  : "text-gray-550 hover:bg-gray-200 hover:text-gray-700"
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
                                                  ? "text-gray-300 cursor-not-allowed opacity-50"
                                                  : "text-gray-550 hover:bg-gray-200 hover:text-gray-700"
                                              }`}
                                              title="Di chuyển xuống"
                                            >
                                              <ArrowDown className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        )}

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

                                          {isMaterial && m?.video && (
                                            <div className="text-gray-555 flex items-center gap-1.5 flex-wrap text-[11px]">
                                              <span className="px-1 py-0.2 bg-teal-50 text-teal-700 border border-teal-100 rounded text-[9px] font-semibold flex items-center gap-0.5 shrink-0">
                                                <VideoIcon className="w-2.5 h-2.5" /> Video
                                              </span>
                                              <a
                                                href={m.video.videoUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-indigo-650 hover:underline truncate max-w-[180px]"
                                                title={m.video.videoUrl}
                                              >
                                                {m.video.videoUrl}
                                              </a>
                                            </div>
                                          )}
                                          {isMaterial && m?.file && (
                                            <div className="text-gray-555 flex items-center gap-1.5 flex-wrap text-[11px]">
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
                                                className="text-indigo-650 hover:underline truncate max-w-[180px]"
                                                title={m.file.fileName}
                                              >
                                                {m.file.fileName || "Tải tài liệu"}
                                              </a>
                                            </div>
                                          )}
                                          {!isMaterial && t && (
                                            <div className="text-[10px] text-gray-555">
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
                                        {!isEditorLocked && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (isMaterial) {
                                                handleDeleteMaterial(item.id, node.nodeId);
                                              } else {
                                                handleDeleteTest(item.id, node.nodeId);
                                              }
                                            }}
                                            className="p-1 rounded text-red-500 hover:bg-red-50 hover:text-red-750 shrink-0 transition-colors self-center cursor-pointer"
                                            title={isMaterial ? "Xóa tài liệu" : "Xóa bài kiểm tra"}
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                          </div>

                          {/* Operations bar */}
                          {!isEditorLocked && (
                            <div className="flex items-center gap-2 pt-2 border-t border-gray-200/50 flex-wrap">
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-card hover:bg-muted text-xs h-8 text-indigo-700 hover:text-indigo-850 hover:bg-indigo-50/50"
                                onClick={() => handleAddNextNodeClick(node)}
                              >
                                <Plus className="size-3.5 mr-1" />
                                Thêm bài tiếp
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-card hover:bg-muted text-xs h-8 text-gray-750 hover:bg-gray-100"
                                onClick={() => {
                                  setNodeToEdit(node);
                                  setIsEditNodeOpen(true);
                                }}
                              >
                                <Edit2 className="size-3.5 mr-1" />
                                Chỉnh sửa
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive border-destructive/20 hover:border-destructive hover:bg-destructive/5 text-xs h-8"
                                onClick={() => triggerRemoveNodeDialog(node.nodeId, node.title)}
                              >
                                <Trash2 className="size-3.5 mr-1" />
                                Xóa bài học
                              </Button>
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
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Student List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Full Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-6 text-muted-foreground">
                      No students enrolled in this classroom.
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.id}</TableCell>
                      <TableCell>{student.fullName}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Hidden helper element for aria accessibility */}
      {isPublished && (
        <span id="lock-reason" className="sr-only">
          {lockTooltip}
        </span>
      )}

      {/* CUSTOM CONFIRM DIALOG FOR NODE DELETION */}
      <Dialog open={showDeleteConfirm} onOpenChange={(open) => { if (!open) { setShowDeleteConfirm(false); setUnderstandDelete(false); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="size-5 shrink-0" />
              <span>Xác nhận xóa bài học</span>
            </DialogTitle>
            <DialogDescription>
              Hành động này sẽ xóa vĩnh viễn bài học khỏi lộ trình của lớp.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa bài học <strong>"{nodeToDelete?.title}"</strong>? Mọi liên kết prerequisite edges liên quan đến bài học này cũng sẽ bị xóa.
            </p>
            <div className="flex items-start gap-2 pt-2">
              <Checkbox 
                id="understand-delete" 
                checked={understandDelete} 
                onCheckedChange={(val) => setUnderstandDelete(!!val)} 
              />
              <label 
                htmlFor="understand-delete" 
                className="text-xs text-gray-700 leading-tight cursor-pointer select-none font-medium"
              >
                Tôi đồng ý xóa bài học và chấp nhận mất các liên kết prerequisites đi kèm.
              </label>
            </div>
          </div>
          <DialogFooter className="sm:justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => { setShowDeleteConfirm(false); setUnderstandDelete(false); }}
            >
              Hủy
            </Button>
            <Button 
              onClick={handleRemoveNodeConfirm} 
              disabled={!understandDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-medium"
            >
              Xóa bài học
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADD NODE MODAL */}
      {isAddNodeOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-gray-150">
              <h2 className="text-lg font-semibold text-gray-900">Create New Learning Node</h2>
              <button onClick={() => setIsAddNodeOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleAddNodeSubmit} className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Node Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Introduction to Git"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newNodeTitle}
                  onChange={(e) => setNewNodeTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <textarea
                  placeholder="Briefly describe what students will learn..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newNodeDesc}
                  onChange={(e) => setNewNodeDesc(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Node Type</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    value={newNodeType}
                    onChange={(e) => setNewNodeType(e.target.value as any)}
                  >
                    <option value="AT_HOME">At Home</option>
                    <option value="ON_CLASS">On Class</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Initial Status</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    value={newNodeStatus}
                    onChange={(e) => setNewNodeStatus(e.target.value as any)}
                  >
                    <option value="LOCKED">Locked</option>
                    <option value="OPEN">Open</option>
                    <option value="HIDDEN">Hidden</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Display Order</label>
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
                  <label className="text-sm font-medium text-gray-700">Branch Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Main, Optional"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newNodeBranch}
                    onChange={(e) => setNewNodeBranch(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Prerequisite Predecessor (Create Edge)</label>
                <select
                  disabled={isPredecessorLocked}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-550 bg-white"
                  value={newNodePredecessor}
                  onChange={(e) => setNewNodePredecessor(e.target.value)}
                >
                  <option value="">-- No prerequisite (Disconnected) --</option>
                  {nodes.map(n => (
                    <option key={n.nodeId} value={n.nodeId}>{n.title} (Order: {n.displayOrder})</option>
                  ))}
                </select>
              </div>

              {newNodePredecessor && (
                <div className="grid grid-cols-2 gap-4 border border-indigo-100 bg-indigo-50/20 p-3 rounded-lg animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-indigo-905">Edge Min Score (Optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 8.0"
                      className="w-full border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={edgeMinScore}
                      onChange={(e) => setEdgeMinScore(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-indigo-905">Edge Max Score (Optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 10.0"
                      className="w-full border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={edgeMaxScore}
                      onChange={(e) => setEdgeMaxScore(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isRequiredChk"
                  className="rounded text-indigo-650 focus:ring-indigo-550 size-4"
                  checked={newNodeRequired}
                  onChange={(e) => setNewNodeRequired(e.target.checked)}
                />
                <label htmlFor="isRequiredChk" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Is Required Milestone
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-150 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddNodeOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Create Node
                </Button>
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
              <button onClick={() => { setIsEditNodeOpen(false); setNodeToEdit(null); }} className="text-gray-400 hover:text-gray-650">
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
                  className="rounded text-indigo-650 focus:ring-indigo-550 size-4 cursor-pointer"
                  checked={nodeToEdit.isRequired}
                  onChange={(e) => setNodeToEdit({ ...nodeToEdit, isRequired: e.target.checked })}
                />
                <label htmlFor="editNodeRequiredChk" className="text-sm font-semibold text-gray-700 cursor-pointer select-none">
                  Mốc bắt buộc hoàn thành (Required)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-105">
                <Button
                  type="button"
                  onClick={() => { setIsEditNodeOpen(false); setNodeToEdit(null); }}
                  variant="outline"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  Lưu thay đổi
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD EDGE MODAL */}
      {isAddEdgeOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-150">
              <h2 className="text-lg font-bold text-gray-900">Tạo liên kết tiên quyết</h2>
              <button onClick={() => setIsAddEdgeOpen(false)} className="text-gray-400 hover:text-gray-655">
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
                <Button
                  type="button"
                  onClick={() => setIsAddEdgeOpen(false)}
                  variant="outline"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  Tạo liên kết
                </Button>
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
                <p className="text-xs text-gray-550">Bài học: {selectedNodeForContent.title}</p>
              </div>
              <button onClick={() => { setIsAddMaterialOpen(false); setSelectedNodeForContent(null); }} className="text-gray-400 hover:text-gray-655">
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
                    <label className="text-xs font-semibold text-gray-755">Đường dẫn Video (YouTube URL) *</label>
                    <input
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={materialVideoUrl}
                      onChange={(e) => setMaterialVideoUrl(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-755">Mô tả video</label>
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
                    <label className="text-xs font-semibold text-gray-755">Chọn tập tin tải lên</label>
                    <input
                      type="file"
                      className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                      onChange={(e) => setMaterialSelectedFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  <div className="text-center text-xs text-gray-400 font-semibold py-1">HOẶC</div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-755">Hoặc nhập link file bên ngoài (Google Drive...)</label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/..."
                      className="w-full border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={materialFileUrl}
                      onChange={(e) => setMaterialFileUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-755">Tên file hiển thị (Optional)</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: React Cheatsheet PDF"
                      className="w-full border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={materialFileName}
                      onChange={(e) => setMaterialFileName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-755">Mô tả tài liệu</label>
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
                  className="rounded text-indigo-650 focus:ring-indigo-550 size-4 cursor-pointer"
                  checked={materialRequired}
                  onChange={(e) => setMaterialRequired(e.target.checked)}
                />
                <label htmlFor="materialRequiredChk" className="text-sm font-semibold text-gray-700 cursor-pointer select-none">
                  Bắt buộc hoàn thành để qua môn (Required)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <Button
                  type="button"
                  onClick={() => { setIsAddMaterialOpen(false); setSelectedNodeForContent(null); }}
                  variant="outline"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  Thêm tài liệu
                </Button>
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
                <p className="text-xs text-gray-550">Bài học: {selectedNodeForContent.title}</p>
              </div>
              <button onClick={() => { setIsAddTestOpen(false); setSelectedNodeForContent(null); }} className="text-gray-400 hover:text-gray-655">
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
                <Button
                  type="button"
                  onClick={() => { setIsAddTestOpen(false); setSelectedNodeForContent(null); }}
                  variant="outline"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  Thêm bài kiểm tra
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Publish */}
      <Dialog open={showPublishConfirm} onOpenChange={(open) => { if (!open) { setShowPublishConfirm(false); setUnderstandPublish(false); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận Publish lộ trình học</DialogTitle>
            <DialogDescription>
              Hành động này sẽ chính thức kích hoạt lộ trình học cho sinh viên.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-600 leading-relaxed font-semibold">
              Lộ trình sẽ mở khóa các bài học đầu tiên (entry nodes) cho <strong>{students.length} học sinh</strong> đang enroll trong lớp học này.
            </p>
            <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-md border border-amber-100 font-semibold">
              <strong>Chú ý:</strong> Hành động không thể hủy bỏ (unpublish) nếu đã có bất kỳ học sinh nào hoàn thành tối thiểu một bài học trong lộ trình.
            </p>
            <div className="flex items-start gap-2 pt-2">
              <Checkbox 
                id="understand-publish" 
                checked={understandPublish} 
                onCheckedChange={(val) => setUnderstandPublish(!!val)} 
              />
              <label 
                htmlFor="understand-publish" 
                className="text-xs text-gray-700 leading-tight cursor-pointer select-none font-medium"
              >
                Tôi hiểu và đồng ý publish lộ trình học cho sinh viên lớp này.
              </label>
            </div>
          </div>
          <DialogFooter className="sm:justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => { setShowPublishConfirm(false); setUnderstandPublish(false); }}
              disabled={actionState === 'publishing'}
            >
              Hủy
            </Button>
            <Button 
              onClick={handlePublish} 
              disabled={!understandPublish || actionState === 'publishing'}
              className="bg-green-600 hover:bg-green-700 text-white font-medium"
            >
              {actionState === 'publishing' ? (
                <>
                  <Loader className="size-4 animate-spin mr-1" />
                  Đang seed tiến độ cho {students.length} học sinh...
                </>
              ) : (
                'Publish ngay'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal for Unpublish */}
      <Dialog open={showUnpublishConfirm} onOpenChange={(open) => { if (!open) { setShowUnpublishConfirm(false); setUnderstandUnpublish(false); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận rút lại lộ trình học (Unpublish)</DialogTitle>
            <DialogDescription>
              Rút lại lộ trình học để chỉnh sửa thêm bản nháp.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-600 leading-relaxed font-semibold">
              Toàn bộ tiến độ học tập và ghi nhận bài học hiện tại của học sinh sẽ bị xóa sạch khỏi hệ thống.
            </p>
            <p className="text-sm text-red-700 bg-red-50 p-3 rounded-md border border-red-100 font-semibold">
              <strong>Cảnh báo:</strong> Hãy đảm bảo chưa có học sinh nào hoàn thành bất kỳ bài học nào, nếu không hệ thống sẽ từ chối rút lại lộ trình.
            </p>
            <div className="flex items-start gap-2 pt-2">
              <Checkbox 
                id="understand-unpublish" 
                checked={understandUnpublish} 
                onCheckedChange={(val) => setUnderstandUnpublish(!!val)} 
              />
              <label 
                htmlFor="understand-unpublish" 
                className="text-xs text-gray-700 leading-tight cursor-pointer select-none font-medium"
              >
                Tôi xác nhận muốn xóa sạch tiến trình hiện tại để đưa lộ trình về trạng thái nháp.
              </label>
            </div>
          </div>
          <DialogFooter className="sm:justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => { setShowUnpublishConfirm(false); setUnderstandUnpublish(false); }}
              disabled={actionState === 'unpublishing'}
            >
              Hủy
            </Button>
            <Button 
              onClick={handleUnpublish} 
              disabled={!understandUnpublish || actionState === 'unpublishing'}
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium"
            >
              {actionState === 'unpublishing' ? <Loader className="size-4 animate-spin mr-1" /> : null}
              Xác nhận Unpublish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unpublish Error Modal (already completed nodes) */}
      <Dialog open={showUnpublishError} onOpenChange={setShowUnpublishError}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="size-5 shrink-0" />
              <span>Không thể unpublish</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-gray-655 leading-relaxed font-semibold">
            {unpublishErrorMsg || 'Đã có học sinh hoàn thành node, không thể unpublish.'}
          </div>
          <DialogFooter className="sm:justify-end">
            <Button onClick={() => setShowUnpublishError(false)}>
              Đồng ý
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
