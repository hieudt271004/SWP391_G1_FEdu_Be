import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Loader2, AlertCircle, Calendar, ChevronRight } from "lucide-react";
import { semesterService } from "../../services/semester.service";
import { SemesterResponse } from "../../types/semester";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

export function SemesterManagementPage() {
  const [semesters, setSemesters] = useState<SemesterResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedSemester, setSelectedSemester] = useState<SemesterResponse | null>(null);

  const [term, setTerm] = useState("");
  const [academicYear, setAcademicYear] = useState<number | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [semesterToDelete, setSemesterToDelete] = useState<SemesterResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSemesters = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await semesterService.getAll();
      setSemesters(res || []);
    } catch (e: any) {
      setError(e.message || "Không thể tải danh sách học kỳ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSemesters();
  }, []);

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedSemester(null);
    setTerm("");
    setAcademicYear("");
    setStartDate("");
    setEndDate("");
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (semester: SemesterResponse) => {
    setModalMode("edit");
    setSelectedSemester(semester);
    setTerm(semester.term);
    setAcademicYear(semester.academicYear);
    setStartDate(semester.startDate);
    setEndDate(semester.endDate);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim()) {
      setFormError("Tên học kỳ không được để trống");
      return;
    }
    if (!academicYear) {
      setFormError("Năm học không được để trống");
      return;
    }
    if (!startDate || !endDate) {
      setFormError("Ngày bắt đầu và kết thúc không được để trống");
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const payload = {
        term: term.trim(),
        academicYear: Number(academicYear),
        startDate,
        endDate,
      };

      if (modalMode === "create") {
        await semesterService.create(payload);
      } else {
        if (selectedSemester) {
          await semesterService.update(selectedSemester.semesterId, payload);
        }
      }

      setIsModalOpen(false);
      fetchSemesters();
    } catch (e: any) {
      setFormError(e.message || "Có lỗi xảy ra khi lưu học kỳ");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (semester: SemesterResponse) => {
    setSemesterToDelete(semester);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!semesterToDelete) return;
    try {
      setDeleting(true);
      await semesterService.delete(semesterToDelete.semesterId);
      setIsDeleteOpen(false);
      fetchSemesters();
    } catch (e: any) {
      alert(e.message || "Không thể xóa học kỳ này");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 text-foreground bg-background">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Quản lý học kỳ</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Quản trị viên</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
          <span className="text-foreground font-semibold">Quản lý học kỳ</span>
        </div>
      </div>

      <div className="flex items-center justify-end">
        <Button onClick={openCreateModal} className="gap-2 h-9 text-xs font-semibold">
          <Plus className="w-4 h-4" /> Thêm học kỳ
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/10 text-destructive">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="font-medium text-sm">{error}</p>
            <Button variant="ghost" size="sm" onClick={fetchSemesters} className="ml-auto text-destructive hover:bg-destructive/20">
              Thử lại
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Đang tải danh sách học kỳ...</span>
        </div>
      ) : semesters.length === 0 ? (
        <Card className="border-dashed border-2 py-16 flex flex-col items-center justify-center text-center">
          <CardContent className="space-y-4">
            <div className="bg-accent/40 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-muted-foreground">
              <Calendar className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">Chưa có học kỳ nào</h3>
              <p className="text-sm text-muted-foreground">Hãy bắt đầu bằng việc tạo học kỳ đầu tiên.</p>
            </div>
            <Button onClick={openCreateModal} variant="outline" className="mt-2">
              Tạo học kỳ ngay
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden bg-card text-card-foreground border border-border rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-primary text-primary-foreground border-b border-border">
                  {["ID", "HỌC KỲ", "NĂM HỌC", "NGÀY BẮT ĐẦU", "NGÀY KẾT THÚC", "HÀNH ĐỘNG"].map((h) => (
                    <th
                      key={h}
                      className={`px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-primary-foreground ${
                        h === "HÀNH ĐỘNG" ? "text-right" : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {semesters.map((semester) => (
                  <tr
                    key={semester.semesterId}
                    className="hover:bg-accent/40 transition-colors"
                  >
                    <td className="px-6 py-4.5 font-semibold text-muted-foreground text-sm">#{semester.semesterId}</td>
                    <td className="px-6 py-4.5 font-semibold text-foreground text-sm">{semester.semesterLabel}</td>
                    <td className="px-6 py-4.5 text-muted-foreground text-sm">{semester.academicYear}</td>
                    <td className="px-6 py-4.5 text-muted-foreground text-sm">{semester.startDate}</td>
                    <td className="px-6 py-4.5 text-muted-foreground text-sm">{semester.endDate}</td>
                    <td className="px-6 py-4.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:bg-accent"
                          onClick={() => openEditModal(semester)}
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => confirmDelete(semester)}
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md bg-background border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary">
              {modalMode === "create" ? "Thêm học kỳ mới" : "Chỉnh sửa học kỳ"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Nhập tên học kỳ, năm học và các mốc ngày bắt đầu, ngày kết thúc tương ứng.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {formError && (
              <div className="bg-destructive/10 text-destructive text-sm font-medium p-3 rounded-lg flex items-center gap-2 border border-destructive/20">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="term" className="text-sm font-semibold text-primary">
                Tên học kỳ
              </Label>
              <Input
                id="term"
                placeholder="Ví dụ: SPRING, Học kỳ I, Học kỳ II..."
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="bg-background border-border text-primary focus-visible:ring-primary focus-visible:ring-offset-0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="academicYear" className="text-sm font-semibold text-primary">
                Năm học
              </Label>
              <Input
                id="academicYear"
                type="number"
                placeholder="Ví dụ: 2026"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value ? Number(e.target.value) : "")}
                className="bg-background border-border text-primary focus-visible:ring-primary focus-visible:ring-offset-0"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-sm font-semibold text-primary">
                  Ngày bắt đầu
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-background border-border text-primary focus-visible:ring-primary focus-visible:ring-offset-0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-sm font-semibold text-primary">
                  Ngày kết thúc
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-background border-border text-primary focus-visible:ring-primary focus-visible:ring-offset-0"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border gap-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={submitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <span>Lưu lại</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md bg-background border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span>Xác nhận xóa học kỳ?</span>
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground pt-1">
              Hành động này không thể hoàn tác. Việc xóa học kỳ <strong className="text-primary font-semibold">"{semesterToDelete?.semesterLabel}"</strong> có thể ảnh hưởng đến lịch học của các lớp học đang gán kỳ này.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 border-t border-border gap-2">
            <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Hủy bỏ
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Đang xóa...</span>
                </>
              ) : (
                <span>Đồng ý xóa</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
