import { ArrowLeft, Mail, Phone, BookOpen, GraduationCap, Loader2, AlertCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { adminService, AdminUserResponse } from "../../services/admin.service";
import { classroomService } from "../../services/classroom.service";

interface Course {
  id: string;
  code: string;
  title: string;
  status: "Đang học" | "Đã hoàn thành" | "Đang dạy";
  progress?: number;
  students?: number;
  // Điều hướng tới chi tiết lớp-môn (chỉ có ở nhánh học viên)
  classroomId?: number;
  classroomSubjectId?: number;
}

interface AdminUserDetail {
  id: number;
  name: string;
  email: string;
  phone: string;
  gender: "Male" | "Female" | "Other";
  dateOfBirth: string;
  role: "Học viên" | "Giảng viên";
  status: "active" | "inactive";
  avatar: string;
  avatarUrl?: string;
}

interface UserDetailPageProps {
  onBack?: () => void; // Made optional since we can use navigate(-1) by default
}

function mapBeUserToAdminDetail(u: AdminUserResponse): AdminUserDetail {
  const fname = u.firstName || "";
  const lname = u.lastName || "";
  const initials = ((fname[0] || "") + (lname[0] || "")).toUpperCase() || "??";
  const roleLabel = u.roles?.includes("TEACHER")
    ? "Giảng viên"
    : u.roles?.includes("STUDENT")
    ? "Học viên"
    : u.roles?.[0] || "USER";

  return {
    id: u.userId,
    name: `${fname} ${lname}`.trim() || u.email.split("@")[0],
    email: u.email,
    phone: u.phone || "—",
    gender: (u.gender as "Male" | "Female" | "Other") || "Other",
    dateOfBirth: u.bod || "—",
    role: roleLabel as any,
    status: u.status === "ACTIVE" ? "active" : "inactive",
    avatar: initials,
    avatarUrl: u.avatarUrl,
  };
}

// Removed mock courses since we fetch real data

export function UserDetailPage({ onBack }: UserDetailPageProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const data = await adminService.getUserById(Number(id));
        const userDetail = mapBeUserToAdminDetail(data);
        setUser(userDetail);

        // Fetch courses based on role
        if (userDetail.role === "Học viên") {
          // Sinh viên enroll vào lớp-môn (không phải lớp container) → lấy theo lớp-môn
          const studentClassSubjects = await classroomService.getClassroomSubjectsByStudent(userDetail.id);
          setCourses(studentClassSubjects.map(cs => ({
            id: String(cs.classroomSubjectId),
            code: cs.subjectCode || "",
            title: cs.displayName,
            status: "Đang học",
            progress: 0,
            classroomId: cs.classroomId,
            classroomSubjectId: cs.classroomSubjectId,
          })));
        } else {
          // Giảng viên phụ trách các lớp-môn → lấy theo lớp-môn
          const teacherClassSubjects = await classroomService.getClassroomSubjectsByLecturer(userDetail.id);
          setCourses(teacherClassSubjects.map(cs => ({
            id: String(cs.classroomSubjectId),
            code: cs.subjectCode || "",
            title: cs.displayName,
            status: "Đang dạy",
            students: cs.studentCount,
            classroomId: cs.classroomId,
            classroomSubjectId: cs.classroomSubjectId,
          })));
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Không thể tải thông tin người dùng");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-muted-foreground">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <span className="ml-3 text-sm">Đang tải...</span>
    </div>
  );

  if (error || !user) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-foreground">
      <AlertCircle className="w-10 h-10 text-destructive" />
      <p>{error || "Không tìm thấy người dùng"}</p>
      <button 
        onClick={handleBack} 
        className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors border-none cursor-pointer"
      >
        Quay lại
      </button>
    </div>
  );

  const isStudent = user.role === "Học viên";
  const isTeacher = user.role === "Giảng viên";
  const isAdmin = !isStudent && !isTeacher;

  return (
    <div className="space-y-6 text-foreground">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={handleBack} className="p-2 rounded-lg hover:bg-muted transition-colors border-none bg-transparent cursor-pointer">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <h1 className="text-2xl font-bold text-foreground">
          {isStudent ? "Thông tin Học viên" : isTeacher ? "Thông tin Giảng viên" : "Thông tin Quản trị viên"}
        </h1>
      </div>

      <div className={isAdmin ? "max-w-md mx-auto" : "grid grid-cols-1 lg:grid-cols-3 gap-6"}>
        {/* Left Column */}
        <div className={isAdmin ? "space-y-6 w-full" : "lg:col-span-1 space-y-6"}>
          <div className="p-6 text-center bg-card border border-border rounded-xl">
            <div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden bg-muted border-2 border-border shadow-sm">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-foreground text-3xl font-bold">{user.avatar}</span>
              )}
            </div>
            <h2 className="text-foreground mb-4 text-xl font-bold">{user.name}</h2>
            {!isAdmin && (
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="text-center">
                  <div className="text-foreground text-2xl font-bold">{courses.length}</div>
                  <div className="text-slate-300 text-xs">Môn học</div>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center">
                  <div className="text-foreground text-2xl font-bold">
                    {isStudent ? "0%" : courses.reduce((sum, c) => sum + (c.students || 0), 0)}
                  </div>
                  <div className="text-slate-300 text-xs">{isStudent ? "Hoàn thành" : "Học viên"}</div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-card border border-border rounded-xl">
            <h3 className="text-sm font-bold text-foreground mb-4">Thông tin cá nhân</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Giới tính</span>
                <span className="text-sm text-foreground font-semibold">{user.gender === "Male" ? "Nam" : user.gender === "Female" ? "Nữ" : "Khác"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ngày sinh</span>
                <span className="text-sm text-foreground font-semibold">{user.dateOfBirth === "—" ? "—" : new Date(user.dateOfBirth).toLocaleDateString("vi-VN")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Vai trò</span>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${
                  isStudent 
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" 
                    : "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300"
                }`}>{user.role}</span>
              </div>
            </div>
            <div className="border-t my-4 border-border" />
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-muted-foreground mb-0.5">Email</div>
                  <div className="text-sm text-foreground font-medium wordBreak: break-all">{user.email}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-muted-foreground mb-0.5">Số điện thoại</div>
                  <div className="text-sm text-foreground font-medium">{user.phone}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        {!isAdmin && (
          <div className="lg:col-span-2">
            <div className="p-6 bg-card border border-border rounded-xl">
              <div className="flex items-center gap-2 mb-6">
                {isStudent ? <BookOpen className="w-5 h-5 text-foreground" /> : <GraduationCap className="w-5 h-5 text-foreground" />}
                <h3 className="text-lg font-semibold text-foreground">
                  {isStudent ? "Môn học đã/đang học" : "Lớp học đang giảng dạy"}
                </h3>
              </div>
              <div className="space-y-4">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="p-5 bg-card hover:bg-muted/40 border border-border rounded-xl transition-colors cursor-pointer"
                    onClick={() =>
                      course.classroomSubjectId != null && course.classroomId != null
                        ? navigate(`/admin/classes/${course.classroomId}/subjects/${course.classroomSubjectId}`)
                        : navigate(`/admin/subjects/${course.id}`)
                    }
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2.5 py-0.5 text-xs font-bold bg-muted text-muted-foreground rounded-md">{course.code}</span>
                          <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-md ${
                            course.status === "Đã hoàn thành" 
                              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" 
                              : course.status === "Đang học" 
                              ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" 
                              : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          }`}>{course.status}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-foreground mt-2">{course.title}</h4>
                      </div>
                    </div>
                    {isStudent && course.progress !== undefined && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-muted-foreground">Tiến độ học tập</span>
                          <span className="text-xs text-foreground font-semibold">{course.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${course.progress}%` }} />
                        </div>
                      </div>
                    )}
                    {!isStudent && course.students !== undefined && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{course.students} học viên</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
