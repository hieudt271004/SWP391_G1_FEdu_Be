import { BookOpen, Menu, X, Sun, Moon } from "lucide-react";
import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { UserMenu } from "./UserMenu";
import { Button } from "../ui/button";
import { useTheme } from "../../context/ThemeContext";

const NAV_LINKS = [
  { label: "Về FEdu", to: "/about" },
  { label: "Tính năng", to: "/features" },
  { label: "Liên hệ", to: "/contact" },
];

export function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  return (
    <header className="sticky top-0 z-50 bg-[#ececf0] dark:bg-[#030213] border-b border-border transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 shrink-0 cursor-pointer group border-none bg-transparent"
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary text-primary-foreground shadow-sm group-hover:scale-105 transition-all duration-300">
            <BookOpen className="w-4.5 h-4.5" />
          </div>
          <div className="text-left font-sans">
            <div className="text-base font-extrabold text-foreground tracking-tight">
              FEdu
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
                    ? "text-foreground bg-accent border border-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <>
              <Button
                onClick={() => navigate("/login")}
                variant="ghost"
                size="sm"
                className="text-xs font-semibold h-8"
              >
                Đăng nhập
              </Button>
              <Button
                onClick={() => navigate("/register")}
                size="sm"
                className="text-xs font-semibold h-8"
              >
                Đăng ký
              </Button>
            </>
          )}
        </div>
        <button
          className="md:hidden p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer border-none bg-transparent"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden px-6 pb-4 space-y-3 border-t border-border bg-[#ececf0] dark:bg-[#030213] transition-colors duration-300">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block w-full text-left px-3.5 py-2 rounded-md text-xs transition-colors ${
                  isActive
                    ? "text-foreground bg-accent font-semibold border border-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-border/50">
              <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Giao diện</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            </div>
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <>
                <Button
                  onClick={() => navigate("/login")}
                  variant="outline"
                  className="w-full py-2 text-xs font-semibold h-9"
                >
                  Đăng nhập
                </Button>
                <Button
                  onClick={() => navigate("/register")}
                  className="w-full py-2 text-xs font-semibold h-9"
                >
                  Đăng ký
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}