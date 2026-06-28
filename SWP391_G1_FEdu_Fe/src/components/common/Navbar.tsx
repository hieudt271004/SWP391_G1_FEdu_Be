import { BookOpen, Menu, X } from "lucide-react";
import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { UserMenu } from "./UserMenu";

const NAV_LINKS = [
  { label: "Về FEdu", to: "/about" },
  { label: "Tính năng", to: "/features" },
  { label: "Liên hệ", to: "/contact" },
];

export function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 bg-[#030213]/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 shrink-0 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-md shadow-blue-500/10 group-hover:scale-105 transition-all duration-300">
            <BookOpen className="w-4.5 h-4.5" />
          </div>
          <div className="text-left font-sans">
            <div className="text-base font-extrabold text-white tracking-tight">
              FE<span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent font-medium">du</span>
            </div>
          </div>
        </button>
        <nav className="hidden md:flex items-center gap-1.5">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  isActive
                    ? "text-white bg-white/10 border border-white/10"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                className="px-3.5 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-white/5 text-xs font-semibold transition-colors cursor-pointer"
              >
                Đăng nhập
              </button>
              <button
                onClick={() => navigate("/register")}
                className="px-4 py-1.5 rounded-md bg-white hover:bg-slate-100 text-[#030213] text-xs font-semibold transition-colors cursor-pointer"
              >
                Đăng ký
              </button>
            </>
          )}
        </div>
        <button
          className="md:hidden p-2 rounded-md hover:bg-white/5 text-slate-300 hover:text-white cursor-pointer"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden px-6 pb-4 space-y-3 border-t border-white/10 bg-[#030213]">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block w-full text-left px-3.5 py-2 rounded-md text-xs transition-colors ${
                  isActive
                    ? "text-white bg-white/10 font-semibold border border-white/10"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="w-full py-2 rounded-md border border-white/10 bg-white/5 text-slate-300 text-xs font-semibold hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => navigate("/register")}
                  className="w-full py-2 rounded-md bg-white text-[#030213] text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
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