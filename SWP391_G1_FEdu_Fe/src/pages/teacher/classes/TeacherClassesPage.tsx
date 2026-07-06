import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Loader2, GraduationCap, AlertCircle, Search, Users, ArrowRight,
  Clock, CheckCircle2, Calendar
} from 'lucide-react';
import { teacherService } from '../../../services/teacher.service';
import { Classroom } from '../../../types/teacher';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Card, CardContent } from '../../../components/ui/card';

const getStatusDetails = (status?: string) => {
  switch (status) {
    case 'active':
      return { label: 'Đang hoạt động', bg: '#d1fae5', color: '#065f46' };
    case 'inactive':
      return { label: 'Chưa bắt đầu', bg: '#fef3c7', color: '#92400e' };
    case 'completed':
      return { label: 'Đã hoàn thành', bg: '#e0e7ff', color: '#3730a3' };
    default:
      return { label: 'Chưa bắt đầu', bg: '#fef3c7', color: '#92400e' };
  }
};

export function TeacherClassesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'inactive' | 'active' | 'completed'>('all');

  // Debounce search input to avoid expensive list re-renders on typing
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [searchInput]);

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
        const classroomsData = await teacherService.getClassroomsByTeacher(user.userId);
        const mapped = (classroomsData ?? []).map((c) => ({
          classroomSubjectId: c.classroomSubjectId,
          classroomId: c.classroomId,
          classroomCode: c.className,
          classroomName: c.className,
          subjectId: c.subjectId,
          teacherId: c.lecturerId ?? 0,
          semester: 'Summer 2026',
          year: new Date().getFullYear(),
          status: 'active',
          subjectCode: c.subjectCode,
          subjectName: c.subjectName,
          studentCount: c.studentCount,
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
  }, [user?.userId]);

  const handleEnterClass = (classroomSubjectId: number) => {
    navigate(`/teacher/classroom-subjects/${classroomSubjectId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-md mx-auto mt-8 text-center p-6 border-destructive/20 bg-destructive/10">
        <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-2" />
        <p className="text-destructive mb-4 text-sm font-semibold">{error}</p>
        <Button
          onClick={() => navigate('/teacher/dashboard')}
          variant="outline"
          className="mx-auto"
        >
          Quay lại Dashboard
        </Button>
      </Card>
    );
  }

  // Summary Metrics
  const totalClasses = classrooms.length;
  const activeClassesCount = classrooms.filter((c) => c.status === 'active').length;
  const completedClassesCount = classrooms.filter((c) => c.status === 'completed').length;

  // Filter classrooms by Search Query and Status Tabs
  const filteredClassrooms = classrooms.filter((c) => {
    const matchesSearch =
      searchQuery === '' ||
      c.classroomName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.subjectCode && c.subjectCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.subjectName && c.subjectName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' ||
      c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Title */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-muted text-primary border border-border">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Lớp học của tôi</h1>
            <p className="text-sm text-muted-foreground font-normal">Tất cả lớp học bạn đang phụ trách giảng dạy</p>
          </div>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="shadow-none">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Tổng số lớp học</p>
              <p className="text-2xl font-bold text-foreground">{totalClasses}</p>
            </div>
            <div className="p-3 bg-muted text-primary rounded-lg border border-border">
              <GraduationCap className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Đang hoạt động</p>
              <p className="text-2xl font-bold text-foreground">{activeClassesCount}</p>
            </div>
            <div className="p-3 bg-muted text-primary rounded-lg border border-border">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Đã hoàn thành</p>
              <p className="text-2xl font-bold text-foreground">{completedClassesCount}</p>
            </div>
            <div className="p-3 bg-muted text-primary rounded-lg border border-border">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <div className="rounded-lg p-4 bg-card border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Tìm lớp học hoặc môn học..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 rounded-md border border-input bg-input-background text-foreground"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted rounded-lg border border-border w-full sm:w-auto">
          {(
            [
              { key: 'all', label: 'Tất cả' },
              { key: 'inactive', label: 'Chưa bắt đầu' },
              { key: 'active', label: 'Đang hoạt động' },
              { key: 'completed', label: 'Đã hoàn thành' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all cursor-pointer border-none bg-transparent ${
                statusFilter === tab.key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Classrooms Grid */}
      {filteredClassrooms.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-lg border border-border space-y-3">
          <GraduationCap className="w-12 h-12 text-muted-foreground/40 mx-auto animate-pulse" />
          <p className="text-muted-foreground text-sm font-normal">Không tìm thấy lớp học nào phù hợp</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClassrooms.map((classroom) => {
            const statusBadge = getStatusDetails(classroom.status);
            const subjectInitials = (classroom.subjectCode || 'CL').slice(0, 2).toUpperCase();

            return (
              <div
                key={classroom.classroomSubjectId || classroom.classroomId}
                className="group rounded-lg bg-card border border-border hover:border-primary/30 transition-all duration-200 flex flex-col overflow-hidden text-card-foreground"
              >
                {/* Card Top / Header */}
                <div className="p-6 flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-muted text-primary border border-border flex items-center justify-center text-xs font-bold shrink-0">
                        {subjectInitials}
                      </div>
                      <h3 className="text-base font-bold text-foreground truncate max-w-[150px]">
                        {classroom.classroomName}
                      </h3>
                    </div>
                    {/* Status Badge */}
                    <span
                      className="px-2.5 py-1 rounded-md text-[10px] font-semibold tracking-wide border border-border bg-background"
                      style={{ backgroundColor: statusBadge.bg, color: statusBadge.color, borderColor: 'transparent' }}
                    >
                      {statusBadge.label}
                    </span>
                  </div>

                  {/* Course Details */}
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-foreground tracking-wider uppercase">
                      {classroom.subjectCode || '—'}
                    </p>
                    <p className="text-sm font-semibold text-foreground line-clamp-1 leading-snug">
                      {classroom.subjectName || 'Môn học chưa gán tên'}
                    </p>
                  </div>

                  {/* Metadata Info */}
                  <div className="pt-3 flex flex-col gap-2 border-t border-border text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        Học kỳ: <span className="font-semibold text-foreground">{classroom.semester || '—'}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5" />
                      <span>
                        Sĩ số: <span className="font-semibold text-foreground">{classroom.studentCount ?? 0} học viên</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Button */}
                <div className="px-6 pb-6 pt-0 mt-auto">
                  <Button
                    onClick={() => handleEnterClass(classroom.classroomSubjectId || classroom.classroomId)}
                    className="w-full text-xs font-medium h-9 gap-2 group"
                  >
                    Vào lớp học
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}