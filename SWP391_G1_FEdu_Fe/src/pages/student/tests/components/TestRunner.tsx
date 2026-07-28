import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Clock, Target, Loader, Play, Send } from 'lucide-react';
import { QuestionField, type AnswerValue } from './QuestionField';
import type { AttemptSubmission, StudentTestDetails } from '../../../../services/student.service';

interface TestRunnerProps {
  details: StudentTestDetails;
  started: boolean;
  starting?: boolean;
  submitting?: boolean;
  onStart: () => void;
  onSubmit: (body: AttemptSubmission) => void;
  
  onTabOut?: () => void;
  startLabel?: string;
  submitLabel?: string;
  /**
   * Số giây còn lại do máy chủ tính tại lúc bắt đầu lượt làm bài. Có giá trị thì hiện đồng hồ
   * đếm ngược và tự nộp bài khi về 0. Bỏ qua (undefined/null) thì component chạy y như trước —
   * các luồng khác dùng chung TestRunner không bị ảnh hưởng.
   */
  remainingSeconds?: number | null;
  /** Gọi ngay trước khi tự nộp, để trang cha báo cho học sinh biết là đã hết giờ. */
  onTimeUp?: () => void;
}

const EMPTY_ANSWER: AnswerValue = { selectedAnswerIds: [], responseText: '' };

const formatClock = (totalSeconds: number) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};



export function TestRunner({
  details,
  started,
  starting,
  submitting,
  onStart,
  onSubmit,
  onTabOut,
  startLabel = 'Bắt đầu làm bài',
  submitLabel = 'Nộp bài',
  remainingSeconds,
  onTimeUp,
}: TestRunnerProps) {
  const [answers, setAnswers] = useState<Record<number, AnswerValue>>({});
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const timed = remainingSeconds != null;
  const timeUp = secondsLeft === 0;

  
  
  useEffect(() => {
    if (!started || !onTabOut) return;
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') onTabOut();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [started, onTabOut]);

  const getAnswer = useCallback((questionId: number): AnswerValue =>
    answers[questionId] ?? EMPTY_ANSWER, [answers]);

  const handleAnswerChange = useCallback((questionId: number, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const buildPayload = (): AttemptSubmission => ({
    submissions: details.questions.map((q) => {
      const a = getAnswer(q.questionId);
      const submission: AttemptSubmission['submissions'][number] = { questionId: q.questionId };
      if (a.selectedAnswerIds.length > 0) submission.selectedAnswerIds = a.selectedAnswerIds;
      if (a.responseText.trim().length > 0) submission.responseText = a.responseText.trim();
      return submission;
    }),
  });

  // Ref luôn giữ hàm tự nộp mới nhất, để interval bên dưới không kẹt closure cũ —
  // nếu kẹt thì bài tự nộp sẽ thiếu các câu học sinh trả lời sau khi đồng hồ khởi động.
  const autoSubmittedRef = useRef(false);
  const autoSubmitRef = useRef<() => void>(() => {});
  useEffect(() => {
    autoSubmitRef.current = () => {
      if (autoSubmittedRef.current) return;
      autoSubmittedRef.current = true;
      onTimeUp?.();
      onSubmit(buildPayload());
    };
  });

  // Mốc đếm ngược lấy từ remainingSeconds của máy chủ, không dùng đồng hồ trình duyệt.
  useEffect(() => {
    if (!started || remainingSeconds == null) {
      setSecondsLeft(null);
      return;
    }
    setSecondsLeft(Math.max(0, Math.floor(remainingSeconds)));
  }, [started, remainingSeconds]);

  // Interval ổn định: chỉ dựng lại khi bắt đầu/kết thúc làm bài, không dựng lại mỗi giây.
  useEffect(() => {
    if (!started || !timed) return;
    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev == null) return prev;
        if (prev <= 1) {
          clearInterval(id);
          autoSubmitRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [started, timed]);

  const answeredCount = useMemo(
    () =>
      details.questions.filter((q) => {
        const a = getAnswer(q.questionId);
        return a.selectedAnswerIds.length > 0 || a.responseText.trim().length > 0;
      }).length,
    [answers, details.questions, getAnswer]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{details.title}</CardTitle>
          {details.description && (
            <p className="text-sm text-muted-foreground">{details.description}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
            {started && secondsLeft != null ? (
              <span
                className={`flex items-center gap-1.5 font-semibold tabular-nums ${
                  secondsLeft <= 60
                    ? 'text-red-600 dark:text-red-400'
                    : secondsLeft <= 300
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-foreground'
                }`}
              >
                <Clock className="size-4" />
                {timeUp ? 'Hết giờ — đang nộp bài...' : `Còn lại ${formatClock(secondsLeft)}`}
              </span>
            ) : (
              details.durationMinutes != null && (
                <span className="flex items-center gap-1.5">
                  <Clock className="size-4" /> {details.durationMinutes} phút
                </span>
              )
            )}
            {details.passingPercentage != null && details.passingPercentage > 0 && (
              <span className="flex items-center gap-1.5">
                <Target className="size-4" /> Đạt từ {details.passingPercentage}%
              </span>
            )}
            <span>{details.questions.length} câu hỏi</span>
          </div>
        </CardHeader>
        {!started && (
          <CardContent>
            <Button onClick={onStart} disabled={starting}>
              {starting ? <Loader className="size-4 animate-spin" /> : <Play className="size-4" />}
              {startLabel}
            </Button>
          </CardContent>
        )}
      </Card>

      {started && (
        <>
          {details.questions.map((q, idx) => (
            <Card key={q.questionId}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base">
                    Câu {idx + 1}. {q.questionContent}
                  </CardTitle>
                  <Badge variant="secondary" className="shrink-0">
                    {q.score} điểm
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <QuestionField
                  question={q}
                  value={getAnswer(q.questionId)}
                  onChange={handleAnswerChange}
                  disabled={submitting || timeUp}
                />
              </CardContent>
            </Card>
          ))}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>
                Đã trả lời {answeredCount}/{details.questions.length} câu
              </span>
              {secondsLeft != null && !timeUp && (
                <span
                  className={`flex items-center gap-1.5 font-semibold tabular-nums ${
                    secondsLeft <= 60
                      ? 'text-red-600 dark:text-red-400'
                      : secondsLeft <= 300
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-foreground'
                  }`}
                >
                  <Clock className="size-4" /> Còn lại {formatClock(secondsLeft)}
                </span>
              )}
            </div>
            {/* Vẫn bấm được khi hết giờ: nếu lượt tự nộp lỗi mạng thì học sinh còn đường nộp lại,
                không bị kẹt mất bài. Các ô trả lời thì đã khoá nên không sửa đáp án được nữa. */}
            <Button onClick={() => onSubmit(buildPayload())} disabled={submitting}>
              {submitting ? <Loader className="size-4 animate-spin" /> : <Send className="size-4" />}
              {timeUp ? 'Nộp lại' : submitLabel}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

