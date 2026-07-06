import { BookOpen, MessagesSquare, Trophy } from "lucide-react";

const FLOW_STEPS = [
  {
    icon: BookOpen,
    title: "Tự học tại nhà",
    description: "Xem video, đọc tài liệu, làm quiz để nắm kiến thức nền trước buổi học.",
  },
  {
    icon: MessagesSquare,
    title: "Thảo luận trên lớp",
    description: "Thảo luận, giải đáp và làm bài tập nhóm cùng giảng viên và bạn bè.",
  },
  {
    icon: Trophy,
    title: "Thực hành & ứng dụng",
    description: "Làm dự án thực tế, nhận feedback và tiến bộ qua từng tuần.",
  },
];

export function AboutSection() {
  return (
    <section id="about" className="bg-muted/30 py-20 md:py-28 border-t border-border">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3.5 py-1.5 text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-4">
            Phương pháp học tập
          </div>
          <h2 className="text-3xl font-extrabold text-foreground md:text-4xl mb-4 tracking-tight">
            Lớp học đảo ngược là gì?
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Thay vì nghe giảng thụ động trên lớp rồi làm bài tập ở nhà, sinh viên{" "}
            <span className="font-semibold text-foreground">xem trước nội dung tại nhà</span> qua tài liệu, video và quiz — đến lớp{" "}
            <span className="font-semibold text-foreground">dành thời gian thảo luận</span>, làm dự án nhóm và hỏi đáp chuyên sâu với giảng viên.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {FLOW_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="rounded-2xl border border-border bg-card p-6 shadow-xs hover:border-foreground/20 hover:shadow-sm transition-all duration-300">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-foreground mb-5 border border-border">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80 mb-3">
                  Bước {index + 1}
                </div>
                <h3 className="text-sm font-bold text-foreground mb-2.5">{step.title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{step.description}</p>
              </div>
            );
          })}
        </div>

        <p className="text-center text-muted-foreground text-xs mt-12 max-w-2xl mx-auto italic">
          Kết quả: hiểu sâu hơn, tự chủ hơn và biến mỗi buổi học thành một workshop thực sự.
        </p>
      </div>
    </section>
  );
}
