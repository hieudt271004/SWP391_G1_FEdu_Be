import { useEffect, useState } from "react";
import { AboutSection } from "../home/components/AboutSection";
import { StatsSection } from "../home/components/StatsSection";
import { http } from "../../services/http";
import { BookOpen } from "lucide-react";

interface Subject {
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  description: string;
}

// Static fallback data in case Backend fails or is empty
const FALLBACK_SUBJECTS = [
  {
    subjectId: 1,
    subjectCode: "SWP391",
    subjectName: "Project phát triển ứng dụng",
    description: "Thực hành phát triển ứng dụng web từ đầu đến cuối theo nhóm và bảo vệ trước hội đồng chuyên môn.",
  },
  {
    subjectId: 2,
    subjectCode: "PRN211",
    subjectName: "Lập trình ứng dụng trên nền tảng .NET",
    description: "Cung cấp kiến thức về C#, WPF, WinForms và kết nối cơ sở dữ liệu SQL Server nâng cao.",
  },
  {
    subjectId: 3,
    subjectCode: "SWE201",
    subjectName: "Nhập môn kỹ nghệ phần mềm",
    description: "Khái quát quy trình phát triển phần mềm, thu thập yêu cầu hệ thống và thiết kế mô hình kiến trúc.",
  },
];

export function AboutPage() {
  const [subjects, setSubjects] = useState<Subject[]>(FALLBACK_SUBJECTS);

  useEffect(() => {
    let isMounted = true;
    http.get<Subject[]>("/public/about/subjects")
      .then((data) => {
        if (!isMounted) return;
        if (data && data.length > 0) {
          setSubjects(data);
        } else {
          setSubjects(FALLBACK_SUBJECTS);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Lỗi lấy danh sách môn học từ DB, sử dụng dữ liệu mặc định:", err);
        setSubjects(FALLBACK_SUBJECTS);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="pt-20 pb-12 bg-[#030213] text-white min-h-screen font-sans">
      <div className="max-w-6xl mx-auto px-6 text-center mb-16 relative">
        {/* Subtle background glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
        
        <div className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 mb-4">
          Hành trình của chúng tôi
        </div>
        <h1 className="text-4xl font-bold text-white md:text-5xl tracking-tight mb-6 bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Về chúng tôi
        </h1>
        <p className="text-xs leading-relaxed text-slate-400 max-w-2xl mx-auto">
          Tìm hiểu về sứ mệnh của FEdu trong việc kiến tạo môi trường học tập chủ động, thực tế và hiệu quả hơn theo phương pháp lớp học đảo ngược hiện đại.
        </p>
      </div>

      <StatsSection />

      <AboutSection />

      {/* Featured Subjects Section */}
      <section className="bg-[#030213] py-20 border-t border-white/10 relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />
        
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 font-semibold uppercase tracking-wider mb-4">
              Môn học nổi bật
            </div>
            <h2 className="text-3xl font-bold text-white md:text-4xl mb-4">
              Môn học áp dụng Lớp học đảo ngược
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Đây là các môn học tiêu biểu được thiết kế theo mô hình học tập chủ động, nơi sinh viên tự nghiên cứu tài liệu trước khi tới lớp để giải quyết các dự án thực tế.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((sub) => (
              <div 
                key={sub.subjectId} 
                className="rounded-md border border-white/10 bg-white/5 p-6 shadow-sm hover:border-white/20 transition duration-300"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/10 text-white shrink-0 border border-white/5">
                    <BookOpen className="h-4.5 w-4.5" />
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{sub.subjectCode}</div>
                    <h3 className="font-bold text-white text-sm leading-snug line-clamp-1">{sub.subjectName}</h3>
                  </div>
                </div>
                <p className="text-left text-slate-400 text-xs leading-relaxed line-clamp-3">
                  {sub.description || "Chưa có mô tả chi tiết cho môn học này. Vui lòng liên hệ bộ phận hỗ trợ hoặc giảng viên để nhận đề cương chi tiết."}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
