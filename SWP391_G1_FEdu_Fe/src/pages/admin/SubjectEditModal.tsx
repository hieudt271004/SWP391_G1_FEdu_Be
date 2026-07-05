import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { subjectService } from "../../services/subject.service";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";

interface SubjectEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: {
    id: number;
    title: string;
    code: string;
    description: string;
    status: "draft" | "published";
  } | null;
  onSuccess: () => void;
}

export function SubjectEditModal({ isOpen, onClose, course, onSuccess }: SubjectEditModalProps) {
  const [formData, setFormData] = useState({
    subjectCode: "",
    subjectName: "",
    description: "",
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && course) {
      setFormData({
        subjectCode: course.code || "",
        subjectName: course.title || "",
        description: course.description || "",
      });
      setError(null);
    }
  }, [isOpen, course]);

  if (!isOpen || !course) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subjectCode.trim() || !formData.subjectName.trim()) {
      setError("Mã môn học và tên môn học là bắt buộc.");
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      await subjectService.update(course.id, {
        subjectCode: formData.subjectCode.trim(),
        subjectName: formData.subjectName.trim(),
        description: formData.description.trim(),
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Cập nhật môn học thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background text-foreground w-full max-w-lg overflow-hidden border border-border rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">Chỉnh sửa môn học</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-foreground">Mã môn học *</label>
            <Input
              type="text"
              value={formData.subjectCode}
              onChange={(e) => setFormData(prev => ({ ...prev, subjectCode: e.target.value }))}
              placeholder="VD: REACT101"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-foreground">Tên môn học *</label>
            <Input
              type="text"
              value={formData.subjectName}
              onChange={(e) => setFormData(prev => ({ ...prev, subjectName: e.target.value }))}
              placeholder="VD: Lập trình Web với React"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-foreground">Mô tả</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Mô tả ngắn về nội dung môn học..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 font-semibold"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
