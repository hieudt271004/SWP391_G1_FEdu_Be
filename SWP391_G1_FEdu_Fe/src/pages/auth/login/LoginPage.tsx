import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, BookOpen, Mail, Lock } from "lucide-react";
import { LeftPanel } from "../components/LeftPanel";
import logo from "../../../assets/logo.png";
import { emailRegex, Screen } from "../types";
import { authService } from "../../../services/auth.service";
import { useAuth } from '../../../context/AuthContext';
import { getRedirectPathAfterLogin } from '../../../routes/redirectAfterLogin';
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
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
      if (!isMountedRef.current) return;
      const user = await login(
        result.accessToken,
        result.refreshToken,
        rememberMe
      );
      if (!isMountedRef.current) return;
      const redirectPath = getRedirectPathAfterLogin(user, location);
      navigate(redirectPath);
    } catch (error: any) {
      if (!isMountedRef.current) return;
      const message = error.message || "";

      if (message.includes("not active")) {
        setErrors({ password: "Tài khoản đã bị khóa, vui lòng liên hệ admin!" });
      } else {
        setErrors({ password: "Email hoặc mật khẩu không đúng!" });
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex h-screen w-full font-sans bg-[#030213]">
      <LeftPanel />
      <div className="w-full lg:w-1/2 flex bg-[#030213] text-white overflow-y-auto p-4 lg:p-8 relative">
        {/* Glow backdrop */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
        
        <div className="m-auto w-full max-w-md py-8 relative">

          {flashMessage && (
            <div className="mb-6 rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
              {flashMessage}
            </div>
          )}

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-md shadow-blue-500/10">
              <BookOpen className="w-4.5 h-4.5" />
            </div>
            <span className="text-base font-extrabold text-white tracking-tight">
              FE<span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent font-medium">du</span>
            </span>
          </div>

          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Chào mừng trở lại!</h1>
          <p className="text-xs text-slate-400">
            Đăng nhập để tiếp tục hành trình học tập của bạn.
          </p>

          <form className="mt-8 space-y-5" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="text-xs font-semibold text-slate-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="login-email"
                  type="email"
                  placeholder="example@email.com"
                  className="w-full pl-10 pr-4 py-3 text-xs rounded-md border border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 transition-all duration-200"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors(prev => ({ ...prev, email: "" }));
                  }}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-rose-400 mt-1">* {errors.email}</p>
              )}
            </div>

            {/* Mật khẩu */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="login-password" className="text-xs font-semibold text-slate-300">Mật khẩu</label>
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-blue-400 hover:text-blue-300 text-[11px] font-semibold bg-transparent border-none cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 text-xs rounded-md border border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 transition-all duration-200"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors(prev => ({ ...prev, password: "" }));
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 bg-transparent border-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-400 mt-1">* {errors.password}</p>
              )}
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 rounded border-white/10 bg-white/5 checked:bg-blue-600 cursor-pointer accent-blue-600"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember" className="text-slate-400 text-xs select-none cursor-pointer">
                Ghi nhớ đăng nhập
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-md bg-white hover:bg-slate-100 disabled:bg-white/50 text-[#030213] text-xs font-semibold cursor-pointer transition-all duration-200"
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>

            {/* Divider */}
            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-slate-500 text-[11px]">hoặc tiếp tục với</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Social */}
            <div className="grid grid-cols-2 gap-3">
              {[{ name: "Google", color: "#ea4335" }, { name: "Facebook", color: "#1877f2" }].map(({ name, color }) => (
                <button
                  key={name}
                  type="button"
                  disabled={loading}
                  onClick={() => name === "Google" && navigate("/google-login")}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span style={{ color }} className="font-extrabold text-sm">{name[0]}</span>
                  <span className="text-slate-300 text-xs font-semibold">{name}</span>
                </button>
              ))}
            </div>
          </form>

          <p className="text-center mt-6 text-slate-400 text-xs">
            Chưa có tài khoản?{" "}
            <button
              onClick={() => navigate("/register")}
              className="text-white hover:underline font-semibold bg-transparent border-none cursor-pointer"
            >
              Đăng ký ngay
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
