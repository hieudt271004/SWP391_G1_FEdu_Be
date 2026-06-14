import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Loader2, GraduationCap, AlertCircle, Users, ArrowRight,
  BookOpen, Clock, Calendar, CheckCircle2
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
          classroomId: c.classroomId,
          classroomCode: c.className,
          classroomName: c.className,
          subjectId: c.subjectId,
          teacherId: c.lecturerId ?? 0,
          semester: c.semester ?? '',
          year: c.createdAt ? new Date(c.createdAt).getFullYear() : new Date().getFullYear(),
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          status: c.status,
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
        <button
          onClick={() => navigate('/teacher/dashboard')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
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



  return (
    <div className="space-y-6">
      {/* Header Title */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Lớp học của tôi</h1>
            <p className="text-sm text-gray-500">Tất cả lớp học bạn đang phụ trách giảng dạy</p>
          </div>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="rounded-2xl p-5 bg-white border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500">Tổng số lớp học</p>
            <p className="text-2xl font-extrabold text-slate-800">{totalClasses}</p>
          </div>
          <div className="p-3 bg-slate-50 text-slate-600 rounded-xl">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>
        <div className="rounded-2xl p-5 bg-white border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500">Đang hoạt động</p>
            <p className="text-2xl font-extrabold text-indigo-600">{activeClassesCount}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
        </div>
        <div className="rounded-2xl p-5 bg-white border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500">Đã hoàn thành</p>
            <p className="text-2xl font-extrabold text-purple-600">{completedClassesCount}</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>



      {/* Classrooms Grid */}
      {classrooms.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <GraduationCap className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-slate-500 text-sm font-medium">Không tìm thấy lớp học nào phù hợp</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classrooms.map((classroom) => {
            const cardGradient = getSubjectGradient(classroom.subjectCode || '');
            const subjectInitials = (classroom.subjectCode || 'CL').slice(0, 2).toUpperCase();

            return (
              <div
                key={classroom.classroomId}
                className="group rounded-2xl bg-white border border-slate-150 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden"
              >
                {/* Card Top / Header */}
                <div className="p-6 flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Dynamic Gradient Icon */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-md border border-white/10 shrink-0"
                        style={{ background: cardGradient }}
                      >
                        {subjectInitials}
                      </div>
                      <h3 className="text-base font-bold text-slate-800 truncate max-w-[150px]">
                        {classroom.classroomName}
                      </h3>
                    </div>
                  </div>

                  {/* Course Details */}
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-indigo-600 tracking-wider uppercase">
                      {classroom.subjectCode || '—'}
                    </p>
                    <p className="text-sm font-semibold text-slate-700 line-clamp-1 leading-snug">
                      {classroom.subjectName || 'Môn học chưa gán tên'}
                    </p>
                  </div>

                  {/* Metadata Info */}
                  <div className="pt-3 flex flex-col gap-2 border-t border-slate-50 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Học kỳ: <span className="font-semibold text-slate-700">{classroom.semester || '—'}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Sĩ số: <span className="font-semibold text-slate-700">{classroom.studentCount ?? 0} học viên</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Button */}
                <div className="px-6 pb-6 pt-0">
                  <button
                    onClick={() => handleEnterClass(classroom.classroomId)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-150 hover:shadow-lg hover:shadow-indigo-200 transition-all cursor-pointer"
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