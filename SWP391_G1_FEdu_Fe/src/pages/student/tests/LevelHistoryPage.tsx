import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { ArrowLeft, ArrowRight, Loader, AlertTriangle } from 'lucide-react';
import { studentService, type LevelHistoryEntry } from '../../../services/student.service';
import { levelLabel } from './levels';

const reasonLabel = (reason: string): string => {
  if (reason === 'PLACEMENT') return 'Phân loại đầu vào';
  if (reason === 'GATE') return 'Cổng test';
  return reason;
};

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('vi-VN');
};

export function LevelHistoryPage() {
  const { csId } = useParams();
  const navigate = useNavigate();
  const id = Number(csId);

  const [history, setHistory] = useState<LevelHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    studentService
      .getLevelHistory(id)
      .then((data) => {
        if (active) setHistory(data);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Không tải được lịch sử mức');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="size-4" /> Quay lại
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử mức năng lực</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader className="mr-2 size-5 animate-spin" /> Đang tải...
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTriangle />
              <AlertTitle>Lỗi</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : history.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Chưa có thay đổi mức nào.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thay đổi mức</TableHead>
                  <TableHead>Lý do</TableHead>
                  <TableHead>Thời điểm</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <span className="text-muted-foreground">{levelLabel(h.oldLevel)}</span>
                        <ArrowRight className="size-4 text-muted-foreground" />
                        <Badge>{levelLabel(h.newLevel)}</Badge>
                      </span>
                    </TableCell>
                    <TableCell>{reasonLabel(h.reason)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(h.changedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
