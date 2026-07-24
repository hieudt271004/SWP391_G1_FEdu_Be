import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronRight, ArrowLeft, Loader2 } from "lucide-react";
import { classroomService } from "../../services/classroom.service";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { toast } from "sonner";
import type { ClassroomRequest } from "../../types/classroom";
import { semesterService } from "../../services/semester.service";
import type { SemesterResponse } from "../../types/semester";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";


interface ClassForm {
  className: string;
  semesterId: string;
  description: string;
}

export function AddClassPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<ClassForm>({
    className: "",
    semesterId: "",
    description: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);
  const [semesters, setSemesters] = useState<SemesterResponse[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const semData = await semesterService.getAll();
        setSemesters(semData || []);

        if (isEdit) {
          const data = await classroomService.getById(Number(id));
          setForm({
            className: data.className || "",
            semesterId: data.semesterId != null ? String(data.semesterId) : "",
            description: data.description || "",
          });
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Tải dữ liệu thất bại");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEdit]);

  const handleChange = (field: keyof ClassForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSemesterChange = (selectedValue: string) => {
    setForm(prev => ({ ...prev, semesterId: selectedValue || "" }));
  };

  // Năm học hiển thị (readonly) suy ra từ học kỳ đang chọn.
  const selectedSemester = semesters.find(s => String(s.semesterId) === form.semesterId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.className.trim()) {
      setError("Tên lớp học là bắt buộc.");
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const payload: ClassroomRequest = {
        className: form.className.trim(),
        semesterId: form.semesterId ? Number(form.semesterId) : null,
        description: form.description,
      };
      if (isEdit) {
        await classroomService.update(Number(id), payload);
        toast.success(`Đã cập nhật lớp học "${form.className.trim()}" thành công.`);
        navigate("/admin/classes");
      } else {
        const newClass = await classroomService.create(payload);
        toast.success(`Đã tạo lớp học "${form.className.trim()}" thành công.`);
        navigate(`/admin/classes/${newClass.classroomId}?addSubject=true`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Thao tác thất bại");
      toast.error(err instanceof Error ? err.message : "Thao tác thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="space-y-6 max-w-4xl">
      {}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-lg">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isEdit ? "Chỉnh sửa lớp học" : "Thêm lớp học mới"}
          </h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Button variant="link" type="button" onClick={() => navigate("/admin/classes")} className="p-0 h-auto font-semibold text-primary hover:no-underline">
              Quản lý Lớp học
            </Button>
            <ChevronRight className="w-3 h-3 text-muted-foreground/60" />
            <span className="text-foreground font-semibold">{isEdit ? "Chỉnh sửa" : "Thêm mới"}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="p-6 space-y-6">
            {error && (
              <div className="px-4 py-3 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            {!isEdit && (
              <div className="px-4 py-3 rounded-lg border bg-accent/50 text-foreground text-sm">
                Sau khi tạo lớp, bạn sẽ thêm <strong>các môn học</strong> cho lớp (mỗi môn chọn giảng viên & danh sách sinh viên riêng).
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">
                  Tên lớp học <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  value={form.className}
                  onChange={(e) => handleChange("className", e.target.value)}
                  placeholder="VD: SE1601"
                  required
                />
              </div>

              {}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">
                  Học kỳ <span className="text-destructive">*</span>
                </label>
                <Select
                  value={form.semesterId}
                  onValueChange={(val) => handleSemesterChange(val)}
                >
                  <SelectTrigger className="w-full bg-input-background text-foreground border-input">
                    <SelectValue placeholder="— Chọn học kỳ đã cấu hình —" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground border-border">
                    {semesters.map((sem) => (
                      <SelectItem
                        key={sem.semesterId}
                        value={String(sem.semesterId)}
                      >
                        {sem.semesterLabel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">
                  Năm học
                </label>
                <Input
                  type="number"
                  value={selectedSemester?.academicYear ?? ""}
                  readOnly
                  placeholder="Tự động điền theo học kỳ"
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
              </div>

              {}
              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-semibold text-foreground">
                  Mô tả
                </label>
                <Textarea
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Mô tả ngắn về lớp học này..."
                  rows={4}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={submitting} className="px-8">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? "Đang xử lý..." : isEdit ? "Lưu thay đổi" : "Tạo lớp học"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/classes")}
            disabled={submitting}
            className="px-8 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 hover:border-destructive"
          >
            Hủy
          </Button>
        </div>
      </form>
    </div>
  );
}
