import { useState } from "react";
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

export interface FeaturesStats {
  totalPaths: number;
  totalMaterials: number;
  totalSubMentors: number;
  totalClassrooms: number;
  totalSubmissions: number;
  totalQuestions: number;
  learningPaths?: { pathId: number; pathName: string; subjectCode: string }[];
  classrooms?: { classroomId: number; className: string; semester: string }[];
  materials?: { materialId: number; title: string }[];
  questions?: { questionId: number; content: string; studentName: string }[];
}

export const DEFAULT_STATS: FeaturesStats = {
  totalPaths: 12,
  totalMaterials: 85,
  totalSubMentors: 15,
  totalClassrooms: 8,
  totalSubmissions: 120,
  totalQuestions: 95,
  learningPaths: [],
  classrooms: [],
  materials: [],
  questions: [],
};

interface FeatureGroupProps {
  badge: string;
  badgeBg: string;
  badgeColor: string;
  icon: typeof GraduationCap;
  title: string;
  features: {
    icon: any;
    title: string;
    description: string;
  }[];
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
    <div className="rounded-xl border border-border/60 bg-card p-6 shadow-2xs hover:border-border hover:bg-accent/5 transition-all duration-200">
      <div className="flex items-center gap-3 mb-6">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg} border border-border/40`}>
          <HeaderIcon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div>
          <div className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${badgeBg} ${badgeColor} mb-0.5`}>
            {badge}
          </div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
        </div>
      </div>
      <ul className="space-y-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <li key={feature.title} className="flex gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBg} border border-border/40 shrink-0`}>
                <Icon className={`h-4.5 w-4.5 ${iconColor}`} />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-foreground mb-0.5">{feature.title}</h4>
                <p className="text-xs leading-relaxed text-muted-foreground">{feature.description}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export interface FeaturesSectionProps {
  stats?: FeaturesStats;
}

export function FeaturesSection({ stats = DEFAULT_STATS }: FeaturesSectionProps) {
  const [activeTab, setActiveTab] = useState<'paths' | 'classrooms' | 'materials' | 'questions'>('paths');

  const studentFeatures = [
    {
      icon: Route,
      title: "Lộ trình rõ ràng",
      description: `Mỗi môn học có roadmap chi tiết từng tuần. Hệ thống đã xây dựng ${stats.totalPaths} lộ trình học tập hiệu quả.`,
    },
    {
      icon: FileText,
      title: "Tài liệu chuẩn bị",
      description: `Video, slide và quiz trước mỗi buổi học. Kho tài liệu phong phú với ${stats.totalMaterials} tài liệu chuẩn bị sẵn.`,
    },
    {
      icon: TrendingUp,
      title: "Theo dõi tiến độ",
      description: "Biết chính xác bạn đang ở đâu trong môn học và đã hoàn thành gì.",
    },
    {
      icon: Users,
      title: "Hỗ trợ Sub-Mentor",
      description: `Bạn bè giỏi trong lớp làm mentor hỗ trợ học tập cá nhân. Đã có ${stats.totalSubMentors} sub-mentor tham gia hỗ trợ.`,
    },
  ];

  const teacherFeatures = [
    {
      icon: ClipboardList,
      title: "Quản lý lớp tập trung",
      description: `Một nơi cho toàn bộ lớp học của bạn. Đang quản lý và vận hành ${stats.totalClassrooms} lớp học.`,
    },
    {
      icon: CalendarClock,
      title: "Giao bài tự động",
      description: `Lên lịch nội dung tự động gửi. Hệ thống đã xử lý thành công ${stats.totalSubmissions} bài nộp.`,
    },
    {
      icon: BarChart3,
      title: "Báo cáo tiến độ",
      description: "Biết sinh viên nào chậm, ai vượt để can thiệp kịp thời.",
    },
    {
      icon: MessageCircle,
      title: "Tương tác lớp học",
      description: `Q&A, thảo luận và polling realtime. Đã có ${stats.totalQuestions} câu hỏi và thảo luận tương tác.`,
    },
  ];

  const learningPaths = stats.learningPaths || [];
  const classrooms = stats.classrooms || [];
  const materials = stats.materials || [];
  const questions = stats.questions || [];

  return (
    <section id="features" className="bg-background py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-block rounded-full bg-amber-50 text-amber-700 border border-amber-100/40 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider mb-3 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30">
            Tính năng
          </div>
          <h2 className="text-2xl font-bold text-foreground md:text-3xl tracking-tight mb-2">
            Một nền tảng, hai trải nghiệm
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xl mx-auto">
            FEdu dành cho cả sinh viên và giảng viên — mỗi người một công cụ để học tập và giảng dạy hiệu quả hơn.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FeatureGroup
            badge="Cho sinh viên"
            badgeBg="bg-blue-50/50 dark:bg-blue-950/20"
            badgeColor="text-blue-700 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/30"
            icon={GraduationCap}
            title="Học hiệu quả hơn"
            features={studentFeatures}
            iconColor="text-blue-700 dark:text-blue-400"
            iconBg="bg-blue-50 dark:bg-blue-950/30"
          />
          <FeatureGroup
            badge="Cho giảng viên"
            badgeBg="bg-amber-50/50 dark:bg-amber-950/20"
            badgeColor="text-amber-700 dark:text-amber-400 border border-amber-100/50 dark:border-amber-900/30"
            icon={Presentation}
            title="Dạy thông minh hơn"
            features={teacherFeatures}
            iconColor="text-amber-700 dark:text-amber-400"
            iconBg="bg-amber-50 dark:bg-amber-950/30"
          />
        </div>

        {/* Dynamic Data Explorer Section */}
        <div className="mt-12 border-t border-border/60 pt-10">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-block rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100/40 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider mb-3 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30">
              Dữ liệu hệ thống
            </div>
            <h3 className="text-xl font-bold text-foreground md:text-2xl tracking-tight mb-2">
              Khám phá dữ liệu thực tế
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Danh sách chi tiết các bản ghi đang được lưu trữ và vận hành trực tiếp trong cơ sở dữ liệu của FEdu.
            </p>
          </div>

          {/* Tab triggers */}
          <div className="flex flex-wrap justify-center gap-1.5 mb-6">
            <button
              onClick={() => setActiveTab('paths')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                activeTab === 'paths'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground border border-border/40'
              }`}
            >
              Lộ trình ({stats.totalPaths})
            </button>
            <button
              onClick={() => setActiveTab('materials')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                activeTab === 'materials'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground border border-border/40'
              }`}
            >
              Tài liệu ({stats.totalMaterials})
            </button>
            <button
              onClick={() => setActiveTab('classrooms')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                activeTab === 'classrooms'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground border border-border/40'
              }`}
            >
              Lớp học ({stats.totalClassrooms})
            </button>
            <button
              onClick={() => setActiveTab('questions')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                activeTab === 'questions'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground border border-border/40'
              }`}
            >
              Thảo luận ({stats.totalQuestions})
            </button>
          </div>

          {/* Tab content */}
          <div className="rounded-xl border border-border/60 bg-card p-5 md:p-6 shadow-2xs">
            {activeTab === 'paths' && (
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {learningPaths.length > 0 ? (
                  learningPaths.map((path) => (
                    <div key={path.pathId} className="rounded-lg border border-border/40 bg-muted/20 p-4 transition hover:border-border hover:bg-card hover:shadow-2xs duration-200">
                      <div className="inline-block rounded-full bg-blue-50 text-blue-700 border border-blue-100/40 px-2 py-0.5 text-[9px] font-medium mb-2.5 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30">
                        {path.subjectCode || "SUBJECT"}
                      </div>
                      <h4 className="font-semibold text-foreground text-sm">{path.pathName}</h4>
                      <p className="text-[10px] text-muted-foreground mt-1.5">Mã lộ trình: #{path.pathId}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground col-span-3 text-center py-6">Chưa có lộ trình nào được khởi tạo.</p>
                )}
              </div>
            )}

            {activeTab === 'materials' && (
              <div className="grid gap-3 sm:grid-cols-2">
                {materials.length > 0 ? (
                  materials.map((mat) => (
                    <div key={mat.materialId} className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted/20 p-4 transition hover:border-border hover:bg-card hover:shadow-2xs duration-200">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700 border border-amber-100/50 shrink-0 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30">
                        <FileText className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground text-xs">{mat.title}</h4>
                        <p className="text-[10px] text-muted-foreground mt-0.5">ID tài liệu: #{mat.materialId}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground col-span-2 text-center py-6">Kho tài liệu đang được cập nhật.</p>
                )}
              </div>
            )}

            {activeTab === 'classrooms' && (
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {classrooms.length > 0 ? (
                  classrooms.map((cls) => (
                    <div key={cls.classroomId} className="rounded-lg border border-border/40 bg-muted/20 p-4 transition hover:border-border hover:bg-card hover:shadow-2xs duration-200">
                      <div className="inline-block rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100/40 px-2 py-0.5 text-[9px] font-medium mb-2.5 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30">
                        {cls.semester || "SEMESTER"}
                      </div>
                      <h4 className="font-semibold text-foreground text-sm">{cls.className}</h4>
                      <p className="text-[10px] text-muted-foreground mt-1.5">ID lớp học: #{cls.classroomId}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground col-span-3 text-center py-6">Chưa có lớp học nào hoạt động.</p>
                )}
              </div>
            )}

            {activeTab === 'questions' && (
              <div className="space-y-2.5">
                {questions.length > 0 ? (
                  questions.map((q) => (
                    <div key={q.questionId} className="rounded-lg border border-border/40 bg-muted/20 p-4 transition hover:border-border hover:bg-card hover:shadow-2xs duration-200">
                      <p className="text-xs text-foreground italic">"{q.content}"</p>
                      <div className="flex items-center justify-between mt-2.5">
                        <span className="text-[10px] text-muted-foreground">ID câu hỏi: #{q.questionId}</span>
                        <span className="inline-block rounded-full bg-violet-50 text-violet-700 border border-violet-100/40 px-2 py-0.5 text-[9px] font-medium dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-900/30">
                          Hỏi bởi: {q.studentName || "Ẩn danh"}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-6">Chưa có câu hỏi thảo luận nào.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
