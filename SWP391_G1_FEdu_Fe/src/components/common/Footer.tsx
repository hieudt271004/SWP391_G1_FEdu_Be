import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

const CURRENT_YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer id="contact" className="bg-primary text-primary-foreground/90 border-t border-border font-sans">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md flex items-center justify-center bg-primary-foreground/10 text-primary-foreground border border-primary-foreground/15">
                <BookOpen className="w-4.5 h-4.5" />
              </div>
              <div className="text-sm font-bold text-primary-foreground tracking-tight">FEdu</div>
            </div>
            <p className="text-xs leading-relaxed text-primary-foreground/60 max-w-sm">
              FEdu giúp sinh viên và giảng viên kết nối qua phương pháp học chủ động và thực tế.
            </p>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/60 mb-4">
              Điều hướng
            </div>
            <div className="grid gap-2 text-xs text-primary-foreground/85">
              <Link to="/about" className="hover:text-primary-foreground transition-colors w-fit">Về FEdu</Link>
              <Link to="/features" className="hover:text-primary-foreground transition-colors w-fit">Tính năng</Link>
              <Link to="/contact" className="hover:text-primary-foreground transition-colors w-fit">Liên hệ</Link>
              <Link to="/terms" className="hover:text-primary-foreground transition-colors w-fit">Điều khoản</Link>
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/60 mb-4">
              Hỗ trợ
            </div>
            <div className="text-xs text-primary-foreground/85 space-y-2">
              <div className="font-semibold text-primary-foreground">contact@fedu.vn</div>
              <div className="text-primary-foreground/50 text-[10px]">Phản hồi nhanh nhất qua email</div>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-primary-foreground/5 pt-6 text-[10px] text-primary-foreground/40 flex flex-col gap-2 md:flex-row md:justify-between md:items-center">
          <div>© {CURRENT_YEAR} FEdu. All rights reserved.</div>
          <div className="flex flex-wrap gap-4 text-primary-foreground/60">
            <Link to="/terms" className="hover:text-primary-foreground transition-colors">Điều khoản</Link>
            <a href="mailto:contact@fedu.vn" className="hover:text-primary-foreground transition-colors">contact@fedu.vn</a>
          </div>
        </div>
      </div>
    </footer>
  );
}