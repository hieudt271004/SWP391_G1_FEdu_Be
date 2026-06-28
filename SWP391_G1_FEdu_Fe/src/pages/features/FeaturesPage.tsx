import { useEffect, useState } from "react";
import { FeaturesSection, DEFAULT_STATS, FeaturesStats } from "../home/components/FeaturesSection";
import { http } from "../../services/http";

export function FeaturesPage() {
  const [stats, setStats] = useState<FeaturesStats>(DEFAULT_STATS);

  useEffect(() => {
    let isMounted = true;
    http.get<FeaturesStats>("/public/about/features")
      .then((data) => {
        if (!isMounted) return;
        if (data) {
          setStats(data);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Lỗi lấy dữ liệu thống kê tính năng từ DB, sử dụng dữ liệu mặc định:", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="pt-20 pb-12 bg-[#030213] text-white min-h-screen font-sans relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-blue-500/10 blur-[130px] pointer-events-none" />
      
      <div className="relative max-w-6xl mx-auto px-6 text-center mb-12">
        <div className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 mb-4">
          Công cụ hỗ trợ học tập
        </div>
        <h1 className="text-4xl font-bold text-white md:text-5xl tracking-tight mb-6 bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Tính năng nổi bật
        </h1>
        <p className="text-xs text-slate-400 max-w-xl mx-auto leading-relaxed">
          Khám phá những công cụ tuyệt vời mà FEdu cung cấp cho cả Sinh viên và Giảng viên để nâng cao hiệu quả giảng dạy và học tập.
        </p>
      </div>
      <FeaturesSection stats={stats} />
    </div>
  );
}
