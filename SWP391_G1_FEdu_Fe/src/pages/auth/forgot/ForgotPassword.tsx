import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Mail, ArrowLeft } from "lucide-react";
import { LeftPanel } from "../components/LeftPanel";
import { emailRegex } from "../types";
import { authService } from "../../../services/auth.service";

export function ForgotPassword() {
  const navigate = useNavigate();
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgot = async () => {
    if (!forgotEmail.trim()) {
      setForgotError("Email không được để trống!");
      return;
    }
    if (!emailRegex.test(forgotEmail)) {
      setForgotError("Email không hợp lệ!");
      return;
    }

    setLoading(true);

    try {
      await authService.forgotPassword(forgotEmail);
      navigate("/forgot-success", { state: { email: forgotEmail } });
    } catch (error: any) {
      setForgotError(error.message || "Có lỗi xảy ra, vui lòng thử lại!");
    } finally {
      setLoading(false);
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

          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: "linear-gradient(135deg, #eef2ff, #ede9fe)" }}>
            <Mail className="w-7 h-7" style={{ color: "#4338ca" }} />
          </div>

          <h1 className="mb-2" style={{ color: "#111827" }}>Quên mật khẩu?</h1>
          <p style={{ color: "#6b7280", fontSize: "0.875rem", lineHeight: 1.6 }}>
            Nhập email đã đăng ký và chúng tôi sẽ gửi cho bạn đường dẫn để đặt lại mật khẩu.
          </p>

          <form className="mt-8 space-y-5" onSubmit={(e) => { e.preventDefault(); handleForgot(); }}>
            <div>
              <label htmlFor="forgot-email" style={{ color: "#374151", fontSize: "0.875rem" }}>
                Email đã đăng ký
              </label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9ca3af" }} />
                <input
                  id="forgot-email"
                  type="email"
                  placeholder="example@email.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border outline-none"
                  style={{ borderColor: "#e5e7eb", backgroundColor: "#f9fafb", fontSize: "0.9375rem" }}
                  value={forgotEmail}
                  onChange={(e) => { setForgotEmail(e.target.value); setForgotError(""); }}
                />
              </div>
              {forgotError && (
                <p style={{ color: "#ef4444", fontSize: "0.8125rem", marginTop: "0.25rem" }}>* {forgotError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)", border: "none", cursor: loading ? "not-allowed" : "pointer"}}
            >
              {loading ? "Đang gửi email..." : "Gửi đường dẫn đặt lại"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/login")}
              disabled={loading}
              className="w-full py-3 rounded-xl transition-colors hover:bg-gray-50"
              style={{ border: "1px solid #e5e7eb", background: "white", cursor: loading ? "not-allowed" : "pointer", color: "#374151" }}
            >
              Quay lại đăng nhập
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}