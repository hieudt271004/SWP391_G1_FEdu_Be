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
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/60">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-md flex items-center justify-center bg-primary text-primary-foreground">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="text-left font-sans">
            <div className="text-sm font-bold text-foreground tracking-tight">
              F<span className="text-foreground/70 font-medium">Edu</span>
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
                    ? "text-foreground bg-muted border border-border/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
                className="px-3.5 py-1.5 rounded-md text-foreground text-xs font-medium hover:bg-muted transition-colors cursor-pointer"
              >
                Đăng nhập
              </button>
              <button
                onClick={() => navigate("/register")}
                className="px-4 py-1.5 rounded-md text-primary-foreground text-xs font-semibold bg-primary hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Đăng ký
              </button>
            </>
          )}
        </div>
        <button
          className="md:hidden p-2 rounded-md hover:bg-muted text-foreground cursor-pointer"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden px-6 pb-4 space-y-3 border-t border-border/60 bg-background">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block w-full text-left px-3.5 py-2 rounded-md text-xs transition-colors ${
                  isActive
                    ? "text-foreground bg-muted font-semibold border border-border/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
                  className="w-full py-2 rounded-md border border-border/60 bg-background text-foreground text-xs font-medium hover:bg-muted transition-colors cursor-pointer"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => navigate("/register")}
                  className="w-full py-2 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
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