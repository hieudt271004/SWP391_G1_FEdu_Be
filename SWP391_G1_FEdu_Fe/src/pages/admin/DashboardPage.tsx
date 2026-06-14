import { useState, useEffect } from "react";
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  UserCheck, 
  Plus, 
  ArrowRight, 
  Activity, 
  Clock, 
  FileText,
  Sparkles
} from "lucide-react";
import { adminService } from "../../services/admin.service";
import { subjectService } from "../../services/subject.service";
import { useNavigate } from "react-router-dom";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

interface StatsState {
  students: string;
  teachers: string;
  courses: string;
  activeRatio: string;
}

interface MonthlyData {
  month: string;
  monthKey: number;
  yearKey: number;
  count: number;
}

interface ActivityItem {
  name: string;
  email: string;
  role: string;
  time: string;
}

// Reading this as: Admin Dashboard for FEdu administrators, with a SaaS B2B, clean, and data-dense language, leaning toward Outfit-driven modern minimalism.
export function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsState>({ 
    students: "0", 
    teachers: "0", 
    courses: "0", 
    activeRatio: "0%" 
  });
  const [chartData, setChartData] = useState<MonthlyData[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [users, coursesData] = await Promise.all([
          adminService.getAllUsers(),
          subjectService.getAll()
        ]);

        // 1. Calculate KPI Metrics
        const studentsList = users.filter(u => u.roles.includes("STUDENT"));
        const teachersList = users.filter(u => u.roles.includes("TEACHER"));
        
        const totalStudents = studentsList.length;
        const totalTeachers = teachersList.length;
        const totalCourses = coursesData.length;
        
        const activeUsers = users.filter(u => u.status === "ACTIVE").length;
        const activeRatio = users.length > 0 
          ? ((activeUsers / users.length) * 100).toFixed(1) + "%" 
          : "0%";

        setStats({
          students: totalStudents.toLocaleString(),
          teachers: totalTeachers.toLocaleString(),
          courses: totalCourses.toLocaleString(),
          activeRatio
        });

        // 2. Generate Student Registration Trend (Last 6 Months)
        const last6Months: MonthlyData[] = Array.from({ length: 6 }, (_, i) => {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          return {
            month: `Th ${d.getMonth() + 1}`,
            monthKey: d.getMonth(),
            yearKey: d.getFullYear(),
            count: 0
          };
        }).reverse();

        studentsList.forEach(student => {
          if (student.createdAt) {
            const date = new Date(student.createdAt);
            const m = date.getMonth();
            const y = date.getFullYear();
            const target = last6Months.find(item => item.monthKey === m && item.yearKey === y);
            if (target) {
              target.count += 1;
            }
          }
        });
        setChartData(last6Months);

        // 3. Generate Recent Activities (Latest 5 registered users)
        const sortedUsers = [...users]
          .filter(u => u.createdAt)
          .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
          .slice(0, 5);

        const activityList: ActivityItem[] = sortedUsers.map(u => {
          const fullName = `${u.lastName || ""} ${u.firstName || ""}`.trim() || "Người dùng mới";
          let relativeTime = "Gần đây";
          
          if (u.createdAt) {
            const diffMs = new Date().getTime() - new Date(u.createdAt).getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMins / 60);
            
            if (diffMins < 60) {
              relativeTime = `${diffMins > 0 ? diffMins : 1} phút trước`;
            } else if (diffHours < 24) {
              relativeTime = `${diffHours} giờ trước`;
            } else {
              relativeTime = new Date(u.createdAt).toLocaleDateString("vi-VN");
            }
          }

          let displayRole = "Người dùng";
          if (u.roles.includes("ADMIN")) displayRole = "Quản trị viên";
          else if (u.roles.includes("TEACHER")) displayRole = "Giảng viên";
          else if (u.roles.includes("STUDENT")) displayRole = "Học viên";
          else if (u.roles.includes("SUB_MENTOR")) displayRole = "Trợ giảng";

          return {
            name: fullName,
            email: u.email,
            role: displayRole,
            time: relativeTime
          };
        });

        setActivities(activityList);

      } catch (err) {
        console.error("Failed to load dashboard metrics", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  // Loading skeleton screen matching Bento grid layout shapes exactly
  if (loading) {
    return (
      <div className="space-y-8 animate-pulse p-1">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-slate-100 rounded-lg" />
            <div className="h-4 w-96 bg-slate-50 rounded" />
          </div>
          <div className="h-7 w-32 bg-slate-100 rounded-full" />
        </div>

        {/* Bento KPIs Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-2 h-36 bg-slate-50 border border-slate-100 rounded-2xl" />
          <div className="h-36 bg-slate-50 border border-slate-100 rounded-2xl" />
          <div className="h-36 bg-slate-50 border border-slate-100 rounded-2xl" />
          <div className="h-36 bg-slate-50 border border-slate-100 rounded-2xl" />
        </div>

        {/* Main Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-50 border border-slate-100 rounded-2xl" />
          <div className="h-96 bg-slate-50 border border-slate-100 rounded-2xl" />
        </div>

        {/* Quick Actions Skeleton */}
        <div className="h-44 bg-slate-50 border border-slate-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto p-1">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-6">
        <div className="space-y-1">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tighter leading-none font-sans">
            Tổng quan hệ thống
          </h1>
          <p className="text-sm text-slate-500 max-w-[65ch] leading-relaxed mt-2">
            Xem báo cáo nhanh và quản lý toàn diện các hoạt động đào tạo của hệ thống FEdu.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/60 text-xs font-semibold text-slate-600 shadow-sm self-start md:self-auto">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
          </span>
          Hệ thống trực tuyến
        </div>
      </div>

      {/* Bento Grid KPIs Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Main Hero Card (2x1 Bento span) */}
        <div className="md:col-span-2 bg-slate-50/50 border border-slate-200/80 p-6 rounded-2xl relative overflow-hidden group shadow-xs">
          <div className="space-y-4 relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-[10px] text-indigo-700 font-bold uppercase tracking-wider border border-indigo-100/50">
                <Sparkles className="w-3 h-3" /> Học viên tích cực
              </div>
              <h3 className="text-sm font-semibold text-slate-400 mt-3 uppercase tracking-wider">Tổng Học viên</h3>
            </div>
            <div>
              <h2 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight font-sans tabular-nums">
                {stats.students}
              </h2>
              <p className="text-xs text-slate-500 mt-2">Tài khoản học viên đã đăng ký trên hệ thống</p>
            </div>
          </div>
          {/* Subtle Decorative Background Element */}
          <div className="absolute right-6 bottom-4 opacity-5 text-indigo-950 pointer-events-none transition-transform group-hover:scale-110 duration-500">
            <Users className="w-36 h-36" />
          </div>
        </div>

        {/* KPI 2: Total Teachers */}
        <div className="bg-white border border-slate-100 hover:border-slate-200 hover:shadow-lg hover:shadow-slate-100/40 p-6 rounded-2xl transition-all duration-300 group flex flex-col justify-between h-full">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng Giảng viên</span>
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center transition-transform group-hover:scale-105 duration-300">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight font-sans tabular-nums">
              {stats.teachers}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Đội ngũ giảng dạy</p>
          </div>
        </div>

        {/* KPI 3: Total Courses */}
        <div className="bg-white border border-slate-100 hover:border-slate-200 hover:shadow-lg hover:shadow-slate-100/40 p-6 rounded-2xl transition-all duration-300 group flex flex-col justify-between h-full">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Số Môn học</span>
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center transition-transform group-hover:scale-105 duration-300">
              <BookOpen className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight font-sans tabular-nums">
              {stats.courses}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Chương trình môn học</p>
          </div>
        </div>

        {/* KPI 4: Active Ratio */}
        <div className="bg-white border border-slate-100 hover:border-slate-200 hover:shadow-lg hover:shadow-slate-100/40 p-6 rounded-2xl transition-all duration-300 group flex flex-col justify-between h-full">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tỷ lệ Hoạt động</span>
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center transition-transform group-hover:scale-105 duration-300">
              <UserCheck className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight font-sans tabular-nums">
              {stats.activeRatio}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Trạng thái Active</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Visual Trend Chart + Recent Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trend Area Chart (2/3 width) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between min-h-[380px]">
          <div className="flex items-start justify-between mb-6">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Xu hướng đăng ký Học viên</h3>
              <p className="text-xs text-slate-400">Số lượng học viên mới tham gia trong 6 tháng qua</p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/60 text-[11px] text-slate-600 font-semibold">
              <Activity className="w-3.5 h-3.5 text-indigo-600" />
              Báo cáo thời gian thực
            </div>
          </div>

          <div className="h-72 w-full flex-1 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorStudentsRedesign" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.12}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Outfit' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Outfit' }} 
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '12px', 
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)',
                    fontFamily: 'Outfit'
                  }}
                  labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  name="Học viên mới"
                  stroke="#4f46e5" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorStudentsRedesign)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Registered Members Feed (1/3 width) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between min-h-[380px]">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Đăng ký gần đây</h3>
              <p className="text-xs text-slate-400">Danh sách 5 thành viên mới nhất</p>
            </div>
            <Clock className="w-4 h-4 text-slate-400 animate-pulse" />
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto pr-1">
            {activities.length > 0 ? (
              activities.map((activity, idx) => (
                <div key={idx} className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-slate-50/80 transition-colors duration-200 border border-transparent hover:border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200/50 flex items-center justify-center font-bold text-slate-700 text-sm shrink-0 shadow-2xs">
                    {activity.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5">
                      <h4 className="text-sm font-semibold text-slate-800 truncate leading-snug">{activity.name}</h4>
                      <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap font-sans">{activity.time}</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate leading-snug">{activity.email}</p>
                    <span className="inline-block mt-1 text-[9px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100/40 tracking-wide">
                      {activity.role}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10 gap-2">
                <Clock className="w-8 h-8 text-slate-200" />
                <span className="text-xs">Chưa có hoạt động mới</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tactile Quick Actions Panel */}
      <div className="bg-slate-50/30 border border-slate-100 p-6 rounded-2xl shadow-2xs">
        <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-4">Thao tác nhanh</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate("/admin/users")}
            className="flex items-center justify-between p-4 rounded-xl bg-white border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/5 hover:shadow-sm active:scale-[0.98] active:translate-y-[0.5px] transition-all duration-200 group text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50/50 text-indigo-600 flex items-center justify-center group-hover:scale-105 duration-200 border border-indigo-100/20">
                <Plus className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-slate-800">Quản lý User</h4>
                <p className="text-[11px] text-slate-400">Tài khoản thành viên</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 duration-200" />
          </button>

          <button
            onClick={() => navigate("/admin/subjects")}
            className="flex items-center justify-between p-4 rounded-xl bg-white border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/5 hover:shadow-sm active:scale-[0.98] active:translate-y-[0.5px] transition-all duration-200 group text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50/50 text-indigo-600 flex items-center justify-center group-hover:scale-105 duration-200 border border-indigo-100/20">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-slate-800">Tạo Môn học</h4>
                <p className="text-[11px] text-slate-400">Môn học đào tạo</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 duration-200" />
          </button>

          <button
            onClick={() => navigate("/admin/classes")}
            className="flex items-center justify-between p-4 rounded-xl bg-white border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/5 hover:shadow-sm active:scale-[0.98] active:translate-y-[0.5px] transition-all duration-200 group text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50/50 text-indigo-600 flex items-center justify-center group-hover:scale-105 duration-200 border border-indigo-100/20">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-slate-800">Quản lý Lớp</h4>
                <p className="text-[11px] text-slate-400">Phân công lớp học</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 duration-200" />
          </button>

          <div
            className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 opacity-60 cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center border border-slate-200/30">
                <FileText className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-slate-500">Xem Báo cáo</h4>
                <p className="text-[11px] text-slate-400">Doanh thu (Sắp ra mắt)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
