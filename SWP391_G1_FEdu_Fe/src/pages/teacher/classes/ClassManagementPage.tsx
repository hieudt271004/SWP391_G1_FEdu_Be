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
  ExternalLink,
  Users
} from 'lucide-react';
import { teacherService } from '../../../services/teacher.service';
import { classroomService } from '../../../services/classroom.service';
import { 
  learningPathService, 
  LearningNodeResponse, 
  NodeEdgeResponse, 
  ClassroomGraphResponse,
  NodeContentResponse
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
  const [selectedLevel, setSelectedLevel] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({});

  // Classroom Publish Flow State
  const [graphData, setGraphData] = useState<ClassroomGraphResponse | null>(null);

  // Derive active path details for the selected level
  const activePath = graphData?.paths?.find((p) => p.level === selectedLevel);
  const activePathId = activePath?.pathId || graphData?.pathId || null;
  const nodes = activePath ? activePath.nodes || [] : graphData?.nodes || [];
  const edges = activePath ? activePath.edges || [] : graphData?.edges || [];

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
    } catch (err) {
      console.error('Error fetching classroom learning path graph:', err);
    }
  };

  useEffect(() => {
    setNewNodeOrder((nodes.length || 0) + 1);
  }, [selectedLevel, graphData, nodes.length]);

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
    if (!activePathId) {
      toast.error('Learning path template not loaded');
      return;
    }

    try {
      const createdNode = await learningPathService.createLearningNode({
        classroomPathId: activePathId,
        title: newNodeTitle,
        description: newNodeDesc,
        nodeType: newNodeType,
        displayOrder: newNodeOrder,
        status: newNodeStatus,
        isRequired: newNodeRequired
      });

      if (newNodePredecessor) {
        await learningPathService.createNodeEdge({
          fromNodeId: Number(newNodePredecessor),
          toNodeId: createdNode.nodeId,
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
      });

      toast.success('Cập nhật node thành công!');
      setIsEditNodeOpen(false);
      setNodeToEdit(null);

      if (classroomSubjectId) {
        await fetchGraphData(Number(classroomSubjectId));
      }
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
    <div className="space-y-6 relative font-sans text-slate-800">
      {/* Sticky Published Banner */}
      {isPublished && (
        <div 
          className="sticky top-0 z-40 w-full bg-emerald-600 text-white py-2.5 px-4 rounded-[6px] shadow-sm flex items-center gap-2 mb-4 font-semibold text-sm animate-in slide-in-from-top duration-300"
          role="alert"
        >
          <CheckCircle2 className="size-5 shrink-0" />
          <span>Lộ trình đang ở trạng thái PUBLISHED. Mọi hoạt động chỉnh sửa cấu trúc (thêm/sửa/xóa node và edge) đều bị khóa.</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="rounded-[6px] border-slate-200 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-2xl font-bold text-[#030213] tracking-tight">
            Lớp {classInfo.classCode} - {classInfo.courseCode} (Quản lý lộ trình)
          </h1>
        </div>
        
        {/* Add Node Button Wrapper with Tooltip */}
        <div title={isPublished ? lockTooltip : undefined}>
          <Button 
            onClick={handleAddNodeClick} 
            disabled={isPublished}
            aria-describedby={isPublished ? "lock-reason" : undefined}
            className="text-white flex items-center gap-1 disabled:opacity-50 transition-all rounded-[6px] shadow-xs px-4 py-2 text-sm font-semibold"
            style={{ backgroundColor: '#030213' }}
          >
            <Plus className="size-4" />
            Thêm bài học
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <Card className="rounded-[10px] border border-slate-200/60 shadow-xs overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100/80 bg-slate-50/40 py-4">
            <CardTitle className="text-base font-bold text-[#030213] flex items-center gap-2">
              <Map className="size-4 text-slate-500" />
              Thiết lập lộ trình học tập
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {/* Level selector tabs */}
            <div className="flex gap-2 p-1 bg-slate-100/70 rounded-[8px] mb-5 border border-slate-200/40">
              {[
                { lvl: 1 as const, label: 'Lộ trình Yếu', desc: 'Cấp độ 1', color: 'text-rose-700 bg-rose-50 border-rose-200/60' },
                { lvl: 2 as const, label: 'Lộ trình Trung bình', desc: 'Cấp độ 2', color: 'text-amber-700 bg-amber-50 border-amber-200/60' },
                { lvl: 3 as const, label: 'Lộ trình Khá', desc: 'Cấp độ 3', color: 'text-emerald-700 bg-emerald-50 border-emerald-200/60' }
              ].map(({ lvl, label, desc, color }) => {
                const isActive = selectedLevel === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => {
                      setSelectedLevel(lvl);
                      setExpandedNodes({});
                    }}
                    className={`flex-1 py-2 px-3 text-center rounded-[6px] border transition-all duration-200 flex flex-col items-center justify-center ${
                      isActive
                        ? `${color} border font-bold shadow-xs scale-[1.01]`
                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs font-semibold">{label}</span>
                    <span className="text-[10px] opacity-75 font-medium mt-0.5">{desc}</span>
                  </button>
                );
              })}
            </div>

            {nodes.length === 0 ? (
              <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-[10px] bg-slate-50/40">
                <Map className="size-8 mx-auto text-slate-350 mb-2" />
                <p className="text-xs font-medium mb-4">Chưa có bài học nào trong lộ trình cấp độ này.</p>
                <div title={isPublished ? lockTooltip : undefined}>
                  <Button 
                    onClick={() => setIsAddNodeOpen(true)} 
                    disabled={isPublished} 
                    size="sm"
                    className="text-white rounded-[6px] shadow-xs hover:opacity-95 font-semibold text-xs py-1.5"
                    style={{ backgroundColor: '#030213' }}
                  >
                    Tạo bài học đầu tiên
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border border-slate-100 rounded-[10px] overflow-hidden divide-y divide-slate-100 shadow-xs bg-white">
                {nodes.map((node) => {
                  const isExpanded = !!expandedNodes[node.nodeId];
                  const incomingEdges = edges.filter((e) => e.toNodeId === node.nodeId);
                  const incomingNodes = incomingEdges.map(e => nodes.find(n => n.nodeId === e.fromNodeId)).filter(Boolean);

                  return (
                    <div
                      key={node.nodeId}
                      className={`transition-all duration-250 border-l-[3px] ${
                        node.status === 'OPEN' 
                          ? 'border-l-emerald-500 bg-emerald-50/5 hover:bg-emerald-50/10' 
                          : node.status === 'LOCKED' 
                            ? 'border-l-slate-300 bg-slate-50/10 hover:bg-slate-50/20' 
                            : 'border-l-amber-500 bg-amber-50/5 hover:bg-amber-50/10'
                      }`}
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
                              <Badge variant="outline" className="text-[10px] py-0 px-1 font-normal bg-slate-50 text-slate-650 border-slate-200 rounded-[6px]">
                                {node.nodeType === 'ON_CLASS' ? 'Trên lớp' : 'Tự học'}
                              </Badge>
                              {node.isRequired && (
                                <Badge className="text-[10px] py-0 px-1 font-normal bg-rose-50 text-rose-700 border-rose-200 rounded-[6px]" variant="outline">
                                  Bắt buộc
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider pl-4 shrink-0">
                          {node.status === 'OPEN' ? 'Mở' : node.status === 'LOCKED' ? 'Khóa' : 'Ẩn'}
                        </div>
                      </div>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-2 bg-slate-50/30 border-t border-slate-100 space-y-3">
                          <p className="text-sm text-slate-650 leading-relaxed">
                            {node.description || 'Chưa có mô tả chi tiết cho bài học này.'}
                          </p>

                          {incomingNodes.length > 0 && (
                            <div className="text-xs text-slate-600 bg-slate-50 border border-slate-150 p-2 rounded-[6px]">
                              <span className="font-semibold text-slate-800">Bài học yêu cầu trước (Prerequisites): </span>
                              {incomingNodes.map(inNode => inNode?.title).join(', ')}
                            </div>
                          )}

                          <div className="text-xs text-slate-500">
                            Thứ tự hiển thị: <span className="font-semibold text-slate-850">{node.displayOrder}</span>
                          </div>

                          {/* Node Content Section */}
                          <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                              <BookOpen className="size-3.5 text-slate-600" />
                              Nội dung học tập
                            </h4>

                            {nodeContentsLoading[node.nodeId] ? (
                              <div className="flex items-center gap-2 text-xs text-slate-500 py-2 pl-4">
                                <Loader className="size-3.5 animate-spin text-slate-500" />
                                Đang tải nội dung...
                              </div>
                                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-2 mt-2">
                                {/* Materials List */}
                                <div className="space-y-3 md:border-r md:border-slate-100 md:pr-6">
                                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                    <FileText className="size-3 text-slate-500" />
                                    Tài liệu & Video ({nodeContents[node.nodeId]?.materials?.length || 0})
                                  </div>
                                  {!(nodeContents[node.nodeId]?.materials) || nodeContents[node.nodeId].materials.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic pl-1">Chưa có tài liệu học tập.</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {(nodeContents[node.nodeId]?.materials || []).map((material) => (
                                        <div
                                          key={material.materialId}
                                          className="flex items-center justify-between p-2.5 rounded-[6px] border border-slate-200/60 bg-white hover:bg-slate-50/50 text-xs transition-colors shadow-2xs"
                                        >
                                          <div className="flex items-center gap-2 min-w-0 flex-1">
                                            {material.video ? (
                                              <Film className="size-4 text-blue-500 shrink-0" />
                                            ) : (
                                              <FileText className="size-4 text-emerald-500 shrink-0" />
                                            )}
                                            <span className="font-semibold truncate text-slate-800">
                                              {material.title}
                                            </span>
                                            {material.required && (
                                              <Badge className="text-[9px] py-0 px-1 font-normal bg-rose-50 text-rose-700 border-rose-200 rounded-[6px]" variant="outline">
                                                Bắt buộc
                                              </Badge>
                                            )}
                                            {material.video && (
                                              <a
                                                href={material.video.videoUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[#030213] hover:text-slate-800 flex items-center gap-0.5 shrink-0 ml-1 hover:underline font-bold"
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
                                                className="text-[#030213] hover:text-slate-800 flex items-center gap-0.5 shrink-0 ml-1 hover:underline font-bold"
                                              >
                                                Tải file <Download className="size-3" />
                                              </a>
                                            )}
                                          </div>
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => handleDeleteMaterial(node.nodeId, material.materialId)}
                                            className="h-7 w-7 text-red-650 hover:text-red-700 hover:bg-red-55/10 rounded-[6px] shrink-0"
                                          >
                                            <Trash2 className="size-3.5" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Tests List */}
                                <div className="space-y-3">
                                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                    <Award className="size-3.5 text-slate-500" />
                                    Bài kiểm tra ({nodeContents[node.nodeId]?.tests?.length || 0})
                                  </div>
                                  {!(nodeContents[node.nodeId]?.tests) || nodeContents[node.nodeId].tests.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic pl-1">Chưa có bài kiểm tra.</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {(nodeContents[node.nodeId]?.tests || []).map((test) => (
                                        <div
                                          key={test.testId}
                                          className="flex items-center justify-between p-2.5 rounded-[6px] border border-slate-200/60 bg-white hover:bg-slate-50/50 text-xs transition-colors shadow-2xs"
                                        >
                                          <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <Award className="size-4 text-purple-500 shrink-0" />
                                            <span className="font-semibold truncate text-slate-800">
                                              {test.title}
                                            </span>
                                            {test.durationMinutes && (
                                              <Badge variant="outline" className="text-[9px] py-0 px-1 font-normal bg-slate-50 border-slate-200 rounded-[6px] text-slate-655">
                                                {test.durationMinutes} phút
                                              </Badge>
                                            )}
                                            {test.passingPercentage && (
                                              <Badge variant="outline" className="text-[9px] py-0 px-1 font-normal bg-purple-55/5 text-purple-700 border-purple-200 rounded-[6px]">
                                                Đạt: {test.passingPercentage}%
                                              </Badge>
                                            )}
                                          </div>
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => handleDeleteTest(node.nodeId, test.testId)}
                                            className="h-7 w-7 text-red-655 hover:text-red-700 hover:bg-red-55/10 rounded-[6px] shrink-0"
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
                          <div className="flex gap-2 pt-3 border-t border-slate-100 flex-wrap">
                            <div title={isPublished ? lockTooltip : undefined}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-white text-xs h-8 text-slate-700 hover:text-[#030213] hover:bg-slate-50 border-slate-200/80 rounded-[6px] font-semibold"
                                onClick={() => handleAddNextNodeClick(node)}
                                disabled={isPublished}
                              >
                                <Plus className="size-3.5 mr-1" />
                                Thêm Node tiếp theo
                              </Button>
                            </div>
                            
                            <div title={isPublished ? lockTooltip : undefined}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-white text-xs h-8 text-amber-700 hover:text-amber-800 hover:bg-amber-50/20 border-amber-250/60 rounded-[6px] font-semibold"
                                onClick={() => handleEditNodeClick(node)}
                                disabled={isPublished}
                              >
                                <Edit2 className="size-3.5 mr-1" />
                                Sửa Node
                              </Button>
                            </div>

                            <div title={isPublished ? lockTooltip : undefined}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-white text-xs h-8 text-slate-700 hover:text-[#030213] hover:bg-slate-50 border-slate-200/80 rounded-[6px] font-semibold"
                                onClick={() => handleAddContentClick(node)}
                                disabled={isPublished}
                              >
                                <BookOpen className="size-3.5 mr-1" />
                                Thêm nội dung
                              </Button>
                            </div>
                            
                            <div title={isPublished ? lockTooltip : undefined}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200/60 hover:border-red-400 hover:bg-red-50/30 text-xs h-8 rounded-[6px] font-semibold"
                                onClick={() => triggerRemoveNodeDialog(node.nodeId, node.title)}
                                disabled={isPublished}
                              >
                                <Trash2 className="size-3.5 mr-1" />
                                Xóa Node
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

        <Card className="rounded-[10px] border border-slate-200/60 shadow-xs overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100/80 bg-slate-50/40 py-4">
            <CardTitle className="text-base font-bold text-[#030213] flex items-center gap-2">
              <Users className="size-4 text-slate-500" />
              Danh sách học sinh
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="font-semibold text-slate-500 text-xs">Mã học sinh</TableHead>
                  <TableHead className="font-semibold text-slate-500 text-xs">Họ và tên</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-8 text-slate-400 italic text-xs">
                      Chưa có học sinh nào trong lớp.
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => (
                    <TableRow key={student.id} className="border-slate-100 hover:bg-slate-50/50">
                      <TableCell className="font-semibold text-slate-700 text-xs">{student.id}</TableCell>
                      <TableCell className="text-slate-650 text-xs">{student.fullName}</TableCell>
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
              className="rounded-[6px] border-slate-200"
            >
              Hủy
            </Button>
            <Button 
              onClick={handleRemoveNodeConfirm} 
              disabled={!understandDelete}
              className="bg-red-650 hover:bg-red-700 text-white font-medium rounded-[6px]"
            >
              Xóa bài học
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADD NODE MODAL */}
      {isAddNodeOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[10px] shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-150">
              <h2 className="text-base font-bold text-[#030213]">Tạo bài học mới</h2>
              <button onClick={() => setIsAddNodeOpen(false)} className="text-slate-400 hover:text-slate-650">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleAddNodeSubmit} className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Tiêu đề bài học *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Giới thiệu Git & GitHub..."
                  className="w-full border border-slate-350/50 bg-white rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800"
                  value={newNodeTitle}
                  onChange={(e) => setNewNodeTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Mô tả bài học</label>
                <textarea
                  placeholder="Nhập mô tả ngắn gọn nội dung bài học..."
                  rows={3}
                  className="w-full border border-slate-350/50 bg-white rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800"
                  value={newNodeDesc}
                  onChange={(e) => setNewNodeDesc(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Hình thức học</label>
                  <select
                    className="w-full border border-slate-350/50 bg-white rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800 font-medium"
                    value={newNodeType}
                    onChange={(e) => setNewNodeType(e.target.value as any)}
                  >
                    <option value="AT_HOME">Tự học (At Home)</option>
                    <option value="ON_CLASS">Trên lớp (On Class)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Trạng thái khóa học</label>
                  <select
                    className="w-full border border-slate-350/50 bg-white rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800 font-medium"
                    value={newNodeStatus}
                    onChange={(e) => setNewNodeStatus(e.target.value as any)}
                  >
                    <option value="LOCKED">Bị khóa (LOCKED)</option>
                    <option value="OPEN">Mở (OPEN)</option>
                    <option value="HIDDEN">Ẩn (HIDDEN)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Thứ tự hiển thị</label>
                  <input
                    type="number"
                    required
                    min={1}
                    className="w-full border border-slate-350/50 bg-white rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800"
                    value={newNodeOrder}
                    onChange={(e) => setNewNodeOrder(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Bài học yêu cầu trước (Prerequisites)</label>
                <select
                  disabled={isPredecessorLocked}
                  className="w-full border border-slate-350/50 bg-white rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800 font-medium disabled:bg-slate-50 disabled:text-slate-450"
                  value={newNodePredecessor}
                  onChange={(e) => setNewNodePredecessor(e.target.value)}
                >
                  <option value="">-- Không có (Bài bắt đầu) --</option>
                  {nodes.map(n => (
                    <option key={n.nodeId} value={n.nodeId}>{n.title} (Thứ tự: {n.displayOrder})</option>
                  ))}
                </select>
              </div>

              {newNodePredecessor && (
                <div className="grid grid-cols-2 gap-4 border border-slate-200/50 bg-slate-50/50 p-3 rounded-[6px] animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-750">Điểm tối thiểu đạt (Tùy chọn)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 8.0"
                      className="w-full border border-slate-300 bg-white rounded-[6px] px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-850"
                      value={edgeMinScore}
                      onChange={(e) => setEdgeMinScore(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-750">Điểm tối đa (Tùy chọn)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 10.0"
                      className="w-full border border-slate-300 bg-white rounded-[6px] px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-850"
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
                  className="rounded text-slate-800 focus:ring-slate-800 size-4 cursor-pointer"
                  checked={newNodeRequired}
                  onChange={(e) => setNewNodeRequired(e.target.checked)}
                />
                <label htmlFor="isRequiredChk" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                  Mốc bài học bắt buộc (Required Milestone)
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-150 pt-4">
                <Button type="button" variant="outline" className="rounded-[6px] border-slate-200" onClick={() => setIsAddNodeOpen(false)}>
                  Hủy
                </Button>
                <Button 
                  type="submit" 
                  className="text-white font-semibold rounded-[6px] shadow-xs px-4"
                  style={{ backgroundColor: '#030213' }}
                >
                  Tạo bài học
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CONTENT MODAL */}
      {isAddContentOpen && selectedNodeForContent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[10px] shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-150">
              <div>
                <h2 className="text-base font-bold text-[#030213]">Thêm nội dung bài học</h2>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Bài học: {selectedNodeForContent.title}</p>
              </div>
              <button onClick={() => setIsAddContentOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleAddContentSubmit} className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Loại nội dung</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setContentType('MATERIAL')}
                    className={`py-2 px-3 text-xs font-semibold rounded-[6px] border transition-colors ${
                      contentType === 'MATERIAL'
                        ? 'bg-[#030213]/5 border-[#030213]/25 text-[#030213]'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-750'
                    }`}
                  >
                    Tài liệu học tập
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentType('TEST')}
                    className={`py-2 px-3 text-xs font-semibold rounded-[6px] border transition-colors ${
                      contentType === 'TEST'
                        ? 'bg-[#030213]/5 border-[#030213]/25 text-[#030213]'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-750'
                    }`}
                  >
                    Bài kiểm tra (Test)
                  </button>
                </div>
              </div>

              {contentType === 'MATERIAL' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Tiêu đề tài liệu *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Slide bài giảng số 1, Video thực hành..."
                      className="w-full border border-slate-350/50 rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white text-slate-800"
                      value={contentTitle}
                      onChange={(e) => setContentTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Hình thức tài liệu</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setMaterialType('FILE')}
                        className={`py-1.5 px-2 text-[11px] font-bold rounded-[6px] border transition-colors ${
                          materialType === 'FILE'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-750'
                        }`}
                      >
                        Tải file lên
                      </button>
                      <button
                        type="button"
                        onClick={() => setMaterialType('VIDEO')}
                        className={`py-1.5 px-2 text-[11px] font-bold rounded-[6px] border transition-colors ${
                          materialType === 'VIDEO'
                            ? 'bg-blue-50 border-blue-300 text-blue-800'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-750'
                        }`}
                      >
                        Video URL
                      </button>
                      <button
                        type="button"
                        onClick={() => setMaterialType('EXTERNAL')}
                        className={`py-1.5 px-2 text-[11px] font-bold rounded-[6px] border transition-colors ${
                          materialType === 'EXTERNAL'
                            ? 'bg-amber-50 border-amber-300 text-amber-800'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-750'
                        }`}
                      >
                        Link ngoài
                      </button>
                    </div>
                  </div>

                  {materialType === 'FILE' && (
                    <div className="space-y-3 p-3 bg-slate-50/50 border border-slate-200 rounded-[6px] animate-in fade-in duration-200">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-750">Chọn tập tin từ máy *</label>
                        <input
                          type="file"
                          required
                          className="w-full border border-slate-350/50 bg-white rounded-[6px] px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-800"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-750">Mô tả file (Tùy chọn)</label>
                        <input
                          type="text"
                          placeholder="e.g. Đọc tài liệu PDF trước khi lên lớp..."
                          className="w-full border border-slate-350/50 bg-white rounded-[6px] px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-800"
                          value={fileDescription}
                          onChange={(e) => setFileDescription(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {materialType === 'VIDEO' && (
                    <div className="space-y-3 p-3 bg-slate-50/50 border border-slate-200 rounded-[6px] animate-in fade-in duration-200">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-750">Đường dẫn Video URL *</label>
                        <input
                          type="url"
                          required
                          placeholder="https://youtube.com/watch?v=..."
                          className="w-full border border-slate-350/50 bg-white rounded-[6px] px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800"
                          value={contentVideoUrl}
                          onChange={(e) => setContentVideoUrl(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-750">Thời lượng (giây)</label>
                          <input
                            type="number"
                            placeholder="Ví dụ: 600"
                            className="w-full border border-slate-350/50 bg-white rounded-[6px] px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800"
                            value={videoDuration}
                            onChange={(e) => setVideoDuration(e.target.value ? Number(e.target.value) : '')}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-750">Mô tả ngắn</label>
                          <input
                            type="text"
                            placeholder="e.g. Video giảng lý thuyết..."
                            className="w-full border border-slate-350/50 bg-white rounded-[6px] px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800"
                            value={videoDescription}
                            onChange={(e) => setVideoDescription(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {materialType === 'EXTERNAL' && (
                    <div className="space-y-3 p-3 bg-slate-50/50 border border-slate-200 rounded-[6px] animate-in fade-in duration-200">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-750">Đường dẫn URL *</label>
                        <input
                          type="url"
                          required
                          placeholder="https://example.com/document"
                          className="w-full border border-slate-350/50 bg-white rounded-[6px] px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800"
                          value={contentFileUrl}
                          onChange={(e) => setContentFileUrl(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-750">Tên hiển thị</label>
                          <input
                            type="text"
                            placeholder="e.g. Slide bài đọc..."
                            className="w-full border border-slate-350/50 bg-white rounded-[6px] px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800"
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-750">Định dạng (Type)</label>
                          <input
                            type="text"
                            placeholder="e.g. PDF, Website..."
                            className="w-full border border-slate-350/50 bg-white rounded-[6px] px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800"
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
                      className="rounded text-slate-800 focus:ring-slate-800 size-4 cursor-pointer"
                      checked={isMaterialRequired}
                      onChange={(e) => setIsMaterialRequired(e.target.checked)}
                    />
                    <label htmlFor="isMatRequiredChk" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                      Tài liệu bắt buộc hoàn thành (Required Material)
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Tiêu đề bài kiểm tra *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bài test trắc nghiệm số 1..."
                      className="w-full border border-slate-350/50 rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white text-slate-800"
                      value={testTitle}
                      onChange={(e) => setTestTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Mô tả bài kiểm tra</label>
                    <textarea
                      placeholder="Mô tả nội dung bài kiểm tra hoặc quy chế thi..."
                      rows={2}
                      className="w-full border border-slate-350/50 rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white text-slate-800"
                      value={testDescription}
                      onChange={(e) => setTestDescription(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Thời gian làm bài (Phút)</label>
                      <input
                        type="number"
                        placeholder="Ví dụ: 15"
                        min="1"
                        className="w-full border border-slate-350/50 rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white text-slate-800"
                        value={testDuration}
                        onChange={(e) => setTestDuration(e.target.value ? Number(e.target.value) : '')}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Tỷ lệ điểm đạt (%)</label>
                      <input
                        type="number"
                        placeholder="Ví dụ: 80"
                        min="0"
                        max="100"
                        className="w-full border border-slate-350/50 rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white text-slate-800"
                        value={testPassingPercentage}
                        onChange={(e) => setTestPassingPercentage(e.target.value ? Number(e.target.value) : '')}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-150 pt-4">
                <Button type="button" variant="outline" disabled={submittingContent} className="rounded-[6px] border-slate-200" onClick={() => setIsAddContentOpen(false)}>
                  Hủy
                </Button>
                <Button 
                  type="submit" 
                  disabled={submittingContent} 
                  className="text-white flex items-center gap-1.5 font-semibold rounded-[6px] shadow-xs px-4"
                  style={{ backgroundColor: '#030213' }}
                >
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
          <div className="bg-white rounded-[10px] shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-150">
              <h2 className="text-base font-bold text-[#030213]">Chỉnh sửa bài học</h2>
              <button onClick={() => { setIsEditNodeOpen(false); setNodeToEdit(null); }} className="text-slate-400 hover:text-slate-600">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleEditNodeSubmit} className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Tiêu đề bài học *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Giới thiệu, Lab 1..."
                  className="w-full border border-slate-350/50 rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white text-slate-800"
                  value={editNodeTitle}
                  onChange={(e) => setEditNodeTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Mô tả chi tiết</label>
                <textarea
                  placeholder="Nhập mô tả ngắn gọn nội dung bài học..."
                  rows={3}
                  className="w-full border border-slate-350/50 rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white text-slate-800"
                  value={editNodeDesc}
                  onChange={(e) => setEditNodeDesc(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Hình thức học</label>
                  <select
                    className="w-full border border-slate-350/50 rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white text-slate-800 font-medium"
                    value={editNodeType}
                    onChange={(e) => setEditNodeType(e.target.value as 'AT_HOME' | 'ON_CLASS')}
                  >
                    <option value="AT_HOME">Tự học (At Home)</option>
                    <option value="ON_CLASS">Trên lớp (On Class)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Trạng thái khóa học</label>
                  <select
                    className="w-full border border-slate-350/50 rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white text-slate-800 font-medium"
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
                  <label className="text-xs font-semibold text-slate-700">Thứ tự hiển thị</label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="w-full border border-slate-350/50 rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white text-slate-800"
                    value={editNodeOrder}
                    onChange={(e) => setEditNodeOrder(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editIsRequiredChk"
                  className="rounded text-slate-800 focus:ring-slate-800 size-4 cursor-pointer"
                  checked={editNodeRequired}
                  onChange={(e) => setEditNodeRequired(e.target.checked)}
                />
                <label htmlFor="editIsRequiredChk" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                  Mốc bài học bắt buộc (Required Milestone)
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-150 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={editingNode}
                  className="rounded-[6px] border-slate-200"
                  onClick={() => { setIsEditNodeOpen(false); setNodeToEdit(null); }}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={editingNode}
                  className="text-white flex items-center gap-1.5 font-semibold rounded-[6px] shadow-xs px-4"
                  style={{ backgroundColor: '#030213' }}
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
