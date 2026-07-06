import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";

export function LeftPanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
      <img
        src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbmxpbmUlMjBsZWFybmluZyUyMGVkdWNhdGlvbiUyMHN0dWRlbnRzJTIwc3R1ZHlpbmd8ZW58MXx8fHwxNzc4ODE3NTkyfDA&ixlib=rb-4.1.0&q=80&w=1080"
        alt="Students learning"
        className="w-full h-full object-cover"
      />
      {/* Static overlay */}
      <div className="absolute inset-0 bg-slate-900/60" />
      
      <div className="absolute inset-0 flex flex-col justify-between p-12 z-10">
        <Link to="/" className="flex items-center gap-2.5 w-fit group hover:opacity-90 transition-all duration-200">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white text-slate-900 shadow-md group-hover:scale-105 transition-all duration-300">
            <BookOpen className="w-4.5 h-4.5" />
          </div>
          <span className="text-white font-extrabold text-base tracking-tight drop-shadow-md">
            FEdu
          </span>
        </Link>
        <div>
          <h2 className="text-white mb-4 text-3xl font-black leading-tight drop-shadow-md">
            Học tập không giới hạn,
            <br />
            thành công không có điểm dừng
          </h2>
          <p className="text-slate-200 text-sm max-w-xl leading-relaxed drop-shadow-sm">
            Hơn 10.000+ môn học từ các chuyên gia hàng đầu đang chờ bạn khám phá.
          </p>
          <div className="flex flex-wrap gap-8 mt-8">
            {[["10K+", "Môn học"], ["500K+", "Học viên"], ["98%", "Hài lòng"]].map(([num, label]) => (
              <div key={label} className="space-y-1">
                <div className="text-white text-2xl font-extrabold drop-shadow-md">{num}</div>
                <div className="text-slate-300 text-xs font-semibold tracking-wider uppercase drop-shadow-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}