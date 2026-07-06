import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  BookOpen, 
  Award, 
  History, 
  FileText, 
  CheckCircle2, 
  Circle, 
  Lock, 
  Play, 
  ArrowRight, 
  Loader2, 
  GraduationCap, 
  TrendingUp, 
  User, 
  Mail, 
  ChevronRight, 
  ChevronDown,
  BookMarked,
  Search,
  AlertTriangle,
  MessageSquare,
  Check,
  Send,
  ShieldAlert,
  Upload
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { classroomService } from '../../services/classroom.service';
import { studentService, type SubmissionResponse } from '../../services/student.service';
import { MaterialPreview, resolveAssetUrl } from '../../components/learningPath/MaterialPreview';
import type { ClassroomSubjectResponse } from '../../types/classroomSubject';
import type { SupportTicketResponse } from '../../types/submentor';
import type { LearningNodeResponse, NodeContentResponse } from '../../services/learningPath.service';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';

export function StudentCoursesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [subjects, setSubjects] = useState<ClassroomSubjectResponse[]>([]);
  const [subjectLevels, setSubjectLevels] = useState<Record<number, number | null>>({});
  const [subjectProgress, setSubjectProgress] = useState<Record<number, { completed: number; total: number }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Roadmap Modal State
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<ClassroomSubjectResponse | null>(null);
  const [nodes, setNodes] = useState<LearningNodeResponse[]>([]);
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [expandedNodeId, setExpandedNodeId] = useState<number | null>(null);
  const [nodeContents, setNodeContents] = useState<Record<number, NodeContentResponse>>({});
  const [loadingNodeContent, setLoadingNodeContent] = useState<Record<number, boolean>>({});

  // Exercise states
  const [exerciseSubmissions, setExerciseSubmissions] = useState<Record<number, SubmissionResponse | null>>({});
  const [selectedExercise, setSelectedExercise] = useState<any | null>(null);
  const [exerciseText, setExerciseText] = useState('');
  const [exerciseFile, setExerciseFile] = useState<File | null>(null);
  const [submittingExercise, setSubmittingExercise] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState<SubmissionResponse | null>(null);

  // Sub-mentor Support Modal State
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [subMentorSubject, setSubMentorSubject] = useState<ClassroomSubjectResponse | null>(null);

  const handleOpenSupport = (subject: ClassroomSubjectResponse) => {
    setSubMentorSubject(subject);
    setIsSupportModalOpen(true);
  };

  // Student Support Ticket creation State
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState<ClassroomSubjectResponse | null>(null);
  const [ticketQuestion, setTicketQuestion] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [ticketModalTab, setTicketModalTab] = useState<'ask' | 'history'>('ask');
  const [myTickets, setMyTickets] = useState<SupportTicketResponse[]>([]);
  const [loadingMyTickets, setLoadingMyTickets] = useState(false);

  const fetchMyTickets = async (csId: number) => {
    try {
      setLoadingMyTickets(true);
      const tickets = await studentService.listMyTickets(csId);
      setMyTickets(tickets || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể tải danh sách câu hỏi của bạn");
    } finally {
      setLoadingMyTickets(false);
    }
  };

  const handleOpenCreateTicket = (subject: ClassroomSubjectResponse) => {
    setTicketSubject(subject);
    setTicketQuestion('');
    setTicketModalTab('ask');
    setIsCreateTicketOpen(true);
    fetchMyTickets(subject.classroomSubjectId);
  };

  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketQuestion.trim()) {
      toast.error("Vui lòng nhập nội dung câu hỏi");
      return;
    }
    try {
      setSubmittingTicket(true);
      await studentService.createSupportTicket({
        classroomSubjectId: ticketSubject.classroomSubjectId,
        messageStudent: ticketQuestion.trim()
      });
      toast.success("Đã gửi câu hỏi hỗ trợ thành công. Trợ giảng trong lớp sẽ phản hồi sớm nhất có thể!");
      setTicketQuestion('');
      setTicketModalTab('history');
      fetchMyTickets(ticketSubject.classroomSubjectId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể gửi câu hỏi hỗ trợ");
    } finally {
      setSubmittingTicket(false);
    }
  };

  useEffect(() => {
    const fetchCoursesData = async () => {
      if (!user?.userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch enrolled classroom subjects
        const enrolledSubjects = await classroomService.getClassroomSubjectsByStudent(user.userId);
        setSubjects(enrolledSubjects || []);

        // Load level history and graph progress for each subject in parallel
        const levelsMap: Record<number, number | null> = {};
        const progressMap: Record<number, { completed: number; total: number }> = {};

        await Promise.all(
          (enrolledSubjects || []).map(async (s) => {
            // Fetch level history
            try {
              const history = await studentService.getLevelHistory(s.classroomSubjectId);
              if (history && history.length > 0) {
                const latest = history[history.length - 1];
                levelsMap[s.classroomSubjectId] = latest.newLevel;
              } else {
                levelsMap[s.classroomSubjectId] = null;
              }
            } catch {
              levelsMap[s.classroomSubjectId] = null;
            }

            // Fetch graph to calculate node progress
            try {
              const graph = await studentService.getClassroomSubjectGraph(s.classroomSubjectId);
              if (graph && graph.nodes && graph.nodes.length > 0) {
                const completedCount = graph.nodes.filter(n => n.studentStatus === 'COMPLETED').length;
                progressMap[s.classroomSubjectId] = {
                  completed: completedCount,
                  total: graph.nodes.length
                };
              } else {
                progressMap[s.classroomSubjectId] = { completed: 0, total: 0 };
              }
            } catch {
              progressMap[s.classroomSubjectId] = { completed: 0, total: 0 };
            }
          })
        );

        setSubjectLevels(levelsMap);
        setSubjectProgress(progressMap);
      } catch (err: any) {
        console.error('Error fetching student courses:', err);
        setError(err.response?.data?.message || 'Không thể tải danh sách khóa học. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchCoursesData();
  }, [user?.userId]);

  const handleOpenRoadmap = async (cs: ClassroomSubjectResponse) => {
    setSelectedSubject(cs);
    setIsRoadmapOpen(true);
    setLoadingGraph(true);
    setExpandedNodeId(null);
    setNodeContents({});
    try {
      const graph = await studentService.getClassroomSubjectGraph(cs.classroomSubjectId);
      const sortedNodes = (graph.nodes || []).sort((a, b) => a.displayOrder - b.displayOrder);
      setNodes(sortedNodes);
    } catch (err: any) {
      console.error("Failed to load roadmap graph:", err);
      toast.error("Không thể tải lộ trình học tập");
      setIsRoadmapOpen(false);
    } finally {
      setLoadingGraph(false);
    }
  };

  const handleToggleNode = async (nodeId: number, studentStatus: string | undefined) => {
    if (studentStatus === 'LOCKED') {
      toast.error("Bài học này đang bị khóa. Hãy hoàn thành các bài học trước!");
      return;
    }
    
    if (expandedNodeId === nodeId) {
      setExpandedNodeId(null);
      return;
    }

    setExpandedNodeId(nodeId);

    const alreadyLoaded = !!nodeContents[nodeId];
    if (alreadyLoaded) {
      // Refresh submissions
      const content = nodeContents[nodeId];
      if (content.exercises && content.exercises.length > 0) {
        content.exercises.forEach(async (ex) => {
          try {
            const sub = await studentService.getMySubmission(ex.exerciseId);
            setExerciseSubmissions(prev => ({ ...prev, [ex.exerciseId]: sub }));
          } catch (err) {
            setExerciseSubmissions(prev => ({ ...prev, [ex.exerciseId]: null }));
          }
        });
      }
      return;
    }

    setLoadingNodeContent(prev => ({ ...prev, [nodeId]: true }));
    try {
      const content = await studentService.getNodeContent(nodeId);
      setNodeContents(prev => ({ ...prev, [nodeId]: content }));

      if (content.exercises && content.exercises.length > 0) {
        content.exercises.forEach(async (ex) => {
          try {
            const sub = await studentService.getMySubmission(ex.exerciseId);
            setExerciseSubmissions(prev => ({ ...prev, [ex.exerciseId]: sub }));
          } catch (err) {
            setExerciseSubmissions(prev => ({ ...prev, [ex.exerciseId]: null }));
          }
        });
      }
    } catch (err) {
      console.error("Failed to load node content:", err);
      toast.error("Không thể tải nội dung bài học");
    } finally {
      setLoadingNodeContent(prev => ({ ...prev, [nodeId]: false }));
    }
  };

  const handleOpenExerciseModal = (exercise: any) => {
    const existing = exerciseSubmissions[exercise.exerciseId];
    setSelectedExercise(exercise);
    setExerciseText(existing?.content || '');
    setExerciseFile(null);
  };

  const handleCloseExerciseModal = () => {
    setSelectedExercise(null);
    setExerciseText('');
    setExerciseFile(null);
  };

  const handleExerciseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExercise) return;

    if (selectedExercise.allowText && !exerciseText.trim()) {
      toast.error('Vui lòng điền nội dung tự luận.');
      return;
    }

    if (selectedExercise.allowFile && !exerciseFile) {
      const existing = exerciseSubmissions[selectedExercise.exerciseId];
      if (!existing?.fileUrl) {
        toast.error('Vui lòng chọn file để nộp.');
        return;
      }
    }

    try {
      setSubmittingExercise(true);
      const res = await studentService.submitExercise(
        selectedExercise.exerciseId,
        selectedExercise.allowText ? exerciseText : undefined,
        selectedExercise.allowFile ? exerciseFile || undefined : undefined
      );

      setExerciseSubmissions((prev) => ({ ...prev, [selectedExercise.exerciseId]: res }));
      toast.success('Nộp bài tập thực hành thành công!');
      handleCloseExerciseModal();
    } catch (err: any) {
      console.error('Lỗi khi nộp bài tập:', err);
      toast.error(err.message || 'Không thể nộp bài tập.');
    } finally {
      setSubmittingExercise(false);
    }
  };

  const filteredSubjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return subjects;
    return subjects.filter(
      (c) =>
        c.subjectName.toLowerCase().includes(query) ||
        c.subjectCode.toLowerCase().includes(query) ||
        c.className.toLowerCase().includes(query)
    );
  }, [subjects, searchQuery]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-9 h-9 animate-spin text-[#030213]" />
        <span className="text-sm text-slate-500 font-medium">Đang tải danh sách khóa học của bạn...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <AlertTriangle className="w-12 h-12 text-rose-500" />
        <p className="text-slate-800 font-semibold">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 bg-[#030213] text-white rounded-xl hover:bg-[#1c1b2d] transition-all text-sm font-bold shadow-sm"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <BookMarked className="w-6 h-6 text-primary" /> Khóa học của tôi
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Xem và quản lý tất cả các môn học bạn đang tham gia trong học kỳ này.
          </p>
        </div>
        
        {/* Search bar */}
        <div className="relative w-full sm:w-64">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search className="size-4" />
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm môn học..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white placeholder-slate-400 text-slate-850"
          />
        </div>
      </div>

      {/* Courses Cards Grid */}
      {filteredSubjects.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
          <BookOpen className="size-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-semibold">Không tìm thấy khóa học nào phù hợp.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map((c) => {
            const currentLevel = subjectLevels[c.classroomSubjectId];
            const progress = subjectProgress[c.classroomSubjectId] || { completed: 0, total: 0 };
            
            const progressPercent = progress.total > 0 
              ? Math.round((progress.completed / progress.total) * 100) 
              : 0;

            const getLvlLabel = (lvl: number | null | undefined) => {
              if (lvl === 1) return 'Yếu';
              if (lvl === 2) return 'Trung bình';
              if (lvl === 3) return 'Khá';
              return 'Chưa phân loại';
            };

            const getLvlColor = (lvl: number | null | undefined) => {
              if (lvl === 1) return 'bg-rose-50 border-rose-200 text-rose-700';
              if (lvl === 2) return 'bg-amber-50 border-amber-200 text-amber-700';
              if (lvl === 3) return 'bg-emerald-50 border-emerald-200 text-emerald-700';
              return 'bg-slate-100 border-slate-200 text-slate-550';
            };

            return (
              <Card key={c.classroomSubjectId} className="bg-white border border-slate-150 shadow-xs rounded-2xl hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
                {/* Visual Accent Header */}
                <div className="h-2 bg-gradient-to-r from-[#030213] to-slate-800" />
                
                <div className="p-5 space-y-4">
                  {/* Subject details */}
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Lớp: {c.className}</span>
                      <div className="flex items-center gap-1.5">
                        {c.isSubmentor && (
                          <Badge className="text-[9px] font-extrabold bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-50 rounded-[6px] px-2 py-0.5 shadow-none">
                            Trợ giảng
                          </Badge>
                        )}
                        <Badge variant="outline" className={`text-[9px] font-extrabold border rounded-[6px] px-2 py-0.5 ${getLvlColor(currentLevel)}`}>
                          {getLvlLabel(currentLevel)}
                        </Badge>
                      </div>
                    </div>
                    <h3 className="font-extrabold text-slate-800 text-base leading-snug mt-1.5 truncate" title={c.subjectName}>
                      {c.subjectName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1">
                      <span className="font-bold text-slate-400">Mã môn:</span> {c.subjectCode}
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-100" />

                  {/* Progress section (Only shown if classified) */}
                  {currentLevel !== null && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-slate-400">Tiến độ hoàn thành:</span>
                        <span className="font-bold text-slate-700">{progressPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-[#030213] h-full rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        Đã hoàn thành {progress.completed}/{progress.total} bài học của lộ trình.
                      </div>
                    </div>
                  )}

                  {/* Teacher Info */}
                  <div className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 bg-slate-50/50 text-xs">
                    <div className="size-8 rounded-full bg-[#030213]/5 text-[#030213] flex items-center justify-center font-bold border border-[#030213]/10 shrink-0">
                      {c.lecturerName ? c.lecturerName.split(' ').pop()?.charAt(0).toUpperCase() : 'GV'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block leading-none">Giảng viên</span>
                      <span className="font-bold text-slate-700 block truncate mt-1">{c.lecturerName || 'Chưa phân công'}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <CardFooter className="bg-slate-50/50 p-4 border-t border-slate-100 flex flex-col gap-3">
                  {currentLevel === null ? (
                    <div className="w-full space-y-2">
                      <div className="p-2.5 bg-amber-50/50 border border-amber-100 rounded-xl text-center">
                        <p className="text-[10.5px] leading-relaxed text-amber-700 font-medium">
                          Môn học này yêu cầu làm bài kiểm tra phân loại đầu vào để nhận lộ trình cá nhân hóa.
                        </p>
                      </div>
                      <Button
                        onClick={() => navigate(`/student/classroom-subjects/${c.classroomSubjectId}/placement`)}
                        className="w-full bg-[#030213] hover:bg-[#1c1b2d] text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Play className="size-3.5 fill-current" /> Bắt đầu kiểm tra phân loại
                      </Button>
                      <Button
                        onClick={() => handleOpenCreateTicket(c)}
                        variant="outline"
                        className="w-full border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold rounded-xl text-xs py-2 px-3 h-9 flex items-center justify-center gap-1.5"
                      >
                        <AlertTriangle className="size-3.5 mr-0.5 text-amber-600" /> Gửi câu hỏi hỗ trợ
                      </Button>
                      {c.isSubmentor && (
                        <Button
                          onClick={() => handleOpenSupport(c)}
                          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs py-2 px-3 h-9 flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <MessageSquare className="size-3.5" /> Thao tác Trợ giảng (Hỗ trợ giải đáp)
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="w-full space-y-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/student/classroom-subjects/${c.classroomSubjectId}/level-history`)}
                          className="flex-1 text-[#030213] border-slate-200 hover:bg-slate-100 font-semibold rounded-xl text-xs py-2 px-3 h-9"
                        >
                          <History className="size-3.5 mr-1" /> Lịch sử mức
                        </Button>
                        <Button
                          onClick={() => handleOpenRoadmap(c)}
                          className="flex-1 bg-[#030213] hover:bg-[#1c1b2d] text-white font-bold rounded-xl text-xs py-2 px-3 h-9 flex items-center justify-center gap-1 shadow-xs"
                        >
                          <TrendingUp className="size-3.5" /> Lộ trình học
                        </Button>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => handleOpenCreateTicket(c)}
                          variant="outline"
                          className="w-full border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold rounded-xl text-xs py-2 px-3 h-9 flex items-center justify-center gap-1.5"
                        >
                          <AlertTriangle className="size-3.5 mr-0.5 text-amber-600" /> Gửi câu hỏi hỗ trợ
                        </Button>
                        
                        {c.isSubmentor && (
                          <Button
                            onClick={() => handleOpenSupport(c)}
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs py-2 px-3 h-9 flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <MessageSquare className="size-3.5" /> Thao tác Trợ giảng (Hỗ trợ giải đáp)
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Roadmap Graph Modal */}
      <Dialog open={isRoadmapOpen} onOpenChange={setIsRoadmapOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b border-slate-100 shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
              <TrendingUp className="size-5 text-primary" /> Lộ trình học tập cá nhân hóa
            </DialogTitle>
            <DialogDescription>
              Lớp môn: <span className="font-semibold text-slate-700">{selectedSubject?.displayName || selectedSubject?.subjectName}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loadingGraph ? (
              <div className="flex flex-col items-center justify-center py-20 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-xs text-slate-500 font-medium">Đang tải sơ đồ lộ trình học...</span>
              </div>
            ) : nodes.length === 0 ? (
              <div className="text-center py-16 text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold">Chưa có bài học nào được cấu hình trong lộ trình này.</p>
              </div>
            ) : (
              <div className="relative pl-6 border-l border-slate-200 space-y-8 py-2">
                {nodes.map((node, index) => {
                  const isCompleted = node.studentStatus === 'COMPLETED';
                  const isOpen = node.studentStatus === 'OPEN' || node.studentStatus === 'IN_PROGRESS';
                  const isLocked = !node.studentStatus || node.studentStatus === 'LOCKED';
                  
                  const isExpanded = expandedNodeId === node.nodeId;

                  return (
                    <div key={node.nodeId} className="relative">
                      {/* Timeline Dot Indicator */}
                      <span className={`absolute -left-[35px] top-1.5 flex h-6 w-6 items-center justify-center rounded-full border ring-4 ring-white shrink-0 z-10 transition-colors ${
                        isCompleted 
                          ? 'bg-emerald-50 border-emerald-350 text-emerald-600'
                          : isOpen 
                            ? 'bg-blue-50 border-blue-350 text-blue-600 animate-pulse'
                            : 'bg-slate-100 border-slate-300 text-slate-400'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle2 className="size-3.5 fill-emerald-50" />
                        ) : isLocked ? (
                          <Lock className="size-3" />
                        ) : (
                          <Circle className="size-2 fill-current" />
                        )}
                      </span>

                      {/* Content Card */}
                      <Card className={`border transition-all ${
                        isOpen 
                          ? 'border-blue-200 shadow-sm bg-blue-50/10' 
                          : isCompleted 
                            ? 'border-slate-200 shadow-none bg-slate-50/10'
                            : 'border-slate-150 opacity-75 shadow-none bg-slate-50/30'
                      } rounded-xl`}>
                        <div 
                          onClick={() => handleToggleNode(node.nodeId, node.studentStatus)}
                          className={`p-4 flex justify-between items-start cursor-pointer select-none`}
                        >
                          <div className="flex-1 space-y-1 pr-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className={`text-[9px] font-bold px-1.5 rounded-[4px] ${
                                node.nodeType === 'AT_HOME' 
                                  ? 'bg-purple-50 border-purple-200 text-purple-700' 
                                  : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                              }`}>
                                {node.nodeType === 'AT_HOME' ? 'Tự học' : 'Lên lớp'}
                              </Badge>
                              {node.isRequired && (
                                <Badge variant="outline" className="text-[9px] font-bold px-1.5 rounded-[4px] bg-slate-50 border-slate-200 text-slate-600">
                                  Bắt buộc
                                </Badge>
                              )}
                              {isCompleted && (
                                <Badge variant="outline" className="text-[9px] font-bold px-1.5 rounded-[4px] bg-emerald-50 border-emerald-200 text-emerald-700">
                                  Đã hoàn thành
                                </Badge>
                              )}
                              {isOpen && (
                                <Badge variant="outline" className="text-[9px] font-bold px-1.5 rounded-[4px] bg-blue-50 border-blue-200 text-blue-700">
                                  Đang học
                                </Badge>
                              )}
                            </div>
                            <h4 className="font-extrabold text-slate-800 text-sm leading-snug pt-1">{node.title}</h4>
                            {node.description && (
                              <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-2 mt-1">
                                {node.description}
                              </p>
                            )}
                          </div>
                          {!isLocked && (
                            <div className="text-slate-400 hover:text-slate-600 pt-0.5 shrink-0">
                              {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                            </div>
                          )}
                        </div>

                        {/* Expanded details (Materials and tests) */}
                        {isExpanded && !isLocked && (
                          <div className="p-4 pt-0 border-t border-slate-100 bg-white/50 rounded-b-xl space-y-4 text-xs">
                            {loadingNodeContent[node.nodeId] ? (
                              <div className="flex items-center justify-center py-6 gap-2">
                                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                <span className="text-slate-455 text-[11px] font-medium">Đang tải nội dung bài học...</span>
                              </div>
                            ) : (
                              <div className="space-y-4 pt-4 divide-y divide-slate-100">
                                {/* Materials */}
                                {nodeContents[node.nodeId]?.materials && nodeContents[node.nodeId].materials.length > 0 && (
                                  <div className="space-y-2">
                                    <h5 className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-400">
                                      <FileText className="size-3.5" /> Tài liệu học tập
                                    </h5>
                                    <div className="space-y-2 pl-0.5">
                                      {nodeContents[node.nodeId].materials.map((m) => (
                                        <div key={m.materialId} className="p-2.5 border border-slate-100 bg-white rounded-xl">
                                          <div className="flex items-center justify-between gap-3">
                                            <span className="font-bold text-slate-750 block">{m.title}</span>
                                            {m.video?.durationSeconds ? (
                                              <span className="text-[10px] text-slate-400 font-medium shrink-0">
                                                {Math.round((m.video.durationSeconds || 0) / 60)} phút
                                              </span>
                                            ) : null}
                                          </div>
                                          <MaterialPreview material={m} />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Tests */}
                                {nodeContents[node.nodeId]?.tests && nodeContents[node.nodeId].tests.length > 0 && (
                                  <div className="space-y-2 pt-4">
                                    <h5 className="font-bold text-slate-755 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-400">
                                      <Award className="size-3.5" /> Bài kiểm tra đánh giá
                                    </h5>
                                    <div className="space-y-2 pl-0.5">
                                      {nodeContents[node.nodeId].tests.map((t) => (
                                        <div key={t.testId} className="flex items-center justify-between p-2.5 border border-slate-100 bg-white rounded-xl gap-4">
                                          <div className="flex-1 space-y-0.5">
                                            <span className="font-bold text-slate-750 block">{t.title}</span>
                                            <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                                              <span>Thời gian: {t.durationMinutes} phút</span>
                                              <span>•</span>
                                              <span>Yêu cầu đạt: {t.passingPercentage}%</span>
                                            </div>
                                          </div>
                                          {node.studentStatus === 'COMPLETED' ? (
                                            <Button
                                              disabled
                                              className="h-7 px-3 text-[10px] bg-emerald-500 disabled:opacity-100 text-white font-bold rounded-lg flex items-center gap-1 shrink-0 cursor-not-allowed border-none shadow-none"
                                            >
                                              Đã đạt
                                            </Button>
                                          ) : (
                                            <Button
                                              onClick={() => navigate(`/student/tests/${t.testId}?csId=${selectedSubject?.classroomSubjectId}`)}
                                              className="h-7 px-3 text-[10px] bg-primary hover:bg-primary/95 text-white font-bold rounded-lg flex items-center gap-1 shrink-0"
                                            >
                                              Vào thi <ArrowRight className="size-3" />
                                            </Button>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                 {/* Exercises */}
                                {(() => {
                                  const content = nodeContents[node.nodeId];
                                  if (!content) return null;
                                  const materials = content.materials || [];
                                  const tests = content.tests || [];
                                  const exercises = content.exercises || [];

                                  return (
                                    <>
                                      {exercises.length > 0 && (
                                        <div className="space-y-2 pt-4">
                                          <h5 className="font-bold text-slate-755 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-400">
                                            <Award className="size-3.5" /> Bài tập thực hành
                                          </h5>
                                          <div className="space-y-2 pl-0.5">
                                            {exercises.map((ex) => {
                                              const sub = exerciseSubmissions[ex.exerciseId];
                                              return (
                                                <div key={ex.exerciseId} className="flex items-center justify-between p-2.5 border border-slate-100 bg-white rounded-xl gap-4">
                                                  <div className="flex-1 space-y-0.5">
                                                    <span className="font-bold text-slate-750 block">{ex.title}</span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                      {sub ? (
                                                        sub.status === 'GRADED' ? (
                                                          <span 
                                                            onClick={() => setShowFeedbackModal(sub)}
                                                            className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-250 text-[10px] font-semibold rounded cursor-pointer hover:bg-emerald-100 transition-colors"
                                                          >
                                                            Đã chấm: {sub.grade} điểm (Bấm xem nhận xét)
                                                          </span>
                                                        ) : (
                                                          <span className="px-2 py-0.5 bg-yellow-50 text-yellow-750 border border-yellow-250 text-[10px] font-semibold rounded">
                                                            Đã nộp - Chờ chấm
                                                          </span>
                                                        )
                                                      ) : (
                                                        <span className="px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-200 text-[10px] font-semibold rounded">
                                                          Chưa nộp
                                                        </span>
                                                      )}
                                                    </div>
                                                  </div>
                                                  {sub && sub.status === 'GRADED' ? null : (
                                                    <Button
                                                      onClick={() => handleOpenExerciseModal(ex)}
                                                      className="h-7 px-3 text-[10px] bg-slate-800 hover:bg-slate-750 text-white font-bold rounded-lg shrink-0"
                                                    >
                                                      {sub ? 'Nộp lại' : 'Làm bài'}
                                                    </Button>
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}

                                      {/* Empty state for content */}
                                      {materials.length === 0 && tests.length === 0 && exercises.length === 0 && (
                                        <div className="text-center py-6 text-slate-400 italic">
                                          Bài học này chưa có nội dung tài liệu, bài kiểm tra hoặc bài thực hành.
                                        </div>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        )}
                      </Card>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className="p-4 border-t border-slate-100 shrink-0 sm:justify-end">
            <Button type="button" onClick={() => setIsRoadmapOpen(false)} className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-xs py-2 px-4 shadow-sm">
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exercise Submission Modal */}
      {selectedExercise && (
        <Dialog open={!!selectedExercise} onOpenChange={() => handleCloseExerciseModal()}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Làm Bài Tập: {selectedExercise.title}
              </DialogTitle>
              {selectedExercise.instructions && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-650 whitespace-pre-wrap mt-2 max-h-32 overflow-y-auto">
                  <strong>Hướng dẫn: </strong>
                  {selectedExercise.instructions}
                </div>
              )}
            </DialogHeader>

            <form onSubmit={handleExerciseSubmit} className="space-y-4 pt-2">
              {selectedExercise.allowText && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Câu trả lời tự luận *</label>
                  <textarea
                    required
                    placeholder="Nhập nội dung bài làm tự luận của bạn..."
                    rows={5}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-800 bg-white"
                    value={exerciseText}
                    onChange={(e) => setExerciseText(e.target.value)}
                  />
                </div>
              )}

              {selectedExercise.allowFile && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tải lên file bài làm *</label>
                  <div className="border border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50/50 transition-colors relative">
                    <input
                      type="file"
                      required={!exerciseSubmissions[selectedExercise.exerciseId]?.fileUrl}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => setExerciseFile(e.target.files?.[0] || null)}
                    />
                    <div className="flex flex-col items-center gap-1.5 text-slate-500">
                      <Upload className="w-6 h-6 text-indigo-500" />
                      <span className="text-xs font-medium">
                        {exerciseFile ? exerciseFile.name : 'Nhấp hoặc kéo thả file vào đây'}
                      </span>
                      <span className="text-[10px] text-slate-400">Chấp nhận mọi định dạng tệp</span>
                    </div>
                  </div>
                  {exerciseSubmissions[selectedExercise.exerciseId]?.fileUrl && (
                    <div className="text-[10px] text-slate-400 mt-1">
                      Đã nộp trước đó:{' '}
                      <a
                        href={resolveAssetUrl(exerciseSubmissions[selectedExercise.exerciseId]?.fileUrl) || undefined}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-650 underline font-bold"
                      >
                        [Xem tệp tin]
                      </a>
                    </div>
                  )}
                </div>
              )}

              <DialogFooter className="gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleCloseExerciseModal()}
                  className="rounded-xl text-xs py-2 px-4"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={submittingExercise}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs py-2 px-4 shadow-sm"
                >
                  {submittingExercise ? 'Đang nộp...' : 'Nộp bài'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Exercise Feedback View Modal */}
      {showFeedbackModal && (
        <Dialog open={!!showFeedbackModal} onOpenChange={() => setShowFeedbackModal(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" />
                Kết Quả Chấm Điểm
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-2 text-xs">
              <div className="flex items-center justify-between p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl">
                <span className="font-semibold">Điểm số đạt được:</span>
                <span className="text-lg font-black">{showFeedbackModal.grade} / 10</span>
              </div>

              {showFeedbackModal.feedback && (
                <div className="space-y-1">
                  <span className="font-bold text-slate-500 block uppercase tracking-wider text-[10px]">Nhận xét của giảng viên</span>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-700 whitespace-pre-wrap">
                    {showFeedbackModal.feedback}
                  </div>
                </div>
              )}

              <div className="text-[10px] text-slate-400">
                Được chấm bởi:{' '}
                <strong className="text-slate-600">{showFeedbackModal.gradedByName}</strong> vào{' '}
                {showFeedbackModal.gradedAt ? new Date(showFeedbackModal.gradedAt).toLocaleString('vi-VN') : ''}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                onClick={() => setShowFeedbackModal(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs py-2 px-4"
              >
                Đóng
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Sub-mentor Support Modal */}
      <SubMentorSupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        subject={subMentorSubject}
      />

      {/* Ask Support Ticket Modal */}
      <Dialog open={isCreateTicketOpen} onOpenChange={setIsCreateTicketOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-white shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
              <AlertTriangle className="size-5 text-amber-600" /> Hỗ trợ & Hỏi đáp môn học
            </DialogTitle>
            <DialogDescription>
              Môn học: <span className="font-semibold text-slate-700">{ticketSubject?.displayName || ticketSubject?.subjectName}</span>
            </DialogDescription>
          </DialogHeader>

          {/* Tabs Group */}
          <div className="flex border-b border-slate-100 bg-slate-50/50 p-1 gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setTicketModalTab('ask')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                ticketModalTab === 'ask'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Đặt câu hỏi mới
            </button>
            <button
              type="button"
              onClick={() => setTicketModalTab('history')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                ticketModalTab === 'history'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Lịch sử hỏi đáp
              {myTickets.length > 0 && (
                <span className="bg-rose-500 text-white font-extrabold text-[9px] min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full">
                  {myTickets.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto min-h-[300px]">
            {ticketModalTab === 'ask' ? (
              <form onSubmit={handleCreateTicketSubmit} className="h-full flex flex-col justify-between">
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 block">Nội dung câu hỏi của bạn</label>
                    <textarea
                      value={ticketQuestion}
                      onChange={(e) => setTicketQuestion(e.target.value)}
                      placeholder="Hãy mô tả chi tiết vấn đề hoặc câu hỏi của bạn để Trợ giảng có thể hỗ trợ tốt nhất..."
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white placeholder-slate-400 text-slate-800"
                      rows={5}
                      required
                    />
                  </div>
                </div>

                <DialogFooter className="p-4 border-t border-slate-100 shrink-0 sm:justify-end bg-white gap-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setIsCreateTicketOpen(false)} 
                    className="text-slate-600 border-slate-200 hover:bg-slate-100 rounded-xl text-xs py-2 px-4 font-semibold"
                  >
                    Hủy
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={submittingTicket}
                    className="bg-[#030213] hover:bg-[#1c1b2d] text-white font-bold rounded-xl text-xs py-2 px-4 shadow-sm flex items-center gap-1.5"
                  >
                    {submittingTicket ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="size-3.5" />
                    )}
                    Gửi câu hỏi
                  </Button>
                </DialogFooter>
              </form>
            ) : (
              <div className="p-6 space-y-4 bg-slate-50/30 h-full min-h-[300px]">
                {loadingMyTickets ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                    <span className="text-[11px] text-slate-500 font-medium">Đang tải lịch sử câu hỏi...</span>
                  </div>
                ) : myTickets.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white p-6 shadow-xs">
                    <MessageSquare className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-650">Bạn chưa gửi câu hỏi nào trong môn học này.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myTickets.map((t) => {
                      const isDone = t.status === 'DONE';
                      const isSend = t.status === 'SEND';
                      return (
                        <Card key={t.ticketId} className="bg-white border border-slate-150 shadow-xs rounded-xl overflow-hidden p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <span className="text-[9px] text-slate-400 font-semibold">
                              Gửi lúc: {new Date(t.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                            </span>
                            <Badge 
                              variant="outline" 
                              className={`text-[9px] font-bold rounded-[6px] px-1.5 py-0.5 ${
                                isDone 
                                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                                  : isSend
                                    ? 'text-amber-700 bg-amber-50 border-amber-200'
                                    : 'text-slate-600 bg-slate-50 border-slate-200'
                              }`}
                            >
                              {isDone ? 'Đã giải đáp' : isSend ? 'Chờ giảng viên' : 'Chờ trợ giảng'}
                            </Badge>
                          </div>

                          <div className="text-xs text-slate-850 font-medium">
                            <span className="font-bold text-slate-400 block mb-0.5 text-[9px] uppercase tracking-wider">Câu hỏi của bạn:</span>
                            {t.messageStudent}
                          </div>

                          {t.messageResponse ? (
                            <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs text-slate-700 font-medium space-y-1">
                              <span className="font-extrabold text-emerald-800 flex items-center gap-1 text-[10px]">
                                <Check className="size-3.5" /> Giải đáp từ trợ giảng/giảng viên:
                              </span>
                              <p className="text-slate-650 whitespace-pre-wrap">{t.messageResponse}</p>
                            </div>
                          ) : (
                            <div className="p-2.5 bg-slate-50 border border-slate-150 border-dashed rounded-xl text-[10.5px] text-slate-400 text-center font-medium italic">
                              Đang chờ phản hồi...
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface SubMentorSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: ClassroomSubjectResponse | null;
}

export function SubMentorSupportModal({ isOpen, onClose, subject }: SubMentorSupportModalProps) {
  const [assignedTickets, setAssignedTickets] = useState<SupportTicketResponse[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [responseTexts, setResponseTexts] = useState<Record<number, string>>({});
  const [submittingResponse, setSubmittingResponse] = useState<number | null>(null);

  const fetchAssignedTickets = async (csId: number) => {
    try {
      setLoadingTickets(true);
      const tickets = await studentService.listAssignedTickets(csId);
      setAssignedTickets(tickets || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể tải danh sách câu hỏi cần hỗ trợ");
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (isOpen && subject) {
      setAssignedTickets([]);
      setResponseTexts({});
      fetchAssignedTickets(subject.classroomSubjectId);
    }
  }, [isOpen, subject]);

  const handleRespondTicket = async (ticketId: number, text: string) => {
    if (!text.trim()) {
      toast.error("Vui lòng nhập câu trả lời");
      return;
    }
    try {
      setSubmittingResponse(ticketId);
      await studentService.respondSupportTicket(ticketId, { messageResponse: text.trim() });
      toast.success("Giải đáp câu hỏi thành công");
      setAssignedTickets(prev => prev.filter(t => t.ticketId !== ticketId));
      setResponseTexts(prev => {
        const next = { ...prev };
        delete next[ticketId];
        return next;
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể gửi câu trả lời");
    } finally {
      setSubmittingResponse(null);
    }
  };

  const handleEscalateTicket = async (ticketId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn chuyển tiếp câu hỏi này lên Giảng viên lớp học?")) return;
    try {
      await studentService.escalateSupportTicket(ticketId);
      toast.success("Chuyển tiếp câu hỏi lên Giảng viên thành công");
      setAssignedTickets(prev => prev.filter(t => t.ticketId !== ticketId));
      setResponseTexts(prev => {
        const next = { ...prev };
        delete next[ticketId];
        return next;
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể chuyển tiếp câu hỏi");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 shrink-0 bg-white">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
            <MessageSquare className="size-5 text-teal-600" /> Phòng Trợ giảng & Hỗ trợ học tập
          </DialogTitle>
          <DialogDescription>
            Hỗ trợ nhóm học tập lớp môn: <span className="font-semibold text-slate-700">{subject?.displayName || subject?.subjectName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
          {loadingTickets ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              <span className="text-xs text-slate-500 font-medium">Đang tải danh sách câu hỏi cần hỗ trợ...</span>
            </div>
          ) : assignedTickets.length === 0 ? (
            <div className="text-center py-16 text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white p-6 shadow-xs">
              <MessageSquare className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-650">Hiện tại không có câu hỏi nào cần bạn hỗ trợ.</p>
              <p className="text-[10px] text-slate-400 mt-1">Các câu hỏi từ học sinh bạn phụ trách sẽ xuất hiện ở đây.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">
                Câu hỏi chờ giải quyết ({assignedTickets.length})
              </h4>
              {assignedTickets.map((ticket) => {
                const currentResponse = responseTexts[ticket.ticketId] || '';
                return (
                  <Card key={ticket.ticketId} className="bg-white border border-slate-150 shadow-xs rounded-xl overflow-hidden">
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Học sinh</span>
                          <span className="font-bold text-slate-700 text-xs mt-0.5 block">
                            {ticket.studentName || 'Học sinh'} ({ticket.studentEmail})
                          </span>
                        </div>
                        <Badge variant="outline" className="text-[9px] font-bold text-amber-700 bg-amber-50 border-amber-200">
                          Chờ trợ giảng
                        </Badge>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 border border-slate-100 font-medium">
                        {ticket.messageStudent}
                      </div>

                      {/* Answering layout directly visible */}
                      <div className="space-y-3 pt-1">
                        <textarea
                          value={currentResponse}
                          onChange={(e) => setResponseTexts(prev => ({ ...prev, [ticket.ticketId]: e.target.value }))}
                          placeholder="Nhập câu trả lời giải đáp chi tiết cho học sinh..."
                          className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 bg-white placeholder-slate-400 text-slate-800"
                          rows={2}
                        />
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                          <Button
                            variant="ghost"
                            onClick={() => handleEscalateTicket(ticket.ticketId)}
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-xl text-xs h-8 font-semibold flex items-center gap-1"
                          >
                            <ShieldAlert className="size-3.5" /> Không xử lý được (Chuyển GV)
                          </Button>
                          <Button
                            onClick={() => handleRespondTicket(ticket.ticketId, currentResponse)}
                            disabled={submittingResponse === ticket.ticketId}
                            className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs h-8 font-bold flex items-center gap-1.5 shadow-xs"
                          >
                            {submittingResponse === ticket.ticketId ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Check className="size-3.5" />
                              )}
                            Gửi giải đáp
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t border-slate-100 shrink-0 sm:justify-end bg-white">
          <Button type="button" onClick={onClose} className="bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs py-2 px-4 shadow-sm">
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
