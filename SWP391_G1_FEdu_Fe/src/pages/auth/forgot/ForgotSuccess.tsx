import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { LeftPanel } from "../components/LeftPanel";


export function ForgotSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const userEmail = (location.state as {email?: string } | null)?.email || "";

  if(!userEmail) {
    return <Navigate to="/forgot-password" replace />;
  }
  const handleOpenEmail = () => {
    let mailUrl = "https://mail.google.com/";
    const emailLower = userEmail.toLowerCase();

    if (emailLower.includes("@yahoo.com")) {
      mailUrl = "https://mail.yahoo.com/";
    } else if (emailLower.includes("@outlook.com") || emailLower.includes("@hotmail.com")) {
      mailUrl = "https://outlook.live.com/";
    }

    window.open(mailUrl, "_blank");
  };

  return (
    <div className="flex h-screen w-full">
      <LeftPanel />
      <div className="w-full lg:w-1/2 flex bg-white overflow-y-auto p-4 lg:p-8">
        <div className="m-auto w-full max-w-md text-center py-8">

          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #eef2ff, #ede9fe)" }}>
              <CheckCircle className="w-10 h-10" style={{ color: "#4338ca" }} />
            </div>
          </div>

          <h1 className="mb-3" style={{ color: "#111827" }}>Email đã được gửi!</h1>
          <p style={{ color: "#6b7280", fontSize: "0.9375rem", lineHeight: 1.6 }}>
            Chúng tôi đã gửi đường dẫn đặt lại mật khẩu đến email <strong>{userEmail}</strong>.
            Vui lòng kiểm tra hộp thư (kể cả thư mục Spam).
          </p>

          <div className="mt-4 px-4 py-3 rounded-xl"
            style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <p style={{ color: "#15803d", fontSize: "0.875rem" }}>
              Đường dẫn sẽ hết hạn sau <strong>15 phút</strong>
            </p>
          </div>

          <div className="mt-8 space-y-3">
            <button
              onClick={handleOpenEmail}
              className="w-full py-3 rounded-xl text-white transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)", border: "none", cursor: "pointer" }}
            >
              Mở ứng dụng Email
            </button>

            <button
              onClick={() => navigate("/forgot-password")}
              className="w-full py-3 rounded-xl transition-colors hover:bg-gray-50"
              style={{ border: "1px solid #e5e7eb", background: "white", cursor: "pointer", color: "#374151" }}
            >
              Gửi lại email
            </button>
          </div>

          <p className="mt-6" style={{ color: "#9ca3af", fontSize: "0.875rem" }}>
            Nhớ mật khẩu rồi?{" "}
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