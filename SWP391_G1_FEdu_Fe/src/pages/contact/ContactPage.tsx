import { useState, useEffect, useRef } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle2 } from "lucide-react";
import { http } from "../../services/http";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

export function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { name, email, subject, message } = formData;

    if (!name || !email || !subject || !message) {
      setError("Vui lòng điền đầy đủ tất cả các trường thông tin.");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Địa chỉ email không hợp lệ.");
      return;
    }

    setIsSubmitting(true);

    http.post("/public/about/contact", formData)
      .then(() => {
        if (!isMountedRef.current) return;
        setIsSubmitting(false);
        setIsSuccess(true);
        setFormData({ name: "", email: "", subject: "", message: "" });
        
        // Auto reset success message after 5s
        setTimeout(() => {
          if (!isMountedRef.current) return;
          setIsSuccess(false);
        }, 5000);
      })
      .catch((err: any) => {
        if (!isMountedRef.current) return;
        setIsSubmitting(false);
        setError(err.message || "Gửi lời nhắn thất bại. Vui lòng thử lại sau.");
      });
  };

  return (
    <div className="bg-background text-foreground min-h-screen py-20 md:py-24 font-sans relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-primary/5 blur-[130px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 relative">
          <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/60 px-3.5 py-1.5 text-xs text-muted-foreground font-semibold mb-4">
            Liên hệ hỗ trợ
          </div>
          <h1 className="text-4xl font-extrabold text-foreground md:text-5xl tracking-tight mb-6">
            Liên hệ với FEdu
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Bạn có câu hỏi, đóng góp ý kiến hoặc cần hỗ trợ kỹ thuật? Đội ngũ FEdu luôn sẵn sàng lắng nghe và phản hồi bạn sớm nhất có thể.
          </p>
        </div>

        {/* Content */}
        <div className="grid gap-6 md:grid-cols-5 items-start relative">
          {/* Info Columns (2/5 size) */}
          <div className="md:col-span-2 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
              <h2 className="text-sm font-bold text-foreground mb-6">Thông tin liên lạc</h2>
              
              <div className="space-y-5">
                <div className="flex gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground border border-border">
                    <Mail className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-[10px] uppercase tracking-wider">Email hỗ trợ</h3>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">contact@fedu.vn</p>
                    <p className="text-muted-foreground/60 text-[9px] mt-0.5">Phản hồi trong vòng 24 giờ</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground border border-border">
                    <Phone className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-[10px] uppercase tracking-wider">Hotline</h3>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">+84 (24) 1234 5678</p>
                    <p className="text-muted-foreground/60 text-[9px] mt-0.5">Thứ 2 - Thứ 6, từ 8:00 đến 17:00</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground border border-border">
                    <MapPin className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-[10px] uppercase tracking-wider">Văn phòng chính</h3>
                    <p className="text-muted-foreground mt-1 text-sm leading-relaxed font-medium">
                      Khu Công nghệ cao Hòa Lạc, Thạch Thất, Hà Nội, Việt Nam
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 text-foreground shadow-xs">
              <h3 className="text-xs font-bold mb-2">Hỗ trợ khẩn cấp?</h3>
              <p className="text-muted-foreground text-[11px] leading-relaxed mb-4">
                Nếu bạn gặp sự cố khi đang trong lớp học hoặc bài kiểm tra, hãy gửi tin nhắn trực tiếp qua group chat hỗ trợ của lớp hoặc liên hệ hotline.
              </p>
              <Button 
                onClick={() => window.open("mailto:contact@fedu.vn")} 
                className="w-full text-xs font-semibold h-9 rounded-xl"
              >
                Gửi Email Ngay
              </Button>
            </div>
          </div>

          {/* Contact Form (3/5 size) */}
          <div className="md:col-span-3">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
              <h2 className="text-sm font-bold text-foreground mb-6">Gửi tin nhắn cho chúng tôi</h2>

              {isSuccess && (
                <div className="flex items-start gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 mb-6">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">Gửi tin nhắn thành công!</h4>
                    <p className="text-emerald-600/80 dark:text-emerald-400/80 text-[10px] mt-0.5">
                      Cảm ơn bạn đã liên hệ. Chúng tôi đã nhận được thông tin và sẽ phản hồi bạn trong thời gian sớm nhất.
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-destructive text-xs mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="name" className="text-xs font-semibold text-foreground">
                      Họ và tên <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Nguyễn Văn A"
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-xs font-semibold text-foreground">
                      Địa chỉ Email <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="name@example.com"
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="subject" className="text-xs font-semibold text-foreground">
                    Tiêu đề <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Chủ đề bạn muốn liên hệ"
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="message" className="text-xs font-semibold text-foreground">
                    Nội dung tin nhắn <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Hãy nhập chi tiết nội dung bạn cần hỗ trợ..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input transition-all duration-200 resize-none min-h-[120px]"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="gap-2 rounded-xl font-bold h-10 px-6"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                  ) : (
                    <>
                      Gửi lời nhắn
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
