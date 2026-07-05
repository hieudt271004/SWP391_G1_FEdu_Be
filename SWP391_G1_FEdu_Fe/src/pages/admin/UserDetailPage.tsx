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
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#030213" }} />
      <span style={{ marginLeft: "0.75rem", color: "#717182", fontFamily: "Outfit, sans-serif" }}>Đang tải...</span>
    </div>
  );

  if (error || !user) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ fontFamily: "Outfit, sans-serif" }}>
      <AlertCircle className="w-10 h-10" style={{ color: "#dc2626" }} />
      <p style={{ color: "#000000" }}>{error || "Không tìm thấy người dùng"}</p>
      <button onClick={handleBack} className="px-4 py-2 text-white text-sm transition-colors hover:bg-[#1c1b2d] border-none cursor-pointer" style={{ backgroundColor: "#030213", borderRadius: "6px", fontWeight: 600 }}>Quay lại</button>
    </div>
  );

  const isStudent = user.role === "Học viên";
  const isTeacher = user.role === "Giảng viên";
  const isAdmin = !isStudent && !isTeacher;

  return (
    <div className="space-y-6" style={{ fontFamily: "Outfit, sans-serif" }}>
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={handleBack} className="p-2 rounded-lg hover:bg-gray-100 transition-colors border-none bg-transparent cursor-pointer">
          <ArrowLeft className="w-5 h-5" style={{ color: "#717182" }} />
        </button>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#030213" }}>
          {isStudent ? "Thông tin Học viên" : isTeacher ? "Thông tin Giảng viên" : "Thông tin Quản trị viên"}
        </h1>
      </div>

      <div className={isAdmin ? "max-w-md mx-auto" : "grid grid-cols-1 lg:grid-cols-3 gap-6"}>
        {/* Left Column */}
        <div className={isAdmin ? "space-y-6 w-full" : "lg:col-span-1 space-y-6"}>
          <div className="p-6 text-center" style={{ backgroundColor: "#030213", borderRadius: "10px" }}>
            <div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.15)", border: "2px solid white" }}>
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-3xl font-bold">{user.avatar}</span>
              )}
            </div>
            <h2 className="text-white mb-4" style={{ fontSize: "1.25rem", fontWeight: 700 }}>{user.name}</h2>
            {!isAdmin && (
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="text-center">
                  <div className="text-white text-2xl font-bold">{courses.length}</div>
                  <div className="text-slate-300 text-xs">Môn học</div>
                </div>
                <div className="w-px h-10" style={{ backgroundColor: "rgba(255,255,255,0.2)" }} />
                <div className="text-center">
                  <div className="text-white text-2xl font-bold">
                    {isStudent ? "0%" : courses.reduce((sum, c) => sum + (c.students || 0), 0)}
                  </div>
                  <div className="text-slate-300 text-xs">{isStudent ? "Hoàn thành" : "Học viên"}</div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6" style={{ backgroundColor: "white", border: "1px solid rgba(0, 0, 0, 0.1)", borderRadius: "10px" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#030213", marginBottom: "1rem" }}>Thông tin cá nhân</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span style={{ fontSize: "0.875rem", color: "#717182" }}>Giới tính</span>
                <span style={{ fontSize: "0.875rem", color: "#030213", fontWeight: 600 }}>{user.gender === "Male" ? "Nam" : user.gender === "Female" ? "Nữ" : "Khác"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: "0.875rem", color: "#717182" }}>Ngày sinh</span>
                <span style={{ fontSize: "0.875rem", color: "#030213", fontWeight: 600 }}>{user.dateOfBirth === "—" ? "—" : new Date(user.dateOfBirth).toLocaleDateString("vi-VN")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: "0.875rem", color: "#717182" }}>Vai trò</span>
                <span className="px-2.5 py-1 text-xs" style={{ backgroundColor: isStudent ? "#e0f2fe" : "#fce7f3", color: isStudent ? "#0369a1" : "#9d174d", fontWeight: 600, borderRadius: "6px" }}>{user.role}</span>
              </div>
            </div>
            <div className="border-t my-4" style={{ borderColor: "rgba(0, 0, 0, 0.1)" }} />
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#717182" }} />
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: "0.75rem", color: "#717182", marginBottom: "0.125rem" }}>Email</div>
                  <div style={{ fontSize: "0.875rem", color: "#030213", fontWeight: 500, wordBreak: "break-all" }}>{user.email}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#717182" }} />
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: "0.75rem", color: "#717182", marginBottom: "0.125rem" }}>Số điện thoại</div>
                  <div style={{ fontSize: "0.875rem", color: "#030213", fontWeight: 500 }}>{user.phone}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        {!isAdmin && (
          <div className="lg:col-span-2">
          <div className="p-6" style={{ backgroundColor: "white", border: "1px solid rgba(0, 0, 0, 0.1)", borderRadius: "10px" }}>
            <div className="flex items-center gap-2 mb-6">
              {isStudent ? <BookOpen className="w-5 h-5" style={{ color: "#030213" }} /> : <GraduationCap className="w-5 h-5" style={{ color: "#030213" }} />}
              <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#030213" }}>
                {isStudent ? "Môn học đã/đang học" : "Lớp học đang giảng dạy"}
              </h3>
            </div>
            <div className="space-y-4">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="p-5 hover:bg-gray-50 transition-colors cursor-pointer"
                  style={{ border: "1px solid rgba(0, 0, 0, 0.1)", borderRadius: "10px" }}
                  onClick={() =>
                    course.classroomSubjectId != null && course.classroomId != null
                      ? navigate(`/admin/classes/${course.classroomId}/subjects/${course.classroomSubjectId}`)
                      : navigate(`/admin/subjects/${course.id}`)
                  }
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 text-xs font-bold" style={{ backgroundColor: "#ececf0", color: "#030213", borderRadius: "6px" }}>{course.code}</span>
                        <span className="px-2.5 py-0.5 text-xs font-semibold" style={{
                          backgroundColor: course.status === "Đã hoàn thành" ? "#d1fae5" : course.status === "Đang học" ? "#fef3c7" : "#e0f2fe",
                          color: course.status === "Đã hoàn thành" ? "#065f46" : course.status === "Đang học" ? "#b45309" : "#0369a1",
                          borderRadius: "6px",
                        }}>{course.status}</span>
                      </div>
                      <h4 style={{ fontSize: "1rem", fontWeight: 600, color: "#030213" }}>{course.title}</h4>
                    </div>
                  </div>
                  {isStudent && course.progress !== undefined && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span style={{ fontSize: "0.8125rem", color: "#717182" }}>Tiến độ học tập</span>
                        <span style={{ fontSize: "0.8125rem", color: "#030213", fontWeight: 600 }}>{course.progress}%</span>
                      </div>
                      <div className="w-full h-2 overflow-hidden" style={{ backgroundColor: "#ececf0", borderRadius: "6px" }}>
                        <div className="h-full transition-all" style={{ width: `${course.progress}%`, backgroundColor: "#030213", borderRadius: "6px" }} />
                      </div>
                    </div>
                  )}
                  {!isStudent && course.students !== undefined && (
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" style={{ color: "#717182" }} />
                      <span style={{ fontSize: "0.875rem", color: "#717182" }}>{course.students} học viên</span>
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
