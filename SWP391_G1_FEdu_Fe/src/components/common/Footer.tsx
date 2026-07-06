import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

const CURRENT_YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer id="contact" className="bg-[#ececf0] dark:bg-[#030213] text-[#030213] dark:text-foreground border-t border-border font-sans relative z-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary text-primary-foreground shadow-sm animate-none">
                <BookOpen className="w-4.5 h-4.5" />
              </div>
              <div className="text-sm font-extrabold text-[#030213] dark:text-foreground tracking-tight">FEdu</div>
            </div>
            <p className="text-xs leading-relaxed text-[#030213]/70 dark:text-muted-foreground max-w-sm">
              FEdu giúp sinh viên và giảng viên kết nối qua phương pháp học chủ động và thực tế.
            </p>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#030213]/60 dark:text-muted-foreground/60 mb-4">
              Điều hướng
            </div>
            <div className="grid gap-2 text-xs text-[#030213]/85 dark:text-muted-foreground font-semibold">
              <Link to="/about" className="hover:text-foreground dark:hover:text-white transition-colors w-fit">Về FEdu</Link>
              <Link to="/features" className="hover:text-foreground dark:hover:text-white transition-colors w-fit">Tính năng</Link>
              <Link to="/contact" className="hover:text-foreground dark:hover:text-white transition-colors w-fit">Liên hệ</Link>
              <Link to="/terms" className="hover:text-foreground dark:hover:text-white transition-colors w-fit">Điều khoản sử dụng</Link>
            </div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#030213]/60 dark:text-muted-foreground/60 mb-4">
              Hỗ trợ
            </div>
            <div className="text-xs text-[#030213]/85 dark:text-muted-foreground space-y-2">
              <div className="font-bold text-[#030213] dark:text-foreground">contact@fedu.vn</div>
              <div className="text-[#030213]/60 dark:text-muted-foreground/60 text-[10px]">Phản hồi nhanh nhất qua email</div>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-border/50 pt-6 text-[10px] text-[#030213]/60 dark:text-muted-foreground/80 flex flex-col gap-2 md:flex-row md:justify-between md:items-center">
          <div>© {CURRENT_YEAR} FEdu. All rights reserved.</div>
          <div className="flex flex-wrap gap-4 text-[#030213]/80 dark:text-muted-foreground font-semibold">
            <Link to="/terms" className="hover:text-foreground dark:hover:text-white transition-colors">Điều khoản</Link>
            <a href="mailto:contact@fedu.vn" className="hover:text-foreground dark:hover:text-white transition-colors">contact@fedu.vn</a>
          </div>
        </div>
      </div>
    </footer>
  );
}