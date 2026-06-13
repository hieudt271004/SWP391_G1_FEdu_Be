import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card';
import { Loader2, GraduationCap, AlertCircle } from 'lucide-react';
import { teacherService } from '../../../services/teacher.service';
import { Classroom } from '../../../types/teacher';
import { useAuth } from '../../../context/AuthContext';

export function TeacherClassesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClassrooms = async () => {
      if (!user?.userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('Fetching classrooms for teacher ID:', user.userId);
        const classrooms = await teacherService.getClassroomsByTeacher(user.userId);
        const mapped = (classrooms ?? []).map((c) => ({
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
      } catch (err: any) {
        console.error('Lỗi khi tải danh sách lớp học:', err);
        setError(err.response?.data?.message || 'Không thể tải danh sách lớp học');
      } finally {
        setLoading(false);
      }
    };

    fetchClassrooms();
  }, [user]);

  const handleEnterClass = (classroomId: number) => {
    navigate(`/teacher/classrooms/${classroomId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => navigate('/teacher/dashboard')}>
          Quay lại Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600">
          <GraduationCap className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Lớp học của tôi</h1>
          <p className="text-sm text-gray-500">Tất cả lớp học bạn đang phụ trách giảng dạy</p>
        </div>
      </div>

      {classrooms.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-150 shadow-sm">
          <p className="text-gray-500">Bạn chưa được phân công lớp học nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classrooms.map((classroom) => (
            <Card key={classroom.classroomId} className="flex flex-col hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg text-indigo-900">{classroom.classroomName}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-2 text-sm text-muted-foreground">
                  {classroom.semester && (
                    <div>Học kỳ: <span className="font-semibold text-gray-700">{classroom.semester}</span></div>
                  )}
                  {classroom.year && (
                    <div>Năm học: <span className="font-semibold text-gray-700">{classroom.year}</span></div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t border-gray-50">
                <Button
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={() => handleEnterClass(classroom.classroomId)}
                >
                  Vào lớp học
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}