import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { 
  studentService, 
  type PopQuizPendingResponse, 
  type PopQuizPaperResponse, 
  type AttemptSubmission 
} from '../../services/student.service';
import { TestRunner } from '../../pages/student/tests/components/TestRunner';

export interface StudentPopQuizRunnerProps {
  nodeId: number;
}

export function StudentPopQuizRunner({ nodeId }: StudentPopQuizRunnerProps) {
  const [activePopQuiz, setActivePopQuiz] = useState<PopQuizPendingResponse | null>(null);
  const [popQuizPaper, setPopQuizPaper] = useState<PopQuizPaperResponse | null>(null);
  const [startingPopQuiz, setStartingPopQuiz] = useState(false);
  const [submittingPopQuiz, setSubmittingPopQuiz] = useState(false);
  const [showPopQuizAlert, setShowPopQuizAlert] = useState(false);
  const [showPopQuizRunner, setShowPopQuizRunner] = useState(false);
  const [showPopQuizResult, setShowPopQuizResult] = useState(false);
  const [popQuizSecondsLeft, setPopQuizSecondsLeft] = useState<number>(0);

  // Poll for pending pop quiz
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await studentService.getPendingPopQuiz(nodeId);
        if (res) {
          setActivePopQuiz(res);
          if (res.status === 'PENDING') {
            setShowPopQuizAlert(true);
          } else if (res.status === 'IN_PROGRESS') {
            setShowPopQuizAlert(false);
            if (!popQuizPaper) {
              const paper = await studentService.getPopQuizPaper(res.assignmentId);
              setPopQuizPaper(paper);
              setPopQuizSecondsLeft(paper.remainingSeconds);
              setShowPopQuizRunner(true);
            }
          } else if (res.status === 'SUBMITTED' || res.status === 'EXPIRED') {
            if (showPopQuizRunner) {
              setShowPopQuizRunner(false);
              setShowPopQuizResult(true);
            }
          }
        } else {
          setActivePopQuiz(null);
          setPopQuizPaper(null);
          setShowPopQuizAlert(false);
          setShowPopQuizRunner(false);
        }
      } catch (err) {
        console.error("Error polling pop quiz:", err);
      }
    };

    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [nodeId, popQuizPaper, showPopQuizRunner]);



  const handleStartPopQuiz = async () => {
    if (!activePopQuiz) return;
    setStartingPopQuiz(true);
    try {
      const paper = await studentService.startPopQuizAttempt(activePopQuiz.assignmentId);
      setPopQuizPaper(paper);
      setPopQuizSecondsLeft(paper.remainingSeconds);
      setShowPopQuizAlert(false);
      setShowPopQuizRunner(true);
      toast.success("Bắt đầu làm bài kiểm tra nhanh!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể bắt đầu làm bài");
    } finally {
      setStartingPopQuiz(false);
    }
  };

  const handleSubmitPopQuiz = async (body: AttemptSubmission) => {
    if (!activePopQuiz) return;
    setSubmittingPopQuiz(true);
    try {
      const res = await studentService.submitPopQuizAttempt(activePopQuiz.assignmentId, body);
      setActivePopQuiz((prev) => prev ? { ...prev, status: 'SUBMITTED', score: res.score ?? undefined } : null);
      setShowPopQuizRunner(false);
      setShowPopQuizResult(true);
      toast.success("Nộp bài thành công!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Nộp bài thất bại");
    } finally {
      setSubmittingPopQuiz(false);
    }
  };

  const handleAutoSubmitPopQuiz = async () => {
    if (!activePopQuiz) return;
    setSubmittingPopQuiz(true);
    try {
      toast.warning("Hết giờ làm bài! Hệ thống đang nộp bài...", { duration: 5000 });
      const res = await studentService.submitPopQuizAttempt(activePopQuiz.assignmentId, { submissions: [] });
      setActivePopQuiz((prev) => prev ? { ...prev, status: 'EXPIRED', score: res.score ?? undefined } : null);
      setShowPopQuizRunner(false);
      setShowPopQuizResult(true);
    } catch (err) {
      setActivePopQuiz((prev) => prev ? { ...prev, status: 'EXPIRED', score: 0 } : null);
      setShowPopQuizRunner(false);
      setShowPopQuizResult(true);
    } finally {
      setSubmittingPopQuiz(false);
    }
  };

  const handlePopQuizTabOut = async () => {
    if (!popQuizPaper) return;
    try {
      const count = await studentService.recordTabOut(0, popQuizPaper.attemptId);
      toast.warning(`Bạn vừa rời khỏi tab khi đang làm bài (lần ${count}). Hành vi này được ghi nhận.`, {
        duration: 8000,
      });
    } catch {
      // ignore
    }
  };

  // Ref to always hold the latest auto-submit handler to avoid stale closures in stable interval
  const autoSubmitRef = useRef(handleAutoSubmitPopQuiz);
  useEffect(() => {
    autoSubmitRef.current = handleAutoSubmitPopQuiz;
  }, [handleAutoSubmitPopQuiz]);

  // Countdown timer for pop quiz (stable, does not tear down/rebuild every second)
  useEffect(() => {
    if (!showPopQuizRunner) return;
    const interval = setInterval(() => {
      setPopQuizSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          autoSubmitRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showPopQuizRunner]);

  return (
    <>
      {/* Alert Pop Quiz Dialog */}
      <Dialog open={showPopQuizAlert} onOpenChange={setShowPopQuizAlert}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <span className="animate-pulse">🔔</span>
              <span>Bài kiểm tra nhanh (Pop Quiz)!</span>
            </DialogTitle>
            <DialogDescription>
              Giảng viên vừa giao bài kiểm tra nhanh cho bạn:
              <strong className="block text-foreground text-base mt-2 font-bold">{activePopQuiz?.title}</strong>
              Thời gian làm bài: {activePopQuiz?.durationMinutes} phút.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end mt-4">
            <Button
              onClick={handleStartPopQuiz}
              disabled={startingPopQuiz}
              className="bg-slate-950 hover:bg-slate-900 text-white font-bold rounded-xl"
            >
              {startingPopQuiz ? "Đang kết nối..." : "Bắt đầu làm bài"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pop Quiz Runner Dialog */}
      <Dialog open={showPopQuizRunner} onOpenChange={() => {}}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-3 mb-4">
            <div className="flex justify-between items-center pr-6">
              <DialogTitle className="text-lg font-bold">Pop Quiz: {popQuizPaper?.title}</DialogTitle>
              <div className="flex items-center gap-2 bg-amber-55 border border-amber-200 px-3 py-1.5 rounded-lg text-amber-700 font-extrabold text-sm animate-pulse">
                <span>⏱️ Còn lại:</span>
                <span>
                  {Math.floor(popQuizSecondsLeft / 60)}m {popQuizSecondsLeft % 60}s
                </span>
              </div>
            </div>
          </DialogHeader>
          {popQuizPaper && (
            <div className="py-2">
              <TestRunner
                details={{
                  testId: popQuizPaper.assignmentId,
                  title: popQuizPaper.title,
                  durationMinutes: popQuizPaper.durationMinutes,
                  questions: popQuizPaper.questions.map((q) => ({
                    questionId: q.questionId,
                    questionContent: q.questionContent,
                    questionType: q.questionType as any,
                    score: q.score,
                    answers: q.answers,
                  })),
                }}
                started={true}
                submitting={submittingPopQuiz}
                onStart={() => {}}
                onSubmit={handleSubmitPopQuiz}
                onTabOut={handlePopQuizTabOut}
                submitLabel="Nộp bài Pop Quiz"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pop Quiz Results Dialog */}
      <Dialog open={showPopQuizResult} onOpenChange={setShowPopQuizResult}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">Kết quả Pop Quiz</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6 space-y-4">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-4xl border border-emerald-200 font-bold">
              {activePopQuiz?.score != null ? `${activePopQuiz.score}%` : '---'}
            </div>
            <p className="text-sm text-zinc-500 font-medium text-center">
              {activePopQuiz?.status === 'EXPIRED' 
                ? 'Bài làm của bạn đã quá hạn nộp. Hệ thống ghi nhận 0 điểm.' 
                : 'Bài kiểm tra nhanh của bạn đã được ghi nhận thành công.'}
            </p>
          </div>
          <DialogFooter className="sm:justify-center mt-2">
            <Button
              onClick={() => {
                setShowPopQuizResult(false);
                setActivePopQuiz(null);
                setPopQuizPaper(null);
              }}
              className="bg-slate-950 hover:bg-slate-900 text-white font-bold rounded-xl px-6"
            >
              Đồng ý
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
