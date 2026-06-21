import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Circle, 
  Settings, 
  Loader, 
  ChevronRight, 
  HelpCircle,
  AlertTriangle,
  Play,
  Trash2,
  Undo2,
  BookOpen,
  GraduationCap,
  FileText,
  Film,
  Award,
  Map,
  Plus,
  X,
  Users,
  GitFork
} from 'lucide-react';
import { teacherService } from '../../../services/teacher.service';
import { classroomService } from '../../../services/classroom.service';
import { 
  learningPathService, 
  LearningNodeResponse, 
  ClassroomGraphResponse,
  NodeContentResponse
} from '../../../services/learningPath.service';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Checkbox } from '../../../components/ui/checkbox';

interface Student {
  id: string;
  fullName: string;
  progress: number;
}

export function ClassOverviewPage() {
  const navigate = useNavigate();
  const { classroomSubjectId } = useParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [classInfo, setClassInfo] = useState({ 
    classCode: '', 
    courseCode: '',
    semester: '',
    description: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [classroomStatus, setClassroomStatus] = useState<string>('inactive');
  const [parentClassroomId, setParentClassroomId] = useState<number | null>(null);

  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({});
  const [nodeContents, setNodeContents] = useState<Record<number, NodeContentResponse>>({});
  const [loadingContents, setLoadingContents] = useState<Record<number, boolean>>({});
  
  // New classroom publish flow states
  const [graphData, setGraphData] = useState<ClassroomGraphResponse | null>(null);
  const [actionState, setActionState] = useState<'idle' | 'cloning' | 'publishing' | 'unpublishing' | 'deleting'>('idle');
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  
  // Dialog visibility and confirmation states
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [understandPublish, setUnderstandPublish] = useState(false);
  
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);
  const [understandUnpublish, setUnderstandUnpublish] = useState(false);
  
  const [showUnpublishError, setShowUnpublishError] = useState(false);
  const [unpublishErrorMsg, setUnpublishErrorMsg] = useState<string | null>(null);
  
  const [seededCount, setSeededCount] = useState<number | null>(null);

  const fetchNodeContent = useCallback(async (nodeId: number) => {
    try {
      setLoadingContents((prev) => ({ ...prev, [nodeId]: true }));
      const content = await learningPathService.getTeacherNodeContent(nodeId);
      setNodeContents((prev) => ({ ...prev, [nodeId]: content }));
    } catch (err: any) {
      console.error('Failed to load node content:', err);
    } finally {
      setLoadingContents((prev) => ({ ...prev, [nodeId]: false }));
    }
  }, []);

  const toggleNode = async (nodeId: number) => {
    const nextState = !expandedNodes[nodeId];
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: nextState,
    }));
    if (nextState && !nodeContents[nodeId]) {
      await fetchNodeContent(nodeId);
    }
  };

  const getSortedTimelineItems = (nodeId: number) => {
    const content = nodeContents[nodeId];
    if (!content) return [];
    const materials = (content.materials || []).map((m) => ({
      key: `material-${m.materialId}`,
      id: m.materialId,
      type: "MATERIAL" as const,
      title: m.title,
      orderIndex: m.orderIndex ?? 9999,
      data: m,
    }));
    const tests = (content.tests || []).map((t) => ({
      key: `test-${t.testId}`,
      id: t.testId,
      type: "TEST" as const,
      title: t.title,
      orderIndex: t.orderIndex ?? 9999,
      data: t,
    }));
    return [...materials, ...tests].sort((a, b) => a.orderIndex - b.orderIndex);
  };

  const fetchClassroomData = async () => {
    if (!classroomSubjectId) return;

    try {
      setLoading(true);
      const [classData, studentsData, graph] = await Promise.all([
        teacherService.getClassroomSubjectById(Number(classroomSubjectId)),
        classroomService.getStudents(Number(classroomSubjectId)),
        learningPathService.getClassroomGraph(Number(classroomSubjectId)),
      ]);

      const fullClassroom = await teacherService.getClassroomById(classData.classroomId);
      
      setClassInfo({
        classCode: classData.className,        
        courseCode: classData.subjectCode,
        semester: fullClassroom.semester || '',
        description: fullClassroom.description || '',
      });
      setClassroomStatus(fullClassroom.status || 'inactive');
      setParentClassroomId(fullClassroom.classroomId);
      
      const formatted = (studentsData ?? []).map((item) => ({
        id: item.email?.split('@')[0].toUpperCase() || `ST${item.userId}`,
        fullName: (item.lastName || item.firstName)
          ? `${item.lastName || ''} ${item.firstName || ''}`.trim()
          : `Student ${item.userId}`,
        progress: 0,
      }));
      setStudents(formatted);
      setGraphData(graph);
    } catch (err: any) {
      console.error('Error loading classroom overview:', err);
      setError(err.response?.data?.message || 'Failed to load classroom data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!parentClassroomId) return;
    const actionText = newStatus === 'active' ? 'bắt đầu' : 'kết thúc';
    if (!confirm(`Bạn có chắc chắn muốn ${actionText} lớp học này không? (Hành động này ảnh hưởng đến toàn bộ môn học trong lớp)`)) return;
    
    try {
      setActionState(newStatus === 'active' ? 'publishing' : 'unpublishing');
      await classroomService.update(parentClassroomId, {
        className: classInfo.classCode,
        semester: classInfo.semester || '',
        description: classInfo.description || '',
        status: newStatus,
      });
      setClassroomStatus(newStatus);
      toast.success(newStatus === 'active' ? 'Lớp học đã bắt đầu thành công!' : 'Lớp học đã kết thúc!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Cập nhật trạng thái thất bại');
    } finally {
      setActionState('idle');
    }
  };

  useEffect(() => {
    fetchClassroomData();
  }, [classroomSubjectId]);

  // Auto-select template if there's only one template available
  useEffect(() => {
    if (graphData?.state === 'NO_PATH' && graphData.availableTemplates) {
      if (graphData.availableTemplates.length === 1) {
        setSelectedTemplateId(graphData.availableTemplates[0].pathId);
      }
    }
  }, [graphData]);

  // Cross-tab consistency
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && classroomSubjectId) {
        learningPathService.getClassroomGraph(Number(classroomSubjectId))
          .then(graph => {
            setGraphData(graph);
          })
          .catch(err => console.error('Error auto-refreshing graph:', err));
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [classroomSubjectId]);

  useEffect(() => {
    if (graphData && graphData.paths) {
      const initialExpanded: Record<number, boolean> = {};
      graphData.paths.forEach((path) => {
        if (path.nodes && path.nodes.length > 0) {
          const sorted = [...path.nodes].sort((a, b) => a.displayOrder - b.displayOrder);
          const firstNodeId = sorted[0].nodeId;
          initialExpanded[firstNodeId] = true;
          fetchNodeContent(firstNodeId);
        }
      });
      setExpandedNodes((prev) => ({ ...initialExpanded, ...prev }));
    }
  }, [graphData, fetchNodeContent]);

  const handleClone = async () => {
    if (!classroomSubjectId) return;
    try {
      setActionState('cloning');
      await learningPathService.cloneFromTemplate(Number(classroomSubjectId));
      
      // Refetch classroom graph
      const updatedGraph = await learningPathService.getClassroomGraph(Number(classroomSubjectId));
      setGraphData(updatedGraph);
      toast.success('Khởi tạo lộ trình học (3 mức) thành công!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể khởi tạo lộ trình học');
    } finally {
      setActionState('idle');
    }
  };

  const handlePublish = async () => {
    if (!classroomSubjectId || !graphData?.pathId) return;
    try {
      setActionState('publishing');
      const res = await learningPathService.publishClassroomPath(Number(classroomSubjectId), graphData.pathId);
      setSeededCount(res.seededStudents);
      
      const updatedGraph = await learningPathService.getClassroomGraph(Number(classroomSubjectId));
      setGraphData(updatedGraph);
      setShowPublishConfirm(false);
      setUnderstandPublish(false);
      toast.success('Xuất bản lộ trình học thành công!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể xuất bản lộ trình học');
    } finally {
      setActionState('idle');
    }
  };

  const handleUnpublish = async () => {
    if (!classroomSubjectId || !graphData?.pathId) return;
    try {
      setActionState('unpublishing');
      await learningPathService.unpublishClassroomPath(Number(classroomSubjectId), graphData.pathId);
      
      const updatedGraph = await learningPathService.getClassroomGraph(Number(classroomSubjectId));
      setGraphData(updatedGraph);
      setShowUnpublishConfirm(false);
      setUnderstandUnpublish(false);
      toast.success('Gỡ xuất bản lộ trình học thành công!');
    } catch (err: any) {
      if (err.response?.status === 409) {
        setUnpublishErrorMsg(err.response?.data?.message || 'Không thể unpublish — đã có học sinh hoàn thành node.');
        setShowUnpublishError(true);
      } else {
        toast.error(err.response?.data?.message || 'Không thể gỡ xuất bản lộ trình học');
      }
    } finally {
      setActionState('idle');
    }
  };

  const handleDeleteDraft = async () => {
    if (!classroomSubjectId || !graphData?.pathId) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa bản nháp này không? Lộ trình sẽ bị xóa vĩnh viễn.')) return;
    
    try {
      setActionState('deleting');
      await learningPathService.deleteDraftPath(Number(classroomSubjectId), graphData.pathId);
      
      const updatedGraph = await learningPathService.getClassroomGraph(Number(classroomSubjectId));
      setGraphData(updatedGraph);
      setSelectedTemplateId(null);
      toast.success('Đã xóa bản nháp lộ trình học thành công!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể xóa bản nháp lộ trình học');
    } finally {
      setActionState('idle');
    }
  };

  const getNodeColorClass = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'border-l-4 border-l-green-500 hover:bg-green-50/5';
      case 'LOCKED':
        return 'border-l-4 border-l-gray-300 hover:bg-muted/5 opacity-80';
      case 'HIDDEN':
        return 'border-l-4 border-l-yellow-500 hover:bg-yellow-50/5 opacity-60';
      default:
        return 'border-l-4 border-l-gray-300 hover:bg-muted/5';
    }
  };

  const getNodeIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <CheckCircle2 className="size-5 text-green-600" />;
      case 'LOCKED':
        return <Circle className="size-5 text-gray-400" />;
      case 'HIDDEN':
        return <HelpCircle className="size-5 text-yellow-500" />;
      default:
        return <Circle className="size-5" />;
    }
  };

  const renderClassRoadmapColumn = (level: number, title: string, defaultDesc: string) => {
    const pathDto = graphData?.paths?.find((p) => p.level === level);

    if (!pathDto) {
      return (
        <Card className="border border-slate-200 bg-white shadow-xs min-h-[400px] flex flex-col justify-between p-6 rounded-2xl">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-slate-400" />
              <h3 className="font-bold text-lg text-slate-800">{title}</h3>
            </div>
            <p className="text-sm text-slate-500">{defaultDesc}</p>
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Map className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs text-slate-400">Chưa thiết lập lộ trình cho mức này.</p>
            </div>
          </div>
        </Card>
      );
    }

    const colNodes = pathDto.nodes || [];
    const colEdges = pathDto.edges || [];

    const isColSubNode = (n: any) => colEdges.some((e) => e.toNodeId === n.nodeId && e.maxScore !== null);
    const colSubDepth = (n: any, seen: Set<number> = new Set()): number => {
      if (!isColSubNode(n)) return 0;
      if (seen.has(n.nodeId)) return 1;
      seen.add(n.nodeId);
      const pe = colEdges.find((e) => e.toNodeId === n.nodeId);
      const parent = pe ? colNodes.find((x) => x.nodeId === pe.fromNodeId) : undefined;
      return parent ? colSubDepth(parent, seen) + 1 : 1;
    };
    const stripLessonPrefix = (t: string) => (t || "").replace(/^\s*Bài\s+\d+(\s*phụ(\s*\d+)?)?\s*:?\s*/i, "").trim();
    const colNodeLabels: Record<number, string> = {};
    const subInfo: Record<number, { base: string; idx: number }> = {};
    let lessonCounter = 0;
    
    // Sort nodes by displayOrder, then nodeId for stable sorting
    const sortedColNodes = [...colNodes].sort((a, b) => (a.displayOrder - b.displayOrder) || (a.nodeId - b.nodeId));

    for (const n of sortedColNodes) {
      if (isColSubNode(n)) {
        const pe = colEdges.find((e) => e.toNodeId === n.nodeId);
        const parentId = pe?.fromNodeId;
        const parentSub = parentId != null ? subInfo[parentId] : undefined;
        const base = parentSub
          ? parentSub.base
          : parentId != null
            ? colNodeLabels[parentId] || `Bài ${lessonCounter}`
            : `Bài ${lessonCounter}`;
        const idx = parentSub ? parentSub.idx + 1 : 1;
        subInfo[n.nodeId] = { base, idx };
        colNodeLabels[n.nodeId] = `${base} phụ ${idx}`;
      } else {
        lessonCounter += 1;
        colNodeLabels[n.nodeId] = `Bài ${lessonCounter}`;
      }
    }

    const colTotals = sortedColNodes.reduce(
      (acc, n) => {
        const c = nodeContents[n.nodeId];
        if (c) {
          acc.videos += (c.materials || []).filter((m) => m.video).length;
          acc.docs += (c.materials || []).filter((m) => m.file).length;
          acc.tests += (c.tests || []).length;
        }
        return acc;
      },
      { videos: 0, docs: 0, tests: 0 }
    );

    return (
      <Card className="border border-slate-200 bg-white shadow-xs flex flex-col min-h-[500px] p-6 rounded-2xl">
        <div className="flex-1">
          {/* Column Header */}
          <div className="pb-4 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-1.5">
              <BookOpen className="w-5 h-5 text-indigo-600 shrink-0" />
              <h3 className="font-bold text-lg text-slate-800">{title}</h3>
            </div>
            <p className="text-xs text-slate-500 line-clamp-2">
              {defaultDesc}
            </p>
          </div>

          {/* Stats Bar */}
          {sortedColNodes.length > 0 && (
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 pb-3 mb-4 border-b border-slate-100 text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-indigo-600" /> {sortedColNodes.length} bài học</span>
              {colTotals.videos > 0 && (
                <span className="flex items-center gap-1"><Film className="w-3.5 h-3.5 text-purple-500" /> {colTotals.videos} video</span>
              )}
              {colTotals.docs > 0 && (
                <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-orange-500" /> {colTotals.docs} tài liệu</span>
              )}
              {colTotals.tests > 0 && (
                <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5 text-emerald-500" /> {colTotals.tests} test</span>
              )}
            </div>
          )}

          {/* Nodes list */}
          {sortedColNodes.length === 0 ? (
            <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <Map className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs">Chưa có bài học nào trong lộ trình này.</p>
            </div>
          ) : (
            <div className="flex flex-col space-y-3">
              {sortedColNodes.map((node, index) => {
                const isExpanded = !!expandedNodes[node.nodeId];
                const sortedItems = getSortedTimelineItems(node.nodeId);
                const isLoadingContent = !!loadingContents[node.nodeId];

                const depth = colSubDepth(node);
                const incomingEdges = colEdges.filter((e) => e.toNodeId === node.nodeId);
                const incomingNodesInfo = incomingEdges.map((e) => {
                  const fromNode = colNodes.find((n) => n.nodeId === e.fromNodeId);
                  return {
                    edgeId: e.edgeId,
                    fromTitle: fromNode ? fromNode.title : `Node #${e.fromNodeId}`,
                    minScore: e.minScore,
                    maxScore: e.maxScore,
                  };
                });

                return (
                  <div key={node.nodeId} className="w-full relative" style={{ marginLeft: `${depth * 28}px` }}>
                    {/* Branch connector on the left */}
                    {depth > 0 && (
                      <div className="absolute top-0 bottom-0 flex items-start justify-center pointer-events-none" style={{ left: `-${28}px`, width: `${28}px` }}>
                        <svg className="w-full h-12 text-indigo-300" viewBox="0 0 28 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M 14 0 L 14 16 Q 14 24 21 24 L 28 24" />
                          {index < sortedColNodes.length - 1 && <path d="M 14 24 L 14 48" />}
                        </svg>
                      </div>
                    )}

                    {/* Standard vertical line connector for main nodes */}
                    {index > 0 && depth === 0 && (
                      <div className="flex flex-col items-center justify-center my-1.5">
                        <div className="h-4 w-0.5 bg-slate-200 relative flex items-center justify-center">
                          <ChevronRight className="w-2.5 h-2.5 text-slate-300 rotate-90" />
                        </div>
                      </div>
                    )}
                    <div
                      className={`rounded-xl border transition-all overflow-hidden ${
                        isExpanded
                          ? "bg-white border-indigo-200 shadow-sm"
                          : depth > 0
                            ? "bg-indigo-50/5 hover:bg-indigo-50/10 border-indigo-150"
                            : "bg-slate-50/50 hover:bg-white hover:border-slate-300 border-slate-200"
                      }`}
                    >
                      {/* Node Header */}
                      <div
                        onClick={() => toggleNode(node.nodeId)}
                        className="flex items-center justify-between p-3.5 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className={`p-0.5 rounded transition-transform duration-200 shrink-0 ${isExpanded ? "rotate-90" : ""}`}>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`font-semibold text-xs ${node.status === "LOCKED" ? "text-slate-400" : "text-slate-800"}`}>
                                {colNodeLabels[node.nodeId]}: {stripLessonPrefix(node.title)}
                              </span>
                              {isColSubNode(node) && (
                                <Badge variant="outline" className="text-[9px] py-0.2 px-1 hover:bg-transparent font-semibold bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-0.5">
                                  <GitFork className="w-2.5 h-2.5" /> Nhánh phụ
                                </Badge>
                              )}
                              {isColSubNode(node) && incomingNodesInfo.map((info) => info.maxScore !== null && (
                                <Badge key={info.edgeId} variant="outline" className="text-[9px] py-0.2 px-1 hover:bg-transparent font-semibold bg-rose-50 text-rose-700 border-rose-200">
                                  Nếu &lt; {info.maxScore}đ
                                </Badge>
                              ))}
                              <Badge variant="outline" className="text-[9px] py-0.2 px-1 hover:bg-transparent font-semibold bg-indigo-50/80 text-indigo-700 border-indigo-100">
                                {node.nodeType === "ON_CLASS" ? "On Class" : "At Home"}
                              </Badge>
                              {node.isRequired && (
                                <Badge variant="outline" className="text-[9px] py-0.2 px-1 hover:bg-transparent font-semibold bg-red-50 text-red-600 border-red-100">
                                  Bắt buộc
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-[10px] font-semibold text-slate-400 select-none">
                          {node.status}
                        </div>
                      </div>

                      {/* Node Expanded Content */}
                      {isExpanded && (
                        <div className="px-3.5 pb-3.5 pt-1.5 bg-slate-50/30 border-t border-slate-100 space-y-3">
                          <p className="text-xs text-slate-500 leading-relaxed">
                            {node.description || "Chưa có mô tả chi tiết."}
                          </p>

                          {/* Materials & Tests list */}
                          <div className="border border-slate-200/80 rounded-lg p-2.5 bg-white space-y-2">
                            <div className="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                              <BookOpen className="w-3 h-3 text-indigo-500" />
                              Nội dung học tập
                            </div>

                            {isLoadingContent ? (
                              <div className="flex items-center gap-1.5 py-2 text-[11px] text-slate-400 justify-center">
                                <Loader className="w-3.5 h-3.5 animate-spin" />
                                Đang tải tài liệu...
                              </div>
                            ) : sortedItems.length === 0 ? (
                              <div className="text-[10px] text-slate-400 italic py-2 text-center bg-slate-50/50 rounded border border-dashed border-slate-100">
                                Chưa có tài liệu hoặc bài test.
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                {sortedItems.map((item) => {
                                  const isMaterial = item.type === "MATERIAL";
                                  const m = isMaterial ? item.data : null;
                                  const t = !isMaterial ? item.data : null;

                                  return (
                                    <div
                                      key={item.key}
                                      className="flex items-center gap-2 p-2 bg-slate-50/50 hover:bg-slate-50 rounded-lg border border-slate-100 text-[11px] transition-colors"
                                    >
                                      {isMaterial ? (
                                        <>
                                          {m?.video ? (
                                            <Film className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                                          ) : (
                                            <FileText className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                          )}
                                          <div className="flex-1 min-w-0">
                                            <span className="font-semibold text-slate-700 truncate block" title={item.title}>
                                              {item.title}
                                            </span>
                                            {m?.video && (
                                              <a
                                                href={m.video.videoUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-[9px] text-indigo-600 hover:underline block truncate mt-0.5"
                                              >
                                                Xem video youtube
                                              </a>
                                            )}
                                            {m?.file && (
                                              <span className="text-[9px] text-slate-400 block truncate mt-0.5">
                                                Tài liệu đính kèm
                                              </span>
                                            )}
                                          </div>
                                        </>
                                      ) : (
                                        <>
                                          <Award className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                          <div className="flex-1 min-w-0">
                                            <span className="font-semibold text-slate-700 truncate block" title={item.title}>
                                              {item.title}
                                            </span>
                                            <span className="text-[9px] text-slate-400 block mt-0.5">
                                              {t?.durationMinutes || 0} phút · Yêu cầu đạt: {t?.passingPercentage || 80}%
                                            </span>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => navigate('/teacher/courses')}>
          Back to Courses
        </Button>
      </div>
    );
  }

  const isNonIdle = actionState !== 'idle';

  return (
    <div className={`space-y-6 ${isNonIdle ? 'pointer-events-none opacity-60' : ''}`} aria-busy={isNonIdle}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)} disabled={isNonIdle}>
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
            Class {classInfo.classCode} - {classInfo.courseCode}
            {(() => {
              switch (classroomStatus) {
                case 'active':
                  return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Đang hoạt động</Badge>;
                case 'completed':
                  return <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">Đã hoàn thành</Badge>;
                default:
                  return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Chưa bắt đầu</Badge>;
              }
            })()}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {classroomStatus === 'inactive' && (
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl flex items-center gap-1.5"
              onClick={() => handleUpdateStatus('active')}
              disabled={isNonIdle}
            >
              Bắt đầu lớp học
            </Button>
          )}
          {classroomStatus === 'active' && (
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl flex items-center gap-1.5"
              onClick={() => handleUpdateStatus('completed')}
              disabled={isNonIdle}
            >
              Kết thúc lớp học
            </Button>
          )}
          <Button 
            onClick={() => navigate(`/teacher/classroom-subjects/${classroomSubjectId}/manage`)} 
            disabled={isNonIdle || graphData?.state === 'NO_PATH'}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl flex items-center gap-1.5"
          >
            <Settings className="size-4" />
            Chỉnh sửa Lộ trình
          </Button>
        </div>
      </div>

      {/* Hero pub/unpub state zones */}
      {graphData?.state === 'NO_PATH' && (
        <Card className="border-indigo-100 bg-indigo-50/10">
          <CardContent className="pt-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <h2 className="text-lg font-semibold text-indigo-900">
                {graphData.canCloneAll ? "Khởi tạo lộ trình học cho lớp" : "Môn học chưa đầy đủ lộ trình mẫu"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {graphData.canCloneAll 
                  ? "Lớp học này chưa cấu hình lộ trình. Vui lòng bấm nút Khởi tạo để sao chép lộ trình mẫu cả 3 mức (Yếu, Trung bình, Khá)." 
                  : "Môn học này chưa được cấu hình đầy đủ lộ trình mẫu 3 mức (Yếu, Trung bình, Khá) từ khoa."}
              </p>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto shrink-0 flex-wrap">
              {graphData.canCloneAll ? (
                <Button 
                  onClick={handleClone} 
                  disabled={isNonIdle} 
                  className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl"
                >
                  {actionState === 'cloning' ? <Loader className="size-4 animate-spin mr-1" /> : <Play className="size-4 mr-1" />}
                  Khởi tạo lộ trình (3 mức)
                </Button>
              ) : (
                <div className="text-sm text-red-600 bg-red-50 py-2 px-3 rounded-md border border-red-100">
                  Thiếu lộ trình mẫu mức: {
                    graphData.missingLevels?.map(lvl => lvl === 1 ? "Yếu" : lvl === 2 ? "Trung bình" : "Khá").join(", ")
                  }. Liên hệ admin.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {graphData?.state === 'DRAFT' && (
        <Card className="border-amber-100 bg-amber-50/10" role="alert">
          <CardContent className="pt-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-900 font-semibold">
                <AlertTriangle className="size-5 text-amber-600" />
                <span>Bản nháp — chưa publish</span>
              </div>
              <p className="text-sm text-muted-foreground">Giáo viên có thể chỉnh sửa tự do. Học sinh sẽ không nhìn thấy lộ trình này cho đến khi bạn publish.</p>
            </div>
            
            <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
              <Button 
                variant="outline" 
                onClick={handleDeleteDraft} 
                disabled={isNonIdle}
                className="w-full md:w-auto text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100"
              >
                <Trash2 className="size-4 mr-1" />
                Xóa draft
              </Button>
              <Button 
                onClick={() => setShowPublishConfirm(true)} 
                disabled={isNonIdle}
                className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white"
              >
                <Play className="size-4 mr-1" />
                Publish lộ trình
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {graphData?.state === 'PUBLISHED' && (
        <Card className="border-emerald-100 bg-emerald-50/10" role="alert">
          <CardContent className="pt-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-950 font-semibold">
                <CheckCircle2 className="size-5 text-emerald-600" />
                <span>Đã publish lúc {graphData.publishedAt ? new Date(graphData.publishedAt).toLocaleString() : ''}</span>
              </div>
              <p className="text-sm text-muted-foreground">Lộ trình học đã được mở cho học sinh. Mọi tiến độ học tập đang được ghi nhận.</p>
              <div className="text-xs text-muted-foreground font-semibold mt-1">
                Tiến độ: 0/{students.length} học sinh đã bắt đầu
              </div>
            </div>
            
            <div className="shrink-0 w-full md:w-auto">
              <Button 
                variant="outline"
                onClick={() => setShowUnpublishConfirm(true)} 
                disabled={isNonIdle}
                className="w-full md:w-auto text-amber-700 hover:text-amber-800 hover:bg-amber-50 border-amber-200"
              >
                <Undo2 className="size-4 mr-1" />
                Unpublish
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parallel Roadmap Columns Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pl-1">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Map className="w-5 h-5 text-indigo-600" />
            Lộ trình học tập song song (3 mức)
          </h2>
          {graphData?.state !== 'NO_PATH' && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50/50 rounded-xl"
              onClick={() => navigate(`/teacher/classroom-subjects/${classroomSubjectId}/manage`)}
              disabled={isNonIdle}
            >
              <Settings className="size-3.5 mr-1" />
              Chỉnh sửa Lộ trình
            </Button>
          )}
        </div>
        
        {(!graphData?.paths || graphData.paths.length === 0) && graphData?.state === 'NO_PATH' ? (
          <Card className="border border-dashed border-slate-200 bg-white p-12 text-center rounded-2xl">
            <Map className="w-12 h-12 mx-auto text-slate-300 mb-3 animate-pulse" />
            <h3 className="text-base font-bold text-slate-800 mb-1">Chưa cấu hình lộ trình</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Lớp học này chưa khởi tạo lộ trình học tập. Hãy nhấp nút "Khởi tạo lộ trình (3 mức)" ở trên để bắt đầu.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {renderClassRoadmapColumn(1, "Lộ trình Yếu (Level 1)", "Lộ trình dành cho học sinh có năng lực yếu, tập trung bổ trợ kiến thức cơ bản.")}
            {renderClassRoadmapColumn(2, "Lộ trình Trung bình (Level 2)", "Lộ trình chuẩn cho học sinh có năng lực trung bình, bám sát khung chương trình chính.")}
            {renderClassRoadmapColumn(3, "Lộ trình Khá (Level 3)", "Lộ trình nâng cao cho học sinh khá giỏi, tích hợp các bài toán/chủ đề chuyên sâu.")}
          </div>
        )}
      </div>

      {/* Student List Section */}
      <Card className="border border-slate-200 shadow-xs rounded-2xl">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-650" />
            Danh sách học sinh trong lớp ({students.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50 border-slate-100">
                <TableHead className="font-bold text-slate-700 w-1/3">Mã học sinh</TableHead>
                <TableHead className="font-bold text-slate-700">Họ và tên</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-8 text-slate-400 italic">
                    Chưa có học sinh nào tham gia lớp học này.
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => (
                  <TableRow key={student.id} className="border-slate-100 hover:bg-slate-50/50">
                    <TableCell className="font-semibold text-slate-650">{student.id}</TableCell>
                    <TableCell className="font-medium text-slate-700">{student.fullName}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Confirmation Modal for Publish */}
      <Dialog open={showPublishConfirm} onOpenChange={(open) => { if (!open) { setShowPublishConfirm(false); setUnderstandPublish(false); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận Publish lộ trình học</DialogTitle>
            <DialogDescription>
              Hành động này sẽ chính thức kích hoạt lộ trình học cho sinh viên.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-600 leading-relaxed">
              Lộ trình sẽ mở khóa các bài học đầu tiên (entry nodes) cho <strong>{students.length} học sinh</strong> đang enroll trong lớp học này.
            </p>
            <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-md border border-amber-100">
              <strong>Chú ý:</strong> Hành động không thể hủy bỏ (unpublish) nếu đã có bất kỳ học sinh nào hoàn thành tối thiểu một bài học trong lộ trình.
            </p>
            <div className="flex items-start gap-2 pt-2">
              <Checkbox 
                id="understand-publish" 
                checked={understandPublish} 
                onCheckedChange={(val) => setUnderstandPublish(!!val)} 
              />
              <label 
                htmlFor="understand-publish" 
                className="text-xs text-gray-700 leading-tight cursor-pointer select-none font-medium"
              >
                Tôi hiểu và đồng ý publish lộ trình học cho sinh viên lớp này.
              </label>
            </div>
          </div>
          <DialogFooter className="sm:justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => { setShowPublishConfirm(false); setUnderstandPublish(false); }}
              disabled={actionState === 'publishing'}
            >
              Hủy
            </Button>
            <Button 
              onClick={handlePublish} 
              disabled={!understandPublish || actionState === 'publishing'}
              className="bg-green-600 hover:bg-green-700 text-white font-medium"
            >
              {actionState === 'publishing' ? (
                <>
                  <Loader className="size-4 animate-spin mr-1" />
                  Đang seed tiến độ cho {students.length} học sinh...
                </>
              ) : (
                'Publish ngay'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal for Unpublish */}
      <Dialog open={showUnpublishConfirm} onOpenChange={(open) => { if (!open) { setShowUnpublishConfirm(false); setUnderstandUnpublish(false); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận rút lại lộ trình học (Unpublish)</DialogTitle>
            <DialogDescription>
              Rút lại lộ trình học để chỉnh sửa thêm bản nháp.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-600 leading-relaxed font-medium">
              Toàn bộ tiến độ học tập và ghi nhận bài học hiện tại của học sinh sẽ bị xóa sạch khỏi hệ thống.
            </p>
            <p className="text-sm text-red-700 bg-red-50 p-3 rounded-md border border-red-100">
              <strong>Cảnh báo:</strong> Hãy đảm bảo chưa có học sinh nào hoàn thành bất kỳ bài học nào, nếu không hệ thống sẽ từ chối rút lại lộ trình.
            </p>
            <div className="flex items-start gap-2 pt-2">
              <Checkbox 
                id="understand-unpublish" 
                checked={understandUnpublish} 
                onCheckedChange={(val) => setUnderstandUnpublish(!!val)} 
              />
              <label 
                htmlFor="understand-unpublish" 
                className="text-xs text-gray-700 leading-tight cursor-pointer select-none font-medium"
              >
                Tôi xác nhận muốn xóa sạch tiến trình hiện tại để đưa lộ trình về trạng thái nháp.
              </label>
            </div>
          </div>
          <DialogFooter className="sm:justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => { setShowUnpublishConfirm(false); setUnderstandUnpublish(false); }}
              disabled={actionState === 'unpublishing'}
            >
              Hủy
            </Button>
            <Button 
              onClick={handleUnpublish} 
              disabled={!understandUnpublish || actionState === 'unpublishing'}
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium"
            >
              {actionState === 'unpublishing' ? <Loader className="size-4 animate-spin mr-1" /> : null}
              Xác nhận Unpublish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unpublish Error Modal (already completed nodes) */}
      <Dialog open={showUnpublishError} onOpenChange={setShowUnpublishError}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="size-5 shrink-0" />
              <span>Không thể unpublish</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-gray-600 leading-relaxed">
            {unpublishErrorMsg || 'Đã có học sinh hoàn thành node, không thể unpublish.'}
          </div>
          <DialogFooter className="sm:justify-end">
            <Button onClick={() => setShowUnpublishError(false)}>
              Đồng ý
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
