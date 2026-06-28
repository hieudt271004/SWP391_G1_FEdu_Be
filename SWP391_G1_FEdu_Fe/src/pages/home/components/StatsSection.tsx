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
    let isMounted = true;
    http.get<StatsData>("/public/about/stats")
      .then((data) => {
        if (!isMounted) return;
        if (data) {
          setStats(data);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Lỗi lấy dữ liệu thống kê từ DB, sử dụng dữ liệu mặc định:", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const statsItems = [
    {
      icon: Users,
      value: `${stats.totalStudents}+`,
      label: "Sinh viên tin dùng",
    },
    {
      icon: BookOpen,
      value: `${stats.totalSubjects}+`,
      label: "Môn học được giảng dạy",
    },
    {
      icon: GraduationCap,
      value: `${stats.totalClassrooms}+`,
      label: "Lớp học đã mở",
    },
    {
      icon: Sparkles,
      value: "95%",
      label: "Đánh giá tích cực",
    },
  ];

  return (
    <section className="bg-[#030213] border-y border-white/10 py-16 font-sans text-white relative overflow-hidden">
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-blue-500/5 blur-[80px] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-10 items-center relative">
        <div className="space-y-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kết quả FEdu</span>
          <h2 className="text-2xl font-bold text-white leading-tight">Những con số<br />tạo nên niềm tin</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {statsItems.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="p-5 rounded-md border border-white/10 bg-white/5 flex items-center gap-4 hover:border-white/20 transition-all duration-300">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/10 text-white shrink-0 border border-white/5">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-white tracking-tight leading-none">{stat.value}</div>
                  <div className="text-[10px] font-medium text-slate-400 mt-2.5 leading-none">{stat.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
