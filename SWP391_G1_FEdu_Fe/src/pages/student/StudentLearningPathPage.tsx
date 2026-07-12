import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { StudentSyllabusView } from './StudentSyllabusView';
import { toast } from 'sonner';
import { 
  Play, 
  FileText, 
  Award, 
  BookMarked, 
  Lock, 
  CheckCircle2, 
  ChevronRight, 
  ChevronDown, 
  ArrowLeft, 
  ArrowRight,
  Loader2, 
  X,
  Upload,
  Cloud,
  Download,
  ChevronLeft,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Clock,
  Radio
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
import { useAuth } from '../../context/AuthContext';
import {
  studentService,
  type SubmissionResponse,
  type StudentTestAttemptHistoryResponse
} from '../../services/student.service';
import { classroomService } from '../../services/classroom.service';
import { resolveAssetUrl, MaterialPreview } from '../../components/learningPath/MaterialPreview';
import type { ClassroomSubjectResponse } from '../../types/classroomSubject';
import type { LearningNodeResponse, NodeContentResponse } from '../../services/learningPath.service';
import { NodeDiscussion } from '../../components/learningPath/NodeDiscussion';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';

interface LearningPathItem {
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

export function StudentLearningPathPage() {
  const { csId } = useParams<{ csId: string }>();
  const classroomSubjectId = Number(csId);
  const navigate = useNavigate();
  const { user } = useAuth();

  
  const [subject, setSubject] = useState<ClassroomSubjectResponse | null>(null);
  const [nodes, setNodes] = useState<LearningNodeResponse[]>([]);
  const [nodeContents, setNodeContents] = useState<Record<number, NodeContentResponse>>({});
  const [totalMaterials, setTotalMaterials] = useState<number>(0);
  const [totalCompleted, setTotalCompleted] = useState<number>(0);
  
  
  const [loading, setLoading] = useState(true);
  const [loadingNodeContent, setLoadingNodeContent] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  
  const [searchParams, setSearchParams] = useSearchParams();
  const isLearnMode = searchParams.get('mode') === 'learn';
  const paramItemId = searchParams.get('itemId');
  const paramItemType = searchParams.get('itemType');

  
  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({});

  
  const [exerciseSubmissions, setExerciseSubmissions] = useState<Record<number, SubmissionResponse | null>>({});
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submittingExerciseId, setSubmittingExerciseId] = useState<number | null>(null);
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  
  const [testHistory, setTestHistory] = useState<StudentTestAttemptHistoryResponse[]>([]);

  
  const [completedMaterials, setCompletedMaterials] = useState<Record<string, boolean>>({});



  const refreshProgressData = async () => {
    if (!user?.userId || !classroomSubjectId) return null;
    const graph = await studentService.getClassroomSubjectGraph(classroomSubjectId);
    const sortedNodes = (graph.nodes || []).sort((a, b) => {
      const sA = a.stageOrder ?? 0;
      const sB = b.stageOrder ?? 0;
      if (sA !== sB) return sA - sB;
      return ((a.displayOrder ?? 0) - (b.displayOrder ?? 0)) || (a.nodeId - b.nodeId);
    });
    setNodes(sortedNodes);
    setTotalMaterials(graph.totalMaterials || 0);
    setTotalCompleted(graph.completedMaterials || 0);

    try {
      const history = await studentService.getTestHistory();
      setTestHistory(history || []);
    } catch (hErr) {
      console.error("Failed to load test history:", hErr);
      toast.warning("Không thể tải lịch sử làm bài.");
    }

    try {
      const completedMaterialIds = await studentService.getCompletedMaterials();
      const newMaterialsMap: Record<string, boolean> = {};
      completedMaterialIds.forEach(id => {
        newMaterialsMap[`${user.userId}-${id}`] = true;
      });
      setCompletedMaterials(newMaterialsMap);
    } catch (mErr) {
      console.error("Failed to load completed materials:", mErr);
      toast.warning("Không thể tải tiến độ học liệu.");
    }


    try {
      const submissions = await studentService.getMySubmissionsForClassroomSubject(classroomSubjectId);
      const submissionMap: Record<number, SubmissionResponse | null> = {};
      (submissions || []).forEach(s => {
        if (s.exerciseId != null) submissionMap[s.exerciseId] = s;
      });
      setExerciseSubmissions(submissionMap);
    } catch (sErr) {
      console.error("Failed to load exercise submissions:", sErr);
    }

    return sortedNodes;
  };

  
  useEffect(() => {
    if (!user?.userId || !classroomSubjectId) return;

    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        
        const subjectsList = await classroomService.getClassroomSubjectsByStudent(user.userId);
        const currentSub = subjectsList.find(s => s.classroomSubjectId === classroomSubjectId);
        if (currentSub) {
          setSubject(currentSub);
        }

        
        const sortedNodes = await refreshProgressData();

        if (sortedNodes) {
          
          const initialExpanded: Record<number, boolean> = {};
          const openNodeIds: number[] = [];

          sortedNodes.forEach(node => {
            if (node.studentStatus !== 'LOCKED') {
              initialExpanded[node.nodeId] = true;
              openNodeIds.push(node.nodeId);
            }
          });
          setExpandedNodes(initialExpanded);

          
          await Promise.all(
            openNodeIds.map(nodeId => ensureNodeContent(nodeId))
          );
        }

      } catch (err: any) {
        console.error('Error loading roadmap data:', err);
        setError(err.message || 'Không thể tải lộ trình học tập. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [user?.userId, classroomSubjectId]);

  


  
  const ensureNodeContent = async (nodeId: number): Promise<NodeContentResponse | null> => {
    if (nodeContents[nodeId]) return nodeContents[nodeId];
    setLoadingNodeContent(prev => ({ ...prev, [nodeId]: true }));
    try {
      const content = await studentService.getNodeContent(nodeId);
      setNodeContents(prev => ({ ...prev, [nodeId]: content }));
      return content;
    } catch (err) {
      console.error(`Failed to load content for node ${nodeId}:`, err);
      return null;
    } finally {
      setLoadingNodeContent(prev => ({ ...prev, [nodeId]: false }));
    }
  };

  
  const handleToggleNode = async (node: LearningNodeResponse) => {
    if (node.studentStatus === 'LOCKED') {
      toast.error('Bài học này đang bị khóa. Hãy hoàn thành các bài học trước!');
      return;
    }
    const isExpanded = !!expandedNodes[node.nodeId];
    setExpandedNodes(prev => ({ ...prev, [node.nodeId]: !isExpanded }));
    
    if (!isExpanded) {
      await ensureNodeContent(node.nodeId);
    }
  };

  
  const allItems = useMemo(() => {
    const list: LearningPathItem[] = [];
    nodes.forEach(node => {
      if (node.studentStatus === 'LOCKED') return;
      const content = nodeContents[node.nodeId];
      if (!content) return;

      
      if (content.materials) {
        content.materials.forEach(m => {
          list.push({
            id: m.materialId,
            type: 'material',
            title: m.title,
            nodeId: node.nodeId,
            data: m
          });
        });
      }

      
      if (content.tests) {
        content.tests.forEach(t => {
          list.push({
            id: t.testId,
            type: 'test',
            title: t.title,
            nodeId: node.nodeId,
            data: t
          });
        });
      }

      
      if (content.exercises) {
        content.exercises.forEach(e => {
          list.push({
            id: e.exerciseId,
            type: 'exercise',
            title: e.title,
            nodeId: node.nodeId,
            data: e
          });
        });
      }
    });
    return list;
  }, [nodes, nodeContents]);

  
  const activeItem = useMemo(() => {
    if (!isLearnMode || !paramItemId || !paramItemType) return null;
    const itemId = Number(paramItemId);
    return allItems.find(item => item.id === itemId && item.type === paramItemType) || null;
  }, [isLearnMode, paramItemId, paramItemType, allItems]);

  const setActiveItem = (item: LearningPathItem | null) => {
    if (item === null) {
      setSearchParams({});
    } else {
      setSearchParams({
        mode: 'learn',
        itemId: String(item.id),
        itemType: item.type
      });
    }
  };

  
  useEffect(() => {
    if (isLearnMode && allItems.length > 0 && !activeItem) {
      const firstIncomplete = allItems.find(item => {
        const node = nodes.find(n => n.nodeId === item.nodeId);
        return node && node.studentStatus !== 'COMPLETED';
      }) || allItems[0];
      
      setActiveItem(firstIncomplete);
    }
  }, [isLearnMode, allItems, activeItem]);

  
  useEffect(() => {
    if (activeItem && activeItem.type === 'exercise') {
      fetchExerciseSubmission(activeItem.id);
      setIsResubmitting(false);
      setSubmissionText('');
      setSubmissionFile(null);
    }
  }, [activeItem]);

  const fetchExerciseSubmission = async (exerciseId: number) => {
    try {
      const res = await studentService.getMyExerciseSubmission(exerciseId);
      setExerciseSubmissions(prev => ({ ...prev, [exerciseId]: res }));
    } catch (err) {
      console.error("Failed to load exercise submission:", err);
      setExerciseSubmissions(prev => ({ ...prev, [exerciseId]: null }));
    }
  };

  



  const maybeCompleteNode = async (
    nodeId: number,
    materialsMap: Record<string, boolean>,
    submissionsMap: Record<number, SubmissionResponse | null>
  ): Promise<boolean> => {
    if (!user?.userId) return false;
    const content = nodeContents[nodeId];
    if (!content) return false;
    const node = nodes.find(n => n.nodeId === nodeId);
    if (node?.studentStatus === 'COMPLETED') return false;

    if (node?.testKind && node.testKind !== 'NONE') return false;

    const materials = content.materials || [];
    const tests = content.tests || [];
    const exercises = content.exercises || [];

    if (materials.length + tests.length + exercises.length === 0) return false;

    const allMaterialsDone = materials.every(m => !!materialsMap[`${user.userId}-${m.materialId}`]);
    const allTestsDone = tests.every(t => {
      const history = testHistory.filter(h => h.testId === t.testId);
      return history.some(h => (h.score ?? 0) >= (t.passingPercentage ?? 0));
    });
    const allExercisesDone = exercises.every(e => {
      const sub = submissionsMap[e.exerciseId];
      return sub?.status === 'SUBMITTED' || sub?.status === 'GRADED';
    });

    if (allMaterialsDone && allTestsDone && allExercisesDone) {
      await studentService.completeNode(nodeId);
      await refreshProgressData();
      return true;
    }
    return false;
  };

  const handleExerciseSubmit = async () => {
    if (!activeItem || activeItem.type !== 'exercise') return;
    const exerciseId = activeItem.id;
    const exercise = activeItem.data;

    if (exercise.allowText && !submissionText.trim() && !submissionFile) {
      toast.error("Vui lòng nhập nội dung hoặc đính kèm file!");
      return;
    }
    if (exercise.allowFile && !submissionFile && !submissionText.trim()) {
      toast.error("Vui lòng chọn hoặc kéo thả tệp đính kèm!");
      return;
    }

    setSubmittingExerciseId(exerciseId);
    try {
      const formData = new FormData();
      if (submissionText.trim()) {
        formData.append('content', submissionText.trim());
      }
      if (submissionFile) {
        formData.append('file', submissionFile);
      }

      const submitted = await studentService.submitExercise(exerciseId, formData);
      toast.success("Nộp bài tập thực hành thành công!");
      setIsResubmitting(false);
      setSubmissionText('');
      setSubmissionFile(null);


      const updatedSubmissions = { ...exerciseSubmissions, [exerciseId]: submitted };
      setExerciseSubmissions(updatedSubmissions);


      const completed = await maybeCompleteNode(activeItem.nodeId, completedMaterials, updatedSubmissions);
      if (completed) {
        toast.success("Chúc mừng! Bạn đã hoàn thành tất cả các bài học trong chương này.");
      } else {
        await refreshProgressData();
      }
    } catch (err: any) {
      console.error("Submit exercise failed:", err);
      toast.error(err.message || "Nộp bài tập thất bại. Vui lòng thử lại.");
    } finally {
      setSubmittingExerciseId(null);
    }
  };

  const attemptsForTest = useMemo(() => {
    if (!activeItem || activeItem.type !== 'test') return [];
    return testHistory.filter(h => h.testId === activeItem.id);
  }, [activeItem, testHistory]);

  const highestAttempt = useMemo(() => {
    if (attemptsForTest.length === 0) return null;
    return attemptsForTest.reduce((max, curr) => (curr.score ?? 0) > (max.score ?? 0) ? curr : max, attemptsForTest[0]);
  }, [attemptsForTest]);

  
  const currentItemIndex = useMemo(() => {
    if (!activeItem) return -1;
    return allItems.findIndex(item => item.type === activeItem.type && item.id === activeItem.id);
  }, [activeItem, allItems]);

  const currentItemsForNode = useMemo(() => {
    if (!activeItem) return [];
    return allItems.filter(item => item.nodeId === activeItem.nodeId);
  }, [activeItem, allItems]);

  const currentItemIndexInNode = useMemo(() => {
    if (!activeItem) return -1;
    return currentItemsForNode.findIndex(item => item.type === activeItem.type && item.id === activeItem.id);
  }, [activeItem, currentItemsForNode]);

  const handlePrevItem = () => {
    if (currentItemIndex > 0) {
      setActiveItem(allItems[currentItemIndex - 1]);
    }
  };

  const handleNextItem = () => {
    if (currentItemIndex < allItems.length - 1) {
      setActiveItem(allItems[currentItemIndex + 1]);
    }
  };

  
  const progressStats = useMemo(() => {
    if (totalMaterials === 0) return { completed: 0, total: 0, percent: 0 };
    return {
      completed: totalCompleted,
      total: totalMaterials,
      percent: Math.round((totalCompleted / totalMaterials) * 100)
    };
  }, [totalMaterials, totalCompleted]);

  
  const activeNode = useMemo(() => {
    if (!activeItem) return null;
    return nodes.find(n => n.nodeId === activeItem.nodeId) || null;
  }, [activeItem, nodes]);

  const isNodeCompleted = activeNode?.studentStatus === 'COMPLETED';

  
  const isItemCompleted = useMemo(() => {
    if (!activeItem || !activeNode) return false;
    if (activeNode.studentStatus === 'COMPLETED') return true;
    if (activeItem.type === 'material') {
      return !!completedMaterials[`${user?.userId}-${activeItem.id}`];
    }
    if (activeItem.type === 'test') {
      const history = testHistory.filter(h => h.testId === activeItem.id);
      return history.some(h => (h.score ?? 0) >= activeItem.data.passingPercentage);
    }
    if (activeItem.type === 'exercise') {
      const submission = exerciseSubmissions[activeItem.id];
      return submission?.status === 'SUBMITTED' || submission?.status === 'GRADED';
    }
    return false;
  }, [activeItem, activeNode, completedMaterials, user?.userId, testHistory, exerciseSubmissions]);

  const [completingNodeId, setCompletingNodeId] = useState<number | null>(null);

  const handleCompleteActiveItem = async () => {
    if (!activeItem || !activeNode || !user?.userId) return;
    try {
      setCompletingNodeId(activeNode.nodeId);
      
      
      await studentService.completeMaterial(activeItem.id);
      
      const key = `${user.userId}-${activeItem.id}`;
      const updatedMaterials = { ...completedMaterials, [key]: true };
      setCompletedMaterials(updatedMaterials);
      
      toast.success("Đã đánh dấu hoàn thành bài học!");


      const completed = await maybeCompleteNode(activeNode.nodeId, updatedMaterials, exerciseSubmissions);
      if (completed) {
        toast.success("Chúc mừng! Bạn đã hoàn thành tất cả các bài học trong chương này.");
      } else {
        await refreshProgressData();
      }


      if (currentItemIndex < allItems.length - 1) {
        setActiveItem(allItems[currentItemIndex + 1]);
      }
    } catch (err: any) {
      console.error("Complete active item error:", err);
      toast.error("Không thể đánh dấu hoàn thành bài học. Vui lòng thử lại.");
    } finally {
      setCompletingNodeId(null);
    }
  };

  const renderCompletionFooter = () => {
    if (!activeItem || !activeNode) return null;
    const hasNextItem = currentItemIndex < allItems.length - 1;

    return (
      <div className="border-t border-border pt-8 mt-12 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {isItemCompleted ? (
              <div className="flex items-center gap-2 text-emerald-600 font-extrabold text-sm">
                <CheckCircle2 className="size-5 text-emerald-600 fill-none" />
                <span>Completed</span>
              </div>
            ) : activeItem.type === 'material' ? (
              <Button
                onClick={handleCompleteActiveItem}
                disabled={completingNodeId === activeNode.nodeId}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold rounded-xl px-5 h-10 flex items-center gap-1.5 shadow-xs"
              >
                {completingNodeId === activeNode.nodeId ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                <span>Mark as completed</span>
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground font-bold italic bg-muted/40 border border-border px-3 py-1.5 rounded-lg">
                Vui lòng nộp & đạt bài kiểm tra/bài tập để hoàn thành bài học này
              </span>
            )}

            {isItemCompleted && hasNextItem && (
              <Button
                onClick={handleNextItem}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold rounded-xl px-5 h-10"
              >
                Go to next item
              </Button>
            )}
          </div>

          {}
        </div>

        <div className="flex items-center gap-6 text-muted-foreground text-xs font-semibold pt-2">
          <button className="flex items-center gap-1.5 hover:text-foreground transition-colors">
            <ThumbsUp className="size-4" />
            <span>Like</span>
          </button>
          <button className="flex items-center gap-1.5 hover:text-foreground transition-colors">
            <ThumbsDown className="size-4" />
            <span>Dislike</span>
          </button>
          <button className="flex items-center gap-1.5 hover:text-foreground transition-colors">
            <Flag className="size-4" />
            <span>Report an issue</span>
          </button>
        </div>
      </div>
    );
  };

  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground font-medium">Đang tải lộ trình học tập của bạn...</span>
      </div>
    );
  }

  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 max-w-md mx-auto text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
          <X className="w-8 h-8 text-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Không thể tải lộ trình</h3>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        </div>
        <Button onClick={() => navigate('/student/courses')} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl px-6">
          Quay lại khóa học
        </Button>
      </div>
    );
  }

  if (!isLearnMode) {
    return (
      <StudentSyllabusView
        subject={subject}
        nodes={nodes}
        nodeContents={nodeContents}
        loadingNodeContent={loadingNodeContent}
        testHistory={testHistory}
        exerciseSubmissions={exerciseSubmissions}
        progressStats={progressStats}
        allItems={allItems}
        setActiveItem={setActiveItem}
        ensureNodeContent={ensureNodeContent}
        completedMaterials={completedMaterials}
        userId={user?.userId}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen bg-background text-foreground overflow-hidden select-none font-sans">
      {}
      <div className="w-80 border-r border-border flex flex-col h-full bg-muted/30 shrink-0">
        {}
        <div className="p-4 border-b border-border bg-card">
          <button 
            onClick={() => setSearchParams({})}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-bold transition-colors mb-3 outline-none"
          >
            <ArrowLeft className="size-3.5" />
            <span>Quay lại khóa học</span>
          </button>
          
          <h2 className="font-bold text-foreground text-sm leading-snug truncate" title={subject?.displayName || subject?.subjectName}>
            {subject?.displayName || subject?.subjectName}
          </h2>
          <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
            Lớp: {subject?.className} • Mã môn: {subject?.subjectCode}
          </p>

          {}
          <div className="mt-4 space-y-1.5">
            <Progress value={progressStats.percent} className="h-1.5 bg-muted [&>div]:bg-primary rounded-full" />
            <div className="flex justify-between text-[10px] font-bold text-muted-foreground mb-0.5">
              <span>Đã hoàn thành {progressStats.completed}/{progressStats.total} học liệu</span>
              <span className="text-foreground">{progressStats.percent}%</span>
            </div>
          </div>
        </div>

        {}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-3 space-y-2">
            {nodes.map((node, index) => {
              const isCompleted = node.studentStatus === 'COMPLETED';
              const isOpen = node.studentStatus === 'OPEN' || node.studentStatus === 'IN_PROGRESS';
              const isLocked = node.studentStatus === 'LOCKED';
              const isExpanded = !!expandedNodes[node.nodeId];
              const content = nodeContents[node.nodeId];

              return (
                <div key={node.nodeId} className="border border-border rounded-lg overflow-hidden bg-card shadow-xs">
                  {}
                  <div 
                    onClick={() => handleToggleNode(node)}
                    className={`p-3 flex justify-between items-start cursor-pointer hover:bg-muted/50 transition-colors select-none ${
                      isLocked ? 'opacity-50 cursor-not-allowed bg-muted/20' : ''
                    }`}
                  >
                    <div className="flex-1 space-y-1 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-sm border uppercase ${
                          node.nodeType === 'AT_HOME' 
                            ? 'bg-muted border-border text-muted-foreground' 
                            : 'bg-primary border-primary text-primary-foreground'
                        }`}>
                          {node.nodeType === 'AT_HOME' ? 'Tự học' : 'Lên lớp'}
                        </span>
                        
                        {isCompleted && (
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-sm bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 uppercase">
                            Đã xong
                          </span>
                        )}
                        {isCompleted && node.completedLate && (
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-sm bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 uppercase">
                            Hoàn thành trễ
                          </span>
                        )}
                        {isOpen && (
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-sm bg-primary border border-primary text-primary-foreground uppercase animate-pulse">
                            Đang học
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-foreground text-[11px] leading-snug pt-0.5">
                        {}
                        {node.stageOrder != null ? `Chặng ${node.stageOrder} · ` : `${index + 1}. `}{node.title}
                      </h4>

                      {node.deadlineAt && !isCompleted && (
                        <p className={`flex items-center gap-1 text-[9px] font-semibold pt-0.5 ${
                          isDeadlineOverdue(node.deadlineAt) ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
                        }`}>
                          <Clock className="size-3 shrink-0" />
                          {isDeadlineOverdue(node.deadlineAt) ? 'Quá hạn: ' : 'Hạn: '}{formatDeadline(node.deadlineAt)}
                        </p>
                      )}

                      {node.nodeType === 'ON_CLASS' && !isLocked && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/student/classroom-subjects/${classroomSubjectId}/live/${node.nodeId}`);
                          }}
                          className="flex items-center gap-1 text-[9px] font-bold text-rose-600 dark:text-rose-400 hover:underline pt-0.5"
                        >
                          <Radio className="size-3 shrink-0" /> Vào buổi học trực tiếp
                        </button>
                      )}
                    </div>

                    <div className="pt-0.5 text-muted-foreground shrink-0">
                      {isLocked ? (
                        <Lock className="size-3.5 text-muted-foreground" />
                      ) : isExpanded ? (
                        <ChevronDown className="size-3.5 text-foreground" />
                      ) : (
                        <ChevronRight className="size-3.5 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {}
                  {isExpanded && !isLocked && (
                    <div className="border-t border-border bg-muted/10 divide-y divide-border">
                      {loadingNodeContent[node.nodeId] ? (
                        <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground">
                          <Loader2 className="size-3.5 animate-spin text-foreground" />
                          <span className="text-[10px] font-semibold">Đang tải...</span>
                        </div>
                      ) : (
                        <>
                          {}
                          {content?.materials?.map(m => {
                            const isItemActive = activeItem?.type === 'material' && activeItem?.id === m.materialId;
                            return (
                              <button
                                key={m.materialId}
                                onClick={() => setActiveItem({ id: m.materialId, type: 'material', title: m.title, nodeId: node.nodeId, data: m })}
                                className={`w-full text-left p-2.5 pl-6 text-[11px] flex items-center justify-between transition-colors outline-none ${
                                  isItemActive 
                                    ? 'bg-primary text-primary-foreground font-bold' 
                                    : 'text-muted-foreground hover:bg-muted/50 font-semibold'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0 pr-2">
                                  {m.video?.videoUrl ? (
                                    <Play className={`size-3.5 shrink-0 ${isItemActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                                  ) : (
                                    <FileText className={`size-3.5 shrink-0 ${isItemActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                                  )}
                                  <span className="truncate">{m.title}</span>
                                </div>
                                {(isCompleted || completedMaterials[`${user?.userId}-${m.materialId}`]) && (
                                  <CheckCircle2 className={`size-3.5 shrink-0 ${isItemActive ? 'text-primary-foreground' : 'text-emerald-600 dark:text-emerald-450'}`} />
                                )}
                              </button>
                            );
                          })}

                          {}
                          {content?.tests?.map(t => {
                            const isItemActive = activeItem?.type === 'test' && activeItem?.id === t.testId;
                            return (
                              <button
                                key={t.testId}
                                onClick={() => setActiveItem({ id: t.testId, type: 'test', title: t.title, nodeId: node.nodeId, data: t })}
                                className={`w-full text-left p-2.5 pl-6 text-[11px] flex items-center justify-between transition-colors outline-none ${
                                  isItemActive 
                                    ? 'bg-primary text-primary-foreground font-bold' 
                                    : 'text-muted-foreground hover:bg-muted/50 font-semibold'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0 pr-2">
                                  <Award className={`size-3.5 shrink-0 ${isItemActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                                  <span className="truncate">{t.title}</span>
                                </div>
                                {(isCompleted || testHistory.filter(h => h.testId === t.testId).some(h => (h.score ?? 0) >= (t.passingPercentage ?? 0))) && (
                                  <CheckCircle2 className={`size-3.5 shrink-0 ${isItemActive ? 'text-primary-foreground' : 'text-emerald-600 dark:text-emerald-450'}`} />
                                )}
                              </button>
                            );
                          })}

                          {}
                          {content?.exercises?.map(e => {
                            const isItemActive = activeItem?.type === 'exercise' && activeItem?.id === e.exerciseId;
                            const submission = exerciseSubmissions[e.exerciseId];
                            const isSubmitted = submission && (submission.status === 'SUBMITTED' || submission.status === 'GRADED');
                            
                            return (
                              <button
                                key={e.exerciseId}
                                onClick={() => setActiveItem({ id: e.exerciseId, type: 'exercise', title: e.title, nodeId: node.nodeId, data: e })}
                                className={`w-full text-left p-2.5 pl-6 text-[11px] flex items-center justify-between transition-colors outline-none ${
                                  isItemActive 
                                    ? 'bg-primary text-primary-foreground font-bold' 
                                    : 'text-muted-foreground hover:bg-muted/50 font-semibold'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0 pr-2">
                                  <BookMarked className={`size-3.5 shrink-0 ${isItemActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                                  <span className="truncate">{e.title}</span>
                                </div>
                                {isSubmitted ? (
                                  <CheckCircle2 className={`size-3.5 shrink-0 ${isItemActive ? 'text-primary-foreground' : 'text-emerald-600 dark:text-emerald-450'}`} />
                                ) : isCompleted ? (
                                  <CheckCircle2 className={`size-3.5 shrink-0 ${isItemActive ? 'text-primary-foreground' : 'text-emerald-600 dark:text-emerald-450'}`} />
                                ) : null}
                              </button>
                            );
                          })}

                          {(!content?.materials?.length && !content?.tests?.length && !content?.exercises?.length) && (
                            <div className="p-3 text-center text-[10px] text-muted-foreground italic">
                              Chưa có tài liệu hoặc bài tập
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>      {}
      <div className="flex-1 flex flex-col h-full bg-background text-foreground relative overflow-hidden">
        {}
        <div className="h-12 border-b border-border flex items-center justify-between px-6 bg-card shrink-0">
          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <span>Lộ trình học tập</span>
            <span>/</span>
            {activeItem ? (
              <>
                <span className="text-foreground">
                  {activeItem.type === 'material' ? 'Học liệu' : activeItem.type === 'test' ? 'Bài kiểm tra' : 'Bài thực hành'}
                </span>
                <span>/</span>
                <span className="truncate max-w-[250px] text-foreground">{activeItem.title}</span>
              </>
            ) : (
              <span className="text-foreground">Tổng quan bài học</span>
            )}
          </div>
          
          <button 
            onClick={() => setSearchParams({})}
            className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors border-none bg-transparent cursor-pointer outline-none"
            title="Đóng lộ trình"
          >
            <X className="size-4" />
          </button>
        </div>

        {}
        <div className="flex-1 overflow-y-auto p-8 bg-muted/10">
          <div className="max-w-3xl mx-auto space-y-6 pb-20">
            {activeItem ? (
              <>
                {}
                {activeItem.type === 'material' && (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-sm text-[8px] font-bold uppercase px-2 py-0.5 border-transparent">Học liệu</Badge>
                        {activeItem.data.required && (
                          <Badge variant="outline" className="border-border text-muted-foreground rounded-sm text-[8px] font-bold uppercase px-2 py-0.5 bg-background">Bắt buộc</Badge>
                        )}
                      </div>
                      <h1 className="text-xl font-bold text-foreground leading-tight tracking-tight">{activeItem.title}</h1>
                      {activeItem.data.video?.durationSeconds ? (
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">
                          Thời lượng: {Math.round(activeItem.data.video.durationSeconds / 60)} phút
                        </p>
                      ) : null}
                    </div>

                    {}
                    <div className="border border-border rounded-lg overflow-hidden bg-card p-1.5 shadow-sm">
                      <MaterialPreview material={activeItem.data} />
                    </div>

                    {}
                    {activeItem.data.video?.description && (
                      <div className="space-y-1.5 border-t border-border pt-4">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Mô tả chi tiết</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{activeItem.data.video.description}</p>
                      </div>
                    )}
                    {activeItem.data.file?.description && (
                      <div className="space-y-1.5 border-t border-border pt-4">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Mô tả chi tiết</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{activeItem.data.file.description}</p>
                      </div>
                    )}
                  </div>
                )}

                {}
                {activeItem.type === 'test' && (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-sm text-[8px] font-bold uppercase px-2 py-0.5 border-transparent">Bài kiểm tra đánh giá</Badge>
                      <h1 className="text-xl font-bold text-foreground leading-tight tracking-tight">{activeItem.title}</h1>
                    </div>

                    <div className="border border-border rounded-lg p-5 bg-card flex flex-col gap-5 shadow-sm">
                      <div className="grid grid-cols-3 gap-6 divide-x divide-border">
                        <div className="space-y-1 pl-0">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Thời lượng</span>
                          <p className="text-sm font-bold text-foreground">{activeItem.data.durationMinutes || 0} phút</p>
                        </div>
                        <div className="space-y-1 pl-6">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Yêu cầu đạt</span>
                          <p className="text-sm font-bold text-foreground">{activeItem.data.passingPercentage || 0}%</p>
                        </div>
                        <div className="space-y-1 pl-6">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Trạng thái</span>
                          <p className="text-sm font-bold">
                            {highestAttempt ? (
                              highestAttempt.score == null ? (
                                <span className="text-sky-600 dark:text-sky-400 font-bold">Chờ giáo viên chấm</span>
                              ) : highestAttempt.score >= (activeItem.data.passingPercentage || 0) ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Đạt ({highestAttempt.score}%)</span>
                              ) : (
                                <span className="text-red-600 dark:text-red-400 font-bold">Chưa đạt ({highestAttempt.score}%)</span>
                              )
                            ) : (
                              <span className="text-muted-foreground font-medium">Chưa làm</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {activeItem.data.description && (
                        <div className="border-t border-border pt-4">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Mô tả bài kiểm tra</span>
                          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{activeItem.data.description}</p>
                        </div>
                      )}

                      {}
                      {attemptsForTest.length > 0 && (
                        <div className="border-t border-border pt-4 space-y-3">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Lịch sử làm bài thi</span>
                          <div className="space-y-2">
                            {attemptsForTest.map((att, idx) => {
                              const isPending = att.score == null;
                              const isPassed = !isPending && (att.score ?? 0) >= (activeItem.data.passingPercentage || 0);
                              return (
                                <div key={att.attemptId} className="flex justify-between items-center p-3 border border-border bg-muted/20 rounded-md text-xs">
                                  <span className="font-bold text-foreground">Lần nộp {attemptsForTest.length - idx}</span>
                                  <div className="flex items-center gap-3">
                                    <span className="text-muted-foreground font-semibold text-[11px]">
                                      {new Date(att.submittedAt).toLocaleString('vi-VN')}
                                    </span>
                                    <Badge
                                      className={`text-[9px] rounded-sm font-bold border-transparent ${
                                        isPending
                                          ? 'bg-sky-500/15 text-sky-700 dark:text-sky-400 hover:bg-sky-500/20'
                                          : isPassed
                                          ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                      }`}
                                    >
                                      {isPending ? 'Chờ giáo viên chấm tự luận' : `Điểm: ${att.score}% - ${isPassed ? 'Đạt' : 'Chưa đạt'}`}
                                    </Badge>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="border-t border-border pt-5 flex justify-end">
                        <Button
                          onClick={() => navigate(`/student/tests/${activeItem.id}?csId=${classroomSubjectId}`)}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-sm px-6 h-9 flex items-center gap-2 group transition-all border-none outline-none"
                        >
                          <span>
                            {attemptsForTest.length > 0 
                              ? (highestAttempt && (highestAttempt.score ?? 0) >= (activeItem.data.passingPercentage || 0) 
                                ? 'Làm lại bài thi (Cải thiện điểm)' 
                                : 'Làm lại bài thi') 
                              : 'Bắt đầu làm bài thi'}
                          </span>
                          <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {}
                {activeItem.type === 'exercise' && (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-sm text-[8px] font-bold uppercase px-2 py-0.5 border-transparent">Bài thực hành</Badge>
                          <h1 className="text-xl font-bold text-foreground leading-tight tracking-tight">{activeItem.title}</h1>
                        </div>
                        
                        {}
                        {(() => {
                          const submission = exerciseSubmissions[activeItem.id];
                          if (!submission) {
                            return <Badge variant="outline" className="border-border text-muted-foreground rounded-sm font-bold text-[9px] px-2 py-0.5 bg-background">Chưa nộp bài</Badge>;
                          }
                          if (submission.status === 'SUBMITTED') {
                            return <Badge className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm font-bold text-[9px] px-2 py-0.5 border-transparent">Đã nộp - Chờ chấm</Badge>;
                          }
                          if (submission.status === 'GRADED') {
                            return (
                              <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 rounded-sm font-bold text-[9px] px-2 py-0.5 border-transparent">
                                Đã chấm: {submission.grade} / 100
                              </Badge>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>

                    {}
                    {activeItem.data.instructions && (
                      <div className="border border-border bg-muted/20 rounded-lg p-4 space-y-1.5">
                        <h4 className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Yêu cầu & Hướng dẫn làm bài</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{activeItem.data.instructions}</p>
                      </div>
                    )}

                    {}
                    {(() => {
                      const submission = exerciseSubmissions[activeItem.id];
                      const hasSubmitted = submission && (submission.status === 'SUBMITTED' || submission.status === 'GRADED');
                      const showForm = !hasSubmitted || isResubmitting;

                      if (showForm) {
                        return (
                          <div className="border border-border rounded-lg p-5 bg-card space-y-4 shadow-xs">
                            <h3 className="font-bold text-xs text-foreground border-b border-border pb-2">
                              {isResubmitting ? 'Nộp lại bài làm của bạn' : 'Tiến hành nộp bài'}
                            </h3>

                            {}
                            {activeItem.data.allowText && (
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                                  Nội dung trả lời bài tập (Văn bản)
                                </label>
                                <Textarea
                                  placeholder="Nhập nội dung bài làm của bạn tại đây..."
                                  value={submissionText}
                                  onChange={(e) => setSubmissionText(e.target.value)}
                                  className="min-h-[140px] border-border bg-background text-foreground focus-visible:ring-primary focus-visible:border-primary rounded-sm text-xs placeholder:text-muted-foreground shadow-none font-sans"
                                />
                              </div>
                            )}

                            {}
                            {activeItem.data.allowFile && (
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                                  Tệp đính kèm (File)
                                </label>
                                <div
                                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                  onDragLeave={() => setIsDragging(false)}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    setIsDragging(false);
                                    const files = e.dataTransfer.files;
                                    if (files && files.length > 0) {
                                      setSubmissionFile(files[0]);
                                    }
                                  }}
                                  className={`border-2 border-dashed rounded-lg p-6 transition-all flex flex-col items-center justify-center gap-2.5 cursor-pointer ${
                                    isDragging ? 'border-primary bg-muted/30' : 'border-border hover:border-primary/50 bg-muted/10'
                                  }`}
                                  onClick={() => document.getElementById('file-upload-input-el')?.click()}
                                >
                                  <input
                                    type="file"
                                    id="file-upload-input-el"
                                    className="hidden"
                                    onChange={(e) => {
                                      const files = e.target.files;
                                      if (files && files.length > 0) {
                                        setSubmissionFile(files[0]);
                                      }
                                    }}
                                  />
                                  <Cloud className="size-7 text-muted-foreground" />
                                  {submissionFile ? (
                                    <div className="text-center space-y-1">
                                      <span className="text-xs font-bold text-foreground block truncate max-w-xs">{submissionFile.name}</span>
                                      <span className="text-[10px] text-muted-foreground">{(submissionFile.size / 1024 / 1024).toFixed(2)} MB</span>
                                    </div>
                                  ) : (
                                    <div className="text-center">
                                      <span className="text-xs font-bold text-foreground block">Kéo thả file vào đây hoặc nhấn để chọn</span>
                                      <span className="text-[10px] text-muted-foreground">Hỗ trợ các định dạng tài liệu học tập</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {}
                            <div className="flex items-center gap-2.5 pt-2">
                              <Button
                                onClick={handleExerciseSubmit}
                                disabled={submittingExerciseId === activeItem.id || (!submissionText.trim() && !submissionFile)}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-sm px-5 h-9 flex items-center gap-1.5 border-none outline-none"
                              >
                                {submittingExerciseId === activeItem.id ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <Upload className="size-4" />
                                )}
                                <span>Nộp bài làm</span>
                              </Button>
                              
                              {isResubmitting ? (
                                <Button
                                  variant="outline"
                                  onClick={() => setIsResubmitting(false)}
                                  className="border-border text-foreground hover:bg-muted rounded-sm h-9 px-5 font-bold"
                                >
                                  Hủy
                                </Button>
                              ) : (
                                (submissionText || submissionFile) && (
                                  <Button
                                    variant="outline"
                                    onClick={() => { setSubmissionText(''); setSubmissionFile(null); }}
                                    className="border-border text-foreground hover:bg-muted rounded-sm h-9 px-5 font-bold"
                                  >
                                    Làm sạch
                                  </Button>
                                )
                              )}
                            </div>
                          </div>
                        );
                      } else if (submission) {
                        return (
                          <div className="border border-border rounded-lg p-5 bg-card space-y-5">
                            <div className="flex justify-between items-center border-b border-border pb-3">
                              <h3 className="font-bold text-xs text-foreground">Chi tiết bài làm đã nộp</h3>
                            </div>

                            <div className="space-y-4">
                              {submission.content && (
                                <div className="space-y-1.5">
                                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Bài viết đã nộp</span>
                                  <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed border border-border p-3.5 bg-muted/20 rounded-md">
                                    {submission.content}
                                  </p>
                                </div>
                              )}

                              {submission.fileUrl && (
                                <div className="space-y-1.5">
                                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">File đính kèm</span>
                                  <a 
                                    href={resolveAssetUrl(submission.fileUrl)} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 p-2.5 border border-border hover:border-primary/50 rounded-md bg-background text-xs font-bold text-foreground hover:text-primary transition-colors"
                                  >
                                    <Download className="size-4 text-muted-foreground" />
                                    <span>Tải file bài làm đã nộp</span>
                                  </a>
                                </div>
                              )}

                              {submission.status === 'GRADED' && (
                                <div className="border-t border-border pt-5 space-y-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Đánh giá của giáo viên</span>
                                    <Badge className="bg-primary text-primary-foreground hover:bg-primary/95 font-bold text-[9px] px-2 py-0.5 border-transparent">
                                      Điểm số: {submission.grade} / 100
                                    </Badge>
                                  </div>

                                  {submission.feedback && (
                                    <div className="p-4 border-l-4 border-primary bg-muted/40 rounded-r-md space-y-1.5">
                                      <span className="text-[9px] font-bold text-muted-foreground block">
                                        Nhận xét từ {submission.gradedByName || 'Giảng viên'}:
                                      </span>
                                      <p className="text-xs text-foreground italic leading-relaxed whitespace-pre-line">
                                        &ldquo;{submission.feedback}&rdquo;
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {}
                              <div className="border-t border-border pt-4 flex justify-end">
                                <Button
                                  onClick={() => {
                                    setIsResubmitting(true);
                                    setSubmissionText(submission.content || '');
                                    setSubmissionFile(null);
                                  }}
                                  className="border border-border hover:bg-muted text-foreground bg-background font-bold rounded-sm px-4 h-8 text-xs"
                                >
                                  Nộp lại bài làm khác
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
                
                {}
                {renderCompletionFooter()}

                {}
                <div className="border-t border-border pt-8 mt-12">
                  <NodeDiscussion nodeId={activeItem.nodeId} role="student" />
                </div>
              </>
            ) : (
              
              <div className="text-center py-20 border border-dashed border-border rounded-lg bg-card">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 stroke-[1.5]" />
                <h2 className="text-sm font-bold text-foreground">Chọn một mục để học</h2>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Hãy chọn các học liệu (Video, PDF), bài kiểm tra hoặc bài thực hành ở cột bên trái để bắt đầu lộ trình học tập của bạn.
                </p>
              </div>
            )}
          </div>
        </div>

        {}
        {activeItem && allItems.length > 0 && (
          <div className="h-14 border-t border-border bg-card flex items-center justify-between px-8 shrink-0">
            <Button
              onClick={handlePrevItem}
              disabled={currentItemIndex <= 0}
              variant="outline"
              className="border-border text-foreground hover:bg-muted rounded-sm h-8 px-4 font-bold flex items-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="size-4" />
              <span>Mục phía trước</span>
            </Button>

            <div className="text-xs text-muted-foreground font-bold">
              {currentItemIndexInNode + 1} / {currentItemsForNode.length} mục
            </div>

            <Button
              onClick={handleNextItem}
              disabled={currentItemIndex >= allItems.length - 1}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-sm h-8 px-4 flex items-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none border-none outline-none"
            >
              <span>Mục tiếp theo</span>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </div>


    </div>
  );
}
