import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { http } from "../../../services/http";

interface StatsData {
  totalStudents: number;
  totalTeachers: number;
  totalClassrooms: number;
  totalSubjects: number;
}

export function CTASection() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatsData>({
    totalStudents: 500,
    totalTeachers: 10,
    totalClassrooms: 30,
    totalSubjects: 20,
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
        console.error("Lỗi lấy thống kê CTA từ DB, dùng dữ liệu mặc định:", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const studentsLabel = `${stats.totalStudents}+`;
  const subjectsLabel = `${stats.totalSubjects}+`;

  return (
    <section className="bg-[#030213] py-16 text-white font-sans">
      <div className="max-w-5xl mx-auto px-6">
        <div className="relative overflow-hidden rounded-md border border-white/10 bg-white/5 px-8 py-12 md:px-16 md:py-14 shadow-xs">
          <div className="relative space-y-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-1.5 text-xs text-white border border-white/10 mx-auto">
              <Sparkles className="h-4 w-4 text-slate-200" />
              <span className="font-semibold">Sẵn sàng đổi cách học?</span>
            </div>
            <h2 className="text-2xl font-bold leading-tight md:text-4xl text-wrap-balance">
              Bắt đầu hành trình học tập
              <br />
              theo cách mới
            </h2>
            <p className="max-w-xl mx-auto text-xs leading-relaxed text-slate-400">
              Tham gia cộng đồng sinh viên và giảng viên đang định hình lại cách học đại học với công cụ học tập hiện đại và lộ trình rõ ràng.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                onClick={() => navigate("/register")}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-6 py-2.5 text-xs font-semibold text-slate-950 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Đăng ký miễn phí
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => navigate("/login")}
                className="inline-flex items-center justify-center rounded-md border border-white/15 bg-white/5 px-6 py-2.5 text-xs font-medium text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                Đăng nhập
              </button>
            </div>
            <div className="mx-auto flex max-w-md flex-wrap justify-center gap-4 text-[10px] text-slate-500">
              <span>{studentsLabel} sinh viên tin dùng</span>
              <span className="inline-block h-1 w-1 rounded-full bg-slate-700 mt-1.5" />
              <span>{subjectsLabel} môn học</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
