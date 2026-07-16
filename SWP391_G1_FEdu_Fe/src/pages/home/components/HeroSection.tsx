import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "../../../components/ui/button";

export function HeroSection() {
  const navigate = useNavigate();
  return (
    <section className="relative overflow-hidden bg-background text-foreground border-b border-border font-sans py-16 md:py-24">
      {}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      
      <div className="relative max-w-6xl mx-auto px-6">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/60 px-3.5 py-1.5 text-xs text-muted-foreground font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-foreground" />
              Flipped Classroom cho đại học hiện đại
            </div>
            <div className="space-y-4">
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight md:text-5xl lg:text-6xl text-foreground">
                Học chủ động,
                <br />
                <span className="text-muted-foreground">kết quả khác biệt</span>
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                FEdu giúp sinh viên tự học hiệu quả tại nhà, thảo luận sâu trên lớp và thực hành với dự án thực tế — xây dựng thói quen học tập chủ động và ghi nhớ sâu sắc hơn.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                onClick={() => navigate("/register")}
                className="gap-2 h-10 px-6 font-semibold"
              >
                Bắt đầu ngay
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => navigate("/about")}
                variant="outline"
                className="h-10 px-6 font-semibold"
              >
                Tìm hiểu thêm
              </Button>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="text-xs font-bold text-foreground tracking-wider uppercase">
              Lợi ích nổi bật
            </div>
            <div className="grid gap-3">
              {[
                {
                  title: "Tự học có lộ trình",
                  description: "Nắm bắt nội dung trước buổi học, sẵn sàng thảo luận.",
                },
                {
                  title: "Tương tác chất lượng",
                  description: "Thảo luận nhóm, hỏi đáp cùng giảng viên và sub-mentor.",
                },
                {
                  title: "Áp dụng thực tế",
                  description: "Giải bài tập dự án sát chương trình và yêu cầu thực tế.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-border bg-muted/30 p-4 transition-all duration-200 hover:bg-muted/50">
                  <h3 className="text-xs font-bold text-foreground">{item.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
