import { useEffect, useState } from "react";
import { Eye, EyeOff, BookOpen, Lock, KeyRound } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { LeftPanel } from "../components/LeftPanel";

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

  fetch("http://localhost:8080/auth/reset-password", {
    headers: { "X-Secret-Key": token }
  })
    .then(res => setTokenValid(res.ok))
    .catch(() => setTokenValid(false));
}, [token]);

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/auth/change-password", {
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
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span style={{ fontSize: "1.125rem", fontWeight: 700, color: "#4338ca" }}>FEdu Learning</span>
          </div>

          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: "linear-gradient(135deg, #eef2ff, #ede9fe)" }}
          >
            <KeyRound className="w-7 h-7" style={{ color: "#4338ca" }} />
          </div>

          <h1 className="mb-2" style={{ color: "#111827" }}>Đặt lại mật khẩu</h1>
          <p style={{ color: "#6b7280", fontSize: "0.875rem", lineHeight: 1.6 }}>
            Tạo mật khẩu mới cho tài khoản của bạn. Mật khẩu phải có ít nhất 8 ký tự.
          </p>

          {!token && (
            <div
              className="mt-4 px-4 py-3 rounded-xl"
              style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}
            >
              <p style={{ color: "#dc2626", fontSize: "0.875rem" }}>
                Đường link không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu gửi lại email.
              </p>
            </div>
          )}

          <div className="mt-8 space-y-5">
            {/* Mật khẩu mới */}
            <div>
              <label style={{ color: "#374151", fontSize: "0.875rem" }}>Mật khẩu mới</label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9ca3af" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: "" })); }}
                  placeholder="Tối thiểu 8 ký tự"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border outline-none"
                  style={{
                    borderColor: errors.password ? "#ef4444" : "#e5e7eb",
                    backgroundColor: "#f9fafb",
                    fontSize: "0.9375rem",
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

            {/* Xác nhận mật khẩu */}
            <div>
              <label style={{ color: "#374151", fontSize: "0.875rem" }}>Xác nhận mật khẩu mới</label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9ca3af" }} />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setErrors(p => ({ ...p, confirm: "" })); }}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border outline-none"
                  style={{
                    borderColor: errors.confirm ? "#ef4444" : "#e5e7eb",
                    backgroundColor: "#f9fafb",
                    fontSize: "0.9375rem",
                  }}
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
              {errors.confirm && (
                <p style={{ color: "#ef4444", fontSize: "0.8125rem", marginTop: "0.25rem" }}>* {errors.confirm}</p>
              )}
            </div>

            {/* Gợi ý độ mạnh */}
            <div className="space-y-1.5">
              {hints.map(({ text, pass }) => (
                <div key={text} className="flex items-center gap-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: password.length > 0 ? (pass ? "#16a34a" : "#ef4444") : "#d1d5db" }}
                  />
                  <span style={{ fontSize: "0.8125rem", color: password.length > 0 ? (pass ? "#16a34a" : "#ef4444") : "#9ca3af" }}>
                    {text}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !token}
              className="w-full py-3 rounded-xl text-white transition-opacity hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #4338ca, #7c3aed)",
                border: "none",
                cursor: loading || !token ? "not-allowed" : "pointer",
                opacity: loading || !token ? 0.7 : 1,
              }}
            >
              {loading ? "Đang xử lý..." : "Xác nhận đổi mật khẩu"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}