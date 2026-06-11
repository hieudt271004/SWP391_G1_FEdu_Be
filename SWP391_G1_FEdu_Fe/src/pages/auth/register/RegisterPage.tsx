import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, BookOpen, Mail, Lock, User, ArrowLeft } from "lucide-react";
import { LeftPanel } from "../components/LeftPanel";
import { emailRegex, RegField, defaultRegisterForm } from "../types";
import { authService } from "../../../services/auth.service";


export function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reg, setReg] = useState(defaultRegisterForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setRegField = (key: RegField) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setReg(prev => ({ ...prev, [key]: e.target.value }));
    setErrors(prev => ({ ...prev, [key]: "" }));
  };

  const handleRegister = async () => {
    const errs: Record<string, string> = {};
    if (!reg.first.trim()) errs.first = "Vui lòng nhập họ";
    if (!reg.last.trim()) errs.last = "Vui lòng nhập tên";
    if (!reg.email.trim()) errs.email = "Vui lòng nhập email";
    else if (!emailRegex.test(reg.email)) errs.email = "Email không hợp lệ";
    if (!reg.pw) errs.pw = "Mật khẩu không được để trống";
    else if (reg.pw.length < 8) errs.pw = "Tối thiểu 8 ký tự";
    if (reg.pw !== reg.confirm) errs.confirm = "Mật khẩu không khớp";
    if (!reg.terms) errs.terms = "Bạn cần đồng ý điều khoản";

    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      setLoading(true);
      try {
        await authService.register(reg.first, reg.last, reg.email, reg.pw, reg.confirm);
        setReg(defaultRegisterForm);
        navigate("/login");
      } catch (error: any) {
        const message = error?.message || "";
        if (message.toLowerCase().includes("email already exists")) {
          setErrors({ email: "Email này đã được đăng ký!" });
        } else {
          setErrors({ email: message || "Đăng ký thất bại, vui lòng thử lại!" });
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex h-screen w-full">
      <LeftPanel />
      <div className="w-full lg:w-1/2 flex bg-white overflow-y-auto p-4 lg:p-8">
        <div className="m-auto w-full max-w-md py-8">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span style={{ fontSize: "1.125rem", fontWeight: 700, color: "#4338ca" }}>FEdu Learning</span>
          </div>

          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-1.5 mb-6"
            style={{ color: "#6b7280", background: "none", border: "none", cursor: "pointer", fontSize: "0.875rem" }}
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại đăng nhập
          </button>

          <h1 className="mb-2" style={{ color: "#111827" }}>Tạo tài khoản</h1>
          <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>Đăng ký miễn phí và bắt đầu học ngay hôm nay!</p>

          <form className="mt-8 space-y-5" onSubmit={(e) => { e.preventDefault(); handleRegister(); }}>

            {/* Họ & Tên */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="reg-first" style={{ color: "#374151", fontSize: "0.875rem" }}>Họ</label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9ca3af" }} />
                  <input
                    id="reg-first"
                    value={reg.first}
                    onChange={setRegField("first")}
                    type="text"
                    placeholder="Nguyễn"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border outline-none"
                    style={{ borderColor: "#e5e7eb", backgroundColor: "#f9fafb", fontSize: "0.9375rem" }}
                  />
                </div>
                {errors.first && <p style={{ color: "#ef4444", fontSize: "0.8125rem", marginTop: "0.25rem" }}>* {errors.first}</p>}
              </div>
              <div>
                <label htmlFor="reg-last" style={{ color: "#374151", fontSize: "0.875rem" }}>Tên</label>
                <div className="relative mt-1.5">
                  <input
                    id="reg-last"
                    value={reg.last}
                    onChange={setRegField("last")}
                    type="text"
                    placeholder="Văn A"
                    className="w-full px-4 py-3 rounded-xl border outline-none"
                    style={{ borderColor: "#e5e7eb", backgroundColor: "#f9fafb", fontSize: "0.9375rem" }}
                  />
                </div>
                {errors.last && <p style={{ color: "#ef4444", fontSize: "0.8125rem", marginTop: "0.25rem" }}>* {errors.last}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" style={{ color: "#374151", fontSize: "0.875rem" }}>Email</label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9ca3af" }} />
                <input
                  id="reg-email"
                  value={reg.email}
                  onChange={setRegField("email")}
                  type="email"
                  placeholder="example@email.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border outline-none"
                  style={{ borderColor: "#e5e7eb", backgroundColor: "#f9fafb", fontSize: "0.9375rem" }}
                />
              </div>
              {errors.email && <p style={{ color: "#ef4444", fontSize: "0.8125rem", marginTop: "0.25rem" }}>* {errors.email}</p>}
            </div>

            {/* Mật khẩu */}
            <div>
              <label htmlFor="reg-password" style={{ color: "#374151", fontSize: "0.875rem" }}>Mật khẩu</label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9ca3af" }} />
                <input
                  id="reg-password"
                  value={reg.pw}
                  onChange={setRegField("pw")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Tối thiểu 8 ký tự"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border outline-none"
                  style={{ borderColor: "#e5e7eb", backgroundColor: "#f9fafb", fontSize: "0.9375rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#9ca3af", background: "none", border: "none", cursor: "pointer" }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.pw && <p style={{ color: "#ef4444", fontSize: "0.8125rem", marginTop: "0.25rem" }}>* {errors.pw}</p>}
            </div>

            {/* Xác nhận mật khẩu */}
            <div>
              <label htmlFor="reg-confirm" style={{ color: "#374151", fontSize: "0.875rem" }}>Xác nhận mật khẩu</label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9ca3af" }} />
                <input
                  id="reg-confirm"
                  value={reg.confirm}
                  onChange={setRegField("confirm")}
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border outline-none"
                  style={{ borderColor: "#e5e7eb", backgroundColor: "#f9fafb", fontSize: "0.9375rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#9ca3af", background: "none", border: "none", cursor: "pointer" }}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirm && <p style={{ color: "#ef4444", fontSize: "0.8125rem", marginTop: "0.25rem" }}>* {errors.confirm}</p>}
            </div>

            <div className="flex items-start gap-2">
              <input
                id="terms"
                type="checkbox"
                checked={reg.terms}
                onChange={e => {
                  setReg(prev => ({ ...prev, terms: e.target.checked }));
                  setErrors(prev => ({ ...prev, terms: "" }));
                }}
              />
              <label htmlFor="terms" style={{ color: "#6b7280", fontSize: "0.875rem", fontWeight: 400, lineHeight: 1.5 }}>
                Tôi đồng ý với{" "}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#4338ca", textDecoration: "none" }}
                >
                  Điều khoản sử dụng
                </a>{" "}và{" "}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#4338ca", textDecoration: "none" }}
                >
                  Chính sách bảo mật
                </a>
              </label>
            </div>
            {errors.terms && <p style={{ color: "#ef4444", fontSize: "0.8125rem", marginTop: "0.25rem" }}>* {errors.terms}</p>}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Đang tạo..." : "Tạo tài khoản"}
            </button>

            {/* Divider */}
            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
              <span style={{ color: "#9ca3af", fontSize: "0.8125rem" }}>hoặc đăng ký với</span>
              <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
            </div>

            {/* Social */}
            <div className="grid grid-cols-2 gap-3">
              {[{ name: "Google", color: "#ea4335" }, { name: "Facebook", color: "#1877f2" }].map(({ name, color }) => (
                <button
                  key={name}
                  type="button"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl border transition-colors hover:bg-gray-50"
                  style={{ borderColor: "#e5e7eb", background: "white", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
                >
                  <span style={{ color, fontWeight: 700, fontSize: "0.875rem" }}>{name[0]}</span>
                  <span style={{ color: "#374151", fontSize: "0.875rem" }}>{name}</span>
                </button>
              ))}
            </div>
          </form>

          <p className="text-center mt-6" style={{ color: "#6b7280", fontSize: "0.875rem" }}>
            Đã có tài khoản?{" "}
            <button
              onClick={() => navigate("/login")}
              style={{ color: "#4338ca", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}
            >
              Đăng nhập
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}