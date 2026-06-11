import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { adminService } from "../../services/admin.service";

interface AdminUser {
  id?: number;
  name: string;
  email: string;
  phone: string;
  gender: "Male" | "Female" | "Other";
  dateOfBirth: string;
  role: string;
  status: "active" | "inactive";
  avatar: string;
  avatarUrl?: string;
}

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: AdminUser | null;
  mode: "add" | "edit";
  onSuccess?: () => void;
}

export function UserDetailModal({ isOpen, onClose, user, mode, onSuccess }: UserDetailModalProps) {
  const [formData, setFormData] = useState<{
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    avatarUrl: string;
    role: string;
    status: string;
  }>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    avatarUrl: "",
    role: "STUDENT",
    status: "ACTIVE",
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && user) {
        setFormData({
          email: user.email || "",
          password: "",
          firstName: user.name ? user.name.split(" ")[0] : "",
          lastName: user.name ? user.name.split(" ").slice(1).join(" ") : "",
          phone: user.phone || "",
          avatarUrl: user.avatarUrl || "",
          role: user.role === "Giảng viên" ? "TEACHER" : user.role === "Admin" ? "ADMIN" : "STUDENT",
          status: user.status === "inactive" ? "INACTIVE" : "ACTIVE",
        });
      } else {
        setFormData({
          email: "",
          password: "",
          firstName: "",
          lastName: "",
          phone: "",
          avatarUrl: "",
          role: "STUDENT",
          status: "ACTIVE",
        });
      }
      setError(null);
    }
  }, [isOpen, user, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "add") {
      try {
        setSubmitting(true);
        setError(null);
        await adminService.createUser({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          avatarUrl: formData.avatarUrl,
          status: formData.status as "ACTIVE" | "INACTIVE" | "NONE",
          userRole: formData.role,
        });
        onSuccess?.();
        onClose();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Tạo thất bại");
      } finally {
        setSubmitting(false);
      }
    } else {
      // Handle Edit mode submission here when available
      onClose();
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div
        className="relative w-full max-w-2xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: "white" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827" }}>
            {mode === "add" ? "Thêm người dùng mới" : "Chỉnh sửa thông tin"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" style={{ color: "#6b7280" }} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: "0.875rem" }}>
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#374151", marginBottom: "0.5rem" }}>Email *</label>
              <input type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)}
                placeholder="example@email.com" required
                className="w-full px-4 py-2.5 rounded-lg outline-none"
                style={{ backgroundColor: "#f3f4f6", border: "1px solid #e5e7eb", color: "#111827", fontSize: "0.9375rem" }}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#374151", marginBottom: "0.5rem" }}>
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  placeholder="First name"
                  className="w-full px-4 py-2.5 rounded-lg outline-none"
                  style={{ backgroundColor: "#f3f4f6", border: "1px solid #e5e7eb", color: "#111827", fontSize: "0.9375rem" }}
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#374151", marginBottom: "0.5rem" }}>
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  placeholder="Last name"
                  className="w-full px-4 py-2.5 rounded-lg outline-none"
                  style={{ backgroundColor: "#f3f4f6", border: "1px solid #e5e7eb", color: "#111827", fontSize: "0.9375rem" }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#374151", marginBottom: "0.5rem" }}>
                Số điện thoại
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+84 123 456 789"
                className="w-full px-4 py-2.5 rounded-lg outline-none"
                style={{ backgroundColor: "#f3f4f6", border: "1px solid #e5e7eb", color: "#111827", fontSize: "0.9375rem" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#374151", marginBottom: "0.5rem" }}>
                Avatar URL
              </label>
              <input
                type="url"
                value={formData.avatarUrl}
                onChange={(e) => handleChange("avatarUrl", e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full px-4 py-2.5 rounded-lg outline-none"
                style={{ backgroundColor: "#f3f4f6", border: "1px solid #e5e7eb", color: "#111827", fontSize: "0.9375rem" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#374151", marginBottom: "0.5rem" }}>Mật khẩu (Password) *</label>
              <input type="password" value={formData.password} onChange={(e) => handleChange("password", e.target.value)}
                placeholder="Tối thiểu 8 ký tự" required={mode === "add"}
                className="w-full px-4 py-2.5 rounded-lg outline-none"
                style={{ backgroundColor: "#f3f4f6", border: "1px solid #e5e7eb", color: "#111827", fontSize: "0.9375rem" }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#374151", marginBottom: "0.5rem" }}>Role (Vai trò)</label>
                <select value={formData.role} onChange={(e) => handleChange("role", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg outline-none cursor-pointer"
                  style={{ backgroundColor: "#f3f4f6", border: "1px solid #e5e7eb", color: "#111827", fontSize: "0.9375rem" }}>
                  <option value="STUDENT">Học viên</option>
                  <option value="TEACHER">Giảng viên</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#374151", marginBottom: "0.5rem" }}>Status (Trạng thái)</label>
                <select value={formData.status} onChange={(e) => handleChange("status", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg outline-none cursor-pointer"
                  style={{ backgroundColor: "#f3f4f6", border: "1px solid #e5e7eb", color: "#111827", fontSize: "0.9375rem" }}>
                  <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                  <option value="INACTIVE">Ngưng (INACTIVE)</option>
                  <option value="NONE">Khác (NONE)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t" style={{ borderColor: "#e5e7eb" }}>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl transition-colors hover:bg-gray-100"
              style={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                color: "#374151",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              Hủy
            </button>
            <button type="submit" disabled={submitting}
              className="px-6 py-2.5 rounded-xl text-white transition-opacity hover:opacity-90 flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)", border: "none", cursor: submitting ? "not-allowed" : "pointer", fontSize: "0.875rem", fontWeight: 600, opacity: submitting ? 0.6 : 1 }}>
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "add" ? "Thêm người dùng" : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}