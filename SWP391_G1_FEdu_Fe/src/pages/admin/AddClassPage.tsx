import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronRight, ArrowLeft, Loader2 } from "lucide-react";
import { classroomService } from "../../services/classroom.service";
import { subjectService } from "../../services/subject.service";
import { adminService, AdminUserResponse } from "../../services/admin.service";

interface ClassForm {
  className: string;
  subjectId: number;
  lecturerId: number;
  semester: string;
  description: string;
}

export function AddClassPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id);

  const defaultSubjectId = Number(searchParams.get("subjectId")) || 0;

  const [form, setForm] = useState<ClassForm>({
    className: "",
    subjectId: defaultSubjectId,
    lecturerId: 0,
    semester: "",
    description: "",
  });
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<AdminUserResponse[]>([]);
  
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subs, users] = await Promise.all([
          subjectService.getAll(),
          adminService.getAllUsers()
        ]);
        setSubjects(subs);
        const teachs = users.filter((u: any) => u.roles?.includes("TEACHER"));
        setTeachers(teachs);
        
        if (isEdit) {
          const data = await classroomService.getById(Number(id));
          setForm({
            className: data.className || "",
            subjectId: data.subjectId || 0,
            lecturerId: data.lecturerId || 0,
            semester: data.semester || "",
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

  const handleChange = (
    field: keyof ClassForm,
    value: string | number
  ) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.className.trim() || !form.subjectId || !form.lecturerId) {
      setError("Tên lớp học, Khóa học và Giảng viên là bắt buộc.");
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      if (isEdit) {
        await classroomService.update(Number(id), form);
      } else {
        await classroomService.create(form);
      }
      navigate("/admin/classes");
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
        <button onClick={() => navigate("/admin/classes")} className="p-2 rounded-xl hover:bg-gray-100 transition-colors" style={{ color: "#4b5563" }}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827", marginBottom: "0.25rem" }}>
            {isEdit ? "Chỉnh sửa lớp học" : "Thêm lớp học mới"}
          </h1>
          <div className="flex items-center gap-2" style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            <button type="button" onClick={() => navigate("/admin/classes")} style={{ background: "none", border: "none", color: "#4338ca", cursor: "pointer", fontWeight: 600 }}>
              Quản lý Lớp học
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
            {/* Tên lớp học */}
            <div>
              <label style={{ display: "block", fontSize: "0.9375rem", fontWeight: 600, color: "#374151", marginBottom: "0.5rem" }}>
                Tên lớp học <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                value={form.className}
                onChange={(e) => handleChange("className", e.target.value)}
                placeholder="VD: SE1601"
                required
                className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", fontSize: "0.9375rem", color: "#111827" }}
                onFocus={(e) => (e.target.style.borderColor = "#4338ca")}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
              />
            </div>

            {/* Học kỳ */}
            <div>
              <label style={{ display: "block", fontSize: "0.9375rem", fontWeight: 600, color: "#374151", marginBottom: "0.5rem" }}>
                Học kỳ
              </label>
              <input
                type="text"
                value={form.semester}
                onChange={(e) => handleChange("semester", e.target.value)}
                placeholder="VD: Fall 2024"
                className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", fontSize: "0.9375rem", color: "#111827" }}
                onFocus={(e) => (e.target.style.borderColor = "#4338ca")}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
              />
            </div>

            {/* Khóa học */}
            <div>
              <label style={{ display: "block", fontSize: "0.9375rem", fontWeight: 600, color: "#374151", marginBottom: "0.5rem" }}>
                Thuộc khóa học <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <select
                value={form.subjectId}
                onChange={(e) => handleChange("subjectId", Number(e.target.value))}
                required
                className="w-full px-4 py-3 rounded-xl outline-none transition-all cursor-pointer"
                style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", fontSize: "0.9375rem", color: "#111827" }}
                onFocus={(e) => (e.target.style.borderColor = "#4338ca")}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
              >
                <option value={0} disabled>-- Chọn khóa học --</option>
                {subjects.map(s => (
                  <option key={s.subjectId} value={s.subjectId}>{s.subjectCode} - {s.subjectName}</option>
                ))}
              </select>
            </div>

            {/* Giảng viên */}
            <div>
              <label style={{ display: "block", fontSize: "0.9375rem", fontWeight: 600, color: "#374151", marginBottom: "0.5rem" }}>
                Giảng viên phụ trách <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <select
                value={form.lecturerId}
                onChange={(e) => handleChange("lecturerId", Number(e.target.value))}
                required
                className="w-full px-4 py-3 rounded-xl outline-none transition-all cursor-pointer"
                style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", fontSize: "0.9375rem", color: "#111827" }}
                onFocus={(e) => (e.target.style.borderColor = "#4338ca")}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
              >
                <option value={0} disabled>-- Chọn giảng viên --</option>
                {teachers.map(t => (
                  <option key={t.userId} value={t.userId}>
                    {t.firstName || ""} {t.lastName || ""} ({t.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Mô tả */}
            <div className="md:col-span-2">
              <label style={{ display: "block", fontSize: "0.9375rem", fontWeight: 600, color: "#374151", marginBottom: "0.5rem" }}>
                Mô tả
              </label>
              <textarea
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Mô tả ngắn về lớp học này..."
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
            {submitting ? "Đang xử lý..." : isEdit ? "Lưu thay đổi" : "Tạo lớp học"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/classes")}
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
