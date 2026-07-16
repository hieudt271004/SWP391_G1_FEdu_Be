import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User as UserIcon, BookOpen, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Badge } from "../ui/badge";

export function UserMenu() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();
  const fullName = `${user.firstName} ${user.lastName}`.trim();

  const handleLogout = () => {
    setOpen(false);
    navigate("/");
    setTimeout(() => {
      logout();
    }, 0);
  };

  const handleNavigate = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <div ref={menuRef} className="relative font-sans text-foreground">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer border-none bg-transparent"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={fullName}
            className="w-8 h-8 rounded-full object-cover border border-border"
          />
        ) : (
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shadow-sm">
            {initials || "U"}
          </div>
        )}

        <span className="hidden md:block text-xs font-semibold text-muted-foreground max-w-[120px] truncate">
          {user.firstName}
        </span>

        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-popover text-popover-foreground rounded-xl shadow-xl border border-border overflow-hidden z-50">
          {}
          <div className="px-4 py-3 border-b border-border bg-accent/25">
            <div className="font-semibold text-xs text-foreground truncate">{fullName}</div>
            <div className="text-[10px] text-muted-foreground truncate mt-0.5">{user.email}</div>
            <div className="mt-2.5 flex flex-wrap gap-1">
              {user.roles.map((role) => (
                <Badge
                  key={role}
                  variant="secondary"
                  className="px-2 py-0.5 rounded-sm text-[8px] font-bold border border-border uppercase tracking-wider"
                >
                  {role}
                </Badge>
              ))}
            </div>
          </div>

          <div className="py-1 bg-popover">
            <button
              onClick={() => handleNavigate("/student/profile")}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-foreground hover:bg-accent text-left transition-colors cursor-pointer border-none bg-transparent"
            >
              <UserIcon className="w-3.5 h-3.5 text-muted-foreground" />
              Hồ sơ của tôi
            </button>
            <button
              onClick={() => handleNavigate("/student/dashboard")}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-foreground hover:bg-accent text-left transition-colors cursor-pointer border-none bg-transparent"
            >
              <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
              Môn học của tôi
            </button>
          </div>

          <div className="border-t border-border py-1 bg-popover">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-destructive hover:bg-destructive/10 text-left transition-colors cursor-pointer border-none bg-transparent"
            >
              <LogOut className="w-3.5 h-3.5" />
              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );
}