import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  const navigate = useNavigate();
  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-96 h-96 rounded-full opacity-20 bg-blue-500"
          style={{ top: "-15%", right: "10%", filter: "blur(90px)" }}
        />
        <div
          className="absolute w-72 h-72 rounded-full opacity-20 bg-cyan-400"
          style={{ bottom: "-10%", left: "-5%", filter: "blur(90px)" }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-32">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/30 bg-blue-400/10 px-4 py-2 text-sm text-blue-200">
              Flipped Classroom cho đại học hiện đại
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
                Học chủ động,
                <br />
                <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                  kết quả khác biệt
                </span>
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
                FEdu giúp sinh viên tự học hiệu quả tại nhà, thảo luận sâu trên lớp và thực hành với dự án thực tế — xây dựng thói quen học tập chủ động và nhớ lâu hơn.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <button
                onClick={() => navigate("/register")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-8 py-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Bắt đầu ngay
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#about"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/80 px-8 py-4 text-sm font-medium text-slate-100 transition hover:border-cyan-300 hover:text-white"
              >
                Tìm hiểu thêm
              </a>
            </div>
          </div>

          <div className="space-y-4 rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.4)] backdrop-blur-xl">
            <div className="text-sm uppercase tracking-[0.24em] text-cyan-300/80">
              Lợi ích nổi bật
            </div>
            <div className="grid gap-4">
              {[{
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
                }].map((item) => (
                <div key={item.title} className="rounded-3xl border border-slate-800/60 bg-slate-950/90 p-5">
                  <h3 className="text-base font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
