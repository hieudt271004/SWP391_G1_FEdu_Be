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
  TrendingUp, 
  User, 
  Mail, 
  ChevronRight, 
  ChevronDown, 
  PlayCircle,
  FileDown,
  BookMarked,
  Search,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { classroomService } from '../../services/classroom.service';
import { studentService } from '../../services/student.service';
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

export function StudentCoursesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [subjects, setSubjects] = useState<ClassroomSubjectResponse[]>([]);
  const [subjectLevels, setSubjectLevels] = useState<Record<number, number | null>>({});
  const [subjectProgress, setSubjectProgress] = useState<Record<number, { completed: number; total: number }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Roadmap Modal State
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<ClassroomSubjectResponse | null>(null);
  const [nodes, setNodes] = useState<LearningNodeResponse[]>([]);
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [expandedNodeId, setExpandedNodeId] = useState<number | null>(null);
  const [nodeContents, setNodeContents] = useState<Record<number, NodeContentResponse>>({});
  const [loadingNodeContent, setLoadingNodeContent] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchCoursesData = async () => {
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

        // Load level history and graph progress for each subject in parallel
        const levelsMap: Record<number, number | null> = {};
        const progressMap: Record<number, { completed: number; total: number }> = {};

        await Promise.all(
          (enrolledSubjects || []).map(async (s) => {
            // Fetch level history
            try {
              const history = await studentService.getLevelHistory(s.classroomSubjectId);
              if (history && history.length > 0) {
                const latest = history[history.length - 1];
                levelsMap[s.classroomSubjectId] = latest.newLevel;
              } else {
                levelsMap[s.classroomSubjectId] = null;
              }
            } catch {
              levelsMap[s.classroomSubjectId] = null;
            }

            // Fetch graph to calculate node progress
            try {
              const graph = await studentService.getClassroomSubjectGraph(s.classroomSubjectId);
              if (graph && graph.nodes && graph.nodes.length > 0) {
                const completedCount = graph.nodes.filter(n => n.studentStatus === 'COMPLETED').length;
                progressMap[s.classroomSubjectId] = {
                  completed: completedCount,
                  total: graph.nodes.length
                };
              } else {
                progressMap[s.classroomSubjectId] = { completed: 0, total: 0 };
              }
            } catch {
              progressMap[s.classroomSubjectId] = { completed: 0, total: 0 };
            }
          })
        );

        setSubjectLevels(levelsMap);
        setSubjectProgress(progressMap);
      } catch (err: any) {
        console.error('Error fetching student courses:', err);
        setError(err.response?.data?.message || 'Không thể tải danh sách khóa học. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchCoursesData();
  }, [user?.userId]);

  const handleOpenRoadmap = async (cs: ClassroomSubjectResponse) => {
    setSelectedSubject(cs);
    setIsRoadmapOpen(true);
    setLoadingGraph(true);
    setExpandedNodeId(null);
    setNodeContents({});
    try {
      const graph = await studentService.getClassroomSubjectGraph(cs.classroomSubjectId);
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
    if (nodeContents[nodeId]) return;

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

  const filteredSubjects = subjects.filter(
    (c) =>
      c.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subjectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.className.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-9 h-9 animate-spin text-[#030213]" />
        <span className="text-sm text-slate-500 font-medium">Đang tải danh sách khóa học của bạn...</span>
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
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <BookMarked className="w-6 h-6 text-primary" /> Khóa học của tôi
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Xem và quản lý tất cả các môn học bạn đang tham gia trong học kỳ này.
          </p>
        </div>
        
        {/* Search bar */}
        <div className="relative w-full sm:w-64">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search className="size-4" />
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm môn học..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white placeholder-slate-400 text-slate-850"
          />
        </div>
      </div>

      {/* Courses Cards Grid */}
      {filteredSubjects.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
          <BookOpen className="size-12 text-slate-350 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-semibold">Không tìm thấy khóa học nào phù hợp.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map((c) => {
            const currentLevel = subjectLevels[c.classroomSubjectId];
            const progress = subjectProgress[c.classroomSubjectId] || { completed: 0, total: 0 };
            
            const progressPercent = progress.total > 0 
              ? Math.round((progress.completed / progress.total) * 100) 
              : 0;

            const getLvlLabel = (lvl: number | null | undefined) => {
              if (lvl === 1) return 'Yếu';
              if (lvl === 2) return 'Trung bình';
              if (lvl === 3) return 'Khá';
              return 'Chưa phân loại';
            };

            const getLvlColor = (lvl: number | null | undefined) => {
              if (lvl === 1) return 'bg-rose-50 border-rose-200 text-rose-700';
              if (lvl === 2) return 'bg-amber-50 border-amber-200 text-amber-700';
              if (lvl === 3) return 'bg-emerald-50 border-emerald-200 text-emerald-700';
              return 'bg-slate-100 border-slate-200 text-slate-550';
            };

            return (
              <Card key={c.classroomSubjectId} className="bg-white border border-slate-150 shadow-xs rounded-2xl hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
                {/* Visual Accent Header */}
                <div className="h-2 bg-gradient-to-r from-[#030213] to-slate-800" />
                
                <div className="p-5 space-y-4">
                  {/* Subject details */}
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Lớp: {c.className}</span>
                      <Badge variant="outline" className={`text-[9px] font-extrabold border rounded-[6px] px-2 py-0.5 ${getLvlColor(currentLevel)}`}>
                        {getLvlLabel(currentLevel)}
                      </Badge>
                    </div>
                    <h3 className="font-extrabold text-slate-800 text-base leading-snug mt-1.5 truncate" title={c.subjectName}>
                      {c.subjectName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1">
                      <span className="font-bold text-slate-400">Mã môn:</span> {c.subjectCode}
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-100" />

                  {/* Progress section (Only shown if classified) */}
                  {currentLevel !== null && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-slate-400">Tiến độ hoàn thành:</span>
                        <span className="font-bold text-slate-700">{progressPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-[#030213] h-full rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        Đã hoàn thành {progress.completed}/{progress.total} bài học của lộ trình.
                      </div>
                    </div>
                  )}

                  {/* Teacher Info */}
                  <div className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 bg-slate-50/50 text-xs">
                    <div className="size-8 rounded-full bg-[#030213]/5 text-[#030213] flex items-center justify-center font-bold border border-[#030213]/10 shrink-0">
                      {c.lecturerName ? c.lecturerName.split(' ').pop()?.charAt(0).toUpperCase() : 'GV'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block leading-none">Giảng viên</span>
                      <span className="font-bold text-slate-700 block truncate mt-1">{c.lecturerName || 'Chưa phân công'}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <CardFooter className="bg-slate-50/50 p-4 border-t border-slate-100 flex flex-col gap-3">
                  {currentLevel === null ? (
                    <div className="w-full space-y-2">
                      <div className="p-2.5 bg-amber-50/50 border border-amber-100 rounded-xl text-center">
                        <p className="text-[10.5px] leading-relaxed text-amber-700 font-medium">
                          Môn học này yêu cầu làm bài kiểm tra phân loại đầu vào để nhận lộ trình cá nhân hóa.
                        </p>
                      </div>
                      <Button
                        onClick={() => navigate(`/student/classroom-subjects/${c.classroomSubjectId}/placement`)}
                        className="w-full bg-[#030213] hover:bg-[#1c1b2d] text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Play className="size-3.5 fill-current" /> Bắt đầu kiểm tra phân loại
                      </Button>
                    </div>
                  ) : (
                    <div className="w-full flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/student/classroom-subjects/${c.classroomSubjectId}/level-history`)}
                        className="flex-1 text-[#030213] border-slate-200 hover:bg-slate-100 font-semibold rounded-xl text-xs py-2 px-3 h-9"
                      >
                        <History className="size-3.5 mr-1" /> Lịch sử mức
                      </Button>
                      <Button
                        onClick={() => handleOpenRoadmap(c)}
                        className="flex-1 bg-[#030213] hover:bg-[#1c1b2d] text-white font-bold rounded-xl text-xs py-2 px-3 h-9 flex items-center justify-center gap-1 shadow-xs"
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
                                        <div key={m.materialId} className="flex items-center justify-between p-2.5 border border-slate-100 bg-white rounded-xl gap-4">
                                          <div className="flex-1 space-y-0.5">
                                            <span className="font-bold text-slate-750 block">{m.title}</span>
                                            {m.video && (
                                              <span className="text-[10px] text-slate-400 block font-medium">
                                                Thời lượng: {Math.round((m.video.durationSeconds || 0) / 60)} phút (Video bài giảng)
                                              </span>
                                            )}
                                            {m.file && (
                                              <span className="text-[10px] text-slate-400 block font-medium">
                                                Tệp tải xuống ({m.file.fileType || 'PDF/Tài liệu'})
                                              </span>
                                            )}
                                          </div>
                                          {m.video && (
                                            <a 
                                              href={m.video.videoUrl} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="h-7 px-3 text-[10px] bg-primary hover:bg-primary/95 text-white font-bold rounded-lg flex items-center gap-1 shrink-0"
                                            >
                                              <PlayCircle className="size-3.5 fill-current" /> Xem bài giảng
                                            </a>
                                          )}
                                          {m.file && (
                                            <a 
                                              href={m.file.fileUrl} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              download
                                              className="h-7 px-3 text-[10px] border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-bold rounded-lg flex items-center gap-1 shrink-0"
                                            >
                                              <FileDown className="size-3.5" /> Tải tài liệu
                                            </a>
                                          )}
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
                                            disabled={node.testLocked}
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
