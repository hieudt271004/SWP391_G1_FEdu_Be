import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Eye, EyeOff, BookOpen, Mail, Lock, Sun, Moon } from "lucide-react";
import { useTheme } from "../../../context/ThemeContext";
import { LeftPanel } from "../components/LeftPanel";
import { emailRegex } from "../types";
import { authService } from "../../../services/auth.service";
import { useAuth } from '../../../context/AuthContext';
import { getRedirectPathAfterLogin } from '../../../routes/redirectAfterLogin';
import { useSearchParams } from "react-router-dom";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";

export function LoginPage() {
  const { theme, toggleTheme } = useTheme();
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
    <div className="flex h-screen w-full font-sans bg-background text-foreground">
      <LeftPanel />
      <div className="w-full lg:w-1/2 flex bg-background text-foreground overflow-y-auto p-4 lg:p-8 relative">
        {/* Theme Toggle Button */}
        <div className="absolute top-6 right-6 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>

        {/* Glow backdrop */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        
        <div className="m-auto w-full max-w-md py-8 relative">

          {flashMessage && (
            <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-xs text-destructive">
              {flashMessage}
            </div>
          )}

          {/* Mobile logo */}
          <Link to="/" className="lg:hidden flex items-center gap-2.5 mb-8 w-fit hover:opacity-90 transition-opacity">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary text-primary-foreground shadow-sm">
              <BookOpen className="w-4.5 h-4.5" />
            </div>
            <span className="text-base font-extrabold text-foreground tracking-tight">
              FEdu
            </span>
          </Link>

          <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">Chào mừng trở lại!</h1>
          <p className="text-xs text-muted-foreground">
            Đăng nhập để tiếp tục hành trình học tập của bạn.
          </p>

          <form className="mt-8 space-y-5" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="text-xs font-semibold text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="example@email.com"
                  className="pl-10 rounded-xl"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors(prev => ({ ...prev, email: "" }));
                  }}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-destructive mt-1">* {errors.email}</p>
              )}
            </div>

            {/* Mật khẩu */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="login-password" className="text-xs font-semibold text-foreground">Mật khẩu</label>
                <Button
                  type="button"
                  variant="link"
                  onClick={() => navigate("/forgot-password")}
                  className="text-primary hover:underline text-[11px] font-semibold p-0 h-auto"
                >
                  Quên mật khẩu?
                </Button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-11 rounded-xl"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors(prev => ({ ...prev, password: "" }));
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-destructive mt-1">* {errors.password}</p>
              )}
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 rounded border-border bg-card text-primary focus:ring-ring cursor-pointer accent-primary"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember" className="text-muted-foreground text-xs select-none cursor-pointer">
                Ghi nhớ đăng nhập
              </label>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3 h-auto rounded-xl font-bold"
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>

            {/* Divider */}
            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-muted-foreground text-[11px]">hoặc tiếp tục với</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Social */}
            <div className="grid grid-cols-2 gap-3">
              {[{ name: "Google", color: "#ea4335" }, { name: "Facebook", color: "#1877f2" }].map(({ name, color }) => (
                <Button
                  key={name}
                  type="button"
                  variant="outline"
                  disabled={loading}
                  onClick={() => name === "Google" && navigate("/google-login")}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border bg-card hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span style={{ color }} className="font-extrabold text-sm">{name[0]}</span>
                  <span className="text-foreground text-xs font-semibold">{name}</span>
                </Button>
              ))}
            </div>
          </form>

          <p className="text-center mt-6 text-muted-foreground text-xs">
            Chưa có tài khoản?{" "}
            <Button
              variant="link"
              onClick={() => navigate("/register")}
              className="text-foreground hover:underline font-semibold p-0 h-auto"
            >
              Đăng ký ngay
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}
