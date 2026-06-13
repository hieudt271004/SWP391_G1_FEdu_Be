import { BookOpen, Menu, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { UserMenu } from "./UserMenu";

const NAV_LINKS = [
  { label: "Về FEdu", href: "#about" },
  { label: "Tính năng", href: "#features" },
  { label: "Liên hệ", href: "#contact" },
];

export function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 shrink-0"
        >
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center bg-blue-600 shadow-lg shadow-blue-500/20">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <div className="text-lg font-extrabold text-slate-900 tracking-tight">
              F<span className="text-blue-700">Edu</span>
            </div>
          </div>
        </button>
        <nav className="hidden md:flex items-center gap-3">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="px-4 py-2 rounded-2xl text-base font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                className="px-4 py-2 rounded-2xl text-slate-700 text-sm font-medium hover:bg-slate-100 transition-colors"
              >
                Đăng nhập
              </button>
              <button
                onClick={() => navigate("/register")}
                className="px-5 py-2 rounded-2xl text-white text-sm font-semibold bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Đăng ký
              </button>
            </>
          )}
        </div>
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-700"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden px-6 pb-4 space-y-3 border-t border-slate-200 bg-white">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block w-full text-left px-4 py-2.5 rounded-lg text-gray-700 text-[15px] hover:bg-gray-100"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="w-full py-3 rounded-2xl border border-slate-200 bg-white text-slate-700 text-base font-medium hover:bg-slate-50 transition-colors"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => navigate("/register")}
                  className="w-full py-3 rounded-2xl bg-blue-600 text-white text-base font-semibold hover:bg-blue-700 transition-colors"
                >
                  Đăng ký
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}