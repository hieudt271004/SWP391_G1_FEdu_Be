import { Shield, ArrowLeft } from "lucide-react";
import { LeftPanel } from "../components/LeftPanel";

const PRIVACY_SECTIONS = [
  {
    title: "1. Thông tin chúng tôi thu thập",
    content:
      "Chúng tôi thu thập thông tin bạn cung cấp trực tiếp như họ tên, địa chỉ email, mật khẩu khi đăng ký tài khoản. Ngoài ra, chúng tôi tự động thu thập thông tin về thiết bị, địa chỉ IP, trình duyệt và lịch sử học tập của bạn trên nền tảng.",
  },
  {
    title: "2. Cách chúng tôi sử dụng thông tin",
    content:
      "Thông tin của bạn được sử dụng để: cung cấp và cải thiện dịch vụ, cá nhân hoá trải nghiệm học tập, gửi thông báo quan trọng về tài khoản và khóa học, phân tích xu hướng sử dụng để phát triển tính năng mới.",
  },
  {
    title: "3. Chia sẻ thông tin",
    content:
      "Chúng tôi không bán, trao đổi hay chuyển nhượng thông tin cá nhân của bạn cho bên thứ ba mà không có sự đồng ý của bạn, ngoại trừ trường hợp cần thiết để cung cấp dịch vụ hoặc theo yêu cầu pháp luật.",
  },
  {
    title: "4. Bảo mật dữ liệu",
    content:
      "Chúng tôi áp dụng các biện pháp bảo mật kỹ thuật và tổ chức phù hợp để bảo vệ thông tin cá nhân của bạn khỏi truy cập, tiết lộ, thay đổi hoặc phá hủy trái phép. Dữ liệu được mã hóa khi truyền tải và lưu trữ.",
  },
  {
    title: "5. Cookie và công nghệ theo dõi",
    content:
      "Chúng tôi sử dụng cookie và các công nghệ tương tự để ghi nhớ tùy chọn của bạn, phân tích lưu lượng truy cập và cải thiện trải nghiệm người dùng. Bạn có thể kiểm soát cookie thông qua cài đặt trình duyệt.",
  },
  {
    title: "6. Quyền của bạn",
    content:
      "Bạn có quyền truy cập, chỉnh sửa hoặc xóa thông tin cá nhân của mình bất cứ lúc nào thông qua cài đặt tài khoản. Bạn cũng có thể yêu cầu chúng tôi hạn chế xử lý hoặc xuất dữ liệu của bạn.",
  },
  {
    title: "7. Liên hệ",
    content:
      "Nếu bạn có câu hỏi về chính sách bảo mật này, vui lòng liên hệ với chúng tôi qua email: privacy@fedulearn.vn hoặc địa chỉ: Tầng 12, Tòa nhà EduLearn, 123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh.",
  },
];

export function PrivacyPage() {
  return (
    <div className="flex h-screen w-full">
      <LeftPanel />
      <div className="w-full lg:w-1/2 flex flex-col bg-white">
        {/* Header */}
        <div
          className="flex items-center gap-3 px-8 py-5"
          style={{ borderBottom: "1px solid #e5e7eb" }}
        >
          <button
            onClick={() => window.close()}
            className="flex items-center gap-1.5"
            style={{
              color: "#6b7280",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            <ArrowLeft className="w-4 h-4" /> Đóng
          </button>
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-4 h-4" style={{ color: "#4338ca" }} />
              <span style={{ color: "#111827", fontWeight: 600, fontSize: "0.9375rem" }}>
                Chính sách bảo mật
              </span>
            </div>
          </div>
          <div className="w-16" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div style={{ color: "#374151", fontSize: "0.9rem", lineHeight: 1.8 }}>
            <p style={{ color: "#6b7280", fontSize: "0.8125rem", marginBottom: "1.5rem" }}>
              Cập nhật lần cuối: 17/05/2026
            </p>
            {PRIVACY_SECTIONS.map(({ title, content }) => (
              <div key={title} className="mb-5">
                <h3 style={{ color: "#111827", marginBottom: "0.5rem" }}>{title}</h3>
                <p style={{ color: "#6b7280", margin: 0, lineHeight: 1.8 }}>{content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5" style={{ borderTop: "1px solid #e5e7eb" }}>
          <button
            onClick={() => window.close()}
            className="w-full py-3 rounded-xl text-white transition-opacity hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #4338ca, #7c3aed)",
              border: "none",
              cursor: "pointer",
            }}
          >
            Đã hiểu và đồng ý
          </button>
        </div>
      </div>
    </div>
  );
}