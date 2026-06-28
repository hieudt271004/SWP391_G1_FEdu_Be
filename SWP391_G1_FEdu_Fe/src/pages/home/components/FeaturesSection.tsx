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
    <div className="rounded-md border border-white/10 bg-white/5 p-6 shadow-2xs hover:border-white/20 transition-all duration-200">
      <div className="flex items-center gap-3 mb-6">
        <div className={`flex h-10 w-10 items-center justify-center rounded-md ${iconBg} border border-white/5`}>
          <HeaderIcon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div>
          <div className={`inline-block rounded-full px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${badgeBg} ${badgeColor} mb-0.5`}>
            {badge}
          </div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
      </div>
      <ul className="space-y-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <li key={feature.title} className="flex gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-md ${iconBg} border border-white/5 shrink-0`}>
                <Icon className={`h-4.5 w-4.5 ${iconColor}`} />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white mb-0.5">{feature.title}</h4>
                <p className="text-[11px] leading-relaxed text-slate-400">{feature.description}</p>
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
    <section id="features" className="bg-[#030213] py-12 md:py-16 text-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-block rounded-md border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-300 mb-3">
            Trải nghiệm nền tảng
          </div>
          <h2 className="text-2xl font-bold text-white md:text-3xl tracking-tight mb-2">
            Một nền tảng, hai trải nghiệm
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xl mx-auto">
            FEdu dành cho cả sinh viên và giảng viên — mỗi người một công cụ để học tập và giảng dạy hiệu quả hơn.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <FeatureGroup
            badge="Cho sinh viên"
            badgeBg="bg-blue-500/10"
            badgeColor="text-blue-400 border border-blue-500/20"
            icon={GraduationCap}
            title="Học hiệu quả hơn"
            features={studentFeatures}
            iconColor="text-blue-400"
            iconBg="bg-blue-500/10"
          />
          <FeatureGroup
            badge="Cho giảng viên"
            badgeBg="bg-amber-500/10"
            badgeColor="text-amber-400 border border-amber-500/20"
            icon={Presentation}
            title="Dạy thông minh hơn"
            features={teacherFeatures}
            iconColor="text-amber-400"
            iconBg="bg-amber-500/10"
          />
        </div>

        {/* Dynamic Data Explorer Section */}
        <div className="mt-16 border-t border-white/10 pt-12">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-block rounded-md border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-300 mb-3">
              Dữ liệu hệ thống
            </div>
            <h3 className="text-xl font-bold text-white md:text-2xl tracking-tight mb-2">
              Khám phá dữ liệu thực tế
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Danh sách chi tiết các bản ghi đang được lưu trữ và vận hành trực tiếp trong cơ sở dữ liệu của FEdu.
            </p>
          </div>

          {/* Tab triggers */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {[
              { id: 'paths', label: 'Lộ trình', count: stats.totalPaths },
              { id: 'materials', label: 'Tài liệu', count: stats.totalMaterials },
              { id: 'classrooms', label: 'Lớp học', count: stats.totalClassrooms },
              { id: 'questions', label: 'Thảo luận', count: stats.totalQuestions },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`rounded-md px-4 py-2 text-xs font-semibold transition cursor-pointer border ${
                  activeTab === tab.id
                    ? 'bg-white text-[#030213] border-white shadow-xs'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="rounded-md border border-white/10 bg-white/5 p-5 md:p-6 shadow-2xs">
            {activeTab === 'paths' && (
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {learningPaths.length > 0 ? (
                  learningPaths.map((path) => (
                    <div key={path.pathId} className="rounded-md border border-white/10 bg-white/5 p-4 transition hover:border-white/20 duration-200">
                      <div className="inline-block rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 text-[8px] font-semibold mb-2.5">
                        {path.subjectCode || "SUBJECT"}
                      </div>
                      <h4 className="font-semibold text-white text-xs">{path.pathName}</h4>
                      <p className="text-[9px] text-slate-500 mt-1.5">Mã lộ trình: #{path.pathId}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 col-span-3 text-center py-6">Chưa có lộ trình nào được khởi tạo.</p>
                )}
              </div>
            )}

            {activeTab === 'materials' && (
              <div className="grid gap-3 sm:grid-cols-2">
                {materials.length > 0 ? (
                  materials.map((mat) => (
                    <div key={mat.materialId} className="flex items-center gap-3 rounded-md border border-white/10 bg-white/5 p-4 transition hover:border-white/20 duration-200">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                        <FileText className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-xs">{mat.title}</h4>
                        <p className="text-[9px] text-slate-500 mt-0.5">ID tài liệu: #{mat.materialId}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 col-span-2 text-center py-6">Kho tài liệu đang được cập nhật.</p>
                )}
              </div>
            )}

            {activeTab === 'classrooms' && (
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {classrooms.length > 0 ? (
                  classrooms.map((cls) => (
                    <div key={cls.classroomId} className="rounded-md border border-white/10 bg-white/5 p-4 transition hover:border-white/20 duration-200">
                      <div className="inline-block rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[8px] font-semibold mb-2.5">
                        {cls.semester || "SEMESTER"}
                      </div>
                      <h4 className="font-semibold text-white text-xs">{cls.className}</h4>
                      <p className="text-[9px] text-slate-500 mt-1.5">ID lớp học: #{cls.classroomId}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 col-span-3 text-center py-6">Chưa có lớp học nào hoạt động.</p>
                )}
              </div>
            )}

            {activeTab === 'questions' && (
              <div className="space-y-2.5">
                {questions.length > 0 ? (
                  questions.map((q) => (
                    <div key={q.questionId} className="rounded-md border border-white/10 bg-white/5 p-4 transition hover:border-white/20 duration-200">
                      <p className="text-xs text-white italic">"{q.content}"</p>
                      <div className="flex items-center justify-between mt-2.5">
                        <span className="text-[9px] text-slate-500">ID câu hỏi: #{q.questionId}</span>
                        <span className="inline-block rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 text-[8px] font-semibold">
                          Hỏi bởi: {q.studentName || "Ẩn danh"}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-6">Chưa có câu hỏi thảo luận nào.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
