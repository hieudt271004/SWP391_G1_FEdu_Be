import { BookOpen, MessagesSquare, Trophy } from "lucide-react";

const FLOW_STEPS = [
  {
    icon: BookOpen,
    title: "Tự học tại nhà",
    description: "Xem video, đọc tài liệu, làm quiz để nắm kiến thức nền trước buổi học.",
    color: "text-blue-700",
    bg: "bg-blue-100",
  },
  {
    icon: MessagesSquare,
    title: "Thảo luận trên lớp",
    description: "Thảo luận, giải đáp và làm bài tập nhóm cùng giảng viên và bạn bè.",
    color: "text-blue-700",
    bg: "bg-blue-100",
  },
  {
    icon: Trophy,
    title: "Thực hành & ứng dụng",
    description: "Làm dự án thực tế, nhận feedback và tiến bộ qua từng tuần.",
    color: "text-amber-600",
    bg: "bg-amber-100",
  },
];

export function AboutSection() {
  return (
    <section id="about" className="bg-[#030213] py-20 md:py-28 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 font-semibold uppercase tracking-wider mb-4">
            Phương pháp học tập
          </div>
          <h2 className="text-3xl font-bold text-white md:text-4xl mb-4">
            Lớp học đảo ngược là gì?
          </h2>
          <p className="text-xs leading-relaxed text-slate-400">
            Thay vì nghe giảng trên lớp rồi làm bài tập ở nhà, sinh viên <span className="font-semibold text-white">xem trước nội dung tại nhà</span> qua tài liệu, video và quiz — đến lớp <span className="font-semibold text-white">dành thời gian thảo luận</span>, làm dự án nhóm và hỏi đáp với giảng viên.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {FLOW_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="rounded-md border border-white/10 bg-white/5 p-6 shadow-sm hover:border-white/20 transition-all duration-300">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-white/10 text-white mb-5 border border-white/5">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 mb-3">
                  Bước {index + 1}
                </div>
                <h3 className="text-sm font-semibold text-white mb-3">{step.title}</h3>
                <p className="text-xs leading-relaxed text-slate-400">{step.description}</p>
              </div>
            );
          })}
        </div>

        <p className="text-center text-slate-500 text-xs mt-12 max-w-2xl mx-auto italic">
          Kết quả: hiểu sâu hơn, tự chủ hơn và biến mỗi buổi học thành một workshop thực sự.
        </p>
      </div>
    </section>
  );
}
