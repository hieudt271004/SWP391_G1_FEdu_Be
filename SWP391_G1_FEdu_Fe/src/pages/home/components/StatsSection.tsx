import { useEffect, useState } from "react";
import { Users, BookOpen, GraduationCap, Sparkles } from "lucide-react";
import { http } from "../../../services/http";

interface StatsData {
  totalStudents: number;
  totalTeachers: number;
  totalClassrooms: number;
  totalSubjects: number;
}

export function StatsSection() {
  const [stats, setStats] = useState<StatsData>({
    totalStudents: 500,
    totalSubjects: 20,
    totalClassrooms: 30,
    totalTeachers: 10,
  });

  useEffect(() => {
    http.get<StatsData>("/public/about/stats")
      .then((data) => {
        if (data) {
          setStats(data);
        }
      })
      .catch((err) => {
        console.error("Lỗi lấy dữ liệu thống kê từ DB, sử dụng dữ liệu mặc định:", err);
      });
  }, []);

  const statsItems = [
    {
      icon: Users,
      value: stats.totalStudents > 50 ? `${stats.totalStudents}+` : "500+",
      label: "Sinh viên",
      bg: "bg-blue-50",
      color: "text-blue-700",
    },
    {
      icon: BookOpen,
      value: stats.totalSubjects > 10 ? `${stats.totalSubjects}` : "20",
      label: "Môn học",
      bg: "bg-blue-50",
      color: "text-blue-700",
    },
    {
      icon: GraduationCap,
      value: stats.totalClassrooms > 10 ? `${stats.totalClassrooms}` : "30",
      label: "Lớp học hiện hành",
      bg: "bg-blue-50",
      color: "text-blue-700",
    },
    {
      icon: Sparkles,
      value: "95%",
      label: "Đánh giá tích cực",
      bg: "bg-amber-50",
      color: "text-amber-600",
    },
  ];

  return (
    <section className="bg-background border-y border-border/60 py-16 font-sans">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10 items-center">
        <div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kết quả FEdu</span>
          <h2 className="text-2xl font-bold text-foreground mt-2 leading-tight">Những con số tạo nên niềm tin</h2>
        </div>
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          {statsItems.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="p-5 rounded-md border border-border/50 bg-card flex items-start gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-primary border border-border/40 shrink-0">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground tracking-tight">{stat.value}</div>
                  <div className="text-xs font-medium text-muted-foreground mt-0.5">{stat.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
