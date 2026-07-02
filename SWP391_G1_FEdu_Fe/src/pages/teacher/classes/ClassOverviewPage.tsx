import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
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
  Settings,
  Loader,
  ChevronRight,
  HelpCircle,
  AlertTriangle,
  Play,
  Trash2,
  Undo2,
  BookOpen,
  GraduationCap,
  FileText,
  Film,
  Award,
  Map,
  Plus,
  X,
  Users,
  History,
  Eye,
  User,
  Mail,
  TrendingUp,
  UserCheck,
  UserMinus,
  MessageSquare,
  Save,
  UserPlus
} from 'lucide-react';
import { teacherService } from '../../../services/teacher.service';
import { classroomService } from '../../../services/classroom.service';
import {
  learningPathService,
  LearningNodeResponse,
  NodeEdgeResponse,
  ClassroomGraphResponse,
  NodeContentResponse,
  StudentInClassResponse
} from '../../../services/learningPath.service';
import { LearningPathFlow } from '../../../components/learningPath/LearningPathFlow';
import { MaterialPreview } from '../../../components/learningPath/MaterialPreview';
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
  email?: string;
  progress: number;
  currentLevel?: number;
  assignedPathName?: string;
  rawUserId: number;
  classroomSubjectStudentId?: number;
  isSubmentor?: boolean;
}

