import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card';
import { Loader2, BookOpen, AlertCircle } from 'lucide-react';
import { teacherService } from '../../../services/teacher.service';
import { Subject } from '../../../types/subject';
import { useAuth } from '../../../context/AuthContext';

export function TeacherCoursesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      if (!user?.userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('Fetching subjects for teacher ID:', user.userId);
        const subjects = await teacherService.getSubjectsByTeacher(user.userId);
        setSubjects(subjects ?? []);
      } catch (err: any) {
        console.error('Lỗi khi tải danh sách khóa học:', err);
        setError(err.response?.data?.message || 'Không thể tải danh sách khóa học');
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [user]);

  const handleEnterSubject = (subjectId: number) => {
    navigate(`/teacher/courses/${subjectId}`);
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
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Khóa học của tôi</h1>
          <p className="text-sm text-gray-500">Danh sách các khóa học bạn được phân công quản lý</p>
        </div>
      </div>

      {subjects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-150 shadow-sm">
          <p className="text-gray-500">Bạn chưa được phân công khóa học nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <Card key={subject.subjectId} className="flex flex-col hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg text-indigo-900">{subject.subjectCode}</CardTitle>
                <p className="text-sm text-muted-foreground font-semibold">{subject.subjectName}</p>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-gray-500 line-clamp-3">
                  {subject.description || 'Không có mô tả khóa học.'}
                </p>
              </CardContent>
              <CardFooter className="pt-4 border-t border-gray-50">
                <Button
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={() => handleEnterSubject(subject.subjectId)}
                >
                  Xem danh sách lớp học
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
