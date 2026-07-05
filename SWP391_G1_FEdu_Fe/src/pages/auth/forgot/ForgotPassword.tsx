import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import { LeftPanel } from "../components/LeftPanel";
import logo from "../../../assets/logo.png";
import { emailRegex } from "../types";
import { authService } from "../../../services/auth.service";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";

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
      <div className="w-full lg:w-1/2 flex bg-background text-foreground overflow-y-auto p-4 lg:p-8">
        <div className="m-auto w-full max-w-md py-8">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <img src={logo} alt="FEdu Logo" className="w-8 h-8 rounded-lg object-cover" />
            <span className="text-lg font-bold text-foreground">FEdu Learning</span>
          </div>

          <Button
            variant="ghost"
            onClick={() => navigate("/login")}
            className="flex items-center gap-1.5 mb-6 text-sm text-muted-foreground p-0 h-auto hover:bg-transparent hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại đăng nhập
          </Button>

          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-accent text-accent-foreground">
            <Mail className="w-7 h-7" />
          </div>

          <h1 className="text-2xl font-bold mb-2">Quên mật khẩu?</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Nhập email đã đăng ký và chúng tôi sẽ gửi cho bạn đường dẫn để đặt lại mật khẩu.
          </p>

          <form className="mt-8 space-y-5" onSubmit={(e) => { e.preventDefault(); handleForgot(); }}>
            <div className="space-y-2">
              <label htmlFor="forgot-email" className="text-sm font-medium text-foreground">
                Email đã đăng ký
              </label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="example@email.com"
                  className="pl-10 w-full rounded-xl"
                  value={forgotEmail}
                  onChange={(e) => { setForgotEmail(e.target.value); setForgotError(""); }}
                />
              </div>
              {forgotError && (
                <p className="text-xs text-destructive mt-1">* {forgotError}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3 h-auto rounded-xl"
            >
              {loading ? "Đang gửi email..." : "Gửi đường dẫn đặt lại"}
            </Button>

            <Button
              type="button"
              onClick={() => navigate("/login")}
              disabled={loading}
              variant="outline"
              className="w-full py-3 h-auto rounded-xl"
            >
              Quay lại đăng nhập
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}