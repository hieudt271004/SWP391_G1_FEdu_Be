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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '../../../components/ui/select';
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
  UserPlus,
  Calendar,
  Clock,
  Unlock,
  Lock,
  AlertCircle,
  Activity,
  Radio
} from 'lucide-react';
import {
  teacherService
} from '../../../services/teacher.service';
import { resolveAssetUrl } from '../../../components/learningPath/MaterialPreview';
import type { SubmissionResponse } from '../../../services/student.service';
import { classroomService } from '../../../services/classroom.service';
import {
  learningPathService,
  LearningNodeResponse,
  NodeEdgeResponse,
  ClassroomGraphResponse,
  CloneablePathResponse,
  NodeContentResponse,
  StudentInClassResponse,
  StudentAttemptResponse,
  StudentProgressReportResponse,
  AttemptGradingDetail
} from '../../../services/learningPath.service';
import { slotService, SlotResponse } from '../../../services/slot.service';
import { LearningPathFlow } from '../../../components/learningPath/LearningPathFlow';
import { MaterialPreview } from '../../../components/learningPath/MaterialPreview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { NodeDiscussion } from '../../../components/learningPath/NodeDiscussion';
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

  
  const [graphData, setGraphData] = useState<ClassroomGraphResponse | null>(null);
  const [actionState, setActionState] = useState<'idle' | 'cloning' | 'publishing' | 'unpublishing' | 'deleting'>('idle');
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [cloneablePaths, setCloneablePaths] = useState<CloneablePathResponse[]>([]);
  const [loadingCloneablePaths, setLoadingCloneablePaths] = useState(false);
  
  const [templatePreview, setTemplatePreview] = useState<{ pathId: number; nodes: LearningNodeResponse[]; edges: NodeEdgeResponse[] } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  
  const autoPreviewedPathRef = useRef<number | null>(null);
  const [showApplyTemplateConfirm, setShowApplyTemplateConfirm] = useState(false);

  
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [understandPublish, setUnderstandPublish] = useState(false);

  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);
  const [understandUnpublish, setUnderstandUnpublish] = useState(false);

  const [showUnpublishError, setShowUnpublishError] = useState(false);
  const [unpublishErrorMsg, setUnpublishErrorMsg] = useState<string | null>(null);

  const [seededCount, setSeededCount] = useState<number | null>(null);

  
  const [selectedNode, setSelectedNode] = useState<LearningNodeResponse | null>(null);
  const [nodeStudents, setNodeStudents] = useState<StudentInClassResponse[]>([]);
  const [nodeContent, setNodeContent] = useState<NodeContentResponse | null>(null);
  const [loadingNodeDetails, setLoadingNodeDetails] = useState(false);
  const [activeTabs, setActiveTabs] = useState<Record<number, string>>({});
  const [discussionCounts, setDiscussionCounts] = useState<Record<number, number>>({});



  
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [schedulingNode, setSchedulingNode] = useState<LearningNodeResponse | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleSlotId, setScheduleSlotId] = useState("");
  
  const [deadlineInput, setDeadlineInput] = useState("");
  const [savingDeadline, setSavingDeadline] = useState(false);
  const [slotsList, setSlotsList] = useState<SlotResponse[]>([]);
  const [scheduleConflict, setScheduleConflict] = useState<any | null>(null);
  const [savingSchedule, setSavingSchedule] = useState(false);

  const openScheduleModal = async (node: LearningNodeResponse) => {
    if (node.studyDate && node.startTime) {
      const now = new Date();
      const [hours, minutes] = node.startTime.substring(0, 5).split(":").map(Number);
      const startDateTime = new Date(node.studyDate);
      startDateTime.setHours(hours, minutes, 0, 0);

      if (startDateTime < now) {
        toast.error("Buổi học đang hoặc đã diễn ra, không thể thay đổi lịch học.");
        return;
      }
    }

    setSchedulingNode(node);
    setScheduleDate(node.studyDate || "");
    setScheduleSlotId(node.slotId ? String(node.slotId) : "");
    setScheduleConflict(null);
    setIsScheduleModalOpen(true);
    
    try {
      const res = await slotService.getAllSlots();
      const sortedSlots = (res || []).sort((a, b) => a.startTime.localeCompare(b.startTime));
      setSlotsList(sortedSlots);
    } catch (err) {
      console.error("Failed to load slots list:", err);
      toast.error("Không thể tải danh sách ca học");
    }
  };

  const handleSaveSchedule = async (force = false) => {
    if (!schedulingNode) return;
    if (!scheduleDate || !scheduleSlotId) {
      toast.error("Vui lòng chọn đầy đủ cả Ngày học và Ca học để lưu lịch.");
      return;
    }

    
    const selectedSlot = slotsList.find(s => String(s.slotId) === scheduleSlotId);
    if (selectedSlot) {
      const now = new Date();
      const [hours, minutes] = selectedSlot.startTime.substring(0, 5).split(":").map(Number);
      const newStartDateTime = new Date(scheduleDate);
      newStartDateTime.setHours(hours, minutes, 0, 0);

      if (newStartDateTime < now) {
        toast.error("Không thể xếp lịch vào thời gian trong quá khứ.");
        return;
      }
    }

    try {
      setSavingSchedule(true);
      setScheduleConflict(null);
      
      const payload = {
        studyDate: scheduleDate,
        slotId: Number(scheduleSlotId),
        force,
      };

      const res = await learningPathService.scheduleNode(schedulingNode.nodeId, payload);
      toast.success("Xếp lịch học thành công!");
      
      setSelectedNode(res);
      setIsScheduleModalOpen(false);
      fetchClassroomData();
    } catch (err: any) {
      const responseData = err.response?.data;
      if (err.response?.status === 409 && responseData?.data?.hasConflict) {
        setScheduleConflict(responseData.data);
        toast.warning("Phát hiện trùng lịch học!");
      } else {
        toast.error(responseData?.message || err.message || "Lỗi khi xếp lịch học");
      }
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleClearSchedule = async () => {
    if (!schedulingNode) return;
    if (schedulingNode.studyDate && schedulingNode.startTime) {
      const now = new Date();
      const [hours, minutes] = schedulingNode.startTime.substring(0, 5).split(":").map(Number);
      const startDateTime = new Date(schedulingNode.studyDate);
      startDateTime.setHours(hours, minutes, 0, 0);

      if (startDateTime < now) {
        toast.error("Buổi học đang hoặc đã diễn ra, không thể xóa lịch học.");
        return;
      }
    }

    try {
      setSavingSchedule(true);
      setScheduleConflict(null);
      
      const payload = {
        studyDate: null,
        slotId: null,
        force: false,
      };

      const res = await learningPathService.scheduleNode(schedulingNode.nodeId, payload);
      toast.success("Hủy lịch học thành công!");

      setScheduleDate("");
      setScheduleSlotId("");
      
      setSelectedNode(res);
      setIsScheduleModalOpen(false);
      fetchClassroomData();
    } catch (err: any) {
      const responseData = err.response?.data;
      toast.error(responseData?.message || err.message || "Lỗi khi hủy lịch học");
    } finally {
      setSavingSchedule(false);
    }
  };

  
  useEffect(() => {
    setDeadlineInput(selectedNode?.deadlineAt ? selectedNode.deadlineAt.slice(0, 16) : "");
  }, [selectedNode?.nodeId, selectedNode?.deadlineAt]);

  
  const handleSaveDeadline = async () => {
    if (!selectedNode) return;
    if (!deadlineInput) {
      toast.error("Chọn thời điểm hạn hoàn thành");
      return;
    }
    try {
      setSavingDeadline(true);
      
      const res = await learningPathService.updateLearningNode(selectedNode.nodeId, {
        title: selectedNode.title,
        nodeType: selectedNode.nodeType,
        deadlineAt: deadlineInput,
      });
      setSelectedNode(res);
      toast.success("Đã đặt hạn hoàn thành cho bài tự học");
      fetchClassroomData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không đặt được hạn hoàn thành");
    } finally {
      setSavingDeadline(false);
    }
  };

  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'roadmap' | 'placement' | 'students' | 'support'>('roadmap');

  
  const [progressReport, setProgressReport] = useState<Record<number, StudentProgressReportResponse>>({});
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    if (activeTab !== 'students' || !classroomSubjectId) return;
    let cancelled = false;
    (async () => {
      setLoadingReport(true);
      try {
        const rows = await learningPathService.getProgressReport(Number(classroomSubjectId));
        if (!cancelled) {
          setProgressReport(Object.fromEntries((rows ?? []).map((r) => [r.studentId, r])));
        }
      } catch (err) {
        
        console.error('Không thể tải báo cáo theo dõi học sinh:', err);
      } finally {
        if (!cancelled) setLoadingReport(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab, classroomSubjectId]);

  
  const [monitorTest, setMonitorTest] = useState<{ testId: number; title: string } | null>(null);
  const [monitorAttempts, setMonitorAttempts] = useState<StudentAttemptResponse[]>([]);
  const [monitorLoading, setMonitorLoading] = useState(false);
  const [monitorTab, setMonitorTab] = useState<'doing' | 'cheat' | 'grading'>('doing');

  
  const [gradingAttempt, setGradingAttempt] = useState<AttemptGradingDetail | null>(null);
  const [gradingLoading, setGradingLoading] = useState(false);
  const [essayMarks, setEssayMarks] = useState<Record<number, boolean>>({});
  const [savingEssayGrades, setSavingEssayGrades] = useState(false);

  const openEssayGrading = async (attemptId: number) => {
    setGradingLoading(true);
    setEssayMarks({});
    try {
      const detail = await learningPathService.getAttemptGrading(attemptId);
      setGradingAttempt(detail);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tải bài làm để chấm');
    } finally {
      setGradingLoading(false);
    }
  };

  const handleSaveEssayGrades = async () => {
    if (!gradingAttempt) return;
    const pendingEssays = gradingAttempt.responses.filter(
      (r) => r.questionType === 'ESSAY' && r.isCorrect == null
    );
    const grades: { responseId: number; isCorrect: boolean }[] = [];
    for (const r of pendingEssays) {
      const mark = essayMarks[r.responseId];
      if (mark !== undefined) grades.push({ responseId: r.responseId, isCorrect: mark });
    }
    if (grades.length === 0) {
      toast.error('Hãy chấm Đạt/Không đạt cho ít nhất một câu tự luận.');
      return;
    }
    setSavingEssayGrades(true);
    try {
      const updated = await learningPathService.gradeEssayAttempt(gradingAttempt.attemptId, grades);
      if (updated.status === 'SUBMITTED') {
        toast.success(`Đã chấm xong — điểm cuối: ${updated.score ?? 0}%. Hệ thống đã xếp mức/mở bài cho học sinh.`);
        setGradingAttempt(null);
      } else {
        toast.success('Đã lưu kết quả chấm. Vẫn còn câu tự luận chưa chấm.');
        setGradingAttempt(updated);
        setEssayMarks({});
      }
      
      if (monitorTest) {
        try {
          setMonitorAttempts((await learningPathService.getTestAttempts(monitorTest.testId)) ?? []);
        } catch {  }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lưu kết quả chấm thất bại');
    } finally {
      setSavingEssayGrades(false);
    }
  };

  useEffect(() => {
    if (!monitorTest) return;
    let cancelled = false;
    const fetchAttempts = async (showSpinner: boolean) => {
      if (showSpinner) setMonitorLoading(true);
      try {
        const res = await learningPathService.getTestAttempts(monitorTest.testId);
        if (!cancelled) setMonitorAttempts(res ?? []);
      } catch (err: any) {
        if (!cancelled && showSpinner) {
          toast.error(err.response?.data?.message || 'Không thể tải danh sách bài làm');
        }
      } finally {
        if (!cancelled && showSpinner) setMonitorLoading(false);
      }
    };
    fetchAttempts(true);
    
    const interval = setInterval(() => fetchAttempts(false), 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [monitorTest]);

  
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(null);
  const [selectedExerciseTitle, setSelectedExerciseTitle] = useState('');
  const [submissionsList, setSubmissionsList] = useState<SubmissionResponse[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  
  const [gradingSubmission, setGradingSubmission] = useState<SubmissionResponse | null>(null);
  const [gradeValue, setGradeValue] = useState('');
  const [feedbackValue, setFeedbackValue] = useState('');
  const [submittingGrade, setSubmittingGrade] = useState(false);

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

  const [unlockingNode, setUnlockingNode] = useState(false);

  const handleUnlockOnClassNode = async () => {
    if (!selectedNode || !classroomSubjectId) return;
    try {
      setUnlockingNode(true);
      const opened = await learningPathService.unlockOnClassNode(Number(classroomSubjectId), selectedNode.nodeId);
      toast.success(`Đã mở khóa buổi học cho ${opened} học sinh đủ điều kiện!`);
      setSelectedNode(prev => prev ? { ...prev, status: 'OPEN' } : null);
      fetchClassroomData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Lỗi khi mở khóa buổi học");
    } finally {
      setUnlockingNode(false);
    }
  };

  
  const [isAssignSubMentorModalOpen, setIsAssignSubMentorModalOpen] = useState(false);
  const [assignSubMentorIds, setAssignSubMentorIds] = useState<number[]>([]);

  
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'placement' || tabParam === 'students' || tabParam === 'support' || tabParam === 'roadmap') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  
  const [placementQuiz, setPlacementQuiz] = useState<any>(null);
  const [loadingPlacement, setLoadingPlacement] = useState(false);
  const [isCreateQuizOpen, setIsCreateQuizOpen] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [quizDuration, setQuizDuration] = useState('45');
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  
  const [scoreBands, setScoreBands] = useState<any[]>([]);
  const [savingBands, setSavingBands] = useState(false);

  
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

  
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedStudentName, setSelectedStudentName] = useState('');
  const [levelHistory, setLevelHistory] = useState<any[]>([]);

  
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [detailTab, setDetailTab] = useState<'info' | 'history' | 'roadmap'>('info');
  const [studentGraph, setStudentGraph] = useState<ClassroomGraphResponse | null>(null);
  const [studentGraphLoading, setStudentGraphLoading] = useState(false);
  const [resettingPlacement, setResettingPlacement] = useState(false);

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  
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

  const fetchStudentGraph = async (studentId: number) => {
    if (!classroomSubjectId) return;
    try {
      setStudentGraphLoading(true);
      const res = await learningPathService.getStudentClassroomGraph(Number(classroomSubjectId), studentId);
      setStudentGraph(res);
    } catch (err) {
      console.error("Failed to load student graph:", err);
      toast.error("Không thể tải lộ trình chi tiết của học sinh.");
    } finally {
      setStudentGraphLoading(false);
    }
  };

  const handleViewDetail = async (student: Student) => {
    setSelectedStudent(student);
    setDetailTab('info');
    setIsDetailOpen(true);
    setHistoryLoading(true);
    setStudentGraph(null);
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
    const exercises = (content.exercises || []).map((e) => ({
      key: `exercise-${e.exerciseId}`,
      id: e.exerciseId,
      type: "EXERCISE" as const,
      title: e.title,
      orderIndex: e.orderIndex ?? 9999,
      data: e,
    }));
    return [...materials, ...tests, ...exercises].sort((a, b) => a.orderIndex - b.orderIndex);
  };

  const handleOpenSubmissionsModal = async (exerciseId: number, title: string) => {
    setSelectedExerciseId(exerciseId);
    setSelectedExerciseTitle(title);
    setLoadingSubmissions(true);
    try {
      const list = await teacherService.listSubmissions(exerciseId);
      const sorted = (list || []).sort((a, b) => {
        const aGraded = a.status === 'GRADED' ? 1 : 0;
        const bGraded = b.status === 'GRADED' ? 1 : 0;
        if (aGraded !== bGraded) return aGraded - bGraded;
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      });
      setSubmissionsList(sorted);
    } catch (err: any) {
      console.error('Failed to load submissions:', err);
      toast.error('Không thể tải danh sách bài nộp');
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleOpenGrading = (sub: SubmissionResponse) => {
    setGradingSubmission(sub);
    setGradeValue(sub.grade !== undefined && sub.grade !== null ? sub.grade.toString() : '');
    setFeedbackValue(sub.feedback || '');
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission || !gradeValue.trim()) return;

    const gradeNum = parseFloat(gradeValue);
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 10) {
      toast.error('Điểm số phải nằm trong khoảng từ 0 đến 10.');
      return;
    }

    try {
      setSubmittingGrade(true);
      const res = await teacherService.gradeSubmission(
        gradingSubmission.submissionId,
        gradeNum,
        feedbackValue.trim()
      );

      
      setSubmissionsList((prev) => {
        const updated = prev.map((s) => (s.submissionId === res.submissionId ? res : s));
        return updated.sort((a, b) => {
          const aGraded = a.status === 'GRADED' ? 1 : 0;
          const bGraded = b.status === 'GRADED' ? 1 : 0;
          if (aGraded !== bGraded) return aGraded - bGraded;
          return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
        });
      });
      toast.success('Chấm điểm thành công!');
      setGradingSubmission(res);
    } catch (err: any) {
      console.error('Failed to save grade:', err);
      toast.error(err.message || 'Không thể lưu điểm.');
    } finally {
      setSubmittingGrade(false);
    }
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
    autoPreviewedPathRef.current = null;
    fetchClassroomData();
  }, [classroomSubjectId]);

  
  
  
  useEffect(() => {
    if (graphData?.state === 'NO_PATH' && graphData.availableTemplates) {
      if (graphData.availableTemplates.length === 1) {
        const onlyId = graphData.availableTemplates[0].pathId;
        if (autoPreviewedPathRef.current !== onlyId) {
          autoPreviewedPathRef.current = onlyId;
          handlePreviewTemplate(onlyId);
        }
      }
    }
  }, [graphData]);

  
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



  useEffect(() => {
    const fetchCloneablePaths = async () => {
      if (!classroomSubjectId) return;
      try {
        setLoadingCloneablePaths(true);
        const res = await learningPathService.getCloneablePaths(Number(classroomSubjectId));
        setCloneablePaths(res);
        
        if (graphData?.state === 'NO_PATH' && res.length === 1 && autoPreviewedPathRef.current !== res[0].pathId) {
          autoPreviewedPathRef.current = res[0].pathId;
          handlePreviewTemplate(res[0].pathId);
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách lộ trình clone:', err);
      } finally {
        setLoadingCloneablePaths(false);
      }
    };

    if ((graphData?.state === 'NO_PATH' || graphData?.state === 'DRAFT') && classroomSubjectId) {
      fetchCloneablePaths();
    }
  }, [graphData?.state, classroomSubjectId]);

  
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

  
  
  const handleApplyTemplate = async () => {
    if (!classroomSubjectId || !selectedTemplateId) return;
    try {
      setActionState('cloning');
      if (graphData?.state === 'DRAFT' && graphData.pathId) {
        await learningPathService.replaceDraftWithTemplate(Number(classroomSubjectId), selectedTemplateId);
      } else {
        await learningPathService.cloneFromTemplate(Number(classroomSubjectId), selectedTemplateId);
      }

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

    const isColSubNode = (_n: LearningNodeResponse) => false; 
    const colSubDepth = (n: LearningNodeResponse, seen: Set<number> = new Set()): number => {
      if (!isColSubNode(n)) return 0;
      if (seen.has(n.nodeId)) return 1;
      seen.add(n.nodeId);
      const pe = colEdges.find((e: NodeEdgeResponse) => e.toNodeId === n.nodeId);
      const parent = pe ? colNodes.find((x: LearningNodeResponse) => x.nodeId === pe.fromNodeId) : undefined;
      return parent ? colSubDepth(parent, seen) + 1 : 1;
    };
    const stripLessonPrefix = (t: string) => (t || "").replace(/^\s*Bài\s+\d+(\s*phụ(\s*\d+)?)?\s*:?\s*/i, "").trim();
    const colNodeLabels: Record<number, string> = {};
    const subInfo: Record<number, { base: string; idx: number }> = {};
    let lessonCounter = 0;

    
    const sortedColNodes = [...colNodes].sort((a, b) => (a.displayOrder - b.displayOrder) || (a.nodeId - b.nodeId));

    for (const n of sortedColNodes) {
      if (isColSubNode(n)) {
        const pe = colEdges.find((e: NodeEdgeResponse) => e.toNodeId === n.nodeId);
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
          {}
          <div className="pb-4 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-1.5">
              <BookOpen className="w-5 h-5 text-primary shrink-0" />
              <h3 className="font-bold text-lg text-slate-800">{title}</h3>
            </div>
            <p className="text-xs text-slate-500 line-clamp-2">
              {defaultDesc}
            </p>
          </div>

          {}
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

          {}
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
                    {}
                    {depth > 0 && (
                      <div className="absolute top-0 bottom-0 flex items-start justify-center pointer-events-none" style={{ left: `-${28}px`, width: `${28}px` }}>
                        <svg className="w-full h-12 text-slate-300" viewBox="0 0 28 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M 14 0 L 14 16 Q 14 24 21 24 L 28 24" />
                          {index < sortedColNodes.length - 1 && <path d="M 14 24 L 14 48" />}
                        </svg>
                      </div>
                    )}

                    {}
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
                      {}
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

                      {}
                      {isExpanded && (
                        <div className="px-3.5 pb-3.5 pt-1.5 bg-slate-50/30 border-t border-slate-100 space-y-3">
                          <p className="text-xs text-slate-500 leading-relaxed">
                            {node.description || "Chưa có mô tả chi tiết."}
                          </p>

                          {}
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
                                Chưa có tài liệu, bài test hoặc bài thực hành.
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                {sortedItems.map((item) => {
                                  const isMaterial = item.type === "MATERIAL";
                                  const isExercise = item.type === "EXERCISE";
                                  const m = isMaterial ? item.data : null;
                                  const t = (!isMaterial && !isExercise) ? item.data : null;
                                  const ex = isExercise ? item.data : null;

                                  return (
                                    <div
                                      key={item.key}
                                      className="flex items-center justify-between gap-2 p-2 bg-slate-50/50 hover:bg-slate-50 rounded-lg border border-slate-100 text-[11px] transition-colors"
                                    >
                                      {isMaterial ? (
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
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
                                        </div>
                                      ) : isExercise ? (
                                        <>
                                          <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                              <span className="font-semibold text-slate-700 truncate block" title={item.title}>
                                                {item.title} (Thực hành)
                                              </span>
                                              {item.data.instructions && (
                                                <span className="text-[9px] text-slate-400 block mt-0.5 truncate">
                                                  {item.data.instructions}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          <Button
                                            onClick={() => handleOpenSubmissionsModal(item.data.exerciseId, item.data.title)}
                                            className="h-6 px-2 text-[9px] bg-slate-800 hover:bg-slate-750 text-white font-bold rounded shrink-0"
                                          >
                                            Xem bài nộp
                                          </Button>
                                        </>
                                      ) : (
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                          <Award className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                          <div className="flex-1 min-w-0">
                                            <span className="font-semibold text-slate-700 truncate block" title={item.title}>
                                              {item.title}
                                            </span>
                                            <span className="text-[9px] text-slate-400 block mt-0.5">
                                              {t?.durationMinutes || 0} phút · Yêu cầu đạt: {t?.passingPercentage || 80}%
                                            </span>
                                          </div>
                                        </div>
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
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
            Class {classInfo.classCode} - {classInfo.courseCode}
            {(() => {
              switch (classroomStatus) {
                case 'active':
                  return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">Đang hoạt động</Badge>;
                case 'completed':
                  return <Badge className="bg-primary/10 text-primary border-primary/20">Đã hoàn thành</Badge>;
                default:
                  return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">Chưa bắt đầu</Badge>;
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
          {}
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

      {}
      {graphData?.state === 'NO_PATH' && (
        <Card className="border-primary/20 bg-primary/5 rounded-2xl">
          <CardContent className="pt-6">
            <div className="space-y-1 text-center md:text-left">
              <h2 className="text-lg font-semibold text-primary">
                Cấu hình lộ trình học cho lớp
              </h2>
              <p className="text-sm text-muted-foreground">
                Lớp học này chưa có lộ trình. Chọn template của khoa hoặc template cá nhân của bạn ở mục
                "Sơ đồ lộ trình học tập" bên dưới để áp dụng.
              </p>
            </div>
            {!loadingCloneablePaths && cloneablePaths.length === 0 && (
              <div className="mt-3 text-sm text-red-600 bg-red-50 py-2 px-3 rounded-md border border-red-100">
                Chưa có template nào sẵn sàng cho môn này — hãy tạo template cá nhân trong "Thư viện Lộ trình"
                hoặc liên hệ admin xuất bản lộ trình mẫu.
              </div>
            )}
          </CardContent>
        </Card>
      )}



      {graphData?.state === 'PUBLISHED' && (
        <Card className="border-emerald-500/20 bg-emerald-500/5" role="alert">
          <CardContent className="pt-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
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

      {}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('roadmap')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'roadmap'
              ? 'border-primary text-foreground font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Lộ trình học tập
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'students'
              ? 'border-primary text-foreground font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
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

      {}
      {activeTab === 'roadmap' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pl-1">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
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

          {
}
          {(graphData?.state === 'NO_PATH' || graphData?.state === 'DRAFT') && (
            <Card className="border border-primary/20 bg-primary/5 rounded-2xl mb-6">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex-1 space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                    <BookOpen className="size-3.5" /> Chọn lộ trình để áp dụng cho lớp
                  </label>
                  <Select
                    value={selectedTemplateId ? String(selectedTemplateId) : "none"}
                    onValueChange={(value) => handlePreviewTemplate(value === "none" ? null : Number(value))}
                    disabled={isNonIdle || loadingCloneablePaths}
                  >
                    <SelectTrigger className="w-full max-w-md bg-background border-border h-9 text-foreground font-medium shadow-none focus-visible:ring-0">
                      <SelectValue placeholder="-- Chọn lộ trình để xem trước --" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="none">-- Chọn lộ trình để xem trước --</SelectItem>
                      <SelectGroup>
                        <SelectLabel>Template của khoa</SelectLabel>
                        {cloneablePaths
                          .filter((p) => p.type === 'ADMIN_TEMPLATE')
                          .map((t) => (
                            <SelectItem key={t.pathId} value={String(t.pathId)}>
                              {t.pathName} ({t.nodeCount} bài học)
                            </SelectItem>
                          ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Template cá nhân của tôi</SelectLabel>
                        {cloneablePaths
                          .filter((p) => p.type === 'MY_TEMPLATE')
                          .map((t) => (
                            <SelectItem key={t.pathId} value={String(t.pathId)}>
                              {t.pathName} ({t.nodeCount} bài học)
                            </SelectItem>
                          ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-slate-500">
                    {loadingCloneablePaths
                      ? 'Đang tải danh sách template...'
                      : graphData?.state === 'DRAFT'
                      ? 'Chọn để xem trước; áp dụng sẽ ghi đè lộ trình nháp hiện tại (kèm mọi chỉnh sửa).'
                      : 'Chọn template của khoa hoặc template cá nhân (tạo ở Thư viện Lộ trình) để xem trước rồi áp dụng.'}
                  </p>
                </div>
                <Button
                  onClick={() => (graphData?.state === 'DRAFT' ? setShowApplyTemplateConfirm(true) : handleApplyTemplate())}
                  disabled={isNonIdle || !selectedTemplateId}
                  className="shrink-0 rounded-xl font-semibold"
                >
                  {actionState === 'cloning' ? <Loader className="mr-1.5 size-4 animate-spin" /> : <Play className="mr-1.5 size-4" />}
                  {graphData?.state === 'DRAFT' ? 'Ghi đè lộ trình' : 'Áp dụng lộ trình'}
                </Button>
              </CardContent>
            </Card>
          )}

          {(!graphData?.paths || graphData.paths.length === 0) && graphData?.state === 'NO_PATH' && !templatePreview ? (
            <Card className="border border-dashed border-border bg-card text-card-foreground p-12 text-center rounded-2xl">
              <Map className="w-12 h-12 mx-auto text-slate-300 mb-3 animate-pulse" />
              <h3 className="text-base font-bold text-foreground mb-1">Chưa cấu hình lộ trình</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Lớp học này chưa có lộ trình học tập. Hãy chọn template của khoa hoặc template cá nhân ở trên để áp dụng.
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
                <div className="max-h-[70vh] overflow-x-hidden overflow-y-auto rounded-xl border border-border bg-muted/30 p-3 lg:max-h-[calc(100vh-2rem)]">
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
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-card border border-border rounded-2xl p-6">
                    <Map className="w-10 h-10 text-slate-300 mb-2 animate-bounce" />
                    <p className="text-xs font-semibold">Chọn bài học trên sơ đồ</p>
                    <p className="text-[10px] text-muted-foreground">để xem thông tin chi tiết</p>
                  </div>
                ) : (
                  <div className="bg-card border border-border text-card-foreground rounded-2xl p-5 space-y-5 shadow-xs h-fit max-h-[70vh] overflow-auto flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-border">
                        <div>
                          <span className="px-2 py-0.5 bg-secondary text-secondary-foreground border border-border rounded text-[10px] font-semibold uppercase">
                            {selectedNode.nodeType === 'ON_CLASS' ? 'Trên lớp' : 'Tự học'}
                          </span>
                          <h3 className="font-bold text-foreground text-sm mt-1">{selectedNode.title}</h3>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setSelectedNode(null)}>
                          <X className="size-4" />
                        </Button>
                      </div>

                      {loadingNodeDetails ? (
                        <div className="flex items-center justify-center py-10">
                          <Loader className="w-6 h-6 animate-spin text-primary" />
                        </div>
                      ) : (
                        <>
                          {}
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Danh sách sinh viên ({nodeStudents.length})</h4>
                            {nodeStudents.length === 0 ? (
                              <p className="text-xs text-muted-foreground italic">Chưa có sinh viên nào học node này.</p>
                            ) : (
                              <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                                {nodeStudents.map((student) => (
                                  <div key={student.userId} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent border border-border/50">
                                    <div className="w-5 h-5 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-[10px] font-semibold uppercase">
                                      {student.avatarUrl ? (
                                        <img src={student.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                      ) : (
                                        student.lastName?.charAt(0) || student.firstName?.charAt(0) || 'S'
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0 text-xs">
                                      <p className="font-semibold text-foreground truncate">
                                        {student.lastName} {student.firstName}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {}
                          {selectedNode.nodeType === 'ON_CLASS' && (
                            <div className="space-y-2 border-t border-border pt-3">
                              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Lịch học trên lớp</h4>
                              <div className="bg-muted/50 border border-border rounded-lg p-3 text-xs flex flex-col gap-2">
                                {selectedNode.studyDate ? (
                                  <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                      <span>Ngày: {new Date(selectedNode.studyDate).toLocaleDateString("vi-VN")}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                      <span>Ca: {selectedNode.slotName} ({selectedNode.startTime?.substring(0, 5)} - {selectedNode.endTime?.substring(0, 5)})</span>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-slate-400 italic">Chưa xếp lịch học trên lớp</p>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openScheduleModal(selectedNode)}
                                  className="w-full mt-1 border-border text-xs hover:bg-accent text-primary font-semibold"
                                >
                                  {selectedNode.studyDate ? "Thay đổi lịch học" : "Xếp lịch học"}
                                </Button>
                              </div>
                            </div>
                          )}

                          {}
                          {selectedNode.nodeType === 'AT_HOME' && (
                            <div className="space-y-2 border-t border-border pt-3">
                              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Hạn hoàn thành (deadline)</h4>
                              <div className="bg-muted/50 border border-border rounded-lg p-3 text-xs flex flex-col gap-2">
                                {selectedNode.deadlineAt ? (
                                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                                    <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                                    <span>Hạn hiện tại: {new Date(selectedNode.deadlineAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                                  </div>
                                ) : (
                                  <p className="text-slate-400 italic">Chưa đặt hạn hoàn thành cho bài tự học này</p>
                                )}
                                <input
                                  type="datetime-local"
                                  value={deadlineInput}
                                  onChange={(e) => setDeadlineInput(e.target.value)}
                                  className="w-full border border-border rounded-xl px-3 py-2 text-xs bg-background text-foreground outline-none focus:border-primary/50"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleSaveDeadline}
                                  disabled={savingDeadline}
                                  className="w-full border-border text-xs text-primary font-semibold hover:bg-accent"
                                >
                                  {savingDeadline ? 'Đang lưu...' : 'Lưu hạn hoàn thành'}
                                </Button>
                                <p className="text-[10px] text-muted-foreground">
                                  Học sinh hoàn thành sau hạn sẽ bị đánh dấu "trễ". Node Trên lớp không dùng deadline.
                                </p>
                              </div>
                            </div>
                          )}

                          {}
                          {selectedNode.nodeType === 'ON_CLASS' && (
                            <div className="space-y-2 border-t border-border pt-3">
                              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Trạng thái buổi học</h4>
                              <Button
                                onClick={() => navigate(`/teacher/classroom-subjects/${classroomSubjectId}/live/${selectedNode.nodeId}`)}
                                className="w-full h-8 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
                              >
                                <Radio className="size-3.5 mr-1.5" /> Màn hình dạy học (buổi live)
                              </Button>
                              {selectedNode.status === 'OPEN' ? (
                                <div className="flex items-center gap-2 p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold">
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                  <span>Buổi học đã được mở khóa cho cả lớp</span>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl text-xs">
                                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 animate-pulse" />
                                    <span>Buổi học đang khóa. Giáo viên cần mở khóa để học sinh đủ điều kiện vào học.</span>
                                  </div>
                                  <Button
                                    onClick={handleUnlockOnClassNode}
                                    disabled={unlockingNode}
                                    className="w-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 rounded-xl text-xs py-2 flex items-center justify-center gap-1.5"
                                  >
                                    {unlockingNode ? (
                                      <Loader className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Unlock className="h-3.5 w-3.5" />
                                    )}
                                    <span>Mở khóa buổi học</span>
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}

                          <Tabs
                            defaultValue="content"
                            value={activeTabs[selectedNode.nodeId] || 'content'}
                            onValueChange={(val) => setActiveTabs((prev) => ({ ...prev, [selectedNode.nodeId]: val }))}
                            className="w-full"
                          >
                            <TabsList className="grid w-full bg-slate-100 p-1 rounded-lg h-9 mb-4 grid-cols-2">
                              <TabsTrigger value="content" className="text-xs py-1.5 font-semibold rounded-md">
                                Nội dung
                              </TabsTrigger>
                              <TabsTrigger value="discussion" className="text-xs py-1.5 font-semibold rounded-md">
                                {discussionCounts[selectedNode.nodeId] !== undefined
                                  ? `Thảo luận (${discussionCounts[selectedNode.nodeId]})`
                                  : 'Thảo luận'}
                              </TabsTrigger>
                            </TabsList>

                            <TabsContent value="content" className="mt-0 space-y-4">
                              {}
                              <div className="space-y-2 pt-3 border-t border-border">
                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tài liệu học tập</h4>
                                {!nodeContent || (!nodeContent.materials?.length && !nodeContent.tests?.length && !nodeContent.exercises?.length) ? (
                                  <p className="text-xs text-muted-foreground italic">Node này chưa có tài liệu hay bài kiểm tra nào.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {nodeContent.materials?.map((m) => (
                                      <div key={m.materialId} className="rounded-lg border border-border bg-muted/30 p-2 text-xs">
                                        <div className="flex items-center gap-2">
                                          <div className="shrink-0 text-primary">
                                            <FileText className="h-4 w-4" />
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <p className="truncate font-medium text-foreground">{m.title}</p>
                                          </div>
                                        </div>
                                        <div className="mt-1.5 max-w-2xl">
                                          <MaterialPreview material={m} />
                                        </div>
                                      </div>
                                    ))}
                                    {nodeContent.tests?.map((t) => (
                                      <div key={t.testId} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border text-xs">
                                        <div className="text-amber-600 shrink-0">
                                          <Award className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium text-foreground truncate">{t.title} ({t.durationMinutes} phút)</p>
                                        </div>
                                        {}
                                        <Button
                                          onClick={() => { setMonitorTab(selectedNode.nodeType === 'ON_CLASS' ? 'doing' : 'grading'); setMonitorTest({ testId: t.testId, title: t.title }); }}
                                          className="h-6 px-2 text-[9px] bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded shrink-0"
                                        >
                                          <Activity className="w-3 h-3 mr-1" /> Theo dõi
                                        </Button>
                                      </div>
                                    ))}
                                    {nodeContent.exercises?.map((e) => (
                                      <div key={e.exerciseId} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border text-xs gap-3">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                          <div className="text-blue-500 shrink-0">
                                            <FileText className="w-4 h-4" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="font-medium text-foreground truncate" title={e.title}>
                                              {e.title} (Thực hành)
                                            </p>
                                          </div>
                                        </div>
                                        <Button
                                          onClick={() => handleOpenSubmissionsModal(e.exerciseId, e.title)}
                                          className="h-6 px-2 text-[9px] bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded shrink-0"
                                        >
                                          Xem bài nộp
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </TabsContent>

                            <TabsContent value="discussion" className="mt-0">
                              {activeTabs[selectedNode.nodeId] === 'discussion' && (
                                <NodeDiscussion
                                  nodeId={selectedNode.nodeId}
                                  role="teacher"
                                  onLoadSummary={(total) => {
                                    setDiscussionCounts((prev) => ({
                                      ...prev,
                                      [selectedNode.nodeId]: total,
                                    }));
                                  }}
                                />
                              )}
                            </TabsContent>
                          </Tabs>
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

      {}
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
              className="rounded-xl font-semibold"
              onClick={handleApplyTemplate}
              disabled={isNonIdle}
            >
              {actionState === 'cloning' ? <Loader className="mr-1.5 size-4 animate-spin" /> : null}
              Ghi đè & áp dụng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {false && (
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
                className="rounded-xl"
              >
                <Plus className="size-4 mr-1.5" /> Khởi tạo bài test đầu vào
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
              {}
              <div className="lg:col-span-1 space-y-6">
                {}
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
                    <Button
                      variant="outline"
                      onClick={() => { setMonitorTab('grading'); setMonitorTest({ testId: placementQuiz.testId, title: placementQuiz.title }); }}
                      className="w-full h-8 rounded-lg text-[11px] font-bold text-primary border-primary/20 hover:bg-primary/5"
                    >
                      <Activity className="size-3.5 mr-1" /> Bài làm & chấm tự luận
                    </Button>
                  </CardContent>
                </Card>

                {}
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
                          className="w-full rounded-xl text-xs font-semibold mt-2 h-9"
                        >
                          {savingBands ? <Loader className="size-4 animate-spin mr-1.5" /> : null}
                          Lưu khoảng điểm
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {}
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
                        className="h-7 text-xs rounded-lg flex items-center gap-1 font-semibold"
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
        <Card className="border border-border shadow-xs rounded-2xl">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Danh sách học sinh trong lớp ({students.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50 border-border">
                  <TableHead className="font-bold text-muted-foreground w-[12%]">Mã học sinh</TableHead>
                  <TableHead className="font-bold text-muted-foreground w-[18%]">Họ và tên</TableHead>
                  <TableHead className="font-bold text-muted-foreground w-[16%]">Phân loại năng lực</TableHead>
                  <TableHead className="font-bold text-muted-foreground w-[20%]">Lộ trình học tập</TableHead>
                  <TableHead className="font-bold text-muted-foreground w-[12%] text-center">Hoàn thành trễ</TableHead>
                  <TableHead className="font-bold text-muted-foreground w-[22%] text-center">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground italic">
                      Chưa có học sinh nào tham gia lớp học này.
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => {
                    const levelLabel = student.currentLevel === 1 ? 'Yếu' : student.currentLevel === 2 ? 'Trung bình' : student.currentLevel === 3 ? 'Khá' : 'Chưa phân loại';
                    const levelColor = student.currentLevel === 1
                      ? 'bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/20 text-rose-700 dark:text-rose-400'
                      : student.currentLevel === 2
                        ? 'bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/20 text-amber-700 dark:text-amber-400'
                        : student.currentLevel === 3
                          ? 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                          : 'bg-muted border-border text-muted-foreground';

                    return (
                      <TableRow key={student.id} className="border-border hover:bg-muted/30">
                        <TableCell className="font-semibold text-muted-foreground">{student.id}</TableCell>
                        <TableCell className="font-medium text-foreground">
                          {student.fullName}
                          {student.isSubmentor && (
                            <Badge className="bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[9px] font-bold ml-1.5 rounded-[6px] outline-none select-none">
                              TRỢ GIẢNG
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] font-bold border rounded-[6px] px-2 py-0.5 ${levelColor}`}>
                            {levelLabel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-foreground font-medium text-xs">
                          {student.assignedPathName || (
                            <span className="text-muted-foreground italic text-[11px]">Chưa gán lộ trình</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {(() => {
                            const report = progressReport[student.rawUserId];
                            if (!report) {
                              return <span className="text-muted-foreground text-xs">{loadingReport ? '…' : '–'}</span>;
                            }
                            if (report.lateCount === 0) {
                              return <span className="text-muted-foreground text-xs">0</span>;
                            }
                            const lateTooltip = report.lateNodes
                              .map((n) => `${n.title} — hạn ${n.deadlineAt ? new Date(n.deadlineAt).toLocaleString('vi-VN') : '?'}, hoàn thành ${n.completedAt ? new Date(n.completedAt).toLocaleString('vi-VN') : '?'}`)
                              .join('\n');
                            return (
                              <Badge
                                variant="outline"
                                title={lateTooltip}
                                className="bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold rounded-[6px] px-2 py-0.5 cursor-help"
                              >
                                {report.lateCount} bài trễ
                              </Badge>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetail(student)}
                              className="h-7 text-xs text-primary hover:bg-primary/10 rounded-lg font-semibold flex items-center gap-1"
                            >
                              <Eye className="size-3.5" /> Chi tiết
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewHistory(student)}
                              className="h-7 text-xs text-primary hover:bg-primary/10 rounded-lg font-semibold flex items-center gap-1"
                            >
                              <History className="size-3.5" /> Lịch sử xếp lớp
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleSubMentor(student)}
                              className={`h-7 text-xs rounded-lg font-semibold flex items-center gap-1 ${
                                student.isSubmentor
                                  ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-500/10'
                                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
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

      {}
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
              <Button type="submit" disabled={submittingQuiz} className="font-semibold">
                {submittingQuiz ? <Loader className="size-4 animate-spin mr-1.5" /> : null}
                Lưu lại
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {}
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
                <Select
                  value={questionType}
                  onValueChange={(value) => {
                    const newType = value as any;
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
                  <SelectTrigger className="w-full bg-white border-slate-300/50 rounded-[6px] h-9 text-slate-800 text-xs focus:ring-1 focus:ring-slate-800 shadow-none focus-visible:ring-0">
                    <SelectValue placeholder="Chọn loại câu hỏi" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="SINGLE">Một đáp án đúng (Single Choice)</SelectItem>
                    <SelectItem value="MULTIPLE">Nhiều đáp án đúng (Multiple Choice)</SelectItem>
                    <SelectItem value="ESSAY">Tự luận (Essay)</SelectItem>
                  </SelectContent>
                </Select>
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
              <Button type="submit" disabled={submittingQuestion} className="font-semibold">
                {submittingQuestion ? <Loader className="size-4 animate-spin mr-1.5" /> : null}
                Lưu lại
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {}
      <Dialog open={showPublishConfirm} onOpenChange={(open) => { if (!open) { setShowPublishConfirm(false); setUnderstandPublish(false); } }}>
        <DialogContent className="sm:max-w-md bg-background border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">Xác nhận Publish lộ trình học</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Hành động này sẽ chính thức kích hoạt lộ trình học cho sinh viên.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Lộ trình sẽ mở khóa các bài học đầu tiên (entry nodes) cho <strong className="text-foreground font-bold">{students.length} học sinh</strong> đang enroll trong lớp học này.
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-500/10 p-3 rounded-md border border-amber-500/20">
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
                className="text-xs text-foreground/90 leading-tight cursor-pointer select-none font-medium"
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
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium border-transparent"
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

      {}
      <Dialog open={showUnpublishConfirm} onOpenChange={(open) => { if (!open) { setShowUnpublishConfirm(false); setUnderstandUnpublish(false); } }}>
        <DialogContent className="sm:max-w-md bg-background border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">Xác nhận rút lại lộ trình học (Unpublish)</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Rút lại lộ trình học để chỉnh sửa thêm bản nháp.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              Toàn bộ tiến độ học tập và ghi nhận bài học hiện tại của học sinh sẽ bị xóa sạch khỏi hệ thống.
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-500/10 p-3 rounded-md border border-red-500/20">
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
                className="text-xs text-foreground/90 leading-tight cursor-pointer select-none font-medium"
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
              className="bg-amber-600 hover:bg-amber-500 text-white font-medium border-transparent"
            >
              {actionState === 'unpublishing' ? <Loader className="size-4 animate-spin mr-1" /> : null}
              Xác nhận Unpublish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {}
      <Dialog open={showUnpublishError} onOpenChange={setShowUnpublishError}>
        <DialogContent className="sm:max-w-md bg-background border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="size-5 shrink-0" />
              <span>Không thể unpublish</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-muted-foreground leading-relaxed">
            {unpublishErrorMsg || 'Đã có học sinh hoàn thành node, không thể unpublish.'}
          </div>
          <DialogFooter className="sm:justify-end">
            <Button onClick={() => setShowUnpublishError(false)} className="bg-primary text-primary-foreground">
              Đồng ý
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-lg bg-background border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">Lịch sử xếp lớp học sinh</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Xem nhật ký phân loại học lực và đổi nhánh lộ trình của <span className="font-bold text-primary">{selectedStudentName}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-xs">
            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : levelHistory.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl bg-muted/10">
                <History className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
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
                    <div key={hist.id || idx} className="flex gap-4 items-start p-3 border border-border bg-card rounded-xl">
                      <div className="flex flex-col items-center justify-center bg-muted text-foreground p-2 rounded-lg font-bold shrink-0 min-w-10 text-center border border-border">
                        <span className="text-[10px] text-muted-foreground block uppercase font-medium">Mức mới</span>
                        <span className="text-sm font-extrabold text-foreground">{getLvlLabel(hist.newLevel)}</span>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-foreground">Lý do: {getReasonLabel(hist.reason)}</span>
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {new Date(hist.changedAt).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed text-[11px]">
                          Chuyển từ mức <span className="font-semibold text-foreground/90">{hist.oldLevel ? getLvlLabel(hist.oldLevel) : 'Chưa xếp lớp'}</span> sang mức <span className="font-semibold text-foreground/90">{getLvlLabel(hist.newLevel)}</span>.
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter className="sm:justify-end">
            <Button type="button" onClick={() => setIsHistoryOpen(false)} className="font-semibold bg-primary text-primary-foreground">
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className={`${detailTab === 'roadmap' ? 'sm:max-w-3xl' : 'sm:max-w-xl'} bg-background border-border shadow-2xl transition-all duration-300`}>
          <DialogHeader className="pb-3 border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <User className="size-5 text-primary" /> Thông tin chi tiết học sinh
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Xem hồ sơ học tập và lộ trình của học sinh trong lớp học.
            </DialogDescription>
          </DialogHeader>

          {selectedStudent && (
            <div className="py-4 space-y-4">
              {}
              <div className="flex items-center gap-4 bg-muted/30 p-4 border border-border rounded-2xl">
                <div className="size-12 bg-muted text-foreground rounded-full flex items-center justify-center font-extrabold text-lg border border-border">
                  {selectedStudent.fullName.split(' ').pop()?.charAt(0).toUpperCase() || 'S'}
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="font-bold text-foreground text-sm leading-none">{selectedStudent.fullName}</h4>
                  <div className="flex items-center gap-4 text-muted-foreground text-xs mt-1">
                    <span className="flex items-center gap-1 font-medium">
                      <span className="font-bold text-muted-foreground">Mã HS:</span> {selectedStudent.id}
                    </span>
                    {selectedStudent.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="size-3 text-muted-foreground" /> {selectedStudent.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {}
              <div className="flex border-b border-border gap-4 text-xs font-semibold text-muted-foreground">
                <button
                  type="button"
                  onClick={() => setDetailTab('info')}
                  className={`pb-2 px-1 relative transition-colors ${
                    detailTab === 'info' ? 'text-primary border-b-2 border-primary' : 'hover:text-foreground'
                  }`}
                >
                  Học lực & Lộ trình
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('history')}
                  className={`pb-2 px-1 relative transition-colors ${
                    detailTab === 'history' ? 'text-primary border-b-2 border-primary' : 'hover:text-foreground'
                  }`}
                >
                  Lịch sử xếp lớp
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDetailTab('roadmap');
                    if (!studentGraph && selectedStudent) {
                      fetchStudentGraph(selectedStudent.rawUserId);
                    }
                  }}
                  className={`pb-2 px-1 relative transition-colors ${
                    detailTab === 'roadmap' ? 'text-primary border-b-2 border-primary' : 'hover:text-foreground'
                  }`}
                >
                  Bản đồ lộ trình
                </button>
              </div>

              {}
              <div className="min-h-[220px]">
                {detailTab === 'info' && (
                  <div className="space-y-4 pt-1">
                    <div className="grid grid-cols-2 gap-4">
                      {}
                      <div className="p-3 border border-border rounded-xl bg-muted/10 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Phân loại học lực</span>
                        <div className="pt-1">
                          {(() => {
                            const label = selectedStudent.currentLevel === 1 ? 'Yếu' : selectedStudent.currentLevel === 2 ? 'Trung bình' : selectedStudent.currentLevel === 3 ? 'Khá' : 'Chưa phân loại';
                            const badgeColor = selectedStudent.currentLevel === 1
                              ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                              : selectedStudent.currentLevel === 2
                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                                : selectedStudent.currentLevel === 3
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-muted border-border text-muted-foreground';
                            return (
                              <Badge variant="outline" className={`text-xs font-bold border rounded-[6px] px-2 py-0.5 ${badgeColor}`}>
                                {label}
                              </Badge>
                            );
                          })()}
                        </div>
                      </div>

                      {}
                      <div className="p-3 border border-border rounded-xl bg-muted/10 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Lộ trình học tập</span>
                        <div className="pt-1 font-semibold text-foreground text-xs">
                          {selectedStudent.assignedPathName || (
                            <span className="text-muted-foreground italic font-normal">Chưa gán lộ trình</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {}
                    <div className="p-4 border border-border rounded-xl bg-muted/5 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-foreground flex items-center gap-1.5">
                          <TrendingUp className="size-4 text-primary" /> Tiến độ lộ trình
                        </span>
                        <span className="font-semibold text-foreground">0%</span>
                      </div>
                      <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                        <div className="bg-primary h-full rounded-full transition-all duration-300" style={{ width: '0%' }} />
                      </div>
                      <p className="text-[10.5px] text-muted-foreground leading-relaxed">
                        Học sinh đang học theo nhánh riêng biệt của mức năng lực <span className="font-semibold text-foreground">{selectedStudent.currentLevel === 1 ? 'Yếu' : selectedStudent.currentLevel === 2 ? 'Trung bình' : selectedStudent.currentLevel === 3 ? 'Khá' : 'Chưa phân loại'}</span>. Tiến độ sẽ tự động tăng khi học sinh làm bài test cổng phụ hoặc hoàn thành bài học.
                      </p>
                    </div>
                    {selectedStudent.currentLevel != null && (
                      <div className="pt-2">
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => handleResetPlacement(selectedStudent.rawUserId)}
                          disabled={resettingPlacement}
                          className="w-full font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all"
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
                      <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl bg-muted/10">
                        <History className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
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
                            <div key={hist.id || idx} className="flex gap-3 items-start p-2.5 border border-border bg-card rounded-xl">
                              <div className="flex flex-col items-center justify-center bg-muted text-foreground border border-border p-1.5 rounded-lg font-bold shrink-0 min-w-10 text-center">
                                <span className="text-[9px] text-muted-foreground block uppercase font-medium">Mức mới</span>
                                <span className="text-xs font-extrabold text-foreground">{getLvlLabel(hist.newLevel)}</span>
                              </div>
                              <div className="flex-1 space-y-0.5">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-foreground">Lý do: {getReasonLabel(hist.reason)}</span>
                                  <span className="text-[9px] text-muted-foreground">
                                    {new Date(hist.changedAt).toLocaleString('vi-VN')}
                                  </span>
                                </div>
                                <p className="text-muted-foreground leading-relaxed text-[10.5px]">
                                  Chuyển từ mức <span className="font-semibold text-foreground">{hist.oldLevel ? getLvlLabel(hist.oldLevel) : 'Chưa xếp lớp'}</span> sang mức <span className="font-semibold text-foreground">{getLvlLabel(hist.newLevel)}</span>.
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {detailTab === 'roadmap' && (
                  <div className="space-y-4 pt-1 max-h-[500px] overflow-y-auto pr-1">
                    {studentGraphLoading ? (
                      <div className="flex flex-col items-center justify-center py-16 gap-2">
                        <Loader className="w-8 h-8 animate-spin text-primary" />
                        <span className="text-xs text-muted-foreground">Đang tải sơ đồ lộ trình học sinh...</span>
                      </div>
                    ) : !studentGraph || !studentGraph.nodes?.length ? (
                      <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl bg-muted/10">
                        <History className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                        <p className="text-xs font-semibold">Học sinh này chưa bắt đầu lộ trình.</p>
                      </div>
                    ) : (
                      <div className="border border-border rounded-2xl p-4 bg-muted/10 overflow-x-auto relative">
                        <div className="flex items-center justify-between text-[11px] mb-4 bg-card border border-border p-3 rounded-xl gap-4">
                          <span className="font-bold text-foreground">Chú giải ký hiệu:</span>
                          <div className="flex items-center gap-4 flex-wrap">
                            <span className="flex items-center gap-1 font-medium text-foreground">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 border border-white" /> Đã học
                            </span>
                            <span className="flex items-center gap-1 font-medium text-foreground">
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-600 border border-white" /> Khóa (Sẽ học)
                            </span>
                            <span className="flex items-center gap-1 font-medium text-muted-foreground/60">
                              <span className="w-2.5 h-2.5 rounded-full bg-muted border border-white opacity-60" /> Mức khác (Không học)
                            </span>
                          </div>
                        </div>
                        <LearningPathFlow
                          nodes={studentGraph.nodes}
                          edges={studentGraph.edges || []}
                          highlightLevel={selectedStudent?.currentLevel}
                          onNodeClick={(node) => {
                            toast.info(`Bài học: ${node.title} (${node.studentStatus === 'COMPLETED' ? 'Đã hoàn thành' : node.studentStatus === 'LOCKED' ? 'Đang khóa' : 'Đang học'})`);
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-border pt-3 sm:justify-end">
            <Button type="button" onClick={() => setIsDetailOpen(false)} className="font-semibold bg-primary text-primary-foreground">
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {}
      {activeTab === 'support' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-border shadow-xs rounded-2xl bg-card text-card-foreground">
              <CardHeader className="border-b border-border pb-4 flex flex-row items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
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
                    className="border-border text-foreground hover:bg-accent gap-2"
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
                  <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl bg-muted/30">
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
                            className="border border-border rounded-xl p-4 bg-muted/20 space-y-3"
                          >
                            <div className="flex justify-between items-center pb-2 border-b border-border flex-wrap gap-2">
                              <div>
                                <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                                  <div className="size-2 rounded-full bg-emerald-500" />
                                  {mentor.fullName}
                                  <span className="text-[10px] text-muted-foreground font-normal">({mentor.id})</span>
                                </h4>
                                <p className="text-xs text-muted-foreground">{mentor.email}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedSubMentor(mentor);
                                    setIsAssignStudentModalOpen(true);
                                  }}
                                  className="h-7 text-xs rounded-lg flex items-center gap-1 font-semibold"
                                >
                                  <Plus className="size-3.5" /> Thêm học sinh kèm
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleToggleSubMentor(mentor)}
                                  className="h-7 text-xs border-border text-muted-foreground hover:bg-accent rounded-lg flex items-center gap-1"
                                >
                                  <UserMinus className="size-3.5 text-rose-500" /> Hủy trợ giảng
                                </Button>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Học sinh phụ trách ({mentorAssignments.length})</span>
                              {mentorAssignments.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic">Chưa gán học sinh nào vào nhóm kèm cặp của trợ giảng này.</p>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {mentorAssignments.map(a => (
                                    <div
                                      key={a.id}
                                      className="flex items-center justify-between p-2 border border-border bg-card rounded-lg text-xs"
                                    >
                                      <div>
                                        <p className="font-semibold text-foreground">{a.studentName}</p>
                                        <p className="text-[10px] text-muted-foreground">{a.studentEmail}</p>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDeleteAssignment(a.id)}
                                        className="h-6 w-6 p-0 text-muted-foreground hover:text-rose-600 rounded-md"
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

          {}
          <div className="space-y-6">
            <Card className="border border-border shadow-xs rounded-2xl bg-card text-card-foreground h-full flex flex-col justify-between">
              <div>
                <CardHeader className="border-b border-border pb-4">
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
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
                    <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl bg-muted/30">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-foreground mb-1">Hoàn thành!</p>
                      <p className="text-[11px] text-muted-foreground leading-normal px-4">Không có câu hỏi nào cần giải quyết hiện tại.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                      {escalatedTickets.map((ticket) => (
                        <div
                          key={ticket.ticketId}
                          className="border border-border rounded-xl p-3 bg-rose-500/5 space-y-2 border-l-4 border-l-rose-500"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-foreground text-xs">{ticket.studentName}</p>
                              <p className="text-[9px] text-muted-foreground">
                                {new Date(ticket.createdAt).toLocaleString('vi-VN')}
                              </p>
                            </div>
                            <Badge className="bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-400 text-[9px] font-bold">
                              LEO THANG
                            </Badge>
                          </div>
                          <div className="p-2 border border-border bg-background rounded-lg text-xs text-muted-foreground leading-relaxed font-mono whitespace-pre-wrap">
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
                              className="h-7 text-xs font-bold"
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

      {}
      <Dialog open={isAssignStudentModalOpen} onOpenChange={setIsAssignStudentModalOpen}>
        <DialogContent className="sm:max-w-md bg-background border-border shadow-2xl">
          <DialogHeader className="pb-3 border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <UserCheck className="size-5 text-primary" /> Thêm học sinh kèm cặp
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Giao phó học sinh cho trợ giảng <strong className="text-foreground font-bold">{selectedSubMentor?.fullName}</strong> kèm cặp.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateAssignment}>
            <div className="py-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">Chọn học sinh trong lớp:</label>
                <div className="max-h-[250px] overflow-y-auto pr-2 space-y-2 py-2 border border-border rounded-xl bg-muted/20 p-2">
                  {students.filter(s => {
                    if (s.classroomSubjectStudentId === selectedSubMentor?.classroomSubjectStudentId) return false;
                    const isAssignedToAny = assignments.some(
                      a => a.studentCssId === s.classroomSubjectStudentId
                    );
                    return !isAssignedToAny;
                  }).length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Tất cả học sinh khả dụng đã được gán.</p>
                  ) : (
                    students.filter(s => {
                      if (s.classroomSubjectStudentId === selectedSubMentor?.classroomSubjectStudentId) return false;
                      const isAssignedToAny = assignments.some(
                        a => a.studentCssId === s.classroomSubjectStudentId
                      );
                      return !isAssignedToAny;
                    }).map(s => (
                      <label key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 border border-transparent hover:border-border cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-border bg-background focus:ring-primary text-foreground"
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
                          <p className="text-sm font-semibold text-foreground">{s.fullName}</p>
                          <p className="text-xs text-muted-foreground">{s.id} {s.isSubmentor ? " [Trợ giảng]" : ""}</p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-border pt-3 flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAssignStudentModalOpen(false);
                  setSelectedStudentsToAssign([]);
                }}
                className="h-9 rounded-xl text-xs border-border"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={submittingAssignment || selectedStudentsToAssign.length === 0}
                className="h-9 rounded-xl text-xs font-semibold bg-primary text-primary-foreground"
              >
                {submittingAssignment ? <Loader className="size-3.5 animate-spin mr-1" /> : null}
                Lưu phân công
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {}
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
                className="h-9 rounded-xl text-xs font-semibold"
              >
                {submittingResponse ? <Loader className="size-3.5 animate-spin mr-1" /> : null}
                Gửi câu trả lời
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {}
      {selectedExerciseId && (
        <Dialog open={!!selectedExerciseId} onOpenChange={() => {
          setSelectedExerciseId(null);
          setGradingSubmission(null);
        }}>
          <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-white shrink-0">
              <DialogTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Chấm bài thực hành: {selectedExerciseTitle}
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-hidden grid grid-cols-12 min-h-[50vh]">
              {}
              <div className="col-span-5 border-r border-slate-100 overflow-y-auto p-4 bg-slate-50/50">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Danh sách bài nộp</h4>
                {loadingSubmissions ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <Loader className="w-5 h-5 animate-spin text-indigo-600" />
                    <span className="text-[10px] text-slate-500 font-medium">Đang tải...</span>
                  </div>
                ) : submissionsList.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white p-4">
                    <p className="text-[11px] font-medium text-slate-500">Chưa có học sinh nào nộp bài.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {submissionsList.map((sub) => {
                      const isSelected = gradingSubmission?.submissionId === sub.submissionId;
                      return (
                        <div
                          key={sub.submissionId}
                          onClick={() => handleOpenGrading(sub)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-50/40 border-indigo-200 shadow-sm'
                              : 'bg-white border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-800 text-xs">
                              {sub.studentName} {sub.status === 'GRADED' ? `(${sub.grade}/10)` : ''}
                            </span>
                            {sub.status === 'GRADED' ? (
                              <Badge className="text-[8px] font-bold text-emerald-700 bg-emerald-50 border-emerald-150 rounded-[4px] px-1 py-0 border">
                                Đã chấm
                              </Badge>
                            ) : (
                              <Badge className="text-[8px] font-bold text-amber-700 bg-amber-50 border-amber-150 rounded-[4px] px-1 py-0 border">
                                Chờ chấm
                              </Badge>
                            )}
                          </div>
                          <div className="text-[9px] text-slate-400 mt-1">
                            Nộp: {new Date(sub.submittedAt).toLocaleString('vi-VN')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {}
              <div className="col-span-7 overflow-y-auto p-6 bg-white flex flex-col">
                {gradingSubmission ? (
                  <form onSubmit={handleSaveGrade} className="space-y-4 text-xs flex-1 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="border-b border-slate-100 pb-3">
                        <h3 className="font-bold text-slate-800 text-sm">
                          Bài làm của: {gradingSubmission.studentName}
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Trạng thái: {gradingSubmission.status === 'GRADED' ? 'Đã chấm điểm (Khóa chỉnh sửa)' : 'Đang chờ chấm điểm'}
                        </p>
                      </div>

                      {gradingSubmission.content && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Nội dung bài làm</label>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 max-h-44 overflow-y-auto whitespace-pre-wrap leading-relaxed text-slate-800">
                            {gradingSubmission.content}
                          </div>
                        </div>
                      )}

                      {gradingSubmission.fileUrl && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">File đính kèm</label>
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-3">
                            <span className="font-semibold text-slate-650 truncate max-w-xs">{gradingSubmission.fileUrl.split('/').pop()}</span>
                            <a
                              href={resolveAssetUrl(gradingSubmission.fileUrl)}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700 transition-colors text-[10px]"
                            >
                              Tải về / Xem tệp
                            </a>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5 col-span-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Điểm số (0 - 10) *</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            required
                            disabled={gradingSubmission.status === 'GRADED'}
                            placeholder="VD: 8.5"
                            className="w-full border border-slate-200 disabled:bg-slate-50 disabled:text-slate-500 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-indigo-500 text-slate-800 bg-white"
                            value={gradeValue}
                            onChange={(e) => setGradeValue(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5 col-span-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Nhận xét của giảng viên</label>
                          <input
                            type="text"
                            disabled={gradingSubmission.status === 'GRADED'}
                            placeholder={gradingSubmission.status === 'GRADED' ? "Không có nhận xét nào" : "Nhập nhận xét hoặc feedback..."}
                            className="w-full border border-slate-200 disabled:bg-slate-50 disabled:text-slate-500 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-800 bg-white"
                            value={feedbackValue}
                            onChange={(e) => setFeedbackValue(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4 mt-6 flex justify-end gap-2">
                      {gradingSubmission.status !== 'GRADED' ? (
                        <Button
                          type="submit"
                          disabled={submittingGrade}
                          className="h-8 px-4 rounded-xl text-xs font-semibold"
                        >
                          {submittingGrade ? <Loader className="size-3 animate-spin mr-1" /> : null}
                          Lưu điểm & Khóa bài
                        </Button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic py-2">
                          Bài nộp này đã được chấm và khóa chỉnh sửa.
                        </span>
                      )}
                    </div>
                  </form>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center gap-2 py-20">
                    <Users className="w-8 h-8 text-slate-300" />
                    <p className="text-xs font-medium">Chọn một học sinh từ danh sách bên trái để chấm điểm.</p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="p-4 border-t border-slate-100 shrink-0 bg-white">
              <Button type="button" onClick={() => {
                setSelectedExerciseId(null);
                setGradingSubmission(null);
              }} className="rounded-xl text-xs py-2 px-4 shadow-sm">
                Đóng
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={isAssignSubMentorModalOpen} onOpenChange={setIsAssignSubMentorModalOpen}>
        <DialogContent className="sm:max-w-md bg-background border-border shadow-2xl">
          <DialogHeader className="pb-3 border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <UserPlus className="size-5 text-primary" /> Chỉ định trợ giảng
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Chọn các học sinh để cấp quyền trợ giảng trong lớp này.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 py-2">
            {students.filter(s => !s.isSubmentor).length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Không có học sinh nào khả dụng.</p>
            ) : (
              students.filter(s => !s.isSubmentor).map(s => (
                <label key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 border border-transparent hover:border-border cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-border bg-background focus:ring-primary text-foreground"
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
                    <p className="text-sm font-semibold text-foreground">{s.fullName}</p>
                    <p className="text-xs text-muted-foreground">{s.id}</p>
                  </div>
                </label>
              ))
            )}
          </div>

          <DialogFooter className="border-t border-border pt-3 flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAssignSubMentorModalOpen(false);
                setAssignSubMentorIds([]);
              }}
              className="h-9 rounded-xl text-xs border-border"
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirmAssignSubMentors}
              className="h-9 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-primary text-primary-foreground"
              disabled={assignSubMentorIds.length === 0 || loadingSupport}
            >
              <Save className="size-3.5" />
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {}
      <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <DialogContent className="sm:max-w-md bg-background border-border shadow-2xl text-xs">
          <DialogHeader className="pb-3 border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <Calendar className="size-5 text-primary" /> Xếp lịch học trên lớp
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Xếp ca học và ngày học cho bài học: <strong className="text-primary font-bold">"{schedulingNode?.title}"</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {scheduleConflict?.hasConflict && (
              <div className="bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-800 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-red-700 dark:text-red-300 font-bold">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Cảnh báo trùng lịch học!</span>
                </div>
                <div className="space-y-1.5 text-[11px] text-red-650 dark:text-red-400">
                  {scheduleConflict.teacherConflictMessage && (
                    <p className="leading-relaxed">• {scheduleConflict.teacherConflictMessage}</p>
                  )}
                  {scheduleConflict.studentConflicts && scheduleConflict.studentConflicts.length > 0 && (
                    <div className="space-y-1">
                      <p className="font-bold">• Trùng lịch học của ({scheduleConflict.studentConflicts.length}) sinh viên:</p>
                      <div className="max-h-24 overflow-y-auto pl-2 space-y-0.5 font-mono text-[10px] text-red-600 dark:text-red-400/90 leading-tight">
                        {scheduleConflict.studentConflicts.map((st: any, sIdx: number) => (
                          <div key={sIdx}>
                            - {st.studentName} ({st.email}): Trùng ca học ở môn {st.conflictingSubjectName} (Lớp {st.conflictingClassName})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="pt-1">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => handleSaveSchedule(true)}
                    className="w-full text-xs h-8 font-semibold"
                    disabled={savingSchedule}
                  >
                    Cưỡng bức xếp lịch (Vẫn xếp ca này)
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="font-bold text-foreground">Ngày học</label>
              <input
                type="date"
                className="w-full border border-border rounded-xl px-3 py-2 text-xs bg-background text-foreground outline-none focus:border-primary/50"
                value={scheduleDate}
                onChange={(e) => {
                  setScheduleDate(e.target.value);
                  setScheduleConflict(null); 
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-foreground">Ca học (Slot)</label>
              <Select
                value={scheduleSlotId ? String(scheduleSlotId) : "none"}
                onValueChange={(value) => {
                  setScheduleSlotId(value === "none" ? "" : value);
                  setScheduleConflict(null); 
                }}
              >
                <SelectTrigger className="w-full bg-background border-border rounded-xl h-9 text-foreground text-xs outline-none focus-visible:ring-0 shadow-none">
                  <SelectValue placeholder="-- Chọn ca học --" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="none">-- Chọn ca học --</SelectItem>
                  {slotsList.map((slot) => (
                    <SelectItem key={slot.slotId} value={String(slot.slotId)}>
                      {slot.slotName} ({slot.startTime.substring(0, 5)} - {slot.endTime.substring(0, 5)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          </div>

          <DialogFooter className="border-t border-border pt-3 flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleClearSchedule}
              disabled={savingSchedule}
              className="h-9 rounded-xl text-xs text-destructive hover:bg-destructive/10"
            >
              Hủy lịch học
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsScheduleModalOpen(false)}
              className="h-9 rounded-xl text-xs"
            >
              Đóng
            </Button>
            <Button
              type="button"
              onClick={() => handleSaveSchedule(false)}
              disabled={savingSchedule}
              className="h-9 rounded-xl text-xs font-semibold"
            >
              {savingSchedule ? <Loader className="size-3.5 animate-spin mr-1" /> : null}
              Lưu lịch học
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {}
      <Dialog open={!!monitorTest} onOpenChange={(open) => { if (!open) setMonitorTest(null); }}>
        <DialogContent className="sm:max-w-2xl bg-background border-border shadow-2xl text-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <Activity className="size-5 text-primary" /> Theo dõi bài làm — {monitorTest?.title}
            </DialogTitle>
          </DialogHeader>

          {(() => {
            const doing = monitorAttempts.filter((a) => a.status === 'IN_PROGRESS');
            const cheaters = monitorAttempts
              .filter((a) => (a.tabOutCount ?? 0) > 0 && a.status !== 'CANCELLED')
              .sort((x, y) => (y.tabOutCount ?? 0) - (x.tabOutCount ?? 0));
            const pendingGrade = monitorAttempts.filter((a) => a.status === 'PENDING_REVIEW');
            const tabOutBadge = (count: number) => (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-[6px] border ${
                count >= 3
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400'
              }`}>
                {count} lần rời tab
              </span>
            );
            return (
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-border pb-2">
                  <button
                    onClick={() => setMonitorTab('doing')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      monitorTab === 'doing' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Đang làm ({doing.length})
                  </button>
                  <button
                    onClick={() => setMonitorTab('cheat')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      monitorTab === 'cheat' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Cảnh báo gian lận ({cheaters.length})
                  </button>
                  <button
                    onClick={() => setMonitorTab('grading')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      monitorTab === 'grading' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Chờ chấm tự luận ({pendingGrade.length})
                  </button>
                  <span className="ml-auto text-[10px] text-muted-foreground italic">Tự làm mới mỗi 10 giây</span>
                </div>

                {monitorLoading ? (
                  <div className="flex items-center justify-center py-10 text-muted-foreground">
                    <Loader className="size-5 animate-spin" />
                  </div>
                ) : monitorTab === 'doing' ? (
                  doing.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-6 text-center">Chưa có học sinh nào đang làm bài.</p>
                  ) : (
                    <div className="max-h-[50vh] overflow-y-auto divide-y divide-border border border-border rounded-xl">
                      {doing.map((a) => (
                        <div key={a.attemptId} className="flex items-center gap-3 p-2.5">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground truncate">{a.studentName || a.studentEmail || `HS #${a.studentId}`}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{a.studentEmail}</p>
                          </div>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            Bắt đầu: {a.startedAt ? new Date(a.startedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </span>
                          {(a.tabOutCount ?? 0) > 0 && tabOutBadge(a.tabOutCount ?? 0)}
                        </div>
                      ))}
                    </div>
                  )
                ) : monitorTab === 'cheat' ? (
                  cheaters.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-6 text-center">Chưa ghi nhận học sinh nào rời tab khi làm bài.</p>
                  ) : (
                    <div className="max-h-[50vh] overflow-y-auto divide-y divide-border border border-border rounded-xl">
                      {cheaters.map((a) => (
                        <div key={a.attemptId} className="flex items-center gap-3 p-2.5">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground truncate">{a.studentName || a.studentEmail || `HS #${a.studentId}`}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{a.studentEmail}</p>
                          </div>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {a.status === 'IN_PROGRESS' ? 'Đang làm' : a.score != null ? `Đã nộp — ${a.score} điểm` : 'Đã nộp'}
                          </span>
                          {tabOutBadge(a.tabOutCount ?? 0)}
                        </div>
                      ))}
                    </div>
                  )
                ) : pendingGrade.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-6 text-center">Không có bài nào chờ chấm tự luận.</p>
                ) : (
                  <div className="max-h-[50vh] overflow-y-auto divide-y divide-border border border-border rounded-xl">
                    {pendingGrade.map((a) => (
                      <div key={a.attemptId} className="flex items-center gap-3 p-2.5">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">{a.studentName || a.studentEmail || `HS #${a.studentId}`}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            Nộp lúc: {a.submittedAt ? new Date(a.submittedAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '—'}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => openEssayGrading(a.attemptId)}
                          disabled={gradingLoading}
                          className="h-7 rounded-lg text-[10px] font-bold px-2.5"
                        >
                          Chấm tự luận
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {}
      <Dialog open={!!gradingAttempt} onOpenChange={(open) => { if (!open) setGradingAttempt(null); }}>
        <DialogContent className="sm:max-w-2xl bg-background border-border shadow-2xl text-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <Activity className="size-5 text-primary" />
              Chấm tự luận — {gradingAttempt?.studentName || `HS #${gradingAttempt?.studentId}`}
            </DialogTitle>
            <p className="text-[11px] text-muted-foreground">
              {gradingAttempt?.testTitle} · Câu trắc nghiệm đã được chấm tự động.
              Chấm đủ mọi câu tự luận thì hệ thống chốt điểm và xếp mức/mở bài cho học sinh.
            </p>
          </DialogHeader>

          <div className="max-h-[55vh] overflow-y-auto space-y-2.5 pr-1">
            {(gradingAttempt?.responses ?? []).map((r, idx) => {
              const isEssay = r.questionType === 'ESSAY';
              const pendingEssay = isEssay && r.isCorrect == null;
              const mark = essayMarks[r.responseId];
              return (
                <div key={r.responseId} className="border border-border rounded-xl p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-foreground text-[11.5px] leading-snug">
                      Câu {idx + 1}. {r.questionContent}
                    </p>
                    <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-[6px] border uppercase ${
                      isEssay
                        ? 'bg-violet-500/10 border-violet-500/20 text-violet-700 dark:text-violet-400'
                        : 'bg-muted border-border text-muted-foreground'
                    }`}>
                      {isEssay ? 'Tự luận' : 'Tự chấm'}
                    </span>
                  </div>

                  <div className="bg-muted/40 border border-border rounded-lg p-2 text-[11px] text-foreground whitespace-pre-wrap break-words">
                    {isEssay || r.questionType === 'SHORT_ANSWER'
                      ? (r.responseText?.trim() ? r.responseText : <span className="italic text-muted-foreground">Học sinh không trả lời</span>)
                      : (r.selectedAnswers && r.selectedAnswers.length > 0
                          ? r.selectedAnswers.join(', ')
                          : <span className="italic text-muted-foreground">Không chọn đáp án</span>)}
                  </div>

                  {pendingEssay ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Chấm:</span>
                      <button
                        onClick={() => setEssayMarks((prev) => ({ ...prev, [r.responseId]: true }))}
                        className={`px-3 py-1 rounded-lg text-[10.5px] font-bold border transition-colors ${
                          mark === true
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20'
                        }`}
                      >
                        Đạt (+{r.maxScore} điểm)
                      </button>
                      <button
                        onClick={() => setEssayMarks((prev) => ({ ...prev, [r.responseId]: false }))}
                        className={`px-3 py-1 rounded-lg text-[10.5px] font-bold border transition-colors ${
                          mark === false
                            ? 'bg-rose-600 border-rose-600 text-white'
                            : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400 hover:bg-rose-500/20'
                        }`}
                      >
                        Không đạt (0 điểm)
                      </button>
                    </div>
                  ) : (
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-[6px] border ${
                      r.isCorrect
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400'
                    }`}>
                      {r.isCorrect ? `Đúng · +${r.maxScore} điểm` : 'Sai · 0 điểm'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setGradingAttempt(null)}
              className="h-9 rounded-xl text-xs font-semibold"
            >
              Đóng
            </Button>
            <Button
              type="button"
              onClick={handleSaveEssayGrades}
              disabled={savingEssayGrades || gradingAttempt?.status !== 'PENDING_REVIEW'}
              className="h-9 rounded-xl text-xs font-semibold"
            >
              {savingEssayGrades ? <Loader className="size-3.5 animate-spin mr-1" /> : null}
              Lưu kết quả chấm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
