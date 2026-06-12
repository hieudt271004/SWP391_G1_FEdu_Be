import { Users, BookOpen, GraduationCap, Sparkles } from "lucide-react";

const STATS = [
  {
    icon: Users,
    value: "500+",
    label: "Sinh viên",
    bg: "bg-blue-50",
    color: "text-blue-700",
  },
  {
    icon: BookOpen,
    value: "20+",
    label: "Môn học",
    bg: "bg-blue-50",
    color: "text-blue-700",
  },
  {
    icon: GraduationCap,
    value: "30+",
    label: "Lớp học hiện hành",
    bg: "bg-blue-50",
    color: "text-blue-700",
  },
  {
    icon: Sparkles,
    value: "95%",
    label: "Đánh giá tích cực",
    bg: "bg-amber-50",
    color: "text-amber-600",
  },
];

export function StatsSection() {
  return (
    <section className="bg-slate-50 py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-10 text-center">
          <div className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 mb-3">
            Kết quả FEdu
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 md:text-4xl">
            Những con số tạo nên niềm tin
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className={`mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-3xl ${stat.bg}`}>
                  <Icon className={`h-7 w-7 ${stat.color}`} />
                </div>
                <div className="text-3xl font-extrabold text-slate-900 mb-2">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
