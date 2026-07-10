import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert';
import { ArrowLeft, CheckCircle2, XCircle, Loader, AlertTriangle } from 'lucide-react';
import { TestRunner } from './components/TestRunner';
import {
  studentService,
  type AttemptResult,
  type AttemptSubmission,
  type StudentTestDetails,
} from '../../../services/student.service';

export function NodeTestPage() {
  const { testId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // csId (tuỳ chọn) để quay lại đồ thị lớp-môn; khi quay lại view đó sẽ tự fetch lại.
  const csId = searchParams.get('csId');
  const id = Number(testId);

  const [details, setDetails] = useState<StudentTestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AttemptResult | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    studentService
      .getTestDetails(id)
      .then((data) => {
        if (!active) return;
        // Đề phát trong buổi live có hạn nộp CHUNG cả lớp: vào trễ thì đồng hồ chỉ còn
        // phần thời gian tới hạn chung (BE vẫn là nguồn chân lý khi nộp).
        if (data.releaseEndsAt && data.durationMinutes) {
          const remainMin = Math.floor((new Date(data.releaseEndsAt).getTime() - Date.now()) / 60000);
          data = { ...data, durationMinutes: Math.max(1, Math.min(data.durationMinutes, remainMin)) };
        }
        setDetails(data);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Không tải được bài test');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const handleStart = async () => {
    setStarting(true);
    try {
      const attempt = await studentService.startAttempt(id);
      setAttemptId(attempt.attemptId);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không bắt đầu được bài test');
    } finally {
      setStarting(false);
    }
  };

  const handleSubmit = async (body: AttemptSubmission) => {
    if (attemptId == null) return;
    setSubmitting(true);
    try {
      const res = await studentService.submitAttempt(id, attemptId, body);
      setResult(res);
      // Đồ thị tiến độ sẽ được refetch khi học sinh quay lại view lớp-môn (mount lại).
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Nộp bài thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  // Rời tab khi đang làm bài → ghi nhận về BE (chống gian lận) + cảnh báo khi quay lại.
  const handleTabOut = useCallback(async () => {
    if (attemptId == null) return;
    try {
      const count = await studentService.recordTabOut(id, attemptId);
      toast.warning(`Bạn vừa rời khỏi tab khi đang làm bài (lần ${count}). Hành vi này được ghi nhận.`, {
        duration: 8000,
      });
    } catch {
      // Không chặn việc làm bài nếu ghi nhận thất bại
    }
  }, [id, attemptId]);

  const goBack = () => {
    if (csId) navigate(`/student/classroom-subjects/${csId}/learning-path`);
    else navigate('/student/courses');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader className="mr-2 size-5 animate-spin" /> Đang tải bài test...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Không thể làm bài</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={goBack}>
          <ArrowLeft className="size-4" /> Quay lại
        </Button>
      </div>
    );
  }

  if (!details) return null;

  if (result) {
    const passed = result.passed;
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {passed ? (
                <CheckCircle2 className="size-6 text-green-600" />
              ) : (
                <XCircle className="size-6 text-red-600" />
              )}
              {passed ? 'Chúc mừng, bạn đã đạt!' : 'Chưa đạt'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-bold">{result.score}%</div>
            <p className="text-sm text-muted-foreground">
              Điểm đạt yêu cầu: {result.passingPercentage}%
            </p>
            <Button onClick={goBack}>
              <ArrowLeft className="size-4" /> Quay lại khóa học
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Button variant="ghost" size="sm" onClick={goBack}>
        <ArrowLeft className="size-4" /> Quay lại
      </Button>
      <TestRunner
        details={details}
        started={attemptId != null}
        starting={starting}
        submitting={submitting}
        onStart={handleStart}
        onSubmit={handleSubmit}
        onTabOut={handleTabOut}
      />
    </div>
  );
}
