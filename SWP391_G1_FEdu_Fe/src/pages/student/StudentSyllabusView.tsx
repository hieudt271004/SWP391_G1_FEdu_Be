import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookMarked,
  Lock,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Clock,
  ChevronDown,
  ChevronRight,
  FileText,
  Award,
  PenLine,
  ExternalLink
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { Badge } from '../../components/ui/badge';
import type { ClassroomSubjectResponse } from '../../types/classroomSubject';
import type { LearningNodeResponse, NodeContentResponse, NodeEdgeResponse } from '../../services/learningPath.service';
import type { SubmissionResponse, StudentTestAttemptHistoryResponse, RetakeRequestResponse } from '../../services/student.service';
import { LearningPathFlow } from '../../components/learningPath/LearningPathFlow';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { MaterialPreview } from '../../components/learningPath/MaterialPreview';
import { NodeDiscussion } from '../../components/learningPath/NodeDiscussion';

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
  edges: NodeEdgeResponse[];
  currentLevel: number | null;
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
  classroomSubjectId: number;
}

export function StudentSyllabusView({
  subject,
  nodes,
  edges,
  currentLevel,
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
  fetchRetakeRequests,
  classroomSubjectId
}: StudentSyllabusViewProps) {
  const navigate = useNavigate();
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set());
  
  const toggleAccordion = (key: string) => {
    setOpenAccordions(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  
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
      {/* Top Breadcrumb/Header Bar */}
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

      <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row gap-8 items-start">
        {/* CỘT TRÁI: Chứa thông tin khóa học và sơ đồ cây lộ trình */}
        <div className="w-full lg:w-[550px] shrink-0 space-y-6">
          {/* Card tiến độ môn học */}
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

          {/* SƠ ĐỒ CÂY LỘ TRÌNH HỌC TẬP (Thay thế menu điều hướng dọc cũ) */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-4 border-b border-border bg-muted/30">
              <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
                Bản đồ lộ trình học tập
              </h3>
            </div>
            <div className="p-4 overflow-x-auto overflow-y-auto max-h-[60vh] bg-muted/5 flex justify-center">
              <LearningPathFlow
                nodes={nodes}
                edges={edges}
                highlightLevel={currentLevel}
                selectedNodeId={selectedNodeId}
                onNodeClick={(node) => handleSelectNode(node.nodeId)}
              />
            </div>
          </div>

          {/* Bảng chú thích màu sắc */}
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-2">
            <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              Chú giải ký hiệu lộ trình
            </h4>
            <div className="grid grid-cols-3 gap-2 text-[11px] font-medium pt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 border border-background shadow-xs shrink-0" />
                <span>Đã học</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600 border border-background shadow-xs shrink-0" />
                <span>Sẽ học (Nhánh hiện tại)</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground/60">
                <span className="w-2.5 h-2.5 rounded-full bg-muted border border-background shadow-xs opacity-60 shrink-0" />
                <span>Mức khác</span>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: Thẻ chi tiết bài học y hệt thiết kế Admin (Ảnh 1) */}
        <div className="flex-1 w-full min-w-[320px]">
          {(() => {
            const activeNode = nodes.find(n => n.nodeId === selectedNodeId);
            if (!activeNode) {
              return (
                <div className="p-12 text-center text-sm text-muted-foreground border border-dashed border-border bg-card rounded-2xl">
                  Chọn một bài học trên sơ đồ lộ trình bên trái để xem nội dung chi tiết.
                </div>
              );
            }
            const content = nodeContents[activeNode.nodeId];
            const isCompleted = activeNode.studentStatus === 'COMPLETED';
            
            const materials = content?.materials || [];
            const tests = content?.tests || [];
            const exercises = content?.exercises || [];

            return (
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-6">
                
                {/* Tiêu đề & Mô tả bài học */}
                <div className="border-b border-border pb-4 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary block">
                    {activeNode.nodeType === 'AT_HOME' ? 'TỰ HỌC' : 'TRÊN LỚP'}
                  </span>
                  <h3 className="text-base font-extrabold text-foreground">{activeNode.title}</h3>
                  {activeNode.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                      {activeNode.description}
                    </p>
                  )}
                </div>

                {/* Phân Tab: Nội dung & Thảo luận */}
                <Tabs defaultValue="content" className="w-full font-sans">
                  <TabsList className="grid w-full grid-cols-2 bg-muted p-1 rounded-xl h-10 mb-5">
                    <TabsTrigger value="content" className="text-xs py-1.5 font-bold rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">
                      Nội dung
                    </TabsTrigger>
                    <TabsTrigger value="discussion" className="text-xs py-1.5 font-bold rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">
                      Thảo luận
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="content" className="mt-0 space-y-6">
                    {loadingNodeContent[activeNode.nodeId] ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                        <Loader2 className="size-6 animate-spin text-primary" />
                        <span className="text-xs font-semibold">Đang tải học liệu...</span>
                      </div>
                    ) : (
                      <>
                        {/* 1. TÀI LIỆU HỌC TẬP (Accordion đóng mở xem trực tiếp) */}
                        {materials.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                              <FileText className="size-3.5" /> TÀI LIỆU HỌC TẬP
                            </h4>
                            <div className="space-y-2">
                              {materials.map((m) => {
                                const key = `mat-${m.materialId}`;
                                const isOpened = openAccordions.has(key);
                                const isItemCompleted = completedMaterials[`${userId}-${m.materialId}`] || isCompleted;

                                return (
                                  <div key={key} className="border border-border rounded-2xl bg-card overflow-hidden shadow-2xs">
                                    <button
                                      onClick={() => toggleAccordion(key)}
                                      className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
                                    >
                                      <div className="flex items-center gap-3 min-w-0 pr-4">
                                        {isOpened ? (
                                          <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                                        ) : (
                                          <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                                        )}
                                        <span className="text-xs font-bold text-foreground truncate">
                                          {m.title}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        {isItemCompleted && (
                                          <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                                        )}
                                        <Badge variant="outline" className="text-[9px] font-bold rounded-md bg-muted/50 border-border/80">
                                          {m.video?.videoUrl ? 'Video' : 'PDF'}
                                        </Badge>
                                      </div>
                                    </button>

                                    {isOpened && (
                                      <div className="p-4 border-t border-border bg-muted/5 space-y-4">
                                        <MaterialPreview material={m} />
                                        
                                        <div className="flex justify-end pt-2 border-t border-border/50">
                                          <Button
                                            onClick={() => setActiveItem({ id: m.materialId, type: 'material', title: m.title, nodeId: activeNode.nodeId, data: m })}
                                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-xs py-1.5 h-8 flex items-center gap-1 shadow-xs"
                                          >
                                            <span>Học tập trung</span>
                                            <ExternalLink className="size-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* 2. BÀI KIỂM TRA ĐÁNH GIÁ */}
                        {tests.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                              <Award className="size-3.5" /> BÀI KIỂM TRA ĐÁNH GIÁ
                            </h4>
                            <div className="space-y-2">
                              {tests.map((t) => {
                                // Gate/placement chỉ "đạt" khi node được routing hoàn thành (gate hay có
                                // passingPercentage = 0 nên điểm thấp sẽ bị coi nhầm là đạt).
                                const isItemCompleted = isCompleted || (
                                  activeNode.testKind !== 'GATE' && activeNode.testKind !== 'PLACEMENT'
                                  && testHistory.filter(h => h.testId === t.testId && h.status !== 'CANCELLED').some(h => h.score !== null && h.score >= (t.passingPercentage ?? 0))
                                );
                                return (
                                  <div key={t.testId} className="border border-border rounded-2xl p-4 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                                    <div className="space-y-1">
                                      <span className="text-xs font-bold text-foreground block">{t.title}</span>
                                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-semibold flex-wrap">
                                        <span>Thời gian: {t.durationMinutes} phút</span>
                                        {activeNode.testKind === 'PLACEMENT' && (activeNode.placementYeuMax != null || activeNode.placementTbMax != null) ? (
                                          <span className="normal-case">
                                            Phân mức: Yếu ≤ {activeNode.placementYeuMax}% · TB ≤ {activeNode.placementTbMax}%
                                          </span>
                                        ) : activeNode.testKind === 'GATE' ? null : (
                                          <span>Yêu cầu đạt: {t.passingPercentage}%</span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {isItemCompleted ? (
                                        <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold rounded-lg text-[9px] px-2 py-0.5">
                                          Đã đạt
                                        </Badge>
                                      ) : (
                                        <Button
                                          onClick={() => navigate(`/student/tests/${t.testId}?csId=${classroomSubjectId}`)}
                                          className="bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs py-1.5 h-8 flex items-center gap-1"
                                        >
                                          Vào thi <ArrowRight className="size-3" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* 3. BÀI TẬP THỰC HÀNH */}
                        {exercises.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                              <PenLine className="size-3.5" /> BÀI TẬP THỰC HÀNH
                            </h4>
                            <div className="space-y-2">
                              {exercises.map((e) => {
                                const submission = exerciseSubmissions[e.exerciseId];
                                const isSubmitted = submission && (submission.status === 'SUBMITTED' || submission.status === 'GRADED');

                                return (
                                  <div key={e.exerciseId} className="border border-border rounded-2xl p-4 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                                    <div className="space-y-1">
                                      <span className="text-xs font-bold text-foreground block">{e.title}</span>
                                      <div className="flex items-center gap-2 flex-wrap pt-0.5">
                                        {e.allowText && (
                                          <Badge variant="outline" className="px-1.5 py-0.5 text-[9px] font-bold border-transparent bg-secondary text-secondary-foreground">
                                            Tự luận
                                          </Badge>
                                        )}
                                        {e.allowFile && (
                                          <Badge variant="outline" className="px-1.5 py-0.5 text-[9px] font-bold border-transparent bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                            Nộp file
                                          </Badge>
                                        )}
                                        {submission?.status === 'GRADED' && (
                                          <span className="text-[10px] text-emerald-600 font-bold">
                                            Đã chấm: {submission.grade}/100
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2.5 shrink-0">
                                      <Button
                                        onClick={() => setActiveItem({ id: e.exerciseId, type: 'exercise', title: e.title, nodeId: activeNode.nodeId, data: e })}
                                        className={`font-bold rounded-xl text-xs py-1.5 h-8 ${
                                          isSubmitted 
                                            ? 'bg-muted text-muted-foreground hover:bg-muted/80' 
                                            : 'bg-primary hover:bg-primary/95 text-primary-foreground'
                                        }`}
                                      >
                                        {isSubmitted ? 'Xem bài làm' : 'Làm bài'}
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {materials.length === 0 && tests.length === 0 && exercises.length === 0 && (
                          <div className="text-center py-10 border border-dashed border-border rounded-2xl bg-muted/10 text-muted-foreground text-xs">
                            Bài học này chưa có tài liệu học tập hay bài kiểm tra.
                          </div>
                        )}
                      </>
                    )}
                  </TabsContent>

                  {/* TAB THẢO LUẬN */}
                  <TabsContent value="discussion" className="mt-0">
                    <NodeDiscussion nodeId={activeNode.nodeId} role="student" />
                  </TabsContent>
                </Tabs>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
