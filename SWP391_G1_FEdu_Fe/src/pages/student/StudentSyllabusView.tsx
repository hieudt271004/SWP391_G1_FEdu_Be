import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookMarked, 
  Lock, 
  CheckCircle2, 
  ArrowRight,
  Loader2
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { Badge } from '../../components/ui/badge';
import type { ClassroomSubjectResponse } from '../../types/classroomSubject';
import type { LearningNodeResponse, NodeContentResponse } from '../../services/learningPath.service';
import type { SubmissionResponse, StudentTestAttemptHistoryResponse } from '../../services/student.service';

export interface LearningPathItem {
  id: number;
  type: 'material' | 'test' | 'exercise';
  title: string;
  nodeId: number;
  data: any;
}

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
  userId
}: StudentSyllabusViewProps) {
  const navigate = useNavigate();
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);

  // Initialize selectedNodeId to first incomplete node or first node
  useEffect(() => {
    if (nodes.length > 0 && selectedNodeId === null) {
      const firstIncompleteNode = nodes.find(n => n.studentStatus !== 'COMPLETED');
      const targetNodeId = firstIncompleteNode ? firstIncompleteNode.nodeId : nodes[0].nodeId;
      setSelectedNodeId(targetNodeId);
      ensureNodeContent(targetNodeId);
    }
  }, [nodes, selectedNodeId, ensureNodeContent]);

  // Load content when selected node changes
  const handleSelectNode = (nodeId: number) => {
    setSelectedNodeId(nodeId);
    ensureNodeContent(nodeId);
  };

  return (
    <div className="min-h-screen bg-zinc-50 pb-16">
      {/* Top Banner / Breadcrumb */}
      <div className="bg-white border-b border-zinc-200 py-4 px-6 mb-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
            <button 
              onClick={() => navigate('/student/courses')}
              className="hover:text-black transition-colors"
            >
              Khóa học của tôi
            </button>
            <span>/</span>
            <span className="text-zinc-900 font-bold">{subject?.displayName || subject?.subjectName}</span>
          </div>
          <Button
            onClick={() => {
              // Find first incomplete item
              const firstIncomplete = allItems.find(item => {
                const node = nodes.find(n => n.nodeId === item.nodeId);
                return node && node.studentStatus !== 'COMPLETED';
              }) || allItems[0];
              if (firstIncomplete) {
                setActiveItem(firstIncomplete);
              }
            }}
            className="bg-black hover:bg-zinc-800 text-white rounded-xl text-xs px-5 py-2 font-extrabold flex items-center gap-1.5"
          >
            <span>Bắt đầu học</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Left Column: Course details & Module Navigation list */}
        <div className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-zinc-100 border border-zinc-200">
              <BookMarked className="w-5 h-5 text-zinc-900" />
            </div>
            <div>
              <h2 className="font-extrabold text-zinc-900 text-base leading-snug">
                {subject?.displayName || subject?.subjectName}
              </h2>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
                Lớp: {subject?.className} • Mã: {subject?.subjectCode}
              </p>
            </div>
            {/* Progress */}
            <div className="pt-2 border-t border-zinc-100 space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-zinc-700">
                <span>Tiến độ học tập</span>
                <span>{progressStats.percent}%</span>
              </div>
              <Progress value={progressStats.percent} className="h-1.5 bg-zinc-200" />
              <p className="text-[10px] text-zinc-500 font-bold">
                Đã hoàn thành {progressStats.completed}/{progressStats.total} bài học
              </p>
            </div>
          </div>

          {/* Module List Menu */}
          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-zinc-100 bg-zinc-50">
              <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider">
                Nội dung học tập
              </h3>
            </div>
            <nav className="divide-y divide-zinc-100">
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
                        ? 'bg-zinc-50 text-black font-extrabold border-l-4 border-l-black' 
                        : 'text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    <div className="pt-0.5 shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="size-4 text-emerald-600 fill-emerald-50" />
                      ) : isLocked ? (
                        <Lock className="size-4 text-zinc-400" />
                      ) : (
                        <div className={`size-4 rounded-full border-2 ${
                          isSelected ? 'border-black bg-zinc-100' : 'border-zinc-300'
                        }`} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider block">
                        Bài học {index + 1}
                      </span>
                      <span className="text-xs font-bold truncate block">{node.title}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Right Column: Node Details & Syllabus items list */}
        <div className="md:col-span-3 space-y-6">
          {(() => {
            const activeNode = nodes.find(n => n.nodeId === selectedNodeId);
            if (!activeNode) return null;
            const content = nodeContents[activeNode.nodeId];
            const isCompleted = activeNode.studentStatus === 'COMPLETED';
            
            // Gather items inside the selected node
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
              <div className="bg-white border border-zinc-200 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
                <div className="flex justify-between items-start flex-wrap gap-4 border-b border-zinc-100 pb-5">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-[4px] border uppercase ${
                        activeNode.nodeType === 'AT_HOME' 
                          ? 'bg-zinc-100 border-zinc-200 text-zinc-800' 
                          : 'bg-black border-black text-white'
                      }`}>
                        {activeNode.nodeType === 'AT_HOME' ? 'Tự học' : 'Lên lớp'}
                      </span>
                      {isCompleted && (
                        <Badge className="bg-emerald-50 hover:bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] font-extrabold px-2 py-0.5 rounded-md">
                          Hoàn thành
                        </Badge>
                      )}
                    </div>
                    <h1 className="text-xl md:text-2xl font-extrabold text-zinc-900 leading-tight">
                      {activeNode.title}
                    </h1>
                    {activeNode.description && (
                      <p className="text-xs text-zinc-500 max-w-2xl pt-1 leading-relaxed">
                        {activeNode.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* List of items */}
                <div className="space-y-4">
                  <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider">
                    Danh sách bài học & học liệu
                  </h3>
                  
                  {loadingNodeContent[activeNode.nodeId] ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2 text-zinc-400">
                      <Loader2 className="size-6 animate-spin text-black" />
                      <span className="text-xs font-medium">Đang tải tài liệu bài học...</span>
                    </div>
                  ) : nodeItems.length > 0 ? (
                    <div className="divide-y divide-zinc-200 border border-zinc-200 rounded-2xl overflow-hidden bg-white">
                      {(() => {
                        const completedItems = nodeItems.map(itm => {
                          if (isCompleted) return true;
                          if (itm.type === 'material') {
                            return completedMaterials[`${userId}-${itm.id}`] || false;
                          }
                          if (itm.type === 'test') {
                            const history = testHistory.filter(h => h.testId === itm.id);
                            return history.some(h => h.score >= itm.data.passingPercentage);
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
                              className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors cursor-pointer group"
                            >
                              <div className="flex items-center gap-3 min-w-0 pr-4">
                                <div className="shrink-0">
                                  {isItemCompleted ? (
                                    <CheckCircle2 className="size-5 text-emerald-600 fill-emerald-50" />
                                  ) : (
                                    <div className="size-5 rounded-full border-2 border-zinc-300 flex items-center justify-center group-hover:border-black transition-colors">
                                      <div className="size-2 rounded-full bg-transparent group-hover:bg-black transition-colors" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-xs font-bold text-zinc-900 group-hover:text-black transition-colors truncate">
                                    {item.title}
                                  </h4>
                                  <p className="text-[10px] text-zinc-500 font-semibold capitalize flex items-center gap-1.5 mt-0.5">
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
                                  </p>
                                </div>
                              </div>

                              <div className="shrink-0">
                                {isFirstIncomplete ? (
                                  <Button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveItem(item);
                                    }}
                                    className="bg-black hover:bg-zinc-800 text-white font-extrabold text-[10px] rounded-xl px-4 py-1.5 h-8 flex items-center gap-1 transition-all shadow-xs"
                                  >
                                    <span>Get started</span>
                                    <ArrowRight className="size-3" />
                                  </Button>
                                ) : isItemCompleted ? (
                                  <span className="text-[10px] font-bold text-zinc-400 px-3 py-1 bg-zinc-100 rounded-lg group-hover:bg-zinc-200 group-hover:text-black transition-colors">
                                    Xem lại
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-zinc-500 px-3 py-1 bg-zinc-50 border border-zinc-200 rounded-lg group-hover:bg-black group-hover:text-white group-hover:border-black transition-all">
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
                    <div className="text-center py-10 border border-dashed border-zinc-200 rounded-2xl bg-zinc-50 text-zinc-400 text-xs">
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
