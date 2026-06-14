import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card';
import { ArrowLeft, Loader2, AlertCircle, GraduationCap, Map, ChevronRight, CheckCircle2, Circle, HelpCircle, Video as VideoIcon, FileText, BookOpen } from 'lucide-react';
import { teacherService } from '../../../services/teacher.service';
import { learningPathService, LearningPathResponse } from '../../../services/learningPath.service';
import { Classroom } from '../../../types/teacher';
import { Subject } from '../../../types/subject';
import { useAuth } from '../../../context/AuthContext';

export function CourseClassroomsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subjectId } = useParams<{ subjectId: string }>();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [learningPaths, setLearningPaths] = useState<LearningPathResponse[]>([]);

  const [selectedPathId, setSelectedPathId] = useState<number | null>(null);
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [nodeContents, setNodeContents] = useState<Record<number, any>>({});
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubjectDetails = async () => {
      if (!subjectId || !user?.userId) return;

      try {
        setLoading(true);
        setError(null);

        const subjectData = await teacherService.getSubjectById(Number(subjectId));   // bỏ khối if lồng
        if (!subjectData) throw new Error('môn học không tồn tại hoặc dữ liệu không hợp lệ');
        setSubject(subjectData);
        const rawClassrooms = await teacherService.getClassroomsBySubject(Number(subjectId));
        const mapped = (rawClassrooms ?? []).map((c) => ({
          classroomId: c.classroomId,
          classroomCode: c.className,
          classroomName: c.className,
          subjectId: c.subjectId,
          teacherId: c.lecturerId ?? 0,
          semester: c.semester ?? '',
          year: c.createdAt ? new Date(c.createdAt).getFullYear() : new Date().getFullYear(),
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        }));
        setClassrooms(mapped);

        // Fetch learning paths list individually
        try {
          const rawPaths = await learningPathService.getSubjectLearningPaths(Number(subjectId));
          if (Array.isArray(rawPaths)) {
            setLearningPaths(rawPaths);
            const published = rawPaths.filter(p => p.publishedAt !== null);
            if (published.length > 0) {
              setSelectedPathId(published[0].pathId);
            }
          } else {
            setLearningPaths([]);
          }
        } catch (pathsErr) {
          console.error('Lỗi khi tải lộ trình học tập:', pathsErr);
          setLearningPaths([]);
        }
      } catch (err: any) {
        console.error('Lỗi khi tải chi tiết môn học:', err);
        setError(err.response?.data?.message || err.message || 'Không thể tải chi tiết môn học');
      } finally {
        setLoading(false);
      }
    };

    fetchSubjectDetails();
  }, [subjectId, user]);

  useEffect(() => {
    const fetchGraph = async () => {
      if (!selectedPathId) return;
      try {
        setLoadingGraph(true);
        const graph = await learningPathService.getLearningPathGraph(selectedPathId);
        setNodes(graph.nodes || []);
        setEdges(graph.edges || []);
      } catch (err) {
        console.error('Failed to load roadmap graph:', err);
      } finally {
        setLoadingGraph(false);
      }
    };
    fetchGraph();
  }, [selectedPathId]);

  const fetchNodeContent = async (nodeId: number) => {
    try {
      const content = await learningPathService.getTeacherNodeContent(nodeId);
      setNodeContents(prev => ({ ...prev, [nodeId]: content }));
    } catch (err) {
      console.error('Failed to load node content:', err);
    }
  };

  const toggleNode = (nodeId: number) => {
    const nextState = !expandedNodes[nodeId];
    setExpandedNodes(prev => ({ ...prev, [nodeId]: nextState }));
    if (nextState && !nodeContents[nodeId]) {
      fetchNodeContent(nodeId);
    }
  };

  const handleEnterClass = (classroomId: number) => {
    navigate(`/teacher/classrooms/${classroomId}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="text-sm text-gray-500">Đang tải thông tin chi tiết môn học...</span>
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
        <p className="text-red-600 mb-4">{error || 'Không tìm thấy môn học'}</p>
        <Button onClick={() => navigate('/teacher/courses')}>
          Quay lại danh sách môn học
        </Button>
      </div>
    );
  }

  // Filter classrooms taught by this teacher only
  const myClassrooms = classrooms.filter(
    (c) => c.teacherId === user?.userId
  );

  const publishedPaths = learningPaths.filter(path => path.publishedAt !== null);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/teacher/courses')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{subject.subjectCode} - {subject.subjectName}</h1>
          <p className="text-sm text-gray-500">Chi tiết môn học và lộ trình giảng dạy</p>
        </div>
      </div>

      {/* Description */}
      <Card className="bg-white border border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Mô tả môn học</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed text-sm">
            {subject.description || 'Không có mô tả chi tiết cho môn học này.'}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Learning Paths (Roadmaps) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
            <Map className="w-5 h-5 text-violet-600" />
            <h2 className="text-lg font-bold text-gray-900">Lộ trình học tập (Roadmaps)</h2>
          </div>

          {publishedPaths.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-gray-200 text-gray-500 text-sm">
              Chưa có lộ trình học tập nào được xuất bản cho môn học này.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chọn lộ trình để xem chi tiết</label>
                <select
                  value={selectedPathId || ""}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setSelectedPathId(val);
                    setNodes([]);
                    setEdges([]);
                    setExpandedNodes({});
                    setNodeContents({});
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">-- Chọn lộ trình học tập --</option>
                  {publishedPaths.map((path) => (
                    <option key={path.pathId} value={path.pathId}>
                      {path.pathName}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPathId && (() => {
                const currentPath = publishedPaths.find(p => p.pathId === selectedPathId);
                return (
                  <div className="space-y-4 mt-4 animate-in fade-in duration-200">
                    <Card className="bg-slate-50/50 border border-slate-200/60 p-4">
                      <h3 className="font-bold text-sm text-slate-800">{currentPath?.pathName}</h3>
                      <p className="text-xs text-slate-500 mt-1">{currentPath?.description || "Không có mô tả chi tiết."}</p>
                    </Card>

                    {loadingGraph ? (
                      <div className="flex items-center justify-center py-8 gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                        <span className="text-xs text-slate-500">Đang tải cấu trúc lộ trình...</span>
                      </div>
                    ) : nodes.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-500 bg-white border border-dashed rounded-lg">
                        Không có bài học nào trong lộ trình này.
                      </div>
                    ) : (
                      <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 shadow-sm bg-white">
                        {nodes.map((node) => {
                          const isExpanded = !!expandedNodes[node.nodeId];
                          const incomingEdges = edges.filter((e) => e.toNodeId === node.nodeId);
                          const incomingNodesInfo = incomingEdges
                            .map((e) => {
                              const fromNode = nodes.find((n) => n.nodeId === e.fromNodeId);
                              return fromNode ? fromNode.title : `Bài học #${e.fromNodeId}`;
                            });

                          return (
                            <div key={node.nodeId} className={`transition-all duration-200 ${
                              node.nodeType === 'ON_CLASS' ? 'border-l-4 border-l-green-500 hover:bg-green-50/5' : 'border-l-4 border-l-gray-300 hover:bg-gray-50'
                            }`}>
                              {/* Accordion Header */}
                              <div
                                onClick={() => toggleNode(node.nodeId)}
                                className="flex items-center justify-between p-3.5 cursor-pointer select-none"
                              >
                                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                  <div className={`p-0.5 rounded transition-transform duration-200 shrink-0 ${isExpanded ? "rotate-90" : ""}`}>
                                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-semibold text-xs text-gray-800">
                                        {node.title}
                                      </span>
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium">
                                        {node.nodeType === "ON_CLASS" ? "Lên lớp" : "Tự học"}
                                      </span>
                                      {node.isRequired && (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-50 text-red-650 border border-red-100 font-medium">
                                          Bắt buộc
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider pl-3">
                                  Thứ tự: {node.displayOrder}
                                </div>
                              </div>

                              {/* Accordion Body */}
                              {isExpanded && (
                                <div className="px-4 pb-4 pt-1 bg-slate-50/30 border-t border-slate-100 space-y-3">
                                  <p className="text-xs text-slate-600 leading-relaxed pt-1">
                                    {node.description || "Chưa có mô tả chi tiết."}
                                  </p>

                                  {/* Prerequisites list */}
                                  {incomingNodesInfo.length > 0 && (
                                    <div className="text-[11px] text-slate-500 bg-white border border-slate-105 p-2 rounded-lg flex items-start gap-1.5">
                                      <ChevronRight className="w-3 h-3 text-indigo-550 shrink-0 mt-0.5" />
                                      <div>
                                        <span className="font-semibold text-slate-700">Điều kiện tiên quyết: </span>
                                        {incomingNodesInfo.join(", ")}
                                      </div>
                                    </div>
                                  )}

                                  {/* Timeline Materials & Tests */}
                                  <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-2">
                                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 pb-1 border-b border-slate-100">
                                      <BookOpen className="w-3.5 h-3.5 text-indigo-650" />
                                      Nội dung học tập
                                    </div>

                                    {!nodeContents[node.nodeId] ? (
                                      <div className="flex items-center gap-2 py-2 text-[11px] text-slate-450">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        Đang tải nội dung...
                                      </div>
                                    ) : (() => {
                                      const content = nodeContents[node.nodeId];
                                      const materials = (content.materials || []).map((m: any) => ({ ...m, _type: 'MATERIAL' }));
                                      const tests = (content.tests || []).map((t: any) => ({ ...t, _type: 'TEST' }));
                                      const allItems = [...materials, ...tests].sort((a, b) => (a.orderIndex || 9999) - (b.orderIndex || 9999));

                                      if (allItems.length === 0) {
                                        return (
                                          <div className="text-[11px] text-slate-400 italic py-2 text-center">
                                            Chưa có tài liệu hoặc bài kiểm tra nào.
                                          </div>
                                        );
                                      }

                                      return (
                                        <div className="space-y-2 pt-1">
                                          {allItems.map((item: any) => {
                                            const isMaterial = item._type === 'MATERIAL';
                                            return (
                                              <div key={isMaterial ? `m-${item.materialId}` : `t-${item.testId}`} className="flex items-start gap-2 p-2 bg-slate-50/50 rounded border border-slate-100 text-xs">
                                                <div className="flex-1 pr-1 min-w-0 space-y-1">
                                                  <div className="font-semibold text-slate-800 flex items-center gap-1.5 flex-wrap">
                                                    {isMaterial ? (
                                                      <>
                                                        <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                                        <span className="truncate">{item.title}</span>
                                                        {item.required && (
                                                          <span className="text-[8px] px-1 bg-red-50 text-red-500 rounded font-bold border border-red-100">Bắt buộc</span>
                                                        )}
                                                      </>
                                                    ) : (
                                                      <>
                                                        <GraduationCap className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                                                        <span className="truncate">{item.title}</span>
                                                      </>
                                                    )}
                                                  </div>

                                                  {isMaterial && item.video && (
                                                    <div className="text-slate-500 flex items-center gap-1.5 flex-wrap text-[10px]">
                                                      <span className="px-1 bg-teal-50 text-teal-700 border border-teal-100 rounded text-[8px] font-semibold">Video</span>
                                                      <a href={item.video.videoUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline truncate max-w-[180px]">
                                                        {item.video.videoUrl}
                                                      </a>
                                                    </div>
                                                  )}

                                                  {isMaterial && item.file && (
                                                    <div className="text-slate-500 flex items-center gap-1.5 flex-wrap text-[10px]">
                                                      <span className="px-1 bg-orange-50 text-orange-700 border border-orange-100 rounded text-[8px] font-semibold">File</span>
                                                      <a href={item.file.fileUrl.startsWith("/") ? `http://localhost:8080${item.file.fileUrl}` : item.file.fileUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline truncate max-w-[180px]">
                                                        {item.file.fileName || "Tải tài liệu"}
                                                      </a>
                                                    </div>
                                                  )}

                                                  {!isMaterial && (
                                                    <div className="text-[10px] text-slate-500">
                                                      Thời gian: <span className="font-semibold text-slate-700">{item.durationMinutes || "—"} phút</span>
                                                      {item.passingPercentage !== undefined && (
                                                        <span className="ml-3">Đạt chuẩn: <span className="font-semibold text-slate-700">{item.passingPercentage}%</span></span>
                                                      )}
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Right Column: Classrooms */}
        <div id="classrooms-section" className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-gray-900">Danh sách lớp học</h2>
            </div>
          </div>

          {myClassrooms.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-gray-200 text-gray-500 text-sm">
              Bạn chưa phụ trách lớp học nào cho môn học này.
            </div>
          ) : (
            <div className="space-y-4">
              {myClassrooms.map((classroom) => {
                return (
                  <Card key={classroom.classroomId} className="hover:shadow-sm transition-all border-l-4 border-l-emerald-500">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-bold text-emerald-950">{classroom.classroomName}</CardTitle>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[10px] font-semibold">
                          Lớp bạn dạy
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        {classroom.semester && <div>Học kỳ: <span className="font-semibold text-gray-700">{classroom.semester}</span></div>}
                        {classroom.year && <div>Năm học: <span className="font-semibold text-gray-700">{classroom.year}</span></div>}
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2 border-t border-gray-50">
                      <Button
                        className="w-full text-xs font-semibold py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                        onClick={() => handleEnterClass(classroom.classroomId)}
                      >
                        Vào quản lý lớp
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}