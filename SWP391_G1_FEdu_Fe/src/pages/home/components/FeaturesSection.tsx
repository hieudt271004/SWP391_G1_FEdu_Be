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
            features={studentFeatures}
            iconColor="text-blue-700"
            iconBg="bg-blue-100"
          />
          <FeatureGroup
            badge="Cho giảng viên"
            badgeBg="bg-amber-100"
            badgeColor="text-amber-700"
            icon={Presentation}
            title="Dạy thông minh hơn"
            features={teacherFeatures}
            iconColor="text-amber-700"
            iconBg="bg-amber-100"
          />
        </div>

        {/* Dynamic Data Explorer Section */}
        <div className="mt-20 border-t border-slate-200 pt-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700 mb-4">
              Dữ liệu hệ thống
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 md:text-3xl mb-3">
              Khám phá dữ liệu thực tế
            </h3>
            <p className="text-sm text-slate-600">
              Danh sách chi tiết các bản ghi đang được lưu trữ và vận hành trực tiếp trong cơ sở dữ liệu của FEdu.
            </p>
          </div>

          {/* Tab triggers */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <button
              onClick={() => setActiveTab('paths')}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                activeTab === 'paths'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Lộ trình ({stats.totalPaths})
            </button>
            <button
              onClick={() => setActiveTab('materials')}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                activeTab === 'materials'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tài liệu ({stats.totalMaterials})
            </button>
            <button
              onClick={() => setActiveTab('classrooms')}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                activeTab === 'classrooms'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Lớp học ({stats.totalClassrooms})
            </button>
            <button
              onClick={() => setActiveTab('questions')}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                activeTab === 'questions'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Thảo luận ({stats.totalQuestions})
            </button>
          </div>

          {/* Tab content */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
            {activeTab === 'paths' && (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {learningPaths.length > 0 ? (
                  learningPaths.map((path) => (
                    <div key={path.pathId} className="rounded-2xl border border-slate-100 bg-slate-50 p-6 shadow-sm transition hover:shadow-md hover:bg-white">
                      <div className="inline-block rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 mb-3">
                        {path.subjectCode || "SUBJECT"}
                      </div>
                      <h4 className="font-bold text-slate-800 text-base">{path.pathName}</h4>
                      <p className="text-xs text-slate-500 mt-2">Mã lộ trình: #{path.pathId}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 col-span-3 text-center py-6">Chưa có lộ trình nào được khởi tạo.</p>
                )}
              </div>
            )}

            {activeTab === 'materials' && (
              <div className="grid gap-4 sm:grid-cols-2">
                {materials.length > 0 ? (
                  materials.map((mat) => (
                    <div key={mat.materialId} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-5 shadow-sm transition hover:shadow-md hover:bg-white">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{mat.title}</h4>
                        <p className="text-xs text-slate-400 mt-1">ID tài liệu: #{mat.materialId}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 col-span-2 text-center py-6">Kho tài liệu đang được cập nhật.</p>
                )}
              </div>
            )}

            {activeTab === 'classrooms' && (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {classrooms.length > 0 ? (
                  classrooms.map((cls) => (
                    <div key={cls.classroomId} className="rounded-2xl border border-slate-100 bg-slate-50 p-6 shadow-sm transition hover:shadow-md hover:bg-white">
                      <div className="inline-block rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 mb-3">
                        {cls.semester || "SEMESTER"}
                      </div>
                      <h4 className="font-bold text-slate-800 text-lg">{cls.className}</h4>
                      <p className="text-xs text-slate-500 mt-2">ID lớp học: #{cls.classroomId}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 col-span-3 text-center py-6">Chưa có lớp học nào hoạt động.</p>
                )}
              </div>
            )}

            {activeTab === 'questions' && (
              <div className="space-y-3">
                {questions.length > 0 ? (
                  questions.map((q) => (
                    <div key={q.questionId} className="rounded-2xl border border-slate-100 bg-slate-50 p-5 shadow-sm transition hover:shadow-md hover:bg-white">
                      <p className="text-sm text-slate-700 italic">"{q.content}"</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-slate-400">ID câu hỏi: #{q.questionId}</span>
                        <span className="inline-block rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
                          Hỏi bởi: {q.studentName || "Ẩn danh"}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 text-center py-6">Chưa có câu hỏi thảo luận nào.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
