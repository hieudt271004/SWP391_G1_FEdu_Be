import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { http } from "../../../services/http";
import { Button } from "../../../components/ui/button";

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
    <section className="bg-background py-16 text-foreground font-sans border-t border-border">
      <div className="max-w-5xl mx-auto px-6">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-8 py-12 md:px-16 md:py-14 shadow-xs">
          {}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-primary/5 blur-[100px] pointer-events-none" />
          
          <div className="relative space-y-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-lg bg-muted px-3.5 py-1.5 text-xs text-foreground border border-border mx-auto font-semibold">
              <Sparkles className="h-4 w-4 text-foreground" />
              Sẵn sàng đổi cách học?
            </div>
            <h2 className="text-2xl font-extrabold leading-tight tracking-tight md:text-4xl text-foreground">
              Bắt đầu hành trình học tập
              <br />
              theo cách mới
            </h2>
            <p className="max-w-xl mx-auto text-xs leading-relaxed text-muted-foreground">
              Tham gia cộng đồng sinh viên và giảng viên đang định hình lại cách học đại học với công cụ học tập hiện đại và lộ trình rõ ràng.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                onClick={() => navigate("/register")}
                className="gap-2 h-10 px-6 font-semibold"
              >
                Đăng ký miễn phí
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => navigate("/login")}
                variant="outline"
                className="h-10 px-6 font-semibold"
              >
                Đăng nhập
              </Button>
            </div>
            <div className="mx-auto flex max-w-md flex-wrap justify-center gap-4 text-[11px] text-muted-foreground font-medium">
              <span>{studentsLabel} sinh viên tin dùng</span>
              <span className="inline-block h-1 w-1 rounded-full bg-border mt-1.5" />
              <span>{subjectsLabel} môn học</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
