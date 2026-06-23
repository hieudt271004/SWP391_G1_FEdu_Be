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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" style={{ fontFamily: "Outfit, sans-serif" }}>
      <div className="bg-white w-full max-w-lg overflow-hidden" style={{ borderRadius: "10px", border: "1px solid rgba(0, 0, 0, 0.1)" }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-[#030213]">Chỉnh sửa môn học</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-50 transition-colors text-gray-500 border-none bg-transparent cursor-pointer">
            <X className="w-5 h-5" style={{ color: "#717182" }} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-red-600 text-sm" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px" }}>
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-[#030213] mb-1.5">Mã môn học *</label>
            <input
              type="text"
              value={formData.subjectCode}
              onChange={(e) => setFormData(prev => ({ ...prev, subjectCode: e.target.value }))}
              placeholder="VD: REACT101"
              required
              className="w-full px-3.5 py-2.5 outline-none text-sm transition-all focus:ring-2 focus:ring-[#030213] focus:bg-white"
              style={{ backgroundColor: "#ececf0", border: "none", borderRadius: "6px", color: "#000000" }}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#030213] mb-1.5">Tên môn học *</label>
            <input
              type="text"
              value={formData.subjectName}
              onChange={(e) => setFormData(prev => ({ ...prev, subjectName: e.target.value }))}
              placeholder="VD: Lập trình Web với React"
              required
              className="w-full px-3.5 py-2.5 outline-none text-sm transition-all focus:ring-2 focus:ring-[#030213] focus:bg-white"
              style={{ backgroundColor: "#ececf0", border: "none", borderRadius: "6px", color: "#000000" }}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#030213] mb-1.5">Mô tả</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Mô tả ngắn về nội dung môn học..."
              rows={3}
              className="w-full px-3.5 py-2.5 outline-none text-sm transition-all focus:ring-2 focus:ring-[#030213] focus:bg-white resize-none"
              style={{ backgroundColor: "#ececf0", border: "none", borderRadius: "6px", color: "#000000" }}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t" style={{ borderColor: "rgba(0,0,0,0.1)" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 hover:bg-gray-50 text-gray-700 font-semibold text-sm transition-colors disabled:opacity-50 border-none bg-transparent"
              style={{
                backgroundColor: "white",
                border: "1px solid rgba(0, 0, 0, 0.1)",
                borderRadius: "6px",
                color: "#000000",
                cursor: "pointer",
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-6 py-2.5 text-white transition-colors hover:bg-[#1c1b2d] border-none"
              style={{
                backgroundColor: "#030213",
                borderRadius: "6px",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.6 : 1,
              }}
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
