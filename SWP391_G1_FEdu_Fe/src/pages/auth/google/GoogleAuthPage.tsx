import { useState } from "react";
import { Loader, CheckCircle, XCircle } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { LeftPanel } from "../components/LeftPanel";
import { authService } from "../../../services/auth.service";
import { useNavigate, useLocation } from "react-router-dom";
import {useAuth} from "../../../context/AuthContext";
import { getRedirectPathAfterLogin } from '../../../routes/redirectAfterLogin';

type Step = "idle" | "verifying" | "success" | "error";

export function GoogleAuthPage() {
  const [step, setStep] = useState<Step>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setStep("verifying");
      try {
        const data = await authService.googleLogin(tokenResponse.access_token);
        const user = await login(data.accessToken, data.refreshToken, true);
        setStep("success");
        const redirectPath = getRedirectPathAfterLogin(user, location);
        setTimeout(() => {
          navigate(redirectPath);
        }, 1500);
      } catch (err: any) {
        setErrorMessage(err.message || "Có lỗi xảy ra, vui lòng thử lại");
        setStep("error");
      }
    },
    onError: () => {
      setErrorMessage("Không thể kết nối với Google, vui lòng thử lại");
      setStep("error");
    },
  });

  return (
    <div className="flex h-screen w-full">
      <LeftPanel />
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md text-center">

          {step === "idle" && (
            <>
              <div className="flex justify-center mb-6">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #fef2f2, #fff7ed)" }}
                >
                  <span style={{ fontSize: "2.5rem" }}>G</span>
                </div>
              </div>
              <h1 className="mb-3" style={{ color: "#111827" }}>Đăng nhập với Google</h1>
              <p style={{ color: "#6b7280", fontSize: "0.9375rem", lineHeight: 1.6 }}>
                Nhấn nút bên dưới để mở cửa sổ chọn tài khoản Google của bạn.
              </p>
              <button
                onClick={() => googleLogin()}
                className="mt-8 w-full py-3 rounded-xl text-white transition-opacity hover:opacity-90 flex items-center justify-center gap-3"
                style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)", border: "none", cursor: "pointer" }}
              >
                <span style={{ fontWeight: 700, fontSize: "1rem" }}>G</span>
                Tiếp tục với Google
              </button>
              <button
                onClick={() => navigate(-1)}
                className="mt-3 w-full py-3 rounded-xl transition-colors hover:bg-gray-50"
                style={{ border: "1px solid #e5e7eb", background: "white", cursor: "pointer", color: "#374151" }}
              >
                Huỷ
              </button>
            </>
          )}

          {step === "verifying" && (
            <>
              <div className="flex justify-center mb-6">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #fef2f2, #fff7ed)" }}
                >
                  <span style={{ fontSize: "2.5rem" }}>G</span>
                </div>
              </div>
              <h1 className="mb-3" style={{ color: "#111827" }}>Đang xác thực</h1>
              <p style={{ color: "#6b7280", fontSize: "0.9375rem", lineHeight: 1.6 }}>
                Đang kiểm tra tài khoản Google của bạn với máy chủ...
              </p>
              <div className="flex justify-center mt-8">
                <Loader className="w-8 h-8 animate-spin" style={{ color: "#4338ca" }} />
              </div>
              <div
                className="mt-6 px-4 py-3 rounded-xl"
                style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb" }}
              >
                <p style={{ color: "#6b7280", fontSize: "0.8125rem" }}>Vui lòng không đóng trang này</p>
              </div>
            </>
          )}

          {step === "success" && (
            <>
              <div className="flex justify-center mb-6">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)" }}
                >
                  <CheckCircle className="w-10 h-10" style={{ color: "#16a34a" }} />
                </div>
              </div>
              <h1 className="mb-3" style={{ color: "#111827" }}>Xác thực thành công!</h1>
              <p style={{ color: "#6b7280", fontSize: "0.9375rem", lineHeight: 1.6 }}>
                Tài khoản Google của bạn đã được kết nối. Đang chuyển hướng vào ứng dụng...
              </p>
              <div className="flex justify-center mt-6">
                <Loader className="w-6 h-6 animate-spin" style={{ color: "#16a34a" }} />
              </div>
            </>
          )}

          {step === "error" && (
            <>
              <div className="flex justify-center mb-6">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #fef2f2, #fee2e2)" }}
                >
                  <XCircle className="w-10 h-10" style={{ color: "#dc2626" }} />
                </div>
              </div>
              <h1 className="mb-3" style={{ color: "#111827" }}>Xác thực thất bại</h1>
              <p style={{ color: "#6b7280", fontSize: "0.9375rem", lineHeight: 1.6 }}>
                {errorMessage}
              </p>
              <button
                onClick={() => { setStep("idle"); setErrorMessage(""); }}
                className="mt-8 w-full py-3 rounded-xl text-white transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)", border: "none", cursor: "pointer" }}
              >
                Thử lại
              </button>
              <button
                onClick={() => navigate(-1)}
                className="mt-3 w-full py-3 rounded-xl transition-colors hover:bg-gray-50"
                style={{ border: "1px solid #e5e7eb", background: "white", cursor: "pointer", color: "#374151" }}
              >
                Quay lại
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}