export function ClassOverviewPage() {
  const navigate = useNavigate();
  const { classroomSubjectId } = useParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [classInfo, setClassInfo] = useState({
    classCode: '',
    courseCode: '',
    semester: '',
    description: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [classroomStatus, setClassroomStatus] = useState<string>('inactive');
  const [parentClassroomId, setParentClassroomId] = useState<number | null>(null);

  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({});
  const [nodeContents, setNodeContents] = useState<Record<number, NodeContentResponse>>({});
  const [loadingContents, setLoadingContents] = useState<Record<number, boolean>>({});

  // New classroom publish flow states
  const [graphData, setGraphData] = useState<ClassroomGraphResponse | null>(null);
  const [actionState, setActionState] = useState<'idle' | 'cloning' | 'publishing' | 'unpublishing' | 'deleting'>('idle');
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  // Xem trước lộ trình mẫu trước khi áp dụng/đè lên
  const [templatePreview, setTemplatePreview] = useState<{ pathId: number; nodes: LearningNodeResponse[]; edges: NodeEdgeResponse[] } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showApplyTemplateConfirm, setShowApplyTemplateConfirm] = useState(false);

  // Dialog visibility and confirmation states
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [understandPublish, setUnderstandPublish] = useState(false);

  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);
  const [understandUnpublish, setUnderstandUnpublish] = useState(false);

  const [showUnpublishError, setShowUnpublishError] = useState(false);
  const [unpublishErrorMsg, setUnpublishErrorMsg] = useState<string | null>(null);

  const [seededCount, setSeededCount] = useState<number | null>(null);

  // Selected Node Details state
  const [selectedNode, setSelectedNode] = useState<LearningNodeResponse | null>(null);
  const [nodeStudents, setNodeStudents] = useState<StudentInClassResponse[]>([]);
  const [nodeContent, setNodeContent] = useState<NodeContentResponse | null>(null);
  const [loadingNodeDetails, setLoadingNodeDetails] = useState(false);

  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'roadmap' | 'placement' | 'students' | 'support'>('roadmap');

  const handleConfirmAssignSubMentors = async () => {
    if (assignSubMentorIds.length === 0 || !classroomSubjectId) return;
    try {
      setLoadingSupport(true);
      for (const id of assignSubMentorIds) {
        await teacherService.enableSubMentor(Number(classroomSubjectId), id);
      }
      toast.success(`Đã chỉ định ${assignSubMentorIds.length} trợ giảng thành công`);
      setIsAssignSubMentorModalOpen(false);
      setAssignSubMentorIds([]);
      fetchClassroomData();
      if (activeTab === 'support') {
        fetchSupportData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Chỉ định trợ giảng thất bại`);
    } finally {
      setLoadingSupport(false);
    }
  };

  // Support Tab functions
  const [isAssignSubMentorModalOpen, setIsAssignSubMentorModalOpen] = useState(false);
  const [assignSubMentorIds, setAssignSubMentorIds] = useState<number[]>([]);

  // Sync activeTab from ?tab= query parameter (e.g. when redirected from ClassManagementPage)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'placement' || tabParam === 'students' || tabParam === 'support' || tabParam === 'roadmap') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Placement Quiz states
  const [placementQuiz, setPlacementQuiz] = useState<any>(null);
  const [loadingPlacement, setLoadingPlacement] = useState(false);
  const [isCreateQuizOpen, setIsCreateQuizOpen] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [quizDuration, setQuizDuration] = useState('45');
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  // Score bands state
  const [scoreBands, setScoreBands] = useState<any[]>([]);
  const [savingBands, setSavingBands] = useState(false);

  // Questions state
  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [questionContent, setQuestionContent] = useState('');
  const [questionType, setQuestionType] = useState<'SINGLE' | 'MULTIPLE' | 'ESSAY'>('SINGLE');
  const [answers, setAnswers] = useState<any[]>([
    { answerContent: '', isCorrect: false },
    { answerContent: '', isCorrect: false },
    { answerContent: '', isCorrect: false },
    { answerContent: '', isCorrect: false }
  ]);
  const [submittingQuestion, setSubmittingQuestion] = useState(false);

  // Student level history modal state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedStudentName, setSelectedStudentName] = useState('');
  const [levelHistory, setLevelHistory] = useState<any[]>([]);

  // Student details modal state
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [detailTab, setDetailTab] = useState<'info' | 'history'>('info');
  const [resettingPlacement, setResettingPlacement] = useState(false);

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Support & Peer Mentoring states
  const [escalatedTickets, setEscalatedTickets] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loadingSupport, setLoadingSupport] = useState(false);
  const [isRespondModalOpen, setIsRespondModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [responseText, setResponseText] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [isAssignStudentModalOpen, setIsAssignStudentModalOpen] = useState(false);
  const [selectedSubMentor, setSelectedSubMentor] = useState<Student | null>(null);
  const [selectedStudentsToAssign, setSelectedStudentsToAssign] = useState<number[]>([]);
  const [submittingAssignment, setSubmittingAssignment] = useState(false);

  const handleResetPlacement = async (studentId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy kết quả phân lớp của học sinh này? Toàn bộ tiến độ học tập trên lộ trình cũ của học sinh sẽ bị xóa và không thể khôi phục.")) {
      return;
    }
    setResettingPlacement(true);
    try {
      await teacherService.cancelStudentPlacement(Number(classroomSubjectId), studentId);
      if (isMounted.current) {
        toast.success("Đã hủy kết quả phân lớp học sinh thành công.");
        setIsDetailOpen(false);
      }
      fetchClassroomData();
    } catch (err: any) {
      toast.error(err?.message || "Hủy kết quả thất bại");
    } finally {
      if (isMounted.current) {
        setResettingPlacement(false);
      }
    }
  };

  const fetchSupportData = useCallback(async () => {
    if (!classroomSubjectId) return;
    if (isMounted.current) {
      setLoadingSupport(true);
    }
    try {
      const [ticketsList, assignmentsList] = await Promise.all([
        teacherService.listEscalatedTickets(Number(classroomSubjectId)),
        teacherService.listAssignments(Number(classroomSubjectId))
      ]);
      if (!isMounted.current) return;
      setEscalatedTickets(ticketsList || []);
      setAssignments(assignmentsList || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể tải dữ liệu trợ giảng");
    } finally {
      if (isMounted.current) {
        setLoadingSupport(false);
      }
    }
  }, [classroomSubjectId]);

  useEffect(() => {
    if (activeTab === 'support') {
      fetchSupportData();
    }
  }, [activeTab, fetchSupportData]);

  const handleToggleSubMentor = async (student: Student) => {
    if (!classroomSubjectId || !student.classroomSubjectStudentId) return;
    const isCurrentlySub = !!student.isSubmentor;
    const actionText = isCurrentlySub ? "tắt" : "bật";

    try {
      if (isCurrentlySub) {
        await teacherService.disableSubMentor(Number(classroomSubjectId), student.classroomSubjectStudentId);
      } else {
        await teacherService.enableSubMentor(Number(classroomSubjectId), student.classroomSubjectStudentId);
      }
      toast.success(`Đã ${actionText} cờ trợ giảng thành công cho ${student.fullName}`);
      fetchClassroomData();
      if (activeTab === 'support') {
        fetchSupportData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Thay đổi trạng thái trợ giảng thất bại`);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classroomSubjectId || !selectedSubMentor || selectedStudentsToAssign.length === 0) return;
    if (isMounted.current) {
      setSubmittingAssignment(true);
    }
    try {
      for (const studentId of selectedStudentsToAssign) {
        await teacherService.createAssignment(Number(classroomSubjectId), {
          subMentorCssId: selectedSubMentor.classroomSubjectStudentId!,
          studentCssId: studentId
        });
      }
      if (isMounted.current) {
        toast.success(`Đã gán ${selectedStudentsToAssign.length} học sinh thành công`);
        setIsAssignStudentModalOpen(false);
        setSelectedStudentsToAssign([]);
      }
      fetchSupportData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gán nhóm thất bại");
    } finally {
      if (isMounted.current) {
        setSubmittingAssignment(false);
      }
    }
  };

  const handleDeleteAssignment = async (assignmentId: number) => {
    if (!classroomSubjectId) return;
    if (!window.confirm("Bạn có chắc chắn muốn gỡ học sinh này khỏi nhóm kèm cặp?")) return;
    try {
      await teacherService.deleteAssignment(Number(classroomSubjectId), assignmentId);
      toast.success("Đã gỡ học sinh khỏi nhóm thành công");
      fetchSupportData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gỡ thất bại");
    }
  };

  const handleRespondTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classroomSubjectId || !selectedTicket || !responseText.trim()) return;
    if (isMounted.current) {
      setSubmittingResponse(true);
    }
    try {
      await teacherService.respondAsTeacher(Number(classroomSubjectId), selectedTicket.ticketId, {
        messageResponse: responseText.trim()
      });
      if (isMounted.current) {
        toast.success("Đã trả lời câu hỏi thành công");
        setIsRespondModalOpen(false);
        setSelectedTicket(null);
        setResponseText('');
      }
      fetchSupportData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Trả lời thất bại");
    } finally {
      if (isMounted.current) {
        setSubmittingResponse(false);
      }
    }
  };

  // Keep track of which first nodes have been initialized to avoid redundant calls or state resets
  const initializedPathsRef = useRef<Set<number>>(new Set());

  const handleViewHistory = async (student: Student) => {
    setSelectedStudentName(student.fullName);
    setIsHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const res = await learningPathService.getStudentLevelHistory(Number(classroomSubjectId), student.rawUserId);
      setLevelHistory(res);
    } catch (err) {
      console.error("Failed to load student level history:", err);
      toast.error("Không thể tải lịch sử xếp lớp");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleViewDetail = async (student: Student) => {
    setSelectedStudent(student);
    setDetailTab('info');
    setIsDetailOpen(true);
    setHistoryLoading(true);
    try {
      const res = await learningPathService.getStudentLevelHistory(Number(classroomSubjectId), student.rawUserId);
      setLevelHistory(res);
    } catch (err) {
      console.error("Failed to load student level history:", err);
      setLevelHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchNodeContent = useCallback(async (nodeId: number) => {
    try {
      setLoadingContents((prev) => ({ ...prev, [nodeId]: true }));
      const content = await learningPathService.getTeacherNodeContent(nodeId);
      setNodeContents((prev) => ({ ...prev, [nodeId]: content }));
    } catch (err: any) {
      console.error('Failed to load node content:', err);
    } finally {
      setLoadingContents((prev) => ({ ...prev, [nodeId]: false }));
    }
  }, []);

  const fetchPlacementQuestions = useCallback(async (testId: number) => {
    try {
      setLoadingQuestions(true);
      const res = await learningPathService.getPlacementQuestions(testId);
      setQuestions(res || []);
    } catch (err: any) {
      console.error('Failed to load placement questions:', err);
    } finally {
      setLoadingQuestions(false);
    }
  }, []);

  const fetchPlacementQuiz = useCallback(async () => {
    if (!classroomSubjectId) return;
    try {
      setLoadingPlacement(true);
      const res = await learningPathService.getPlacementQuizDetails(Number(classroomSubjectId));
      setPlacementQuiz(res);
      if (res) {
        setQuizTitle(res.title);
        setQuizDescription(res.description || '');
        setQuizDuration(String(res.durationMinutes));
        setScoreBands(res.scoreBands || []);
        await fetchPlacementQuestions(res.testId);
      }
    } catch (err: any) {
      console.error('Failed to load placement quiz:', err);
    } finally {
      setLoadingPlacement(false);
    }
  }, [classroomSubjectId, fetchPlacementQuestions]);

  useEffect(() => {
    if (activeTab === 'placement') {
      fetchPlacementQuiz();
    }
  }, [activeTab, fetchPlacementQuiz]);

  const handleCreateOrUpdateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classroomSubjectId) return;
    try {
      setSubmittingQuiz(true);
      const res = await learningPathService.createPlacementQuiz(Number(classroomSubjectId), {
        title: quizTitle.trim(),
        description: quizDescription.trim() || undefined,
        durationMinutes: Number(quizDuration)
      });
      setPlacementQuiz(res);
      toast.success(placementQuiz ? 'Cập nhật bài test thành công!' : 'Khởi tạo bài test thành công!');
      setIsCreateQuizOpen(false);
      await fetchPlacementQuiz();

      // Update graphData to check quizStartTestId
      const updatedGraph = await learningPathService.getClassroomGraph(Number(classroomSubjectId));
      setGraphData(updatedGraph);
    } catch (err: any) {
      console.error('Failed to create/update placement quiz:', err);
      toast.error(err.response?.data?.message || 'Thao tác thất bại');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const handleInitializeDefaultBands = () => {
    setScoreBands([
      { minScore: 0, maxScore: 40, targetLevel: 1 },
      { minScore: 40, maxScore: 70, targetLevel: 2 },
      { minScore: 70, maxScore: 100, targetLevel: 3 }
    ]);
  };

  const handleSaveScoreBands = async () => {
    if (!placementQuiz) return;
    try {
      setSavingBands(true);
      const sorted = [...scoreBands].sort((a, b) => a.minScore - b.minScore);
      let expected = 0;
      for (const b of sorted) {
        if (Number(b.minScore) > Number(b.maxScore)) {
          toast.error('Điểm tối thiểu phải nhỏ hơn hoặc bằng điểm tối đa');
          setSavingBands(false);
          return;
        }
        if (Number(b.minScore) !== expected) {
          toast.error(`Các khoảng điểm phải liền mạch không chồng lấn. Lỗi tại điểm bắt đầu ${b.minScore}`);
          setSavingBands(false);
          return;
        }
        expected = Number(b.maxScore);
      }
      if (expected !== 100) {
        toast.error(`Các khoảng điểm phải kết thúc chính xác tại 100. Hiện kết thúc tại ${expected}`);
        setSavingBands(false);
        return;
      }

      await learningPathService.updateScoreBands(placementQuiz.testId, scoreBands.map(b => ({
        minScore: Number(b.minScore),
        maxScore: Number(b.maxScore),
        targetLevel: Number(b.targetLevel)
      })));
      toast.success('Cập nhật khoảng điểm phân loại thành công!');
      await fetchPlacementQuiz();
    } catch (err: any) {
      console.error('Failed to update score bands:', err);
      toast.error(err.response?.data?.message || 'Không thể lưu khoảng điểm');
    } finally {
      setSavingBands(false);
    }
  };

  const handleOpenQuestionModal = (question: any = null) => {
    setEditingQuestion(question);
    if (question) {
      setQuestionContent(question.questionContent);
      setQuestionType(
        question.questionType === 'ESSAY'
          ? 'ESSAY'
          : (question.questionType === 'MULTIPLE_CHOICE' ? 'SINGLE' : 'MULTIPLE')
      );
      setAnswers(question.answers.map((a: any) => ({
        answerContent: a.answerContent,
        isCorrect: a.isCorrect
      })));
    } else {
      setQuestionContent('');
      setQuestionType('SINGLE');
      setAnswers([
        { answerContent: '', isCorrect: false },
        { answerContent: '', isCorrect: false },
        { answerContent: '', isCorrect: false },
        { answerContent: '', isCorrect: false }
      ]);
    }
    setIsQuestionModalOpen(true);
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placementQuiz) return;

    if (questionType === 'ESSAY') {
      if (!answers[0] || !answers[0].answerContent.trim()) {
        toast.error('Vui lòng nhập câu trả lời mẫu/hướng dẫn chấm');
        return;
      }
    } else {
      const filledAnswers = answers.filter(a => a.answerContent.trim() !== '');
      if (filledAnswers.length < 2) {
        toast.error('Cần nhập ít nhất 2 đáp án');
        return;
      }
      const hasCorrect = filledAnswers.some(a => a.isCorrect);
      if (!hasCorrect) {
        toast.error('Cần chọn ít nhất 1 đáp án đúng');
        return;
      }
    }

    try {
      setSubmittingQuestion(true);
      const filledAnswers = questionType === 'ESSAY'
        ? [{ answerContent: answers[0].answerContent.trim(), isCorrect: true }]
        : answers.filter(a => a.answerContent.trim() !== '').map(a => ({
            answerContent: a.answerContent.trim(),
            isCorrect: a.isCorrect
          }));

      const payload = {
        questionContent: questionContent.trim(),
        questionType: questionType === 'ESSAY'
          ? 'ESSAY'
          : (questionType === 'SINGLE' ? 'MULTIPLE_CHOICE' : 'MULTIPLE_SELECT') as 'MULTIPLE_CHOICE' | 'MULTIPLE_SELECT' | 'ESSAY',
        score: 1,
        answers: filledAnswers
      };

      if (editingQuestion) {
        await learningPathService.updatePlacementQuestion(editingQuestion.questionId, payload);
        toast.success('Cập nhật câu hỏi thành công!');
      } else {
        await learningPathService.addPlacementQuestion(placementQuiz.testId, payload);
        toast.success('Thêm câu hỏi thành công!');
      }

      setIsQuestionModalOpen(false);
      await fetchPlacementQuiz();
    } catch (err: any) {
      console.error('Failed to submit question:', err);
      toast.error(err.response?.data?.message || 'Thao tác thất bại');
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này không?')) return;
    try {
      await learningPathService.deletePlacementQuestion(questionId);
      toast.success('Xóa câu hỏi thành công!');
      await fetchPlacementQuiz();
    } catch (err: any) {
      console.error('Failed to delete question:', err);
      toast.error(err.response?.data?.message || 'Không thể xóa câu hỏi');
    }
  };

  const toggleNode = async (nodeId: number) => {
    const nextState = !expandedNodes[nodeId];
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: nextState,
    }));
    if (nextState && !nodeContents[nodeId]) {
      await fetchNodeContent(nodeId);
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

  const fetchClassroomData = async () => {
    if (!classroomSubjectId) return;

    try {
      setLoading(true);
      const [classData, studentsData, graph] = await Promise.all([
        teacherService.getClassroomSubjectById(Number(classroomSubjectId)),
        classroomService.getStudents(Number(classroomSubjectId)),
        learningPathService.getClassroomGraph(Number(classroomSubjectId)),
      ]);

      const fullClassroom = await teacherService.getClassroomById(classData.classroomId);

      setClassInfo({
        classCode: classData.className,
        courseCode: classData.subjectCode,
        semester: fullClassroom.semester || '',
        description: fullClassroom.description || '',
      });
      setClassroomStatus(fullClassroom.status || 'inactive');
      setParentClassroomId(fullClassroom.classroomId);

      if (!isMounted.current) return;
      const formatted = (studentsData ?? []).map((item) => ({
        id: item.email?.split('@')[0].toUpperCase() || `ST${item.userId}`,
        fullName: (item.lastName || item.firstName)
          ? `${item.lastName || ''} ${item.firstName || ''}`.trim()
          : `Student ${item.userId}`,
        email: item.email || '',
        progress: 0,
        currentLevel: item.currentLevel,
        assignedPathName: item.assignedPathName,
        rawUserId: item.userId,
        classroomSubjectStudentId: item.classroomSubjectStudentId,
        isSubmentor: item.isSubmentor,
      }));
      setStudents(formatted);
      setGraphData(graph);
    } catch (err: any) {
      console.error('Error loading classroom overview:', err);
      if (isMounted.current) {
        setError(err.response?.data?.message || 'Failed to load classroom data');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!parentClassroomId) return;
    const actionText = newStatus === 'active' ? 'bắt đầu' : 'kết thúc';
    if (!confirm(`Bạn có chắc chắn muốn ${actionText} lớp học này không? (Hành động này ảnh hưởng đến toàn bộ môn học trong lớp)`)) return;

    try {
      setActionState(newStatus === 'active' ? 'publishing' : 'unpublishing');
      await classroomService.update(parentClassroomId, {
        className: classInfo.classCode,
        semester: classInfo.semester || '',
        description: classInfo.description || '',
        status: newStatus,
      });
      setClassroomStatus(newStatus);
      toast.success(newStatus === 'active' ? 'Lớp học đã bắt đầu thành công!' : 'Lớp học đã kết thúc!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Cập nhật trạng thái thất bại');
    } finally {
      setActionState('idle');
    }
  };

  useEffect(() => {
    initializedPathsRef.current.clear();
    fetchClassroomData();
  }, [classroomSubjectId]);

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
      if (document.visibilityState === 'visible' && classroomSubjectId) {
        learningPathService.getClassroomGraph(Number(classroomSubjectId))
          .then(graph => {
            setGraphData(graph);
          })
          .catch(err => console.error('Error auto-refreshing graph:', err));
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [classroomSubjectId]);

  useEffect(() => {
    if (graphData && graphData.paths) {
      const initialExpanded: Record<number, boolean> = {};
      let hasChanges = false;
      graphData.paths.forEach((path) => {
        if (path.nodes && path.nodes.length > 0 && !initializedPathsRef.current.has(path.pathId)) {
          initializedPathsRef.current.add(path.pathId);
          const sorted = [...path.nodes].sort((a, b) => a.displayOrder - b.displayOrder);
          const firstNodeId = sorted[0].nodeId;
          initialExpanded[firstNodeId] = true;
          hasChanges = true;
          fetchNodeContent(firstNodeId);
        }
      });
      if (hasChanges) {
        setExpandedNodes((prev) => ({ ...initialExpanded, ...prev }));
      }
    }
  }, [graphData, fetchNodeContent]);

  const handleNodeClick = async (node: LearningNodeResponse) => {
    setSelectedNode(node);
    setLoadingNodeDetails(true);
    try {
      const [content, students] = await Promise.all([
        learningPathService.getTeacherNodeContent(node.nodeId),
        learningPathService.getNodeStudents(node.nodeId)
      ]);
      setNodeContent(content);
      setNodeStudents(students);
    } catch (err) {
      console.error('Lỗi khi tải chi tiết node:', err);
      toast.error('Không thể tải chi tiết bài học');
    } finally {
      setLoadingNodeDetails(false);
    }
  };

  const handleClone = async () => {
    if (!classroomSubjectId) return;
    try {
      setActionState('cloning');
      // Truyền template đang chọn (nếu có) — môn nhiều lộ trình mẫu bắt buộc phải chọn cụ thể.
      await learningPathService.cloneFromTemplate(Number(classroomSubjectId), selectedTemplateId ?? undefined);

      // Refetch classroom graph
      const updatedGraph = await learningPathService.getClassroomGraph(Number(classroomSubjectId));
      setGraphData(updatedGraph);
      setTemplatePreview(null);
      toast.success('Khởi tạo lộ trình học thành công!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể khởi tạo lộ trình học');
    } finally {
      setActionState('idle');
    }
  };

  // Chọn 1 template ở dropdown → tải graph mẫu để xem trước trong khung "Sơ đồ lộ trình học tập".
  const handlePreviewTemplate = async (templatePathId: number | null) => {
    setSelectedTemplateId(templatePathId);
    setSelectedNode(null);
    if (!templatePathId) {
      setTemplatePreview(null);
      return;
    }
    try {
      setPreviewLoading(true);
      const graph = await learningPathService.getLearningPathGraph(templatePathId);
      setTemplatePreview({ pathId: templatePathId, nodes: graph.nodes || [], edges: graph.edges || [] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tải lộ trình mẫu để xem trước');
      setTemplatePreview(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Áp dụng template đang xem trước. Nếu lớp đã có bản nháp → xóa nháp cũ rồi clone đè lên.
  const handleApplyTemplate = async () => {
    if (!classroomSubjectId || !selectedTemplateId) return;
    try {
      setActionState('cloning');
      if (graphData?.state === 'DRAFT' && graphData.pathId) {
        await learningPathService.deleteDraftPath(Number(classroomSubjectId), graphData.pathId);
      }
      await learningPathService.cloneFromTemplate(Number(classroomSubjectId), selectedTemplateId);

      const updatedGraph = await learningPathService.getClassroomGraph(Number(classroomSubjectId));
      setGraphData(updatedGraph);
      setTemplatePreview(null);
      setSelectedTemplateId(null);
      setShowApplyTemplateConfirm(false);
      toast.success('Áp dụng lộ trình mẫu thành công!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể áp dụng lộ trình mẫu');
    } finally {
      setActionState('idle');
    }
  };

  const handlePublish = async () => {
    if (!classroomSubjectId || !graphData?.pathId) return;

    if (!graphData?.quizStartTestId) {
      toast.error('Vui lòng khởi tạo và cấu hình bài test phân loại đầu vào trước khi xuất bản lộ trình.');
      setShowPublishConfirm(false);
      setUnderstandPublish(false);
      return;
    }

    try {
      setActionState('publishing');
      const res = await learningPathService.publishClassroomPath(Number(classroomSubjectId), graphData.pathId);
      setSeededCount(res.seededStudents);

      const updatedGraph = await learningPathService.getClassroomGraph(Number(classroomSubjectId));
      setGraphData(updatedGraph);
      setShowPublishConfirm(false);
      setUnderstandPublish(false);
      toast.success('Xuất bản lộ trình học thành công!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể xuất bản lộ trình học');
    } finally {
      setActionState('idle');
    }
  };

  const handleUnpublish = async () => {
    if (!classroomSubjectId || !graphData?.pathId) return;
    try {
      setActionState('unpublishing');
      await learningPathService.unpublishClassroomPath(Number(classroomSubjectId), graphData.pathId);

      const updatedGraph = await learningPathService.getClassroomGraph(Number(classroomSubjectId));
      setGraphData(updatedGraph);
      setShowUnpublishConfirm(false);
      setUnderstandUnpublish(false);
      toast.success('Gỡ xuất bản lộ trình học thành công!');
    } catch (err: any) {
      if (err.response?.status === 409) {
        setUnpublishErrorMsg(err.response?.data?.message || 'Không thể unpublish — đã có học sinh hoàn thành node.');
        setShowUnpublishError(true);
      } else {
        toast.error(err.response?.data?.message || 'Không thể gỡ xuất bản lộ trình học');
      }
    } finally {
      setActionState('idle');
    }
  };

  const handleDeleteDraft = async () => {
    if (!classroomSubjectId || !graphData?.pathId) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa bản nháp này không? Lộ trình sẽ bị xóa vĩnh viễn.')) return;

    try {
      setActionState('deleting');
      await learningPathService.deleteDraftPath(Number(classroomSubjectId), graphData.pathId);

      const updatedGraph = await learningPathService.getClassroomGraph(Number(classroomSubjectId));
      setGraphData(updatedGraph);
      setSelectedTemplateId(null);
      toast.success('Đã xóa bản nháp lộ trình học thành công!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể xóa bản nháp lộ trình học');
    } finally {
      setActionState('idle');
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

  const renderClassRoadmapColumn = (level: number, title: string, defaultDesc: string) => {
    const pathDto = graphData?.paths?.find((p) => p.level === level);

    if (!pathDto) {
      return (
        <Card className="border border-slate-200 bg-white shadow-xs min-h-[400px] flex flex-col justify-between p-6 rounded-2xl">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-slate-400" />
              <h3 className="font-bold text-lg text-slate-800">{title}</h3>
            </div>
            <p className="text-sm text-slate-500">{defaultDesc}</p>
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Map className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs text-slate-400">Chưa thiết lập lộ trình cho mức này.</p>
            </div>
          </div>
        </Card>
      );
    }

    const colNodes = pathDto.nodes || [];
    const colEdges = pathDto.edges || [];

    const isColSubNode = (_n: any) => false; // model mới không còn "nhánh phụ" (cạnh có max_score)
    const colSubDepth = (n: any, seen: Set<number> = new Set()): number => {
      if (!isColSubNode(n)) return 0;
      if (seen.has(n.nodeId)) return 1;
      seen.add(n.nodeId);
      const pe = colEdges.find((e) => e.toNodeId === n.nodeId);
      const parent = pe ? colNodes.find((x) => x.nodeId === pe.fromNodeId) : undefined;
      return parent ? colSubDepth(parent, seen) + 1 : 1;
    };
    const stripLessonPrefix = (t: string) => (t || "").replace(/^\s*Bài\s+\d+(\s*phụ(\s*\d+)?)?\s*:?\s*/i, "").trim();
    const colNodeLabels: Record<number, string> = {};
    const subInfo: Record<number, { base: string; idx: number }> = {};
    let lessonCounter = 0;

    // Sort nodes by displayOrder, then nodeId for stable sorting
    const sortedColNodes = [...colNodes].sort((a, b) => (a.displayOrder - b.displayOrder) || (a.nodeId - b.nodeId));

    for (const n of sortedColNodes) {
      if (isColSubNode(n)) {
        const pe = colEdges.find((e) => e.toNodeId === n.nodeId);
        const parentId = pe?.fromNodeId;
        const parentSub = parentId != null ? subInfo[parentId] : undefined;
        const base = parentSub
          ? parentSub.base
          : parentId != null
            ? colNodeLabels[parentId] || `Bài ${lessonCounter}`
            : `Bài ${lessonCounter}`;
        const idx = parentSub ? parentSub.idx + 1 : 1;
        subInfo[n.nodeId] = { base, idx };
        colNodeLabels[n.nodeId] = `${base} phụ ${idx}`;
      } else {
        lessonCounter += 1;
        colNodeLabels[n.nodeId] = `Bài ${lessonCounter}`;
      }
    }

    const colTotals = sortedColNodes.reduce(
      (acc, n) => {
        const c = nodeContents[n.nodeId];
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
      <Card className="border border-slate-200 bg-white shadow-xs flex flex-col min-h-[500px] p-6 rounded-2xl">
        <div className="flex-1">
          {/* Column Header */}
          <div className="pb-4 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-1.5">
              <BookOpen className="w-5 h-5 text-primary shrink-0" />
              <h3 className="font-bold text-lg text-slate-800">{title}</h3>
            </div>
            <p className="text-xs text-slate-500 line-clamp-2">
              {defaultDesc}
            </p>
          </div>

          {/* Stats Bar */}
          {sortedColNodes.length > 0 && (
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 pb-3 mb-4 border-b border-slate-100 text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-primary" /> {sortedColNodes.length} bài học</span>
              {colTotals.videos > 0 && (
                <span className="flex items-center gap-1"><Film className="w-3.5 h-3.5 text-purple-500" /> {colTotals.videos} video</span>
              )}
              {colTotals.docs > 0 && (
                <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-orange-500" /> {colTotals.docs} tài liệu</span>
              )}
              {colTotals.tests > 0 && (
                <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5 text-emerald-500" /> {colTotals.tests} test</span>
              )}
            </div>
          )}

          {/* Nodes list */}
          {sortedColNodes.length === 0 ? (
            <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <Map className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs">Chưa có bài học nào trong lộ trình này.</p>
            </div>
          ) : (
            <div className="flex flex-col space-y-3">
              {sortedColNodes.map((node, index) => {
                const isExpanded = !!expandedNodes[node.nodeId];
                const sortedItems = getSortedTimelineItems(node.nodeId);
                const isLoadingContent = !!loadingContents[node.nodeId];

                const depth = colSubDepth(node);

                return (
                  <div key={node.nodeId} className="w-full relative" style={{ marginLeft: `${depth * 28}px` }}>
                    {/* Branch connector on the left */}
                    {depth > 0 && (
                      <div className="absolute top-0 bottom-0 flex items-start justify-center pointer-events-none" style={{ left: `-${28}px`, width: `${28}px` }}>
                        <svg className="w-full h-12 text-slate-300" viewBox="0 0 28 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M 14 0 L 14 16 Q 14 24 21 24 L 28 24" />
                          {index < sortedColNodes.length - 1 && <path d="M 14 24 L 14 48" />}
                        </svg>
                      </div>
                    )}

                    {/* Standard vertical line connector for main nodes */}
                    {index > 0 && depth === 0 && (
                      <div className="flex flex-col items-center justify-center my-1.5">
                        <div className="h-4 w-0.5 bg-slate-200 relative flex items-center justify-center">
                          <ChevronRight className="w-2.5 h-2.5 text-slate-300 rotate-90" />
                        </div>
                      </div>
                    )}
                    <div
                      className={`rounded-xl border transition-all overflow-hidden ${
                        isExpanded
                          ? "bg-white border-primary/20 shadow-sm"
                          : depth > 0
                            ? "bg-primary/5 hover:bg-primary/10 border-primary/10"
                            : "bg-slate-50/50 hover:bg-white hover:border-slate-300 border-slate-200"
                      }`}
                    >
                      {/* Node Header */}
                      <div
                        onClick={() => toggleNode(node.nodeId)}
                        className="flex items-center justify-between p-3.5 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className={`p-0.5 rounded transition-transform duration-200 shrink-0 ${isExpanded ? "rotate-90" : ""}`}>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`font-semibold text-xs ${node.status === "LOCKED" ? "text-slate-400" : "text-slate-800"}`}>
                                {colNodeLabels[node.nodeId]}: {stripLessonPrefix(node.title)}
                              </span>
                              <Badge variant="outline" className="text-[9px] py-0.2 px-1 hover:bg-transparent font-semibold bg-primary/10 text-primary border-primary/20">
                                {node.nodeType === "ON_CLASS" ? "On Class" : "At Home"}
                              </Badge>
                              {node.isRequired && (
                                <Badge variant="outline" className="text-[9px] py-0.2 px-1 hover:bg-transparent font-semibold bg-red-50 text-red-600 border-red-100">
                                  Bắt buộc
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-[10px] font-semibold text-slate-400 select-none">
                          {node.status}
                        </div>
                      </div>

                      {/* Node Expanded Content */}
                      {isExpanded && (
                        <div className="px-3.5 pb-3.5 pt-1.5 bg-slate-50/30 border-t border-slate-100 space-y-3">
                          <p className="text-xs text-slate-500 leading-relaxed">
                            {node.description || "Chưa có mô tả chi tiết."}
                          </p>

                          {/* Materials & Tests list */}
                          <div className="border border-slate-200/80 rounded-lg p-2.5 bg-white space-y-2">
                            <div className="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                              <BookOpen className="w-3 h-3 text-primary" />
                              Nội dung học tập
                            </div>

                            {isLoadingContent ? (
                              <div className="flex items-center gap-1.5 py-2 text-[11px] text-slate-400 justify-center">
                                <Loader className="w-3.5 h-3.5 animate-spin" />
                                Đang tải tài liệu...
                              </div>
                            ) : sortedItems.length === 0 ? (
                              <div className="text-[10px] text-slate-400 italic py-2 text-center bg-slate-50/50 rounded border border-dashed border-slate-100">
                                Chưa có tài liệu hoặc bài test.
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                {sortedItems.map((item) => {
                                  const isMaterial = item.type === "MATERIAL";
                                  const m = isMaterial ? item.data : null;
                                  const t = !isMaterial ? item.data : null;

                                  return (
                                    <div
                                      key={item.key}
                                      className="flex items-center gap-2 p-2 bg-slate-50/50 hover:bg-slate-50 rounded-lg border border-slate-100 text-[11px] transition-colors"
                                    >
                                      {isMaterial ? (
                                        <>
                                          {m?.video ? (
                                            <Film className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                                          ) : (
                                            <FileText className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                          )}
                                          <div className="flex-1 min-w-0">
                                            <span className="font-semibold text-slate-700 truncate block" title={item.title}>
                                              {item.title}
                                            </span>
                                            {m?.video && (
                                              <a
                                                href={m.video.videoUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-[9px] text-primary hover:underline block truncate mt-0.5"
                                              >
                                                Xem video youtube
                                              </a>
                                            )}
                                            {m?.file && (
                                              <span className="text-[9px] text-slate-400 block truncate mt-0.5">
                                                Tài liệu đính kèm
                                              </span>
                                            )}
                                          </div>
                                        </>
                                      ) : (
                                        <>
                                          <Award className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                          <div className="flex-1 min-w-0">
                                            <span className="font-semibold text-slate-700 truncate block" title={item.title}>
                                              {item.title}
                                            </span>
                                            <span className="text-[9px] text-slate-400 block mt-0.5">
                                              {t?.durationMinutes || 0} phút · Yêu cầu đạt: {t?.passingPercentage || 80}%
                                            </span>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
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
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-primary" />
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

  const isNonIdle = actionState !== 'idle';

  return (
    <div className={`space-y-6 ${isNonIdle ? 'pointer-events-none opacity-60' : ''}`} aria-busy={isNonIdle}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)} disabled={isNonIdle}>
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
            Class {classInfo.classCode} - {classInfo.courseCode}
            {(() => {
              switch (classroomStatus) {
                case 'active':
                  return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Đang hoạt động</Badge>;
                case 'completed':
                  return <Badge className="bg-primary/10 text-primary border-primary/20">Đã hoàn thành</Badge>;
                default:
                  return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Chưa bắt đầu</Badge>;
              }
            })()}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {classroomStatus === 'inactive' && (
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl flex items-center gap-1.5"
              onClick={() => handleUpdateStatus('active')}
              disabled={isNonIdle}
            >
              Bắt đầu lớp học
            </Button>
          )}
          {/* "Kết thúc lớp học" chỉ dành cho admin — đã bỏ ở giao diện giáo viên. */}
          {graphData?.state === 'DRAFT' && (
            <Button
              className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl flex items-center gap-1.5"
              onClick={() => setShowPublishConfirm(true)}
              disabled={isNonIdle}
            >
              <Play className="size-4" />
              Publish lộ trình
            </Button>
          )}
          {graphData?.state === 'PUBLISHED' && (
            <Button
              variant="outline"
              className="text-amber-700 hover:text-amber-800 hover:bg-amber-50 border-amber-200 font-semibold rounded-xl flex items-center gap-1.5"
              onClick={() => setShowUnpublishConfirm(true)}
              disabled={isNonIdle}
            >
              <Undo2 className="size-4" />
              Unpublish lộ trình
            </Button>
          )}
        </div>
      </div>

      {/* Hero pub/unpub state zones */}
      {graphData?.state === 'NO_PATH' && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <h2 className="text-lg font-semibold text-primary">
                {graphData.canCloneAll ? "Khởi tạo lộ trình học cho lớp" : "Môn học chưa có lộ trình mẫu"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {graphData.canCloneAll
                  ? "Lớp học này chưa cấu hình lộ trình. Vui lòng bấm nút Khởi tạo để sao chép lộ trình học mẫu từ khoa."
                  : "Môn học này chưa được cấu hình lộ trình mẫu công bố từ khoa."}
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto shrink-0 flex-wrap">
              {graphData.canCloneAll ? (
                <Button
                  onClick={handleClone}
                  disabled={isNonIdle}
                  className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white font-medium rounded-xl"
                >
                  {actionState === 'cloning' ? <Loader className="size-4 animate-spin mr-1" /> : <Play className="size-4 mr-1" />}
                  Khởi tạo lộ trình học
                </Button>
              ) : (
                <div className="text-sm text-red-600 bg-red-50 py-2 px-3 rounded-md border border-red-100">
                  Lộ trình mẫu chưa sẵn sàng hoặc chưa được xuất bản. Liên hệ admin.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}



      {graphData?.state === 'PUBLISHED' && (
        <Card className="border-emerald-100 bg-emerald-50/10" role="alert">
          <CardContent className="pt-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-950 font-semibold">
                <CheckCircle2 className="size-5 text-emerald-600" />
                <span>Đã publish lúc {graphData.publishedAt ? new Date(graphData.publishedAt).toLocaleString() : ''}</span>
              </div>
              <p className="text-sm text-muted-foreground">Lộ trình học đã được mở cho học sinh. Mọi tiến độ học tập đang được ghi nhận.</p>
              <div className="text-xs text-muted-foreground font-semibold mt-1">
                Tiến độ: 0/{students.length} học sinh đã bắt đầu
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('roadmap')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'roadmap'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          Lộ trình học tập
        </button>
        <button
          onClick={() => setActiveTab('placement')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'placement'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          Đánh giá & Phân loại
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'students'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          Danh sách học sinh ({students.length})
        </button>
        <button
          onClick={() => setActiveTab('support')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'support'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          Trợ giảng & Hỏi đáp
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'roadmap' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pl-1">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Map className="w-5 h-5 text-primary" />
              Sơ đồ lộ trình học tập
            </h2>
            {graphData?.state !== 'NO_PATH' && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs text-primary border-primary/20 hover:bg-primary/5 rounded-xl"
                onClick={() => navigate(`/teacher/classroom-subjects/${classroomSubjectId}/manage`)}
                disabled={isNonIdle}
              >
                <Settings className="size-3.5 mr-1" />
                Chỉnh sửa Lộ trình
              </Button>
            )}
          </div>

          {/* Ô chọn & áp dụng lộ trình mẫu (clone). Hiện khi lớp chưa có lộ trình hoặc còn bản nháp. */}
          {(graphData?.state === 'NO_PATH' || graphData?.state === 'DRAFT') && (graphData?.availableTemplates?.length ?? 0) > 0 && (
            <Card className="border border-primary/20 bg-primary/5 rounded-2xl">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex-1 space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                    <BookOpen className="size-3.5" /> Chọn lộ trình mẫu để áp dụng
                  </label>
                  <select
                    value={selectedTemplateId ?? ''}
                    onChange={(e) => handlePreviewTemplate(e.target.value ? Number(e.target.value) : null)}
                    disabled={isNonIdle}
                    className="w-full max-w-md rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">-- Chọn lộ trình mẫu để xem trước --</option>
                    {graphData?.availableTemplates?.map((t) => (
                      <option key={t.pathId} value={t.pathId}>
                        {t.pathName} ({t.nodeCount} bài học)
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500">
                    {graphData?.state === 'DRAFT'
                      ? 'Chọn để xem trước; áp dụng sẽ ghi đè lộ trình nháp hiện tại (kèm mọi chỉnh sửa).'
                      : 'Chọn để xem trước sơ đồ, sau đó áp dụng để tạo lộ trình cho lớp.'}
                  </p>
                </div>
                <Button
                  onClick={() => (graphData?.state === 'DRAFT' ? setShowApplyTemplateConfirm(true) : handleApplyTemplate())}
                  disabled={isNonIdle || !selectedTemplateId}
                  className="shrink-0 rounded-xl bg-primary font-semibold text-white hover:bg-primary/90"
                >
                  {actionState === 'cloning' ? <Loader className="mr-1.5 size-4 animate-spin" /> : <Play className="mr-1.5 size-4" />}
                  {graphData?.state === 'DRAFT' ? 'Áp dụng lộ trình' : 'Áp dụng lộ trình'}
                </Button>
              </CardContent>
            </Card>
          )}

          {(!graphData?.paths || graphData.paths.length === 0) && graphData?.state === 'NO_PATH' && !templatePreview ? (
            <Card className="border border-dashed border-slate-200 bg-white p-12 text-center rounded-2xl">
              <Map className="w-12 h-12 mx-auto text-slate-300 mb-3 animate-pulse" />
              <h3 className="text-base font-bold text-slate-800 mb-1">Chưa cấu hình lộ trình</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Lớp học này chưa khởi tạo lộ trình học tập. Hãy nhấp nút "Khởi tạo lộ trình" ở trên để bắt đầu.
              </p>
            </Card>
          ) : (
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
              <div className="space-y-2 lg:w-[600px] lg:shrink-0">
                {templatePreview && (
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Eye className="size-3.5" /> Đang xem trước lộ trình mẫu — chưa áp dụng.
                    </span>
                    <button onClick={() => handlePreviewTemplate(null)} className="font-semibold text-amber-700 hover:underline">
                      Bỏ xem trước
                    </button>
                  </div>
                )}
                <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-200 bg-slate-50/40 p-3 lg:max-h-[calc(100vh-2rem)]">
                  {previewLoading ? (
                    <div className="flex h-64 items-center justify-center text-slate-400">
                      <Loader className="size-6 animate-spin" />
                    </div>
                  ) : (
                    <LearningPathFlow
                      nodes={templatePreview ? templatePreview.nodes : (graphData?.nodes || [])}
                      edges={templatePreview ? templatePreview.edges : (graphData?.edges || [])}
                      selectedNodeId={templatePreview ? null : (selectedNode?.nodeId || null)}
                      onNodeClick={templatePreview ? undefined : ((node) => handleNodeClick(node))}
                    />
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                {!selectedNode ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white border border-slate-250 rounded-2xl p-6">
                    <Map className="w-10 h-10 text-slate-300 mb-2 animate-bounce" />
                    <p className="text-xs font-semibold">Chọn bài học trên sơ đồ</p>
                    <p className="text-[10px] text-slate-400">để xem thông tin chi tiết</p>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5 shadow-xs h-fit max-h-[70vh] overflow-auto flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div>
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-semibold uppercase">
                            {selectedNode.nodeType === 'ON_CLASS' ? 'Trên lớp' : 'Tự học'}
                          </span>
                          <h3 className="font-bold text-slate-800 text-sm mt-1">{selectedNode.title}</h3>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setSelectedNode(null)}>
                          <X className="size-4" />
                        </Button>
                      </div>

                      {loadingNodeDetails ? (
                        <div className="flex items-center justify-center py-10">
                          <Loader className="w-6 h-6 animate-spin text-indigo-600" />
                        </div>
                      ) : (
                        <>
                          {/* Student list above materials */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Danh sách sinh viên ({nodeStudents.length})</h4>
                            {nodeStudents.length === 0 ? (
                              <p className="text-xs text-slate-400 italic">Chưa có sinh viên nào học node này.</p>
                            ) : (
                              <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                                {nodeStudents.map((student) => (
                                  <div key={student.userId} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 border border-slate-100/50">
                                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-semibold text-slate-600 uppercase">
                                      {student.avatarUrl ? (
                                        <img src={student.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                      ) : (
                                        student.lastName?.charAt(0) || student.firstName?.charAt(0) || 'S'
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0 text-xs">
                                      <p className="font-semibold text-slate-700 truncate">
                                        {student.lastName} {student.firstName}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Materials */}
                          <div className="space-y-2 pt-2 border-t border-slate-100">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tài liệu học tập</h4>
                            {!nodeContent || (!nodeContent.materials?.length && !nodeContent.tests?.length) ? (
                              <p className="text-xs text-slate-400 italic">Node này chưa có tài liệu hay bài kiểm tra nào.</p>
                            ) : (
                              <div className="space-y-2">
                                {nodeContent.materials?.map((m) => (
                                  <div key={m.materialId} className="rounded-lg border border-slate-100 bg-slate-50/50 p-2 text-xs">
                                    <div className="flex items-center gap-2">
                                      <div className="shrink-0 text-indigo-600">
                                        <FileText className="h-4 w-4" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="truncate font-medium text-slate-700">{m.title}</p>
                                      </div>
                                    </div>
                                    <div className="mt-1.5 max-w-2xl">
                                      <MaterialPreview material={m} />
                                    </div>
                                  </div>
                                ))}
                                {nodeContent.tests?.map((t) => (
                                  <div key={t.testId} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50/50 border border-slate-100 text-xs">
                                    <div className="text-amber-600 shrink-0">
                                      <Award className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-slate-700 truncate">{t.title} ({t.durationMinutes} phút)</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Xác nhận ghi đè template lên bản nháp hiện tại */}
      <Dialog open={showApplyTemplateConfirm} onOpenChange={(o) => { if (!o) setShowApplyTemplateConfirm(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="size-5 shrink-0" />
              <span>Ghi đè lộ trình nháp?</span>
            </DialogTitle>
            <DialogDescription>
              Lộ trình nháp hiện tại của lớp (kèm mọi tài liệu/bài kiểm tra đã thêm) sẽ bị xóa và thay bằng lộ trình mẫu đã chọn.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowApplyTemplateConfirm(false)}>
              Hủy
            </Button>
            <Button
              className="rounded-xl bg-amber-600 font-semibold text-white hover:bg-amber-700"
              onClick={handleApplyTemplate}
              disabled={isNonIdle}
            >
              {actionState === 'cloning' ? <Loader className="mr-1.5 size-4 animate-spin" /> : null}
              Ghi đè & áp dụng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {activeTab === 'placement' && (
        <div className="space-y-6">
          {loadingPlacement ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !placementQuiz ? (
            <Card className="border border-slate-200 shadow-xs rounded-2xl p-8 text-center bg-white">
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-850 mb-1">Chưa cấu hình bài test phân loại đầu vào</h3>
              <p className="text-sm text-slate-500 max-w-lg mx-auto mb-6 leading-relaxed">
                Học sinh khi tham gia lớp học này sẽ bắt đầu ở trạng thái chờ phân loại.
                Bạn cần khởi tạo bài thi đầu vào trắc nghiệm để hệ thống tự động gán lộ trình Yếu, Trung bình hoặc Khá cho học sinh.
              </p>
              <Button
                onClick={() => {
                  setQuizTitle('Bài kiểm tra phân loại đầu vào');
                  setQuizDescription('Vui lòng làm bài test trắc nghiệm này để hệ thống đánh giá năng lực và gán lộ trình học phù hợp.');
                  setQuizDuration('45');
                  setIsCreateQuizOpen(true);
                }}
                className="bg-primary hover:bg-primary/90 text-white rounded-xl"
              >
                <Plus className="size-4 mr-1.5" /> Khởi tạo bài test đầu vào
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
              {/* Left Column: Quiz Info & Score Bands */}
              <div className="lg:col-span-1 space-y-6">
                {/* General Info Card */}
                <Card className="border border-slate-200 shadow-xs rounded-2xl bg-white">
                  <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold text-slate-850 flex items-center gap-1.5">
                      <FileText className="size-4 text-primary" /> Thông tin bài test
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsCreateQuizOpen(true)}
                      className="h-7 text-xs text-primary hover:bg-primary/5 rounded-lg font-semibold"
                    >
                      Chỉnh sửa
                    </Button>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3.5 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-0.5">Tiêu đề bài test</span>
                      <span className="font-semibold text-slate-800 block text-[13px]">{placementQuiz.title}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Mô tả chi tiết</span>
                      <span className="text-slate-650 block leading-relaxed">{placementQuiz.description || 'Không có mô tả.'}</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200/50">
                      <span className="font-medium text-slate-650">Thời gian làm bài:</span>
                      <span className="font-bold text-slate-800">{placementQuiz.durationMinutes} phút</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Score Bands Card */}
                <Card className="border border-slate-200 shadow-xs rounded-2xl bg-white">
                  <CardHeader className="border-b border-slate-100 pb-3 flex items-center justify-between flex-row">
                    <CardTitle className="text-sm font-bold text-slate-855 flex items-center gap-1.5">
                      <Award className="size-4 text-primary" /> Cấu hình khoảng điểm (%)
                    </CardTitle>
                    {scoreBands.length === 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleInitializeDefaultBands}
                        className="text-[10px] py-1 px-2 h-7 rounded-lg text-primary border-primary/20"
                      >
                        Khởi tạo mẫu
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    {scoreBands.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 italic text-xs">
                        Chưa cấu hình khoảng điểm phân loại.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {scoreBands.map((band, idx) => {
                          const levelLabel = band.targetLevel === 1 ? 'Lộ trình Yếu (L1)' : band.targetLevel === 2 ? 'Lộ trình T.Bình (L2)' : 'Lộ trình Khá (L3)';
                          const levelBadgeBg = band.targetLevel === 1 ? 'bg-rose-50 border-rose-200 text-rose-700' : band.targetLevel === 2 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700';

                          return (
                            <div key={idx} className="flex items-center gap-2.5 p-3 border border-slate-100 bg-slate-50/30 rounded-xl">
                              <Badge className={`text-[10px] shrink-0 font-bold border rounded-[6px] ${levelBadgeBg}`} variant="outline">
                                {levelLabel}
                              </Badge>
                              <div className="flex items-center gap-1.5 ml-auto text-xs">
                                <span className="text-slate-400 font-medium">Từ</span>
                                <input
                                  type="number"
                                  className="w-12 border border-slate-200 rounded-[6px] px-1.5 py-1 text-center font-bold text-slate-800 bg-white"
                                  value={band.minScore}
                                  onChange={(e) => {
                                    const updated = [...scoreBands];
                                    updated[idx].minScore = e.target.value ? Number(e.target.value) : 0;
                                    setScoreBands(updated);
                                  }}
                                />
                                <span className="text-slate-400 font-medium">đến</span>
                                <input
                                  type="number"
                                  className="w-12 border border-slate-200 rounded-[6px] px-1.5 py-1 text-center font-bold text-slate-800 bg-white"
                                  value={band.maxScore}
                                  onChange={(e) => {
                                    const updated = [...scoreBands];
                                    updated[idx].maxScore = e.target.value ? Number(e.target.value) : 100;
                                    setScoreBands(updated);
                                  }}
                                />
                                <span className="text-slate-400 font-bold">%</span>
                              </div>
                            </div>
                          );
                        })}
                        <Button
                          onClick={handleSaveScoreBands}
                          disabled={savingBands}
                          className="w-full bg-[#030213] hover:bg-slate-900 text-white rounded-xl text-xs font-semibold mt-2 h-9"
                        >
                          {savingBands ? <Loader className="size-4 animate-spin mr-1.5" /> : null}
                          Lưu khoảng điểm
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Question Library */}
              <div className="lg:col-span-2">
                <Card className="border border-slate-200 shadow-xs rounded-2xl bg-white h-full flex flex-col justify-between">
                  <div>
                    <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
                      <CardTitle className="text-sm font-bold text-slate-855 flex items-center gap-1.5">
                        <BookOpen className="size-4 text-primary" /> Ngân hàng câu hỏi ({questions.length})
                      </CardTitle>
                      <Button
                        size="sm"
                        onClick={() => handleOpenQuestionModal(null)}
                        className="h-7 text-xs bg-primary hover:bg-primary/90 text-white rounded-lg flex items-center gap-1 font-semibold"
                      >
                        <Plus className="size-3.5" /> Thêm câu hỏi
                      </Button>
                    </CardHeader>
                    <CardContent className="pt-4">
                      {loadingQuestions ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader className="w-6 h-6 animate-spin text-primary" />
                        </div>
                      ) : questions.length === 0 ? (
                        <div className="text-center py-16 text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                          <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs">Chưa có câu hỏi nào trong bài test phân loại.</p>
                          <p className="text-[10px] text-slate-400/80 mt-1">Nhấp nút "Thêm câu hỏi" để bắt đầu soạn đề bài.</p>
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                          {questions.map((q, idx) => (
                            <div key={q.questionId} className="p-3.5 border border-slate-200 bg-slate-50/40 rounded-xl text-xs space-y-2.5">
                              <div className="flex items-start justify-between gap-3">
                                <span className="font-semibold text-slate-800 leading-relaxed flex-1">
                                  Câu {idx + 1}: {q.questionContent}
                                </span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleOpenQuestionModal(q)}
                                    className="h-7 w-7 text-slate-550 hover:text-slate-850 hover:bg-slate-100 rounded-lg"
                                  >
                                    <Settings className="size-3.5" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleDeleteQuestion(q.questionId)}
                                    className="h-7 w-7 text-red-650 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-1">
                                {q.answers.map((a: any, aIdx: number) => (
                                  <div
                                    key={a.answerId}
                                    className={`p-2 rounded-lg border text-[11px] flex items-center justify-between ${
                                      a.isCorrect
                                        ? 'bg-emerald-50 border-emerald-250 text-emerald-800 font-medium'
                                        : 'bg-white border-slate-200 text-slate-650'
                                    }`}
                                  >
                                    <span className="truncate pr-2">{String.fromCharCode(65 + aIdx)}. {a.answerContent}</span>
                                    {a.isCorrect && <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'students' && (
        <Card className="border border-slate-200 shadow-xs rounded-2xl">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Danh sách học sinh trong lớp ({students.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50 border-slate-100">
                  <TableHead className="font-bold text-slate-700 w-[12%]">Mã học sinh</TableHead>
                  <TableHead className="font-bold text-slate-700 w-[20%]">Họ và tên</TableHead>
                  <TableHead className="font-bold text-slate-700 w-[18%]">Phân loại năng lực</TableHead>
                  <TableHead className="font-bold text-slate-700 w-[25%]">Lộ trình học tập</TableHead>
                  <TableHead className="font-bold text-slate-700 w-[25%] text-center">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-400 italic">
                      Chưa có học sinh nào tham gia lớp học này.
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => {
                    const levelLabel = student.currentLevel === 1 ? 'Yếu' : student.currentLevel === 2 ? 'Trung bình' : student.currentLevel === 3 ? 'Khá' : 'Chưa phân loại';
                    const levelColor = student.currentLevel === 1
                      ? 'bg-rose-50 border-rose-200 text-rose-700'
                      : student.currentLevel === 2
                        ? 'bg-amber-50 border-amber-200 text-amber-700'
                        : student.currentLevel === 3
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-slate-50 border-slate-200 text-slate-500';

                    return (
                      <TableRow key={student.id} className="border-slate-100 hover:bg-slate-50/50">
                        <TableCell className="font-semibold text-slate-650">{student.id}</TableCell>
                        <TableCell className="font-medium text-slate-700">
                          {student.fullName}
                          {student.isSubmentor && (
                            <Badge className="bg-emerald-50 border-emerald-200 text-emerald-800 text-[9px] font-bold ml-1.5 rounded-[6px] outline-none select-none">
                              TRỢ GIẢNG
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] font-bold border rounded-[6px] px-2 py-0.5 ${levelColor}`}>
                            {levelLabel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-650 font-medium text-xs">
                          {student.assignedPathName || (
                            <span className="text-slate-400 italic text-[11px]">Chưa gán lộ trình</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetail(student)}
                              className="h-7 text-xs text-primary hover:bg-primary/5 rounded-lg font-semibold flex items-center gap-1"
                            >
                              <Eye className="size-3.5" /> Chi tiết
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewHistory(student)}
                              className="h-7 text-xs text-primary hover:bg-primary/5 rounded-lg font-semibold flex items-center gap-1"
                            >
                              <History className="size-3.5" /> Lịch sử xếp lớp
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleSubMentor(student)}
                              className={`h-7 text-xs rounded-lg font-semibold flex items-center gap-1 ${
                                student.isSubmentor
                                  ? 'text-rose-600 hover:bg-rose-50'
                                  : 'text-emerald-650 hover:bg-emerald-50'
                              }`}
                            >
                              {student.isSubmentor ? (
                                <>
                                  <UserMinus className="size-3.5" /> Hủy trợ giảng
                                </>
                              ) : (
                                <>
                                  <UserCheck className="size-3.5" /> Gán trợ giảng
                                </>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dialog: Create/Update Placement Quiz */}
      <Dialog open={isCreateQuizOpen} onOpenChange={setIsCreateQuizOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateOrUpdateQuiz}>
            <DialogHeader>
              <DialogTitle>{placementQuiz ? 'Cập nhật bài test đầu vào' : 'Khởi tạo bài test đầu vào'}</DialogTitle>
              <DialogDescription>
                Nhập thông tin chung của bài thi phân loại học sinh.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Tiêu đề bài test *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Bài kiểm tra đánh giá năng lực đầu vào"
                  className="w-full border border-slate-300/50 rounded-[6px] px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800 animate-in fade-in"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Mô tả bài test</label>
                <textarea
                  placeholder="Nhập hướng dẫn làm bài cho học sinh..."
                  rows={3}
                  className="w-full border border-slate-300/50 rounded-[6px] px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800 bg-white"
                  value={quizDescription}
                  onChange={(e) => setQuizDescription(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Thời lượng làm bài (phút) *</label>
                <input
                  type="number"
                  required
                  min={10}
                  max={180}
                  className="w-full border border-slate-300/50 rounded-[6px] px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800 bg-white"
                  value={quizDuration}
                  onChange={(e) => setQuizDuration(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="sm:justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateQuizOpen(false)} disabled={submittingQuiz}>
                Hủy
              </Button>
              <Button type="submit" disabled={submittingQuiz} className="bg-primary hover:bg-primary/90 text-white font-semibold">
                {submittingQuiz ? <Loader className="size-4 animate-spin mr-1.5" /> : null}
                Lưu lại
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Add/Edit Question */}
      <Dialog open={isQuestionModalOpen} onOpenChange={setIsQuestionModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <form onSubmit={handleQuestionSubmit}>
            <DialogHeader>
              <DialogTitle>{editingQuestion ? 'Cập nhật câu hỏi' : 'Thêm câu hỏi mới'}</DialogTitle>
              <DialogDescription>
                Soạn câu hỏi trắc nghiệm và đánh dấu đáp án đúng.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nội dung câu hỏi *</label>
                <textarea
                  required
                  placeholder="Ví dụ: Đâu là một Hook cơ bản trong React?"
                  rows={2}
                  className="w-full border border-slate-300/50 rounded-[6px] px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800 bg-white"
                  value={questionContent}
                  onChange={(e) => setQuestionContent(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Loại câu hỏi</label>
                <select
                  className="w-full border border-slate-300/50 rounded-[6px] px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800 bg-white"
                  value={questionType}
                  onChange={(e) => {
                    const newType = e.target.value as any;
                    setQuestionType(newType);
                    if (newType === 'ESSAY') {
                      setAnswers([{ answerContent: '', isCorrect: true }]);
                    } else {
                      setAnswers([
                        { answerContent: '', isCorrect: false },
                        { answerContent: '', isCorrect: false },
                        { answerContent: '', isCorrect: false },
                        { answerContent: '', isCorrect: false }
                      ]);
                    }
                  }}
                >
                  <option value="SINGLE">Một đáp án đúng (Single Choice)</option>
                  <option value="MULTIPLE">Nhiều đáp án đúng (Multiple Choice)</option>
                  <option value="ESSAY">Tự luận (Essay)</option>
                </select>
              </div>

              {questionType === 'ESSAY' ? (
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-755 block">Câu trả lời mẫu / Hướng dẫn chấm *</label>
                  <textarea
                    required
                    placeholder="Nhập câu trả lời mẫu cho tự luận..."
                    rows={4}
                    className="w-full border border-slate-300/50 rounded-[6px] px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800 bg-white"
                    value={answers[0]?.answerContent || ''}
                    onChange={(e) => {
                      const updated = [{ answerContent: e.target.value, isCorrect: true }];
                      setAnswers(updated);
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-750">
                    <label>Danh sách đáp án (Nhập tối thiểu 2 đáp án, tích chọn ô đúng) *</label>
                    <button
                      type="button"
                      onClick={() => setAnswers(prev => [...prev, { answerContent: '', isCorrect: false }])}
                      className="text-indigo-600 hover:underline text-[11px]"
                    >
                      + Thêm đáp án
                    </button>
                  </div>
                  <div className="space-y-2">
                    {answers.map((answer, aIdx) => (
                      <div key={aIdx} className="flex items-center gap-2">
                        <span className="font-bold text-slate-400 shrink-0 w-4">{String.fromCharCode(65 + aIdx)}</span>
                        <input
                          type="text"
                          placeholder={`Nhập đáp án ${String.fromCharCode(65 + aIdx)}...`}
                          className="flex-1 border border-slate-300/50 rounded-[6px] px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800 bg-white"
                          value={answer.answerContent}
                          onChange={(e) => {
                            const updated = [...answers];
                            updated[aIdx].answerContent = e.target.value;
                            setAnswers(updated);
                          }}
                        />
                        <input
                          type={questionType === 'SINGLE' ? 'radio' : 'checkbox'}
                          name="correct-answer"
                          className="h-4 w-4 text-primary shrink-0 cursor-pointer"
                          checked={answer.isCorrect}
                          onChange={(e) => {
                            const updated = [...answers];
                            if (questionType === 'SINGLE') {
                              updated.forEach((ans, i) => {
                                ans.isCorrect = i === aIdx;
                              });
                            } else {
                              updated[aIdx].isCorrect = e.target.checked;
                            }
                            setAnswers(updated);
                          }}
                        />
                        {answers.length > 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...answers];
                              updated.splice(aIdx, 1);
                              setAnswers(updated);
                            }}
                            className="text-red-500 hover:text-red-700 text-base px-1.5 font-bold"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="sm:justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsQuestionModalOpen(false)} disabled={submittingQuestion}>
                Hủy
              </Button>
              <Button type="submit" disabled={submittingQuestion} className="bg-primary hover:bg-primary/90 text-white font-semibold">
                {submittingQuestion ? <Loader className="size-4 animate-spin mr-1.5" /> : null}
                Lưu lại
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
            <p className="text-sm text-gray-600 leading-relaxed">
              Lộ trình sẽ mở khóa các bài học đầu tiên (entry nodes) cho <strong>{students.length} học sinh</strong> đang enroll trong lớp học này.
            </p>
            <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-md border border-amber-100">
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
            <p className="text-sm text-gray-600 leading-relaxed font-medium">
              Toàn bộ tiến độ học tập và ghi nhận bài học hiện tại của học sinh sẽ bị xóa sạch khỏi hệ thống.
            </p>
            <p className="text-sm text-red-700 bg-red-50 p-3 rounded-md border border-red-100">
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
          <div className="py-2 text-sm text-gray-600 leading-relaxed">
            {unpublishErrorMsg || 'Đã có học sinh hoàn thành node, không thể unpublish.'}
          </div>
          <DialogFooter className="sm:justify-end">
            <Button onClick={() => setShowUnpublishError(false)}>
              Đồng ý
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Level History Modal */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Lịch sử xếp lớp học sinh</DialogTitle>
            <DialogDescription>
              Xem nhật ký phân loại học lực và đổi nhánh lộ trình của <span className="font-bold text-slate-800">{selectedStudentName}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-xs">
            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : levelHistory.length === 0 ? (
              <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs">Chưa có lịch sử thay đổi mức năng lực.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                {levelHistory.map((hist, idx) => {
                  const getLvlLabel = (l: number) => l === 1 ? 'Yếu' : l === 2 ? 'Trung bình' : l === 3 ? 'Khá' : 'N/A';
                  const getReasonLabel = (r: string) => {
                    if (r === 'PLACEMENT') return 'Bài thi phân loại đầu vào';
                    if (r === 'GATE') return 'Cổng kiểm tra chuyển mức';
                    if (r === 'RETAKE') return 'Thi lại / Đánh giá lại';
                    return r || 'Khác';
                  };

                  return (
                    <div key={hist.id || idx} className="flex gap-4 items-start p-3 border border-slate-100 bg-slate-50/30 rounded-xl">
                      <div className="flex flex-col items-center justify-center bg-primary/5 text-primary p-2 rounded-lg font-bold shrink-0 min-w-10 text-center">
                        <span className="text-[10px] text-slate-400 block uppercase font-medium">Mức mới</span>
                        <span className="text-sm font-extrabold text-primary">{getLvlLabel(hist.newLevel)}</span>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800">Lý do: {getReasonLabel(hist.reason)}</span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(hist.changedAt).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        <p className="text-slate-500 leading-relaxed text-[11px]">
                          Chuyển từ mức <span className="font-semibold text-slate-700">{hist.oldLevel ? getLvlLabel(hist.oldLevel) : 'Chưa xếp lớp'}</span> sang mức <span className="font-semibold text-slate-700">{getLvlLabel(hist.newLevel)}</span>.
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter className="sm:justify-end">
            <Button type="button" onClick={() => setIsHistoryOpen(false)} className="bg-primary hover:bg-primary/90 text-white font-semibold">
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Details & History Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
              <User className="size-5 text-primary" /> Thông tin chi tiết học sinh
            </DialogTitle>
            <DialogDescription>
              Xem hồ sơ học tập và lộ trình của học sinh trong lớp học.
            </DialogDescription>
          </DialogHeader>

          {selectedStudent && (
            <div className="py-4 space-y-4">
              {/* Profile Card Header */}
              <div className="flex items-center gap-4 bg-slate-50/50 p-4 border border-slate-100 rounded-2xl">
                <div className="size-12 bg-primary/5 text-primary rounded-full flex items-center justify-center font-extrabold text-lg border border-primary/10">
                  {selectedStudent.fullName.split(' ').pop()?.charAt(0).toUpperCase() || 'S'}
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="font-bold text-slate-800 text-sm leading-none">{selectedStudent.fullName}</h4>
                  <div className="flex items-center gap-4 text-slate-500 text-xs mt-1">
                    <span className="flex items-center gap-1 font-medium">
                      <span className="font-bold text-slate-400">Mã HS:</span> {selectedStudent.id}
                    </span>
                    {selectedStudent.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="size-3 text-slate-400" /> {selectedStudent.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabs selector */}
              <div className="flex border-b border-slate-100 gap-4 text-xs font-semibold text-slate-500">
                <button
                  type="button"
                  onClick={() => setDetailTab('info')}
                  className={`pb-2 px-1 relative transition-colors ${
                    detailTab === 'info' ? 'text-primary border-b-2 border-primary' : 'hover:text-slate-700'
                  }`}
                >
                  Học lực & Lộ trình
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('history')}
                  className={`pb-2 px-1 relative transition-colors ${
                    detailTab === 'history' ? 'text-primary border-b-2 border-primary' : 'hover:text-slate-700'
                  }`}
                >
                  Lịch sử xếp lớp
                </button>
              </div>

              {/* Tab Contents */}
              <div className="min-h-[220px]">
                {detailTab === 'info' && (
                  <div className="space-y-4 pt-1">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Left Block */}
                      <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/20 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Phân loại học lực</span>
                        <div className="pt-1">
                          {(() => {
                            const label = selectedStudent.currentLevel === 1 ? 'Yếu' : selectedStudent.currentLevel === 2 ? 'Trung bình' : selectedStudent.currentLevel === 3 ? 'Khá' : 'Chưa phân loại';
                            const badgeColor = selectedStudent.currentLevel === 1
                              ? 'bg-rose-50 border-rose-200 text-rose-700'
                              : selectedStudent.currentLevel === 2
                                ? 'bg-amber-50 border-amber-200 text-amber-700'
                                : selectedStudent.currentLevel === 3
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                  : 'bg-slate-50 border-slate-200 text-slate-500';
                            return (
                              <Badge variant="outline" className={`text-xs font-bold border rounded-[6px] px-2 py-0.5 ${badgeColor}`}>
                                {label}
                              </Badge>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Right Block */}
                      <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/20 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Lộ trình học tập</span>
                        <div className="pt-1 font-semibold text-slate-700 text-xs">
                          {selectedStudent.assignedPathName || (
                            <span className="text-slate-400 italic font-normal">Chưa gán lộ trình</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Progress details */}
                    <div className="p-4 border border-slate-100 rounded-xl bg-slate-50/10 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <TrendingUp className="size-4 text-primary" /> Tiến độ lộ trình
                        </span>
                        <span className="font-semibold text-primary">0%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-primary h-full rounded-full transition-all duration-300" style={{ width: '0%' }} />
                      </div>
                      <p className="text-[10.5px] text-slate-500 leading-relaxed">
                        Học sinh đang học theo nhánh riêng biệt của mức năng lực <span className="font-semibold">{selectedStudent.currentLevel === 1 ? 'Yếu' : selectedStudent.currentLevel === 2 ? 'Trung bình' : selectedStudent.currentLevel === 3 ? 'Khá' : 'Chưa phân loại'}</span>. Tiến độ sẽ tự động tăng khi học sinh làm bài test cổng phụ hoặc hoàn thành bài học.
                      </p>
                    </div>
                    {selectedStudent.currentLevel != null && (
                      <div className="pt-2">
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => handleResetPlacement(selectedStudent.rawUserId)}
                          disabled={resettingPlacement}
                          className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all"
                        >
                          {resettingPlacement ? <Loader className="size-3.5 animate-spin" /> : <Undo2 className="size-3.5" />}
                          Hủy kết quả phân lớp & Cho phép thi lại
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {detailTab === 'history' && (
                  <div className="space-y-4 pt-1 text-xs">
                    {historyLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    ) : levelHistory.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                        <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs">Chưa có lịch sử thay đổi mức năng lực.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                        {levelHistory.map((hist, idx) => {
                          const getLvlLabel = (l: number) => l === 1 ? 'Yếu' : l === 2 ? 'Trung bình' : l === 3 ? 'Khá' : 'N/A';
                          const getReasonLabel = (r: string) => {
                            if (r === 'PLACEMENT') return 'Bài thi phân loại đầu vào';
                            if (r === 'GATE') return 'Cổng kiểm tra chuyển mức';
                            if (r === 'RETAKE') return 'Thi lại / Đánh giá lại';
                            return r || 'Khác';
                          };

                          return (
                            <div key={hist.id || idx} className="flex gap-3 items-start p-2.5 border border-slate-100 bg-slate-50/30 rounded-xl">
                              <div className="flex flex-col items-center justify-center bg-primary/5 text-primary p-1.5 rounded-lg font-bold shrink-0 min-w-10 text-center">
                                <span className="text-[9px] text-slate-400 block uppercase font-medium">Mức mới</span>
                                <span className="text-xs font-extrabold text-primary">{getLvlLabel(hist.newLevel)}</span>
                              </div>
                              <div className="flex-1 space-y-0.5">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-slate-700">Lý do: {getReasonLabel(hist.reason)}</span>
                                  <span className="text-[9px] text-slate-400">
                                    {new Date(hist.changedAt).toLocaleString('vi-VN')}
                                  </span>
                                </div>
                                <p className="text-slate-500 leading-relaxed text-[10.5px]">
                                  Chuyển từ mức <span className="font-semibold text-slate-650">{hist.oldLevel ? getLvlLabel(hist.oldLevel) : 'Chưa xếp lớp'}</span> sang mức <span className="font-semibold text-slate-650">{getLvlLabel(hist.newLevel)}</span>.
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-slate-100 pt-3 sm:justify-end">
            <Button type="button" onClick={() => setIsDetailOpen(false)} className="bg-primary hover:bg-primary/90 text-white font-semibold">
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Tab Support: Trợ giảng & Hỏi đáp ─────────────────────────────────── */}
      {activeTab === 'support' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cột trái: Quản lý nhóm trợ giảng (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-slate-200 shadow-xs rounded-2xl bg-white">
              <CardHeader className="border-b border-slate-100 pb-4 flex flex-row items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-primary" />
                  Danh sách Trợ giảng (Sub-mentors)
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setAssignSubMentorIds([]);
                      setIsAssignSubMentorModalOpen(true);
                    }}
                    className="border-slate-200 text-slate-700 hover:bg-slate-50 gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Chỉ định trợ giảng mới
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {loadingSupport ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : students.filter(s => s.isSubmentor).length === 0 ? (
                  <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs">Chưa có học sinh nào được chỉ định làm trợ giảng trong lớp này.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {students
                      .filter(s => s.isSubmentor)
                      .map(mentor => {
                        const mentorAssignments = assignments.filter(
                          a => a.subMentorCssId === mentor.classroomSubjectStudentId
                        );

                        return (
                          <div
                            key={mentor.id}
                            className="border border-slate-250 rounded-xl p-4 bg-slate-50/20 space-y-3"
                          >
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100 flex-wrap gap-2">
                              <div>
                                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                                  <div className="size-2 rounded-full bg-emerald-500" />
                                  {mentor.fullName}
                                  <span className="text-[10px] text-slate-400 font-normal">({mentor.id})</span>
                                </h4>
                                <p className="text-xs text-slate-500">{mentor.email}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedSubMentor(mentor);
                                    setIsAssignStudentModalOpen(true);
                                  }}
                                  className="h-7 text-xs bg-primary hover:bg-primary/90 text-white rounded-lg flex items-center gap-1 font-semibold"
                                >
                                  <Plus className="size-3.5" /> Thêm học sinh kèm
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleToggleSubMentor(mentor)}
                                  className="h-7 text-xs border-slate-250 text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-1"
                                >
                                  <UserMinus className="size-3.5 text-rose-500" /> Hủy trợ giảng
                                </Button>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">Học sinh phụ trách ({mentorAssignments.length})</span>
                              {mentorAssignments.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">Chưa gán học sinh nào vào nhóm kèm cặp của trợ giảng này.</p>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {mentorAssignments.map(a => (
                                    <div
                                      key={a.id}
                                      className="flex items-center justify-between p-2 border border-slate-100 bg-white rounded-lg text-xs"
                                    >
                                      <div>
                                        <p className="font-semibold text-slate-700">{a.studentName}</p>
                                        <p className="text-[10px] text-slate-400">{a.studentEmail}</p>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDeleteAssignment(a.id)}
                                        className="h-6 w-6 p-0 text-slate-400 hover:text-rose-600 rounded-md"
                                      >
                                        <X className="size-3.5" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Cột phải: Hỏi đáp leo thang (1 col) */}
          <div className="space-y-6">
            <Card className="border border-slate-200 shadow-xs rounded-2xl bg-white h-full flex flex-col justify-between">
              <div>
                <CardHeader className="border-b border-slate-100 pb-4">
                  <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    Hỏi đáp leo thang ({escalatedTickets.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {loadingSupport ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : escalatedTickets.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-650 mb-1">Hoàn thành!</p>
                      <p className="text-[11px] text-slate-400 leading-normal px-4">Không có câu hỏi nào cần giải quyết hiện tại.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                      {escalatedTickets.map((ticket) => (
                        <div
                          key={ticket.ticketId}
                          className="border border-slate-200 rounded-xl p-3 bg-rose-50/10 space-y-2 border-l-4 border-l-rose-500"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-slate-800 text-xs">{ticket.studentName}</p>
                              <p className="text-[9px] text-slate-400">
                                {new Date(ticket.createdAt).toLocaleString('vi-VN')}
                              </p>
                            </div>
                            <Badge className="bg-rose-50 border-rose-200 text-rose-700 text-[9px] font-bold">
                              LEO THANG
                            </Badge>
                          </div>
                          <div className="p-2 border border-slate-100 bg-white rounded-lg text-xs text-slate-650 leading-relaxed font-mono whitespace-pre-wrap">
                            {ticket.messageStudent}
                          </div>
                          <div className="flex justify-end pt-1">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedTicket(ticket);
                                setResponseText('');
                                setIsRespondModalOpen(true);
                              }}
                              className="h-7 text-xs bg-[#030213] hover:bg-slate-900 text-white rounded-lg font-bold"
                            >
                              Giải đáp ngay
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Modal: Gán học sinh kèm cặp */}
      <Dialog open={isAssignStudentModalOpen} onOpenChange={setIsAssignStudentModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
              <UserCheck className="size-5 text-primary" /> Thêm học sinh kèm cặp
            </DialogTitle>
            <DialogDescription>
              Giao phó học sinh cho trợ giảng <strong>{selectedSubMentor?.fullName}</strong> kèm cặp.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateAssignment}>
            <div className="py-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 block">Chọn học sinh trong lớp:</label>
                <div className="max-h-[250px] overflow-y-auto pr-2 space-y-2 py-2 border border-slate-200 rounded-xl bg-white p-2">
                  {students.filter(s => {
                    if (s.isSubmentor) return false;
                    if (s.classroomSubjectStudentId === selectedSubMentor?.classroomSubjectStudentId) return false;
                    const isAssignedToThis = assignments.some(
                      a => a.subMentorCssId === selectedSubMentor?.classroomSubjectStudentId && a.studentCssId === s.classroomSubjectStudentId
                    );
                    return !isAssignedToThis;
                  }).length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">Tất cả học sinh khả dụng đã được gán.</p>
                  ) : (
                    students.filter(s => {
                      if (s.isSubmentor) return false;
                      if (s.classroomSubjectStudentId === selectedSubMentor?.classroomSubjectStudentId) return false;
                      const isAssignedToThis = assignments.some(
                        a => a.subMentorCssId === selectedSubMentor?.classroomSubjectStudentId && a.studentCssId === s.classroomSubjectStudentId
                      );
                      return !isAssignedToThis;
                    }).map(s => (
                      <label key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                          checked={selectedStudentsToAssign.includes(s.classroomSubjectStudentId!)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudentsToAssign(prev => [...prev, s.classroomSubjectStudentId!]);
                            } else {
                              setSelectedStudentsToAssign(prev => prev.filter(id => id !== s.classroomSubjectStudentId!));
                            }
                          }}
                        />
                        <div>
                          <p className="text-sm font-semibold text-slate-700">{s.fullName}</p>
                          <p className="text-xs text-slate-500">{s.id} {s.isSubmentor ? " [Trợ giảng]" : ""}</p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-slate-100 pt-3 flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAssignStudentModalOpen(false);
                  setSelectedStudentsToAssign([]);
                }}
                className="h-9 rounded-xl text-xs border-slate-200"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={submittingAssignment || selectedStudentsToAssign.length === 0}
                className="h-9 rounded-xl text-xs bg-primary hover:bg-primary/90 text-white font-semibold"
              >
                {submittingAssignment ? <Loader className="size-3.5 animate-spin mr-1" /> : null}
                Lưu phân công
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Giảng viên trả lời câu hỏi leo thang */}
      <Dialog open={isRespondModalOpen} onOpenChange={setIsRespondModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
              <MessageSquare className="size-5 text-primary" /> Giải đáp câu hỏi học sinh
            </DialogTitle>
            <DialogDescription>
              Câu hỏi này đã được chuyển tiếp lên từ Trợ giảng. Câu trả lời của bạn sẽ được lưu và ticket chuyển sang hoàn thành.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRespondTicket}>
            <div className="py-4 space-y-4 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-slate-600 block">Học sinh hỏi:</span>
                <p className="font-semibold text-slate-800 text-sm leading-none">{selectedTicket?.studentName}</p>
                <p className="text-[10px] text-slate-400">{selectedTicket?.studentEmail}</p>
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-slate-600 block">Nội dung câu hỏi:</span>
                <div className="p-3 border border-slate-150 bg-slate-50/50 rounded-xl leading-relaxed font-mono whitespace-pre-wrap">
                  {selectedTicket?.messageStudent}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-600 block">Giải đáp của giảng viên:</label>
                <textarea
                  required
                  rows={4}
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Nhập nội dung giải đáp chi tiết..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-700 outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            <DialogFooter className="border-t border-slate-100 pt-3 flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRespondModalOpen(false)}
                className="h-9 rounded-xl text-xs border-slate-200"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={submittingResponse}
                className="h-9 rounded-xl text-xs bg-[#030213] hover:bg-slate-900 text-white font-semibold"
              >
                {submittingResponse ? <Loader className="size-3.5 animate-spin mr-1" /> : null}
                Gửi câu trả lời
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignSubMentorModalOpen} onOpenChange={setIsAssignSubMentorModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
              <UserPlus className="size-5 text-primary" /> Chỉ định trợ giảng
            </DialogTitle>
            <DialogDescription>
              Chọn các học sinh để cấp quyền trợ giảng trong lớp này.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 py-2">
            {students.filter(s => !s.isSubmentor).length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">Không có học sinh nào khả dụng.</p>
            ) : (
              students.filter(s => !s.isSubmentor).map(s => (
                <label key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                    checked={assignSubMentorIds.includes(s.classroomSubjectStudentId!)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setAssignSubMentorIds(prev => [...prev, s.classroomSubjectStudentId!]);
                      } else {
                        setAssignSubMentorIds(prev => prev.filter(id => id !== s.classroomSubjectStudentId!));
                      }
                    }}
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{s.fullName}</p>
                    <p className="text-xs text-slate-500">{s.id}</p>
                  </div>
                </label>
              ))
            )}
          </div>

          <DialogFooter className="border-t border-slate-100 pt-3 flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAssignSubMentorModalOpen(false);
                setAssignSubMentorIds([]);
              }}
              className="h-9 rounded-xl text-xs border-slate-200"
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirmAssignSubMentors}
              className="h-9 rounded-xl text-xs bg-primary hover:bg-primary/90 text-white font-semibold flex items-center gap-1.5"
              disabled={assignSubMentorIds.length === 0 || loadingSupport}
            >
              <Save className="size-3.5" />
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
