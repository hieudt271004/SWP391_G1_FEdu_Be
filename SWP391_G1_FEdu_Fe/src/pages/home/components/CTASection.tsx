import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

export function CTASection() {
  const navigate = useNavigate();
  return (
    <section className="bg-slate-900 py-20 md:py-28 text-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-slate-900 via-blue-950 to-slate-950 px-8 py-16 md:px-16 md:py-20 shadow-2xl shadow-slate-950/40">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute w-80 h-80 rounded-full opacity-20 bg-cyan-400"
              style={{ top: "-30%", right: "-10%", filter: "blur(75px)" }}
            />
            <div
              className="absolute w-72 h-72 rounded-full opacity-15 bg-white"
              style={{ bottom: "-20%", left: "-5%", filter: "blur(75px)" }}
            />
          </div>
          <div className="relative space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm border border-white/10">
              <Sparkles className="h-4 w-4 text-cyan-300" />
              <span className="font-medium">Sẵn sàng đổi cách học?</span>
            </div>
            <h2 className="text-3xl font-extrabold leading-tight md:text-5xl">
              Bắt đầu hành trình học tập
              <br />
              theo cách mới
            </h2>
            <p className="max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
              Tham gia cộng đồng sinh viên và giảng viên đang định hình lại cách học đại học với công cụ học tập hiện đại và lộ trình rõ ràng.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                onClick={() => navigate("/register")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Đăng ký miễn phí
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate("/login")}
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-8 py-4 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Đăng nhập
              </button>
            </div>
            <div className="mx-auto flex max-w-md flex-wrap justify-center gap-4 text-sm text-slate-400">
              <span>500+ sinh viên tin dùng</span>
              <span className="inline-block h-1 w-1 rounded-full bg-slate-500" />
              <span>95% đánh giá hài lòng</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
