import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, BookOpen, Mail, Lock } from "lucide-react";
import { LeftPanel } from "../components/LeftPanel";
import { emailRegex, Screen } from "../types";
import { authService } from "../../../services/auth.service";
import{ useAuth } from '../../../context/AuthContext';
import { getRedirectPathAfterLogin } from '../../../routes/redirectAfterLogin';
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [flashMessage, setFlashMessage] = useState<string>('');
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();

  useEffect(() => {
    const reason = searchParams.get("reason");
    if (reason === "expired") {
      setFlashMessage("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
    } else if (reason === "unauthorized") {
      setFlashMessage("Bạn cần đăng nhập để tiếp tục.");
    }
  }, [searchParams]);

  const handleLogin = async () => {
    const errs: Record<string, string> = {};

    if (!email.trim()) errs.email = "Email không được để trống!";
    else if (!emailRegex.test(email)) errs.email = "Email không hợp lệ!";
    if (!password.trim()) errs.password = "Mật khẩu không được để trống!";

    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const result = await authService.login(email, password);
      const user = await login(
        result.accessToken,
        result.refreshToken,
        rememberMe
      );
      const redirectPath = getRedirectPathAfterLogin(user, location);
      navigate(redirectPath);
    } catch (error: any) {
      const message = error.message || "";

      if (message.includes("not active")) {
        setErrors({ password: "Tài khoản đã bị khóa, vui lòng liên hệ admin!" });
      } else {
        setErrors({ password: "Email hoặc mật khẩu không đúng!" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full">
      <LeftPanel />
      <div className="w-full lg:w-1/2 flex bg-white overflow-y-auto p-4 lg:p-8">
        <div className="m-auto w-full max-w-md py-8">

          {flashMessage && (
            <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {flashMessage}
            </div>
          )}

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span style={{ fontSize: "1.125rem", fontWeight: 700, color: "#2B57E0 " }}>FEdu Learning</span>
          </div>

          <h1 className="mb-2" style={{ color: "#111827" }}>Chào mừng trở lại!</h1>
          <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
            Đăng nhập để tiếp tục hành trình học tập của bạn.
          </p>

          <form className="mt-8 space-y-5" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
            {/* Email */}
            <div>
              <label htmlFor="login-email" style={{ color: "#374151", fontSize: "0.875rem" }}>Email</label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9ca3af" }} />
                <input
                  id="login-email"
                  type="email"
                  placeholder="example@email.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border outline-none"
                  style={{ borderColor: "#e5e7eb", backgroundColor: "#f9fafb", fontSize: "0.9375rem" }}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors(prev => ({ ...prev, email: "" }));
                  }}
                />
              </div>
              {errors.email && (
                <p style={{ color: "#ef4444", fontSize: "0.8125rem", marginTop: "0.25rem" }}>* {errors.email}</p>
              )}
            </div>

            {/* Mật khẩu */}
            <div>
              <div className="flex justify-between items-center">
                <label htmlFor="login-password" style={{ color: "#374151", fontSize: "0.875rem" }}>Mật khẩu</label>
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  style={{ color: "#2B57E0 ", fontSize: "0.8125rem", background: "none", border: "none", cursor: "pointer" }}
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9ca3af" }} />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border outline-none"
                  style={{ borderColor: "#e5e7eb", backgroundColor: "#f9fafb", fontSize: "0.9375rem" }}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors(prev => ({ ...prev, password: "" }));
                  }}
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
              {errors.password && (
                <p style={{ color: "#ef4444", fontSize: "0.8125rem", marginTop: "0.25rem" }}>* {errors.password}</p>
              )}
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 rounded"
                style={{ accentColor: "#2B57E0 ", cursor: "pointer" }}
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember" style={{ color: "#6b7280", fontSize: "0.875rem", fontWeight: 400 }}>
                Ghi nhớ đăng nhập
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #2B57E0 , #2B57E0)", border: "none", cursor: loading ? "not-allowed" : "pointer" }}
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>

            {/* Divider */}
            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
              <span style={{ color: "#9ca3af", fontSize: "0.8125rem" }}>hoặc tiếp tục với</span>
              <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
            </div>

            {/* Social */}
            <div className="grid grid-cols-2 gap-3">
              {[{ name: "Google", color: "#ea4335" }, { name: "Facebook", color: "#1877f2" }].map(({ name, color }) => (
                <button
                  key={name}
                  type="button"
                  disabled={loading}
                  onClick={() => name === "Google" && navigate("/google-login")}
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
            Chưa có tài khoản?{" "}
            <button
              onClick={() => navigate("/register")}
              style={{ color: "#2B57E0 ", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}
            >
              Đăng ký ngay
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
