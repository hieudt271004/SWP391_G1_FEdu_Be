import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { LeftPanel } from "../components/LeftPanel";
import { Button } from "../../../components/ui/button";

export function ResetSuccessPage() {
  const navigate = useNavigate();
  return (
    <div className="flex h-screen w-full">
      <LeftPanel />
      <div className="w-full lg:w-1/2 flex bg-background text-foreground overflow-y-auto p-4 lg:p-8">
        <div className="m-auto w-full max-w-md text-center py-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-10 h-10" />
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-3">Đổi mật khẩu thành công!</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Mật khẩu của bạn đã được cập nhật. Vui lòng đăng nhập lại bằng mật khẩu mới.
          </p>

          <div className="mt-4 px-4 py-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm">
            Bảo mật tài khoản: không chia sẻ mật khẩu với bất kỳ ai.
          </div>

          <div className="mt-8">
            <Button
              onClick={() => navigate("/login")}
              className="w-full py-3 h-auto rounded-xl"
            >
              Đăng nhập ngay
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}