import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronRight, ArrowLeft, Loader2 } from "lucide-react";
import { subjectService } from "../../services/subject.service";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";

interface SubjectForm {
  subjectCode: string;
  subjectName: string;
  description: string;
}

export function AddSubjectPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<SubjectForm>({
    subjectCode: "",
    subjectName: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit) {
      const fetchSubject = async () => {
        try {
          const data = await subjectService.getById(Number(id));
          setForm({
            subjectCode: data.subjectCode,
            subjectName: data.subjectName,
            description: data.description || "",
          });
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : "Tải thông tin môn học thất bại");
        } finally {
          setLoading(false);
        }
      };
      fetchSubject();
    }
  }, [id, isEdit]);

  const handleChange = (
    field: keyof SubjectForm,
    value: string
  ) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subjectCode.trim() || !form.subjectName.trim()) {
      setError("Mã môn học và tên môn học là bắt buộc.");
      return;
    }
    const payload = { ...form };
    try {
      setSubmitting(true);
      setError(null);
      if (isEdit) {
        await subjectService.update(Number(id), payload);
      } else {
        await subjectService.create(payload);
      }
      navigate("/admin/subjects");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Thao tác thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
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
            {isEdit ? "Chỉnh sửa môn học" : "Thêm môn học mới"}
          </h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Button variant="link" type="button" onClick={() => navigate("/admin/subjects")} className="p-0 h-auto font-semibold text-primary hover:no-underline">
              Quản lý Môn học
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mã khóa học */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">
                  Mã môn học <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  value={form.subjectCode}
                  onChange={(e) => handleChange("subjectCode", e.target.value)}
                  placeholder="VD: REACT101"
                  required
                />
              </div>

              {/* Tên khóa học */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">
                  Tên môn học <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  value={form.subjectName}
                  onChange={(e) => handleChange("subjectName", e.target.value)}
                  placeholder="VD: Lập trình Web với React"
                  required
                />
              </div>

              {/* Mô tả */}
              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-semibold text-foreground">
                  Mô tả
                </label>
                <Textarea
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Mô tả ngắn về nội dung và mục tiêu của môn học..."
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
            {submitting ? "Đang xử lý..." : isEdit ? "Lưu thay đổi" : "Tạo môn học"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/subjects")}
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
