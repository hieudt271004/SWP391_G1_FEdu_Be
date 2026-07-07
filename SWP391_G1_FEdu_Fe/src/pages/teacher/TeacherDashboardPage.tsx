import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { BookOpen, GraduationCap, Loader2, AlertCircle, Users, ArrowRight, Clock, Plus, HelpCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { teacherService } from '../../services/teacher.service';
import { classroomService } from '../../services/classroom.service';
import type { ClassroomSubjectResponse } from '../../types/classroomSubject';

export function TeacherDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subjectCount, setSubjectCount] = useState<number>(0);
  const [classCount, setClassCount] = useState<number>(0);
  const [studentCount, setStudentCount] = useState<number>(0);
  const [classrooms, setClassrooms] = useState<ClassroomSubjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchDashboardData = useCallback(async () => {
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
      
      if (!isMountedRef.current) return;

      setSubjectCount(subjects?.length ?? 0);
      setClassCount(classroomsData?.length ?? 0);
      setClassrooms(classroomsData ?? []);

      // Fetch student lists in parallel to calculate total unique students
      if (classroomsData && classroomsData.length > 0) {
        const studentLists = await Promise.all(
          classroomsData.map(c => 
            classroomService.getStudents(c.classroomSubjectId)
              .catch(err => {
                console.error(`Lỗi khi tải học sinh lớp ${c.classroomSubjectId}:`, err);
                return [];
              })
          )
        );
        
        if (!isMountedRef.current) return;

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
      if (!isMountedRef.current) return;
      console.error('Lỗi khi tải thông tin dashboard:', err);
      setError(err.response?.data?.message || 'Không thể tải dữ liệu thống kê');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [user?.userId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground font-medium">Đang tải thông tin tổng quan...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <p className="text-foreground font-medium">{error}</p>
        <button
          onClick={() => fetchDashboardData()}
          className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 transition-all active:scale-[0.98] text-sm font-semibold shadow-sm"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-dashboard-hero-from via-dashboard-hero-via to-dashboard-hero-to p-4 sm:p-6 text-white border border-white/10 shadow-lg">
        {/* Glow Dots & Decorative Background elements for visual depth */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="h-16 w-16 rounded-xl border border-white/20 overflow-hidden bg-white/10 flex items-center justify-center text-3xl shrink-0 shadow-inner">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                "👨‍🏫"
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white leading-tight">
                Chào mừng trở lại, {user?.lastName || 'Giảng viên'} {user?.firstName || ''}!
              </h1>
              <p className="text-indigo-200/80 text-sm mt-1.5 font-light leading-relaxed">
                Hôm nay là {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. Chúc bạn một ngày làm việc hiệu quả!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
            <Button 
              onClick={() => navigate('/teacher/classes')} 
              className="bg-white hover:bg-slate-100 text-slate-900 rounded-lg px-4 py-2 text-xs font-semibold transition-all active:scale-[0.98] border border-transparent shadow-sm w-full md:w-auto"
            >
              Lớp học của tôi
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Subjects Card */}
        <Card className="bg-card border border-border rounded-xl shadow-xs flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] hover:-translate-y-1 hover:shadow-md hover:border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-6 pt-6">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Môn học đang dạy</CardTitle>
            <div className="p-2.5 bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 px-6 pb-6">
            <div className="text-3xl font-extrabold text-primary tracking-tight">{subjectCount}</div>
            <p className="text-xs text-muted-foreground font-normal leading-relaxed">Các môn học được phân công giảng dạy trong học kỳ này.</p>
            <Button
              variant="outline"
              className="w-full text-primary border-border hover:bg-muted transition-all active:scale-[0.98] font-semibold rounded-lg text-xs h-9 shadow-xs"
              onClick={() => navigate('/teacher/courses')}
            >
              Quản lý môn học
            </Button>
          </CardContent>
        </Card>

        {/* Classes Card */}
        <Card className="bg-card border border-border rounded-xl shadow-xs flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] hover:-translate-y-1 hover:shadow-md hover:border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-6 pt-6">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Lớp học phụ trách</CardTitle>
            <div className="p-2.5 bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 rounded-lg">
              <GraduationCap className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 px-6 pb-6">
            <div className="text-3xl font-extrabold text-primary tracking-tight">{classCount}</div>
            <p className="text-xs text-muted-foreground font-normal leading-relaxed">Các lớp học trực tiếp đang phụ trách giảng dạy.</p>
            <Button
              variant="outline"
              className="w-full text-primary border-border hover:bg-muted transition-all active:scale-[0.98] font-semibold rounded-lg text-xs h-9 shadow-xs"
              onClick={() => navigate('/teacher/classes')}
            >
              Quản lý lớp học
            </Button>
          </CardContent>
        </Card>

        {/* Students Card */}
        <Card className="bg-card border border-border rounded-xl shadow-xs flex flex-col justify-between sm:col-span-2 lg:col-span-1 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-1 hover:shadow-md hover:border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-6 pt-6">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Tổng số học viên</CardTitle>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 px-6 pb-6">
            <div className="text-3xl font-extrabold text-primary tracking-tight">{studentCount}</div>
            <p className="text-xs text-muted-foreground font-normal leading-relaxed">Học sinh không trùng lặp trong danh sách tất cả các lớp.</p>
            <div className="pt-2">
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: '70%' }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classroom Quick-Access Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-bold text-primary tracking-tight">Lớp học hoạt động gần đây</h2>
          <Button 
            variant="ghost" 
            onClick={() => navigate('/teacher/classes')} 
            className="text-primary text-sm hover:bg-muted font-semibold rounded-lg h-9 px-3 transition-colors"
          >
            Xem tất cả <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        {classrooms.length === 0 ? (
          <div className="text-center py-12 bg-card border border-dashed border-border rounded-xl">
            <p className="text-muted-foreground text-sm font-normal">Bạn chưa có lớp học nào đang hoạt động.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classrooms.slice(0, 3).map((cls) => (
              <Card key={cls.classroomSubjectId} className="bg-card border border-border rounded-xl shadow-xs flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] hover:-translate-y-1 hover:shadow-md hover:border-primary/20">
                <CardHeader className="pb-2 px-6 pt-6">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full flex items-center gap-1.5 border border-emerald-100">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      Active
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 font-normal">
                      <Clock className="w-3.5 h-3.5" />
                      {"Summer 2026"}
                    </span>
                  </div>
                  <CardTitle className="text-base font-bold text-primary mt-3 tracking-tight">
                    {cls.className}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-4 px-6 text-muted-foreground text-xs space-y-3">
                  <p className="font-normal leading-relaxed">Môn học: <span className="font-semibold text-primary">{cls.subjectName} ({cls.subjectCode})</span></p>
                </CardContent>
                <CardFooter className="pt-4 pb-4 px-6 border-t border-border/60">
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg py-2.5 text-xs font-semibold transition-all active:scale-[0.98] border-0 shadow-sm h-9"
                    onClick={() => navigate(`/teacher/classroom-subjects/${cls.classroomSubjectId}`)}
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
          <h2 className="text-lg md:text-xl font-bold text-primary tracking-tight">Công cụ giảng dạy nhanh</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card 
              className="p-5 bg-card border border-border rounded-xl shadow-xs hover:border-primary/20 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex flex-row items-center gap-4 group" 
              onClick={() => navigate('/teacher/classes')}
            >
              <div className="p-3 bg-muted text-primary rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                <Plus className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-primary text-sm tracking-tight">Tạo lớp học mới</h3>
                <p className="text-xs text-muted-foreground mt-1 font-normal leading-relaxed">Mở danh sách và thêm lớp mới</p>
              </div>
            </Card>
            <Card 
              className="p-5 bg-card border border-border rounded-xl shadow-xs hover:border-primary/20 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex flex-row items-center gap-4 group" 
              onClick={() => navigate('/teacher/courses')}
            >
              <div className="p-3 bg-muted text-primary rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-primary text-sm tracking-tight">Xem giáo trình</h3>
                <p className="text-xs text-muted-foreground mt-1 font-normal leading-relaxed">Quản lý nội dung môn học</p>
              </div>
            </Card>
          </div>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-lg md:text-xl font-bold text-primary tracking-tight">Trung tâm hỗ trợ</h2>
          <Card className="p-5 bg-card border border-border rounded-xl shadow-xs hover:border-primary/20 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between h-full min-h-[142px]">
            <div className="flex gap-3">
              <div className="p-2.5 bg-muted text-primary rounded-lg h-10 w-10 flex items-center justify-center shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-primary text-sm tracking-tight">Gặp khó khăn?</h3>
                <p className="text-xs text-muted-foreground mt-1 font-normal leading-relaxed">Liên hệ với Quản trị viên hoặc xem tài liệu hướng dẫn sử dụng hệ thống.</p>
              </div>
            </div>
            <div className="mt-4">
              <Button 
                variant="link" 
                onClick={() => navigate('/teacher/tickets')}
                className="group text-xs text-primary hover:text-primary/80 p-0 h-auto justify-start font-semibold transition-colors decoration-transparent flex items-center gap-1"
              >
                Xem tài liệu hướng dẫn <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}