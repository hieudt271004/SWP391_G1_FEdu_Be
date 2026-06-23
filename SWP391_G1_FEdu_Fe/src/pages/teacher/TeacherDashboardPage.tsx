import { useEffect, useState } from 'react';
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
            classroomsData.map(c => classroomService.getStudents(c.classroomSubjectId))
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
  }, [user?.userId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-[#030213]" />
        <span className="text-sm text-[#717182]">Đang tải thông tin tổng quan...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <p className="text-[#030213]">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-[#030213] text-white rounded-[6px] hover:bg-[#1c1b2d] transition-colors text-sm font-medium"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Welcome Hero Banner */}
      <div className="rounded-[10px] bg-[#030213] p-6 text-white border border-[#030213]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="h-16 w-16 rounded-[6px] border border-white/20 overflow-hidden bg-white/10 flex items-center justify-center text-3xl shrink-0">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                "👨‍🏫"
              )}
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                Chào mừng trở lại, {user?.lastName || 'Giảng viên'} {user?.firstName || ''}!
              </h1>
              <p className="text-slate-350 text-sm mt-1 font-normal">
                Hôm nay là {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. Chúc bạn một ngày làm việc hiệu quả!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => navigate('/teacher/classes')} 
              className="bg-white hover:bg-slate-100 text-[#030213] rounded-[6px] px-4 py-2 text-xs font-medium transition-colors border border-transparent shadow-none"
            >
              Lớp học của tôi
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Subjects Card */}
        <Card className="bg-white border border-[rgba(0,0,0,0.1)] rounded-[10px] shadow-none flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-5 pt-5">
            <CardTitle className="text-sm font-semibold text-[#717182]">Môn học đang dạy</CardTitle>
            <div className="p-2 bg-[#ececf0] text-[#030213] rounded-[6px]">
              <BookOpen className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 px-5 pb-5">
            <div className="text-3xl font-bold text-[#030213] tracking-tight">{subjectCount}</div>
            <p className="text-xs text-[#717182] font-normal">Các môn học được phân công giảng dạy trong học kỳ này.</p>
            <Button
              variant="outline"
              className="w-full text-[#030213] border-[rgba(0,0,0,0.1)] hover:bg-[#ececf0] transition-colors font-medium rounded-[6px] text-xs h-9"
              onClick={() => navigate('/teacher/courses')}
            >
              Quản lý môn học
            </Button>
          </CardContent>
        </Card>

        {/* Classes Card */}
        <Card className="bg-white border border-[rgba(0,0,0,0.1)] rounded-[10px] shadow-none flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-5 pt-5">
            <CardTitle className="text-sm font-semibold text-[#717182]">Lớp học phụ trách</CardTitle>
            <div className="p-2 bg-[#ececf0] text-[#030213] rounded-[6px]">
              <GraduationCap className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 px-5 pb-5">
            <div className="text-3xl font-bold text-[#030213] tracking-tight">{classCount}</div>
            <p className="text-xs text-[#717182] font-normal">Các lớp học trực tiếp đang phụ trách giảng dạy.</p>
            <Button
              variant="outline"
              className="w-full text-[#030213] border-[rgba(0,0,0,0.1)] hover:bg-[#ececf0] transition-colors font-medium rounded-[6px] text-xs h-9"
              onClick={() => navigate('/teacher/classes')}
            >
              Quản lý lớp học
            </Button>
          </CardContent>
        </Card>

        {/* Students Card */}
        <Card className="bg-white border border-[rgba(0,0,0,0.1)] rounded-[10px] shadow-none flex flex-col justify-between sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-5 pt-5">
            <CardTitle className="text-sm font-semibold text-[#717182]">Tổng số học viên</CardTitle>
            <div className="p-2 bg-[#ececf0] text-[#030213] rounded-[6px]">
              <Users className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 px-5 pb-5">
            <div className="text-3xl font-bold text-[#030213] tracking-tight">{studentCount}</div>
            <p className="text-xs text-[#717182] font-normal">Học sinh không trùng lặp trong danh sách tất cả các lớp.</p>
            <div className="pt-2">
              <div className="h-2 w-full bg-[#ececf0] rounded-[6px] overflow-hidden">
                <div className="bg-[#030213] h-full rounded-[6px]" style={{ width: '70%' }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classroom Quick-Access Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#030213]">Lớp học hoạt động gần đây</h2>
          <Button 
            variant="ghost" 
            onClick={() => navigate('/teacher/classes')} 
            className="text-[#030213] text-sm hover:bg-[#ececf0] font-medium rounded-[6px] h-9 px-3"
          >
            Xem tất cả <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        {classrooms.length === 0 ? (
          <div className="text-center py-12 bg-white border border-dashed border-[rgba(0,0,0,0.1)] rounded-[10px]">
            <p className="text-[#717182] text-sm font-normal">Bạn chưa có lớp học nào đang hoạt động.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classrooms.slice(0, 3).map((cls) => (
              <Card key={cls.classroomSubjectId} className="bg-white border border-[rgba(0,0,0,0.1)] rounded-[10px] shadow-none flex flex-col justify-between">
                <CardHeader className="pb-2 px-5 pt-5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-[#ececf0] text-[#030213] text-xs font-semibold rounded-[6px] flex items-center gap-1.5 border border-[rgba(0,0,0,0.05)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                      Active
                    </span>
                    <span className="text-xs text-[#717182] flex items-center gap-1 font-normal">
                      <Clock className="w-3.5 h-3.5" />
                      {"Summer 2026"}
                    </span>
                  </div>
                  <CardTitle className="text-base font-bold text-[#030213] mt-3">
                    {cls.className}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-4 px-5 text-[#717182] text-xs space-y-3">
                  <p className="font-normal">Môn học: <span className="font-semibold text-[#030213]">{cls.subjectName} ({cls.subjectCode})</span></p>
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-xs font-normal">
                      <span className="text-[#717182]">Tiến độ lớp học</span>
                      <span className="font-semibold text-[#030213]">80%</span>
                    </div>
                    <div className="h-2 w-full bg-[#ececf0] rounded-[6px] overflow-hidden">
                      <div className="bg-[#030213] h-full rounded-[6px]" style={{ width: '80%' }} />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-3 pb-3 px-5 border-t border-[rgba(0,0,0,0.1)]">
                  <Button
                    className="w-full bg-[#030213] hover:bg-[#1c1b2d] text-white rounded-[6px] py-2.5 text-xs font-medium transition-colors border-0 shadow-none h-9"
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
          <h2 className="text-lg font-semibold text-[#030213]">Công cụ giảng dạy nhanh</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card 
              className="p-5 bg-white border border-[rgba(0,0,0,0.1)] rounded-[10px] shadow-none hover:border-[#030213]/30 transition-colors duration-200 cursor-pointer flex flex-row items-center gap-4 group" 
              onClick={() => navigate('/teacher/classes')}
            >
              <div className="p-3 bg-[#ececf0] text-[#030213] rounded-[6px] group-hover:bg-[#030213] group-hover:text-white transition-colors duration-200">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-[#030213] text-sm">Tạo lớp học mới</h3>
                <p className="text-xs text-[#717182] mt-1 font-normal">Mở danh sách và thêm lớp mới</p>
              </div>
            </Card>
            <Card 
              className="p-5 bg-white border border-[rgba(0,0,0,0.1)] rounded-[10px] shadow-none hover:border-[#030213]/30 transition-colors duration-200 cursor-pointer flex flex-row items-center gap-4 group" 
              onClick={() => navigate('/teacher/courses')}
            >
              <div className="p-3 bg-[#ececf0] text-[#030213] rounded-[6px] group-hover:bg-[#030213] group-hover:text-white transition-colors duration-200">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-[#030213] text-sm">Xem giáo trình</h3>
                <p className="text-xs text-[#717182] mt-1 font-normal">Quản lý nội dung môn học</p>
              </div>
            </Card>
          </div>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#030213]">Trung tâm hỗ trợ</h2>
          <Card className="p-5 bg-white border border-[rgba(0,0,0,0.1)] rounded-[10px] shadow-none flex flex-col justify-between h-[122px] sm:h-auto">
            <div className="flex gap-3">
              <div className="p-2 bg-[#ececf0] text-[#030213] rounded-[6px] h-10 w-10 flex items-center justify-center shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-[#030213] text-sm">Gặp khó khăn?</h3>
                <p className="text-xs text-[#717182] mt-1 font-normal leading-relaxed">Liên hệ với Quản trị viên hoặc xem tài liệu hướng dẫn sử dụng hệ thống.</p>
              </div>
            </div>
            <Button 
              variant="link" 
              className="text-xs text-[#030213] hover:text-[#1c1b2d] p-0 h-auto justify-start mt-3 font-semibold transition-colors decoration-transparent"
            >
              Xem tài liệu hướng dẫn →
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}