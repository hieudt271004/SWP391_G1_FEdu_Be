import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLevelLabel } from '../../../utils/levels';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../components/ui/dialog';
import {
  Loader2,
  BookOpen,
  AlertCircle,
  Search,
  Plus,
  Eye,
  Calendar,
  Map,
  Info,
  GraduationCap,
  Sparkles,
  User,
  Shield,
} from 'lucide-react';
import { teacherService } from '../../../services/teacher.service';
import { learningPathService, LearningPathResponse, LearningNodeResponse } from '../../../services/learningPath.service';
import { Subject } from '../../../types/subject';
import { ClassroomSubjectResponse } from '../../../types/classroomSubject';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'sonner';

const getRoleLabel = (role?: string) => {
  if (!role) return 'N/A';
  switch (role.toUpperCase()) {
    case 'ADMIN':
      return 'Quản trị viên';
    case 'TEACHER':
      return 'Giảng viên';
    case 'STUDENT':
      return 'Học sinh';
    case 'USER':
      return 'Người dùng';
    default:
      return role;
  }
};

export function TeacherCoursesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Primary states
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [roadmapsBySubject, setRoadmapsBySubject] = useState<Record<number, LearningPathResponse[]>>({});
  const [classrooms, setClassrooms] = useState<ClassroomSubjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | 'all'>('all');

  // Debounce search input to prevent expensive list re-renders on every keystroke
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [searchInput]);

  // Modal control states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedTemplateForDetail, setSelectedTemplateForDetail] = useState<LearningPathResponse | null>(null);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [selectedTemplateForApply, setSelectedTemplateForApply] = useState<LearningPathResponse | null>(null);

  // Initial Fetch logic
  useEffect(() => {
    const fetchPageData = async () => {
      if (!user?.userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // 1. Fetch Taught Subjects
        const subjectsData = await teacherService.getSubjectsByTeacher(user.userId);
        const subjectsList = subjectsData ?? [];
        setSubjects(subjectsList);

        // 2. Fetch templates for each subject in parallel
        const roadmapPromises = subjectsList.map(async (subject) => {
          try {
            const paths = await learningPathService.getSubjectLearningPaths(subject.subjectId);
            return { subjectId: subject.subjectId, paths: paths ?? [] };
          } catch (err) {
            console.error(`Error fetching paths for subject ${subject.subjectId}:`, err);
            return { subjectId: subject.subjectId, paths: [] };
          }
        });

        const roadmapResults = await Promise.all(roadmapPromises);
        const roadmapsMap: Record<number, LearningPathResponse[]> = {};
        roadmapResults.forEach((res) => {
          roadmapsMap[res.subjectId] = res.paths;
        });
        setRoadmapsBySubject(roadmapsMap);

        // 3. Fetch Classrooms for Apply checking later
        const classroomsData = await teacherService.getClassroomsByTeacher(user.userId);
        setClassrooms(classroomsData ?? []);

      } catch (err: any) {
        console.error('Lỗi khi tải thông tin thư viện lộ trình:', err);
        setError(err.response?.data?.message || 'Không thể tải thư viện lộ trình');
      } finally {
        setLoading(false);
      }
    };

    fetchPageData();
  }, [user?.userId]);

  // Handle template detail opening
  const handleOpenDetail = (template: LearningPathResponse) => {
    setSelectedTemplateForDetail(template);
    setIsDetailOpen(true);
  };

  // Handle opening apply modal
  const handleOpenApply = (template: LearningPathResponse) => {
    setSelectedTemplateForApply(template);
    setIsApplyOpen(true);
  };

  // Handle created templates updating roadmapsBySubject
  const handleCreated = (newPath: LearningPathResponse) => {
    setRoadmapsBySubject((prev) => ({
      ...prev,
      [newPath.subjectId]: [...(prev[newPath.subjectId] || []), newPath],
    }));
  };

  // Handle applied roadmap updating classroom list
  const handleApplied = async () => {
    if (user?.userId) {
      try {
        const classroomsData = await teacherService.getClassroomsByTeacher(user.userId);
        setClassrooms(classroomsData ?? []);
      } catch (err) {
        console.error('Error refreshing classrooms:', err);
      }
    }
  };

  // Memoize templates/subjects grid to prevent re-rendering when typing in search input,
  // or opening/closing modals.
  const renderedSubjectsList = useMemo(() => {
    return subjects
      .filter((sub) => selectedSubjectId === 'all' || sub.subjectId === selectedSubjectId)
      .map((subject) => {
        const templates = (roadmapsBySubject[subject.subjectId] || []).filter((tpl) =>
          tpl.pathName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (tpl.description && tpl.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );

        if (selectedSubjectId === 'all' && templates.length === 0 && searchQuery !== '') {
          return null;
        }

        return (
          <div key={subject.subjectId} className="space-y-4 text-foreground">
            {/* Subject Header */}
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <span className="text-xs font-semibold text-foreground bg-muted px-2 py-0.5 rounded-[6px]">
                {subject.subjectCode}
              </span>
              <h2 className="text-lg font-bold text-foreground">{subject.subjectName}</h2>
            </div>

            {/* Template grid */}
            {templates.length === 0 ? (
              <div className="py-8 px-4 bg-card rounded-[10px] border border-dashed border-border text-center text-muted-foreground text-sm">
                Môn học này chưa có bản thiết kế lộ trình nào khớp với tìm kiếm.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => (
                  <Card
                    key={template.pathId}
                    className="group relative bg-card text-card-foreground border border-border hover:border-primary/30 transition-colors duration-200 rounded-[10px] shadow-none flex flex-col justify-between overflow-hidden"
                  >
                    <div
                      className={`h-[4px] w-full ${
                        template.level === 3 ? 'bg-emerald-600' : template.level === 2 ? 'bg-purple-600' : 'bg-primary'
                      }`}
                    />

                    <CardHeader className="p-5 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base font-bold text-foreground leading-snug line-clamp-1">
                          {template.pathName}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className={`shrink-0 text-[10px] py-0 px-2 font-medium border rounded-[6px] ${
                            template.level === 3
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent'
                              : template.level === 2
                              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-transparent'
                              : 'bg-muted text-foreground border-border'
                          }`}
                        >
                          {getLevelLabel(template.level)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-normal pt-1">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>
                          {template.createdAt
                            ? new Date(template.createdAt).toLocaleDateString('vi-VN')
                            : 'N/A'}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1 mt-2.5 pt-2 border-t border-border/50">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-normal">
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>Người tạo: <span className="font-semibold text-foreground">{template.creatorName || 'N/A'}</span></span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-normal">
                          <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>Vai trò: <span className="font-semibold text-foreground">{getRoleLabel(template.creatorRole)}</span></span>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-5 pt-0 pb-4 flex-1">
                      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed font-normal">
                        {template.description || 'Không có mô tả chi tiết lộ trình mẫu này.'}
                      </p>
                    </CardContent>

                    <CardFooter className="p-5 pt-3 border-t border-border bg-muted/10">
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/teacher/courses/${template.subjectId}?view=template&pathId=${template.pathId}`)}
                        className="w-full text-xs border-border text-foreground hover:bg-muted rounded-[6px] py-2 flex items-center justify-center gap-1.5 font-medium transition-colors h-8"
                      >
                        <Eye className="w-4 h-4" />
                        Chi tiết
                      </Button>
                      <Button
                        onClick={() => handleOpenApply(template)}
                        className="flex-1 text-xs bg-primary hover:bg-primary/90 text-primary-foreground rounded-[6px] py-2 flex items-center justify-center gap-1.5 font-medium transition-colors h-8 border-none"
                      >
                        <GraduationCap className="w-4 h-4" />
                        Áp dụng
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );
      });
  }, [subjects, selectedSubjectId, roadmapsBySubject, searchQuery]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-3 text-foreground">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-normal">Đang tải thư viện lộ trình học...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-card text-card-foreground rounded-[10px] border border-border shadow-none max-w-md mx-auto mt-8">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
        <h3 className="text-lg font-bold text-foreground mb-1">Đã xảy ra lỗi</h3>
        <p className="text-destructive text-sm mb-6 px-6">{error}</p>
        <Button onClick={() => navigate('/teacher/dashboard')} className="bg-primary hover:bg-primary/90 rounded-[6px] text-primary-foreground font-medium text-xs py-2 px-4 border-0">
          Quay lại Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-foreground">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[6px] flex items-center justify-center bg-muted text-foreground border border-border">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Thư viện Lộ trình</h1>
            <p className="text-sm text-muted-foreground font-normal">
              Quản lý các bản mẫu lộ trình học tập và phân bản nháp đến các lớp học chưa bắt đầu
            </p>
          </div>
        </div>
        <Button 
          onClick={() => setIsCreateOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg text-xs h-10 px-4 flex items-center gap-2 border-none shadow-sm cursor-pointer shrink-0 md:self-end"
        >
          <Plus className="w-4 h-4" /> Tạo lộ trình mới
        </Button>
      </div>

      {/* Filter and search bar */}
      <div className="bg-card text-card-foreground border border-border rounded-[10px] p-4 shadow-none flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm lộ trình học tập..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-[6px] border border-border outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors bg-muted/30 text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-sm text-muted-foreground font-medium whitespace-nowrap">Môn học:</span>
          <select
            value={selectedSubjectId}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedSubjectId(val === 'all' ? 'all' : Number(val));
            }}
            className="w-full md:w-56 px-3 py-2 text-sm rounded-[6px] border border-border outline-none focus:border-primary transition-colors bg-card text-foreground font-medium"
          >
            <option value="all">Tất cả môn học</option>
            {subjects.map((sub) => (
              <option key={sub.subjectId} value={sub.subjectId}>
                {sub.subjectCode} - {sub.subjectName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Roadmap List Grouped by Subject */}
      {subjects.length === 0 ? (
        <div className="text-center py-16 bg-card text-card-foreground border border-border rounded-[10px] shadow-none">
          <p className="text-muted-foreground font-normal text-sm">Bạn chưa được phân công quản lý môn học nào.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {renderedSubjectsList}
        </div>
      )}

      {/* Dialog Modals */}
      <CreateTemplateDialog
        isOpen={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        subjects={subjects}
        onCreated={handleCreated}
      />

      <ViewTemplateDetailDialog
        isOpen={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        template={selectedTemplateForDetail}
      />

      <ApplyTemplateDialog
        isOpen={isApplyOpen}
        onOpenChange={setIsApplyOpen}
        template={selectedTemplateForApply}
        classrooms={classrooms}
        onApplied={handleApplied}
      />
    </div>
  );
}

// ==========================================
// Subcomponents to prevent parent re-renders
// ==========================================

interface CreateTemplateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: Subject[];
  onCreated: (newPath: LearningPathResponse) => void;
}

function CreateTemplateDialog({
  isOpen,
  onOpenChange,
  subjects,
  onCreated,
}: CreateTemplateDialogProps) {
  const [subjectId, setSubjectId] = useState<number | ''>('');
  const [pathName, setPathName] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState<1 | 2 | 3>(1);
  const [creating, setCreating] = useState(false);

  // Initialize form state when opened
  useEffect(() => {
    if (isOpen) {
      setSubjectId(subjects[0]?.subjectId || '');
      setPathName('');
      setDescription('');
      setLevel(1);
    }
  }, [isOpen, subjects]);

  const handleConfirmCreate = async () => {
    if (!subjectId || !pathName.trim()) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      setCreating(true);
      const newPath = await learningPathService.createLearningPath({
        subjectId: Number(subjectId),
        pathName: pathName.trim(),
        description: description.trim(),
        level,
      });

      toast.success('Đã tạo bản nháp lộ trình mới thành công!');
      onCreated(newPath);
      onOpenChange(false);
    } catch (err: any) {
      console.error('Error creating template:', err);
      toast.error(err.response?.data?.message || 'Không thể tạo lộ trình mới');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-[10px] bg-card text-card-foreground border border-border p-6 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-foreground" />
            Tạo Lộ trình học mới
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Thiết lập bản phác thảo lộ trình để quản lý học tập lớp học hiệu quả hơn.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-1.5 flex flex-col">
            <label className="text-xs font-semibold text-muted-foreground">Môn học áp dụng</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm rounded-[6px] border border-border outline-none focus:border-primary bg-background text-foreground font-medium"
            >
              {subjects.map((sub) => (
                <option key={sub.subjectId} value={sub.subjectId}>
                  {sub.subjectCode} - {sub.subjectName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 flex flex-col">
            <label className="text-xs font-semibold text-muted-foreground">Tên lộ trình</label>
            <input
              type="text"
              placeholder="Ví dụ: Lộ trình cơ bản kỳ Fall 2026..."
              value={pathName}
              onChange={(e) => setPathName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-[6px] border border-border outline-none focus:border-primary text-foreground placeholder:text-muted-foreground bg-background"
            />
          </div>

          <div className="space-y-1.5 flex flex-col">
            <label className="text-xs font-semibold text-muted-foreground">Cấp độ</label>
            <select
              value={level}
              onChange={(e) => setLevel(Number(e.target.value) as 1 | 2 | 3)}
              className="w-full px-3 py-2 text-sm rounded-[6px] border border-border outline-none focus:border-primary bg-background text-foreground font-medium"
            >
              <option value={1}>Yêu (1)</option>
              <option value={2}>Trung bình (2)</option>
              <option value={3}>Khá (3)</option>
            </select>
          </div>

          <div className="space-y-1.5 flex flex-col">
            <label className="text-xs font-semibold text-muted-foreground">Mô tả lộ trình (Tùy chọn)</label>
            <textarea
              placeholder="Nhập mô tả ngắn gọn về mục tiêu của lộ trình này..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-[6px] border border-border outline-none focus:border-primary text-foreground placeholder:text-muted-foreground bg-background resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            disabled={creating}
            onClick={() => onOpenChange(false)}
            className="border-border text-muted-foreground hover:bg-muted rounded-[6px] text-xs h-9 px-4 font-medium"
          >
            Hủy
          </Button>
          <Button
            onClick={handleConfirmCreate}
            disabled={creating}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-[6px] flex items-center gap-1.5 font-medium text-xs h-9 px-4 border-0"
          >
            {creating && <Loader2 className="w-4 h-4 animate-spin" />}
            Tạo mới
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ViewTemplateDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  template: LearningPathResponse | null;
}

function ViewTemplateDetailDialog({
  isOpen,
  onOpenChange,
  template,
}: ViewTemplateDetailDialogProps) {
  const [detailNodes, setDetailNodes] = useState<LearningNodeResponse[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!template || !isOpen) return;

      setLoadingDetail(true);
      setDetailNodes([]);
      try {
        const graph = await learningPathService.getLearningPathGraph(template.pathId);
        const sortedNodes = (graph.nodes ?? []).sort((a, b) => a.displayOrder - b.displayOrder);
        setDetailNodes(sortedNodes);
      } catch (err) {
        console.error('Error fetching template details:', err);
        toast.error('Không thể tải thông tin chi tiết lộ trình');
      } finally {
        setLoadingDetail(false);
      }
    };

    fetchDetails();
  }, [template, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl rounded-[10px] bg-card text-card-foreground border border-border p-6 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <Map className="w-5 h-5 text-foreground" />
            Chi tiết lộ trình mẫu
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground flex flex-col gap-1">
            <span>
              {template?.pathName} — Mức độ:{' '}
              <span className="font-semibold text-foreground">
                {getLevelLabel(template?.level)}
              </span>
            </span>
            {template?.creatorName && (
              <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <span>Người tạo:</span>
                <span className="font-semibold text-foreground">{template.creatorName}</span>
                <span className="text-[10px] bg-muted text-foreground px-1.5 py-0.5 rounded-[4px] font-medium ml-1">
                  {getRoleLabel(template.creatorRole)}
                </span>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {loadingDetail ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground font-normal">Đang tải danh sách node học tập...</span>
          </div>
        ) : detailNodes.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground text-sm border border-dashed border-border rounded-[10px] my-4">
            Lộ trình này hiện chưa được cấu hình node học tập nào.
          </div>
        ) : (
          <div className="my-4 max-h-[360px] overflow-y-auto pr-1 space-y-3">
            {detailNodes.map((node, idx) => (
              <div
                key={node.nodeId}
                className="p-3.5 bg-card border border-border rounded-[10px] flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-[6px] bg-muted text-foreground flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5 border border-border">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{node.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {node.description || 'Không có mô tả cho node này.'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <Badge
                    variant="outline"
                    className={`text-[9px] py-0 px-1.5 font-medium border rounded-[6px] ${
                      node.nodeType === 'ON_CLASS'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent'
                        : 'bg-muted text-foreground border-border'
                    }`}
                  >
                    {node.nodeType === 'ON_CLASS' ? 'Trên lớp' : 'Tự học'}
                  </Badge>
                  {node.isRequired && (
                    <Badge
                      variant="outline"
                      className="text-[9px] py-0 px-1.5 font-medium border bg-destructive/10 text-destructive border-transparent rounded-[6px]"
                    >
                      Bắt buộc
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-[6px] w-full sm:w-auto text-xs h-9 px-4 font-medium border-0"
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ApplyTemplateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  template: LearningPathResponse | null;
  classrooms: ClassroomSubjectResponse[];
  onApplied: () => void;
}

function ApplyTemplateDialog({
  isOpen,
  onOpenChange,
  template,
  classrooms,
  onApplied,
}: ApplyTemplateDialogProps) {
  const [availableClassrooms, setAvailableClassrooms] = useState<ClassroomSubjectResponse[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [selectedClassroomSubjectId, setSelectedClassroomSubjectId] = useState<number | ''>('');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    const checkAvailableClassrooms = async () => {
      if (!template || !isOpen) return;

      setLoadingClasses(true);
      setAvailableClassrooms([]);
      setSelectedClassroomSubjectId('');

      // Filter classrooms taught by this teacher for this specific subject
      const candidateClassrooms = classrooms.filter((c) => c.subjectId === template.subjectId);

      if (candidateClassrooms.length === 0) {
        setLoadingClasses(false);
        return;
      }

      try {
        const checkPromises = candidateClassrooms.map(async (cls) => {
          try {
            const graph = await learningPathService.getClassroomGraph(cls.classroomSubjectId);
            return { ...cls, hasRoadmap: graph.state !== 'NO_PATH' };
          } catch (e) {
            return { ...cls, hasRoadmap: false };
          }
        });

        const checkedClasses = await Promise.all(checkPromises);
        const unassignedClasses = checkedClasses.filter((c) => !c.hasRoadmap);
        setAvailableClassrooms(unassignedClasses);

        if (unassignedClasses.length > 0) {
          setSelectedClassroomSubjectId(unassignedClasses[0].classroomSubjectId);
        }
      } catch (err) {
        console.error('Error filtering available classrooms:', err);
        toast.error('Không thể tải trạng thái lớp học');
      } finally {
        setLoadingClasses(false);
      }
    };

    checkAvailableClassrooms();
  }, [template, isOpen, classrooms]);

  const handleConfirmApply = async () => {
    if (!template || !selectedClassroomSubjectId) return;

    try {
      setApplying(true);
      await learningPathService.cloneFromTemplate(
        Number(selectedClassroomSubjectId)
      );

      toast.success(`Đã áp dụng lộ trình "${template.pathName}" cho lớp thành công!`);
      onOpenChange(false);
      onApplied();
    } catch (err: any) {
      console.error('Error cloning template to classroom:', err);
      toast.error(err.response?.data?.message || 'Không thể áp dụng lộ trình cho lớp học');
    } finally {
      setApplying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-[10px] bg-card text-card-foreground border border-border p-6 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-foreground" />
            Áp dụng lộ trình cho Lớp học
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Nhân bản lộ trình mẫu này vào lớp học chưa bắt đầu của bạn.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="p-3.5 bg-muted/50 border border-border rounded-[6px]">
            <span className="text-xs font-semibold text-muted-foreground">Lộ trình được chọn:</span>
            <p className="text-sm font-bold text-foreground pt-0.5">
              {template?.pathName}
            </p>
          </div>

          {loadingClasses ? (
            <div className="py-6 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground font-normal">Đang kiểm tra danh sách lớp học...</span>
            </div>
          ) : availableClassrooms.length === 0 ? (
            <div className="p-4 bg-amber-500/10 border border-transparent text-amber-600 dark:text-amber-400 rounded-[6px] text-center text-xs flex flex-col items-center gap-2">
              <AlertCircle className="w-6 h-6 text-amber-500" />
              <span>
                Không tìm thấy lớp học chưa bắt đầu nào của môn học này mà chưa được gán lộ trình.
              </span>
            </div>
          ) : (
            <div className="space-y-1.5 flex flex-col">
              <label className="text-xs font-semibold text-muted-foreground">Chọn lớp học nhận bản sao</label>
              <select
                value={selectedClassroomSubjectId}
                onChange={(e) => setSelectedClassroomSubjectId(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-[6px] border border-border outline-none focus:border-primary bg-background text-foreground font-medium"
              >
                {availableClassrooms.map((cls) => (
                  <option key={cls.classroomSubjectId} value={cls.classroomSubjectId}>
                    {cls.displayName || `${cls.className} - ${cls.subjectCode}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="p-3 bg-muted border border-border rounded-[6px] flex items-start gap-2.5">
            <Info className="w-4 h-4 text-foreground mt-0.5 shrink-0" />
            <p className="text-[11px] text-muted-foreground leading-normal">
              Hành động này sẽ sao chép toàn bộ cấu trúc node và dữ liệu (bài học, tài liệu, bài test) từ
              bản lộ trình mẫu sang lớp học của bạn ở trạng thái Nháp (Draft).
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            disabled={applying}
            onClick={() => onOpenChange(false)}
            className="border-border text-muted-foreground hover:bg-muted rounded-[6px] text-xs h-9 px-4 font-medium"
          >
            Hủy
          </Button>
          <Button
            onClick={handleConfirmApply}
            disabled={applying || availableClassrooms.length === 0 || !selectedClassroomSubjectId}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-[6px] flex items-center gap-1.5 font-medium text-xs h-9 px-4 border-0"
          >
            {applying && <Loader2 className="w-4 h-4 animate-spin" />}
            Xác nhận Áp dụng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
