import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { teacherService } from '../../../services/teacher.service';
import { classroomService } from '../../../services/classroom.service';
import { learningPathService, StudentAttemptResponse } from '../../../services/learningPath.service';
import { SubmissionResponse } from '../../../services/student.service';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/dialog';
import { 
  ClipboardCheck, 
  BookOpen, 
  FileText, 
  GraduationCap, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Download, 
  FileCode, 
  Activity, 
  Loader,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

interface ClassroomSubjectResponse {
  classroomSubjectId: number;
  classroomId: number;
  className: string;
  subjectId: number;
  subjectName: string;
  subjectCode: string;
  lecturerId: number;
  lecturerName: string;
}

interface AttemptGradingDetail {
  attemptId: number;
  studentId: number;
  studentName: string;
  testTitle: string;
  status: string;
  responses: Array<{
    responseId: number;
    questionId: number;
    questionContent: string;
    questionType: string;
    responseText?: string;
    selectedAnswers?: string[];
    isCorrect?: boolean | null;
    maxScore: number;
  }>;
}

export function TeacherGradingPage() {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState<ClassroomSubjectResponse[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassroomSubjectResponse | null>(null);
  
  // Tab states: 'exercise' | 'test'
  const [activeTab, setActiveTab] = useState<'exercise' | 'test'>('exercise');
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  // Submissions & Attempts data
  const [submissions, setSubmissions] = useState<SubmissionResponse[]>([]);
  const [attempts, setAttempts] = useState<StudentAttemptResponse[]>([]);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'GRADED'>('ALL');

  // Pagination states
  const [currentPageSub, setCurrentPageSub] = useState(1);
  const [currentPageAtt, setCurrentPageAtt] = useState(1);
  const itemsPerPage = 10;

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPageSub(1);
    setCurrentPageAtt(1);
  }, [selectedClass, searchQuery, statusFilter, activeTab]);

  // Exercise Grading Modal
  const [gradingSubmission, setGradingSubmission] = useState<SubmissionResponse | null>(null);
  const [gradeValue, setGradeValue] = useState('');
  const [feedbackValue, setFeedbackValue] = useState('');
  const [savingGrade, setSavingGrade] = useState(false);

  // Test Essay Grading Modal
  const [essayGradingOpen, setEssayGradingOpen] = useState(false);
  const [gradingAttempt, setGradingAttempt] = useState<AttemptGradingDetail | null>(null);
  const [essayMarks, setEssayMarks] = useState<Record<number, boolean>>({});
  const [savingEssayGrades, setSavingEssayGrades] = useState(false);
  const [loadingAttemptDetail, setLoadingAttemptDetail] = useState(false);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch classes
  useEffect(() => {
    if (!user?.userId) return;
    (async () => {
      try {
        setLoadingClasses(true);
        const data = await teacherService.getClassroomsByTeacher(user.userId);
        if (isMountedRef.current) {
          setClassrooms(data || []);
          if (data && data.length > 0) {
            setSelectedClass(data[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load classrooms:', err);
        toast.error('Không thể tải danh sách lớp học');
      } finally {
        if (isMountedRef.current) setLoadingClasses(false);
      }
    })();
  }, [user]);

  // Fetch submissions or attempts for selected class
  const fetchGradingData = useCallback(async () => {
    if (!selectedClass) return;
    try {
      setLoadingData(true);
      if (activeTab === 'exercise') {
        const list = await learningPathService.getClassroomSubjectSubmissions(selectedClass.classroomSubjectId);
        if (isMountedRef.current) setSubmissions(list || []);
      } else {
        const list = await learningPathService.getClassroomSubjectAttempts(selectedClass.classroomSubjectId);
        if (isMountedRef.current) setAttempts(list || []);
      }
    } catch (err) {
      console.error('Failed to load grading records:', err);
      toast.error('Không thể tải danh sách bài nộp');
    } finally {
      if (isMountedRef.current) setLoadingData(false);
    }
  }, [selectedClass, activeTab]);

  useEffect(() => {
    fetchGradingData();
  }, [fetchGradingData]);

  // Exercise grading handlers
  const handleOpenGrading = (sub: SubmissionResponse) => {
    setGradingSubmission(sub);
    setGradeValue(sub.grade !== undefined && sub.grade !== null ? sub.grade.toString() : '');
    setFeedbackValue(sub.feedback || '');
  };

  const handleSaveGrade = async () => {
    if (!gradingSubmission || !gradeValue.trim()) return;
    const gradeNum = parseFloat(gradeValue);
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 10) {
      toast.error('Điểm số phải nằm trong khoảng từ 0 đến 10');
      return;
    }

    setSavingGrade(true);
    try {
      await teacherService.gradeSubmission(
        gradingSubmission.submissionId,
        gradeNum,
        feedbackValue.trim() || undefined
      );
      toast.success('Chấm điểm thành công!');
      setGradingSubmission(null);
      fetchGradingData();
    } catch (err) {
      console.error('Failed to save grade:', err);
      toast.error('Không thể lưu điểm số');
    } finally {
      setSavingGrade(false);
    }
  };

  // Test grading handlers
  const openEssayGrading = async (attemptId: number) => {
    setEssayGradingOpen(true);
    setGradingAttempt(null);
    try {
      setLoadingAttemptDetail(true);
      const detail = await learningPathService.getAttemptGrading(attemptId);
      if (isMountedRef.current) {
        setGradingAttempt(detail);
        
        // Pre-populate essayMarks with already graded essays if any
        const initialMarks: Record<number, boolean> = {};
        detail.responses.forEach(r => {
          if (r.questionType === 'ESSAY' && r.isCorrect != null) {
            initialMarks[r.responseId] = r.isCorrect;
          }
        });
        setEssayMarks(initialMarks);
      }
    } catch (err) {
      console.error('Failed to load attempt details:', err);
      toast.error('Không thể tải chi tiết bài làm');
      setEssayGradingOpen(false);
    } finally {
      if (isMountedRef.current) setLoadingAttemptDetail(false);
    }
  };

  const handleSaveEssayGrades = async () => {
    if (!gradingAttempt) return;
    const pendingEssays = gradingAttempt.responses.filter(
      (r) => r.questionType === 'ESSAY' && r.isCorrect == null
    );
    const grades = pendingEssays
      .filter((r) => essayMarks[r.responseId] !== undefined)
      .map((r) => ({
        responseId: r.responseId,
        isCorrect: essayMarks[r.responseId],
      }));

    if (grades.length < pendingEssays.length) {
      toast.error('Vui lòng chấm đủ tất cả các câu tự luận');
      return;
    }

    setSavingEssayGrades(true);
    try {
      await learningPathService.gradeEssayAttempt(gradingAttempt.attemptId, grades);
      toast.success('Chấm bài tự luận thành công!');
      setGradingAttempt(null);
      setEssayGradingOpen(false);
      fetchGradingData();
    } catch (err) {
      console.error('Failed to save essay grades:', err);
      toast.error('Không thể lưu kết quả chấm');
    } finally {
      setSavingEssayGrades(false);
    }
  };

  // Helper resolving files
  const resolveAssetUrl = (url?: string) => {
    if (!url) return '#';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `http://localhost:8080${url}`;
  };

  // Filters logic
  const filteredSubmissions = submissions.filter(sub => {
    const matchesSearch = (sub.studentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (sub.exerciseTitle || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === 'PENDING') return sub.status === 'SUBMITTED';
    if (statusFilter === 'GRADED') return sub.status === 'GRADED';
    return true;
  });

  const totalPagesSub = Math.ceil(filteredSubmissions.length / itemsPerPage);
  const paginatedSubmissions = filteredSubmissions.slice(
    (currentPageSub - 1) * itemsPerPage,
    currentPageSub * itemsPerPage
  );

  const filteredAttempts = attempts.filter(att => {
    const matchesSearch = (att.studentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (att.testTitle || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === 'PENDING') return att.status === 'PENDING_REVIEW';
    if (statusFilter === 'GRADED') return att.status === 'SUBMITTED';
    return true;
  });

  const totalPagesAtt = Math.ceil(filteredAttempts.length / itemsPerPage);
  const paginatedAttempts = filteredAttempts.slice(
    (currentPageAtt - 1) * itemsPerPage,
    currentPageAtt * itemsPerPage
  );

  return (
    <div className="flex-1 min-h-0 bg-background/50 overflow-y-auto p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ClipboardCheck className="w-6 h-6 text-primary" />
              Chấm bài tổng hợp
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Xem và chấm điểm các bài tập thực hành & bài thi tự luận chờ duyệt của học sinh
            </p>
          </div>

          {/* Class selector */}
          <div className="w-full sm:w-72">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide block mb-1">Lớp học hiện tại</label>
            {loadingClasses ? (
              <div className="h-9 bg-muted animate-pulse rounded-md"></div>
            ) : (
              <select
                className="w-full h-9 rounded-md border border-border bg-background px-3 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                value={selectedClass?.classroomSubjectId || ''}
                onChange={(e) => {
                  const id = parseInt(e.target.value);
                  const found = classrooms.find(c => c.classroomSubjectId === id);
                  if (found) setSelectedClass(found);
                }}
              >
                {classrooms.map(c => (
                  <option key={c.classroomSubjectId} value={c.classroomSubjectId}>
                    {c.subjectName} ({c.subjectCode}) - {c.className}
                  </option>
                ))}
                {classrooms.length === 0 && <option value="">Chưa có lớp học</option>}
              </select>
            )}
          </div>
        </div>

        {/* Empty state if no class */}
        {!selectedClass ? (
          <div className="flex flex-col items-center justify-center border border-dashed border-border rounded-xl py-16 text-center space-y-3">
            <GraduationCap className="w-10 h-10 text-muted-foreground/60" />
            <p className="text-sm font-semibold text-muted-foreground">Bạn chưa được phân công dạy lớp học nào trong học kỳ này.</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Tabs & Search controls */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
              
              {/* Tabs list */}
              <div className="flex border-b border-border gap-6">
                <button
                  onClick={() => { setActiveTab('exercise'); setStatusFilter('ALL'); }}
                  className={`pb-3 font-semibold text-sm transition-colors border-b-2 px-1 relative ${
                    activeTab === 'exercise' 
                      ? 'border-primary text-foreground' 
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Bài thực hành
                </button>
                <button
                  onClick={() => { setActiveTab('test'); setStatusFilter('ALL'); }}
                  className={`pb-3 font-semibold text-sm transition-colors border-b-2 px-1 relative ${
                    activeTab === 'test' 
                      ? 'border-primary text-foreground' 
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Bài kiểm tra (Tự luận)
                </button>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap gap-2 items-center">
                
                {/* Search input */}
                <div className="relative min-w-[200px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Tìm tên học sinh, bài tập..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 w-full rounded-md border border-border bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Filter select */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="h-9 rounded-md border border-border bg-background px-3 py-1 text-sm text-foreground focus:outline-none"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="PENDING">Chờ chấm điểm</option>
                  <option value="GRADED">Đã chấm điểm</option>
                </select>

                <Button variant="outline" size="sm" className="h-9" onClick={fetchGradingData} disabled={loadingData}>
                  {loadingData ? <Loader className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                  Tải lại
                </Button>
              </div>

            </div>

            {/* List tables */}
            {loadingData ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader className="w-8 h-8 text-primary animate-spin" />
                <p className="text-xs text-muted-foreground">Đang tải dữ liệu bài nộp...</p>
              </div>
            ) : (
              <div className="bg-background border border-border rounded-xl overflow-hidden shadow-sm">
                
                {/* Tab 1: Exercise Submissions */}
                {activeTab === 'exercise' && (
                  <>
                    <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse text-left">
                      <thead>
                        <tr className="bg-muted/40 border-b border-border text-xs text-muted-foreground font-bold uppercase tracking-wider">
                          <th className="p-4">Học sinh</th>
                          <th className="p-4">Tên bài thực hành</th>
                          <th className="p-4">Đính kèm</th>
                          <th className="p-4">Thời gian nộp</th>
                          <th className="p-4 text-center">Điểm</th>
                          <th className="p-4">Trạng thái</th>
                          <th className="p-4 text-center">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedSubmissions.map(sub => (
                          <tr key={sub.submissionId} className="border-b border-border hover:bg-muted/10 transition-colors">
                            <td className="p-4">
                              <p className="font-semibold text-foreground">{sub.studentName}</p>
                              <p className="text-[10px] text-muted-foreground">ID: {sub.studentId}</p>
                            </td>
                            <td className="p-4">
                              <p className="font-medium text-foreground">{sub.exerciseTitle || `Bài tập #${sub.exerciseId}`}</p>
                            </td>
                            <td className="p-4">
                              {sub.fileUrl ? (
                                <a 
                                  href={resolveAssetUrl(sub.fileUrl)} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  Tải file nộp
                                </a>
                              ) : sub.content ? (
                                <span className="text-xs text-muted-foreground italic truncate max-w-[150px] block">Nộp tự luận văn bản</span>
                              ) : (
                                <span className="text-xs text-rose-500 italic">Không có bài làm</span>
                              )}
                            </td>
                            <td className="p-4 text-xs text-muted-foreground">
                              {new Date(sub.submittedAt).toLocaleString('vi-VN')}
                            </td>
                            <td className="p-4 text-center font-bold text-sm">
                              {sub.grade !== null && sub.grade !== undefined ? (
                                <span className={sub.grade >= 5 ? 'text-emerald-600' : 'text-rose-500'}>
                                  {sub.grade}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/60">-</span>
                              )}
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                sub.status === 'GRADED'
                                  ? 'bg-emerald-500/10 text-emerald-600'
                                  : 'bg-amber-500/10 text-amber-600'
                              }`}>
                                {sub.status === 'GRADED' ? 'Đã chấm' : 'Chờ chấm'}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => handleOpenGrading(sub)}
                              >
                                {sub.status === 'GRADED' ? 'Xem lại' : 'Chấm điểm'}
                              </Button>
                            </td>
                          </tr>
                        ))}
                        {filteredSubmissions.length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-muted-foreground text-xs italic">
                              Không tìm thấy bài nộp nào phù hợp.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {filteredSubmissions.length > 0 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-card/30">
                      <div className="text-xs text-muted-foreground">
                        Hiển thị {filteredSubmissions.length > 0 ? (currentPageSub - 1) * itemsPerPage + 1 : 0} – {Math.min(currentPageSub * itemsPerPage, filteredSubmissions.length)} trong tổng số {filteredSubmissions.length} bài nộp
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="icon"
                          className="w-7 h-7"
                          onClick={() => setCurrentPageSub((p) => Math.max(1, p - 1))}
                          disabled={currentPageSub === 1}
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </Button>
                        {Array.from({ length: totalPagesSub }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={currentPageSub === page ? "default" : "outline"}
                            onClick={() => setCurrentPageSub(page)}
                            className="w-7 h-7 text-[10px]"
                          >
                            {page}
                          </Button>
                        ))}
                        <Button
                          variant="outline"
                          size="icon"
                          className="w-7 h-7"
                          onClick={() => setCurrentPageSub((p) => Math.min(totalPagesSub, p + 1))}
                          disabled={currentPageSub === totalPagesSub}
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                  </>
                )}

                {/* Tab 2: Test attempts */}
                {activeTab === 'test' && (
                  <>
                    <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse text-left">
                      <thead>
                        <tr className="bg-muted/40 border-b border-border text-xs text-muted-foreground font-bold uppercase tracking-wider">
                          <th className="p-4">Học sinh</th>
                          <th className="p-4">Tên bài thi</th>
                          <th className="p-4">Thời gian nộp</th>
                          <th className="p-4 text-center">Điểm số hiện tại</th>
                          <th className="p-4">Trạng thái</th>
                          <th className="p-4 text-center">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedAttempts.map(att => (
                          <tr key={att.attemptId} className="border-b border-border hover:bg-muted/10 transition-colors">
                            <td className="p-4">
                              <p className="font-semibold text-foreground">{att.studentName}</p>
                              <p className="text-[10px] text-muted-foreground">{att.studentEmail}</p>
                            </td>
                            <td className="p-4">
                              <p className="font-medium text-foreground">{att.testTitle || `Bài test #${att.testId}`}</p>
                            </td>
                            <td className="p-4 text-xs text-muted-foreground">
                              {att.submittedAt ? new Date(att.submittedAt).toLocaleString('vi-VN') : 'Đang làm bài'}
                            </td>
                            <td className="p-4 text-center font-bold text-sm">
                              {att.score !== null && att.score !== undefined ? (
                                <span className={att.passed ? 'text-emerald-600' : 'text-rose-500'}>
                                  {att.score}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/60">-</span>
                              )}
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                att.status === 'SUBMITTED'
                                  ? 'bg-emerald-500/10 text-emerald-600'
                                  : att.status === 'PENDING_REVIEW'
                                    ? 'bg-amber-500/10 text-amber-600'
                                    : 'bg-slate-500/10 text-slate-600'
                              }`}>
                                {att.status === 'SUBMITTED' ? 'Hoàn thành' : att.status === 'PENDING_REVIEW' ? 'Chờ chấm tự luận' : 'Đang làm'}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                disabled={loadingAttemptDetail}
                                onClick={() => openEssayGrading(att.attemptId)}
                              >
                                {att.status === 'SUBMITTED' ? 'Xem lại' : 'Chấm tự luận'}
                              </Button>
                            </td>
                          </tr>
                        ))}
                        {filteredAttempts.length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-muted-foreground text-xs italic">
                              Không tìm thấy lượt làm bài nào phù hợp.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {filteredAttempts.length > 0 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-card/30">
                      <div className="text-xs text-muted-foreground">
                        Hiển thị {filteredAttempts.length > 0 ? (currentPageAtt - 1) * itemsPerPage + 1 : 0} – {Math.min(currentPageAtt * itemsPerPage, filteredAttempts.length)} trong tổng số {filteredAttempts.length} lượt thi
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="icon"
                          className="w-7 h-7"
                          onClick={() => setCurrentPageAtt((p) => Math.max(1, p - 1))}
                          disabled={currentPageAtt === 1}
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </Button>
                        {Array.from({ length: totalPagesAtt }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={currentPageAtt === page ? "default" : "outline"}
                            onClick={() => setCurrentPageAtt(page)}
                            className="w-7 h-7 text-[10px]"
                          >
                            {page}
                          </Button>
                        ))}
                        <Button
                          variant="outline"
                          size="icon"
                          className="w-7 h-7"
                          onClick={() => setCurrentPageAtt((p) => Math.min(totalPagesAtt, p + 1))}
                          disabled={currentPageAtt === totalPagesAtt}
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                  </>
                )}

              </div>
            )}

          </div>
        )}

      </div>

      {/* MODAL 1: Chấm điểm bài thực hành */}
      <Dialog open={!!gradingSubmission} onOpenChange={(open) => { if (!open) setGradingSubmission(null); }}>
        <DialogContent className="sm:max-w-xl bg-background border-border text-xs shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
              <FileCode className="w-5 h-5 text-primary" />
              Chấm bài thực hành: {gradingSubmission?.studentName}
            </DialogTitle>
            <DialogDescription className="text-[10px] text-muted-foreground">
              Bài nộp của bài thực hành: {gradingSubmission?.exerciseTitle}
            </DialogDescription>
          </DialogHeader>

          {gradingSubmission && (
            <div className="space-y-4">
              
              {/* Submission text content */}
              {gradingSubmission.content && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Nội dung tự luận nộp:</span>
                  <div className="bg-muted p-3 rounded-lg border border-border max-h-[150px] overflow-y-auto whitespace-pre-wrap font-mono text-[11px]">
                    {gradingSubmission.content}
                  </div>
                </div>
              )}

              {/* Submission file */}
              {gradingSubmission.fileUrl && (
                <div className="flex items-center justify-between p-2.5 border border-border rounded-lg bg-muted/40">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="font-semibold text-foreground truncate max-w-xs block">
                      {gradingSubmission.fileUrl.split('/').pop()}
                    </span>
                  </div>
                  <a
                    href={resolveAssetUrl(gradingSubmission.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Tải về bài làm
                  </a>
                </div>
              )}

              {/* Grading input */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Điểm số (Thang 10)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    placeholder="VD: 8.5"
                    disabled={gradingSubmission.status === 'GRADED'}
                    value={gradeValue}
                    onChange={(e) => setGradeValue(e.target.value)}
                    className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Nhận xét của Giáo viên</label>
                  <textarea
                    rows={2}
                    placeholder="Nhập phản hồi, góp ý cho học sinh..."
                    disabled={gradingSubmission.status === 'GRADED'}
                    value={feedbackValue}
                    onChange={(e) => setFeedbackValue(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none"
                  />
                </div>
              </div>

            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setGradingSubmission(null)}>
              Đóng
            </Button>
            {gradingSubmission?.status !== 'GRADED' && (
              <Button size="sm" onClick={handleSaveGrade} disabled={savingGrade || !gradeValue.trim()}>
                {savingGrade ? <Loader className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                Lưu điểm số
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: Chấm tự luận bài Test */}
      <Dialog open={essayGradingOpen} onOpenChange={(open) => { if (!open) { setEssayGradingOpen(false); setGradingAttempt(null); } }}>
        <DialogContent className="sm:max-w-2xl bg-background border-border text-xs shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Activity className="size-5 text-primary" />
              Chấm câu tự luận {gradingAttempt ? `— ${gradingAttempt.studentName}` : ''}
            </DialogTitle>
            <DialogDescription className="text-[10px] text-muted-foreground">
              {gradingAttempt ? `Bài thi: ${gradingAttempt.testTitle} · Trắc nghiệm đã được chấm tự động` : 'Vui lòng chờ trong giây lát'}
            </DialogDescription>
          </DialogHeader>

          {loadingAttemptDetail ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader className="w-8 h-8 text-primary animate-spin" />
              <p className="text-xs text-muted-foreground">Đang tải câu hỏi và bài làm...</p>
            </div>
          ) : gradingAttempt ? (
            <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-1">
              {(gradingAttempt.responses ?? []).map((r, idx) => {
                const isEssay = r.questionType === 'ESSAY';
                const pendingEssay = isEssay && r.isCorrect == null;
                const mark = essayMarks[r.responseId];
                return (
                  <div key={r.responseId} className="border border-border rounded-xl p-3 space-y-2 bg-muted/10">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-foreground text-[11.5px] leading-snug">
                        Câu {idx + 1}. {r.questionContent}
                      </p>
                      <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase ${
                        isEssay
                          ? 'bg-violet-500/10 border-violet-500/20 text-violet-700 dark:text-violet-400'
                          : 'bg-muted border-border text-muted-foreground'
                      }`}>
                        {isEssay ? 'Tự luận' : 'Trắc nghiệm'}
                      </span>
                    </div>

                    <div className="bg-muted border border-border rounded-lg p-2 text-[11px] text-foreground whitespace-pre-wrap break-words">
                      {isEssay
                        ? (r.responseText?.trim() ? r.responseText : <span className="italic text-muted-foreground">Học sinh không trả lời</span>)
                        : (r.selectedAnswers && r.selectedAnswers.length > 0
                            ? r.selectedAnswers.join(', ')
                            : <span className="italic text-muted-foreground">Không chọn đáp án</span>)}
                    </div>

                    {pendingEssay ? (
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Giáo viên chấm:</span>
                        <button
                          onClick={() => setEssayMarks((prev) => ({ ...prev, [r.responseId]: true }))}
                          className={`px-3 py-1 rounded-lg text-[10.5px] font-bold border transition-colors ${
                            mark === true
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 hover:bg-emerald-500/20'
                          }`}
                        >
                          Đạt (+{r.maxScore} điểm)
                        </button>
                        <button
                          onClick={() => setEssayMarks((prev) => ({ ...prev, [r.responseId]: false }))}
                          className={`px-3 py-1 rounded-lg text-[10.5px] font-bold border transition-colors ${
                            mark === false
                              ? 'bg-rose-600 border-rose-600 text-white'
                              : 'bg-rose-500/10 border-rose-500/20 text-rose-700 hover:bg-rose-500/20'
                          }`}
                        >
                          Không đạt (0 điểm)
                        </button>
                      </div>
                    ) : (
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        r.isCorrect
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700'
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-700'
                      }`}>
                        {r.isCorrect ? `Đạt · +${r.maxScore} điểm` : 'Không đạt · 0 điểm'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center text-muted-foreground italic">Không có dữ liệu bài làm</div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setEssayGradingOpen(false); setGradingAttempt(null); }}>
              Đóng
            </Button>
            {!loadingAttemptDetail && gradingAttempt?.status === 'PENDING_REVIEW' && (
              <Button size="sm" onClick={handleSaveEssayGrades} disabled={savingEssayGrades}>
                {savingEssayGrades ? <Loader className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                Lưu kết quả chấm
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
