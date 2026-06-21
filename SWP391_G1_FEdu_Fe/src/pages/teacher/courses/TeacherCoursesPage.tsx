import { useEffect, useState } from 'react';
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
  Zap,
  Calendar,
  Map,
  CheckCircle2,
  Info,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { teacherService } from '../../../services/teacher.service';
import { learningPathService, LearningPathResponse, LearningNodeResponse } from '../../../services/learningPath.service';
import { Subject } from '../../../types/subject';
import { ClassroomSubjectResponse } from '../../../types/classroomSubject';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'sonner';

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
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | 'all'>('all');

  // Modal: Create new template draft
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createSubjectId, setCreateSubjectId] = useState<number | ''>('');
  const [createPathName, setCreatePathName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createLevel, setCreateLevel] = useState<1 | 2 | 3>(1);
  const [creating, setCreating] = useState(false);

  // Modal: View template detail (nodes list)
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedTemplateForDetail, setSelectedTemplateForDetail] = useState<LearningPathResponse | null>(null);
  const [detailNodes, setDetailNodes] = useState<LearningNodeResponse[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Modal: Apply template to classroom
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [selectedTemplateForApply, setSelectedTemplateForApply] = useState<LearningPathResponse | null>(null);
  const [availableClassrooms, setAvailableClassrooms] = useState<ClassroomSubjectResponse[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [selectedClassroomSubjectId, setSelectedClassroomSubjectId] = useState<number | ''>('');
  const [applying, setApplying] = useState(false);

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

        if (subjectsList.length > 0) {
          setCreateSubjectId(subjectsList[0].subjectId);
        }

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
  }, [user]);

  // Handle template detail opening
  const handleOpenDetail = async (template: LearningPathResponse) => {
    setSelectedTemplateForDetail(template);
    setIsDetailOpen(true);
    setLoadingDetail(true);
    setDetailNodes([]);

    try {
      const graph = await learningPathService.getLearningPathGraph(template.pathId);
      // Sort nodes by displayOrder asc
      const sortedNodes = (graph.nodes ?? []).sort((a, b) => a.displayOrder - b.displayOrder);
      setDetailNodes(sortedNodes);
    } catch (err) {
      console.error('Error fetching template details:', err);
      toast.error('Không thể tải thông tin chi tiết lộ trình');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Handle opening apply modal
  const handleOpenApply = async (template: LearningPathResponse) => {
    setSelectedTemplateForApply(template);
    setIsApplyOpen(true);
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
      // Concurrently query the graph of each matching class to see if state is NO_PATH
      const checkPromises = candidateClassrooms.map(async (cls) => {
        try {
          const graph = await learningPathService.getClassroomGraph(cls.classroomSubjectId);
          return { ...cls, hasRoadmap: graph.state !== 'NO_PATH' };
        } catch (e) {
          // Fallback: assume no roadmap if it errors
          return { ...cls, hasRoadmap: false };
        }
      });

      const checkedClasses = await Promise.all(checkPromises);
      // Only keep classes that do NOT have a roadmap
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

  // Handle Confirm Apply
  const handleConfirmApply = async () => {
    if (!selectedTemplateForApply || !selectedClassroomSubjectId) return;

    try {
      setApplying(true);
      await learningPathService.cloneFromTemplate(
        Number(selectedClassroomSubjectId)
      );

      toast.success(`Đã áp dụng lộ trình "${selectedTemplateForApply.pathName}" cho lớp thành công!`);
      setIsApplyOpen(false);

      // Re-fetch classrooms so status updates
      if (user?.userId) {
        const classroomsData = await teacherService.getClassroomsByTeacher(user.userId);
        setClassrooms(classroomsData ?? []);
      }
    } catch (err: any) {
      console.error('Error cloning template to classroom:', err);
      toast.error(err.response?.data?.message || 'Không thể áp dụng lộ trình cho lớp học');
    } finally {
      setApplying(false);
    }
  };

  // Handle Create template draft
  const handleConfirmCreate = async () => {
    if (!createSubjectId || !createPathName.trim()) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      setCreating(true);
      const newPath = await learningPathService.createLearningPath({
        subjectId: Number(createSubjectId),
        pathName: createPathName.trim(),
        description: createDescription.trim(),
        level: createLevel,
      });

      toast.success('Đã tạo bản nháp lộ trình mới thành công!');
      setIsCreateOpen(false);

      // Update state dynamically without page reload
      setRoadmapsBySubject((prev) => ({
        ...prev,
        [newPath.subjectId]: [...(prev[newPath.subjectId] || []), newPath],
      }));

      // Reset form fields
      setCreatePathName('');
      setCreateDescription('');
      setCreateLevel(1);
    } catch (err: any) {
      console.error('Error creating template:', err);
      toast.error(err.response?.data?.message || 'Không thể tạo lộ trình mới');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <p className="text-sm text-slate-500 font-medium">Đang tải thư viện lộ trình học...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm max-w-md mx-auto mt-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Đã xảy ra lỗi</h3>
        <p className="text-red-600 text-sm mb-6 px-6">{error}</p>
        <Button onClick={() => navigate('/teacher/dashboard')} className="bg-indigo-600 hover:bg-indigo-700">
          Quay lại Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Thư viện Lộ trình</h1>
            <p className="text-sm text-slate-500">
              Quản lý các bản mẫu lộ trình học tập và phân bản nháp đến các lớp học chưa bắt đầu
            </p>
          </div>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 rounded-xl shadow-md shadow-indigo-100 hover:shadow-indigo-200 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Tạo Lộ trình mới
        </Button>
      </div>

      {/* Filter and search bar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm lộ trình học tập..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 outline-none focus:border-indigo-500 transition-colors bg-slate-50/50 text-slate-700 placeholder:text-slate-400"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-sm text-slate-500 font-medium whitespace-nowrap">Môn học:</span>
          <select
            value={selectedSubjectId}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedSubjectId(val === 'all' ? 'all' : Number(val));
            }}
            className="w-full md:w-56 px-3 py-2 text-sm rounded-xl border border-slate-200 outline-none focus:border-indigo-500 transition-colors bg-white text-slate-700 font-medium"
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
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 font-medium">Bạn chưa được phân công quản lý môn học nào.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {subjects
            .filter((sub) => selectedSubjectId === 'all' || sub.subjectId === selectedSubjectId)
            .map((subject) => {
              const templates = (roadmapsBySubject[subject.subjectId] || []).filter((tpl) =>
                tpl.pathName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (tpl.description && tpl.description.toLowerCase().includes(searchQuery.toLowerCase()))
              );

              if (selectedSubjectId === 'all' && templates.length === 0 && searchQuery !== '') {
                // If search result is empty in "Show all" mode, we hide this subject block
                return null;
              }

              return (
                <div key={subject.subjectId} className="space-y-4">
                  {/* Subject Header */}
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                      {subject.subjectCode}
                    </span>
                    <h2 className="text-lg font-bold text-slate-800">{subject.subjectName}</h2>
                  </div>

                  {/* Template grid */}
                  {templates.length === 0 ? (
                    <div className="py-8 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-slate-500 text-sm">
                      Môn học này chưa có bản thiết kế lộ trình nào khớp với tìm kiếm.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {templates.map((template) => (
                        <Card
                          key={template.pathId}
                          className="group relative bg-white border border-slate-100 hover:border-indigo-100 hover:shadow-lg transition-all rounded-2xl flex flex-col justify-between overflow-hidden"
                        >
                          {/* Accent bar */}
                          <div
                            className={`h-1.5 w-full ${
                              template.level === 3 ? 'bg-emerald-500' : template.level === 2 ? 'bg-purple-500' : 'bg-indigo-500'
                            }`}
                          />

                          <CardHeader className="p-5 pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="text-base font-bold text-slate-900 leading-snug line-clamp-1">
                                {template.pathName}
                              </CardTitle>
                              <Badge
                                variant="outline"
                                className={`shrink-0 text-[10px] py-0 px-2 font-semibold border ${
                                  template.level === 3
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : template.level === 2
                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                }`}
                              >
                                {getLevelLabel(template.level)}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium pt-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>
                                {template.createdAt
                                  ? new Date(template.createdAt).toLocaleDateString('vi-VN')
                                  : 'N/A'}
                              </span>
                            </div>
                          </CardHeader>

                          <CardContent className="p-5 pt-0 pb-4 flex-1">
                            <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">
                              {template.description || 'Không có mô tả chi tiết lộ trình mẫu này.'}
                            </p>
                          </CardContent>

                          <CardFooter className="p-5 pt-3 border-t border-slate-50 bg-slate-50/40 flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => handleOpenDetail(template)}
                              className="flex-1 text-xs border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl py-2 flex items-center justify-center gap-1.5 font-medium transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              Xem chi tiết
                            </Button>
                            <Button
                              onClick={() => handleOpenApply(template)}
                              className="flex-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 flex items-center justify-center gap-1.5 font-semibold transition-all shadow-sm shadow-indigo-100"
                            >
                              <Zap className="w-4 h-4" />
                              Áp dụng lớp
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* Modal: Create Template */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl bg-white border border-slate-100 p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Tạo Lộ trình học mới
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Thiết lập bản phác thảo lộ trình để quản lý học tập lớp học hiệu quả hơn.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Subject Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">Môn học áp dụng</label>
              <select
                value={createSubjectId}
                onChange={(e) => setCreateSubjectId(Number(e.target.value))}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 outline-none focus:border-indigo-500 bg-white text-slate-700 font-medium"
              >
                {subjects.map((sub) => (
                  <option key={sub.subjectId} value={sub.subjectId}>
                    {sub.subjectCode} - {sub.subjectName}
                  </option>
                ))}
              </select>
            </div>

            {/* Path Name Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">Tên lộ trình</label>
              <input
                type="text"
                placeholder="Ví dụ: Lộ trình cơ bản kỳ Fall 2026..."
                value={createPathName}
                onChange={(e) => setCreatePathName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 outline-none focus:border-indigo-500 text-slate-700 placeholder:text-slate-400 bg-slate-50/50"
              />
            </div>

            {/* Level Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">Cấp độ</label>
              <select
                value={createLevel}
                onChange={(e) => setCreateLevel(Number(e.target.value) as 1 | 2 | 3)}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 outline-none focus:border-indigo-500 bg-white text-slate-700 font-medium"
              >
                <option value={1}>Yêu (1)</option>
                <option value={2}>Trung bình (2)</option>
                <option value={3}>Khá (3)</option>
              </select>
            </div>

            {/* Description Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">Mô tả lộ trình (Tùy chọn)</label>
              <textarea
                placeholder="Nhập mô tả ngắn gọn về mục tiêu của lộ trình này..."
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 outline-none focus:border-indigo-500 text-slate-700 placeholder:text-slate-400 bg-slate-50/50 resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              disabled={creating}
              onClick={() => setIsCreateOpen(false)}
              className="border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl"
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirmCreate}
              disabled={creating}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm flex items-center gap-1.5 font-semibold"
            >
              {creating && <Loader2 className="w-4 h-4 animate-spin" />}
              Tạo mới
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: View Template Node Details */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-xl rounded-2xl bg-white border border-slate-100 p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Map className="w-5 h-5 text-indigo-600" />
              Chi tiết lộ trình mẫu
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              {selectedTemplateForDetail?.pathName} — Mức độ:{' '}
              <span className="font-semibold text-indigo-600">
                {getLevelLabel(selectedTemplateForDetail?.level)}
              </span>
            </DialogDescription>
          </DialogHeader>

          {loadingDetail ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <span className="text-xs text-slate-400 font-medium">Đang tải danh sách node học tập...</span>
            </div>
          ) : detailNodes.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl my-4">
              Lộ trình này hiện chưa được cấu hình node học tập nào.
            </div>
          ) : (
            <div className="my-4 max-h-[360px] overflow-y-auto pr-1 space-y-3">
              {detailNodes.map((node, idx) => (
                <div
                  key={node.nodeId}
                  className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex items-start justify-between gap-3 shadow-sm hover:border-indigo-100/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border border-indigo-100">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">{node.title}</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {node.description || 'Không có mô tả cho node này.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-[9px] py-0 px-1.5 font-medium border ${
                        node.nodeType === 'ON_CLASS'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}
                    >
                      {node.nodeType === 'ON_CLASS' ? 'Trên lớp' : 'Tự học'}
                    </Badge>
                    {node.isRequired && (
                      <Badge
                        variant="outline"
                        className="text-[9px] py-0 px-1.5 font-medium border bg-red-50 text-red-700 border-red-200"
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
              onClick={() => setIsDetailOpen(false)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl w-full sm:w-auto"
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Apply template to class */}
      <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-white border border-slate-100 p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              Áp dụng lộ trình cho Lớp học
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Nhân bản lộ trình mẫu này vào lớp học chưa bắt đầu của bạn.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="p-3.5 bg-indigo-50/50 border border-indigo-100/50 rounded-xl">
              <span className="text-xs font-semibold text-slate-400">Lộ trình được chọn:</span>
              <p className="text-sm font-bold text-slate-800 pt-0.5">
                {selectedTemplateForApply?.pathName}
              </p>
            </div>

            {loadingClasses ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                <span className="text-xs text-slate-400 font-medium">Đang kiểm tra danh sách lớp học...</span>
              </div>
            ) : availableClassrooms.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center text-amber-800 text-xs flex flex-col items-center gap-2">
                <AlertCircle className="w-6 h-6 text-amber-500" />
                <span>
                  Không tìm thấy lớp học chưa bắt đầu nào của môn học này mà chưa được gán lộ trình.
                </span>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Chọn lớp học nhận bản sao</label>
                <select
                  value={selectedClassroomSubjectId}
                  onChange={(e) => setSelectedClassroomSubjectId(Number(e.target.value))}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 outline-none focus:border-indigo-500 bg-white text-slate-700 font-semibold"
                >
                  {availableClassrooms.map((cls) => (
                    <option key={cls.classroomSubjectId} value={cls.classroomSubjectId}>
                      {cls.displayName || `${cls.className} - ${cls.subjectCode}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-2.5">
              <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-slate-400 leading-normal">
                Hành động này sẽ sao chép toàn bộ cấu trúc node và dữ liệu (bài học, tài liệu, bài test) từ
                bản lộ trình mẫu sang lớp học của bạn ở trạng thái Nháp (Draft).
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              disabled={applying}
              onClick={() => setIsApplyOpen(false)}
              className="border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl"
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirmApply}
              disabled={applying || availableClassrooms.length === 0 || !selectedClassroomSubjectId}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm flex items-center gap-1.5 font-semibold"
            >
              {applying && <Loader2 className="w-4 h-4 animate-spin" />}
              Xác nhận Áp dụng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
