import { useState, useEffect, useCallback } from "react";
import { ChevronDown, ChevronRight, FileText, ClipboardCheck, PenLine, Loader2, CheckCircle2 } from "lucide-react";
import { learningPathService } from "../../services/learningPath.service";
import type { NodeContentResponse, TeacherQuestionResponse } from "../../services/learningPath.service";
import { MaterialPreview } from "./MaterialPreview";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { NodeDiscussion } from "./NodeDiscussion";

interface NodeContentReadOnlyPanelProps {
  nodeId: number;
  
  fetchContent?: (nodeId: number) => Promise<NodeContentResponse>;
  
  fetchQuestions?: (testId: number) => Promise<TeacherQuestionResponse[]>;
  showDiscussion?: boolean;
}

const qTypeLabel = (type: TeacherQuestionResponse["questionType"]): string => {
  switch (type) {
    case "MULTIPLE_SELECT":
    case "MULTIPLE":
      return "Nhiều đáp án";
    case "ESSAY":
    case "SHORT_ANSWER":
      return "Tự luận";
    default:
      return "Một đáp án";
  }
};

const isEssay = (type: TeacherQuestionResponse["questionType"]) =>
  type === "ESSAY" || type === "SHORT_ANSWER";





export function NodeContentReadOnlyPanel({
  nodeId,
  fetchContent = learningPathService.getAdminNodeContent,
  fetchQuestions = learningPathService.getAdminTestQuestions,
  showDiscussion = false,
}: NodeContentReadOnlyPanelProps) {
  const [content, setContent] = useState<NodeContentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [questionsByTest, setQuestionsByTest] = useState<Record<number, TeacherQuestionResponse[]>>({});
  const [loadingTest, setLoadingTest] = useState<Set<number>>(new Set());

  useEffect(() => {
    let active = true;
    setLoading(true);
    setOpen(new Set());
    (async () => {
      try {
        const data = await fetchContent(nodeId);
        if (active) setContent(data);
      } catch {
        if (active) setContent({ materials: [], tests: [], exercises: [] });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [nodeId, fetchContent]);

  const loadQuestions = useCallback(
    async (testId: number) => {
      if (questionsByTest[testId] || loadingTest.has(testId)) return;
      setLoadingTest((prev) => new Set(prev).add(testId));
      try {
        const qs = await fetchQuestions(testId);
        setQuestionsByTest((prev) => ({ ...prev, [testId]: qs }));
      } catch {
        setQuestionsByTest((prev) => ({ ...prev, [testId]: [] }));
      } finally {
        setLoadingTest((prev) => {
          const n = new Set(prev);
          n.delete(testId);
          return n;
        });
      }
    },
    [questionsByTest, loadingTest, fetchQuestions]
  );

  const toggle = (key: string, testIdToLoad?: number) => {
    setOpen((prev) => {
      const n = new Set(prev);
      if (n.has(key)) {
        n.delete(key);
      } else {
        n.add(key);
        if (testIdToLoad != null) loadQuestions(testIdToLoad);
      }
      return n;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Đang tải nội dung…
      </div>
    );
  }

  const materials = content?.materials ?? [];
  const tests = content?.tests ?? [];
  const exercises = content?.exercises ?? [];

  const chevron = (opened: boolean) =>
    opened ? (
      <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
    ) : (
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
    );

  const renderContent = () => {
    if (materials.length === 0 && tests.length === 0 && exercises.length === 0) {
      return (
        <div className="py-10 text-center text-sm text-slate-400">
          Bài học này chưa có tài liệu, bài test hoặc bài tập.
        </div>
      );
    }

    return (
      <div className="space-y-4 p-1">
        {}
        {materials.length > 0 && (
          <section className="space-y-1.5">
            <h5 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <FileText className="h-3.5 w-3.5" /> Tài liệu học tập
            </h5>
            <div className="space-y-1.5">
              {materials.map((m) => {
                const key = `m${m.materialId}`;
                const opened = open.has(key);
                const mins = m.video?.durationSeconds ? Math.round(m.video.durationSeconds / 60) : null;
                return (
                  <div key={key} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <button
                      type="button"
                      onClick={() => toggle(key)}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-slate-50"
                    >
                      {chevron(opened)}
                      <span className="flex-1 truncate text-sm font-semibold text-slate-700">{m.title}</span>
                      {mins != null && <span className="shrink-0 text-[11px] text-slate-400">{mins} phút</span>}
                    </button>
                    {opened && (
                      <div className="border-t border-slate-100 px-3 pb-3">
                        <MaterialPreview material={m} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {}
        {tests.length > 0 && (
          <section className="space-y-1.5">
            <h5 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <ClipboardCheck className="h-3.5 w-3.5" /> Bài kiểm tra
            </h5>
            <div className="space-y-1.5">
              {tests.map((t) => {
                const key = `t${t.testId}`;
                const opened = open.has(key);
                const qs = questionsByTest[t.testId];
                const qLoading = loadingTest.has(t.testId);
                return (
                  <div key={key} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <button
                      type="button"
                      onClick={() => toggle(key, t.testId)}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-slate-50"
                    >
                      {chevron(opened)}
                      <span className="flex-1 truncate text-sm font-semibold text-slate-700">{t.title}</span>
                      <span className="shrink-0 text-[11px] text-slate-400">
                        {t.durationMinutes ? `${t.durationMinutes}′` : ""}
                        {t.passingPercentage != null ? ` · đạt ${t.passingPercentage}%` : ""}
                      </span>
                    </button>
                    {opened && (
                      <div className="space-y-2 border-t border-slate-100 px-3 py-3">
                        {qLoading ? (
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tải câu hỏi…
                          </div>
                        ) : !qs || qs.length === 0 ? (
                          <p className="text-xs italic text-slate-400">Bài test này chưa có câu hỏi.</p>
                        ) : (
                          qs.map((q, qi) => (
                            <div key={q.questionId} className="rounded-md bg-slate-50 p-2.5">
                              <div className="mb-1.5 flex items-start justify-between gap-2">
                                <p className="text-sm font-medium text-slate-700">
                                  <span className="text-slate-400">Câu {qi + 1}. </span>
                                  {q.questionContent}
                                </p>
                                <Badge variant="secondary" className="shrink-0 text-[10px] font-medium">
                                  {qTypeLabel(q.questionType)}
                                </Badge>
                              </div>
                              {isEssay(q.questionType) ? (
                                q.answers[0]?.answerContent ? (
                                  <p className="text-xs text-slate-500">
                                    <span className="font-semibold">Gợi ý chấm: </span>
                                    {q.answers[0].answerContent}
                                  </p>
                                ) : null
                              ) : (
                                <ul className="space-y-1">
                                  {q.answers.map((a) => (
                                    <li
                                      key={a.answerId}
                                      className={`flex items-center gap-1.5 text-xs ${
                                        a.isCorrect ? "font-semibold text-emerald-600" : "text-slate-600"
                                      }`}
                                    >
                                      {a.isCorrect ? (
                                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                      ) : (
                                        <span className="w-3.5 shrink-0" />
                                      )}
                                      {a.answerContent}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {}
        {exercises.length > 0 && (
          <section className="space-y-1.5">
            <h5 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <PenLine className="h-3.5 w-3.5" /> Bài tập thực hành
            </h5>
            <div className="space-y-1.5">
              {exercises.map((ex) => {
                const key = `ex${ex.exerciseId}`;
                const opened = open.has(key);
                return (
                  <div key={key} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <button
                      type="button"
                      onClick={() => toggle(key)}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-slate-50"
                    >
                      {chevron(opened)}
                      <span className="flex-1 truncate text-sm font-semibold text-slate-700">{ex.title}</span>
                      <span className="flex shrink-0 gap-1">
                        {ex.allowText && (
                          <Badge variant="outline" className="px-1.5 py-0.5 text-[10px] font-medium border-transparent bg-secondary text-secondary-foreground">Tự luận</Badge>
                        )}
                        {ex.allowFile && (
                          <Badge variant="outline" className="px-1.5 py-0.5 text-[10px] font-medium border-transparent bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">Nộp file</Badge>
                        )}
                      </span>
                    </button>
                    {opened && (
                      <div className="border-t border-slate-100 px-3 py-3">
                        {ex.instructions ? (
                          <p className="whitespace-pre-wrap text-sm text-slate-600">{ex.instructions}</p>
                        ) : (
                          <p className="text-xs italic text-slate-400">Chưa có đề bài.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    );
  };

  if (!showDiscussion) {
    return renderContent();
  }

  return (
    <Tabs defaultValue="content" className="w-full font-sans">
      <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-lg h-9 mb-4">
        <TabsTrigger value="content" className="text-xs py-1.5 font-semibold rounded-md">
          Nội dung
        </TabsTrigger>
        <TabsTrigger value="discussion" className="text-xs py-1.5 font-semibold rounded-md">
          Thảo luận
        </TabsTrigger>
      </TabsList>
      <TabsContent value="content" className="mt-0">
        {renderContent()}
      </TabsContent>
      <TabsContent value="discussion" className="mt-0">
        <NodeDiscussion nodeId={nodeId} role="teacher" />
      </TabsContent>
    </Tabs>
  );
}
