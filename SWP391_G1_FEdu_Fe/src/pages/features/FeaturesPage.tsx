import { useEffect, useState } from "react";
import { FeaturesSection, DEFAULT_STATS, FeaturesStats } from "../home/components/FeaturesSection";
import { http } from "../../services/http";

export function FeaturesPage() {
  const [stats, setStats] = useState<FeaturesStats>(DEFAULT_STATS);

  useEffect(() => {
    http.get<FeaturesStats>("/public/about/features")
      .then((data) => {
        if (data) {
          setStats(data);
        }
      })
      .catch((err) => {
        console.error("Lỗi lấy dữ liệu thống kê tính năng từ DB, sử dụng dữ liệu mặc định:", err);
      });
  }, []);

  return (
    <div className="pt-12 bg-white">
      <div className="max-w-6xl mx-auto px-6 text-center mb-6">
        <h1 className="text-4xl font-extrabold text-slate-900 md:text-5xl tracking-tight mb-4">
          Tính năng nổi bật
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Khám phá những công cụ tuyệt vời mà FEdu cung cấp cho cả Sinh viên và Giảng viên để nâng cao hiệu quả giảng dạy và học tập.
        </p>
      </div>
      <FeaturesSection stats={stats} />
    </div>
  );
}
