import { BookOpen } from "lucide-react";

const CURRENT_YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer id="contact" className="bg-slate-950 text-slate-300">
      <div className="max-w-7xl mx-auto px-6 py-10 md:py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-blue-600">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-lg font-bold text-white">FEdu</div>
              </div>
            </div>
            <p className="text-sm leading-6 text-slate-400 max-w-sm">
              FEdu giúp sinh viên và giảng viên kết nối qua phương pháp học chủ động và thực tế.
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 mb-3">
              Điều hướng
            </div>
            <div className="grid gap-2 text-sm text-slate-300">
              <a href="#about" className="hover:text-white transition-colors">Về FEdu</a>
              <a href="#features" className="hover:text-white transition-colors">Tính năng</a>
              <a href="#contact" className="hover:text-white transition-colors">Liên hệ</a>
              <a href="/terms" className="hover:text-white transition-colors">Điều khoản</a>
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 mb-3">
              Hỗ trợ
            </div>
            <div className="text-sm text-slate-300 space-y-2">
              <div>contact@fedu.vn</div>
              <div className="text-slate-500">Phản hồi nhanh nhất qua email</div>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-slate-800 pt-4 text-xs text-slate-500 flex flex-col gap-2 md:flex-row md:justify-between md:items-center">
          <div>© {CURRENT_YEAR} FEdu. All rights reserved.</div>
          <div className="flex flex-wrap gap-4 text-slate-400">
            <a href="/terms" className="hover:text-white transition-colors">Điều khoản</a>
            <a href="mailto:contact@fedu.vn" className="hover:text-white transition-colors">contact@fedu.vn</a>
          </div>
        </div>
      </div>
    </footer>
  );
}