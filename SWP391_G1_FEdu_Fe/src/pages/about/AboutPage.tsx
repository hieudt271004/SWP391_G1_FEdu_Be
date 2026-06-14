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

export function AboutPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Static fallback data in case Backend fails or is empty
  const fallbackSubjects = [
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

  useEffect(() => {
    http.get<Subject[]>("/public/about/subjects")
      .then((data) => {
        if (data && data.length > 0) {
          setSubjects(data);
        } else {
          setSubjects(fallbackSubjects);
        }
      })
      .catch((err) => {
        console.error("Lỗi lấy danh sách môn học từ DB, sử dụng dữ liệu mặc định:", err);
        setSubjects(fallbackSubjects);
      });
  }, []);

  return (
    <div className="pt-12 bg-white">
      <div className="max-w-6xl mx-auto px-6 text-center mb-6">
        <h1 className="text-4xl font-extrabold text-slate-900 md:text-5xl tracking-tight mb-4">
          Về chúng tôi
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Tìm hiểu về sứ mệnh của FEdu trong việc kiến tạo môi trường học tập chủ động, thực tế và hiệu quả hơn.
        </p>
      </div>

      <StatsSection />

      <AboutSection />

      {/* Featured Subjects Section */}
      <section className="bg-slate-50 py-20 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700 mb-4">
              Môn học
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 md:text-4xl mb-4">
              Môn học áp dụng Lớp học đảo ngược
            </h2>
            <p className="text-base text-slate-600">
              Đây là các môn học tiêu biểu được thiết kế theo mô hình học tập chủ động, nơi sinh viên tự nghiên cứu tài liệu trước khi tới lớp để giải quyết các dự án thực tế.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((sub) => (
              <div 
                key={sub.subjectId} 
                className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm hover:-translate-y-1 hover:shadow-md transition duration-300"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">{sub.subjectCode}</div>
                    <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1">{sub.subjectName}</h3>
                  </div>
                </div>
                <p className="text-left text-slate-600 text-sm leading-relaxed line-clamp-3">
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
