import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  const navigate = useNavigate();
  return (
    <section className="relative overflow-hidden bg-[#030213] text-white border-b border-white/10 font-sans">
      <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 font-medium">
              Flipped Classroom cho đại học hiện đại
            </div>
            <div className="space-y-4">
              <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-5xl text-wrap-balance">
                Học chủ động,
                <br />
                <span className="text-white">
                  kết quả khác biệt
                </span>
              </h1>
              <p className="max-w-2xl text-xs leading-relaxed text-slate-400">
                FEdu giúp sinh viên tự học hiệu quả tại nhà, thảo luận sâu trên lớp và thực hành với dự án thực tế — xây dựng thói quen học tập chủ động và nhớ lâu hơn.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                onClick={() => navigate("/register")}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-white hover:bg-slate-100 px-6 py-2.5 text-xs font-semibold text-[#030213] transition-colors cursor-pointer"
              >
                Bắt đầu ngay
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => navigate("/about")}
                className="inline-flex items-center justify-center rounded-md border border-white/15 bg-white/5 hover:bg-white/10 px-6 py-2.5 text-xs font-medium text-white transition-colors cursor-pointer"
              >
                Tìm hiểu thêm
              </button>
            </div>
          </div>

          <div className="space-y-4 rounded-md border border-white/10 bg-white/5 p-6 shadow-xs">
            <div className="text-xs font-bold text-white tracking-wider">
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
                <div key={item.title} className="rounded-md border border-white/10 bg-[#030213]/40 p-4">
                  <h3 className="text-xs font-semibold text-white">{item.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
