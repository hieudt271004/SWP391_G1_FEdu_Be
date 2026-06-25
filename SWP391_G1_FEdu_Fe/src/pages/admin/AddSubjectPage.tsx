import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronRight, ArrowLeft, Loader2 } from "lucide-react";
import { subjectService } from "../../services/subject.service";

interface SubjectForm {
  subjectCode: string;
  subjectName: string;
  description: string;
  learningpathLength: string;
}

export function AddSubjectPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<SubjectForm>({
    subjectCode: "",
    subjectName: "",
    description: "",
    learningpathLength: "",
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
            learningpathLength: data.learningpathLength ? String(data.learningpathLength) : "",
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
    const payload = {
      ...form,
      learningpathLength: form.learningpathLength.trim() ? Number(form.learningpathLength) : undefined,
    };
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
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#4338ca" }} />
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header & Breadcrumb */}
      <div className="flex items-center gap-4 mb-2">
        <button onClick={() => navigate("/admin/subjects")} className="p-2 rounded-xl hover:bg-gray-100 transition-colors" style={{ color: "#4b5563" }}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827", marginBottom: "0.25rem" }}>
            {isEdit ? "Chỉnh sửa môn học" : "Thêm môn học mới"}
          </h1>
          <div className="flex items-center gap-2" style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            <button type="button" onClick={() => navigate("/admin/subjects")} style={{ background: "none", border: "none", color: "#4338ca", cursor: "pointer", fontWeight: 600 }}>
              Quản lý Môn học
            </button>
            <ChevronRight className="w-3 h-3" />
            <span style={{ color: "#4338ca", fontWeight: 600 }}>{isEdit ? "Chỉnh sửa" : "Thêm mới"}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="rounded-2xl p-6 bg-white" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          {error && (
            <div className="px-4 py-3 rounded-lg mb-6" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: "0.875rem" }}>
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mã khóa học */}
            <div>
              <label style={{ display: "block", fontSize: "0.9375rem", fontWeight: 600, color: "#374151", marginBottom: "0.5rem" }}>
                Mã môn học <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                value={form.subjectCode}
                onChange={(e) => handleChange("subjectCode", e.target.value)}
                placeholder="VD: REACT101"
                required
                className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", fontSize: "0.9375rem", color: "#111827" }}
                onFocus={(e) => (e.target.style.borderColor = "#4338ca")}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
              />
            </div>

            {/* Tên khóa học */}
            <div>
              <label style={{ display: "block", fontSize: "0.9375rem", fontWeight: 600, color: "#374151", marginBottom: "0.5rem" }}>
                Tên môn học <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                value={form.subjectName}
                onChange={(e) => handleChange("subjectName", e.target.value)}
                placeholder="VD: Lập trình Web với React"
                required
                className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", fontSize: "0.9375rem", color: "#111827" }}
                onFocus={(e) => (e.target.style.borderColor = "#4338ca")}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
              />
            </div>

            {/* Số chặng */}
            <div>
              <label style={{ display: "block", fontSize: "0.9375rem", fontWeight: 600, color: "#374151", marginBottom: "0.5rem" }}>
                Số chặng (learningpathLength)
              </label>
              <input
                type="number"
                min={1}
                value={form.learningpathLength}
                onChange={(e) => handleChange("learningpathLength", e.target.value)}
                placeholder="VD: 5"
                className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", fontSize: "0.9375rem", color: "#111827" }}
                onFocus={(e) => (e.target.style.borderColor = "#4338ca")}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
              />
            </div>

            {/* Mô tả */}
            <div className="md:col-span-2">
              <label style={{ display: "block", fontSize: "0.9375rem", fontWeight: 600, color: "#374151", marginBottom: "0.5rem" }}>
                Mô tả
              </label>
              <textarea
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Mô tả ngắn về nội dung và mục tiêu của môn học..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl outline-none transition-all resize-none"
                style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", fontSize: "0.9375rem", color: "#111827" }}
                onFocus={(e) => (e.target.style.borderColor = "#4338ca")}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-6">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-8 py-3 rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)", border: "none", cursor: submitting ? "not-allowed" : "pointer", fontSize: "0.9375rem", fontWeight: 600 }}
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? "Đang xử lý..." : isEdit ? "Lưu thay đổi" : "Tạo môn học"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/subjects")}
            disabled={submitting}
            className="px-8 py-3 rounded-xl transition-colors hover:bg-red-50"
            style={{ backgroundColor: "#ffe5e5", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "0.9375rem", fontWeight: 600 }}
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}
