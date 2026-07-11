import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { 
  Loader2, 
  Trash2, 
  HelpCircle,
  FileText,
  Activity
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../ui/tooltip';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { 
  teacherService, 
  type CreatePopQuizRequest, 
  type PopQuizResultsResponse 
} from '../../services/teacher.service';
import { type StudentInClassResponse } from '../../services/learningPath.service';

export interface TeacherPopQuizPanelProps {
  nodeId: number;
  students: StudentInClassResponse[];
  live: boolean;
  pollTick: number;
  tests?: any[];
}

export function TeacherPopQuizPanel({ nodeId, students, live, pollTick, tests = [] }: TeacherPopQuizPanelProps) {
  const [activePQAssignment, setActivePQAssignment] = useState<PopQuizResultsResponse | null>(null);
  const [loadingPQResults, setLoadingPQResults] = useState(false);
  const [submittingCreatePQ, setSubmittingCreatePQ] = useState(false);
  
  // Create Pop Quiz Form States
  const [pqTitle, setPqTitle] = useState("");
  const [pqDuration, setPqDuration] = useState(15);
  const [pqSource, setPqSource] = useState<'inline' | 'existing'>('inline');
  const [pqExistingTestId, setPqExistingTestId] = useState<number | undefined>(undefined);
  const [pqTargetStudentIds, setPqTargetStudentIds] = useState<number[]>([]);
  const [pqQuestions, setPqQuestions] = useState<any[]>([]);

  const isFirstMount = useRef(true);

  // Fetch active pop quiz
  const fetchActivePopQuiz = async (silent = false) => {
    if (!silent) setLoadingPQResults(true);
    try {
      const activeRes = await teacherService.getActivePopQuiz(nodeId);
      if (activeRes) {
        const results = await teacherService.getPopQuizResults(activeRes.assignmentId);
        setActivePQAssignment(results);
      } else {
        setActivePQAssignment(null);
        if (isFirstMount.current) {
          setPqTitle(`Kiểm tra nhanh - Node #${nodeId}`);
          setPqDuration(15);
          setPqSource('inline');
          setPqQuestions([]);
        }
      }
    } catch (err) {
      console.error("Lỗi khi tải trạng thái Pop Quiz:", err);
    } finally {
      if (!silent) setLoadingPQResults(false);
      isFirstMount.current = false;
    }
  };

  const studentsHash = students.map(s => s.userId).join(',');

  // Initial load
  useEffect(() => {
    isFirstMount.current = true;
    fetchActivePopQuiz(false);
    // Initialize target students
    setPqTargetStudentIds(students.map(s => s.userId));
  }, [nodeId, studentsHash]);

  // Refetch on pollTick
  useEffect(() => {
    if (isFirstMount.current) return;
    if (activePQAssignment && activePQAssignment.status === 'OPEN') {
      fetchActivePopQuiz(true);
    }
  }, [pollTick]);

  const handleCreatePopQuiz = async () => {
    if (!pqTitle.trim()) {
      toast.error("Vui lòng nhập tiêu đề bài Pop Quiz");
      return;
    }
    if (pqTargetStudentIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 học sinh để giao bài");
      return;
    }

    const payload: CreatePopQuizRequest = {
      title: pqTitle.trim(),
      studentIds: pqTargetStudentIds,
    };

    if (pqSource === 'inline') {
      if (pqQuestions.length === 0) {
        toast.error("Vui lòng thêm ít nhất 1 câu hỏi");
        return;
      }
      for (let i = 0; i < pqQuestions.length; i++) {
        const q = pqQuestions[i];
        if (!q.questionContent.trim()) {
          toast.error(`Vui lòng nhập nội dung cho câu hỏi ${i + 1}`);
          return;
        }
        if (q.answers.length < 2) {
          toast.error(`Câu hỏi ${i + 1} phải có ít nhất 2 đáp án`);
          return;
        }
        const hasCorrect = q.answers.some((a: any) => a.isCorrect);
        if (!hasCorrect) {
          toast.error(`Câu hỏi ${i + 1} chưa có đáp án đúng`);
          return;
        }
      }
      payload.durationMinutes = pqDuration;
      payload.questions = pqQuestions;
    } else {
      if (!pqExistingTestId) {
        toast.error("Vui lòng chọn một bài test có sẵn");
        return;
      }
      payload.existingTestId = pqExistingTestId;
    }

    setSubmittingCreatePQ(true);
    try {
      const res = await teacherService.createPopQuiz(nodeId, payload);
      toast.success("Giao bài kiểm tra nhanh thành công!");
      const results = await teacherService.getPopQuizResults(res.assignmentId);
      setActivePQAssignment(results);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Giao bài thất bại");
    } finally {
      setSubmittingCreatePQ(false);
    }
  };

  const handleClosePopQuiz = async () => {
    if (!activePQAssignment) return;
    if (!window.confirm("Bạn có chắc chắn muốn đóng bài kiểm tra này? Học sinh chưa nộp sẽ không thể bắt đầu làm bài nữa.")) return;
    try {
      await teacherService.closePopQuiz(activePQAssignment.assignmentId);
      toast.success("Đã đóng bài kiểm tra!");
      const results = await teacherService.getPopQuizResults(activePQAssignment.assignmentId);
      setActivePQAssignment(results);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể đóng bài kiểm tra");
    }
  };

  const handleResetPopQuizStudent = async (studentId: number) => {
    if (!activePQAssignment) return;
    const student = students.find(s => s.userId === studentId);
    if (!student || !student.classroomSubjectStudentId) {
      toast.error("Không tìm thấy thông tin ghi danh học sinh");
      return;
    }
    if (!window.confirm(`Bạn có chắc muốn cho học sinh ${student.lastName} ${student.firstName} làm lại bài Pop Quiz này? Lượt làm bài cũ sẽ bị hủy.`)) return;
    try {
      await teacherService.resetPopQuizStudent(activePQAssignment.assignmentId, student.classroomSubjectStudentId);
      toast.success("Đã reset lượt làm bài thành công!");
      const results = await teacherService.getPopQuizResults(activePQAssignment.assignmentId);
      setActivePQAssignment(results);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể reset lượt làm bài");
    }
  };

  const renderContent = () => {
    if (loadingPQResults) {
      return (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      );
    }

    if (activePQAssignment) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-muted/40 border p-3 rounded-lg text-xs">
            <div>
              <p className="font-bold text-foreground">Tiêu đề: {activePQAssignment.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={activePQAssignment.status === 'OPEN' ? 'default' : 'secondary'}>
                  {activePQAssignment.status === 'OPEN' ? 'Đang mở' : 'Đã đóng'}
                </Badge>
                {activePQAssignment.status === 'OPEN' && (
                  <span className="text-[10px] text-muted-foreground animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span>
                    Đang theo dõi...
                  </span>
                )}
              </div>
            </div>
            {activePQAssignment.status === 'OPEN' && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClosePopQuiz}
                className="h-7 text-[10px] font-bold rounded"
              >
                Đóng bài thi
              </Button>
            )}
            {activePQAssignment.status === 'CLOSED' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActivePQAssignment(null)}
                className="h-7 text-[10px] font-bold rounded border-border"
              >
                Giao bài mới
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Kết quả làm bài</h4>
            <div className="border border-border rounded-lg overflow-hidden bg-background">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="text-[10px] font-bold h-8 py-1">Học sinh</TableHead>
                    <TableHead className="text-[10px] font-bold h-8 py-1">Trạng thái</TableHead>
                    <TableHead className="text-[10px] font-bold h-8 py-1">Điểm số</TableHead>
                    <TableHead className="text-[10px] font-bold h-8 py-1 text-center">Rời tab</TableHead>
                    <TableHead className="text-[10px] font-bold h-8 py-1 text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activePQAssignment.students.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-xs text-muted-foreground italic">
                        Không có học sinh nào được giao bài
                      </TableCell>
                    </TableRow>
                  ) : (
                    activePQAssignment.students.map((std) => (
                      <TableRow key={std.studentId} className="hover:bg-muted/10">
                        <TableCell className="py-2 text-xs font-medium text-foreground">{std.studentName}</TableCell>
                        <TableCell className="py-2 text-xs">
                          <span className={`px-1.5 py-0.5 rounded-sm text-[10px] font-bold ${
                            std.status === 'SUBMITTED' ? 'bg-emerald-100 text-emerald-700' :
                            std.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                            std.status === 'EXPIRED' ? 'bg-red-100 text-red-700' :
                            'bg-zinc-100 text-zinc-600'
                          }`}>
                            {std.status === 'SUBMITTED' ? 'Đã nộp' :
                             std.status === 'IN_PROGRESS' ? 'Đang làm' :
                             std.status === 'EXPIRED' ? 'Quá hạn' :
                             'Chờ làm'}
                          </span>
                        </TableCell>
                        <TableCell className="py-2 text-xs font-semibold">
                          {std.score != null ? `${std.score}%` : '---'}
                        </TableCell>
                        <TableCell className="py-2 text-xs text-center text-amber-600 font-semibold">
                          {std.tabOutCount != null ? std.tabOutCount : 0}
                        </TableCell>
                        <TableCell className="py-2 text-right">
                          {std.status !== 'PENDING' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResetPopQuizStudent(std.studentId)}
                              className="h-6 px-2 text-[9px] hover:bg-zinc-100 text-amber-600 hover:text-amber-700 font-bold rounded"
                              title="Hủy lượt làm bài và cho phép làm lại"
                            >
                              Cho làm lại
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4 text-xs">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Tiêu đề bài Pop Quiz</label>
          <input
            type="text"
            value={pqTitle}
            onChange={(e) => setPqTitle(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus-visible:ring-1 focus-visible:ring-primary outline-none placeholder:text-muted-foreground"
            placeholder="Ví dụ: Kiểm tra nhanh buổi học"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Nguồn đề thi</label>
            <div className="flex gap-4 py-1.5">
              <label className="flex items-center gap-1.5 font-medium cursor-pointer">
                <input
                  type="radio"
                  checked={pqSource === 'inline'}
                  onChange={() => setPqSource('inline')}
                  className="accent-primary"
                />
                <span>Soạn đề nhanh</span>
              </label>
              <label className="flex items-center gap-1.5 font-medium cursor-pointer">
                <input
                  type="radio"
                  checked={pqSource === 'existing'}
                  onChange={() => setPqSource('existing')}
                  className="accent-primary"
                />
                <span>Chọn bài có sẵn</span>
              </label>
            </div>
          </div>

          {pqSource === 'inline' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Thời gian làm (phút)</label>
              <input
                type="number"
                value={pqDuration}
                onChange={(e) => setPqDuration(Math.max(1, Number(e.target.value)))}
                className="w-full bg-background border border-border rounded-lg px-3 py-1 text-xs text-foreground focus-visible:ring-1 focus-visible:ring-primary outline-none"
                min={1}
                max={180}
              />
            </div>
          )}
        </div>

        {pqSource === 'inline' ? (
          <div className="space-y-3 border-t border-border/60 pt-3">
            <div className="flex justify-between items-center">
              <h5 className="font-bold text-foreground">Danh sách câu hỏi ({pqQuestions.length})</h5>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPqQuestions(prev => [
                  ...prev,
                  {
                    questionContent: "",
                    questionType: 'MULTIPLE_CHOICE',
                    score: 1,
                    answers: [
                      { answerContent: "", isCorrect: false },
                      { answerContent: "", isCorrect: false }
                    ]
                  }
                ])}
                className="h-7 text-[10px] border-border hover:bg-accent rounded font-bold"
              >
                + Thêm câu hỏi
              </Button>
            </div>

            {pqQuestions.length === 0 ? (
              <p className="text-muted-foreground italic text-center py-2">Chưa có câu hỏi nào. Hãy bấm nút Thêm câu hỏi.</p>
            ) : (
              <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-1">
                {pqQuestions.map((q, qIdx) => (
                  <div key={qIdx} className="bg-muted/30 border border-border rounded-lg p-3 space-y-2 relative">
                    <button
                      onClick={() => setPqQuestions(prev => prev.filter((_, idx) => idx !== qIdx))}
                      className="absolute top-2 right-2 text-muted-foreground hover:text-destructive transition-colors outline-none bg-transparent border-none p-0 cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                    <div className="font-semibold text-foreground text-[10px] uppercase">Câu {qIdx + 1}</div>
                    
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        value={q.questionContent}
                        onChange={(e) => setPqQuestions(prev => {
                          const list = [...prev];
                          list[qIdx] = { ...list[qIdx], questionContent: e.target.value };
                          return list;
                        })}
                        placeholder="Nội dung câu hỏi..."
                        className="w-full bg-background border border-border rounded px-2.5 py-1 text-xs text-foreground focus-visible:ring-1 focus-visible:ring-primary outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">Loại câu hỏi</span>
                        <select
                          value={q.questionType}
                          onChange={(e) => setPqQuestions(prev => {
                            const list = [...prev];
                            const type = e.target.value as any;
                            const answers = type === 'TRUE_FALSE' 
                              ? [
                                  { answerContent: "Đúng", isCorrect: false },
                                  { answerContent: "Sai", isCorrect: false }
                                ]
                              : list[qIdx].answers.filter((a: any) => a.answerContent !== "Đúng" && a.answerContent !== "Sai");
                            
                            const finalAnswers = answers.length >= 2 ? answers : [
                              { answerContent: "", isCorrect: false },
                              { answerContent: "", isCorrect: false }
                            ];
                            
                            list[qIdx] = { 
                              ...list[qIdx], 
                              questionType: type,
                              answers: finalAnswers.map((a: any) => ({ ...a, isCorrect: false }))
                            };
                            return list;
                          })}
                          className="w-full bg-background border border-border rounded px-2 py-1 text-xs text-foreground focus-visible:ring-1 focus-visible:ring-primary outline-none"
                        >
                          <option value="MULTIPLE_CHOICE">Trắc nghiệm 1 đáp án</option>
                          <option value="MULTIPLE_SELECT">Trắc nghiệm nhiều đáp án</option>
                          <option value="TRUE_FALSE">Đúng / Sai</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">Điểm số</span>
                        <input
                          type="number"
                          value={q.score}
                          onChange={(e) => setPqQuestions(prev => {
                            const list = [...prev];
                            list[qIdx] = { ...list[qIdx], score: Math.max(1, Number(e.target.value)) };
                            return list;
                          })}
                          className="w-full bg-background border border-border rounded px-2 py-0.5 text-xs text-foreground focus-visible:ring-1 focus-visible:ring-primary outline-none"
                          min={1}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase">Đáp án</span>
                        {q.questionType !== 'TRUE_FALSE' && (
                          <button
                            onClick={() => setPqQuestions(prev => {
                              const list = [...prev];
                              list[qIdx] = {
                                ...list[qIdx],
                                answers: [...list[qIdx].answers, { answerContent: "", isCorrect: false }]
                              };
                              return list;
                            })}
                            className="text-[9px] font-bold text-primary hover:underline outline-none bg-transparent border-none p-0 cursor-pointer"
                          >
                            + Thêm đáp án
                          </button>
                        )}
                      </div>
                      <div className="space-y-1">
                        {q.answers.map((ans: any, aIdx: number) => (
                          <div key={aIdx} className="flex items-center gap-2">
                            <input
                              type={q.questionType === 'MULTIPLE_CHOICE' || q.questionType === 'TRUE_FALSE' ? 'radio' : 'checkbox'}
                              name={`correct-ans-${qIdx}`}
                              checked={ans.isCorrect}
                              onChange={(e) => setPqQuestions(prev => {
                                const list = [...prev];
                                const answers = list[qIdx].answers.map((a: any, idx: number) => {
                                  if (q.questionType === 'MULTIPLE_CHOICE' || q.questionType === 'TRUE_FALSE') {
                                    return { ...a, isCorrect: idx === aIdx };
                                  }
                                  return idx === aIdx ? { ...a, isCorrect: e.target.checked } : a;
                                });
                                list[qIdx] = { ...list[qIdx], answers };
                                return list;
                              })}
                              className="accent-primary shrink-0"
                            />
                            <input
                              type="text"
                              value={ans.answerContent}
                              onChange={(e) => setPqQuestions(prev => {
                                const list = [...prev];
                                const answers = [...list[qIdx].answers];
                                answers[aIdx] = { ...answers[aIdx], answerContent: e.target.value };
                                list[qIdx] = { ...list[qIdx], answers };
                                return list;
                              })}
                              placeholder={`Đáp án ${aIdx + 1}...`}
                              className="flex-1 bg-background border border-border rounded px-2 py-0.5 text-xs text-foreground focus-visible:ring-1 focus-visible:ring-primary outline-none"
                              disabled={q.questionType === 'TRUE_FALSE'}
                            />
                            {q.questionType !== 'TRUE_FALSE' && q.answers.length > 2 && (
                              <button
                                onClick={() => setPqQuestions(prev => {
                                  const list = [...prev];
                                  list[qIdx] = {
                                    ...list[qIdx],
                                    answers: list[qIdx].answers.filter((_: any, idx: number) => idx !== aIdx)
                                  };
                                  return list;
                                })}
                                className="text-muted-foreground hover:text-destructive transition-colors outline-none shrink-0 bg-transparent border-none p-0 cursor-pointer"
                              >
                                <Trash2 className="size-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1.5 border-t border-border/60 pt-3">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Chọn bài kiểm tra có sẵn</label>
            <select
              value={pqExistingTestId || ""}
              onChange={(e) => setPqExistingTestId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus-visible:ring-1 focus-visible:ring-primary outline-none"
            >
              <option value="">-- Chọn bài test --</option>
              {tests?.map((test) => (
                <option key={test.testId} value={test.testId}>
                  {test.title} ({test.durationMinutes} phút)
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-2 border-t border-border/60 pt-3">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Học sinh được giao ({pqTargetStudentIds.length}/{students.length})</label>
            <button
              onClick={() => {
                if (pqTargetStudentIds.length === students.length) {
                  setPqTargetStudentIds([]);
                } else {
                  setPqTargetStudentIds(students.map(s => s.userId));
                }
              }}
              className="text-[10px] text-primary font-bold hover:underline outline-none bg-transparent border-none p-0 cursor-pointer"
            >
              {pqTargetStudentIds.length === students.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
          </div>
          {students.length === 0 ? (
            <p className="italic text-muted-foreground py-1">Chưa có học sinh nào trong lớp</p>
          ) : (
            <div className="max-h-24 overflow-y-auto space-y-1 pr-1 border border-border rounded-lg p-2 bg-muted/20">
              {students.map((std) => {
                const isChecked = pqTargetStudentIds.includes(std.userId);
                return (
                  <div key={std.userId} className="flex items-center gap-2 py-0.5">
                    <Checkbox
                      id={`pq-std-${std.userId}`}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setPqTargetStudentIds(prev => [...prev, std.userId]);
                        } else {
                          setPqTargetStudentIds(prev => prev.filter(id => id !== std.userId));
                        }
                      }}
                    />
                    <label htmlFor={`pq-std-${std.userId}`} className="text-xs text-zinc-700 font-medium cursor-pointer flex-1 select-none">
                      {std.lastName} {std.firstName}
                    </label>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full">
                <Button
                  onClick={handleCreatePopQuiz}
                  disabled={submittingCreatePQ || students.length === 0 || !live}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold rounded-xl py-2 shadow-xs"
                >
                  {submittingCreatePQ ? "Đang giao bài..." : "⚡ Giao bài Pop Quiz"}
                </Button>
              </div>
            </TooltipTrigger>
            {!live && (
              <TooltipContent>
                Bắt đầu buổi học trước khi giao pop quiz
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <Activity className="size-3.5" /> Pop Quiz
      </h2>
      {renderContent()}
    </div>
  );
}
