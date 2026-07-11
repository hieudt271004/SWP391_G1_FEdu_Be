import { useEffect, useState, useMemo, useCallback } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import {
  Loader2,
  BookOpen,
  AlertCircle,
  Search,
  Plus,
  Eye,
  Calendar,
  Map,
  Sparkles,
  User,
  Shield,
  Trash2,
} from 'lucide-react';
import { learningPathService, LearningPathResponse, LearningNodeResponse } from '../../../services/learningPath.service';
import { Subject } from '../../../types/subject';
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

  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [roadmapsBySubject, setRoadmapsBySubject] = useState<Record<number, LearningPathResponse[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | 'all'>('all');

  
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [searchInput]);

  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedTemplateForDetail, setSelectedTemplateForDetail] = useState<LearningPathResponse | null>(null);

  
  useEffect(() => {
    const fetchPageData = async () => {
      if(!user?.userId){
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);

        
        const subjectsData = await learningPathService.getLibrarySubjects();
        const subjectsList = subjectsData ?? [];
        setSubjects(subjectsList);

        
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
      } catch (err: any) {
        console.error('Lỗi khi tải thông tin thư viện lộ trình:', err);
        setError(err.response?.data?.message || 'Không thể tải thư viện lộ trình');
      } finally {
        setLoading(false);
      }
    };

    fetchPageData();
  }, [user?.userId]);

  
  const handleOpenDetail = useCallback((template: LearningPathResponse) => {
    setSelectedTemplateForDetail(template);
    setIsDetailOpen(true);
  }, []);

  
  const handleCreated = (newPath: LearningPathResponse) => {
    setRoadmapsBySubject((prev) => ({
      ...prev,
      [newPath.subjectId]: [...(prev[newPath.subjectId] || []), newPath],
    }));
  };

  
  const handleDeleteTemplate = useCallback(async (template: LearningPathResponse) => {
    if (!confirm(`Xóa template "${template.pathName}"? Hành động này không thể hoàn tác.`)) return;
    try {
      await learningPathService.deleteTemplatePath(template.pathId);
      setRoadmapsBySubject((prev) => ({
        ...prev,
        [template.subjectId]: (prev[template.subjectId] || []).filter((t) => t.pathId !== template.pathId),
      }));
      toast.success('Đã xóa template');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể xóa template');
    }
  }, []);

  
  
  const renderedSubjectsList = useMemo(() => {
    return subjects
      .filter((sub) => selectedSubjectId === 'all' || sub.subjectId === selectedSubjectId)
      .map((subject) => {
        const templates = (roadmapsBySubject[subject.subjectId] || []).filter((tpl) =>
          tpl.pathName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (tpl.description && tpl.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        
        const isMine = (tpl: LearningPathResponse) =>
          tpl.creatorRole === 'TEACHER' && tpl.createdById === user?.userId;
        const myTemplates = templates.filter(isMine);
        const deptTemplates = templates.filter((tpl) => !isMine(tpl));

        if (selectedSubjectId === 'all' && templates.length === 0 && searchQuery !== '') {
          return null;
        }

        const renderTemplateCard = (template: LearningPathResponse, mine: boolean) => (
          <Card
            key={template.pathId}
            className="group relative bg-card text-card-foreground border border-border hover:border-primary/30 transition-colors duration-200 rounded-[10px] shadow-none flex flex-col justify-between overflow-hidden"
          >
            <div className={`h-[4px] w-full ${mine ? 'bg-emerald-600' : 'bg-primary'}`} />

            <CardHeader className="p-5 pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base font-bold text-foreground leading-snug line-clamp-1">
                  {template.pathName}
                </CardTitle>
                <Badge
                  variant="outline"
                  className={`shrink-0 text-[10px] py-0 px-2 font-medium border rounded-[6px] ${
                    mine
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent'
                      : 'bg-muted text-foreground border-border'
                  }`}
                >
                  {mine ? 'Của tôi' : 'Của khoa'}
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

            <CardFooter className="p-5 pt-3 border-t border-border bg-muted/10 flex gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  mine
                    ? navigate(`/teacher/courses/${template.subjectId}?view=template&pathId=${template.pathId}`)
                    : handleOpenDetail(template)
                }
                className="flex-1 text-xs border-border text-foreground hover:bg-muted rounded-[6px] py-2 flex items-center justify-center gap-1.5 font-medium transition-colors h-8"
              >
                <Eye className="w-4 h-4" />
                {mine ? 'Chỉnh sửa' : 'Xem chi tiết'}
              </Button>
              {mine && (
                <Button
                  variant="outline"
                  onClick={() => handleDeleteTemplate(template)}
                  className="text-xs border-destructive/30 text-destructive hover:bg-destructive/10 rounded-[6px] py-2 flex items-center justify-center gap-1.5 font-medium transition-colors h-8"
                >
                  <Trash2 className="w-4 h-4" />
                  Xóa
                </Button>
              )}
            </CardFooter>
          </Card>
        );

        return (
          <div key={subject.subjectId} className="space-y-4 text-foreground">
            {}
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <span className="text-xs font-semibold text-foreground bg-muted px-2 py-0.5 rounded-[6px]">
                {subject.subjectCode}
              </span>
              <h2 className="text-lg font-bold text-foreground">{subject.subjectName}</h2>
            </div>

            {}
            {templates.length === 0 ? (
              <div className="py-8 px-4 bg-card rounded-[10px] border border-dashed border-border text-center text-muted-foreground text-sm">
                Môn học này chưa có template nào — bấm "Tạo lộ trình mới" để tạo template cá nhân đầu tiên.
              </div>
            ) : (
              <div className="space-y-5">
                {deptTemplates.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <Shield className="w-3.5 h-3.5" /> Template của khoa
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {deptTemplates.map((template) => renderTemplateCard(template, false))}
                    </div>
                  </div>
                )}
                {myTemplates.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <User className="w-3.5 h-3.5" /> Template cá nhân của tôi
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {myTemplates.map((template) => renderTemplateCard(template, true))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      });
  }, [subjects, selectedSubjectId, roadmapsBySubject, searchQuery, user?.userId, navigate, handleDeleteTemplate, handleOpenDetail]);

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
      {}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[6px] flex items-center justify-center bg-muted text-foreground border border-border">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Thư viện Lộ trình</h1>
            <p className="text-sm text-muted-foreground font-normal">
              Template cá nhân của bạn cho các môn đã/đang dạy — áp dụng vào lớp tại trang Lớp học của tôi
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

      {}
      <div className="bg-card text-card-foreground border border-border rounded-[10px] p-4 shadow-none flex flex-col md:flex-row gap-4 items-center justify-between">
        {}
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

        {}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-sm text-muted-foreground font-medium whitespace-nowrap">Môn học:</span>
          <Select
            value={String(selectedSubjectId)}
            onValueChange={(value) => {
              setSelectedSubjectId(value === 'all' ? 'all' : Number(value));
            }}
          >
            <SelectTrigger className="w-full md:w-56 bg-card border-border h-9 text-foreground font-medium shadow-none focus-visible:ring-0">
              <SelectValue placeholder="Tất cả môn học" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Tất cả môn học</SelectItem>
              {subjects.map((sub) => (
                <SelectItem key={sub.subjectId} value={String(sub.subjectId)}>
                  {sub.subjectCode} - {sub.subjectName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {}
      {subjects.length === 0 ? (
        <div className="text-center py-16 bg-card text-card-foreground border border-border rounded-[10px] shadow-none">
          <p className="text-muted-foreground font-normal text-sm">
            Bạn chưa được phân công dạy môn nào — thư viện sẽ hiện template của các môn bạn phụ trách.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {renderedSubjectsList}
        </div>
      )}

      {}
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
    </div>
  );
}





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
  const [creating, setCreating] = useState(false);

  
  useEffect(() => {
    if (isOpen) {
      setSubjectId(subjects[0]?.subjectId || '');
      setPathName('');
      setDescription('');
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
      });

      toast.success('Đã tạo template cá nhân thành công!');
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
          <DialogTitle className="text-lg font-bold text-foreground">
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
