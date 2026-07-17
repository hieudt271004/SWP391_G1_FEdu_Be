import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookMarked,
  Lock,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Clock
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { Badge } from '../../components/ui/badge';
import type { ClassroomSubjectResponse } from '../../types/classroomSubject';
import type { LearningNodeResponse, NodeContentResponse } from '../../services/learningPath.service';
import type { SubmissionResponse, StudentTestAttemptHistoryResponse, RetakeRequestResponse } from '../../services/student.service';

export interface LearningPathItem {
  id: number;
  type: 'material' | 'test' | 'exercise';
  title: string;
  nodeId: number;
  data: any;
}


const formatDeadline = (iso: string) => {
  const d = new Date(iso);
  return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${d.toLocaleDateString('vi-VN')}`;
};
const isDeadlineOverdue = (iso: string) => new Date(iso).getTime() < Date.now();

interface StudentSyllabusViewProps {
  subject: ClassroomSubjectResponse | null;
  nodes: LearningNodeResponse[];
  nodeContents: Record<number, NodeContentResponse>;
  loadingNodeContent: Record<number, boolean>;
  testHistory: StudentTestAttemptHistoryResponse[];
  exerciseSubmissions: Record<number, SubmissionResponse | null>;
  progressStats: { completed: number; total: number; percent: number };
  allItems: LearningPathItem[];
  setActiveItem: (item: LearningPathItem) => void;
  ensureNodeContent: (nodeId: number) => Promise<any>;
  completedMaterials: Record<string, boolean>;
  userId: number | undefined;
  retakeRequests: RetakeRequestResponse[];
  fetchRetakeRequests: () => Promise<void>;
}

export function StudentSyllabusView({
  subject,
  nodes,
  nodeContents,
  loadingNodeContent,
  testHistory,
  exerciseSubmissions,
  progressStats,
  allItems,
  setActiveItem,
  ensureNodeContent,
  completedMaterials,
  userId,
  retakeRequests,
  fetchRetakeRequests
}: StudentSyllabusViewProps) {
  const navigate = useNavigate();
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);

  
  useEffect(() => {
    if (nodes.length > 0 && selectedNodeId === null) {
      const firstIncompleteNode = nodes.find(n => n.studentStatus !== 'COMPLETED');
      const targetNodeId = firstIncompleteNode ? firstIncompleteNode.nodeId : nodes[0].nodeId;
      setSelectedNodeId(targetNodeId);
      ensureNodeContent(targetNodeId);
    }
  }, [nodes, selectedNodeId, ensureNodeContent]);

  
  const handleSelectNode = (nodeId: number) => {
    setSelectedNodeId(nodeId);
    ensureNodeContent(nodeId);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      {}
      <div className="bg-card border-b border-border py-4 px-6 mb-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <button 
              onClick={() => navigate('/student/courses')}
              className="hover:text-foreground transition-colors"
            >
              Khóa học của tôi
            </button>
            <span>/</span>
            <span className="text-foreground font-bold">{subject?.displayName || subject?.subjectName}</span>
          </div>
          <Button
            onClick={() => {
              
              const firstIncomplete = allItems.find(item => {
                const node = nodes.find(n => n.nodeId === item.nodeId);
                return node && node.studentStatus !== 'COMPLETED';
              }) || allItems[0];
              if (firstIncomplete) {
                setActiveItem(firstIncomplete);
              }
            }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs px-5 py-2 font-extrabold flex items-center gap-1.5"
          >
            <span>Bắt đầu học</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        {}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-muted border border-border">
              <BookMarked className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h2 className="font-extrabold text-foreground text-base leading-snug">
                {subject?.displayName || subject?.subjectName}
              </h2>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">
                Lớp: {subject?.className} • Mã: {subject?.subjectCode}
              </p>
            </div>
            {}
            <div className="pt-2 border-t border-border space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-foreground">
                <span>Tiến độ học tập</span>
                <span>{progressStats.percent}%</span>
              </div>
              <Progress value={progressStats.percent} className="h-1.5 bg-muted" />
              <p className="text-[10px] text-muted-foreground font-bold">
                Đã hoàn thành {progressStats.completed}/{progressStats.total} bài học
              </p>
            </div>
          </div>

          {}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border bg-muted/30">
              <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
                Nội dung học tập
              </h3>
            </div>
            <nav className="divide-y divide-border">
              {nodes.map((node, index) => {
                const isSelected = selectedNodeId === node.nodeId;
                const isCompleted = node.studentStatus === 'COMPLETED';
                const isLocked = node.studentStatus === 'LOCKED';
                
                return (
                  <button
                    key={node.nodeId}
                    disabled={isLocked}
                    onClick={() => handleSelectNode(node.nodeId)}
                    className={`w-full text-left p-4 transition-colors flex items-start gap-3 disabled:opacity-40 disabled:cursor-not-allowed ${
                      isSelected 
                        ? 'bg-muted/50 text-foreground font-extrabold border-l-4 border-l-primary' 
                        : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                    }`}
                  >
                    <div className="pt-0.5 shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="size-4 text-emerald-600 fill-none" />
                      ) : isLocked ? (
                        <Lock className="size-4 text-muted-foreground" />
                      ) : (
                        <div className={`size-4 rounded-full border-2 ${
                          isSelected ? 'border-primary bg-muted' : 'border-border'
                        }`} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] text-muted-foreground font-extrabold uppercase tracking-wider block">
                        Bài học {index + 1}
                        {node.deadlineAt && !isCompleted && isDeadlineOverdue(node.deadlineAt) && (
                          <span className="ml-1.5 text-red-600 dark:text-red-400">• Quá hạn</span>
                        )}
                      </span>
                      <span className="text-xs font-bold truncate block">{node.title}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {}
        <div className="md:col-span-3 space-y-6">
          {(() => {
            const activeNode = nodes.find(n => n.nodeId === selectedNodeId);
            if (!activeNode) return null;
            const content = nodeContents[activeNode.nodeId];
            const isCompleted = activeNode.studentStatus === 'COMPLETED';
            
            
            const nodeItems: LearningPathItem[] = [];
            if (content) {
              if (content.materials) {
                content.materials.forEach(m => {
                  nodeItems.push({ id: m.materialId, type: 'material', title: m.title, nodeId: activeNode.nodeId, data: m });
                });
              }
              if (content.tests) {
                content.tests.forEach(t => {
                  nodeItems.push({ id: t.testId, type: 'test', title: t.title, nodeId: activeNode.nodeId, data: t });
                });
              }
              if (content.exercises) {
                content.exercises.forEach(e => {
                  nodeItems.push({ id: e.exerciseId, type: 'exercise', title: e.title, nodeId: activeNode.nodeId, data: e });
                });
              }
            }

            return (
              <div className="bg-card border border-border rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
                <div className="flex justify-between items-start flex-wrap gap-4 border-b border-border pb-5">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      {activeNode.testKind && activeNode.testKind !== 'NONE' ? (
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-[4px] border uppercase ${
                          activeNode.testKind === 'PLACEMENT'
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                            : activeNode.testKind === 'GATE'
                            ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                            : 'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400'
                        }`}>
                          {activeNode.testKind === 'PLACEMENT'
                            ? 'Test năng lực'
                            : activeNode.testKind === 'GATE'
                            ? 'Test phân luồng'
                            : 'Test tự chọn'}
                        </span>
                      ) : (
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-[4px] border uppercase ${
                          activeNode.nodeType === 'AT_HOME' 
                            ? 'bg-muted border-border text-muted-foreground' 
                            : 'bg-primary border-primary text-primary-foreground'
                        }`}>
                          {activeNode.nodeType === 'AT_HOME' ? 'Tự học' : 'Lên lớp'}
                        </span>
                      )}
                      {isCompleted && (
                        <Badge className="bg-emerald-500/10 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[9px] font-extrabold px-2 py-0.5 rounded-md">
                          Hoàn thành
                        </Badge>
                      )}
                      {isCompleted && activeNode.completedLate && (
                        <Badge className="bg-amber-500/10 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[9px] font-extrabold px-2 py-0.5 rounded-md">
                          Hoàn thành trễ
                        </Badge>
                      )}
                      {activeNode.deadlineAt && !isCompleted && (
                        <span className={`flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-[4px] border uppercase ${
                          isDeadlineOverdue(activeNode.deadlineAt)
                            ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
                            : 'bg-muted border-border text-muted-foreground'
                        }`}>
                          <Clock className="size-3 shrink-0" />
                          {isDeadlineOverdue(activeNode.deadlineAt) ? 'Quá hạn' : 'Hạn'}: {formatDeadline(activeNode.deadlineAt)}
                        </span>
                      )}
                    </div>
                    <h1 className="text-xl md:text-2xl font-extrabold text-foreground leading-tight">
                      {activeNode.title}
                    </h1>
                    {activeNode.description && (
                      <p className="text-xs text-muted-foreground max-w-2xl pt-1 leading-relaxed">
                        {activeNode.description}
                      </p>
                    )}
                  </div>
                </div>

                {}
                <div className="space-y-4">
                  <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
                    Danh sách bài học & học liệu
                  </h3>
                  
                  {loadingNodeContent[activeNode.nodeId] ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                      <Loader2 className="size-6 animate-spin text-primary" />
                      <span className="text-xs font-medium">Đang tải tài liệu bài học...</span>
                    </div>
                  ) : nodeItems.length > 0 ? (
                    <div className="divide-y divide-border border border-border rounded-2xl overflow-hidden bg-card">
                      {(() => {
                        const completedItems = nodeItems.map(itm => {
                          if (isCompleted) return true;
                          if (itm.type === 'material') {
                            return completedMaterials[`${userId}-${itm.id}`] || false;
                          }
                          if (itm.type === 'test') {
                            const history = testHistory.filter(h => h.testId === itm.id);
                            return history.some(h => h.score !== null && h.score >= itm.data.passingPercentage);
                          }
                          if (itm.type === 'exercise') {
                            const sub = exerciseSubmissions[itm.id];
                            return sub?.status === 'SUBMITTED' || sub?.status === 'GRADED';
                          }
                          return false;
                        });

                        const firstIncompleteIdx = completedItems.indexOf(false);

                        return nodeItems.map((item, idx) => {
                          const isMaterial = item.type === 'material';
                          const isTest = item.type === 'test';
                          const isExercise = item.type === 'exercise';
                          
                          const isItemCompleted = completedItems[idx];
                          const isFirstIncomplete = idx === firstIncompleteIdx;
                          return (
                            <div 
                              key={`${item.type}-${item.id}`}
                              onClick={() => setActiveItem(item)}
                              className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer group"
                            >
                              <div className="flex items-center gap-3 min-w-0 pr-4">
                                <div className="shrink-0">
                                  {isItemCompleted ? (
                                    <CheckCircle2 className="size-5 text-emerald-600 fill-none" />
                                  ) : (
                                    <div className="size-5 rounded-full border-2 border-border flex items-center justify-center group-hover:border-primary transition-colors">
                                      <div className="size-2 rounded-full bg-transparent group-hover:bg-primary transition-colors" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                                    {item.title}
                                  </h4>
                                  <p className="text-[10px] text-muted-foreground font-semibold capitalize flex items-center gap-1.5 mt-0.5">
                                    <span>
                                      {isMaterial 
                                        ? (item.data.video?.videoUrl ? 'Video' : 'Tài liệu PDF') 
                                        : isTest 
                                          ? 'Bài kiểm tra' 
                                          : 'Bài tập thực hành'
                                      }
                                    </span>
                                    <span>•</span>
                                    <span>
                                      {isMaterial && item.data.video?.durationSeconds 
                                        ? `${Math.round(item.data.video.durationSeconds / 60)} phút` 
                                        : isMaterial 
                                          ? '10 phút' 
                                          : isTest 
                                            ? `${item.data.durationMinutes} phút` 
                                            : 'Bài tập tự luận'
                                      }
                                    </span>
                                    {isTest && (
                                       <>
                                         {activeNode.testKind === 'PLACEMENT' && (activeNode.placementYeuMax != null || activeNode.placementTbMax != null) ? (
                                            <>
                                              <span>•</span>
                                              <span className="normal-case">
                                                Phân mức: Yếu ≤ {activeNode.placementYeuMax}% · TB ≤ {activeNode.placementTbMax}% · Khá &gt; {activeNode.placementTbMax}%
                                              </span>
                                            </>
                                          ) : activeNode.testKind === 'GATE' ? null : (
                                            <>
                                              <span>•</span>
                                              <span className="normal-case">Yêu cầu đạt: {item.data.passingPercentage}%</span>
                                            </>
                                          )}
                                        {activeNode.testKind === 'GATE' && (activeNode.gateUpMin != null || activeNode.gateDownMax != null) && (
                                          <>
                                            <span>•</span>
                                            <span className="text-emerald-600 dark:text-emerald-455 normal-case font-bold">Lên Level khi ≥ {activeNode.gateUpMin ?? '—'}%</span>
                                            <span>•</span>
                                            <span className="text-rose-600 dark:text-rose-455 normal-case font-bold">Hạ Level khi &lt; {activeNode.gateDownMax ?? '—'}%</span>
                                          </>
                                        )}
                                      </>
                                    )}
                                  </p>
                                  {isTest && (() => {
                                    const latestReq = retakeRequests.find(r => r.testId === item.id);
                                    if (!latestReq) return null;
                                    return (
                                      <div className="flex gap-2 mt-1.5 flex-wrap">
                                        {latestReq.status === 'PENDING' && (
                                          <Badge className="bg-amber-500/10 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[8px] font-bold px-1.5 py-0.5 rounded-sm">
                                            Chờ duyệt thi lại
                                          </Badge>
                                        )}
                                        {latestReq.status === 'APPROVED' && (
                                          <Badge className="bg-emerald-500/10 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[8px] font-bold px-1.5 py-0.5 rounded-sm">
                                            Đã duyệt thi lại
                                          </Badge>
                                        )}
                                        {latestReq.status === 'REJECTED' && (
                                          <Badge className="bg-rose-500/10 hover:bg-rose-500/10 text-rose-600 dark:text-rose-450 border border-rose-500/20 text-[8px] font-bold px-1.5 py-0.5 rounded-sm" title={latestReq.rejectReason}>
                                            Thi lại bị từ chối
                                          </Badge>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>

                              <div className="shrink-0">
                                {isFirstIncomplete ? (
                                  <Button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveItem(item);
                                    }}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-[10px] rounded-xl px-4 py-1.5 h-8 flex items-center gap-1 transition-all shadow-xs"
                                  >
                                    <span>Get started</span>
                                    <ArrowRight className="size-3" />
                                  </Button>
                                ) : isItemCompleted ? (
                                  <span className="text-[10px] font-bold text-muted-foreground px-3 py-1 bg-muted rounded-lg group-hover:bg-muted/85 group-hover:text-foreground transition-colors">
                                    Xem lại
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-foreground px-3 py-1 bg-background border border-border rounded-lg group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all">
                                    Bắt đầu
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  ) : (
                    <div className="text-center py-10 border border-dashed border-border rounded-2xl bg-muted/10 text-muted-foreground text-xs">
                      Không có học liệu hay bài kiểm tra nào trong bài học này.
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
