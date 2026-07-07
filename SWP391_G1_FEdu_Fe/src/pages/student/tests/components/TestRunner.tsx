import { useEffect, useMemo, useState, useCallback } from 'react';
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
  /** Gọi mỗi lần học sinh rời tab (chuyển tab/thu nhỏ) khi đang làm bài — chống gian lận. */
  onTabOut?: () => void;
  startLabel?: string;
  submitLabel?: string;
}

const EMPTY_ANSWER: AnswerValue = { selectedAnswerIds: [], responseText: '' };

// Thành phần dùng chung cho cả node test và placement quiz.
// Giữ state câu trả lời theo questionId rồi chuẩn hoá về payload submissions[].
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
}: TestRunnerProps) {
  const [answers, setAnswers] = useState<Record<number, AnswerValue>>({});

  // Đang làm bài mà tab bị ẩn (chuyển tab / thu nhỏ cửa sổ) → báo về BE đếm số lần.
  // Sau khi nộp, trang cha chuyển sang màn kết quả nên TestRunner unmount, listener tự gỡ.
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
            {details.durationMinutes != null && (
              <span className="flex items-center gap-1.5">
                <Clock className="size-4" /> {details.durationMinutes} phút
              </span>
            )}
            {details.passingPercentage != null && (
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
                  disabled={submitting}
                />
              </CardContent>
            </Card>
          ))}

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Đã trả lời {answeredCount}/{details.questions.length} câu
            </span>
            <Button onClick={() => onSubmit(buildPayload())} disabled={submitting}>
              {submitting ? <Loader className="size-4 animate-spin" /> : <Send className="size-4" />}
              {submitLabel}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

