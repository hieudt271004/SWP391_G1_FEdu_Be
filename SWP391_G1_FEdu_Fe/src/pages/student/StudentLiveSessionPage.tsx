import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { AlarmClock, ArrowLeft, Award, FileText, Loader2, Radio } from 'lucide-react';
import { studentService } from '../../services/student.service';
import type { LiveSessionState } from '../../services/learningPath.service';
import { MaterialPreview } from '../../components/learningPath/MaterialPreview';
import { StudentPopQuizRunner } from '../../components/popQuiz/StudentPopQuizRunner';



const POLL_MS = 5000;

const fmtTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—';

const fmtCountdown = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export function StudentLiveSessionPage() {
  const { csId, nodeId } = useParams();
  const cs = Number(csId);
  const nid = Number(nodeId);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [state, setState] = useState<LiveSessionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const clockOffsetRef = useRef(0);
  const [nowTick, setNowTick] = useState(Date.now());

  const fetchState = useCallback(async (silent: boolean) => {
    if (!cs || !nid) return;
    if (!silent) setLoading(true);
    try {
      const s = await studentService.getLiveState(cs, nid);
      setState(s);
      setError(null);
      if (s.serverTime) clockOffsetRef.current = new Date(s.serverTime).getTime() - Date.now();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không tải được buổi học';
      if (!silent) setError(msg);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [cs, nid]);

  useEffect(() => {
    fetchState(false);
    const poll = setInterval(() => fetchState(true), POLL_MS);
    const tick = setInterval(() => setNowTick(Date.now()), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [fetchState]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Đang vào buổi học...</span>
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="text-center py-14">
        <p className="text-sm text-muted-foreground mb-4">{error || 'Không tải được buổi học'}</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Quay lại</Button>
      </div>
    );
  }

  const serverNow = nowTick + clockOffsetRef.current;
  const active = state.activeTest;
  const activeRemainMs = active?.releaseEndsAt ? new Date(active.releaseEndsAt).getTime() - serverNow : 0;
  const materials = state.content?.materials ?? [];
  const releasedTests = (state.content?.tests ?? []).filter((t) => t.releasedAt);

  return (
    <div className="max-w-3xl mx-auto space-y-5 text-foreground">
      {}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => {
          const currentParams = searchParams.toString();
          const suffix = currentParams ? `?${currentParams}` : '';
          navigate(`/student/classroom-subjects/${cs}/learning-path${suffix}`);
        }}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold tracking-tight truncate flex items-center gap-2">
            <Radio className={`size-5 ${state.live ? 'text-rose-500 animate-pulse' : 'text-muted-foreground'}`} />
            {state.nodeTitle}
          </h1>
          <p className="text-xs text-muted-foreground">
            Buổi học trên lớp
            {state.slotName ? ` • ${state.slotName} (${fmtTime(state.sessionWindowStart)} - ${fmtTime(state.sessionWindowEnd)})` : ''}
          </p>
        </div>
        {state.live && (
          <Badge className="bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold px-2 py-1 rounded-md shrink-0">
            ● ĐANG DIỄN RA
          </Badge>
        )}
      </div>

      {!state.live ? (
        
        <div className="rounded-3xl border border-border bg-card p-10 text-center space-y-3">
          <Radio className="w-10 h-10 mx-auto text-muted-foreground animate-pulse" />
          <h2 className="text-base font-bold text-foreground">
            {state.sessionEndedAt ? 'Buổi học đã kết thúc' : 'Buổi học chưa bắt đầu'}
          </h2>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {state.sessionEndedAt
              ? `Giáo viên đã kết thúc buổi học lúc ${fmtTime(state.sessionEndedAt)}. Bạn có thể xem lại nội dung trong trang lộ trình học.`
              : 'Màn hình sẽ tự động vào lớp khi giáo viên bắt đầu buổi học — không cần tải lại trang.'}
          </p>
        </div>
      ) : (
        <>
          {}
          {active && (
            <div className="rounded-2xl border-2 border-rose-500/30 bg-rose-500/5 p-4 flex flex-wrap items-center gap-3">
              <Award className="size-6 text-rose-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">Giáo viên vừa phát đề: {active.title}</p>
                <p className="text-[11px] text-muted-foreground">
                  Cả lớp cùng hạn nộp lúc {fmtTime(active.releaseEndsAt)} — hết giờ hệ thống không nhận bài.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="flex items-center gap-1 text-base font-bold text-rose-600 dark:text-rose-400">
                  <AlarmClock className="size-4" /> {fmtCountdown(activeRemainMs)}
                </span>
                <Button onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.set('csId', String(cs));
                  params.set('from', 'live');
                  params.set('nodeId', String(nid));
                  navigate(`/student/tests/${active.testId}?${params.toString()}`);
                }}
                  className="h-9 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white">
                  Vào làm bài
                </Button>
              </div>
            </div>
          )}

          {}
          <div className="rounded-3xl border border-border bg-card p-6 space-y-5">
            <h2 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="size-3.5" /> Tài liệu buổi học ({materials.length})
            </h2>
            {materials.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                Giáo viên chưa đưa tài liệu nào lên — tài liệu mới sẽ tự xuất hiện tại đây.
              </p>
            ) : (
              <div className="space-y-5">
                {materials.map((m) => (
                  <div key={m.materialId} className="space-y-2 border-b border-border/60 pb-5 last:border-0 last:pb-0">
                    <p className="text-sm font-bold text-foreground">{m.title}</p>
                    <MaterialPreview material={m} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {}
          {releasedTests.length > 0 && (
            <div className="rounded-3xl border border-border bg-card p-6 space-y-3">
              <h2 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Award className="size-3.5" /> Bài kiểm tra ({releasedTests.length})
              </h2>
              <div className="space-y-2">
                {releasedTests.map((t) => {
                  const isActive = active?.testId === t.testId;
                  const timedOut = !!t.releaseEndsAt && new Date(t.releaseEndsAt).getTime() <= serverNow;
                  return (
                    <div key={t.testId} className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 p-2.5 text-xs">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{t.title} ({t.durationMinutes ?? '—'} phút)</p>
                        {isActive ? (
                          <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400">Đang trong giờ làm — còn {fmtCountdown(activeRemainMs)}</p>
                        ) : timedOut ? (
                          <p className="text-[10px] text-muted-foreground">Đã hết giờ làm bài</p>
                        ) : null}
                      </div>
                      <Button onClick={() => {
                        const params = new URLSearchParams(searchParams);
                        params.set('csId', String(cs));
                        params.set('from', 'live');
                        params.set('nodeId', String(nid));
                        navigate(`/student/tests/${t.testId}?${params.toString()}`);
                      }} disabled={timedOut && !isActive}
                        variant={isActive ? 'default' : 'outline'}
                        className="h-7 px-3 rounded-lg text-[11px] font-bold shrink-0">
                        {isActive ? 'Vào làm bài' : timedOut ? 'Hết giờ' : 'Làm bài'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
      {nid && <StudentPopQuizRunner nodeId={nid} />}
    </div>
  );
}
