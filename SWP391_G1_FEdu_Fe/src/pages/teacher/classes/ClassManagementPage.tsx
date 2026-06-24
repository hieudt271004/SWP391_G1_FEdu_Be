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
  GraduationCap,
  Video as VideoIcon,
  FileText,
  Eye,
  Pencil,
  Loader2,
  ClipboardList
} from 'lucide-react';
import { teacherService } from '../../../services/teacher.service';
import { 
  learningPathService, 
  LearningNodeResponse, 
  NodeEdgeResponse, 
  ClassroomGraphResponse,
  NodeContentResponse,
  NodeTestResponse,
  StudentAttemptResponse,
  QuestionResponse,
  AnswerResponse
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

  // Modals state
  const [isAddNodeOpen, setIsAddNodeOpen] = useState(false);
  const [selectedNodeForContent, setSelectedNodeForContent] = useState<LearningNodeResponse | null>(null);
  const [isAddTestOpen, setIsAddTestOpen] = useState(false);
  const [isEditTestOpen, setIsEditTestOpen] = useState(false);
  const [selectedTestForEdit, setSelectedTestForEdit] = useState<NodeTestResponse | null>(null);
  const [isAttemptsOpen, setIsAttemptsOpen] = useState(false);
  const [selectedTestForAttempts, setSelectedTestForAttempts] = useState<NodeTestResponse | null>(null);
  const [attempts, setAttempts] = useState<StudentAttemptResponse[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  
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

  // New Test Form State
  const [testTitle, setTestTitle] = useState('');
  const [testDesc, setTestDesc] = useState('');
  const [testDuration, setTestDuration] = useState('15');
  const [testPassPercent, setTestPassPercent] = useState('70.00');

  // Questions management state
  const [isQuestionsListOpen, setIsQuestionsListOpen] = useState(false);
  const [isAddEditQuestionOpen, setIsAddEditQuestionOpen] = useState(false);
  const [selectedTestForQuestions, setSelectedTestForQuestions] = useState<NodeTestResponse | null>(null);
  const [questionsList, setQuestionsList] = useState<QuestionResponse[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionResponse | null>(null);

  // Form states for single question
  const [questionContent, setQuestionContent] = useState('');
  const [questionScore, setQuestionScore] = useState('1');
  const [questionAnswers, setQuestionAnswers] = useState<Array<{ answerContent: string; isCorrect: boolean }>>([
    { answerContent: '', isCorrect: false },
    { answerContent: '', isCorrect: false },
    { answerContent: '', isCorrect: false },
    { answerContent: '', isCorrect: false },
  ]);

  // Material Form State
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
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

  // Node Content cache & loading state
  const [nodeContents, setNodeContents] = useState<Record<number, NodeContentResponse>>({});
  const [loadingContents, setLoadingContents] = useState<Record<number, boolean>>({});

  const fetchNodeContent = async (nodeId: number) => {
    setLoadingContents((prev) => ({ ...prev, [nodeId]: true }));
    try {
      const data = await learningPathService.getTeacherNodeContent(nodeId);
      setNodeContents((prev) => ({ ...prev, [nodeId]: data }));
    } catch (err: any) {
      console.error('Error fetching node content:', err);
      toast.error(err.message || 'Failed to fetch node content');
    } finally {
      setLoadingContents((prev) => ({ ...prev, [nodeId]: false }));
    }
  };

  const toggleNode = (id: number) => {
    const isExpanding = !expandedNodes[id];
    setExpandedNodes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
    if (isExpanding && !nodeContents[id]) {
      fetchNodeContent(id);
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

  // Disable body scroll when modal is open
  useEffect(() => {
    const isAnyModalOpen = 
      isAddNodeOpen || 
      isAddTestOpen || 
      isEditTestOpen || 
      isAttemptsOpen || 
      isQuestionsListOpen || 
      isAddEditQuestionOpen || 
      isAddMaterialOpen ||
      showDeleteConfirm;

    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [
    isAddNodeOpen, 
    isAddTestOpen, 
    isEditTestOpen, 
    isAttemptsOpen, 
    isQuestionsListOpen, 
    isAddEditQuestionOpen, 
    isAddMaterialOpen,
    showDeleteConfirm
  ]);

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
    setNewNodeOrder(node.displayOrder + 1);
    setNewNodePredecessor(String(node.nodeId));
    setIsPredecessorLocked(true);
    setEdgeMinScore('');
    setEdgeMaxScore('');
    setIsAddNodeOpen(true);
  };

  const handleAddTestClick = (node: LearningNodeResponse) => {
    setSelectedNodeForContent(node);
    setTestTitle('');
    setTestDesc('');
    setTestDuration('15');
    setTestPassPercent('70.00');
    setIsAddTestOpen(true);
  };

  const handleAddMaterialClick = (node: LearningNodeResponse) => {
    setSelectedNodeForContent(node);
    setMaterialTitle('');
    setMaterialRequired(true);
    setMaterialVideoUrl('');
    setMaterialVideoDesc('');
    setMaterialVideoDur('');
    setMaterialFileUrl('');
    setMaterialFileName('');
    setMaterialFileDesc('');
    setMaterialSelectedFile(null);
    setIsAddMaterialOpen(true);
  };

  const handleAddMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialTitle.trim() || !selectedNodeForContent) {
      toast.error('Vui lòng nhập tiêu đề tài liệu');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('title', materialTitle);
      formData.append('required', String(materialRequired));

      if (materialType === 'video') {
        if (!materialVideoUrl.trim()) {
          toast.error('Vui lòng nhập link video');
          return;
        }
        formData.append('videoUrl', materialVideoUrl);
        formData.append('videoTitle', materialTitle);
        if (materialVideoDur) {
          formData.append('videoDuration', materialVideoDur);
        }
        formData.append('videoDescription', materialVideoDesc);
      } else {
        if (materialSelectedFile) {
          formData.append('file', materialSelectedFile);
        } else if (materialFileUrl.trim()) {
          formData.append('fileUrl', materialFileUrl);
        } else {
          toast.error('Vui lòng chọn file tải lên hoặc nhập link file');
          return;
        }
        formData.append('fileName', materialFileName || materialSelectedFile?.name || 'Tài liệu');
        formData.append('fileDescription', materialFileDesc);
      }

      await learningPathService.addTeacherNodeMaterial(selectedNodeForContent.nodeId, formData);
      toast.success('Thêm tài liệu học tập thành công');
      setIsAddMaterialOpen(false);

      const targetNodeId = selectedNodeForContent.nodeId;
      setMaterialTitle('');
      setMaterialRequired(true);
      setMaterialVideoUrl('');
      setMaterialVideoDesc('');
      setMaterialVideoDur('');
      setMaterialFileUrl('');
      setMaterialFileName('');
      setMaterialFileDesc('');
      setMaterialSelectedFile(null);
      setSelectedNodeForContent(null);

      await fetchNodeContent(targetNodeId);
    } catch (err: any) {
      toast.error(err.message || 'Thêm tài liệu thất bại');
    }
  };

  const handleDeleteMaterial = async (materialId: number, nodeId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) return;
    try {
      await learningPathService.deleteTeacherNodeMaterial(materialId);
      toast.success('Đã xóa tài liệu học tập');
      await fetchNodeContent(nodeId);
    } catch (err: any) {
      toast.error(err.message || 'Xóa tài liệu thất bại');
    }
  };

  const handleAddTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle.trim() || !selectedNodeForContent) {
      toast.error('Test title is required');
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
      toast.success('Test added successfully');
      setIsAddTestOpen(false);
      setSelectedNodeForContent(null);
      await fetchNodeContent(targetNodeId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to add test');
    }
  };

  const handleEditTestClick = (node: LearningNodeResponse, test: NodeTestResponse) => {
    setSelectedNodeForContent(node);
    setSelectedTestForEdit(test);
    setTestTitle(test.title);
    setTestDesc(test.description || '');
    setTestDuration(test.durationMinutes ? String(test.durationMinutes) : '15');
    setTestPassPercent(test.passingPercentage ? String(test.passingPercentage) : '70.00');
    setIsEditTestOpen(true);
  };

  const handleEditTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle.trim() || !selectedTestForEdit || !selectedNodeForContent) {
      toast.error('Test title is required');
      return;
    }
    try {
      const targetNodeId = selectedNodeForContent.nodeId;
      await learningPathService.updateTeacherNodeTest(selectedTestForEdit.testId, {
        title: testTitle,
        description: testDesc,
        durationMinutes: testDuration ? Number(testDuration) : undefined,
        passingPercentage: testPassPercent ? Number(testPassPercent) : undefined,
      });
      toast.success('Test updated successfully');
      setIsEditTestOpen(false);
      setSelectedTestForEdit(null);
      setSelectedNodeForContent(null);
      await fetchNodeContent(targetNodeId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update test');
    }
  };

  const handleDeleteTest = async (testId: number, nodeId: number) => {
    if (!window.confirm('Are you sure you want to delete this test?')) return;
    try {
      await learningPathService.deleteTeacherNodeTest(testId);
      toast.success('Test deleted successfully');
      await fetchNodeContent(nodeId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete test');
    }
  };

  const handleViewAttemptsClick = async (test: NodeTestResponse) => {
    setSelectedTestForAttempts(test);
    setIsAttemptsOpen(true);
    setLoadingAttempts(true);
    try {
      const data = await learningPathService.getTeacherTestAttempts(test.testId);
      setAttempts(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load test attempts');
    } finally {
      setLoadingAttempts(false);
    }
  };

  const handleManageQuestionsClick = async (test: NodeTestResponse) => {
    setSelectedTestForQuestions(test);
    setIsQuestionsListOpen(true);
    setLoadingQuestions(true);
    try {
      const data = await learningPathService.getTeacherTestQuestions(test.testId);
      setQuestionsList(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load test questions');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const reloadQuestionsList = async (testId: number) => {
    setLoadingQuestions(true);
    try {
      const data = await learningPathService.getTeacherTestQuestions(testId);
      setQuestionsList(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reload test questions');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await learningPathService.deleteTeacherTestQuestion(questionId);
      toast.success('Question deleted successfully');
      if (selectedTestForQuestions) {
        await reloadQuestionsList(selectedTestForQuestions.testId);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete question');
    }
  };

  const handleOpenAddQuestion = () => {
    setEditingQuestion(null);
    setQuestionContent('');
    setQuestionScore('1');
    setQuestionAnswers([
      { answerContent: '', isCorrect: true },
      { answerContent: '', isCorrect: false },
      { answerContent: '', isCorrect: false },
      { answerContent: '', isCorrect: false },
    ]);
    setIsAddEditQuestionOpen(true);
  };

  const handleOpenEditQuestion = (question: QuestionResponse) => {
    setEditingQuestion(question);
    setQuestionContent(question.questionContent);
    setQuestionScore(String(question.score));
    
    // Map existing answers or set defaults if empty
    const mappedAnswers = (question.answers || []).map(a => ({
      answerContent: a.answerContent,
      isCorrect: a.isCorrect
    }));
    
    // Ensure there are at least 4 answers
    while (mappedAnswers.length < 4) {
      mappedAnswers.push({ answerContent: '', isCorrect: false });
    }
    
    setQuestionAnswers(mappedAnswers);
    setIsAddEditQuestionOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionContent.trim()) {
      toast.error('Question content is required');
      return;
    }
    if (!selectedTestForQuestions) return;

    // Validate answers: must have at least one non-empty answer
    const validAnswers = questionAnswers.filter(a => a.answerContent.trim() !== '');
    if (validAnswers.length < 2) {
      toast.error('Please provide at least 2 non-empty answer options');
      return;
    }

    // Must have exactly one correct answer selected (since type is MULTIPLE_CHOICE)
    const correctCount = validAnswers.filter(a => a.isCorrect).length;
    if (correctCount !== 1) {
      toast.error('Please select exactly one correct answer option');
      return;
    }

    const payload = {
      questionContent: questionContent.trim(),
      questionType: 'MULTIPLE_CHOICE' as const,
      score: questionScore ? Number(questionScore) : 1,
      answers: validAnswers.map(a => ({
        answerContent: a.answerContent.trim(),
        isCorrect: a.isCorrect
      }))
    };

    try {
      if (editingQuestion) {
        await learningPathService.updateTeacherTestQuestion(editingQuestion.questionId, payload);
        toast.success('Question updated successfully');
      } else {
        await learningPathService.addTeacherTestQuestion(selectedTestForQuestions.testId, payload);
        toast.success('Question added successfully');
      }
      setIsAddEditQuestionOpen(false);
      await reloadQuestionsList(selectedTestForQuestions.testId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save question');
    }
  };

  const handleAnswerChange = (index: number, value: string) => {
    setQuestionAnswers(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], answerContent: value };
      return copy;
    });
  };

  const handleCorrectAnswerSelect = (index: number) => {
    setQuestionAnswers(prev => {
      return prev.map((ans, idx) => ({
        ...ans,
        isCorrect: idx === index
      }));
    });
  };

  const handleAddAnswerRow = () => {
    setQuestionAnswers(prev => [...prev, { answerContent: '', isCorrect: false }]);
  };

  const handleRemoveAnswerRow = (index: number) => {
    setQuestionAnswers(prev => {
      if (prev.length <= 2) {
        toast.error('At least 2 answer choices are required');
        return prev;
      }
      const copy = prev.filter((_, idx) => idx !== index);
      if (!copy.some(a => a.isCorrect)) {
        copy[0] = { ...copy[0], isCorrect: true };
      }
      return copy;
    });
  };

  const getSortedTimelineItems = (nodeId: number) => {
    const content = nodeContents[nodeId];
    if (!content) return [];
    const materials = (content.materials || []).map((m) => ({
      key: `material-${m.materialId}`,
      id: m.materialId,
      type: 'MATERIAL' as const,
      title: m.title,
      orderIndex: m.orderIndex ?? 9999,
      data: m,
    }));
    const tests = (content.tests || []).map((t) => ({
      key: `test-${t.testId}`,
      id: t.testId,
      type: 'TEST' as const,
      title: t.title,
      orderIndex: t.orderIndex ?? 9999,
      data: t,
    }));
    return [...materials, ...tests].sort((a, b) => a.orderIndex - b.orderIndex);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
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
                        <div className="px-4 pb-4 pt-2 bg-muted/5 border-t border-muted/20 space-y-4">
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

                          {/* Materials & Tests Timeline */}
                          <div className="space-y-2 pt-2 border-t border-gray-100">
                            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Node Contents</h4>
                            {loadingContents[node.nodeId] ? (
                              <div className="flex items-center gap-2 py-2 text-xs text-gray-400">
                                <Loader2 className="size-3.5 animate-spin" />
                                Loading content...
                              </div>
                            ) : (() => {
                              const sortedItems = getSortedTimelineItems(node.nodeId);
                              if (sortedItems.length === 0) {
                                return (
                                  <div className="text-xs text-gray-400 italic py-2 text-center bg-gray-50 rounded border border-dashed border-gray-200">
                                    No materials or tests added yet.
                                  </div>
                                );
                              }
                              return (
                                <div className="space-y-2">
                                  {sortedItems.map((item) => {
                                    const isMaterial = item.type === 'MATERIAL';
                                    const m = isMaterial ? item.data : null;
                                    const t = !isMaterial ? item.data : null;

                                    return (
                                      <div
                                        key={item.key}
                                        className="flex items-start justify-between gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs hover:border-indigo-200 transition-colors"
                                      >
                                        <div className="space-y-1 flex-1 min-w-0 pr-2">
                                          <div className="font-semibold text-gray-800 flex items-center gap-2 flex-wrap">
                                            {isMaterial ? (
                                              <>
                                                <BookOpen className="size-3.5 text-indigo-500 shrink-0" />
                                                <span className="truncate">{item.title}</span>
                                                {m?.required && (
                                                  <span className="text-[9px] px-1 bg-red-50 text-red-500 rounded font-bold border border-red-100 shrink-0">
                                                    Required
                                                  </span>
                                                )}
                                              </>
                                            ) : (
                                              <>
                                                <GraduationCap className="size-3.5 text-teal-500 shrink-0" />
                                                <span className="truncate">{item.title}</span>
                                              </>
                                            )}
                                          </div>

                                          {isMaterial && m?.video && (
                                            <div className="text-gray-500 flex items-center gap-1.5 text-[11px]">
                                              <span className="px-1 py-0.2 bg-teal-50 text-teal-700 border border-teal-100 rounded text-[9px] font-semibold flex items-center gap-0.5 shrink-0">
                                                <VideoIcon className="size-2.5" /> Video
                                              </span>
                                              <a
                                                href={m.video.videoUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-indigo-600 hover:underline truncate max-w-[250px]"
                                              >
                                                {m.video.videoUrl}
                                              </a>
                                            </div>
                                          )}

                                          {isMaterial && m?.file && (
                                            <div className="text-gray-500 flex items-center gap-1.5 text-[11px]">
                                              <span className="px-1 py-0.2 bg-orange-50 text-orange-700 border border-orange-100 rounded text-[9px] font-semibold flex items-center gap-0.5 shrink-0">
                                                <FileText className="size-2.5" /> File
                                              </span>
                                              <a
                                                href={m.file.fileUrl.startsWith('/') ? `http://localhost:8080${m.file.fileUrl}` : m.file.fileUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-indigo-600 hover:underline truncate max-w-[250px]"
                                              >
                                                {m.file.fileName || 'Download Document'}
                                              </a>
                                            </div>
                                          )}

                                          {!isMaterial && t && (
                                            <div className="text-[10px] text-gray-500 flex gap-3 flex-wrap">
                                              <div>Duration: <span className="font-semibold text-gray-700">{t.durationMinutes || '—'} mins</span></div>
                                              {t.passingPercentage !== undefined && (
                                                <div>Passing Score: <span className="font-semibold text-gray-700">{t.passingPercentage}%</span></div>
                                              )}
                                            </div>
                                          )}
                                        </div>

                                        {/* Material operations */}
                                        {isMaterial && m && (
                                          <div className="flex items-center gap-1 shrink-0">
                                            <Button
                                              size="icon"
                                              variant="ghost"
                                              className="size-7 text-gray-500 hover:text-red-650 hover:bg-red-50"
                                              title="Delete Material"
                                              disabled={isPublished}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteMaterial(m.materialId, node.nodeId);
                                              }}
                                            >
                                              <Trash2 className="size-3.5" />
                                            </Button>
                                          </div>
                                        )}

                                        {/* Test operations */}
                                        {!isMaterial && t && (
                                          <div className="flex items-center gap-1 shrink-0">
                                            <Button
                                              size="icon"
                                              variant="ghost"
                                              className="size-7 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"
                                              title="Manage Questions"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleManageQuestionsClick(t);
                                              }}
                                            >
                                              <ClipboardList className="size-3.5" />
                                            </Button>
                                            <Button
                                              size="icon"
                                              variant="ghost"
                                              className="size-7 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"
                                              title="View Attempts"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewAttemptsClick(t);
                                              }}
                                            >
                                              <Eye className="size-3.5" />
                                            </Button>
                                            <Button
                                              size="icon"
                                              variant="ghost"
                                              className="size-7 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"
                                              title="Edit Test"
                                              disabled={isPublished}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditTestClick(node, t);
                                              }}
                                            >
                                              <Pencil className="size-3.5" />
                                            </Button>
                                            <Button
                                              size="icon"
                                              variant="ghost"
                                              className="size-7 text-gray-500 hover:text-red-650 hover:bg-red-50"
                                              title="Delete Test"
                                              disabled={isPublished}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteTest(t.testId, node.nodeId);
                                              }}
                                            >
                                              <Trash2 className="size-3.5" />
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}
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
                                className="bg-card hover:bg-muted text-xs h-8"
                                onClick={() => handleAddMaterialClick(node)}
                                disabled={isPublished}
                              >
                                <Plus className="size-3.5 mr-1" />
                                Add Material
                              </Button>
                            </div>
                            
                            <div title={isPublished ? lockTooltip : undefined}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-card hover:bg-muted text-xs h-8"
                                onClick={() => handleAddTestClick(node)}
                                disabled={isPublished}
                              >
                                <Plus className="size-3.5 mr-1" />
                                Add Test
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
                    onChange={(e) => setNewNodeBranch(e.target.value)}
                  >
                    <option value="">-- Select Branch --</option>
                    <option value="Main">Main</option>
                    <option value="Optional">Optional</option>
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

      {/* ADD MATERIAL MODAL */}
      {isAddMaterialOpen && selectedNodeForContent && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-150">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Add Learning Material</h2>
                <p className="text-xs text-gray-500">Node: {selectedNodeForContent.title}</p>
              </div>
              <button onClick={() => { setIsAddMaterialOpen(false); setSelectedNodeForContent(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleAddMaterialSubmit} className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Material Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lecture slide, Tutorial video..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={materialTitle}
                  onChange={(e) => setMaterialTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Material Type</label>
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="materialType"
                      value="video"
                      checked={materialType === 'video'}
                      onChange={() => setMaterialType('video')}
                      className="text-indigo-650 focus:ring-indigo-550 size-4 cursor-pointer"
                    />
                    Video Link (YouTube...)
                  </label>
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="materialType"
                      value="file"
                      checked={materialType === 'file'}
                      onChange={() => setMaterialType('file')}
                      className="text-indigo-650 focus:ring-indigo-550 size-4 cursor-pointer"
                    />
                    File Upload (Static document)
                  </label>
                </div>
              </div>

              {materialType === 'video' ? (
                <div className="space-y-3 p-3 bg-gray-50 border border-gray-200 rounded-lg animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-750">Video URL (YouTube URL) *</label>
                    <input
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={materialVideoUrl}
                      onChange={(e) => setMaterialVideoUrl(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-750">Video Description</label>
                    <textarea
                      placeholder="Short description of the video..."
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
                    <label className="text-xs font-semibold text-gray-750">Choose File to Upload</label>
                    <input
                      type="file"
                      className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                      onChange={(e) => setMaterialSelectedFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  <div className="text-center text-xs text-gray-400 font-semibold py-1">OR</div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-750">Or enter external file link (Google Drive...)</label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/..."
                      className="w-full border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={materialFileUrl}
                      onChange={(e) => setMaterialFileUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-750">Display File Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. React Cheatsheet PDF"
                      className="w-full border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={materialFileName}
                      onChange={(e) => setMaterialFileName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-750">Material Description</label>
                    <textarea
                      placeholder="Short description of the material..."
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
                  Required to complete this node
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setIsAddMaterialOpen(false); setSelectedNodeForContent(null); }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Add Material
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD TEST MODAL */}
      {isAddTestOpen && selectedNodeForContent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-gray-150">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Add Test</h2>
                <p className="text-xs text-gray-500">To node: {selectedNodeForContent.title}</p>
              </div>
              <button onClick={() => setIsAddTestOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleAddTestSubmit} className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Test Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapter 1 Quiz"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <textarea
                  placeholder="Short description of the test..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={2}
                  value={testDesc}
                  onChange={(e) => setTestDesc(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Duration (Mins)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="15"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={testDuration}
                    onChange={(e) => setTestDuration(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Passing Score (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="70.00"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={testPassPercent}
                    onChange={(e) => setTestPassPercent(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-150 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddTestOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Add Test
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TEST MODAL */}
      {isEditTestOpen && selectedTestForEdit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-gray-150">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Edit Test</h2>
                <p className="text-xs text-gray-500">Updating test details</p>
              </div>
              <button onClick={() => setIsEditTestOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleEditTestSubmit} className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Test Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapter 1 Quiz"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <textarea
                  placeholder="Short description of the test..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={2}
                  value={testDesc}
                  onChange={(e) => setTestDesc(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Duration (Mins)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="15"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={testDuration}
                    onChange={(e) => setTestDuration(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Passing Score (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="70.00"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={testPassPercent}
                    onChange={(e) => setTestPassPercent(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-150 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditTestOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW ATTEMPTS MODAL */}
      {isAttemptsOpen && selectedTestForAttempts && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-gray-150">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Student Attempts</h2>
                <p className="text-xs text-gray-500">Test: {selectedTestForAttempts.title}</p>
              </div>
              <button onClick={() => setIsAttemptsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="size-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              {loadingAttempts ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
                  <Loader className="size-8 animate-spin text-indigo-600" />
                  <p className="text-sm">Loading attempts data...</p>
                </div>
              ) : attempts.length === 0 ? (
                <div className="text-center py-12 text-gray-400 italic">
                  No student has attempted this test yet.
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-55">
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-center">Score</TableHead>
                        <TableHead className="text-center">Result</TableHead>
                        <TableHead>Started At</TableHead>
                        <TableHead>Submitted At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attempts.map((attempt) => (
                        <TableRow key={attempt.attemptId}>
                          <TableCell className="font-medium">{attempt.studentName}</TableCell>
                          <TableCell>{attempt.studentEmail}</TableCell>
                          <TableCell className="text-center font-semibold text-gray-700">
                            {attempt.score !== null ? attempt.score.toFixed(1) : '—'}
                          </TableCell>
                          <TableCell className="text-center">
                            {attempt.passed === null ? (
                              <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">Pending</Badge>
                            ) : attempt.passed ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Passed</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Failed</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-[11px] text-gray-500">
                            {formatDate(attempt.startedAt)}
                          </TableCell>
                          <TableCell className="text-[11px] text-gray-500">
                            {formatDate(attempt.submittedAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <div className="flex justify-end p-4 border-t border-gray-150 bg-gray-50">
              <Button type="button" onClick={() => setIsAttemptsOpen(false)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW QUESTIONS MODAL */}
      {isQuestionsListOpen && selectedTestForQuestions && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-gray-150 bg-indigo-50/50">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ClipboardList className="size-5 text-indigo-600" />
                  Manage Questions
                </h2>
                <p className="text-xs text-gray-500 font-medium">Test: {selectedTestForQuestions.title}</p>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  onClick={handleOpenAddQuestion} 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 px-3 flex items-center gap-1"
                >
                  <Plus className="size-3.5" />
                  Add Question
                </Button>
                <button onClick={() => setIsQuestionsListOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="size-5" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto flex-1 bg-gray-50/30">
              {loadingQuestions ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
                  <Loader className="size-8 animate-spin text-indigo-600 animate-spin" />
                  <p className="text-sm">Loading questions...</p>
                </div>
              ) : questionsList.length === 0 ? (
                <div className="text-center py-16 text-gray-400 flex flex-col items-center justify-center gap-2">
                  <HelpCircle className="size-12 text-gray-300 stroke-[1.5]" />
                  <p className="text-sm font-medium">No questions added yet.</p>
                  <p className="text-xs text-gray-500 max-w-xs">Click the "Add Question" button above to create your first multiple-choice question.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {questionsList.map((q, idx) => (
                    <div key={q.questionId} className="bg-white border border-gray-150 rounded-xl p-4 shadow-sm hover:border-gray-300 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md">
                              Question {idx + 1}
                            </span>
                            <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md">
                              Score: {q.score}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-gray-800 whitespace-pre-wrap">{q.questionContent}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"
                            title="Edit Question"
                            onClick={() => handleOpenEditQuestion(q)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-gray-500 hover:text-red-650 hover:bg-red-50"
                            title="Delete Question"
                            onClick={() => handleDeleteQuestion(q.questionId)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Answers choices preview */}
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 pl-2">
                        {(q.answers || []).map((ans, ansIdx) => {
                          const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
                          const letter = labels[ansIdx] || String(ansIdx + 1);
                          return (
                            <div 
                              key={ans.answerId} 
                              className={`flex items-start gap-2.5 p-2 rounded-lg text-xs border ${
                                ans.isCorrect 
                                  ? 'bg-green-50/60 border-green-200 text-green-800 font-medium' 
                                  : 'bg-gray-50/50 border-gray-100 text-gray-600'
                              }`}
                            >
                              <span className={`flex items-center justify-center shrink-0 size-5 rounded-full font-bold text-[10px] ${
                                ans.isCorrect 
                                  ? 'bg-green-500 text-white' 
                                  : 'bg-gray-200 text-gray-600'
                              }`}>
                                {letter}
                              </span>
                              <span className="break-words mt-0.5">{ans.answerContent}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end p-4 border-t border-gray-150 bg-gray-50">
              <Button type="button" onClick={() => setIsQuestionsListOpen(false)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT QUESTION FORM MODAL */}
      {isAddEditQuestionOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-gray-150 bg-indigo-50/50">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingQuestion ? 'Edit Question' : 'Add Question'}
                </h2>
                <p className="text-xs text-gray-500 font-medium">Type: Multiple Choice (Single correct answer)</p>
              </div>
              <button onClick={() => setIsAddEditQuestionOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="flex-1 overflow-y-auto flex flex-col">
              <div className="p-5 space-y-4 flex-1">
                {/* Question Content */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    Question Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Enter the question text here..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={questionContent}
                    onChange={(e) => setQuestionContent(e.target.value)}
                  />
                </div>

                {/* Score */}
                <div className="space-y-1 w-full md:w-1/3">
                  <label className="text-sm font-medium text-gray-700">Score</label>
                  <input
                    type="number"
                    min="0.5"
                    max="100"
                    step="0.5"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={questionScore}
                    onChange={(e) => setQuestionScore(e.target.value)}
                  />
                </div>

                {/* Answers Builder */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-800">
                      Answer Choices <span className="text-red-500">*</span>
                    </label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleAddAnswerRow}
                      className="text-xs h-7 px-2 border-dashed border-indigo-400 text-indigo-600 hover:bg-indigo-50"
                    >
                      <Plus className="size-3 mr-1" /> Add Option
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">Provide options and use the radio button to select the single correct answer.</p>

                  <div className="space-y-2.5">
                    {questionAnswers.map((ans, index) => {
                      const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
                      const letter = labels[index] || String(index + 1);
                      return (
                        <div key={index} className="flex items-center gap-3">
                          {/* Radio Correct Selection */}
                          <div className="flex items-center shrink-0">
                            <input
                              type="radio"
                              name="correctAnswerRadio"
                              id={`correct-radio-${index}`}
                              className="size-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer border-gray-300"
                              checked={ans.isCorrect}
                              onChange={() => handleCorrectAnswerSelect(index)}
                            />
                          </div>

                          {/* Option Input */}
                          <div className="flex-1 flex items-center gap-2 border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 bg-white">
                            <span className="bg-gray-100 text-gray-500 font-bold text-xs size-9 flex items-center justify-center shrink-0 border-r border-gray-200">
                              {letter}
                            </span>
                            <input
                              type="text"
                              placeholder={`Option ${letter} content...`}
                              required={index < 2} // At least 2 options required
                              className="w-full px-2 py-1.5 text-sm focus:outline-none border-none bg-transparent"
                              value={ans.answerContent}
                              onChange={(e) => handleAnswerChange(index, e.target.value)}
                            />
                          </div>

                          {/* Delete Option Row */}
                          {questionAnswers.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              className="size-8 text-gray-400 hover:text-red-600 shrink-0"
                              onClick={() => handleRemoveAnswerRow(index)}
                            >
                              <X className="size-4" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-150 p-4 bg-gray-50 shrink-0">
                <Button type="button" variant="outline" onClick={() => setIsAddEditQuestionOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  {editingQuestion ? 'Save Question' : 'Add Question'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
