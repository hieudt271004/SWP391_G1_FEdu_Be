import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User as UserIcon, BookOpen, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export function UserMenu() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Đóng menu khi click ra ngoài
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
    logout();
    navigate("/");
  };

  const handleNavigate = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <div ref={menuRef} className="relative font-sans">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted transition-colors cursor-pointer"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={fullName}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
            {initials || "U"}
          </div>
        )}

        <span className="hidden md:block text-xs font-medium text-foreground max-w-[120px] truncate">
          {user.firstName}
        </span>

        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-card rounded-md shadow-md border border-border/80 overflow-hidden z-50">
          {/* User info */}
          <div className="px-4 py-3 border-b border-border/60">
            <div className="font-semibold text-xs text-foreground truncate">{fullName}</div>
            <div className="text-[10px] text-muted-foreground truncate">{user.email}</div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {user.roles.map((role) => (
                <span
                  key={role}
                  className="inline-block px-2 py-0.5 rounded-sm text-[9px] font-semibold bg-muted text-muted-foreground border border-border/30"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>

          <div className="py-1">
            <button
              onClick={() => handleNavigate("/student/profile")}
              className="w-full flex items-center gap-3 px-4 py-2 text-xs text-foreground hover:bg-muted/50 text-left transition-colors cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5 text-muted-foreground" />
              Hồ sơ
            </button>
            <button
              onClick={() => handleNavigate("/student/dashboard")}
              className="w-full flex items-center gap-3 px-4 py-2 text-xs text-foreground hover:bg-muted/50 text-left transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
              Môn học của tôi
            </button>
          </div>

          <div className="border-t border-border/60 py-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-xs text-destructive hover:bg-destructive/10 text-left transition-colors cursor-pointer"
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