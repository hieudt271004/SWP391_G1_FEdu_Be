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
    <div className="bg-slate-50 min-h-screen py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-extrabold text-slate-900 md:text-5xl tracking-tight mb-4">
            Liên hệ với FEdu
          </h1>
          <p className="text-lg text-slate-600">
            Bạn có câu hỏi, đóng góp ý kiến hoặc cần hỗ trợ kỹ thuật? Đội ngũ FEdu luôn sẵn sàng lắng nghe và phản hồi bạn sớm nhất có thể.
          </p>
        </div>

        {/* Content */}
        <div className="grid gap-8 md:grid-cols-5 items-start">
          {/* Info Columns (2/5 size) */}
          <div className="md:col-span-2 space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Thông tin liên lạc</h2>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm uppercase tracking-wider">Email hỗ trợ</h3>
                    <p className="text-slate-600 mt-1 text-[15px]">contact@fedu.vn</p>
                    <p className="text-slate-400 text-xs mt-0.5">Phản hồi trong vòng 24 giờ</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm uppercase tracking-wider">Hotline</h3>
                    <p className="text-slate-600 mt-1 text-[15px]">+84 (24) 1234 5678</p>
                    <p className="text-slate-400 text-xs mt-0.5">Thứ 2 - Thứ 6, từ 8:00 đến 17:00</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm uppercase tracking-wider">Văn phòng chính</h3>
                    <p className="text-slate-600 mt-1 text-[15px] leading-relaxed">
                      Khu Công nghệ cao Hòa Lạc, Thạch Thất, Hà Nội, Việt Nam
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white shadow-md">
              <h3 className="text-xl font-bold mb-2">Hỗ trợ khẩn cấp?</h3>
              <p className="text-blue-100 text-sm leading-relaxed mb-4">
                Nếu bạn gặp sự cố khi đang trong lớp học hoặc bài kiểm tra, hãy gửi tin nhắn trực tiếp qua group chat hỗ trợ của lớp hoặc liên hệ hotline.
              </p>
              <a 
                href="mailto:contact@fedu.vn" 
                className="inline-flex items-center justify-center w-full py-3 px-4 rounded-xl bg-white text-blue-700 font-semibold text-sm hover:bg-blue-50 transition-colors"
              >
                Gửi Email Ngay
              </a>
            </div>
          </div>

          {/* Contact Form (3/5 size) */}
          <div className="md:col-span-3">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Gửi tin nhắn cho chúng tôi</h2>

              {isSuccess && (
                <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 mb-6">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-emerald-900 text-sm">Gửi tin nhắn thành công!</h4>
                    <p className="text-emerald-700 text-xs mt-1">
                      Cảm ơn bạn đã liên hệ. Chúng tôi đã nhận được thông tin và sẽ phản hồi bạn trong thời gian sớm nhất.
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-rose-700 text-sm mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-semibold text-slate-700">
                      Họ và tên <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Nguyễn Văn A"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-semibold text-slate-700">
                      Địa chỉ Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="name@example.com"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="subject" className="text-sm font-semibold text-slate-700">
                    Tiêu đề <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Chủ đề bạn muốn liên hệ"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-semibold text-slate-700">
                    Nội dung tin nhắn <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Hãy nhập chi tiết nội dung bạn cần hỗ trợ..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3.5 px-6 w-full sm:w-auto min-w-[140px] transition shadow-lg shadow-blue-500/10"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <>
                      Gửi lời nhắn
                      <Send className="w-4 h-4" />
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
