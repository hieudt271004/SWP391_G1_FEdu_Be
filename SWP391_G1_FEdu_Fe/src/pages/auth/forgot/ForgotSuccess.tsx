import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { LeftPanel } from "../components/LeftPanel";
import { Button } from "../../../components/ui/button";

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
      <div className="w-full lg:w-1/2 flex bg-background text-foreground overflow-y-auto p-4 lg:p-8">
        <div className="m-auto w-full max-w-md text-center py-8">

          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center bg-accent text-accent-foreground">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-3">Email đã được gửi!</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Chúng tôi đã gửi đường dẫn đặt lại mật khẩu đến email <strong>{userEmail}</strong>.
            Vui lòng kiểm tra hộp thư (kể cả thư mục Spam).
          </p>

          <div className="mt-4 px-4 py-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm">
            Đường dẫn sẽ hết hạn sau <strong>15 phút</strong>
          </div>

          <div className="mt-8 space-y-3">
            <Button
              onClick={handleOpenEmail}
              className="w-full py-3 h-auto rounded-xl"
            >
              Mở ứng dụng Email
            </Button>

            <Button
              onClick={() => navigate("/forgot-password")}
              variant="outline"
              className="w-full py-3 h-auto rounded-xl"
            >
              Gửi lại email
            </Button>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            Nhớ mật khẩu rồi?{" "}
            <Button
              variant="link"
              onClick={() => navigate("/login")}
              className="p-0 h-auto font-semibold text-primary hover:no-underline align-baseline"
            >
              Đăng nhập
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}