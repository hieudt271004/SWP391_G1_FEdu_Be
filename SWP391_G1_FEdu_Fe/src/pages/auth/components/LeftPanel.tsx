import { BookOpen } from "lucide-react";
export function LeftPanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
      <img
        src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbmxpbmUlMjBsZWFybmluZyUyMGVkdWNhdGlvbiUyMHN0dWRlbnRzJTIwc3R1ZHlpbmd8ZW58MXx8fHwxNzc4ODE3NTkyfDA&ixlib=rb-4.1.0&q=80&w=1080"
        alt="Students learning"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-slate-950/55" />
      <div className="absolute inset-0 flex flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-white font-bold tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" style={{ fontSize: "1.25rem" }}>
            FEdu Learning
          </span>
        </div>
        <div>
          <h2 className="text-white mb-4 font-extrabold leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]" style={{ fontSize: "2rem", lineHeight: 1.2 }}>
            Học tập không giới hạn,<br />thành công không có điểm dừng
          </h2>
          <p className="text-white max-w-xl leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]" style={{ fontSize: "1rem" }}>
            Hơn 10.000+ khóa học từ các chuyên gia hàng đầu đang chờ bạn khám phá.
          </p>
          <div className="flex flex-wrap gap-6 mt-8">
            {[["10K+", "Khóa học"], ["500K+", "Học viên"], ["98%", "Hài lòng"]].map(([num, label]) => (
              <div key={label}>
                <div className="text-white font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]" style={{ fontSize: "1.5rem" }}>{num}</div>
                <div className="text-white leading-snug drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]" style={{ fontSize: "0.875rem" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}