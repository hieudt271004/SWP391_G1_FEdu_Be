import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, BookOpen, Mail, Lock, User, ArrowLeft } from "lucide-react";
import { LeftPanel } from "../components/LeftPanel";
import logo from "../../../assets/logo.png";
import { emailRegex, RegField, defaultRegisterForm } from "../types";
import { authService } from "../../../services/auth.service";

export function RegisterPage() {
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
    <div className="flex h-screen w-full font-sans bg-[#030213]">
      <LeftPanel />
      <div className="w-full lg:w-1/2 flex bg-[#030213] text-white overflow-y-auto p-4 lg:p-8 relative">
        {/* Glow backdrop */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
        
        <div className="m-auto w-full max-w-md py-8 relative">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-md shadow-blue-500/10">
              <BookOpen className="w-4.5 h-4.5" />
            </div>
            <span className="text-base font-extrabold text-white tracking-tight">
              FE<span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent font-medium">du</span>
            </span>
          </div>

          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-1.5 mb-6 text-slate-400 hover:text-white text-xs font-semibold bg-transparent border-none cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại đăng nhập
          </button>

          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Tạo tài khoản</h1>
          <p className="text-xs text-slate-400">Đăng ký miễn phí và bắt đầu học ngay hôm nay!</p>

          <form className="mt-8 space-y-5" onSubmit={(e) => { e.preventDefault(); handleRegister(); }}>

            {/* Họ & Tên */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="reg-first" className="text-xs font-semibold text-slate-300">Họ</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="reg-first"
                    value={reg.first}
                    onChange={setRegField("first")}
                    type="text"
                    placeholder="Nguyễn"
                    className="w-full pl-10 pr-4 py-3 text-xs rounded-md border border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 transition-all duration-200"
                  />
                </div>
                {errors.first && <p className="text-[11px] text-rose-400 mt-1">* {errors.first}</p>}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="reg-last" className="text-xs font-semibold text-slate-300">Tên</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="reg-last"
                    value={reg.last}
                    onChange={setRegField("last")}
                    type="text"
                    placeholder="Văn A"
                    className="w-full pl-10 pr-4 py-3 text-xs rounded-md border border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 transition-all duration-200"
                  />
                </div>
                {errors.last && <p className="text-[11px] text-rose-400 mt-1">* {errors.last}</p>}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="reg-email" className="text-xs font-semibold text-slate-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="reg-email"
                  value={reg.email}
                  onChange={setRegField("email")}
                  type="email"
                  placeholder="example@email.com"
                  className="w-full pl-10 pr-4 py-3 text-xs rounded-md border border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 transition-all duration-200"
                />
              </div>
              {errors.email && <p className="text-[11px] text-rose-400 mt-1">* {errors.email}</p>}
            </div>

            {/* Mật khẩu */}
            <div className="space-y-1.5">
              <label htmlFor="reg-password" className="text-xs font-semibold text-slate-300">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="reg-password"
                  value={reg.pw}
                  onChange={setRegField("pw")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Tối thiểu 8 ký tự"
                  className="w-full pl-10 pr-11 py-3 text-xs rounded-md border border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 bg-transparent border-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.pw && <p className="text-[11px] text-rose-400 mt-1">* {errors.pw}</p>}
            </div>

            {/* Xác nhận mật khẩu */}
            <div className="space-y-1.5">
              <label htmlFor="reg-confirm" className="text-xs font-semibold text-slate-300">Xác nhận mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="reg-confirm"
                  value={reg.confirm}
                  onChange={setRegField("confirm")}
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu"
                  className="w-full pl-10 pr-11 py-3 text-xs rounded-md border border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 bg-transparent border-none cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirm && <p className="text-[11px] text-rose-400 mt-1">* {errors.confirm}</p>}
            </div>

            <div className="flex items-start gap-2">
              <input
                id="terms"
                type="checkbox"
                className="w-4 h-4 mt-0.5 rounded border-white/10 bg-white/5 checked:bg-blue-600 cursor-pointer accent-blue-600 shrink-0"
                checked={reg.terms}
                onChange={e => {
                  setReg(prev => ({ ...prev, terms: e.target.checked }));
                  setErrors(prev => ({ ...prev, terms: "" }));
                }}
              />
              <label htmlFor="terms" className="text-slate-400 text-xs leading-relaxed select-none cursor-pointer">
                Tôi đồng ý với{" "}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:underline font-semibold"
                >
                  Điều khoản sử dụng
                </a>{" "}và{" "}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:underline font-semibold"
                >
                  Chính sách bảo mật
                </a>
              </label>
            </div>
            {errors.terms && <p className="text-[11px] text-rose-400 mt-1">* {errors.terms}</p>}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-md bg-white hover:bg-slate-100 disabled:bg-white/50 text-[#030213] text-xs font-semibold cursor-pointer transition-all duration-200"
            >
              {loading ? "Đang tạo..." : "Tạo tài khoản"}
            </button>

            {/* Divider */}
            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-slate-500 text-[11px]">hoặc đăng ký với</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Social */}
            <div className="grid grid-cols-2 gap-3">
              {[{ name: "Google", color: "#ea4335" }, { name: "Facebook", color: "#1877f2" }].map(({ name, color }) => (
                <button
                  key={name}
                  type="button"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span style={{ color }} className="font-extrabold text-sm">{name[0]}</span>
                  <span className="text-slate-300 text-xs font-semibold">{name}</span>
                </button>
              ))}
            </div>
          </form>

          <p className="text-center mt-6 text-slate-400 text-xs">
            Đã có tài khoản?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-white hover:underline font-semibold bg-transparent border-none cursor-pointer"
            >
              Đăng nhập
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}