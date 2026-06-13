import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { LeftPanel } from "../components/LeftPanel";

export function ResetSuccessPage() {
  const navigate = useNavigate();
  return (
    <div className="flex h-screen w-full">
      <LeftPanel />
      <div className="w-full lg:w-1/2 flex bg-white overflow-y-auto p-4 lg:p-8">
        <div className="m-auto w-full max-w-md text-center py-8">
          <div className="flex justify-center mb-6">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)" }}
            >
              <CheckCircle className="w-10 h-10" style={{ color: "#16a34a" }} />
            </div>
          </div>

          <h1 className="mb-3" style={{ color: "#111827" }}>Đổi mật khẩu thành công!</h1>
          <p style={{ color: "#6b7280", fontSize: "0.9375rem", lineHeight: 1.6 }}>
            Mật khẩu của bạn đã được cập nhật. Vui lòng đăng nhập lại bằng mật khẩu mới.
          </p>

          <div
            className="mt-4 px-4 py-3 rounded-xl"
            style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}
          >
            <p style={{ color: "#15803d", fontSize: "0.875rem" }}>
              Bảo mật tài khoản: không chia sẻ mật khẩu với bất kỳ ai.
            </p>
          </div>

          <div className="mt-8">
            <button
              onClick={() => navigate("/login")}
              className="w-full py-3 rounded-xl text-white transition-opacity hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #4338ca, #7c3aed)",
                border: "none",
                cursor: "pointer",
              }}
            >
              Đăng nhập ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}