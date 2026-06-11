import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { BookOpen, GraduationCap, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { teacherService } from '../../services/teacher.service';

export function TeacherDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subjectCount, setSubjectCount] = useState<number>(0);
  const [classCount, setClassCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [subjects, classrooms] = await Promise.all([
          teacherService.getSubjectsByTeacher(user.userId),
          teacherService.getClassroomsByTeacher(user.userId),
        ]);
        setSubjectCount(subjects?.length ?? 0);
        setClassCount(classrooms?.length ?? 0);
      } catch (err: any) {
        console.error('Lỗi khi tải thông tin dashboard:', err);
        setError(err.response?.data?.message || 'Không thể tải dữ liệu thống kê');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="text-sm text-gray-500">Đang tải thông tin tổng quan...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <p className="text-gray-700">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tổng quan giảng dạy</h1>
        <p className="text-sm text-gray-500">Chào mừng trở lại! Dưới đây là thống kê lớp học và môn học của bạn.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subjects Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-base font-semibold text-gray-700">Môn học đang dạy</CardTitle>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl font-bold text-gray-900">{subjectCount}</div>
            <p className="text-xs text-gray-500">Các môn học được phân công phụ trách chuyên môn.</p>
            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() => navigate('/teacher/courses')}
            >
              Xem danh sách môn học
            </Button>
          </CardContent>
        </Card>

        {/* Classes Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-base font-semibold text-gray-700">Lớp học đang dạy</CardTitle>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <GraduationCap className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl font-bold text-gray-900">{classCount}</div>
            <p className="text-xs text-gray-500">Các lớp học trực tiếp đang diễn ra trong học kỳ.</p>
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white border-0"
              onClick={() => navigate('/teacher/classes')}
            >
              Xem danh sách lớp học
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}