import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, BookOpen, Mail, Lock, User, ArrowLeft, Sun, Moon } from "lucide-react";
import { useTheme } from "../../../context/ThemeContext";
import { LeftPanel } from "../components/LeftPanel";
import { emailRegex, RegField, defaultRegisterForm } from "../types";
import { authService } from "../../../services/auth.service";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";

export function RegisterPage() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reg, setReg] = useState(defaultRegisterForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
        if (!isMountedRef.current) return;
        setReg(defaultRegisterForm);
        navigate("/login");
      } catch (error: any) {
        if (!isMountedRef.current) return;
        const message = error?.message || "";
        if (message.toLowerCase().includes("email already exists")) {
          setErrors({ email: "Email này đã được đăng ký!" });
        } else {
          setErrors({ email: message || "Đăng ký thất bại, vui lòng thử lại!" });
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    }
  };

  return (
    <div className="flex h-screen w-full font-sans bg-background text-foreground">
      <LeftPanel />
      <div className="w-full lg:w-1/2 flex bg-background text-foreground overflow-y-auto p-4 lg:p-8 relative">
        {}
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

        {}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        
        <div className="m-auto w-full max-w-md py-8 relative">

          {}
          <Link to="/" className="lg:hidden flex items-center gap-2.5 mb-8 w-fit hover:opacity-90 transition-opacity">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary text-primary-foreground shadow-sm">
              <BookOpen className="w-4.5 h-4.5" />
            </div>
            <span className="text-base font-extrabold text-foreground tracking-tight">
              FEdu
            </span>
          </Link>

          <Button
            variant="ghost"
            onClick={() => navigate("/login")}
            className="flex items-center gap-1.5 mb-6 text-muted-foreground hover:text-foreground text-xs font-semibold p-0 h-auto hover:bg-transparent"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại đăng nhập
          </Button>

          <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">Tạo tài khoản</h1>
          <p className="text-xs text-muted-foreground">Đăng ký miễn phí và bắt đầu học ngay hôm nay!</p>

          <form className="mt-8 space-y-5" onSubmit={(e) => { e.preventDefault(); handleRegister(); }}>

            {}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="reg-first" className="text-xs font-semibold text-foreground">Họ</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="reg-first"
                    value={reg.first}
                    onChange={setRegField("first")}
                    type="text"
                    placeholder="Nguyễn"
                    className="pl-10 rounded-xl"
                  />
                </div>
                {errors.first && <p className="text-[11px] text-destructive mt-1">* {errors.first}</p>}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="reg-last" className="text-xs font-semibold text-foreground">Tên</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="reg-last"
                    value={reg.last}
                    onChange={setRegField("last")}
                    type="text"
                    placeholder="Văn A"
                    className="pl-10 rounded-xl"
                  />
                </div>
                {errors.last && <p className="text-[11px] text-destructive mt-1">* {errors.last}</p>}
              </div>
            </div>

            {}
            <div className="space-y-1.5">
              <label htmlFor="reg-email" className="text-xs font-semibold text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="reg-email"
                  value={reg.email}
                  onChange={setRegField("email")}
                  type="email"
                  placeholder="example@email.com"
                  className="pl-10 rounded-xl"
                />
              </div>
              {errors.email && <p className="text-[11px] text-destructive mt-1">* {errors.email}</p>}
            </div>

            {}
            <div className="space-y-1.5">
              <label htmlFor="reg-password" className="text-xs font-semibold text-foreground">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="reg-password"
                  value={reg.pw}
                  onChange={setRegField("pw")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Tối thiểu 8 ký tự"
                  className="pl-10 pr-11 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.pw && <p className="text-[11px] text-destructive mt-1">* {errors.pw}</p>}
            </div>

            {}
            <div className="space-y-1.5">
              <label htmlFor="reg-confirm" className="text-xs font-semibold text-foreground">Xác nhận mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="reg-confirm"
                  value={reg.confirm}
                  onChange={setRegField("confirm")}
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu"
                  className="pl-10 pr-11 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirm && <p className="text-[11px] text-destructive mt-1">* {errors.confirm}</p>}
            </div>

            <div className="flex items-start gap-2">
              <input
                id="terms"
                type="checkbox"
                className="w-4 h-4 mt-0.5 rounded border-border bg-card text-primary focus:ring-ring cursor-pointer accent-primary shrink-0"
                checked={reg.terms}
                onChange={e => {
                  setReg(prev => ({ ...prev, terms: e.target.checked }));
                  setErrors(prev => ({ ...prev, terms: "" }));
                }}
              />
              <label htmlFor="terms" className="text-muted-foreground text-xs leading-relaxed select-none cursor-pointer">
                Tôi đồng ý với{" "}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground font-semibold hover:underline"
                >
                  Điều khoản sử dụng
                </a>{" "}và{" "}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground font-semibold hover:underline"
                >
                  Chính sách bảo mật
                </a>
              </label>
            </div>
            {errors.terms && <p className="text-[11px] text-destructive mt-1">* {errors.terms}</p>}

            {}
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3 h-auto rounded-xl font-bold"
            >
              {loading ? "Đang tạo..." : "Tạo tài khoản"}
            </Button>

            {}
            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-muted-foreground text-[11px]">hoặc đăng ký với</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {}
            <div className="grid grid-cols-2 gap-3">
              {[{ name: "Google", color: "#ea4335" }, { name: "Facebook", color: "#1877f2" }].map(({ name, color }) => (
                <Button
                  key={name}
                  type="button"
                  variant="outline"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border bg-card hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span style={{ color }} className="font-extrabold text-sm">{name[0]}</span>
                  <span className="text-foreground text-xs font-semibold">{name}</span>
                </Button>
              ))}
            </div>
          </form>

          <p className="text-center mt-6 text-muted-foreground text-xs">
            Đã có tài khoản?{" "}
            <Button
              variant="link"
              onClick={() => navigate("/login")}
              className="text-foreground hover:underline font-semibold p-0 h-auto"
            >
              Đăng nhập
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}