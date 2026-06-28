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
    let isMounted = true;
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [users, coursesData] = await Promise.all([
          adminService.getAllUsers(),
          subjectService.getAll()
        ]);

        if (!isMounted) return;

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

          return {
            name: fullName,
            email: u.email,
            role: displayRole,
            time: relativeTime
          };
        });

        setActivities(activityList);

      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to load dashboard metrics", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Redesigned loading skeleton using the updated layout grid
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-1">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-muted/60 rounded-md" />
            <div className="h-4 w-80 bg-muted/40 rounded" />
          </div>
          <div className="h-8 w-28 bg-muted/60 rounded-lg" />
        </div>

        {/* KPIs Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-[120px] bg-muted/20 border border-border/40 rounded-xl p-5 flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <div className="h-3 w-20 bg-muted/50 rounded" />
                <div className="w-8 h-8 bg-muted/50 rounded-lg" />
              </div>
              <div className="space-y-2">
                <div className="h-7 w-16 bg-muted/60 rounded" />
                <div className="h-3 w-28 bg-muted/40 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Main Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[380px] bg-muted/20 border border-border/40 rounded-xl p-5" />
          <div className="h-[380px] bg-muted/20 border border-border/40 rounded-xl p-5" />
        </div>

        {/* Quick Actions Skeleton */}
        <div className="h-[120px] bg-muted/20 border border-border/40 rounded-xl p-5" />
      </div>
    );
  }

  // Custom Recharts Tooltip for a premium, high-contrast visual
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-sm">
          <p className="text-xs font-semibold text-foreground">{label}</p>
          <p className="text-xs font-medium text-primary mt-1 dark:text-indigo-400">
            {payload[0].name}: <span className="font-bold text-foreground">{payload[0].value} học viên</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-1 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Tổng quan hệ thống
          </h1>
          <p className="text-xs text-muted-foreground">
            Xem báo cáo nhanh và quản lý toàn diện các hoạt động đào tạo của hệ thống FEdu.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Mock Time Filter Selector */}
          <div className="bg-card border border-border/80 px-3 py-1.5 rounded-lg text-xs font-medium text-foreground shadow-xs hover:bg-accent/40 active:bg-accent/60 transition-all duration-200 cursor-pointer flex items-center gap-1.5">
            6 tháng qua
          </div>
          {/* Status Indicator */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/40 border border-border/60 text-xs font-medium text-muted-foreground shadow-2xs">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            Trực tuyến
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Students */}
        <div className="bg-card border border-border/60 p-5 rounded-xl hover:border-border hover:bg-accent/5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-300 flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground tracking-wide">Tổng Học viên</span>
            <div className="p-2 bg-muted/60 rounded-lg text-muted-foreground/90">
              <Users className="w-4 h-4 text-foreground/80" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-foreground tracking-tight tabular-nums">
              {stats.students}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Tài khoản học viên đã đăng ký</p>
          </div>
        </div>

        {/* KPI 2: Total Teachers */}
        <div className="bg-card border border-border/60 p-5 rounded-xl hover:border-border hover:bg-accent/5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-300 flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground tracking-wide">Tổng Giảng viên</span>
            <div className="p-2 bg-muted/60 rounded-lg text-muted-foreground/90">
              <GraduationCap className="w-4 h-4 text-foreground/80" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-foreground tracking-tight tabular-nums">
              {stats.teachers}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Đội ngũ giảng dạy trực tuyến</p>
          </div>
        </div>

        {/* KPI 3: Total Courses */}
        <div className="bg-card border border-border/60 p-5 rounded-xl hover:border-border hover:bg-accent/5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-300 flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground tracking-wide">Số Môn học</span>
            <div className="p-2 bg-muted/60 rounded-lg text-muted-foreground/90">
              <BookOpen className="w-4 h-4 text-foreground/80" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-foreground tracking-tight tabular-nums">
              {stats.courses}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Chương trình môn học hiện có</p>
          </div>
        </div>

        {/* KPI 4: Active Ratio */}
        <div className="bg-card border border-border/60 p-5 rounded-xl hover:border-border hover:bg-accent/5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-300 flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground tracking-wide">Tỷ lệ Hoạt động</span>
            <div className="p-2 bg-muted/60 rounded-lg text-muted-foreground/90">
              <UserCheck className="w-4 h-4 text-foreground/80" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-foreground tracking-tight tabular-nums">
              {stats.activeRatio}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Trạng thái người dùng Active</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Trend Chart + Recent Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (2/3 width) */}
        <div className="lg:col-span-2 bg-card rounded-xl p-5 border border-border/60 flex flex-col justify-between min-h-[380px]">
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-0.5">
              <h3 className="text-sm font-semibold text-foreground">Xu hướng đăng ký Học viên</h3>
              <p className="text-xs text-muted-foreground">Số lượng học viên mới tham gia trong 6 tháng qua</p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/30 border border-border/50 text-[10px] text-muted-foreground font-medium">
              <Activity className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              Báo cáo tự động
            </div>
          </div>

          <div className="h-72 w-full flex-1 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorStudentsRedesign" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.08}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11, fontFamily: 'Outfit' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11, fontFamily: 'Outfit' }} 
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  name="Học viên mới"
                  stroke="var(--primary)" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorStudentsRedesign)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Registered Members Feed (1/3 width) */}
        <div className="bg-card rounded-xl p-5 border border-border/60 flex flex-col justify-between min-h-[380px]">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-0.5">
              <h3 className="text-sm font-semibold text-foreground">Đăng ký gần đây</h3>
              <p className="text-xs text-muted-foreground">Danh sách 5 thành viên mới nhất</p>
            </div>
            <Clock className="w-3.5 h-3.5 text-muted-foreground/80" />
          </div>

          <div className="space-y-3.5 flex-1 overflow-y-auto pr-1">
            {activities.length > 0 ? (
              activities.map((activity, idx) => {
                // Determine style of role badge based on roles
                let badgeStyle = "bg-muted/80 text-foreground/80 border-border/40";
                if (activity.role === "Quản trị viên") {
                  badgeStyle = "bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30";
                } else if (activity.role === "Giảng viên") {
                  badgeStyle = "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30";
                } else if (activity.role === "Học viên") {
                  badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30";
                } else if (activity.role === "Trợ giảng") {
                  badgeStyle = "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30";
                }

                return (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/40 transition-colors duration-200 border border-transparent hover:border-border/30">
                    <div className="w-8 h-8 rounded-full bg-accent border border-border/50 text-accent-foreground flex items-center justify-center font-semibold text-xs shrink-0">
                      {activity.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <h4 className="text-xs font-semibold text-foreground truncate">{activity.name}</h4>
                        <span className="text-[10px] text-muted-foreground/75 whitespace-nowrap">{activity.time}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{activity.email}</p>
                      <span className={`inline-block mt-1 text-[9px] font-medium px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                        {activity.role}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-10 gap-2">
                <Clock className="w-6 h-6 text-muted/60" />
                <span className="text-xs">Chưa có hoạt động mới</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tactile Quick Actions Panel */}
      <div className="bg-card border border-border/60 p-5 rounded-xl">
        <h3 className="text-sm font-semibold text-foreground mb-4">Thao tác nhanh</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate("/admin/users")}
            className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/80 hover:border-primary/30 hover:bg-accent/30 transition-all duration-200 group text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center border border-border/40 text-foreground group-hover:scale-102 transition-transform duration-200">
                <Plus className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-foreground">Quản lý User</h4>
                <p className="text-[10px] text-muted-foreground mt-0.5">Tài khoản thành viên</p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all duration-200" />
          </button>

          <button
            onClick={() => navigate("/admin/subjects")}
            className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/80 hover:border-primary/30 hover:bg-accent/30 transition-all duration-200 group text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center border border-border/40 text-foreground group-hover:scale-102 transition-transform duration-200">
                <BookOpen className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-foreground">Tạo Môn học</h4>
                <p className="text-[10px] text-muted-foreground mt-0.5">Môn học đào tạo</p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all duration-200" />
          </button>

          <button
            onClick={() => navigate("/admin/classes")}
            className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/80 hover:border-primary/30 hover:bg-accent/30 transition-all duration-200 group text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center border border-border/40 text-foreground group-hover:scale-102 transition-transform duration-200">
                <GraduationCap className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-foreground">Quản lý Lớp</h4>
                <p className="text-[10px] text-muted-foreground mt-0.5">Phân công lớp học</p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all duration-200" />
          </button>

          <div
            className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-muted/20 opacity-50 cursor-not-allowed select-none"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center border border-border/30 text-muted-foreground">
                <FileText className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground">Xem Báo cáo</h4>
                <p className="text-[10px] text-muted-foreground/80 mt-0.5">Doanh thu (Sắp ra mắt)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

