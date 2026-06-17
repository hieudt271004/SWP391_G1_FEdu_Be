import { useState } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle2 } from "lucide-react";
import { http } from "../../services/http";

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
        setIsSubmitting(false);
        setIsSuccess(true);
        setFormData({ name: "", email: "", subject: "", message: "" });
        
        // Auto reset success message after 5s
        setTimeout(() => {
          setIsSuccess(false);
        }, 5000);
      })
      .catch((err: any) => {
        setIsSubmitting(false);
        setError(err.message || "Gửi lời nhắn thất bại. Vui lòng thử lại sau.");
      });
  };

  return (
    <div className="bg-background min-h-screen py-12 md:py-16 font-sans">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-3xl font-bold text-foreground tracking-tight mb-3">
            Liên hệ với FEdu
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Bạn có câu hỏi, đóng góp ý kiến hoặc cần hỗ trợ kỹ thuật? Đội ngũ FEdu luôn sẵn sàng lắng nghe và phản hồi bạn sớm nhất có thể.
          </p>
        </div>

        {/* Content */}
        <div className="grid gap-6 md:grid-cols-5 items-start">
          {/* Info Columns (2/5 size) */}
          <div className="md:col-span-2 space-y-6">
            <div className="rounded-xl border border-border/60 bg-card p-6 shadow-2xs">
              <h2 className="text-base font-semibold text-foreground mb-6">Thông tin liên lạc</h2>
              
              <div className="space-y-5">
                <div className="flex gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground border border-border/50">
                    <Mail className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-xs uppercase tracking-wider">Email hỗ trợ</h3>
                    <p className="text-foreground/80 mt-1 text-sm font-medium">contact@fedu.vn</p>
                    <p className="text-muted-foreground text-[10px] mt-0.5">Phản hồi trong vòng 24 giờ</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground border border-border/50">
                    <Phone className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-xs uppercase tracking-wider">Hotline</h3>
                    <p className="text-foreground/80 mt-1 text-sm font-medium">+84 (24) 1234 5678</p>
                    <p className="text-muted-foreground text-[10px] mt-0.5">Thứ 2 - Thứ 6, từ 8:00 đến 17:00</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground border border-border/50">
                    <MapPin className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-xs uppercase tracking-wider">Văn phòng chính</h3>
                    <p className="text-foreground/80 mt-1 text-sm leading-relaxed font-medium">
                      Khu Công nghệ cao Hòa Lạc, Thạch Thất, Hà Nội, Việt Nam
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary p-6 text-primary-foreground shadow-2xs dark:bg-zinc-900/60 dark:border-border/60">
              <h3 className="text-sm font-bold mb-2">Hỗ trợ khẩn cấp?</h3>
              <p className="text-primary-foreground/85 text-xs leading-relaxed mb-4">
                Nếu bạn gặp sự cố khi đang trong lớp học hoặc bài kiểm tra, hãy gửi tin nhắn trực tiếp qua group chat hỗ trợ của lớp hoặc liên hệ hotline.
              </p>
              <a 
                href="mailto:contact@fedu.vn" 
                className="inline-flex items-center justify-center w-full py-2 px-3 rounded-lg bg-card text-foreground font-semibold text-xs hover:bg-accent/40 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Gửi Email Ngay
              </a>
            </div>
          </div>

          {/* Contact Form (3/5 size) */}
          <div className="md:col-span-3">
            <div className="rounded-xl border border-border/60 bg-card p-6 shadow-2xs">
              <h2 className="text-base font-semibold text-foreground mb-6">Gửi tin nhắn cho chúng tôi</h2>

              {isSuccess && (
                <div className="flex items-start gap-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-3 mb-6">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-emerald-900 text-xs">Gửi tin nhắn thành công!</h4>
                    <p className="text-emerald-700 dark:text-emerald-400 text-[10px] mt-0.5">
                      Cảm ơn bạn đã liên hệ. Chúng tôi đã nhận được thông tin và sẽ phản hồi bạn trong thời gian sớm nhất.
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 p-3 text-rose-700 dark:text-rose-400 text-xs mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="name" className="text-xs font-semibold text-foreground">
                      Họ và tên <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Nguyễn Văn A"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-border/80 bg-muted/30 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-xs font-semibold text-foreground">
                      Địa chỉ Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="name@example.com"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-border/80 bg-muted/30 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="subject" className="text-xs font-semibold text-foreground">
                    Tiêu đề <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Chủ đề bạn muốn liên hệ"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border/80 bg-muted/30 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="message" className="text-xs font-semibold text-foreground">
                    Nội dung tin nhắn <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Hãy nhập chi tiết nội dung bạn cần hỗ trợ..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border/80 bg-muted/30 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary hover:bg-primary/95 disabled:bg-primary/50 text-primary-foreground font-medium py-2 px-4 text-xs cursor-pointer select-none transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                  ) : (
                    <>
                      Gửi lời nhắn
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
