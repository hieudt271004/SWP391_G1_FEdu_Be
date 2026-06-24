import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Loader2, GraduationCap, AlertCircle, Search, Users, ArrowRight,
  BookOpen, Clock, Calendar, CheckCircle2, Circle
} from 'lucide-react';
import { teacherService } from '../../../services/teacher.service';
import { Classroom } from '../../../types/teacher';
import { useAuth } from '../../../context/AuthContext';

const getSubjectGradient = (subjectCode: string) => {
  const code = (subjectCode || '').toUpperCase();
  if (code.startsWith('SE') || code.startsWith('PR')) {
    return 'linear-gradient(135deg, #4f46e5, #7c3aed)'; // Indigo to Purple
  }
  if (code.startsWith('IA') || code.startsWith('IS')) {
    return 'linear-gradient(135deg, #f59e0b, #d97706)'; // Amber to Orange
  }
  if (code.startsWith('GD') || code.startsWith('MC')) {
    return 'linear-gradient(135deg, #ec4899, #be185d)'; // Pink to Deep Pink
  }
  return 'linear-gradient(135deg, #06b6d4, #0891b2)'; // Cyan to Teal
};

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
        <Loader2 className="w-8 h-8 animate-spin text-[#030213]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-white rounded-[10px] border border-[rgba(0,0,0,0.1)] max-w-md mx-auto">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
        <p className="text-red-600 mb-4 text-sm">{error}</p>
        <button
          onClick={() => navigate('/teacher/dashboard')}
          className="px-4 py-2 bg-[#030213] text-white rounded-[6px] hover:bg-[#1c1b2d] transition-colors text-sm font-medium border-0"
        >
          Quay lại Dashboard
        </button>
      </div>
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
    <div className="space-y-6 font-sans">
      {/* Header Title */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[6px] flex items-center justify-center bg-[#ececf0] text-[#030213] border border-[rgba(0,0,0,0.1)]">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#030213] tracking-tight">Lớp học của tôi</h1>
            <p className="text-sm text-[#717182] font-normal">Tất cả lớp học bạn đang phụ trách giảng dạy</p>
          </div>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="rounded-[10px] p-5 bg-white border border-[rgba(0,0,0,0.1)] shadow-none flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-[#717182]">Tổng số lớp học</p>
            <p className="text-2xl font-bold text-[#030213]">{totalClasses}</p>
          </div>
          <div className="p-3 bg-[#ececf0] text-[#030213] rounded-[6px]">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>
        <div className="rounded-[10px] p-5 bg-white border border-[rgba(0,0,0,0.1)] shadow-none flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-[#717182]">Đang hoạt động</p>
            <p className="text-2xl font-bold text-[#030213]">{activeClassesCount}</p>
          </div>
          <div className="p-3 bg-[#ececf0] text-[#030213] rounded-[6px]">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div className="rounded-[10px] p-5 bg-white border border-[rgba(0,0,0,0.1)] shadow-none flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-[#717182]">Đã hoàn thành</p>
            <p className="text-2xl font-bold text-[#030213]">{completedClassesCount}</p>
          </div>
          <div className="p-3 bg-[#ececf0] text-[#030213] rounded-[6px]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="rounded-[10px] p-4 bg-white border border-[rgba(0,0,0,0.1)] shadow-none flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#717182]" />
          <input
            type="text"
            placeholder="Tìm lớp học hoặc môn học..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-[6px] border border-[rgba(0,0,0,0.1)] outline-none focus:border-[#030213] focus:ring-1 focus:ring-[#030213] transition-colors bg-[#ececf0]/30 text-[#030213] placeholder:text-[#717182]"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#ececf0] rounded-[6px] border border-[rgba(0,0,0,0.05)] w-full sm:w-auto">
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
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-[6px] text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-[#030213] text-white shadow-none'
                  : 'text-[#717182] hover:bg-[#ececf0]/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Classrooms Grid */}
      {filteredClassrooms.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[10px] border border-[rgba(0,0,0,0.1)] shadow-none space-y-3">
          <GraduationCap className="w-12 h-12 text-[#717182] mx-auto animate-pulse" />
          <p className="text-[#717182] text-sm font-normal">Không tìm thấy lớp học nào phù hợp</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClassrooms.map((classroom) => {
            const statusBadge = getStatusDetails(classroom.status);
            const subjectInitials = (classroom.subjectCode || 'CL').slice(0, 2).toUpperCase();

            return (
              <div
                key={classroom.classroomSubjectId || classroom.classroomId}
                className="group rounded-[10px] bg-white border border-[rgba(0,0,0,0.1)] shadow-none hover:border-[#030213]/30 transition-colors duration-200 flex flex-col overflow-hidden"
              >
                {/* Card Top / Header */}
                <div className="p-6 flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Dynamic Gradient Icon -> Simplified flat logo */}
                      <div className="w-10 h-10 rounded-[6px] bg-[#ececf0] text-[#030213] border border-[rgba(0,0,0,0.1)] flex items-center justify-center text-xs font-bold shrink-0">
                        {subjectInitials}
                      </div>
                      <h3 className="text-base font-bold text-[#030213] truncate max-w-[150px]">
                        {classroom.classroomName}
                      </h3>
                    </div>
                    {/* Status Badge */}
                    <span
                      className="px-2.5 py-1 rounded-[6px] text-[10px] font-semibold tracking-wide border"
                      style={{ backgroundColor: statusBadge.bg, color: statusBadge.color, borderColor: 'rgba(0,0,0,0.05)' }}
                    >
                      {statusBadge.label}
                    </span>
                  </div>

                  {/* Course Details */}
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[#030213] tracking-wider uppercase">
                      {classroom.subjectCode || '—'}
                    </p>
                    <p className="text-sm font-semibold text-[#030213] line-clamp-1 leading-snug">
                      {classroom.subjectName || 'Môn học chưa gán tên'}
                    </p>
                  </div>

                  {/* Metadata Info */}
                  <div className="pt-3 flex flex-col gap-2 border-t border-[rgba(0,0,0,0.1)] text-xs text-[#717182]">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#717182]" />
                      <span>
                        Học kỳ: <span className="font-semibold text-[#030213]">{classroom.semester || '—'}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-[#717182]" />
                      <span>
                        Sĩ số: <span className="font-semibold text-[#030213]">{classroom.studentCount ?? 0} học viên</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Button */}
                <div className="px-6 pb-6 pt-0">
                  <button
                    onClick={() => handleEnterClass(classroom.classroomSubjectId || classroom.classroomId)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-[6px] bg-[#030213] hover:bg-[#1c1b2d] text-white text-xs font-medium transition-colors border-0 shadow-none cursor-pointer"
                  >
                    Vào lớp học
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}