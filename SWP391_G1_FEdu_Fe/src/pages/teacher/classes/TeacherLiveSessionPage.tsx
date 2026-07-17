import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import {
  ArrowLeft,
  Activity,
  AlarmClock,
  Award,
  FileText,
  Loader2,
  Play,
  Plus,
  Radio,
  Square,
  Upload,
  Code2,
} from 'lucide-react';
import {
  learningPathService,
  LiveSessionState,
  StudentAttemptResponse,
  StudentInClassResponse,
} from '../../../services/learningPath.service';
import { uploadService } from '../../../services/upload.service';
import { MaterialPreview } from '../../../components/learningPath/MaterialPreview';
import { TeacherPopQuizPanel } from '../../../components/popQuiz/TeacherPopQuizPanel';



const POLL_MS = 5000;

const fmtTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—';

const fmtCountdown = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export function TeacherLiveSessionPage() {
  const { classroomSubjectId, nodeId } = useParams();
  const csId = Number(classroomSubjectId);
  const nid = Number(nodeId);
  const navigate = useNavigate();

  const [state, setState] = useState<LiveSessionState | null>(null);
  const [attempts, setAttempts] = useState<StudentAttemptResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [monitorTab, setMonitorTab] = useState<'doing' | 'cheat'>('doing');
  const [students, setStudents] = useState<StudentInClassResponse[]>([]);
  const [pollTick, setPollTick] = useState(0);

  
  const clockOffsetRef = useRef(0);
  const [nowTick, setNowTick] = useState(Date.now());

  
  const [mTitle, setMTitle] = useState('');
  const [mType, setMType] = useState<'VIDEO' | 'FILE'>('FILE');
  const [mVideoUrl, setMVideoUrl] = useState('');
  const [mFile, setMFile] = useState<File | null>(null);
  const [addingMaterial, setAddingMaterial] = useState(false);

  
  const [showCreateTest, setShowCreateTest] = useState(false);
  const [tTitle, setTTitle] = useState('');
  const [tDuration, setTDuration] = useState('15');
  const [tPass, setTPass] = useState('50');
  const [creatingTest, setCreatingTest] = useState(false);

  // Dialog soạn câu hỏi (Pop Quiz)
  const [showEditQuestions, setShowEditQuestions] = useState(false);
  const [editingNodeTest, setEditingNodeTest] = useState<any | null>(null);
  const [editingTTitle, setEditingTTitle] = useState("");
  const [editingTDuration, setEditingTDuration] = useState("15");
  const [editingTPass, setEditingTPass] = useState("0");
  const [editingNumQuestions, setEditingNumQuestions] = useState("0");
  const [builderQuestions, setBuilderQuestions] = useState<any[]>([]);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [savingQuestions, setSavingQuestions] = useState(false);

  const fetchState = useCallback(async (silent: boolean) => {
    if (!csId || !nid) return;
    if (!silent) setLoading(true);
    try {
      const s = await learningPathService.getTeacherLiveState(csId, nid);
      setState(s);
      if (s.serverTime) clockOffsetRef.current = new Date(s.serverTime).getTime() - Date.now();
      if (s.activeTest) {
        try {
          const atts = await learningPathService.getTestAttempts(s.activeTest.testId);
          setAttempts(atts ?? []);
        } catch {
          
        }
      }
    } catch (err: any) {
      if (!silent) toast.error(err.response?.data?.message || 'Không tải được trạng thái buổi học');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [csId, nid]);

  useEffect(() => {
    fetchState(false);
    const poll = setInterval(() => {
      fetchState(true);
      setPollTick((prev) => prev + 1);
    }, POLL_MS);
    const tick = setInterval(() => setNowTick(Date.now()), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [fetchState]);

  useEffect(() => {
    const loadStudents = async () => {
      if (!nid) return;
      try {
        const list = await learningPathService.getNodeStudents(nid);
        setStudents(list ?? []);
      } catch (err) {
        console.error("Lỗi khi tải danh sách học sinh:", err);
      }
    };
    loadStudents();
  }, [nid]);

  const serverNow = nowTick + clockOffsetRef.current;

  const handleStart = async () => {
    try {
      setActing(true);
      setState(await learningPathService.startLiveSession(csId, nid));
      toast.success('Đã bắt đầu buổi học — node được mở khóa cho cả lớp');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không bắt đầu được buổi học');
    } finally {
      setActing(false);
    }
  };

  const handleEnd = async () => {
    if (!confirm('Kết thúc buổi học?')) return;
    try {
      setActing(true);
      setState(await learningPathService.endLiveSession(csId, nid));
      toast.success('Đã kết thúc buổi học');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không kết thúc được buổi học');
    } finally {
      setActing(false);
    }
  };

  const handleRelease = async (testId: number, title: string) => {
    if (!confirm(`Phát đề "${title}" cho cả lớp? Hạn nộp chung = bây giờ + thời lượng đề.`)) return;
    try {
      setActing(true);
      const s = await learningPathService.releaseLiveTest(csId, nid, testId);
      setState(s);
      setMonitorTab('doing');
      toast.success('Đã phát đề cho cả lớp!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không phát được đề');
    } finally {
      setActing(false);
    }
  };

  const handleAddMaterial = async () => {
    if (!mTitle.trim()) {
      toast.error('Nhập tiêu đề tài liệu');
      return;
    }
    try {
      setAddingMaterial(true);
      const formData = new FormData();
      formData.append('title', mTitle.trim());
      formData.append('required', 'true');
      if (mType === 'VIDEO') {
        if (!mVideoUrl.trim()) {
          toast.error('Nhập đường dẫn video');
          return;
        }
        formData.append('videoUrl', mVideoUrl.trim());
        formData.append('videoTitle', mTitle.trim());
      } else {
        if (!mFile) {
          toast.error('Chọn file tải lên');
          return;
        }
        const uploaded = await uploadService.uploadToCloudinary(mFile, 'materials');
        formData.append('fileUrl', uploaded.url);
        formData.append('fileName', mFile.name);
        formData.append('fileType', mFile.type || uploaded.format || '');
        formData.append('publicId', uploaded.publicId);
        if (uploaded.resourceType) {
          formData.append('resourceType', uploaded.resourceType);
        }
      }
      await learningPathService.addTeacherNodeMaterial(nid, formData);
      toast.success('Đã thêm tài liệu — học sinh sẽ thấy trong vài giây');
      setMTitle('');
      setMVideoUrl('');
      setMFile(null);
      fetchState(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thêm được tài liệu');
    } finally {
      setAddingMaterial(false);
    }
  };

  const handleCreateTest = async () => {
    if (!tTitle.trim()) {
      toast.error('Nhập tiêu đề đề kiểm tra');
      return;
    }
    const duration = Number(tDuration);
    if (!duration || duration <= 0) {
      toast.error('Thời lượng (phút) phải lớn hơn 0');
      return;
    }
    try {
      setCreatingTest(true);
      await learningPathService.addTeacherNodeTest(nid, {
        title: tTitle.trim(),
        durationMinutes: duration,
        passingPercentage: Number(tPass) || 0,
        holdRelease: true, 
      });
      toast.success('Đã tạo đề (chưa phát). Thêm câu hỏi rồi bấm "Phát đề".');
      setShowCreateTest(false);
      setTTitle('');
      fetchState(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không tạo được đề');
    } finally {
      setCreatingTest(false);
    }
  };

  const handleNumQuestionsChange = (val: string) => {
    setEditingNumQuestions(val);
    const num = Math.max(0, parseInt(val, 10) || 0);
    setBuilderQuestions((prev) => {
      const next = [...prev];
      while (next.length < num) {
        next.push({
          questionContent: "",
          questionType: "MULTIPLE_CHOICE",
          answers: [
            { answerContent: "", isCorrect: false },
            { answerContent: "", isCorrect: false },
            { answerContent: "", isCorrect: false },
            { answerContent: "", isCorrect: false },
          ],
        });
      }
      return next.slice(0, num);
    });
    setActiveQuestionIdx(0);
  };

  const handleQuestionTypeChange = (idx: number, type: 'MULTIPLE_CHOICE' | 'MULTIPLE_SELECT' | 'ESSAY') => {
    setBuilderQuestions((prev) => {
      const next = [...prev];
      if (next[idx]) {
        next[idx] = {
          ...next[idx],
          questionType: type,
          answers: type === 'ESSAY'
            ? [{ answerContent: "", isCorrect: true }]
            : [
                { answerContent: "", isCorrect: false },
                { answerContent: "", isCorrect: false },
                { answerContent: "", isCorrect: false },
                { answerContent: "", isCorrect: false },
              ]
        };
      }
      return next;
    });
  };

  const updateQuestionField = (idx: number, field: string, value: any) => {
    setBuilderQuestions((prev) => {
      const next = [...prev];
      if (next[idx]) {
        next[idx] = { ...next[idx], [field]: value };
      }
      return next;
    });
  };

  const addAnswerOption = (qIdx: number) => {
    setBuilderQuestions((prev) => {
      const next = [...prev];
      if (next[qIdx]) {
        next[qIdx] = {
          ...next[qIdx],
          answers: [...next[qIdx].answers, { answerContent: "", isCorrect: false }]
        };
      }
      return next;
    });
  };

  const updateAnswerField = (qIdx: number, aIdx: number, field: string, value: any) => {
    setBuilderQuestions((prev) => {
      const next = [...prev];
      if (next[qIdx] && next[qIdx].answers[aIdx]) {
        const newAnswers = [...next[qIdx].answers];
        newAnswers[aIdx] = { ...newAnswers[aIdx], [field]: value };
        next[qIdx] = { ...next[qIdx], answers: newAnswers };
      }
      return next;
    });
  };

  const removeAnswerOption = (qIdx: number, aIdx: number) => {
    setBuilderQuestions((prev) => {
      const next = [...prev];
      if (next[qIdx]) {
        next[qIdx] = {
          ...next[qIdx],
          answers: next[qIdx].answers.filter((_: any, i: number) => i !== aIdx)
        };
      }
      return next;
    });
  };

  const startEditingTestQuestions = async (test: any) => {
    setEditingNodeTest(test);
    setEditingTTitle(test.title);
    setEditingTDuration(String(test.durationMinutes || 15));
    setEditingTPass(String(test.passingPercentage || 0));
    setShowEditQuestions(true);
    setSavingQuestions(true);
    try {
      const qList = await learningPathService.getTeacherTestQuestions(test.testId);
      setEditingNumQuestions(String(qList.length));
      setBuilderQuestions(qList.map((q) => ({
        questionType: q.questionType === 'ESSAY' ? 'ESSAY' : (q.questionType === 'MULTIPLE_SELECT' ? 'MULTIPLE_SELECT' : 'MULTIPLE_CHOICE'),
        questionContent: q.questionContent,
        answers: q.answers.map((a) => ({
          answerContent: a.answerContent,
          isCorrect: a.isCorrect
        }))
      })));
      setActiveQuestionIdx(0);
    } catch (err) {
      console.error("Failed to load questions", err);
      setEditingNumQuestions("0");
      setBuilderQuestions([]);
      setActiveQuestionIdx(0);
    } finally {
      setSavingQuestions(false);
    }
  };

  const saveTestQuestions = async () => {
    const testTitleToUse = editingTTitle.trim();
    if (!testTitleToUse) {
      toast.error("Nhập tiêu đề bài test");
      return;
    }
    const numQ = Math.max(0, parseInt(editingNumQuestions, 10) || 0);

    // Validate questions
    for (let i = 0; i < numQ; i++) {
      const q = builderQuestions[i];
      if (!q) continue;
      if (!q.questionContent.trim()) {
        toast.error(`Câu hỏi ${i + 1} không được để trống nội dung`);
        return;
      }
      if (q.questionType === 'MULTIPLE_CHOICE' || q.questionType === 'MULTIPLE_SELECT') {
        const correctAnswers = q.answers.filter((a: any) => a.isCorrect);
        if (correctAnswers.length === 0) {
          toast.error(`Câu hỏi ${i + 1} phải có ít nhất 1 đáp án đúng`);
          return;
        }
        for (let j = 0; j < q.answers.length; j++) {
          if (!q.answers[j].answerContent.trim()) {
            toast.error(`Đáp án ${String.fromCharCode(65 + j)} của câu hỏi ${i + 1} không được để trống`);
            return;
          }
        }
      } else if (q.questionType === 'ESSAY') {
        if (!q.answers[0] || !q.answers[0].answerContent.trim()) {
          toast.error(`Câu hỏi tự luận ${i + 1} phải nhập câu trả lời mẫu/hướng dẫn chấm`);
          return;
        }
      }
    }

    setSavingQuestions(true);
    try {
      // 1. Delete old test
      if (editingNodeTest) {
        await learningPathService.deleteTeacherNodeTest(editingNodeTest.testId);
      }

      // 2. Create new test
      const testRes = await learningPathService.addTeacherNodeTest(nid, {
        title: testTitleToUse,
        durationMinutes: Number(editingTDuration) || 15,
        passingPercentage: Number(editingTPass) || 0,
        holdRelease: true,
      });

      const createdTestId = testRes.testId;

      // 3. Create questions
      for (let i = 0; i < numQ; i++) {
        const q = builderQuestions[i];
        if (!q) continue;
        await learningPathService.addPlacementQuestion(createdTestId, {
          questionContent: q.questionContent.trim(),
          questionType: q.questionType,
          score: 1.0,
          answers: q.answers.map((a: any) => ({
            answerContent: a.answerContent.trim(),
            isCorrect: a.isCorrect
          }))
        });
      }

      toast.success("Cập nhật bài kiểm tra thành công");
      setShowEditQuestions(false);
      await fetchState(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không lưu được bài kiểm tra");
    } finally {
      setSavingQuestions(false);
    }
  };

  const renderQuestionBuilder = () => {
    const numQ = Math.max(0, parseInt(editingNumQuestions, 10) || 0);
    if (numQ <= 0) return null;
    return (
      <div className="space-y-3 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {Array.from({ length: numQ }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveQuestionIdx(idx)}
              className={`size-7 shrink-0 rounded-md text-xs font-bold transition-all border ${
                activeQuestionIdx === idx
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {builderQuestions[activeQuestionIdx] && (
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Câu hỏi {activeQuestionIdx + 1}
              </span>
              <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-md">
                <button
                  type="button"
                  onClick={() => handleQuestionTypeChange(activeQuestionIdx, 'MULTIPLE_CHOICE')}
                  className={`px-1.5 py-0.5 rounded-sm text-[9px] font-semibold transition-all ${
                    builderQuestions[activeQuestionIdx].questionType === 'MULTIPLE_CHOICE'
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Một đáp án
                </button>
                <button
                  type="button"
                  onClick={() => handleQuestionTypeChange(activeQuestionIdx, 'MULTIPLE_SELECT')}
                  className={`px-1.5 py-0.5 rounded-sm text-[9px] font-semibold transition-all ${
                    builderQuestions[activeQuestionIdx].questionType === 'MULTIPLE_SELECT'
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Nhiều đáp án
                </button>
                <button
                  type="button"
                  onClick={() => handleQuestionTypeChange(activeQuestionIdx, 'ESSAY')}
                  className={`px-1.5 py-0.5 rounded-sm text-[9px] font-semibold transition-all ${
                    builderQuestions[activeQuestionIdx].questionType === 'ESSAY'
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Tự luận
                </button>
              </div>
            </div>

            <textarea
              className="lp-input text-xs w-full border border-slate-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white"
              placeholder="Nhập đề / nội dung câu hỏi..."
              rows={2}
              value={builderQuestions[activeQuestionIdx].questionContent}
              onChange={(e) => updateQuestionField(activeQuestionIdx, 'questionContent', e.target.value)}
            />

            {builderQuestions[activeQuestionIdx].questionType === 'MULTIPLE_CHOICE' ||
            builderQuestions[activeQuestionIdx].questionType === 'MULTIPLE_SELECT' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                  <span>
                    ĐÁP ÁN ({builderQuestions[activeQuestionIdx].questionType === 'MULTIPLE_CHOICE' ? 'Chọn 1 đáp án đúng' : 'Chọn nhiều đáp án đúng'})
                  </span>
                  <button
                    type="button"
                    onClick={() => addAnswerOption(activeQuestionIdx)}
                    className="text-indigo-600 hover:underline text-[10px]"
                  >
                    + Thêm đáp án
                  </button>
                </div>
                <div className="space-y-1.5">
                  {builderQuestions[activeQuestionIdx].answers.map((ans: any, aIdx: number) => (
                    <div key={aIdx} className="flex items-center gap-2">
                      <span className="font-semibold text-[10px] text-slate-400 shrink-0 w-3">
                        {String.fromCharCode(65 + aIdx)}
                      </span>
                      <input
                        type="text"
                        placeholder={`Đáp án ${String.fromCharCode(65 + aIdx)}`}
                        className="lp-input flex-1 py-1 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white"
                        value={ans.answerContent}
                        onChange={(e) => updateAnswerField(activeQuestionIdx, aIdx, 'answerContent', e.target.value)}
                      />
                      <input
                        type={builderQuestions[activeQuestionIdx].questionType === 'MULTIPLE_CHOICE' ? 'radio' : 'checkbox'}
                        name={`correct-ans-live-${activeQuestionIdx}`}
                        checked={!!ans.isCorrect}
                        onChange={(e) => {
                          if (builderQuestions[activeQuestionIdx].questionType === 'MULTIPLE_CHOICE') {
                            builderQuestions[activeQuestionIdx].answers.forEach((_: any, i: number) => {
                              updateAnswerField(activeQuestionIdx, i, 'isCorrect', i === aIdx);
                            });
                          } else {
                            updateAnswerField(activeQuestionIdx, aIdx, 'isCorrect', e.target.checked);
                          }
                        }}
                        className="h-3.5 w-3.5 text-indigo-600 cursor-pointer"
                      />
                      {builderQuestions[activeQuestionIdx].answers.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeAnswerOption(activeQuestionIdx, aIdx)}
                          className="text-red-500 hover:text-red-700 text-xs px-1"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 block">CÂU TRẢ LỜI MẪU / HƯỚNG DẪN CHẤM</span>
                <textarea
                  className="lp-input text-xs w-full border border-slate-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white"
                  placeholder="Nhập câu trả lời mẫu cho tự luận..."
                  rows={3}
                  value={builderQuestions[activeQuestionIdx].answers[0]?.answerContent || ""}
                  onChange={(e) => updateAnswerField(activeQuestionIdx, 0, 'answerContent', e.target.value)}
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading || !state) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Đang tải buổi học...</span>
      </div>
    );
  }

  const tests = state.content?.tests ?? [];
  const materials = state.content?.materials ?? [];
  const active = state.activeTest;
  const activeRemainMs = active?.releaseEndsAt ? new Date(active.releaseEndsAt).getTime() - serverNow : 0;
  const doing = attempts.filter((a) => a.status === 'IN_PROGRESS');
  const cheaters = attempts
    .filter((a) => (a.tabOutCount ?? 0) > 0 && a.status !== 'CANCELLED')
    .sort((x, y) => (y.tabOutCount ?? 0) - (x.tabOutCount ?? 0));

  return (
    <div className="space-y-5 text-foreground">
      {}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate(`/teacher/classroom-subjects/${csId}`)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold tracking-tight truncate flex items-center gap-2">
            <Radio className={`size-5 ${state.live ? 'text-rose-500 animate-pulse' : 'text-muted-foreground'}`} />
            {state.nodeTitle}
          </h1>
          <p className="text-xs text-muted-foreground">
            Buổi học trên lớp
            {state.studyDate ? ` • ${new Date(state.studyDate).toLocaleDateString('vi-VN')}` : ''}
            {state.slotName ? ` • ${state.slotName} (${fmtTime(state.sessionWindowStart)} - ${fmtTime(state.sessionWindowEnd)})` : ' • Chưa xếp lịch'}
          </p>
        </div>
        {state.live ? (
          <>
            <Badge className="bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold px-2 py-1 rounded-md">
              ● ĐANG DIỄN RA (từ {fmtTime(state.sessionStartedAt)})
            </Badge>
            <Button variant="outline" onClick={handleEnd} disabled={acting}
              className="h-9 rounded-xl text-xs border-destructive/30 text-destructive hover:bg-destructive/10 font-semibold">
              <Square className="size-3.5 mr-1.5" /> Kết thúc buổi học
            </Button>
          </>
        ) : (
          <Button onClick={handleStart} disabled={acting || !state.canStart}
            title={state.canStart ? '' : 'Chỉ bắt đầu được trong khung giờ của buổi học đã xếp lịch'}
            className="h-9 rounded-xl text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
            {acting ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : <Play className="size-3.5 mr-1.5" />}
            Bắt đầu buổi học
          </Button>
        )}
      </div>

      {!state.live && (
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
          {state.sessionEndedAt
            ? `Buổi học đã kết thúc lúc ${fmtTime(state.sessionEndedAt)}.`
            : state.canStart
              ? 'Đang trong khung giờ buổi học — bấm "Bắt đầu buổi học" để mở khóa node cho cả lớp.'
              : 'Ngoài khung giờ buổi học. Nút bắt đầu chỉ mở trong khung giờ của ca đã xếp lịch.'}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {}
        <div className="space-y-5">
          {}
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="size-3.5" /> Tài liệu buổi học ({materials.length})
            </h2>
            <div className="space-y-2 max-h-[38vh] overflow-y-auto">
              {materials.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Chưa có tài liệu — thêm bên dưới, học sinh thấy ngay.</p>
              ) : (
                materials.map((m) => (
                  <div key={m.materialId} className="rounded-lg border border-border bg-muted/30 p-2 text-xs">
                    <p className="font-semibold text-foreground mb-1.5">{m.title}</p>
                    <MaterialPreview material={m} />
                  </div>
                ))
              )}
            </div>

            {}
            <div className="border-t border-border pt-3 space-y-2">
              <div className="flex gap-2">
                <input
                  value={mTitle}
                  onChange={(e) => setMTitle(e.target.value)}
                  placeholder="Tiêu đề tài liệu..."
                  className="flex-1 border border-border rounded-xl px-3 py-2 text-xs bg-background outline-none focus:border-primary/50"
                />
                <select
                  value={mType}
                  onChange={(e) => setMType(e.target.value as 'VIDEO' | 'FILE')}
                  className="border border-border rounded-xl px-2 py-2 text-xs bg-background outline-none"
                >
                  <option value="FILE">File</option>
                  <option value="VIDEO">Video URL</option>
                </select>
              </div>
              {mType === 'VIDEO' ? (
                <input
                  value={mVideoUrl}
                  onChange={(e) => setMVideoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full border border-border rounded-xl px-3 py-2 text-xs bg-background outline-none focus:border-primary/50"
                />
              ) : (
                <input
                  type="file"
                  onChange={(e) => setMFile(e.target.files?.[0] ?? null)}
                  className="w-full text-xs text-muted-foreground file:mr-2 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-semibold"
                />
              )}
              <Button onClick={handleAddMaterial} disabled={addingMaterial}
                className="w-full h-8 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground">
                {addingMaterial ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : <Upload className="size-3.5 mr-1.5" />}
                Đưa tài liệu lên
              </Button>
            </div>
          </div>

          {}
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Award className="size-3.5" /> Đề kiểm tra ({tests.length})
              </h2>
              <Button variant="outline" onClick={() => setShowCreateTest(true)}
                className="h-7 rounded-lg text-[11px] font-semibold border-border">
                <Plus className="size-3 mr-1" /> Soạn đề mới
              </Button>
            </div>
            {tests.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Chưa có đề nào cho buổi học này.</p>
            ) : (
              <div className="space-y-2">
                {tests.map((t) => {
                  const isActive = active?.testId === t.testId;
                  const notReleased = !t.releasedAt;
                  const timedOut = !!t.releaseEndsAt && new Date(t.releaseEndsAt).getTime() <= serverNow;
                  return (
                    <div key={t.testId} className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-2 text-xs">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{t.title} ({t.durationMinutes ?? '—'} phút)</p>
                        <p className="text-[10px] text-muted-foreground">
                          {notReleased
                            ? 'Chưa phát — học sinh không thấy đề này'
                            : isActive
                              ? `Đang làm bài — còn ${fmtCountdown(activeRemainMs)}`
                              : timedOut
                                ? `Đã hết giờ lúc ${fmtTime(t.releaseEndsAt)}`
                                : 'Đã phát (đề thường, không giới hạn giờ chung)'}
                        </p>
                      </div>
                      {isActive ? (
                        <Badge className="bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold rounded-md px-2 py-0.5 shrink-0">
                          <AlarmClock className="size-3 mr-1" /> {fmtCountdown(activeRemainMs)}
                        </Badge>
                      ) : (
                        <div className="flex items-center gap-1.5 shrink-0">
                          {notReleased && (
                            <Button
                              onClick={() => startEditingTestQuestions(t)}
                              disabled={acting}
                              variant="outline"
                              className="h-7 px-2 rounded-lg text-[11px] font-bold border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                            >
                              Soạn câu hỏi
                            </Button>
                          )}
                          {(notReleased || timedOut) && (
                            <Button
                              onClick={() => handleRelease(t.testId, t.title)}
                              disabled={acting || !state.live}
                              title={state.live ? '' : 'Bắt đầu buổi học trước khi phát đề'}
                              className="h-7 px-2.5 rounded-lg text-[11px] font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
                            >
                              {timedOut ? 'Phát lại' : 'Phát đề'}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-[10px] text-muted-foreground italic">
              Soạn câu hỏi cho đề trong trang quản lý node (tab nội dung) trước khi phát.
            </p>
          </div>

          {state && (
            <TeacherPopQuizPanel
              nodeId={nid}
              students={students}
              live={state.live}
              pollTick={pollTick}
              tests={tests}
            />
          )}
        </div>

        {}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="size-3.5" /> Theo dõi bài làm
            <span className="ml-auto normal-case font-normal italic text-[10px]">Tự làm mới mỗi 5 giây</span>
          </h2>
          {!active ? (
            <p className="text-xs text-muted-foreground italic py-8 text-center">
              Chưa có đề nào đang trong giờ làm bài. Phát đề để bắt đầu theo dõi.
            </p>
          ) : (
            <>
              <div className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs flex items-center justify-between">
                <span className="font-semibold text-foreground truncate">{active.title}</span>
                <span className="font-bold text-rose-600 dark:text-rose-400 shrink-0 ml-2">
                  ⏱ {fmtCountdown(activeRemainMs)}
                </span>
              </div>
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <button onClick={() => setMonitorTab('doing')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    monitorTab === 'doing' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}>
                  Đang làm ({doing.length})
                </button>
                <button onClick={() => setMonitorTab('cheat')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    monitorTab === 'cheat' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}>
                  Cảnh báo gian lận ({cheaters.length})
                </button>
              </div>
              {(monitorTab === 'doing' ? doing : cheaters).length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-6 text-center">
                  {monitorTab === 'doing' ? 'Chưa có học sinh nào đang làm bài.' : 'Chưa ghi nhận học sinh nào rời tab.'}
                </p>
              ) : (
                <div className="max-h-[46vh] overflow-y-auto divide-y divide-border border border-border rounded-xl">
                  {(monitorTab === 'doing' ? doing : cheaters).map((a) => (
                    <div key={a.attemptId} className="flex items-center gap-3 p-2.5 text-xs">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{a.studentName || a.studentEmail || `HS #${a.studentId}`}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{a.studentEmail}</p>
                      </div>
                      {monitorTab === 'doing' ? (
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          Bắt đầu: {fmtTime(a.startedAt)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {a.status === 'IN_PROGRESS' ? 'Đang làm' : a.score != null ? `Đã nộp — ${a.score} điểm` : 'Đã nộp'}
                        </span>
                      )}
                      {(a.tabOutCount ?? 0) > 0 && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                          (a.tabOutCount ?? 0) >= 3
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400'
                            : 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400'
                        }`}>
                          {a.tabOutCount} lần rời tab
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {}
      <Dialog open={showCreateTest} onOpenChange={setShowCreateTest}>
        <DialogContent className="sm:max-w-md bg-background border-border text-xs">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Award className="size-5 text-primary" /> Soạn đề mới (chưa phát)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="font-bold text-muted-foreground">Tiêu đề đề kiểm tra</label>
              <input value={tTitle} onChange={(e) => setTTitle(e.target.value)}
                className="w-full border border-border rounded-xl px-3 py-2 text-xs bg-background outline-none focus:border-primary/50" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-bold text-muted-foreground">Thời lượng (phút)</label>
                <input type="number" min={1} value={tDuration} onChange={(e) => setTDuration(e.target.value)}
                  className="w-full border border-border rounded-xl px-3 py-2 text-xs bg-background outline-none focus:border-primary/50" />
              </div>
              <div className="space-y-1.5">
                <label className="font-bold text-muted-foreground">Điểm đạt (%)</label>
                <input type="number" min={0} max={100} value={tPass} onChange={(e) => setTPass(e.target.value)}
                  className="w-full border border-border rounded-xl px-3 py-2 text-xs bg-background outline-none focus:border-primary/50" />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground italic">
              Đề tạo ở đây sẽ Ở TRẠNG THÁI CHƯA PHÁT — học sinh không thấy cho tới khi bạn bấm "Phát đề".
              Nhớ thêm câu hỏi cho đề (trang quản lý node) trước khi phát.
            </p>
          </div>
          <DialogFooter className="border-t border-border pt-3 flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowCreateTest(false)} className="h-9 rounded-xl text-xs">Đóng</Button>
            <Button onClick={handleCreateTest} disabled={creatingTest}
              className="h-9 rounded-xl text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              {creatingTest ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null}
              Tạo đề
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Soạn câu hỏi */}
      <Dialog open={showEditQuestions} onOpenChange={setShowEditQuestions}>
        <DialogContent className="sm:max-w-2xl bg-white border-border text-xs max-h-[90vh] overflow-y-auto text-slate-800">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
              <Award className="size-5 text-primary" /> Cấu hình: {editingTTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Cấu hình chung */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Tiêu đề đề thi</label>
                <input
                  type="text"
                  className="w-full border border-slate-300 bg-white rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/50 text-slate-800"
                  value={editingTTitle}
                  onChange={(e) => setEditingTTitle(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 col-span-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Thời lượng (phút)</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full border border-slate-300 bg-white rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/50 text-center text-slate-800"
                    value={editingTDuration}
                    onChange={(e) => setEditingTDuration(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">% Đạt</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="w-full border border-slate-300 bg-white rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/50 text-center text-slate-800"
                    value={editingTPass}
                    onChange={(e) => setEditingTPass(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Số câu hỏi</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full border border-slate-300 bg-white rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/50 text-center text-slate-800"
                    value={editingNumQuestions}
                    onChange={(e) => handleNumQuestionsChange(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Question Builder Container */}
            {renderQuestionBuilder()}
          </div>
          <DialogFooter className="border-t border-slate-100 pt-3 flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowEditQuestions(false)} className="h-9 rounded-xl text-xs">Đóng</Button>
            <Button onClick={saveTestQuestions} disabled={savingQuestions}
              className="h-9 rounded-xl text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              {savingQuestions ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null}
              Lưu bài test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <style>{`
        .lp-input {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 6px 10px;
          font-size: 14px;
          outline: none;
          color: #0f172a !important;
          background-color: #f8fafc !important;
        }
        .lp-input:focus {
          border-color: #0f172a;
        }
      `}</style>
    </div>
  );
}
