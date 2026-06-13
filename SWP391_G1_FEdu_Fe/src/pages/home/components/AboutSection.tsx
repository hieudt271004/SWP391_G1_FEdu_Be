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
    <section id="about" className="bg-slate-50 py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700 mb-4">
            Phương pháp
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 md:text-4xl mb-4">
            Lớp học đảo ngược là gì?
          </h2>
          <p className="text-base leading-8 text-slate-600 md:text-lg">
            Thay vì nghe giảng trên lớp rồi làm bài tập ở nhà, sinh viên <span className="font-semibold text-slate-900">xem trước nội dung tại nhà</span> qua tài liệu, video và quiz — đến lớp <span className="font-semibold text-slate-900">dành thời gian thảo luận</span>, làm dự án nhóm và hỏi đáp với giảng viên.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {FLOW_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${step.bg} mb-5`}>
                  <Icon className={`h-6 w-6 ${step.color}`} />
                </div>
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 mb-3">
                  Bước {index + 1}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{step.description}</p>
              </div>
            );
          })}
        </div>

        <p className="text-center text-slate-600 mt-12 max-w-2xl mx-auto italic">
          Kết quả: hiểu sâu hơn, tự chủ hơn và biến mỗi buổi học thành một workshop thực sự.
        </p>
      </div>
    </section>
  );
}
