import { ArrowLeft, FileText } from "lucide-react";
import { LeftPanel } from "../components/LeftPanel";
import { Button } from "../../../components/ui/button";

const TERMS_SECTIONS = [
  {
    title: "1. Chấp nhận điều khoản",
    content:
      "Khi truy cập và sử dụng dịch vụ FEdu Learning, bạn đồng ý tuân thủ và bị ràng buộc bởi các điều khoản và điều kiện sử dụng này. Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản này, bạn không được phép sử dụng dịch vụ của chúng tôi.",
  },
  {
    title: "2. Tài khoản người dùng",
    content:
      "Bạn chịu trách nhiệm duy trì bảo mật tài khoản của mình, bao gồm mật khẩu. Bạn đồng ý thông báo ngay cho FEdu Learning về bất kỳ việc sử dụng trái phép tài khoản của bạn. FEdu Learning không chịu trách nhiệm về bất kỳ tổn thất nào phát sinh từ việc sử dụng trái phép tài khoản của bạn.",
  },
  {
    title: "3. Quyền sở hữu trí tuệ",
    content:
      "Tất cả nội dung trên FEdu Learning, bao gồm nhưng không giới hạn ở văn bản, đồ họa, logo, hình ảnh, video và phần mềm, là tài sản của FEdu Learning hoặc các nhà cung cấp nội dung và được bảo vệ bởi luật sở hữu trí tuệ.",
  },
  {
    title: "4. Hành vi người dùng",
    content:
      "Bạn đồng ý không sử dụng dịch vụ để: đăng tải nội dung vi phạm pháp luật, quấy rối hoặc gây hại cho người khác, phát tán phần mềm độc hại, hoặc thu thập thông tin cá nhân của người dùng khác mà không có sự đồng ý.",
  },
  {
    title: "5. Thanh toán và hoàn tiền",
    content:
      "Các môn học có phí sẽ được thanh toán trước khi truy cập. FEdu Learning cung cấp chính sách hoàn tiền trong vòng 7 ngày kể từ ngày mua nếu bạn chưa hoàn thành hơn 20% nội dung môn học.",
  },
  {
    title: "6. Chấm dứt dịch vụ",
    content:
      "FEdu Learning có quyền chấm dứt hoặc đình chỉ tài khoản của bạn ngay lập tức, mà không cần thông báo trước, nếu bạn vi phạm các điều khoản này hoặc có hành vi gây hại đến người dùng khác và cộng đồng.",
  },
  {
    title: "7. Giới hạn trách nhiệm",
    content:
      "FEdu Learning không chịu trách nhiệm về bất kỳ thiệt hại gián tiếp, ngẫu nhiên, đặc biệt hoặc mang tính hậu quả nào phát sinh từ việc sử dụng hoặc không thể sử dụng dịch vụ của chúng tôi.",
  },
];

export function TermsPage() {
  return (
    <div className="flex h-screen w-full">
      <LeftPanel />
      <div className="w-full lg:w-1/2 flex flex-col bg-background text-foreground">
        {/* Header */}
        <div className="flex items-center gap-3 px-8 py-5 border-b border-border bg-card">
          <Button
            variant="ghost"
            onClick={() => window.close()}
            className="flex items-center gap-1.5 text-sm text-muted-foreground p-0 h-auto hover:bg-transparent hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" /> Đóng
          </Button>
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-2">
              <FileText className="w-4 h-4 text-foreground" />
              <span className="text-sm font-semibold text-foreground">
                Điều khoản sử dụng
              </span>
            </div>
          </div>
          <div className="w-16" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="text-sm leading-relaxed text-muted-foreground">
            <p className="text-xs text-muted-foreground/80 mb-6">
              Cập nhật lần cuối: 17/05/2026
            </p>
            {TERMS_SECTIONS.map(({ title, content }) => (
              <div key={title} className="mb-6">
                <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-muted-foreground leading-relaxed m-0">{content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-border bg-card">
          <Button
            onClick={() => window.close()}
            className="w-full py-3 h-auto rounded-xl"
          >
            Đã hiểu và đồng ý
          </Button>
        </div>
      </div>
    </div>
  );
}