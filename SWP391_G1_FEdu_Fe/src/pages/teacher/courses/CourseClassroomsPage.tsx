import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card';
import { ArrowLeft, Loader2, AlertCircle, GraduationCap, Map } from 'lucide-react';
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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubjectDetails = async () => {
      if (!subjectId || !user?.userId) return;

      try {
        setLoading(true);
        setError(null);

        const subjectData = await teacherService.getSubjectById(Number(subjectId));   // bỏ khối if lồng
        if (!subjectData) throw new Error('khóa học không tồn tại hoặc dữ liệu không hợp lệ');
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
          // Service đã unwrap sẵn -> trả về mảng LearningPathResponse[]
          const rawPaths = await learningPathService.getSubjectLearningPaths(Number(subjectId));
          if (Array.isArray(rawPaths)) {
            setLearningPaths(rawPaths);
          } else {
            setLearningPaths([]);
          }
        } catch (pathsErr) {
          console.error('Lỗi khi tải lộ trình học tập:', pathsErr);
          setLearningPaths([]);
        }
      } catch (err: any) {
        console.error('Lỗi khi tải chi tiết khóa học:', err);
        setError(err.response?.data?.message || err.message || 'Không thể tải chi tiết khóa học');
      } finally {
        setLoading(false);
      }
    };

    fetchSubjectDetails();
  }, [subjectId, user]);

  const handleEnterClass = (classroomId: number) => {
    navigate(`/teacher/classrooms/${classroomId}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="text-sm text-gray-500">Đang tải thông tin chi tiết khóa học...</span>
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
        <p className="text-red-600 mb-4">{error || 'Không tìm thấy khóa học'}</p>
        <Button onClick={() => navigate('/teacher/courses')}>
          Quay lại danh sách khóa học
        </Button>
      </div>
    );
  }

  // Filter classrooms taught by this teacher only
  const myClassrooms = classrooms.filter(
    (c) => c.teacherId === user?.userId
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/teacher/courses')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{subject.subjectCode} - {subject.subjectName}</h1>
          <p className="text-sm text-gray-500">Chi tiết khóa học và lộ trình giảng dạy</p>
        </div>
      </div>

      {/* Description */}
      <Card className="bg-white border border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Mô tả khóa học</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed text-sm">
            {subject.description || 'Không có mô tả chi tiết cho khóa học này.'}
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

          {learningPaths.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-gray-200 text-gray-500 text-sm">
              Chưa có lộ trình học tập nào được thiết lập cho khóa học này.
            </div>
          ) : (
            <div className="space-y-4">
              {learningPaths.map((path) => (
                <Card key={path.pathId} className="hover:shadow-sm transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-violet-900 font-bold">{path.pathName}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-gray-500">
                      {path.description || 'Không có mô tả chi tiết lộ trình.'}
                    </p>
                    <div className="text-[10px] text-gray-400">
                      Được tạo ngày: {
                        path.createdAt ? (
                          Array.isArray(path.createdAt)
                            ? `${path.createdAt[2]}/${path.createdAt[1]}/${path.createdAt[0]}`
                            : new Date(path.createdAt).toLocaleDateString('vi-VN')
                        ) : 'N/A'
                      }
                    </div>
                  </CardContent>
                </Card>
              ))}
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
              Bạn chưa phụ trách lớp học nào cho khóa học này.
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