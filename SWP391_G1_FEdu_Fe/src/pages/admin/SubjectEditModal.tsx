import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { subjectService } from "../../services/subject.service";

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
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-950">Chỉnh sửa môn học</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-50 transition-colors text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mã môn học *</label>
            <input
              type="text"
              value={formData.subjectCode}
              onChange={(e) => setFormData(prev => ({ ...prev, subjectCode: e.target.value }))}
              placeholder="VD: REACT101"
              required
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-600 transition-colors text-gray-900 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tên môn học *</label>
            <input
              type="text"
              value={formData.subjectName}
              onChange={(e) => setFormData(prev => ({ ...prev, subjectName: e.target.value }))}
              placeholder="VD: Lập trình Web với React"
              required
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-600 transition-colors text-gray-900 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mô tả</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Mô tả ngắn về nội dung môn học..."
              rows={3}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-600 transition-colors text-gray-900 text-sm resize-none"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-semibold text-sm transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 text-white font-semibold text-sm rounded-xl transition-all disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
