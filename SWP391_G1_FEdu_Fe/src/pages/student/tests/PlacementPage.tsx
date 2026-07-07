import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert';
import { ArrowLeft, GraduationCap, Loader, AlertTriangle, History } from 'lucide-react';
import { TestRunner } from './components/TestRunner';
import { levelLabel } from './levels';
import {
  studentService,
  type AttemptSubmission,
  type PlacementResult,
  type StudentTestDetails,
} from '../../../services/student.service';

export function PlacementPage() {
  const { csId } = useParams();
  const navigate = useNavigate();
  const id = Number(csId);

  const [details, setDetails] = useState<StudentTestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<PlacementResult | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    studentService
      .getPlacementQuiz(id)
      .then((data) => {
        if (active) setDetails(data);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Không tải được bài phân loại');
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
      const attempt = await studentService.startPlacementAttempt(id);
      setAttemptId(attempt.attemptId);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không bắt đầu được bài phân loại');
    } finally {
      setStarting(false);
    }
  };

  const handleSubmit = async (body: AttemptSubmission) => {
    if (attemptId == null) return;
    setSubmitting(true);
    try {
      const res = await studentService.submitPlacement(id, attemptId, body);
      setResult(res);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Nộp bài thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader className="mr-2 size-5 animate-spin" /> Đang tải bài phân loại...
      </div>
    );
  }

  if (error) {
    const isAlreadyPlaced = error.includes("đã hoàn thành bài test phân loại") || error.includes("đã xếp lớp");
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Alert variant={isAlreadyPlaced ? "default" : "destructive"} className={isAlreadyPlaced ? "border-indigo-100 bg-indigo-50/50" : ""}>
          {isAlreadyPlaced ? <GraduationCap className="size-5 text-indigo-600" /> : <AlertTriangle />}
          <AlertTitle>{isAlreadyPlaced ? "Bạn đã có lộ trình học" : "Không thể làm bài phân loại"}</AlertTitle>
          <AlertDescription className="text-sm">
            {error}
          </AlertDescription>
        </Alert>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/student/courses')}>
            <ArrowLeft className="size-4" /> Quay lại
          </Button>
        </div>
      </div>
    );
  }

  if (!details) return null;

  if (result) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="size-6 text-indigo-600" />
              Kết quả phân loại
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Mức được xếp:</span>
              <Badge className="text-base">{levelLabel(result.assignedLevel)}</Badge>
            </div>
            <div className="text-3xl font-bold">{result.score}%</div>
            <div className="flex gap-2">
              <Button onClick={() => navigate(`/student/classroom-subjects/${id}/level-history`)}>
                <History className="size-4" /> Xem lịch sử mức
              </Button>
              <Button variant="outline" onClick={() => navigate(`/student/classroom-subjects/${id}/learning-path`)}>
                <ArrowLeft className="size-4" /> Quay lại
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/student/courses')}>
        <ArrowLeft className="size-4" /> Quay lại
      </Button>
      <TestRunner
        details={details}
        started={attemptId != null}
        starting={starting}
        submitting={submitting}
        onStart={handleStart}
        onSubmit={handleSubmit}
        startLabel="Bắt đầu thi phân loại"
        submitLabel="Nộp bài phân loại"
      />
    </div>
  );
}
