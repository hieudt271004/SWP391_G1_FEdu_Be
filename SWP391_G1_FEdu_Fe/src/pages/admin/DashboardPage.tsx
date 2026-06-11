import { useState, useEffect } from "react";
import { Users, BookOpen, GraduationCap, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { adminService } from "../../services/admin.service";
import { subjectService } from "../../services/subject.service";

const baseMetrics = [
  {
    id: "students",
    label: "Tổng Học viên",
    icon: Users,
    color: "#4338ca",
    bg: "#eef2ff",
  },
  {
    id: "teachers",
    label: "Tổng Giảng viên",
    icon: GraduationCap,
    color: "#db2777",
    bg: "#fdf2f8",
  },
  {
    id: "courses",
    label: "Số Khóa học",
    icon: BookOpen,
    color: "#059669",
    bg: "#ecfdf5",
  },
];

const chartData = [
  { month: "Th1", students: 820 },
  { month: "Th2", students: 950 },
  { month: "Th3", students: 1100 },
  { month: "Th4", students: 980 },
  { month: "Th5", students: 1250 },
  { month: "Th6", students: 1420 },
  { month: "Th7", students: 1380 },
  { month: "Th8", students: 1550 },
  { month: "Th9", students: 1620 },
  { month: "Th10", students: 1480 },
  { month: "Th11", students: 1700 },
  { month: "Th12", students: 1850 },
];

const recentActivities = [
  { user: "Nguyễn Văn A", action: "đã đăng ký khóa React Advanced", time: "5 phút trước" },
  { user: "Trần Thị B", action: "đã hoàn thành khóa Python Basics", time: "12 phút trước" },
  { user: "Lê Minh C", action: "đã để lại đánh giá 5 sao", time: "25 phút trước" },
  { user: "Phạm Thu D", action: "đã đăng ký làm giảng viên", time: "1 giờ trước" },
  { user: "Hoàng Văn E", action: "đã nạp 500.000 VNĐ", time: "2 giờ trước" },
];

export function DashboardPage() {
  const [stats, setStats] = useState({ students: "0", teachers: "0", courses: "0", revenue: "2.4B VNĐ" });

  useEffect(() => {
    async function loadData() {
      try {
        const [users, coursesData] = await Promise.all([
          adminService.getAllUsers(),
          subjectService.getAll()
        ]);
        
        const students = users.filter(u => u.roles.includes("STUDENT")).length;
        const teachers = users.filter(u => u.roles.includes("TEACHER")).length;
        
        setStats({
          students: students.toLocaleString(),
          teachers: teachers.toLocaleString(),
          courses: coursesData.length.toLocaleString(),
          revenue: "2.4B VNĐ" // Mock cho đến khi có API doanh thu
        });
      } catch (err) {
        console.error("Failed to load dashboard metrics", err);
      }
    }
    loadData();
  }, []);

  const maxValue = Math.max(...chartData.map((d) => d.students));

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827", marginBottom: "0.25rem" }}>
          Tổng quan
        </h1>
        <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
          Chào mừng trở lại! Đây là bảng điều khiển của bạn.
        </p>
      </div>

      {/* Metrics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {baseMetrics.map((metric) => {
          const Icon = metric.icon;
          const value = stats[metric.id as keyof typeof stats];

          return (
            <div
              key={metric.id}
              className="rounded-xl p-5"
              style={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: metric.bg }}
                >
                  <Icon className="w-5 h-5" style={{ color: metric.color }} />
                </div>
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", marginBottom: "0.25rem" }}>
                {value}
              </div>
              <div style={{ fontSize: "0.8125rem", color: "#6b7280" }}>{metric.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
