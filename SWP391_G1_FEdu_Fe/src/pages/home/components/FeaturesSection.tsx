import {
  Route,
  FileText,
  TrendingUp,
  Users,
  ClipboardList,
  CalendarClock,
  BarChart3,
  MessageCircle,
  GraduationCap,
  Presentation,
} from "lucide-react";

const STUDENT_FEATURES = [
  {
    icon: Route,
    title: "Lộ trình rõ ràng",
    description: "Mỗi môn có roadmap chi tiết từng tuần, biết phải học gì khi nào.",
  },
  {
    icon: FileText,
    title: "Tài liệu chuẩn bị",
    description: "Video, slide và quiz trước mỗi buổi học để nắm kiến thức nền.",
  },
  {
    icon: TrendingUp,
    title: "Theo dõi tiến độ",
    description: "Biết chính xác bạn đang ở đâu trong khóa học và đã hoàn thành gì.",
  },
  {
    icon: Users,
    title: "Hỗ trợ Sub-Mentor",
    description: "Bạn bè giỏi trong lớp làm mentor hỗ trợ học tập cá nhân.",
  },
];

const TEACHER_FEATURES = [
  {
    icon: ClipboardList,
    title: "Quản lý lớp tập trung",
    description: "Một nơi cho toàn bộ lớp học của bạn, không phân tán dữ liệu.",
  },
  {
    icon: CalendarClock,
    title: "Giao bài tự động",
    description: "Lên lịch nội dung, hệ thống tự gửi đến học viên đúng thời điểm.",
  },
  {
    icon: BarChart3,
    title: "Báo cáo tiến độ",
    description: "Biết sinh viên nào chậm, ai vượt để can thiệp kịp thời.",
  },
  {
    icon: MessageCircle,
    title: "Tương tác lớp học",
    description: "Q&A, thảo luận và polling realtime ngay trong buổi học.",
  },
];

interface FeatureGroupProps {
  badge: string;
  badgeBg: string;
  badgeColor: string;
  icon: typeof GraduationCap;
  title: string;
  features: typeof STUDENT_FEATURES;
  iconColor: string;
  iconBg: string;
}

function FeatureGroup({
  badge,
  badgeBg,
  badgeColor,
  icon: HeaderIcon,
  title,
  features,
  iconColor,
  iconBg,
}: FeatureGroupProps) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-center gap-3 mb-8">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg}`}>
          <HeaderIcon className={`h-6 w-6 ${iconColor}`} />
        </div>
        <div>
          <div className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${badgeBg} ${badgeColor} mb-1`}>
            {badge}
          </div>
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        </div>
      </div>
      <ul className="space-y-5">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <li key={feature.title} className="flex gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg}`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">{feature.title}</h4>
                <p className="text-sm leading-relaxed text-slate-600">{feature.description}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function FeaturesSection() {
  return (
    <section id="features" className="bg-white py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-700 mb-4">
            Tính năng
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 md:text-4xl mb-4">
            Một nền tảng, hai trải nghiệm
          </h2>
          <p className="text-base leading-8 text-slate-600 md:text-lg">
            FEdu dành cho cả sinh viên và giảng viên — mỗi người một công cụ để học tập và giảng dạy hiệu quả hơn.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <FeatureGroup
            badge="Cho sinh viên"
            badgeBg="bg-blue-100"
            badgeColor="text-blue-700"
            icon={GraduationCap}
            title="Học hiệu quả hơn"
            features={STUDENT_FEATURES}
            iconColor="text-blue-700"
            iconBg="bg-blue-100"
          />
          <FeatureGroup
            badge="Cho giảng viên"
            badgeBg="bg-amber-100"
            badgeColor="text-amber-700"
            icon={Presentation}
            title="Dạy thông minh hơn"
            features={TEACHER_FEATURES}
            iconColor="text-amber-700"
            iconBg="bg-amber-100"
          />
        </div>
      </div>
    </section>
  );
}
