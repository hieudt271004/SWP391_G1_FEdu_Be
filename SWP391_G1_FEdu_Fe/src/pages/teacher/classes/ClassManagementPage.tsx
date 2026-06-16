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
  FileText,
  Film,
  Award,
  Download,
  ExternalLink
} from 'lucide-react';
import { teacherService } from '../../../services/teacher.service';
import { classroomService } from '../../../services/classroom.service';
import { 
  learningPathService, 
  LearningNodeResponse, 
  NodeEdgeResponse, 
  ClassroomGraphResponse,
  NodeContentResponse,
  BranchType
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

export function ClassManagementPage() {
  const navigate = useNavigate();
  const { classroomSubjectId } = useParams();
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

  // Modals state
  const [isAddNodeOpen, setIsAddNodeOpen] = useState(false);
  const [isAddContentOpen, setIsAddContentOpen] = useState(false);
  const [selectedNodeForContent, setSelectedNodeForContent] = useState<LearningNodeResponse | null>(null);
  
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
  const [newNodeBranch, setNewNodeBranch] = useState<BranchType | ''>('');
  const [newNodePredecessor, setNewNodePredecessor] = useState<string>('');

  // Edge score requirements state
  const [isPredecessorLocked, setIsPredecessorLocked] = useState(false);
  const [edgeMinScore, setEdgeMinScore] = useState('');
  const [edgeMaxScore, setEdgeMaxScore] = useState('');

  // Edit Node Modal & Form State
  const [isEditNodeOpen, setIsEditNodeOpen] = useState(false);
  const [nodeToEdit, setNodeToEdit] = useState<LearningNodeResponse | null>(null);
  const [editNodeTitle, setEditNodeTitle] = useState('');
  const [editNodeDesc, setEditNodeDesc] = useState('');
  const [editNodeType, setEditNodeType] = useState<'AT_HOME' | 'ON_CLASS'>('AT_HOME');
  const [editNodeStatus, setEditNodeStatus] = useState<'LOCKED' | 'OPEN' | 'HIDDEN'>('LOCKED');
  const [editNodeOrder, setEditNodeOrder] = useState<number>(1);
  const [editNodeRequired, setEditNodeRequired] = useState(true);
  const [editNodeBranch, setEditNodeBranch] = useState<BranchType | ''>('');
  const [editingNode, setEditingNode] = useState(false);

  // Node content state
  const [nodeContents, setNodeContents] = useState<Record<number, NodeContentResponse>>({});
  const [nodeContentsLoading, setNodeContentsLoading] = useState<Record<number, boolean>>({});

  // New Content Form State
  const [contentType, setContentType] = useState<'MATERIAL' | 'TEST'>('MATERIAL');
  const [materialType, setMaterialType] = useState<'FILE' | 'VIDEO' | 'EXTERNAL'>('FILE');
  const [contentTitle, setContentTitle] = useState('');
  const [isMaterialRequired, setIsMaterialRequired] = useState(true);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDescription, setFileDescription] = useState('');

  // Video URL State
  const [contentVideoUrl, setContentVideoUrl] = useState('');
  const [videoDuration, setVideoDuration] = useState<number | ''>('');
  const [videoDescription, setVideoDescription] = useState('');

  // External URL State
  const [contentFileUrl, setContentFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('');

  // Test State
  const [testTitle, setTestTitle] = useState('');
  const [testDescription, setTestDescription] = useState('');
  const [testDuration, setTestDuration] = useState<number | ''>('');
  const [testPassingPercentage, setTestPassingPercentage] = useState<number | ''>(80);

  // Submitting state
  const [submittingContent, setSubmittingContent] = useState(false);

  const fetchNodeContent = async (nodeId: number) => {
    try {
      setNodeContentsLoading((prev) => ({ ...prev, [nodeId]: true }));
      const content = await learningPathService.getTeacherNodeContent(nodeId);
      setNodeContents((prev) => ({ ...prev, [nodeId]: content }));
    } catch (err: any) {
      console.error(`Error loading content for node ${nodeId}:`, err);
      toast.error(err.response?.data?.message || 'Không thể tải nội dung bài học');
    } finally {
      setNodeContentsLoading((prev) => ({ ...prev, [nodeId]: false }));
    }
  };

  const toggleNode = async (id: number) => {
    const nextState = !expandedNodes[id];
    setExpandedNodes((prev) => ({
      ...prev,
      [id]: nextState,
    }));

    if (nextState) {
      await fetchNodeContent(id);
    }
  };

  const fetchGraphData = async (classroomSubjectIdVal: number) => {
    try {
      const graph = await learningPathService.getClassroomGraph(classroomSubjectIdVal);
      setGraphData(graph);
      setPathId(graph.pathId); 
      setNodes(graph.nodes || []);
      setEdges(graph.edges || []);
      setNewNodeOrder((graph.nodes?.length || 0) + 1);
    } catch (err) {
      console.error('Error fetching classroom learning path graph:', err);
    }
  };

  useEffect(() => {
    const fetchClassroomData = async () => {
      if (!classroomSubjectId) return;

      try {
        setLoading(true);
        const [classData, studentsData] = await Promise.all([
          teacherService.getClassroomSubjectById(Number(classroomSubjectId)),
          classroomService.getStudents(Number(classroomSubjectId)),
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
        await fetchGraphData(Number(classroomSubjectId));
      } catch (err: any) {
        console.error('Error loading classroom management:', err);
        setError(err.response?.data?.message || 'Failed to load classroom data');
      } finally {
        setLoading(false);
      }
    };

    fetchClassroomData();
  }, [classroomSubjectId]);

  // Cross-tab consistency
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && classroomSubjectId) {
        fetchGraphData(Number(classroomSubjectId))
          .catch(err => console.error('Error auto-refreshing graph:', err));
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [classroomSubjectId]);

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

  const handleAddContentClick = (node: LearningNodeResponse) => {
    setSelectedNodeForContent(node);
    setContentType('MATERIAL');
    setMaterialType('FILE');
    setContentTitle('');
    setIsMaterialRequired(true);
    setSelectedFile(null);
    setFileDescription('');
    setContentVideoUrl('');
    setVideoDuration('');
    setVideoDescription('');
    setContentFileUrl('');
    setFileName('');
    setFileType('');
    setTestTitle('');
    setTestDescription('');
    setTestDuration('');
    setTestPassingPercentage(80);
    setIsAddContentOpen(true);
  };

  const handleAddContentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNodeForContent) return;

    setSubmittingContent(true);
    try {
      if (contentType === 'MATERIAL') {
        if (!contentTitle.trim()) {
          toast.error('Tiêu đề tài liệu không được để trống');
          setSubmittingContent(false);
          return;
        }

        const formData = new FormData();
        formData.append('title', contentTitle.trim());
        formData.append('required', String(isMaterialRequired));

        if (materialType === 'FILE') {
          if (!selectedFile) {
            toast.error('Vui lòng chọn file tải lên');
            setSubmittingContent(false);
            return;
          }
          formData.append('file', selectedFile);
          if (fileDescription.trim()) {
            formData.append('fileDescription', fileDescription.trim());
          }
        } else if (materialType === 'VIDEO') {
          if (!contentVideoUrl.trim()) {
            toast.error('Vui lòng nhập đường dẫn video');
            setSubmittingContent(false);
            return;
          }
          formData.append('videoUrl', contentVideoUrl.trim());
          formData.append('videoTitle', contentTitle.trim());
          if (videoDuration) {
            formData.append('videoDuration', String(videoDuration));
          }
          if (videoDescription.trim()) {
            formData.append('videoDescription', videoDescription.trim());
          }
        } else if (materialType === 'EXTERNAL') {
          if (!contentFileUrl.trim()) {
            toast.error('Vui lòng nhập đường dẫn tài liệu');
            setSubmittingContent(false);
            return;
          }
          formData.append('fileUrl', contentFileUrl.trim());
          formData.append('fileName', fileName.trim() || contentTitle.trim());
          if (fileType.trim()) {
            formData.append('fileType', fileType.trim());
          }
          if (fileDescription.trim()) {
            formData.append('fileDescription', fileDescription.trim());
          }
        }

        await learningPathService.addTeacherNodeMaterial(selectedNodeForContent.nodeId, formData);
        toast.success('Thêm tài liệu học tập thành công!');
      } else {
        // Create Test
        if (!testTitle.trim()) {
          toast.error('Vui lòng nhập tiêu đề bài kiểm tra');
          setSubmittingContent(false);
          return;
        }
        await learningPathService.addTeacherNodeTest(selectedNodeForContent.nodeId, {
          title: testTitle.trim(),
          description: testDescription.trim() || undefined,
          durationMinutes: testDuration ? Number(testDuration) : undefined,
          passingPercentage: testPassingPercentage ? Number(testPassingPercentage) : undefined,
        });
        toast.success('Thêm bài kiểm tra thành công!');
      }

      setIsAddContentOpen(false);
      await fetchNodeContent(selectedNodeForContent.nodeId);
    } catch (err: any) {
      console.error('Lỗi khi thêm nội dung:', err);
      toast.error(err.response?.data?.message || 'Không thể thêm nội dung cho bài học');
    } finally {
      setSubmittingContent(false);
    }
  };

  const handleDeleteMaterial = async (nodeId: number, materialId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài liệu này không?')) return;
    try {
      await learningPathService.deleteTeacherNodeMaterial(materialId);
      toast.success('Xóa tài liệu học tập thành công!');
      await fetchNodeContent(nodeId);
    } catch (err: any) {
      console.error('Lỗi khi xóa tài liệu:', err);
      toast.error(err.response?.data?.message || 'Không thể xóa tài liệu');
    }
  };

  const handleDeleteTest = async (nodeId: number, testId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài kiểm tra này không?')) return;
    try {
      await learningPathService.deleteTeacherNodeTest(testId);
      toast.success('Xóa bài kiểm tra thành công!');
      await fetchNodeContent(nodeId);
    } catch (err: any) {
      console.error('Lỗi khi xóa bài kiểm tra:', err);
      toast.error(err.response?.data?.message || 'Không thể xóa bài kiểm tra');
    }
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
      if (classroomSubjectId) {
        await fetchGraphData(Number(classroomSubjectId));
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

      if (classroomSubjectId) {
        await fetchGraphData(Number(classroomSubjectId));
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create node');
    }
  };

  const handleEditNodeClick = (node: LearningNodeResponse) => {
    setNodeToEdit(node);
    setEditNodeTitle(node.title);
    setEditNodeDesc(node.description || '');
    setEditNodeType(node.nodeType);
    setEditNodeStatus(node.status);
    setEditNodeOrder(node.displayOrder);
    setEditNodeRequired(node.isRequired);
    setEditNodeBranch(node.branchName || '');
    setIsEditNodeOpen(true);
  };

  const handleEditNodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeToEdit) return;
    if (!editNodeTitle.trim()) {
      toast.error('Tiêu đề node không được để trống');
      return;
    }

    try {
      setEditingNode(true);
      const updated = await learningPathService.updateLearningNode(nodeToEdit.nodeId, {
        title: editNodeTitle.trim(),
        description: editNodeDesc.trim(),
        nodeType: editNodeType,
        status: editNodeStatus,
        displayOrder: editNodeOrder,
        isRequired: editNodeRequired,
        branchName: editNodeBranch || undefined,
      });

      toast.success('Cập nhật node thành công!');
      setIsEditNodeOpen(false);
      setNodeToEdit(null);

      // In-place state update
      setNodes((prevNodes) =>
        prevNodes.map((n) => (n.nodeId === updated.nodeId ? updated : n))
      );
    } catch (err: any) {
      console.error('Lỗi khi cập nhật node:', err);
      toast.error(err.response?.data?.message || 'Không thể cập nhật thông tin node');
    } finally {
      setEditingNode(false);
    }
  };

  const getNodeColorClass = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'border-l-4 border-l-green-500 hover:bg-green-50/5';
      case 'LOCKED':
        return 'border-l-4 border-l-gray-300 hover:bg-muted/5 opacity-80';
      case 'HIDDEN':
        return 'border-l-4 border-l-yellow-500 hover:bg-yellow-50/5 opacity-60';
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
  }

  const isPublished = graphData?.state === 'PUBLISHED';
  const lockTooltip = "Lộ trình đã publish. Unpublish trước khi sửa.";

  return (
    <div className="space-y-6 relative">
      {/* Sticky Published Banner */}
      {isPublished && (
        <div 
          className="sticky top-0 z-40 w-full bg-emerald-600 text-white py-2.5 px-4 rounded-md shadow-md flex items-center gap-2 mb-4 font-semibold text-sm animate-in slide-in-from-top duration-300"
          role="alert"
        >
          <CheckCircle2 className="size-5 shrink-0" />
          <span>Lộ trình đang ở trạng thái PUBLISHED. Mọi hoạt động chỉnh sửa cấu trúc (thêm/sửa/xóa node và edge) đều bị khóa.</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900">
            Class {classInfo.classCode} - {classInfo.courseCode} (Management)
          </h1>
        </div>
        
        {/* Add Node Button Wrapper with Tooltip */}
        <div title={isPublished ? lockTooltip : undefined}>
          <Button 
            onClick={handleAddNodeClick} 
            disabled={isPublished}
            aria-describedby={isPublished ? "lock-reason" : undefined}
            className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1 disabled:opacity-50"
          >
            <Plus className="size-4" />
            Add Node
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Manage Class Roadmap</CardTitle>
          </CardHeader>
          <CardContent>
            {nodes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-gray-200 rounded-lg">
                <Map className="size-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm mb-4">No nodes present in the subject roadmap.</p>
                <div title={isPublished ? lockTooltip : undefined}>
                  <Button onClick={() => setIsAddNodeOpen(true)} disabled={isPublished} size="sm">
                    Create First Node
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden divide-y divide-border shadow-sm">
                {nodes.map((node) => {
                  const isExpanded = !!expandedNodes[node.nodeId];
                  const incomingEdges = edges.filter((e) => e.toNodeId === node.nodeId);
                  const incomingNodes = incomingEdges.map(e => nodes.find(n => n.nodeId === e.fromNodeId)).filter(Boolean);

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
                              <span className={`font-semibold text-sm ${node.status === 'LOCKED' ? 'text-muted-foreground' : 'text-foreground'
                                }`}>
                                {node.title}
                              </span>
                              <Badge variant="outline" className="text-[10px] py-0 px-1 font-normal bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-indigo-200">
                                {node.nodeType === 'ON_CLASS' ? 'On Class' : 'At Home'}
                              </Badge>
                              {node.isRequired && (
                                <Badge className="text-[10px] py-0 px-1 font-normal bg-red-50 text-red-700 hover:bg-red-50 border-red-200" variant="outline">
                                  Required
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider pl-4 shrink-0">
                          {node.status}
                        </div>
                      </div>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-2 bg-muted/5 border-t border-muted/20 space-y-3">
                          <p className="text-sm text-muted-foreground">
                            {node.description || 'No description provided.'}
                          </p>

                          {incomingNodes.length > 0 && (
                            <div className="text-xs text-gray-500 bg-gray-50 border border-gray-100 p-2 rounded">
                              <span className="font-semibold text-gray-700">Prerequisites (Edges): </span>
                              {incomingNodes.map(inNode => inNode?.title).join(', ')}
                            </div>
                          )}

                          <div className="text-xs text-muted-foreground">
                            Display Order: <span className="font-semibold text-foreground">{node.displayOrder}</span>
                            {node.branchName && <span className="ml-4">Branch: <span className="font-semibold text-foreground">{node.branchName}</span></span>}
                          </div>

                          {/* Node Content Section */}
                          <div className="mt-4 pt-4 border-t border-muted/20 space-y-4">
                            <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                              <BookOpen className="size-4 text-indigo-500" />
                              Nội dung học tập
                            </h4>

                            {nodeContentsLoading[node.nodeId] ? (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground py-2 pl-4">
                                <Loader className="size-3.5 animate-spin" />
                                Đang tải nội dung...
                              </div>
                            ) : (
                              <div className="space-y-4 pl-4">
                                {/* Materials List */}
                                <div className="space-y-2">
                                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Tài liệu & Video ({nodeContents[node.nodeId]?.materials?.length || 0})
                                  </div>
                                  {!nodeContents[node.nodeId]?.materials || nodeContents[node.nodeId].materials.length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic pl-2">Chưa có tài liệu học tập.</p>
                                  ) : (
                                    <div className="space-y-1.5">
                                      {nodeContents[node.nodeId].materials.map((material) => (
                                        <div
                                          key={material.materialId}
                                          className="flex items-center justify-between p-2 rounded-lg border border-border bg-card hover:bg-muted/10 text-xs transition-colors"
                                        >
                                          <div className="flex items-center gap-2 min-w-0 flex-1">
                                            {material.video ? (
                                              <Film className="size-4 text-blue-500 shrink-0" />
                                            ) : (
                                              <FileText className="size-4 text-emerald-500 shrink-0" />
                                            )}
                                            <span className="font-medium truncate text-foreground">
                                              {material.title}
                                            </span>
                                            {material.required && (
                                              <Badge className="text-[9px] py-0 px-1 font-normal bg-red-50 text-red-700 border-red-200" variant="outline">
                                                Bắt buộc
                                              </Badge>
                                            )}
                                            {material.video && (
                                              <a
                                                href={material.video.videoUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 shrink-0 ml-1 hover:underline"
                                              >
                                                Xem video <ExternalLink className="size-3" />
                                              </a>
                                            )}
                                            {material.file && (
                                              <a
                                                href={material.file.fileUrl.startsWith('http') ? material.file.fileUrl : `http://localhost:8080${material.file.fileUrl}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                download
                                                className="text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 shrink-0 ml-1 hover:underline font-medium"
                                              >
                                                Tải file <Download className="size-3" />
                                              </a>
                                            )}
                                          </div>
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => handleDeleteMaterial(node.nodeId, material.materialId)}
                                            className="h-7 w-7 text-destructive hover:text-red-700 hover:bg-destructive/5"
                                          >
                                            <Trash2 className="size-3.5" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Tests List */}
                                <div className="space-y-2">
                                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Bài kiểm tra ({nodeContents[node.nodeId]?.tests?.length || 0})
                                  </div>
                                  {!nodeContents[node.nodeId]?.tests || nodeContents[node.nodeId].tests.length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic pl-2">Chưa có bài kiểm tra.</p>
                                  ) : (
                                    <div className="space-y-1.5">
                                      {nodeContents[node.nodeId].tests.map((test) => (
                                        <div
                                          key={test.testId}
                                          className="flex items-center justify-between p-2 rounded-lg border border-border bg-card hover:bg-muted/10 text-xs transition-colors"
                                        >
                                          <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <Award className="size-4 text-purple-500 shrink-0" />
                                            <span className="font-medium truncate text-foreground">
                                              {test.title}
                                            </span>
                                            {test.durationMinutes && (
                                              <Badge variant="outline" className="text-[9px] py-0 px-1 font-normal bg-slate-50 border-slate-200">
                                                Thời gian: {test.durationMinutes} phút
                                              </Badge>
                                            )}
                                            {test.passingPercentage && (
                                              <Badge variant="outline" className="text-[9px] py-0 px-1 font-normal bg-purple-50 text-purple-700 border-purple-200">
                                                Điểm đạt: {test.passingPercentage}%
                                              </Badge>
                                            )}
                                          </div>
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => handleDeleteTest(node.nodeId, test.testId)}
                                            className="h-7 w-7 text-destructive hover:text-red-700 hover:bg-destructive/5"
                                          >
                                            <Trash2 className="size-3.5" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Node operations wrapped with tooltips when published */}
                          <div className="flex gap-2 pt-1 border-t border-gray-100/50 flex-wrap">
                            <div title={isPublished ? lockTooltip : undefined}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-card hover:bg-muted text-xs h-8 text-indigo-700 hover:text-indigo-850 hover:bg-indigo-50/50"
                                onClick={() => handleAddNextNodeClick(node)}
                                disabled={isPublished}
                              >
                                <Plus className="size-3.5 mr-1" />
                                Add Next Node
                              </Button>
                            </div>
                            
                            <div title={isPublished ? lockTooltip : undefined}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-card hover:bg-muted text-xs h-8 text-amber-700 hover:text-amber-850 hover:bg-amber-50/50"
                                onClick={() => handleEditNodeClick(node)}
                                disabled={isPublished}
                              >
                                <Edit2 className="size-3.5 mr-1" />
                                Edit Node
                              </Button>
                            </div>

                            <div title={isPublished ? lockTooltip : undefined}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-card hover:bg-muted text-xs h-8"
                                onClick={() => handleAddContentClick(node)}
                                disabled={isPublished}
                              >
                                <BookOpen className="size-3.5 mr-1" />
                                Add Content
                              </Button>
                            </div>
                            
                            <div title={isPublished ? lockTooltip : undefined}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive border-destructive/20 hover:border-destructive hover:bg-destructive/5 text-xs h-8"
                                onClick={() => triggerRemoveNodeDialog(node.nodeId, node.title)}
                                disabled={isPublished}
                              >
                                <Trash2 className="size-3.5 mr-1" />
                                Remove Node
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

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
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.id}</TableCell>
                    <TableCell>{student.fullName}</TableCell>
                  </TableRow>
                ))}
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Prerequisite Predecessor (Create Edge)</label>
                <select
                  disabled={isPredecessorLocked}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
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
                    <label className="text-xs font-semibold text-indigo-900">Edge Min Score (Optional)</label>
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
                    <label className="text-xs font-semibold text-indigo-900">Edge Max Score (Optional)</label>
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
                  className="rounded text-indigo-600 focus:ring-indigo-500 size-4"
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

      {/* ADD CONTENT MODAL */}
      {isAddContentOpen && selectedNodeForContent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-gray-150">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Thêm nội dung bài học</h2>
                <p className="text-xs text-gray-500">Node: {selectedNodeForContent.title}</p>
              </div>
              <button onClick={() => setIsAddContentOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleAddContentSubmit} className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Loại nội dung</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setContentType('MATERIAL')}
                    className={`py-2 px-3 text-sm font-medium rounded-lg border transition-colors ${
                      contentType === 'MATERIAL'
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    Tài liệu học tập
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentType('TEST')}
                    className={`py-2 px-3 text-sm font-medium rounded-lg border transition-colors ${
                      contentType === 'TEST'
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    Bài kiểm tra (Test)
                  </button>
                </div>
              </div>

              {contentType === 'MATERIAL' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Tiêu đề tài liệu *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tài liệu Lab 1, Video hướng dẫn..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-850"
                      value={contentTitle}
                      onChange={(e) => setContentTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Hình thức tài liệu</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setMaterialType('FILE')}
                        className={`py-1.5 px-2 text-xs font-semibold rounded-md border transition-colors ${
                          materialType === 'FILE'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                            : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        Tải file lên
                      </button>
                      <button
                        type="button"
                        onClick={() => setMaterialType('VIDEO')}
                        className={`py-1.5 px-2 text-xs font-semibold rounded-md border transition-colors ${
                          materialType === 'VIDEO'
                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                            : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        Video URL
                      </button>
                      <button
                        type="button"
                        onClick={() => setMaterialType('EXTERNAL')}
                        className={`py-1.5 px-2 text-xs font-semibold rounded-md border transition-colors ${
                          materialType === 'EXTERNAL'
                            ? 'bg-amber-50 border-amber-300 text-amber-700'
                            : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        External Link
                      </button>
                    </div>
                  </div>

                  {materialType === 'FILE' && (
                    <div className="space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-lg animate-in fade-in duration-200">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-750">Chọn tập tin *</label>
                        <input
                          type="file"
                          required
                          className="w-full border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-750">Mô tả file (Tùy chọn)</label>
                        <input
                          type="text"
                          placeholder="e.g. Slide bài giảng dạng PDF..."
                          className="w-full border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={fileDescription}
                          onChange={(e) => setFileDescription(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {materialType === 'VIDEO' && (
                    <div className="space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-lg animate-in fade-in duration-200">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-750">Đường dẫn Video URL *</label>
                        <input
                          type="url"
                          required
                          placeholder="https://youtube.com/watch?v=..."
                          className="w-full border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-850"
                          value={contentVideoUrl}
                          onChange={(e) => setContentVideoUrl(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-750">Thời lượng (giây)</label>
                          <input
                            type="number"
                            placeholder="e.g. 600"
                            className="w-full border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-850"
                            value={videoDuration}
                            onChange={(e) => setVideoDuration(e.target.value ? Number(e.target.value) : '')}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-750">Mô tả ngắn</label>
                          <input
                            type="text"
                            placeholder="e.g. Video giảng lý thuyết..."
                            className="w-full border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-850"
                            value={videoDescription}
                            onChange={(e) => setVideoDescription(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {materialType === 'EXTERNAL' && (
                    <div className="space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-lg animate-in fade-in duration-200">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-750">Đường dẫn URL *</label>
                        <input
                          type="url"
                          required
                          placeholder="https://example.com/document"
                          className="w-full border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-850"
                          value={contentFileUrl}
                          onChange={(e) => setContentFileUrl(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-750">Tên tài liệu hiển thị</label>
                          <input
                            type="text"
                            placeholder="e.g. Tài liệu đọc thêm..."
                            className="w-full border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-850"
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-750">Định dạng (Type)</label>
                          <input
                            type="text"
                            placeholder="e.g. PDF, DOCX..."
                            className="w-full border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-850"
                            value={fileType}
                            onChange={(e) => setFileType(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="isMatRequiredChk"
                      className="rounded text-indigo-600 focus:ring-indigo-500 size-4 cursor-pointer"
                      checked={isMaterialRequired}
                      onChange={(e) => setIsMaterialRequired(e.target.checked)}
                    />
                    <label htmlFor="isMatRequiredChk" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                      Tài liệu bắt buộc (Required Material)
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Tiêu đề bài kiểm tra *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bài test trắc nghiệm 1, Quiz 1..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-850"
                      value={testTitle}
                      onChange={(e) => setTestTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Mô tả bài kiểm tra</label>
                    <textarea
                      placeholder="Mô tả nội dung hoặc các quy định làm bài..."
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-850"
                      value={testDescription}
                      onChange={(e) => setTestDescription(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Thời gian làm bài (Phút)</label>
                      <input
                        type="number"
                        placeholder="e.g. 15"
                        min="1"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-850"
                        value={testDuration}
                        onChange={(e) => setTestDuration(e.target.value ? Number(e.target.value) : '')}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Tỷ lệ điểm đạt (%)</label>
                      <input
                        type="number"
                        placeholder="e.g. 80"
                        min="0"
                        max="100"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-850"
                        value={testPassingPercentage}
                        onChange={(e) => setTestPassingPercentage(e.target.value ? Number(e.target.value) : '')}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 border-t border-gray-150 pt-4">
                <Button type="button" variant="outline" disabled={submittingContent} onClick={() => setIsAddContentOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={submittingContent} className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 font-semibold">
                  {submittingContent && <Loader className="size-4 animate-spin" />}
                  Lưu nội dung
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT NODE MODAL */}
      {isEditNodeOpen && nodeToEdit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-gray-150">
              <h2 className="text-lg font-semibold text-gray-900">Chỉnh sửa Node học tập</h2>
              <button onClick={() => { setIsEditNodeOpen(false); setNodeToEdit(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleEditNodeSubmit} className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Tiêu đề Node *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Giới thiệu, Lab 1..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-850"
                  value={editNodeTitle}
                  onChange={(e) => setEditNodeTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Mô tả chi tiết</label>
                <textarea
                  placeholder="Nhập mô tả ngắn gọn..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-850"
                  value={editNodeDesc}
                  onChange={(e) => setEditNodeDesc(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Loại Node</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-850 font-medium"
                    value={editNodeType}
                    onChange={(e) => setEditNodeType(e.target.value as 'AT_HOME' | 'ON_CLASS')}
                  >
                    <option value="AT_HOME">Tự học (At Home)</option>
                    <option value="ON_CLASS">Trên lớp (On Class)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Trạng thái Node</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-850 font-medium"
                    value={editNodeStatus}
                    onChange={(e) => setEditNodeStatus(e.target.value as 'LOCKED' | 'OPEN' | 'HIDDEN')}
                  >
                    <option value="LOCKED">Bị khóa (LOCKED)</option>
                    <option value="OPEN">Mở (OPEN)</option>
                    <option value="HIDDEN">Ẩn (HIDDEN)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Thứ tự hiển thị</label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-850"
                    value={editNodeOrder}
                    onChange={(e) => setEditNodeOrder(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Tên nhánh (Branch Name)</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-850 font-medium"
                    value={editNodeBranch}
                    onChange={(e) => setEditNodeBranch(e.target.value as BranchType)}
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
                  id="editIsRequiredChk"
                  className="rounded text-indigo-600 focus:ring-indigo-500 size-4 cursor-pointer"
                  checked={editNodeRequired}
                  onChange={(e) => setEditNodeRequired(e.target.checked)}
                />
                <label htmlFor="editIsRequiredChk" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                  Mốc bắt buộc (Required Milestone)
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-150 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={editingNode}
                  onClick={() => { setIsEditNodeOpen(false); setNodeToEdit(null); }}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={editingNode}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 font-semibold"
                >
                  {editingNode && <Loader className="size-4 animate-spin" />}
                  Lưu thay đổi
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
