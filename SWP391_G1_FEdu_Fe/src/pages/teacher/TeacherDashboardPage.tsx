import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { BookOpen, GraduationCap, Loader2, AlertCircle, Users, ArrowRight, Clock, Plus, HelpCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { teacherService } from '../../services/teacher.service';

export function TeacherDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subjectCount, setSubjectCount] = useState<number>(0);
  const [classCount, setClassCount] = useState<number>(0);
  const [studentCount, setStudentCount] = useState<number>(0);
  const [classrooms, setClassrooms] = useState<any[]>([]);
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

        const [subjects, classroomsData] = await Promise.all([
          teacherService.getSubjectsByTeacher(user.userId),
          teacherService.getClassroomsByTeacher(user.userId),
        ]);
        
        setSubjectCount(subjects?.length ?? 0);
        setClassCount(classroomsData?.length ?? 0);
        setClassrooms(classroomsData ?? []);

        // Fetch student lists in parallel to calculate total unique students
        if (classroomsData && classroomsData.length > 0) {
          const studentLists = await Promise.all(
            classroomsData.map(c => teacherService.getStudentsInClassroom(c.classroomId))
          );
          
          const uniqueStudentIds = new Set<number>();
          studentLists.forEach(list => {
            if (Array.isArray(list)) {
              list.forEach(student => {
                if (student.userId) {
                  uniqueStudentIds.add(student.userId);
                }
              });
            }
          });
          setStudentCount(uniqueStudentIds.size);
        } else {
          setStudentCount(0);
        }
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
      {/* Welcome Hero Banner with Floating Shapes & Glassmorphism */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-950 p-6 text-white shadow-xl border border-slate-800/50">
        {/* Floating gradient background shapes */}
        <div className="absolute -right-10 -top-10 h-72 w-72 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 opacity-40 blur-3xl animate-float-slow" />
        <div className="absolute -left-10 -bottom-10 h-72 w-72 rounded-full bg-gradient-to-br from-pink-500 to-violet-600 opacity-30 blur-3xl animate-float-slower" />
        
        <div className="relative z-10 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 p-[2px] shadow-[0_0_20px_rgba(99,102,241,0.3)]">
              <div className="h-full w-full bg-slate-900 rounded-2xl flex items-center justify-center text-3xl overflow-hidden">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  "👨‍🏫"
                )}
              </div>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-indigo-200">
                Chào mừng trở lại, {user?.lastName || 'Giảng viên'} {user?.firstName || ''}!
              </h1>
              <p className="text-indigo-200/80 text-sm mt-1 font-medium">
                Hôm nay là {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. Chúc bạn một ngày làm việc hiệu quả!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => navigate('/teacher/classes')} 
              className="bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all hover:scale-[1.03] active:scale-[0.98] shadow-md shadow-black/10"
            >
              Lớp học của tôi
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Subjects Card */}
        <Card className="backdrop-blur-md bg-white/60 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_30px_-5px_rgba(99,102,241,0.15)] hover:border-indigo-500/30 hover:-translate-y-1 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-slate-500 dark:text-slate-400">Môn học đang dạy</CardTitle>
            <div className="p-2.5 bg-gradient-to-br from-indigo-500/10 to-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/10">
              <BookOpen className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            <div className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">{subjectCount}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Các môn học được phân công giảng dạy trong học kỳ này.</p>
            <Button
              variant="outline"
              className="w-full text-indigo-600 dark:text-indigo-400 border-indigo-200/80 dark:border-indigo-900/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 hover:text-indigo-700 transition-all font-semibold rounded-xl"
              onClick={() => navigate('/teacher/courses')}
            >
              Quản lý môn học
            </Button>
          </CardContent>
        </Card>

        {/* Classes Card */}
        <Card className="backdrop-blur-md bg-white/60 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_30px_-5px_rgba(16,185,129,0.15)] hover:border-emerald-500/30 hover:-translate-y-1 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-slate-500 dark:text-slate-400">Lớp học phụ trách</CardTitle>
            <div className="p-2.5 bg-gradient-to-br from-emerald-500/10 to-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/10">
              <GraduationCap className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            <div className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">{classCount}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Các lớp học trực tiếp đang phụ trách giảng dạy.</p>
            <Button
              variant="outline"
              className="w-full text-emerald-600 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-900/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 hover:text-emerald-700 transition-all font-semibold rounded-xl"
              onClick={() => navigate('/teacher/classes')}
            >
              Quản lý lớp học
            </Button>
          </CardContent>
        </Card>

        {/* Students Card */}
        <Card className="backdrop-blur-md bg-white/60 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_30px_-5px_rgba(245,158,11,0.15)] hover:border-amber-500/30 hover:-translate-y-1 transition-all duration-300 sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <div className="flex items-center">
              <CardTitle className="text-sm font-bold text-slate-500 dark:text-slate-400">Tổng số học viên</CardTitle>
              <span className="relative flex h-2 w-2 ml-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div className="p-2.5 bg-gradient-to-br from-amber-500/10 to-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/10">
              <Users className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            <div className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">{studentCount}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Học sinh không trùng lặp trong danh sách tất cả các lớp.</p>
            <div className="pt-2">
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full" style={{ width: '70%' }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classroom Quick-Access Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Lớp học hoạt động gần đây</h2>
          <Button variant="ghost" onClick={() => navigate('/teacher/classes')} className="text-indigo-600 dark:text-indigo-400 text-sm hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 font-semibold rounded-xl">
            Xem tất cả <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        {classrooms.length === 0 ? (
          <div className="text-center py-12 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">Bạn chưa có lớp học nào đang hoạt động.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classrooms.slice(0, 3).map((cls) => (
              <Card key={cls.classroomId} className="group backdrop-blur-md bg-white/60 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_30px_-5px_rgba(99,102,241,0.1)] hover:border-indigo-500/20 transition-all duration-300 flex flex-col justify-between rounded-2xl">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm border border-emerald-100/10">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Active
                    </span>
                    <span className="text-xs text-slate-450 dark:text-slate-400 flex items-center gap-1 font-medium bg-slate-50 dark:bg-slate-800/40 px-2 py-0.5 rounded-md border border-slate-200/10">
                      <Clock className="w-3.5 h-3.5" />
                      {cls.semester || 'Summer 2026'}
                    </span>
                  </div>
                  <CardTitle className="text-base font-extrabold text-slate-850 dark:text-white mt-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {cls.className}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-4 text-slate-500 dark:text-slate-400 text-xs space-y-3">
                  <p className="font-medium">Môn học ID: <span className="font-bold text-slate-700 dark:text-slate-300">{cls.subjectId}</span></p>
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-400 dark:text-slate-500">Tiến độ lớp học</span>
                      <span className="font-bold text-indigo-650 dark:text-indigo-400">80%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full" style={{ width: '80%' }} />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-3 pb-3 border-t border-slate-100/30 dark:border-slate-800/30">
                  <Button
                    className="w-full bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-indigo-650 hover:to-purple-650 hover:text-white hover:shadow-lg hover:shadow-indigo-500/20 border-0 transition-all font-semibold rounded-xl py-2.5 hover:scale-[1.02] active:scale-[0.98] shadow-none"
                    onClick={() => navigate(`/teacher/classrooms/${cls.classroomId}`)}
                  >
                    Vào lớp học
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Shortcuts and Help center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Công cụ giảng dạy nhanh</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-5 backdrop-blur-md bg-white/60 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_30px_-5px_rgba(99,102,241,0.1)] hover:border-indigo-500/20 hover:scale-[1.02] transition-all duration-300 cursor-pointer flex flex-row items-center gap-4 group rounded-2xl" onClick={() => navigate('/teacher/classes')}>
              <div className="p-3 bg-gradient-to-br from-indigo-500/10 to-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:text-white transition-all duration-300 border border-indigo-500/10">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">Tạo lớp học mới</h3>
                <p className="text-xs text-slate-450 dark:text-slate-400 mt-1 font-medium">Mở danh sách và thêm lớp mới</p>
              </div>
            </Card>
            <Card className="p-5 backdrop-blur-md bg-white/60 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_30px_-5px_rgba(139,92,246,0.1)] hover:border-purple-500/20 hover:scale-[1.02] transition-all duration-300 cursor-pointer flex flex-row items-center gap-4 group rounded-2xl" onClick={() => navigate('/teacher/courses')}>
              <div className="p-3 bg-gradient-to-br from-purple-500/10 to-purple-500/20 text-purple-600 dark:text-purple-400 rounded-xl group-hover:from-purple-600 group-hover:to-indigo-600 group-hover:text-white transition-all duration-300 border border-purple-500/10">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">Xem giáo trình</h3>
                <p className="text-xs text-slate-450 dark:text-slate-400 mt-1 font-medium">Quản lý nội dung môn học</p>
              </div>
            </Card>
          </div>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Trung tâm hỗ trợ</h2>
          <Card className="p-5 backdrop-blur-md bg-amber-50/20 dark:bg-amber-950/10 border border-amber-200/30 dark:border-amber-900/20 shadow-[0_4px_20px_-4px_rgba(245,158,11,0.05)] hover:border-amber-500/30 transition-colors flex flex-col justify-between rounded-2xl h-[122px] sm:h-auto">
            <div className="flex gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-500/10 to-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/10 h-10 w-10 flex items-center justify-center shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">Gặp khó khăn?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">Liên hệ với Quản trị viên hoặc xem tài liệu hướng dẫn sử dụng hệ thống.</p>
              </div>
            </div>
            <Button variant="link" className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-750 dark:hover:text-indigo-300 p-0 h-auto justify-start mt-3 font-bold transition-colors">
              Xem tài liệu hướng dẫn →
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}