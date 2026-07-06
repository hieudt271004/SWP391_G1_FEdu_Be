import { useState, useEffect } from "react";
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
import { http } from "../../../services/http";

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
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs hover:border-foreground/20 transition-all duration-200">
      <div className="flex items-center gap-3 mb-6">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg} border border-border`}>
          <HeaderIcon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div>
          <div className={`inline-block rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${badgeBg} ${badgeColor}`}>
            {badge}
          </div>
          <h3 className="text-sm font-bold text-foreground mt-0.5">{title}</h3>
        </div>
      </div>
      <ul className="space-y-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <li key={feature.title} className="flex gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-muted border border-border shrink-0`}>
                <Icon className={`h-4.5 w-4.5 ${iconColor}`} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground mb-0.5">{feature.title}</h4>
                <p className="text-[11px] leading-relaxed text-muted-foreground">{feature.description}</p>
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

export function FeaturesSection({ stats: propStats }: FeaturesSectionProps) {
  const [activeTab, setActiveTab] = useState<'paths' | 'classrooms' | 'materials' | 'questions'>('paths');
  const [stats, setStats] = useState<FeaturesStats>(propStats || DEFAULT_STATS);

  useEffect(() => {
    if (propStats) {
      setStats(propStats);
      return;
    }

    let isMounted = true;
    http.get<FeaturesStats>("/public/about/features")
      .then((data) => {
        if (!isMounted) return;
        if (data) {
          setStats(data);
        }
      })
      .catch((err) => {
        console.error("Lỗi lấy dữ liệu thực tế hệ thống:", err);
      });
    return () => {
      isMounted = false;
    };
  }, [propStats]);

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
    <section id="features" className="bg-background py-16 text-foreground border-t border-border">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-block rounded-lg border border-border bg-muted/60 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Trải nghiệm nền tảng
          </div>
          <h2 className="text-2xl font-extrabold text-foreground md:text-3xl tracking-tight mb-2">
            Một nền tảng, hai trải nghiệm
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
            FEdu dành cho cả sinh viên và giảng viên — mỗi đối tượng có bộ công cụ riêng biệt để nâng cao hiệu quả học tập và giảng dạy.
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <FeatureGroup
            badge="Cho sinh viên"
            badgeBg="bg-primary/5"
            badgeColor="text-foreground border border-border"
            icon={GraduationCap}
            title="Học hiệu quả hơn"
            features={studentFeatures}
            iconColor="text-foreground"
            iconBg="bg-muted"
          />
          <FeatureGroup
            badge="Cho giảng viên"
            badgeBg="bg-primary/5"
            badgeColor="text-foreground border border-border"
            icon={Presentation}
            title="Dạy thông minh hơn"
            features={teacherFeatures}
            iconColor="text-foreground"
            iconBg="bg-muted"
          />
        </div>

        {/* Dynamic Data Explorer Section */}
        <div className="mt-16 border-t border-border pt-12">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-block rounded-lg border border-border bg-muted/60 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Dữ liệu hệ thống
            </div>
            <h3 className="text-xl font-extrabold text-foreground md:text-2xl tracking-tight mb-2">
              Khám phá dữ liệu thực tế
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
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
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer border ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                    : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="rounded-2xl border border-border bg-muted/30 p-5 md:p-6 shadow-2xs">
            {activeTab === 'paths' && (
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {learningPaths.length > 0 ? (
                  learningPaths.map((path) => (
                    <div key={path.pathId} className="rounded-xl border border-border bg-card p-4 transition hover:border-foreground/20 duration-200">
                      <div className="inline-block rounded-full bg-muted text-foreground border border-border px-2 py-0.5 text-[8px] font-bold mb-2.5">
                        {path.subjectCode || "SUBJECT"}
                      </div>
                      <h4 className="font-bold text-foreground text-xs">{path.pathName}</h4>
                      <p className="text-[9px] text-muted-foreground mt-1.5">Mã lộ trình: #{path.pathId}</p>
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
                    <div key={mat.materialId} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-foreground/20 duration-200">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground border border-border shrink-0">
                        <FileText className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground text-xs">{mat.title}</h4>
                        <p className="text-[9px] text-muted-foreground mt-0.5">ID tài liệu: #{mat.materialId}</p>
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
                    <div key={cls.classroomId} className="rounded-xl border border-border bg-card p-4 transition hover:border-foreground/20 duration-200">
                      <div className="inline-block rounded-full bg-muted text-foreground border border-border px-2 py-0.5 text-[8px] font-bold mb-2.5">
                        {cls.semester || "SEMESTER"}
                      </div>
                      <h4 className="font-bold text-foreground text-xs">{cls.className}</h4>
                      <p className="text-[9px] text-muted-foreground mt-1.5">ID lớp học: #{cls.classroomId}</p>
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
                    <div key={q.questionId} className="rounded-xl border border-border bg-card p-4 transition hover:border-foreground/20 duration-200">
                      <p className="text-xs text-foreground italic">"{q.content}"</p>
                      <div className="flex items-center justify-between mt-2.5">
                        <span className="text-[9px] text-muted-foreground">ID câu hỏi: #{q.questionId}</span>
                        <span className="inline-block rounded-full bg-muted text-foreground border border-border px-2 py-0.5 text-[8px] font-bold">
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
