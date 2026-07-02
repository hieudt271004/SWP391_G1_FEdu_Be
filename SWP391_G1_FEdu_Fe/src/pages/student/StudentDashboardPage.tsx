import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  BookOpen, 
  Award, 
  History, 
  FileText, 
  CheckCircle2, 
  Circle, 
  Lock, 
  Play, 
  ArrowRight, 
  Loader2, 
  GraduationCap, 
  Calendar, 
  TrendingUp, 
  User, 
  Mail, 
  ChevronRight,
  ChevronDown,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { classroomService } from '../../services/classroom.service';
import { studentService } from '../../services/student.service';
import { MaterialPreview } from '../../components/learningPath/MaterialPreview';
import type { ClassroomSubjectResponse } from '../../types/classroomSubject';
import type { LearningNodeResponse, NodeContentResponse } from '../../services/learningPath.service';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';

export function StudentDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [subjects, setSubjects] = useState<ClassroomSubjectResponse[]>([]);
  const [subjectLevels, setSubjectLevels] = useState<Record<number, number | null>>({});
  const [subjectPaths, setSubjectPaths] = useState<Record<number, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Roadmap Modal State
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<ClassroomSubjectResponse | null>(null);
  const [nodes, setNodes] = useState<LearningNodeResponse[]>([]);
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [expandedNodeId, setExpandedNodeId] = useState<number | null>(null);
  const [nodeContents, setNodeContents] = useState<Record<number, NodeContentResponse>>({});
  const [loadingNodeContent, setLoadingNodeContent] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch enrolled classroom subjects
        const enrolledSubjects = await classroomService.getClassroomSubjectsByStudent(user.userId);
        setSubjects(enrolledSubjects || []);

        // Load level history for each subject in parallel to determine level status
        const levelsMap: Record<number, number | null> = {};
        const pathsMap: Record<number, string | null> = {};

        await Promise.all(
          (enrolledSubjects || []).map(async (s) => {
            try {
              const history = await studentService.getLevelHistory(s.classroomSubjectId);
              if (history && history.length > 0) {
                // Latest entry represents current level
                const latest = history[history.length - 1];
                levelsMap[s.classroomSubjectId] = latest.newLevel;
              } else {
                levelsMap[s.classroomSubjectId] = null;
              }
            } catch {
              levelsMap[s.classroomSubjectId] = null;
            }

            try {
              // Get graph to see if path is assigned
              const graph = await studentService.getClassroomSubjectGraph(s.classroomSubjectId);
              if (graph && graph.state !== 'NEED_PLACEMENT' && graph.state !== 'NO_PATH') {
                pathsMap[s.classroomSubjectId] = graph.state === 'PUBLISHED' ? 'Lộ trình chính thức' : 'Bản nháp';
              } else {
                pathsMap[s.classroomSubjectId] = null;
              }
            } catch {
              pathsMap[s.classroomSubjectId] = null;
            }
          })
        );

        setSubjectLevels(levelsMap);
        setSubjectPaths(pathsMap);
      } catch (err: any) {
        console.error('Error fetching student dashboard:', err);
        setError(err.response?.data?.message || 'Không thể tải thông tin dashboard. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.userId]);

  const handleOpenRoadmap = async (cs: ClassroomSubjectResponse) => {
    setSelectedSubject(cs);
    setIsRoadmapOpen(true);
    setLoadingGraph(true);
    setExpandedNodeId(null);
    setNodeContents({});
    try {
      const graph = await studentService.getClassroomSubjectGraph(cs.classroomSubjectId);
      // Sort nodes by displayOrder
      const sortedNodes = (graph.nodes || []).sort((a, b) => a.displayOrder - b.displayOrder);
      setNodes(sortedNodes);
    } catch (err: any) {
      console.error("Failed to load roadmap graph:", err);
      toast.error("Không thể tải lộ trình học tập");
      setIsRoadmapOpen(false);
    } finally {
      setLoadingGraph(false);
    }
  };

  const handleToggleNode = async (nodeId: number, studentStatus: string | undefined) => {
    if (studentStatus === 'LOCKED') {
      toast.error("Bài học này đang bị khóa. Hãy hoàn thành các bài học trước!");
      return;
    }
    
    if (expandedNodeId === nodeId) {
      setExpandedNodeId(null);
      return;
    }

    setExpandedNodeId(nodeId);
    if (nodeContents[nodeId]) return; // already loaded

    setLoadingNodeContent(prev => ({ ...prev, [nodeId]: true }));
    try {
      const content = await studentService.getNodeContent(nodeId);
      setNodeContents(prev => ({ ...prev, [nodeId]: content }));
    } catch (err) {
      console.error("Failed to load node content:", err);
      toast.error("Không thể tải nội dung bài học");
    } finally {
      setLoadingNodeContent(prev => ({ ...prev, [nodeId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-9 h-9 animate-spin text-[#030213]" />
        <span className="text-sm text-slate-500 font-medium">Đang tải trang tổng quan của bạn...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <AlertTriangle className="w-12 h-12 text-rose-500" />
        <p className="text-slate-800 font-semibold">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 bg-[#030213] text-white rounded-xl hover:bg-[#1c1b2d] transition-all text-sm font-bold shadow-sm"
        >
          Tải lại trang
        </button>
      </div>
    );
  }

  // Calculate stats
  const totalCourses = subjects.length;
  const placementDone = Object.values(subjectLevels).filter(lvl => lvl !== null).length;

  return (
    <div className="space-y-6 font-sans">
      {/* Welcome Banner */}
      <div className="rounded-xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 p-6 text-white border border-border/40 shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 opacity-10 flex items-center justify-center pr-12 hidden md:flex pointer-events-none select-none">
          <GraduationCap className="size-48" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="h-16 w-16 rounded-xl border border-white/20 overflow-hidden bg-white/10 flex items-center justify-center text-3xl shrink-0 font-extrabold shadow-inner">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                "🎓"
              )}
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Chào mừng trở lại, {user?.lastName || 'Sinh viên'} {user?.firstName || ''}!
              </h1>
              <p className="text-indigo-200/80 text-sm mt-1 font-normal">
                Hôm nay là {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. Chúc bạn học tập tốt!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <Card className="bg-card border border-border/60 rounded-xl shadow-xs hover:shadow-md hover:border-border/80 transition-all duration-300 flex flex-col justify-between p-5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Môn học đăng ký</span>
            <div className="p-2.5 bg-muted/65 text-primary rounded-lg border border-border/40">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-foreground tracking-tight">{totalCourses}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Các lớp môn học phân phối lộ trình cá nhân hóa.</p>
          </div>
        </Card>

        <Card className="bg-card border border-border/60 rounded-xl shadow-xs hover:shadow-md hover:border-border/80 transition-all duration-300 flex flex-col justify-between p-5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Đã kiểm tra đầu vào</span>
            <div className="p-2.5 bg-muted/65 text-primary rounded-lg border border-border/40">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-foreground tracking-tight">{placementDone} / {totalCourses}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Số môn học đã hoàn tất phân loại học lực đầu vào.</p>
          </div>
        </Card>

        <Card className="bg-card border border-border/60 rounded-xl shadow-xs hover:shadow-md hover:border-border/80 transition-all duration-300 flex flex-col justify-between p-5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Học kỳ hiện tại</span>
            <div className="p-2.5 bg-muted/65 text-primary rounded-lg border border-border/40">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-foreground tracking-tight">
              {subjects[0]?.className?.substring(0, 4) || '2026'}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Đang trong thời gian học tập chính thức.</p>
          </div>
        </Card>
      </div>

      {/* Enrolled Courses Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <GraduationCap className="size-5 text-primary" /> Danh sách môn học của tôi
        </h2>

        {subjects.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-xl border border-dashed border-border/60">
            <BookOpen className="size-12 text-muted-foreground/60 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm font-medium">Bạn chưa tham gia lớp học môn học nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((c) => {
              const currentLevel = subjectLevels[c.classroomSubjectId];
              const pathAssigned = subjectPaths[c.classroomSubjectId];
              
              const getLvlLabel = (lvl: number | null | undefined) => {
                if (lvl === 1) return 'Yếu';
                if (lvl === 2) return 'Trung bình';
                if (lvl === 3) return 'Khá';
                return 'Chưa làm bài test';
              };

              const getLvlColor = (lvl: number | null | undefined) => {
                if (lvl === 1) return 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450';
                if (lvl === 2) return 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:text-amber-450';
                if (lvl === 3) return 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450';
                return 'bg-muted/80 border-border/50 text-muted-foreground';
              };

              return (
                <Card key={c.classroomSubjectId} className="bg-card border border-border/60 shadow-xs rounded-xl hover:shadow-md hover:-translate-y-1 hover:border-border/80 transition-all duration-300 flex flex-col justify-between overflow-hidden group">
                  <div className="p-5 space-y-4">
                    {/* Header */}
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground/75 tracking-wider">Lớp: {c.className}</span>
                      <h3 className="font-bold text-foreground text-base leading-snug mt-1 group-hover:text-primary transition-colors truncate" title={c.subjectName}>
                        {c.subjectName}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1.5 font-medium flex items-center gap-1">
                        <span className="font-bold text-muted-foreground/60">Mã môn:</span> {c.subjectCode}
                      </p>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-border/50" />

                    {/* Details Info */}
                    <div className="space-y-2.5 text-xs text-muted-foreground/95">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-muted-foreground/75">Giảng viên:</span>
                        <span className="font-semibold text-foreground">{c.lecturerName || 'Chưa phân công'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-muted-foreground/75">Trạng thái xếp lớp:</span>
                        <Badge variant="outline" className={`text-[10px] font-bold border rounded-[6px] px-2 py-0.5 ${getLvlColor(currentLevel)}`}>
                          {getLvlLabel(currentLevel)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <CardFooter className="bg-muted/15 p-4 border-t border-border/40 flex flex-col gap-3">
                    {currentLevel === null ? (
                      <div className="w-full space-y-2">
                        <div className="p-2.5 bg-amber-50/50 border border-amber-100 rounded-xl text-center">
                          <p className="text-[10.5px] leading-relaxed text-amber-700 font-medium">
                            Bạn cần hoàn thành bài kiểm tra phân loại đầu vào để mở khóa lộ trình học.
                          </p>
                        </div>
                        <Button
                          onClick={() => navigate(`/student/classroom-subjects/${c.classroomSubjectId}/placement`)}
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                        >
                          <Play className="size-3.5 fill-current" /> Làm bài test đầu vào
                        </Button>
                      </div>
                    ) : (
                      <div className="w-full flex items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/student/classroom-subjects/${c.classroomSubjectId}/level-history`)}
                          className="flex-1 bg-card text-foreground border border-border/80 hover:bg-accent font-semibold rounded-lg text-xs py-2 px-3 h-9 flex items-center justify-center transition-all cursor-pointer"
                          title="Lịch sử thay đổi mức"
                        >
                          <History className="size-3.5 mr-1" /> Lịch sử
                        </Button>
                        <Button
                          onClick={() => handleOpenRoadmap(c)}
                          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg text-xs py-2 px-3 h-9 flex items-center justify-center gap-1 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                        >
                          <TrendingUp className="size-3.5" /> Lộ trình học
                        </Button>
                      </div>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Roadmap Graph Modal */}
      <Dialog open={isRoadmapOpen} onOpenChange={setIsRoadmapOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b border-slate-100 shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
              <TrendingUp className="size-5 text-primary" /> Lộ trình học tập cá nhân hóa
            </DialogTitle>
            <DialogDescription>
              Lớp môn: <span className="font-semibold text-slate-700">{selectedSubject?.displayName || selectedSubject?.subjectName}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loadingGraph ? (
              <div className="flex flex-col items-center justify-center py-20 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-xs text-slate-500 font-medium">Đang tải sơ đồ lộ trình học...</span>
              </div>
            ) : nodes.length === 0 ? (
              <div className="text-center py-16 text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold">Chưa có bài học nào được cấu hình trong lộ trình này.</p>
              </div>
            ) : (
              <div className="relative pl-6 border-l border-slate-200 space-y-8 py-2">
                {nodes.map((node, index) => {
                  const isCompleted = node.studentStatus === 'COMPLETED';
                  const isOpen = node.studentStatus === 'OPEN' || node.studentStatus === 'IN_PROGRESS';
                  const isLocked = !node.studentStatus || node.studentStatus === 'LOCKED';
                  
                  const isExpanded = expandedNodeId === node.nodeId;

                  return (
                    <div key={node.nodeId} className="relative">
                      {/* Timeline Dot Indicator */}
                      <span className={`absolute -left-[35px] top-1.5 flex h-6 w-6 items-center justify-center rounded-full border ring-4 ring-white shrink-0 z-10 transition-colors ${
                        isCompleted 
                          ? 'bg-emerald-50 border-emerald-350 text-emerald-600'
                          : isOpen 
                            ? 'bg-blue-50 border-blue-350 text-blue-600 animate-pulse'
                            : 'bg-slate-100 border-slate-300 text-slate-400'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle2 className="size-3.5 fill-emerald-50" />
                        ) : isLocked ? (
                          <Lock className="size-3" />
                        ) : (
                          <Circle className="size-2 fill-current" />
                        )}
                      </span>

                      {/* Content Card */}
                      <Card className={`border transition-all ${
                        isOpen 
                          ? 'border-blue-200 shadow-sm bg-blue-50/10' 
                          : isCompleted 
                            ? 'border-slate-200 shadow-none bg-slate-50/10'
                            : 'border-slate-150 opacity-75 shadow-none bg-slate-50/30'
                      } rounded-xl`}>
                        <div 
                          onClick={() => handleToggleNode(node.nodeId, node.studentStatus)}
                          className={`p-4 flex justify-between items-start cursor-pointer select-none`}
                        >
                          <div className="flex-1 space-y-1 pr-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className={`text-[9px] font-bold px-1.5 rounded-[4px] ${
                                node.nodeType === 'AT_HOME' 
                                  ? 'bg-purple-50 border-purple-200 text-purple-700' 
                                  : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                              }`}>
                                {node.nodeType === 'AT_HOME' ? 'Tự học' : 'Lên lớp'}
                              </Badge>
                              {node.isRequired && (
                                <Badge variant="outline" className="text-[9px] font-bold px-1.5 rounded-[4px] bg-slate-50 border-slate-200 text-slate-600">
                                  Bắt buộc
                                </Badge>
                              )}
                              {isCompleted && (
                                <Badge variant="outline" className="text-[9px] font-bold px-1.5 rounded-[4px] bg-emerald-50 border-emerald-200 text-emerald-700">
                                  Đã hoàn thành
                                </Badge>
                              )}
                              {isOpen && (
                                <Badge variant="outline" className="text-[9px] font-bold px-1.5 rounded-[4px] bg-blue-50 border-blue-200 text-blue-700">
                                  Đang học
                                </Badge>
                              )}
                            </div>
                            <h4 className="font-extrabold text-slate-800 text-sm leading-snug pt-1">{node.title}</h4>
                            {node.description && (
                              <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-2 mt-1">
                                {node.description}
                              </p>
                            )}
                          </div>
                          {!isLocked && (
                            <div className="text-slate-400 hover:text-slate-600 pt-0.5 shrink-0">
                              {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                            </div>
                          )}
                        </div>

                        {/* Expanded details (Materials and tests) */}
                        {isExpanded && !isLocked && (
                          <div className="p-4 pt-0 border-t border-slate-100 bg-white/50 rounded-b-xl space-y-4 text-xs">
                            {loadingNodeContent[node.nodeId] ? (
                              <div className="flex items-center justify-center py-6 gap-2">
                                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                <span className="text-slate-455 text-[11px] font-medium">Đang tải nội dung bài học...</span>
                              </div>
                            ) : (
                              <div className="space-y-4 pt-4 divide-y divide-slate-100">
                                {/* Materials */}
                                {nodeContents[node.nodeId]?.materials && nodeContents[node.nodeId].materials.length > 0 && (
                                  <div className="space-y-2">
                                    <h5 className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-400">
                                      <FileText className="size-3.5" /> Tài liệu học tập
                                    </h5>
                                    <div className="space-y-2 pl-0.5">
                                      {nodeContents[node.nodeId].materials.map((m) => (
                                        <div key={m.materialId} className="p-2.5 border border-slate-100 bg-white rounded-xl">
                                          <div className="flex items-center justify-between gap-3">
                                            <span className="font-bold text-slate-750 block">{m.title}</span>
                                            {m.video?.durationSeconds ? (
                                              <span className="text-[10px] text-slate-400 font-medium shrink-0">
                                                {Math.round((m.video.durationSeconds || 0) / 60)} phút
                                              </span>
                                            ) : null}
                                          </div>
                                          <MaterialPreview material={m} />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Tests */}
                                {nodeContents[node.nodeId]?.tests && nodeContents[node.nodeId].tests.length > 0 && (
                                  <div className="space-y-2 pt-4">
                                    <h5 className="font-bold text-slate-755 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-400">
                                      <Award className="size-3.5" /> Bài kiểm tra đánh giá
                                    </h5>
                                    <div className="space-y-2 pl-0.5">
                                      {nodeContents[node.nodeId].tests.map((t) => (
                                        <div key={t.testId} className="flex items-center justify-between p-2.5 border border-slate-100 bg-white rounded-xl gap-4">
                                          <div className="flex-1 space-y-0.5">
                                            <span className="font-bold text-slate-750 block">{t.title}</span>
                                            <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                                              <span>Thời gian: {t.durationMinutes} phút</span>
                                              <span>•</span>
                                              <span>Yêu cầu đạt: {t.passingPercentage}%</span>
                                            </div>
                                          </div>
                                          <Button
                                            onClick={() => navigate(`/student/tests/${t.testId}?csId=${selectedSubject?.classroomSubjectId}`)}
                                            className="h-7 px-3 text-[10px] bg-primary hover:bg-primary/95 text-white font-bold rounded-lg flex items-center gap-1 shrink-0"
                                          >
                                            Vào thi <ArrowRight className="size-3" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Empty state for content */}
                                {(!nodeContents[node.nodeId]?.materials || nodeContents[node.nodeId].materials.length === 0) &&
                                 (!nodeContents[node.nodeId]?.tests || nodeContents[node.nodeId].tests.length === 0) && (
                                  <div className="text-center py-6 text-slate-400 italic">
                                    Bài học này chưa có nội dung tài liệu hoặc bài kiểm tra.
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </Card>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className="p-4 border-t border-slate-100 shrink-0 sm:justify-end">
            <Button type="button" onClick={() => setIsRoadmapOpen(false)} className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-xs py-2 px-4 shadow-sm">
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
