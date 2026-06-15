import { useEffect, useState } from 'react';
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
  Undo2
} from 'lucide-react';
import { teacherService } from '../../../services/teacher.service';
import { classroomService } from '../../../services/classroom.service';
import { 
  learningPathService, 
  LearningNodeResponse, 
  ClassroomGraphResponse 
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
  const [nodes, setNodes] = useState<LearningNodeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [classroomStatus, setClassroomStatus] = useState<string>('inactive');
  const [parentClassroomId, setParentClassroomId] = useState<number | null>(null);

  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({});
  
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

  const toggleNode = (nodeId: number) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
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
      setNodes(graph.nodes || []);

      // Expand the first node by default if available
      if (graph.nodes && graph.nodes.length > 0) {
        setExpandedNodes({ [graph.nodes[0].nodeId]: true });
      }
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
      alert(err.response?.data?.message || 'Cập nhật trạng thái thất bại');
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
            setNodes(graph.nodes || []);
          })
          .catch(err => console.error('Error auto-refreshing graph:', err));
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [classroomSubjectId]);

  const handleClone = async () => {
    if (!classroomSubjectId || !selectedTemplateId) return;
    try {
      setActionState('cloning');
      await learningPathService.cloneFromTemplate(Number(classroomSubjectId), selectedTemplateId);
      
      // Refetch classroom graph
      const updatedGraph = await learningPathService.getClassroomGraph(Number(classroomSubjectId));
      setGraphData(updatedGraph);
      setNodes(updatedGraph.nodes || []);
      if (updatedGraph.nodes && updatedGraph.nodes.length > 0) {
        setExpandedNodes({ [updatedGraph.nodes[0].nodeId]: true });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to clone learning path');
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
      setNodes(updatedGraph.nodes || []);
      setShowPublishConfirm(false);
      setUnderstandPublish(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to publish learning path');
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
      setNodes(updatedGraph.nodes || []);
      setShowUnpublishConfirm(false);
      setUnderstandUnpublish(false);
    } catch (err: any) {
      if (err.response?.status === 409) {
        setUnpublishErrorMsg(err.response?.data?.message || 'Không thể unpublish — đã có học sinh hoàn thành node.');
        setShowUnpublishError(true);
      } else {
        alert(err.response?.data?.message || 'Failed to unpublish learning path');
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
      setNodes(updatedGraph.nodes || []);
      setSelectedTemplateId(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete draft');
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
              <h2 className="text-lg font-semibold text-indigo-900">Chọn template để bắt đầu</h2>
              <p className="text-sm text-muted-foreground">Lớp học này chưa cấu hình lộ trình. Vui lòng chọn một lộ trình mẫu từ khoa.</p>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto shrink-0 flex-wrap">
              {graphData.availableTemplates && graphData.availableTemplates.length > 0 ? (
                <>
                  <select 
                    id="template-select"
                    className="flex h-9 w-full md:w-64 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                    value={selectedTemplateId || ''}
                    onChange={(e) => setSelectedTemplateId(Number(e.target.value) || null)}
                    disabled={isNonIdle}
                  >
                    <option value="">-- Chọn lộ trình mẫu --</option>
                    {graphData.availableTemplates.map((t) => (
                      <option key={t.pathId} value={t.pathId}>
                        {t.pathName} ({t.nodeCount} bài học)
                      </option>
                    ))}
                  </select>
                  <Button 
                    onClick={handleClone} 
                    disabled={isNonIdle || !selectedTemplateId} 
                    className="w-full md:w-auto"
                  >
                    {actionState === 'cloning' ? <Loader className="size-4 animate-spin mr-1" /> : <Play className="size-4 mr-1" />}
                    Clone lộ trình
                  </Button>
                </>
              ) : (
                <div className="text-sm text-red-600 bg-red-50 py-2 px-3 rounded-md border border-red-100">
                  Môn học này chưa có template. Liên hệ admin. <a href="/contact" className="underline font-semibold hover:text-red-700">Liên hệ admin</a>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg font-bold text-slate-800">Lộ trình lớp học</CardTitle>
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
          </CardHeader>
          <CardContent>
            {nodes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Chưa cấu hình lộ trình. Chọn template ở trên để clone và bắt đầu.
              </div>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden divide-y divide-border shadow-sm">
                {nodes.map((node) => {
                  const isExpanded = !!expandedNodes[node.nodeId];

                  return (
                    <div
                      key={node.nodeId}
                      className={`transition-all duration-200 ${getNodeColorClass(node.status)}`}
                    >
                      {/* Header */}
                      <div
                        onClick={() => toggleNode(node.nodeId)}
                        className="flex items-center justify-between p-4 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`p-1 rounded transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-90' : ''}`}>
                            <ChevronRight className="size-4 text-muted-foreground" />
                          </div>
                          <div className="shrink-0">
                            {getNodeIcon(node.status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-semibold text-sm ${node.status === 'LOCKED' ? 'text-muted-foreground' : 'text-foreground'
                                }`}>
                                {node.title}
                              </span>
                              <Badge variant="outline" className="text-[10px] py-0 px-1 font-normal bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-indigo-200">
                                {node.nodeType === 'ON_CLASS' ? 'On Class' : 'At Home'}
                              </Badge>
                              {node.isRequired && (
                                <Badge className="text-[10px] py-0 px-1 font-normal bg-red-50 text-red-700 hover:bg-red-50 border-red-200" variant="outline">
                                  Required
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider pl-4 shrink-0">
                          {node.status}
                        </div>
                      </div>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 bg-muted/5 border-t border-muted/20">
                          <p className="text-sm text-muted-foreground mb-2">
                            {node.description || 'No description provided.'}
                          </p>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div>Display Order: <span className="font-semibold">{node.displayOrder}</span></div>
                            {node.branchName && <div>Branch: <span className="font-semibold">{node.branchName}</span></div>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Student List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Full Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-6 text-muted-foreground">
                      No students enrolled in this classroom.
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.id}</TableCell>
                      <TableCell>{student.fullName}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

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
