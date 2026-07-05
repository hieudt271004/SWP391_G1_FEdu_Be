import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronRight, ArrowLeft, Loader2 } from "lucide-react";
import { classroomService } from "../../services/classroom.service";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { toast } from "sonner";

interface ClassForm {
  className: string;
  semester: string;
  description: string;
  status?: string;
}

export function AddClassPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<ClassForm>({
    className: "",
    semester: "",
    description: "",
    status: "inactive",
  });

  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit) return;
    const fetchData = async () => {
      try {
        const data = await classroomService.getById(Number(id));
        setForm({
          className: data.className || "",
          semester: data.semester || "",
          description: data.description || "",
          status: data.status || "inactive",
        });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.className.trim()) {
      setError("Tên lớp học là bắt buộc.");
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      if (isEdit) {
        await classroomService.update(Number(id), form);
        toast.success(`Đã cập nhật lớp học "${form.className.trim()}" thành công.`);
        navigate("/admin/classes");
      } else {
        const newClass = await classroomService.create(form);
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
      {/* Header & Breadcrumb */}
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
              {/* Tên lớp học */}
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

              {/* Học kỳ */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">
                  Học kỳ
                </label>
                <Input
                  type="text"
                  value={form.semester}
                  onChange={(e) => handleChange("semester", e.target.value)}
                  placeholder="VD: Fall 2024"
                />
              </div>

              {/* Trạng thái lớp học (Chỉ hiển thị ở chế độ Edit) */}
              {isEdit && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground">
                    Trạng thái lớp học
                  </label>
                  <select
                    value={form.status || "inactive"}
                    onChange={(e) => handleChange("status", e.target.value)}
                    disabled={form.status === "inactive"}
                    className="flex h-9 w-full rounded-md border border-input bg-input-background px-3 py-1 text-sm shadow-sm transition-colors cursor-pointer outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                  >
                    <option value="inactive">Chưa bắt đầu (Giảng viên sẽ kích hoạt)</option>
                    <option value="active">Đang hoạt động</option>
                    <option value="completed">Đã hoàn thành</option>
                  </select>
                </div>
              )}

              {/* Mô tả */}
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

        {/* Actions */}
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
