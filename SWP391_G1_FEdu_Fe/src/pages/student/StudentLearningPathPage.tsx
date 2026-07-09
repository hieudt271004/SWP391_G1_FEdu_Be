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
  Flag
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
import { useAuth } from '../../context/AuthContext';
import {
  studentService,
  type SubmissionResponse,
  type StudentTestAttemptHistoryResponse,
  type PopQuizPendingResponse,
  type PopQuizPaperResponse,
  type AttemptSubmission
} from '../../services/student.service';
import { classroomService } from '../../services/classroom.service';
import { resolveAssetUrl, MaterialPreview } from '../../components/learningPath/MaterialPreview';
import type { ClassroomSubjectResponse } from '../../types/classroomSubject';
import type { LearningNodeResponse, NodeContentResponse } from '../../services/learningPath.service';
import { NodeDiscussion } from '../../components/learningPath/NodeDiscussion';
import { TestRunner } from './tests/components/TestRunner';
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

export function StudentLearningPathPage() {
  const { csId } = useParams<{ csId: string }>();
  const classroomSubjectId = Number(csId);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Data states
  const [subject, setSubject] = useState<ClassroomSubjectResponse | null>(null);
  const [nodes, setNodes] = useState<LearningNodeResponse[]>([]);
  const [nodeContents, setNodeContents] = useState<Record<number, NodeContentResponse>>({});
  const [totalMaterials, setTotalMaterials] = useState<number>(0);
  const [totalCompleted, setTotalCompleted] = useState<number>(0);
  
  // Loading & error states
  const [loading, setLoading] = useState(true);
  const [loadingNodeContent, setLoadingNodeContent] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  // URL search params
  const [searchParams, setSearchParams] = useSearchParams();
  const isLearnMode = searchParams.get('mode') === 'learn';
  const paramItemId = searchParams.get('itemId');
  const paramItemType = searchParams.get('itemType');

  // UI state
  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({});

  // Exercise Submission states
  const [exerciseSubmissions, setExerciseSubmissions] = useState<Record<number, SubmissionResponse | null>>({});
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submittingExerciseId, setSubmittingExerciseId] = useState<number | null>(null);
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Test attempt history states
  const [testHistory, setTestHistory] = useState<StudentTestAttemptHistoryResponse[]>([]);

  // Load completed materials from Backend
  const [completedMaterials, setCompletedMaterials] = useState<Record<string, boolean>>({});

  // Pop Quiz states
  const [activePopQuiz, setActivePopQuiz] = useState<{
    assignmentId: number;
    title: string;
    durationMinutes: number;
    status: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED';
    remainingSeconds?: number;
    score?: number;
  } | null>(null);
  const [popQuizPaper, setPopQuizPaper] = useState<PopQuizPaperResponse | null>(null);
  const [startingPopQuiz, setStartingPopQuiz] = useState(false);
  const [submittingPopQuiz, setSubmittingPopQuiz] = useState(false);
  const [showPopQuizAlert, setShowPopQuizAlert] = useState(false);
  const [showPopQuizRunner, setShowPopQuizRunner] = useState(false);
  const [showPopQuizResult, setShowPopQuizResult] = useState(false);
  const [popQuizSecondsLeft, setPopQuizSecondsLeft] = useState<number>(0);

  const refreshProgressData = async () => {
    if (!user?.userId || !classroomSubjectId) return null;
    const graph = await studentService.getClassroomSubjectGraph(classroomSubjectId);
    const sortedNodes = (graph.nodes || []).sort((a, b) => {
      const sA = a.stageOrder ?? 0;
      const sB = b.stageOrder ?? 0;
      if (sA !== sB) return sA - sB;
      return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
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
    return sortedNodes;
  };

  // Fetch initial graph and subject info
  useEffect(() => {
    if (!user?.userId || !classroomSubjectId) return;

    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch subject details
        const subjectsList = await classroomService.getClassroomSubjectsByStudent(user.userId);
        const currentSub = subjectsList.find(s => s.classroomSubjectId === classroomSubjectId);
        if (currentSub) {
          setSubject(currentSub);
        }

        // Fetch roadmap graph & test history
        const sortedNodes = await refreshProgressData();

        if (sortedNodes) {
          // Auto-expand non-locked nodes and pre-fetch content
          const initialExpanded: Record<number, boolean> = {};
          const openNodeIds: number[] = [];

          sortedNodes.forEach(node => {
            if (node.studentStatus !== 'LOCKED') {
              initialExpanded[node.nodeId] = true;
              openNodeIds.push(node.nodeId);
            }
          });
          setExpandedNodes(initialExpanded);

          // Fetch contents of open nodes in parallel
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

  // Polling for pending pop quiz on active/unlocked ON_CLASS nodes
  useEffect(() => {
    if (!user?.userId || !classroomSubjectId || nodes.length === 0) return;
    
    // Find ON_CLASS nodes that are not locked
    const onClassNodes = nodes.filter(n => n.nodeType === 'ON_CLASS' && n.studentStatus !== 'LOCKED');
    if (onClassNodes.length === 0) return;
    
    // Poll the first unlocked ON_CLASS node
    const targetNodeId = onClassNodes[0].nodeId;

    const poll = async () => {
      try {
        const res = await studentService.getPendingPopQuiz(targetNodeId);
        if (res) {
          setActivePopQuiz(res);
          if (res.status === 'PENDING') {
            setShowPopQuizAlert(true);
          } else if (res.status === 'IN_PROGRESS') {
            setShowPopQuizAlert(false);
            if (!popQuizPaper) {
              const paper = await studentService.getPopQuizPaper(res.assignmentId);
              setPopQuizPaper(paper);
              setPopQuizSecondsLeft(paper.remainingSeconds);
              setShowPopQuizRunner(true);
            }
          } else if (res.status === 'SUBMITTED' || res.status === 'EXPIRED') {
            if (showPopQuizRunner) {
              setShowPopQuizRunner(false);
              setShowPopQuizResult(true);
            }
          }
        } else {
          setActivePopQuiz(null);
          setPopQuizPaper(null);
          setShowPopQuizAlert(false);
          setShowPopQuizRunner(false);
        }
      } catch (err) {
        console.error("Error polling pop quiz:", err);
      }
    };

    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [user?.userId, classroomSubjectId, nodes, popQuizPaper, showPopQuizRunner]);

  // Countdown timer for Pop Quiz
  useEffect(() => {
    if (!showPopQuizRunner || popQuizSecondsLeft <= 0) return;
    const interval = setInterval(() => {
      setPopQuizSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmitPopQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showPopQuizRunner, popQuizSecondsLeft]);

  const handleStartPopQuiz = async () => {
    if (!activePopQuiz) return;
    setStartingPopQuiz(true);
    try {
      const paper = await studentService.startPopQuizAttempt(activePopQuiz.assignmentId);
      setPopQuizPaper(paper);
      setPopQuizSecondsLeft(paper.remainingSeconds);
      setShowPopQuizAlert(false);
      setShowPopQuizRunner(true);
      toast.success("Bắt đầu làm bài kiểm tra nhanh!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể bắt đầu làm bài");
    } finally {
      setStartingPopQuiz(false);
    }
  };

  const handleSubmitPopQuiz = async (body: AttemptSubmission) => {
    if (!activePopQuiz) return;
    setSubmittingPopQuiz(true);
    try {
      const res = await studentService.submitPopQuizAttempt(activePopQuiz.assignmentId, body);
      setActivePopQuiz((prev) => prev ? { ...prev, status: 'SUBMITTED', score: res.score } : null);
      setShowPopQuizRunner(false);
      setShowPopQuizResult(true);
      toast.success("Nộp bài thành công!");
      await refreshProgressData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Nộp bài thất bại");
    } finally {
      setSubmittingPopQuiz(false);
    }
  };

  const handleAutoSubmitPopQuiz = async () => {
    if (!activePopQuiz) return;
    setSubmittingPopQuiz(true);
    try {
      toast.warning("Hết giờ làm bài! Hệ thống đang nộp bài...", { duration: 5000 });
      const res = await studentService.submitPopQuizAttempt(activePopQuiz.assignmentId, { submissions: [] });
      setActivePopQuiz((prev) => prev ? { ...prev, status: 'EXPIRED', score: res.score } : null);
      setShowPopQuizRunner(false);
      setShowPopQuizResult(true);
      await refreshProgressData();
    } catch (err) {
      setActivePopQuiz((prev) => prev ? { ...prev, status: 'EXPIRED', score: 0 } : null);
      setShowPopQuizRunner(false);
      setShowPopQuizResult(true);
    } finally {
      setSubmittingPopQuiz(false);
    }
  };

  const handlePopQuizTabOut = async () => {
    if (!popQuizPaper) return;
    try {
      const count = await studentService.recordTabOut(0, popQuizPaper.attemptId);
      toast.warning(`Bạn vừa rời khỏi tab khi đang làm bài (lần ${count}). Hành vi này được ghi nhận.`, {
        duration: 8000,
      });
    } catch {
      // Ignore record errors
    }
  };

  // Helper: Fetch node content if not cached
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

  // Toggle node expand/collapse
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

  // Flattened accessible items across all nodes for navigation
  const allItems = useMemo(() => {
    const list: LearningPathItem[] = [];
    nodes.forEach(node => {
      if (node.studentStatus === 'LOCKED') return;
      const content = nodeContents[node.nodeId];
      if (!content) return;

      // Materials
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

      // Tests
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

      // Exercises
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

  // Derive activeItem from searchParams
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

  // Set default active item on load ONLY if in learn mode but no item is chosen
  useEffect(() => {
    if (isLearnMode && allItems.length > 0 && !activeItem) {
      const firstIncomplete = allItems.find(item => {
        const node = nodes.find(n => n.nodeId === item.nodeId);
        return node && node.studentStatus !== 'COMPLETED';
      }) || allItems[0];
      
      setActiveItem(firstIncomplete);
    }
  }, [isLearnMode, allItems, activeItem]);

  // Handle active item changes (fetch submission data if it's an exercise)
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

  // Exercise submission action
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

      await studentService.submitExercise(exerciseId, formData);
      toast.success("Nộp bài tập thực hành thành công!");
      await fetchExerciseSubmission(exerciseId);
      await refreshProgressData();
      setIsResubmitting(false);
      setSubmissionText('');
      setSubmissionFile(null);
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
    return attemptsForTest.reduce((max, curr) => curr.score > max.score ? curr : max, attemptsForTest[0]);
  }, [attemptsForTest]);

  // Navigations (Prev & Next)
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

  // Calculate general progress
  const progressStats = useMemo(() => {
    if (totalMaterials === 0) return { completed: 0, total: 0, percent: 0 };
    return {
      completed: totalCompleted,
      total: totalMaterials,
      percent: Math.round((totalCompleted / totalMaterials) * 100)
    };
  }, [totalMaterials, totalCompleted]);

  // Complete active node logic
  const activeNode = useMemo(() => {
    if (!activeItem) return null;
    return nodes.find(n => n.nodeId === activeItem.nodeId) || null;
  }, [activeItem, nodes]);

  const isNodeCompleted = activeNode?.studentStatus === 'COMPLETED';

  // Check if active item is individually completed
  const isItemCompleted = useMemo(() => {
    if (!activeItem || !activeNode) return false;
    if (activeNode.studentStatus === 'COMPLETED') return true;
    if (activeItem.type === 'material') {
      return !!completedMaterials[`${user?.userId}-${activeItem.id}`];
    }
    if (activeItem.type === 'test') {
      const history = testHistory.filter(h => h.testId === activeItem.id);
      return history.some(h => h.score >= activeItem.data.passingPercentage);
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
      
      // 1. Mark this specific material completed on Backend
      await studentService.completeMaterial(activeItem.id);
      
      const key = `${user.userId}-${activeItem.id}`;
      const updatedMaterials = { ...completedMaterials, [key]: true };
      setCompletedMaterials(updatedMaterials);
      
      toast.success("Đã đánh dấu hoàn thành bài học!");
      await refreshProgressData();

      // 2. Check if all items in this node are completed
      const content = nodeContents[activeNode.nodeId];
      if (content) {
        const materials = content.materials || [];
        const tests = content.tests || [];
        const exercises = content.exercises || [];

        const allMaterialsDone = materials.every(m => {
          if (m.materialId === activeItem.id) return true;
          return !!updatedMaterials[`${user.userId}-${m.materialId}`];
        });

        const allTestsDone = tests.every(t => {
          const history = testHistory.filter(h => h.testId === t.testId);
          return history.some(h => h.score >= (t.passingPercentage ?? 0));
        });

        const allExercisesDone = exercises.every(e => {
          const sub = exerciseSubmissions[e.exerciseId];
          return sub?.status === 'SUBMITTED' || sub?.status === 'GRADED';
        });

        if (allMaterialsDone && allTestsDone && allExercisesDone) {
          // Complete node on backend
          await studentService.completeNode(activeNode.nodeId);
          toast.success("Chúc mừng! Bạn đã hoàn thành tất cả các bài học trong chương này.");
          await refreshProgressData();
        }
      }

      // 3. Proactively go to next item
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
      <div className="border-t border-zinc-200 pt-8 mt-12 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {isItemCompleted ? (
              <div className="flex items-center gap-2 text-emerald-600 font-extrabold text-sm">
                <CheckCircle2 className="size-5 text-emerald-600 fill-emerald-50" />
                <span>Completed</span>
              </div>
            ) : activeItem.type === 'material' ? (
              <Button
                onClick={handleCompleteActiveItem}
                disabled={completingNodeId === activeNode.nodeId}
                className="bg-black hover:bg-zinc-800 text-white font-extrabold rounded-xl px-5 h-10 flex items-center gap-1.5 shadow-xs"
              >
                {completingNodeId === activeNode.nodeId ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                <span>Mark as completed</span>
              </Button>
            ) : (
              <span className="text-xs text-zinc-550 font-bold italic bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-lg">
                Vui lòng nộp & đạt bài kiểm tra/bài tập để hoàn thành bài học này
              </span>
            )}

            {isItemCompleted && hasNextItem && (
              <Button
                onClick={handleNextItem}
                className="bg-black hover:bg-zinc-800 text-white font-extrabold rounded-xl px-5 h-10"
              >
                Go to next item
              </Button>
            )}
          </div>

          {/* Right side next item button removed as requested */}
        </div>

        <div className="flex items-center gap-6 text-zinc-500 text-xs font-semibold pt-2">
          <button className="flex items-center gap-1.5 hover:text-black transition-colors">
            <ThumbsUp className="size-4" />
            <span>Like</span>
          </button>
          <button className="flex items-center gap-1.5 hover:text-black transition-colors">
            <ThumbsDown className="size-4" />
            <span>Dislike</span>
          </button>
          <button className="flex items-center gap-1.5 hover:text-black transition-colors">
            <Flag className="size-4" />
            <span>Report an issue</span>
          </button>
        </div>
      </div>
    );
  };

  // Loading indicator
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-black" />
        <span className="text-sm text-zinc-500 font-medium">Đang tải lộ trình học tập của bạn...</span>
      </div>
    );
  }

  // Error layout
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 max-w-md mx-auto text-center">
        <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center">
          <X className="w-8 h-8 text-black" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-zinc-900">Không thể tải lộ trình</h3>
          <p className="text-sm text-zinc-500 mt-2">{error}</p>
        </div>
        <Button onClick={() => navigate('/student/courses')} className="bg-black hover:bg-zinc-800 text-white font-bold rounded-xl px-6">
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
    <div className="flex h-screen w-screen bg-white overflow-hidden select-none font-sans">
      {/* LEFT SIDEBAR: Roadmap Timeline */}
      <div className="w-80 border-r border-slate-200 flex flex-col h-full bg-slate-50 shrink-0">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200 bg-white">
          <button 
            onClick={() => setSearchParams({})}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-bold transition-colors mb-3 outline-none"
          >
            <ArrowLeft className="size-3.5" />
            <span>Quay lại khóa học</span>
          </button>
          
          <h2 className="font-bold text-slate-950 text-sm leading-snug truncate" title={subject?.displayName || subject?.subjectName}>
            {subject?.displayName || subject?.subjectName}
          </h2>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">
            Lớp: {subject?.className} • Mã môn: {subject?.subjectCode}
          </p>

          {/* Progress bar */}
          <div className="mt-4 space-y-1.5">
            <Progress value={progressStats.percent} className="h-1.5 bg-slate-100 [&>div]:bg-slate-950 rounded-full" />
            <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-0.5">
              <span>Đã hoàn thành {progressStats.completed}/{progressStats.total} học liệu</span>
              <span className="text-slate-900">{progressStats.percent}%</span>
            </div>
          </div>
        </div>

        {/* Sidebar List (Scrollable) */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-3 space-y-2">
            {nodes.map((node, index) => {
              const isCompleted = node.studentStatus === 'COMPLETED';
              const isOpen = node.studentStatus === 'OPEN' || node.studentStatus === 'IN_PROGRESS';
              const isLocked = node.studentStatus === 'LOCKED';
              const isExpanded = !!expandedNodes[node.nodeId];
              const content = nodeContents[node.nodeId];

              return (
                <div key={node.nodeId} className="border border-slate-200/80 rounded-lg overflow-hidden bg-white shadow-xs">
                  {/* Node Title Header */}
                  <div 
                    onClick={() => handleToggleNode(node)}
                    className={`p-3 flex justify-between items-start cursor-pointer hover:bg-slate-50/50 transition-colors select-none ${
                      isLocked ? 'opacity-50 cursor-not-allowed bg-slate-50/20' : ''
                    }`}
                  >
                    <div className="flex-1 space-y-1 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-sm border uppercase ${
                          node.nodeType === 'AT_HOME' 
                            ? 'bg-slate-105 border-slate-200 text-slate-700' 
                            : 'bg-slate-955 border-slate-950 text-white'
                        }`}>
                          {node.nodeType === 'AT_HOME' ? 'Tự học' : 'Lên lớp'}
                        </span>
                        
                        {isCompleted && (
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-sm bg-emerald-50 border border-emerald-200 text-emerald-700 uppercase">
                            Đã xong
                          </span>
                        )}
                        {isOpen && (
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-sm bg-slate-950 border border-slate-950 text-white uppercase animate-pulse">
                            Đang học
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-slate-800 text-[11px] leading-snug pt-0.5">
                        {index + 1}. {node.title}
                      </h4>
                    </div>

                    <div className="pt-0.5 text-slate-400 shrink-0">
                      {isLocked ? (
                        <Lock className="size-3.5 text-slate-400" />
                      ) : isExpanded ? (
                        <ChevronDown className="size-3.5 text-slate-800" />
                      ) : (
                        <ChevronRight className="size-3.5 text-slate-500" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Items */}
                  {isExpanded && !isLocked && (
                    <div className="border-t border-slate-100 bg-slate-50/30 divide-y divide-slate-100">
                      {loadingNodeContent[node.nodeId] ? (
                        <div className="flex items-center justify-center py-4 gap-2 text-slate-500">
                          <Loader2 className="size-3.5 animate-spin text-slate-800" />
                          <span className="text-[10px] font-semibold">Đang tải...</span>
                        </div>
                      ) : (
                        <>
                          {/* Materials */}
                          {content?.materials?.map(m => {
                            const isItemActive = activeItem?.type === 'material' && activeItem?.id === m.materialId;
                            return (
                              <button
                                key={m.materialId}
                                onClick={() => setActiveItem({ id: m.materialId, type: 'material', title: m.title, nodeId: node.nodeId, data: m })}
                                className={`w-full text-left p-2.5 pl-6 text-[11px] flex items-center justify-between transition-colors outline-none ${
                                  isItemActive 
                                    ? 'bg-slate-950 text-white font-bold' 
                                    : 'text-slate-650 hover:bg-slate-100/70 font-semibold'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0 pr-2">
                                  {m.video?.videoUrl ? (
                                    <Play className={`size-3.5 shrink-0 ${isItemActive ? 'text-white' : 'text-slate-550'}`} />
                                  ) : (
                                    <FileText className={`size-3.5 shrink-0 ${isItemActive ? 'text-white' : 'text-slate-555'}`} />
                                  )}
                                  <span className="truncate">{m.title}</span>
                                </div>
                                {(isCompleted || completedMaterials[`${user?.userId}-${m.materialId}`]) && (
                                  <CheckCircle2 className={`size-3.5 shrink-0 ${isItemActive ? 'text-white' : 'text-emerald-600'}`} />
                                )}
                              </button>
                            );
                          })}

                          {/* Tests */}
                          {content?.tests?.map(t => {
                            const isItemActive = activeItem?.type === 'test' && activeItem?.id === t.testId;
                            return (
                              <button
                                key={t.testId}
                                onClick={() => setActiveItem({ id: t.testId, type: 'test', title: t.title, nodeId: node.nodeId, data: t })}
                                className={`w-full text-left p-2.5 pl-6 text-[11px] flex items-center justify-between transition-colors outline-none ${
                                  isItemActive 
                                    ? 'bg-slate-950 text-white font-bold' 
                                    : 'text-slate-650 hover:bg-slate-100/70 font-semibold'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0 pr-2">
                                  <Award className={`size-3.5 shrink-0 ${isItemActive ? 'text-white' : 'text-slate-555'}`} />
                                  <span className="truncate">{t.title}</span>
                                </div>
                                {(isCompleted || testHistory.filter(h => h.testId === t.testId).some(h => h.score >= (t.passingPercentage ?? 0))) && (
                                  <CheckCircle2 className={`size-3.5 shrink-0 ${isItemActive ? 'text-white' : 'text-emerald-600'}`} />
                                )}
                              </button>
                            );
                          })}

                          {/* Exercises */}
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
                                    ? 'bg-slate-950 text-white font-bold' 
                                    : 'text-slate-650 hover:bg-slate-100/70 font-semibold'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0 pr-2">
                                  <BookMarked className={`size-3.5 shrink-0 ${isItemActive ? 'text-white' : 'text-slate-555'}`} />
                                  <span className="truncate">{e.title}</span>
                                </div>
                                {isSubmitted ? (
                                  <CheckCircle2 className={`size-3.5 shrink-0 ${isItemActive ? 'text-white' : 'text-emerald-600'}`} />
                                ) : isCompleted ? (
                                  <CheckCircle2 className={`size-3.5 shrink-0 ${isItemActive ? 'text-white' : 'text-emerald-600'}`} />
                                ) : null}
                              </button>
                            );
                          })}

                          {(!content?.materials?.length && !content?.tests?.length && !content?.exercises?.length) && (
                            <div className="p-3 text-center text-[10px] text-slate-500 italic">
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
      </div>

      {/* RIGHT MAIN PANEL: Content Viewer */}
      <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
        {/* Top Header */}
        <div className="h-12 border-b border-slate-200 flex items-center justify-between px-6 bg-white shrink-0">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <span>Lộ trình học tập</span>
            <span>/</span>
            {activeItem ? (
              <>
                <span className="text-slate-800">
                  {activeItem.type === 'material' ? 'Học liệu' : activeItem.type === 'test' ? 'Bài kiểm tra' : 'Bài thực hành'}
                </span>
                <span>/</span>
                <span className="truncate max-w-[250px] text-slate-950">{activeItem.title}</span>
              </>
            ) : (
              <span className="text-slate-950">Tổng quan bài học</span>
            )}
          </div>
          
          <button 
            onClick={() => setSearchParams({})}
            className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-950 transition-colors border-none bg-transparent cursor-pointer outline-none"
            title="Đóng lộ trình"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/20">
          <div className="max-w-3xl mx-auto space-y-6 pb-20">
            {activeItem ? (
              <>
                {/* 1. MATERIAL VIEWER */}
                {activeItem.type === 'material' && (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Badge className="bg-slate-950 hover:bg-slate-900 text-white rounded-sm text-[8px] font-bold uppercase px-2 py-0.5 border-transparent">Học liệu</Badge>
                        {activeItem.data.required && (
                          <Badge variant="outline" className="border-slate-200 text-slate-600 rounded-sm text-[8px] font-bold uppercase px-2 py-0.5 bg-white">Bắt buộc</Badge>
                        )}
                      </div>
                      <h1 className="text-xl font-bold text-slate-900 leading-tight tracking-tight">{activeItem.title}</h1>
                      {activeItem.data.video?.durationSeconds ? (
                        <p className="text-[10px] text-slate-500 font-bold uppercase">
                          Thời lượng: {Math.round(activeItem.data.video.durationSeconds / 60)} phút
                        </p>
                      ) : null}
                    </div>

                    {/* Preview Area */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white p-1.5 shadow-sm">
                      <MaterialPreview material={activeItem.data} />
                    </div>

                    {/* Description */}
                    {activeItem.data.video?.description && (
                      <div className="space-y-1.5 border-t border-slate-150 pt-4">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mô tả chi tiết</h4>
                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{activeItem.data.video.description}</p>
                      </div>
                    )}
                    {activeItem.data.file?.description && (
                      <div className="space-y-1.5 border-t border-slate-150 pt-4">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mô tả chi tiết</h4>
                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{activeItem.data.file.description}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. TEST VIEWER */}
                {activeItem.type === 'test' && (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Badge className="bg-slate-950 hover:bg-slate-900 text-white rounded-sm text-[8px] font-bold uppercase px-2 py-0.5 border-transparent">Bài kiểm tra đánh giá</Badge>
                      <h1 className="text-xl font-bold text-slate-900 leading-tight tracking-tight">{activeItem.title}</h1>
                    </div>

                    <div className="border border-slate-200 rounded-lg p-5 bg-white flex flex-col gap-5 shadow-sm">
                      <div className="grid grid-cols-3 gap-6 divide-x divide-slate-100">
                        <div className="space-y-1 pl-0">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Thời lượng</span>
                          <p className="text-sm font-bold text-slate-800">{activeItem.data.durationMinutes || 0} phút</p>
                        </div>
                        <div className="space-y-1 pl-6">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Yêu cầu đạt</span>
                          <p className="text-sm font-bold text-slate-800">{activeItem.data.passingPercentage || 0}%</p>
                        </div>
                        <div className="space-y-1 pl-6">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Trạng thái</span>
                          <p className="text-sm font-bold">
                            {highestAttempt ? (
                              highestAttempt.score >= (activeItem.data.passingPercentage || 0) ? (
                                <span className="text-emerald-600 font-bold">Đạt ({highestAttempt.score}%)</span>
                              ) : (
                                <span className="text-red-600 font-bold">Chưa đạt ({highestAttempt.score}%)</span>
                              )
                            ) : (
                              <span className="text-slate-500 font-medium">Chưa làm</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {activeItem.data.description && (
                        <div className="border-t border-slate-200 pt-4">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Mô tả bài kiểm tra</span>
                          <p className="text-xs text-slate-650 leading-relaxed whitespace-pre-line">{activeItem.data.description}</p>
                        </div>
                      )}

                      {/* Display past attempt history */}
                      {attemptsForTest.length > 0 && (
                        <div className="border-t border-slate-200 pt-4 space-y-3">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Lịch sử làm bài thi</span>
                          <div className="space-y-2">
                            {attemptsForTest.map((att, idx) => {
                              const isPassed = att.score >= (activeItem.data.passingPercentage || 0);
                              return (
                                <div key={att.attemptId} className="flex justify-between items-center p-3 border border-slate-200 bg-slate-50/50 rounded-md text-xs">
                                  <span className="font-bold text-slate-700">Lần nộp {attemptsForTest.length - idx}</span>
                                  <div className="flex items-center gap-3">
                                    <span className="text-slate-500 font-semibold text-[11px]">
                                      {new Date(att.submittedAt).toLocaleString('vi-VN')}
                                    </span>
                                    <Badge 
                                      className={`text-[9px] rounded-sm font-bold border-transparent ${
                                        isPassed 
                                          ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                                          : 'bg-slate-200 text-slate-700 hover:bg-slate-350'
                                      }`}
                                    >
                                      Điểm: {att.score}% - {isPassed ? 'Đạt' : 'Chưa đạt'}
                                    </Badge>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="border-t border-slate-200 pt-5 flex justify-end">
                        <Button
                          onClick={() => navigate(`/student/tests/${activeItem.id}?csId=${classroomSubjectId}`)}
                          className="bg-slate-950 hover:bg-slate-900 text-white font-bold rounded-sm px-6 h-9 flex items-center gap-2 group transition-all border-none outline-none"
                        >
                          <span>
                            {attemptsForTest.length > 0 
                              ? (highestAttempt && highestAttempt.score >= (activeItem.data.passingPercentage || 0) 
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

                {/* 3. EXERCISE VIEWER & SUBMISSION */}
                {activeItem.type === 'exercise' && (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <Badge className="bg-slate-950 hover:bg-slate-900 text-white rounded-sm text-[8px] font-bold uppercase px-2 py-0.5 border-transparent">Bài thực hành</Badge>
                          <h1 className="text-xl font-bold text-slate-900 leading-tight tracking-tight">{activeItem.title}</h1>
                        </div>
                        
                        {/* Submission status badge */}
                        {(() => {
                          const submission = exerciseSubmissions[activeItem.id];
                          if (!submission) {
                            return <Badge variant="outline" className="border-slate-250 text-slate-500 rounded-sm font-bold text-[9px] px-2 py-0.5 bg-white">Chưa nộp bài</Badge>;
                          }
                          if (submission.status === 'SUBMITTED') {
                            return <Badge className="bg-slate-950 text-white hover:bg-slate-900 rounded-sm font-bold text-[9px] px-2 py-0.5 border-transparent">Đã nộp - Chờ chấm</Badge>;
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

                    {/* Instructions */}
                    {activeItem.data.instructions && (
                      <div className="border border-slate-200 bg-slate-50/50 rounded-lg p-4 space-y-1.5">
                        <h4 className="text-[9px] font-bold text-slate-550 uppercase tracking-wider">Yêu cầu & Hướng dẫn làm bài</h4>
                        <p className="text-xs text-slate-650 leading-relaxed whitespace-pre-line">{activeItem.data.instructions}</p>
                      </div>
                    )}

                    {/* Submission content view / form */}
                    {(() => {
                      const submission = exerciseSubmissions[activeItem.id];
                      const hasSubmitted = submission && (submission.status === 'SUBMITTED' || submission.status === 'GRADED');
                      const showForm = !hasSubmitted || isResubmitting;

                      if (showForm) {
                        return (
                          <div className="border border-slate-200 rounded-lg p-5 bg-white space-y-4 shadow-xs">
                            <h3 className="font-bold text-xs text-slate-800 border-b border-slate-100 pb-2">
                              {isResubmitting ? 'Nộp lại bài làm của bạn' : 'Tiến hành nộp bài'}
                            </h3>

                            {/* Text Submission Form */}
                            {activeItem.data.allowText && (
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                                  Nội dung trả lời bài tập (Văn bản)
                                </label>
                                <Textarea
                                  placeholder="Nhập nội dung bài làm của bạn tại đây..."
                                  value={submissionText}
                                  onChange={(e) => setSubmissionText(e.target.value)}
                                  className="min-h-[140px] border-slate-200 focus-visible:ring-slate-950 focus-visible:border-slate-950 rounded-sm text-xs placeholder:text-slate-400 shadow-none font-sans"
                                />
                              </div>
                            )}

                            {/* File Upload Form */}
                            {activeItem.data.allowFile && (
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
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
                                    isDragging ? 'border-slate-950 bg-slate-50' : 'border-slate-200 hover:border-slate-350 bg-slate-50/50'
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
                                  <Cloud className="size-7 text-slate-400" />
                                  {submissionFile ? (
                                    <div className="text-center space-y-1">
                                      <span className="text-xs font-bold text-slate-800 block truncate max-w-xs">{submissionFile.name}</span>
                                      <span className="text-[10px] text-slate-400">{(submissionFile.size / 1024 / 1024).toFixed(2)} MB</span>
                                    </div>
                                  ) : (
                                    <div className="text-center">
                                      <span className="text-xs font-bold text-slate-700 block">Kéo thả file vào đây hoặc nhấn để chọn</span>
                                      <span className="text-[10px] text-slate-400">Hỗ trợ các định dạng tài liệu học tập</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Form Action buttons */}
                            <div className="flex items-center gap-2.5 pt-2">
                              <Button
                                onClick={handleExerciseSubmit}
                                disabled={submittingExerciseId === activeItem.id || (!submissionText.trim() && !submissionFile)}
                                className="bg-slate-950 hover:bg-slate-900 text-white font-bold rounded-sm px-5 h-9 flex items-center gap-1.5 border-none outline-none"
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
                                  className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-sm h-9 px-5 font-bold"
                                >
                                  Hủy
                                </Button>
                              ) : (
                                (submissionText || submissionFile) && (
                                  <Button
                                    variant="outline"
                                    onClick={() => { setSubmissionText(''); setSubmissionFile(null); }}
                                    className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-sm h-9 px-5 font-bold"
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
                          <div className="border border-slate-200 rounded-lg p-5 bg-white space-y-5">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                              <h3 className="font-bold text-xs text-slate-800">Chi tiết bài làm đã nộp</h3>
                            </div>

                            <div className="space-y-4">
                              {submission.content && (
                                <div className="space-y-1.5">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Bài viết đã nộp</span>
                                  <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed border border-slate-150 p-3.5 bg-slate-50/50 rounded-md">
                                    {submission.content}
                                  </p>
                                </div>
                              )}

                              {submission.fileUrl && (
                                <div className="space-y-1.5">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">File đính kèm</span>
                                  <a 
                                    href={resolveAssetUrl(submission.fileUrl)} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 p-2.5 border border-slate-200 hover:border-slate-350 rounded-md bg-white text-xs font-bold text-slate-800 hover:text-slate-950 transition-colors"
                                  >
                                    <Download className="size-4 text-slate-500" />
                                    <span>Tải file bài làm đã nộp</span>
                                  </a>
                                </div>
                              )}

                              {submission.status === 'GRADED' && (
                                <div className="border-t border-slate-200 pt-5 space-y-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Đánh giá của giáo viên</span>
                                    <Badge className="bg-slate-950 text-white hover:bg-slate-900 font-bold text-[9px] px-2 py-0.5 border-transparent">
                                      Điểm số: {submission.grade} / 100
                                    </Badge>
                                  </div>

                                  {submission.feedback && (
                                    <div className="p-4 border-l-4 border-slate-950 bg-slate-50 rounded-r-md space-y-1.5">
                                      <span className="text-[9px] font-bold text-slate-500 block">
                                        Nhận xét từ {submission.gradedByName || 'Giảng viên'}:
                                      </span>
                                      <p className="text-xs text-slate-700 italic leading-relaxed whitespace-pre-line">
                                        &ldquo;{submission.feedback}&rdquo;
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Resubmit button if not graded or if allowed */}
                              <div className="border-t border-slate-200 pt-4 flex justify-end">
                                <Button
                                  onClick={() => {
                                    setIsResubmitting(true);
                                    setSubmissionText(submission.content || '');
                                    setSubmissionFile(null);
                                  }}
                                  className="border border-slate-200 hover:bg-slate-50 text-slate-800 bg-white font-bold rounded-sm px-4 h-8 text-xs"
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
                
                {/* Completion Footer (Coursera style) */}
                {renderCompletionFooter()}

                {/* Hỏi đáp & Thảo luận */}
                <div className="border-t border-slate-200 pt-8 mt-12">
                  <NodeDiscussion nodeId={activeItem.nodeId} role="student" />
                </div>
              </>
            ) : (
              // 4. ROADMAP OVERVIEW (IF NO ACTIVE ITEM SELECTED)
              <div className="text-center py-20 border border-dashed border-slate-200 rounded-lg bg-white">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3 stroke-[1.5]" />
                <h2 className="text-sm font-bold text-slate-800">Chọn một mục để học</h2>
                <p className="text-xs text-slate-550 mt-1 max-w-sm mx-auto">
                  Hãy chọn các học liệu (Video, PDF), bài kiểm tra hoặc bài thực hành ở cột bên trái để bắt đầu lộ trình học tập của bạn.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM NAVIGATION PANEL: Prev / Next buttons */}
        {activeItem && allItems.length > 0 && (
          <div className="h-14 border-t border-slate-200 bg-white flex items-center justify-between px-8 shrink-0">
            <Button
              onClick={handlePrevItem}
              disabled={currentItemIndex <= 0}
              variant="outline"
              className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-sm h-8 px-4 font-bold flex items-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="size-4" />
              <span>Mục phía trước</span>
            </Button>

            <div className="text-xs text-slate-500 font-bold">
              {currentItemIndexInNode + 1} / {currentItemsForNode.length} mục
            </div>

            <Button
              onClick={handleNextItem}
              disabled={currentItemIndex >= allItems.length - 1}
              className="bg-slate-950 hover:bg-slate-900 text-white font-bold rounded-sm h-8 px-4 flex items-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none border-none outline-none"
            >
              <span>Mục tiếp theo</span>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Pop Quiz Alert Dialog */}
      <Dialog open={showPopQuizAlert} onOpenChange={setShowPopQuizAlert}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <span className="animate-pulse">🔔</span>
              <span>Bài kiểm tra nhanh (Pop Quiz)!</span>
            </DialogTitle>
            <DialogDescription>
              Giảng viên vừa giao bài kiểm tra nhanh cho bạn:
              <strong className="block text-foreground text-base mt-2 font-bold">{activePopQuiz?.title}</strong>
              Thời gian làm bài: {activePopQuiz?.durationMinutes} phút.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end mt-4">
            <Button
              onClick={handleStartPopQuiz}
              disabled={startingPopQuiz}
              className="bg-slate-950 hover:bg-slate-900 text-white font-bold rounded-xl"
            >
              {startingPopQuiz ? "Đang kết nối..." : "Bắt đầu làm bài"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pop Quiz Runner Dialog */}
      <Dialog open={showPopQuizRunner} onOpenChange={() => {}}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-3 mb-4">
            <div className="flex justify-between items-center pr-6">
              <DialogTitle className="text-lg font-bold">Pop Quiz: {popQuizPaper?.title}</DialogTitle>
              <div className="flex items-center gap-2 bg-amber-55 border border-amber-200 px-3 py-1.5 rounded-lg text-amber-700 font-extrabold text-sm animate-pulse">
                <span>⏱️ Còn lại:</span>
                <span>
                  {Math.floor(popQuizSecondsLeft / 60)}m {popQuizSecondsLeft % 60}s
                </span>
              </div>
            </div>
          </DialogHeader>
          {popQuizPaper && (
            <div className="py-2">
              <TestRunner
                details={{
                  testId: popQuizPaper.assignmentId,
                  title: popQuizPaper.title,
                  durationMinutes: popQuizPaper.durationMinutes,
                  questions: popQuizPaper.questions.map((q) => ({
                    questionId: q.questionId,
                    questionContent: q.questionContent,
                    questionType: q.questionType as any,
                    score: q.score,
                    answers: q.answers,
                  })),
                }}
                started={true}
                submitting={submittingPopQuiz}
                onStart={() => {}}
                onSubmit={handleSubmitPopQuiz}
                onTabOut={handlePopQuizTabOut}
                submitLabel="Nộp bài Pop Quiz"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pop Quiz Result Dialog */}
      <Dialog open={showPopQuizResult} onOpenChange={setShowPopQuizResult}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">Kết quả Pop Quiz</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6 space-y-4">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-4xl border border-emerald-200 font-bold">
              {activePopQuiz?.score != null ? `${activePopQuiz.score}%` : '---'}
            </div>
            <p className="text-sm text-zinc-500 font-medium text-center">
              {activePopQuiz?.status === 'EXPIRED' 
                ? 'Bài làm của bạn đã quá hạn nộp. Hệ thống ghi nhận 0 điểm.' 
                : 'Bài kiểm tra nhanh của bạn đã được ghi nhận thành công.'}
            </p>
          </div>
          <DialogFooter className="sm:justify-center mt-2">
            <Button
              onClick={() => {
                setShowPopQuizResult(false);
                setActivePopQuiz(null);
                setPopQuizPaper(null);
              }}
              className="bg-slate-950 hover:bg-slate-900 text-white font-bold rounded-xl px-6"
            >
              Đồng ý
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
