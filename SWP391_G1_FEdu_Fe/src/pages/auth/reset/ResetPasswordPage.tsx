import { useEffect, useState } from "react";
import { Eye, EyeOff, BookOpen, Lock, KeyRound } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { LeftPanel } from "../components/LeftPanel";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { API_BASE_URL } from "../../../services/api.client";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({ password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [tokentValid, setTokenValid] = useState<boolean | null>(null);

  const validate = () => {
    const errs = { password: "", confirm: "" };
    if (password.length < 8) errs.password = "Mật khẩu phải có ít nhất 8 ký tự";
    if (password !== confirmPassword) errs.confirm = "Mật khẩu xác nhận không khớp";
    setErrors(errs);
    return !errs.password && !errs.confirm;
  };

  useEffect(() => {
    if (!token) { setTokenValid(false); return; }

    fetch(`${API_BASE_URL}/auth/reset-password`, {
      headers: { "X-Secret-Key": token }
    })
      .then(res => setTokenValid(res.ok))
      .catch(() => setTokenValid(false));
  }, [token]);

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secretKey: token,
          password,
          confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.status !== 200) {
        throw new Error(data.message || "Đổi mật khẩu thất bại");
      }
      navigate("/reset-success");
    } catch (err: any) {
      setErrors(prev => ({ ...prev, password: err.message || "Có lỗi xảy ra" }));
    } finally {
      setLoading(false);
    }
  };

  const hints = [
    { text: "Ít nhất 8 ký tự", pass: password.length >= 8 },
    { text: "Có chữ hoa và chữ thường", pass: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { text: "Có ít nhất một số hoặc ký tự đặc biệt", pass: /[0-9!@#$%^&*]/.test(password) },
  ];

  return (
    <div className="flex h-screen w-full">
      <LeftPanel />
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background text-foreground">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">FEdu Learning</span>
          </div>

          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-accent text-accent-foreground">
            <KeyRound className="w-7 h-7" />
          </div>

          <h1 className="text-2xl font-bold mb-2">Đặt lại mật khẩu</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Tạo mật khẩu mới cho tài khoản của bạn. Mật khẩu phải có ít nhất 8 ký tự.
          </p>

          {!token && (
            <div className="mt-4 px-4 py-3 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-sm">
              Đường link không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu gửi lại email.
            </div>
          )}

          <div className="mt-8 space-y-5">
            {/* Mật khẩu mới */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Mật khẩu mới</label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: "" })); }}
                  placeholder="Tối thiểu 8 ký tự"
                  className={`pl-10 pr-11 w-full rounded-xl ${errors.password ? "border-destructive focus-visible:ring-destructive/20" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground border-none bg-transparent cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive mt-1">* {errors.password}</p>
              )}
            </div>

            {/* Xác nhận mật khẩu */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Xác nhận mật khẩu mới</label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setErrors(p => ({ ...p, confirm: "" })); }}
                  placeholder="Nhập lại mật khẩu mới"
                  className={`pl-10 pr-11 w-full rounded-xl ${errors.confirm ? "border-destructive focus-visible:ring-destructive/20" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground border-none bg-transparent cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirm && (
                <p className="text-xs text-destructive mt-1">* {errors.confirm}</p>
              )}
            </div>

            {/* Gợi ý độ mạnh */}
            <div className="space-y-1.5">
              {hints.map(({ text, pass }) => (
                <div key={text} className="flex items-center gap-2">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${password.length > 0 ? (pass ? "bg-emerald-600 dark:bg-emerald-400" : "bg-destructive") : "bg-muted-foreground/30"}`}
                  />
                  <span className={`text-xs ${password.length > 0 ? (pass ? "text-emerald-600 dark:text-emerald-400" : "text-destructive") : "text-muted-foreground"}`}>
                    {text}
                  </span>
                </div>
              ))}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading || !token}
              className="w-full py-3 h-auto rounded-xl"
            >
              {loading ? "Đang xử lý..." : "Xác nhận đổi mật khẩu"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}