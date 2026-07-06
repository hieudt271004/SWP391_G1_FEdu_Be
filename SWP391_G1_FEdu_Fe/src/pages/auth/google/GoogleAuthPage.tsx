import { useState } from "react";
import { Loader, CheckCircle, XCircle } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { LeftPanel } from "../components/LeftPanel";
import { authService } from "../../../services/auth.service";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { getRedirectPathAfterLogin } from '../../../routes/redirectAfterLogin';
import { Button } from "../../../components/ui/button";

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
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background text-foreground">
        <div className="w-full max-w-md text-center">

          {step === "idle" && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full flex items-center justify-center bg-accent text-accent-foreground">
                  <span className="text-3xl font-bold">G</span>
                </div>
              </div>
              <h1 className="text-2xl font-bold mb-3">Đăng nhập với Google</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Nhấn nút bên dưới để mở cửa sổ chọn tài khoản Google của bạn.
              </p>
              <Button
                onClick={() => googleLogin()}
                className="mt-8 w-full py-3 h-auto rounded-xl gap-3 text-base"
              >
                <span className="font-bold text-lg">G</span>
                Tiếp tục với Google
              </Button>
              <Button
                onClick={() => navigate(-1)}
                variant="outline"
                className="mt-3 w-full py-3 h-auto rounded-xl"
              >
                Hủy
              </Button>
            </>
          )}

          {step === "verifying" && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full flex items-center justify-center bg-accent text-accent-foreground">
                  <span className="text-3xl font-bold">G</span>
                </div>
              </div>
              <h1 className="text-2xl font-bold mb-3">Đăng học</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Đang kiểm tra tài khoản Google của bạn với máy chủ...
              </p>
              <div className="flex justify-center mt-8">
                <Loader className="w-8 h-8 animate-spin text-primary" />
              </div>
              <div className="mt-6 px-4 py-3 rounded-xl border border-border bg-accent/20 text-muted-foreground text-xs">
                Vui lòng không đóng trang này
              </div>
            </>
          )}

          {step === "success" && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full flex items-center justify-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-10 h-10" />
                </div>
              </div>
              <h1 className="text-2xl font-bold mb-3">Xác thực thành công!</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Tài khoản Google của bạn đã được kết nối. Đang chuyển hướng vào ứng dụng...
              </p>
              <div className="flex justify-center mt-6">
                <Loader className="w-6 h-6 animate-spin text-emerald-600 dark:text-emerald-400" />
              </div>
            </>
          )}

          {step === "error" && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full flex items-center justify-center bg-destructive/10 text-destructive">
                  <XCircle className="w-10 h-10" />
                </div>
              </div>
              <h1 className="text-2xl font-bold mb-3">Xác thực thất bại</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {errorMessage}
              </p>
              <Button
                onClick={() => { setStep("idle"); setErrorMessage(""); }}
                className="mt-8 w-full py-3 h-auto rounded-xl"
              >
                Thử lại
              </Button>
              <Button
                onClick={() => navigate(-1)}
                variant="outline"
                className="mt-3 w-full py-3 h-auto rounded-xl"
              >
                Quay lại
              </Button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}