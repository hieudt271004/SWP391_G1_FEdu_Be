import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card';
import { ArrowLeft, Loader2, AlertCircle, GraduationCap, Map } from 'lucide-react';
import { teacherService } from '../../../services/teacher.service';
import { Classroom } from '../../../types/teacher';
import { Subject } from '../../../types/subject';
import { useAuth } from '../../../context/AuthContext';
import { learningPathService, LearningNodeResponse } from '../../../services/learningPath.service';
import { LearningPathFlow } from '../../../components/learningPath/LearningPathFlow';
import { Badge } from '../../../components/ui/badge';

export function CourseClassroomsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subjectId } = useParams<{ subjectId: string }>();
  const [searchParams] = useSearchParams();
  const view = searchParams.get('view');
  const pathId = searchParams.get('pathId');

  const [subject, setSubject] = useState<Subject | null>(null);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  
  // Template graph states for view details
  const [templateNodes, setTemplateNodes] = useState<LearningNodeResponse[]>([]);
  const [templateEdges, setTemplateEdges] = useState<any[]>([]);
  const [loadingTemplateGraph, setLoadingTemplateGraph] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPageData = async () => {
      if (!subjectId || !user?.userId) return;

      try {
        setLoading(true);
        setError(null);

        const subjectData = await teacherService.getSubjectById(Number(subjectId));
        if (!subjectData) throw new Error('môn học không tồn tại hoặc dữ liệu không hợp lệ');
        setSubject(subjectData);

        if (view === 'template' && pathId) {
          setLoadingTemplateGraph(true);
          try {
            const graph = await learningPathService.getLearningPathGraph(Number(pathId));
            setTemplateNodes(graph.nodes || []);
            setTemplateEdges(graph.edges || []);
          } catch (err) {
            console.error('Error fetching template graph:', err);
          } finally {
            setLoadingTemplateGraph(false);
          }
        } else {
          const rawClassrooms = await teacherService.getClassroomsByTeacher(user.userId);
          const filtered = (rawClassrooms ?? []).filter((c) => c.subjectId === Number(subjectId));
          const mapped = filtered.map((c) => ({
            classroomSubjectId: c.classroomSubjectId,
            classroomId: c.classroomId,
            classroomCode: c.className,
            classroomName: c.className,
            subjectId: c.subjectId,
            teacherId: c.lecturerId ?? 0,
            semester: 'Summer 2026',
            year: new Date().getFullYear(),
          }));
          setClassrooms(mapped);
        }
      } catch (err: any) {
        console.error('Lỗi khi tải chi tiết môn học:', err);
        setError(err.response?.data?.message || err.message || 'Không thể tải chi tiết môn học');
      } finally {
        setLoading(false);
      }
    };

    fetchPageData();
  }, [subjectId, user, view, pathId]);

  const handleEnterClass = (classroomSubjectId: number) => {
    navigate(`/teacher/classroom-subjects/${classroomSubjectId}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Đang tải thông tin chi tiết môn học...</span>
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="text-center py-12 text-destructive">
        <AlertCircle className="w-10 h-10 mx-auto mb-2 text-destructive" />
        <p className="mb-4 text-sm font-semibold">{error || 'Không tìm thấy môn học'}</p>
        <Button onClick={() => navigate('/teacher/courses')} variant="outline">
          Quay lại danh sách môn học
        </Button>
      </div>
    );
  }

  // Filter classrooms taught by this teacher only
  const myClassrooms = classrooms.filter(
    (c) => c.teacherId === user?.userId
  );

  return (
    <div className="space-y-8 text-foreground bg-background">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/teacher/courses')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{subject.subjectCode} - {subject.subjectName}</h1>
          <p className="text-sm text-muted-foreground">
            {view === 'template' ? 'Chi tiết lộ trình học tập gốc' : 'Chi tiết môn học và danh sách lớp giảng dạy'}
          </p>
        </div>
      </div>

      {/* Description */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mô tả môn học</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="leading-relaxed text-sm text-foreground">
            {subject.description || 'Không có mô tả chi tiết cho môn học này.'}
          </p>
        </CardContent>
      </Card>

      {view === 'template' ? (
        /* Template learning path view */
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Map className="w-5 h-5 text-foreground" />
            <h2 className="text-lg font-bold text-foreground">Sơ đồ lộ trình học tập gốc (Template)</h2>
          </div>
          {loadingTemplateGraph ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-auto rounded-xl border border-border bg-accent/25 p-3 lg:max-h-[calc(100vh-2rem)]">
              <LearningPathFlow
                nodes={templateNodes}
                edges={templateEdges}
                selectedNodeId={null}
                onNodeClick={() => {}}
              />
            </div>
          )}
        </div>
      ) : (
        /* Classrooms Section */
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-foreground" />
              <h2 className="text-lg font-bold text-foreground">Danh sách lớp học phụ trách</h2>
            </div>
          </div>

          {myClassrooms.length === 0 ? (
            <div className="text-center py-8 bg-card text-muted-foreground rounded-xl border border-border text-sm">
              Bạn chưa phụ trách lớp học nào cho môn học này.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {myClassrooms.map((classroom) => (
                <Card key={classroom.classroomSubjectId || classroom.classroomId} className="hover:shadow-sm transition-all border-l-4 border-l-primary flex flex-col justify-between">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-bold text-foreground">{classroom.classroomName}</CardTitle>
                      <Badge variant="outline" className="px-2 py-0.5 rounded text-[10px] font-semibold border-transparent bg-secondary text-secondary-foreground">
                        Lớp bạn dạy
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pb-2">
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      {classroom.semester && <div>Học kỳ: <span className="font-semibold text-foreground">{classroom.semester}</span></div>}
                      {classroom.year && <div>Năm học: <span className="font-semibold text-foreground">{classroom.year}</span></div>}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2 border-t border-border">
                    <Button
                      className="w-full text-xs font-semibold py-1.5"
                      onClick={() => handleEnterClass(classroom.classroomSubjectId || classroom.classroomId)}
                    >
                      Vào quản lý lớp
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}