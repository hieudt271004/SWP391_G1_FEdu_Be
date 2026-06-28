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
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-white/5 text-slate-300 hover:text-white transition-colors cursor-pointer"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={fullName}
            className="w-8 h-8 rounded-full object-cover border border-white/10"
          />
        ) : (
          <div className="w-8 h-8 rounded-md bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-blue-500/10">
            {initials || "U"}
          </div>
        )}

        <span className="hidden md:block text-xs font-semibold text-slate-300 max-w-[120px] truncate">
          {user.firstName}
        </span>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-[#030213] rounded-md shadow-xl border border-white/10 overflow-hidden z-50">
          {/* User info */}
          <div className="px-4 py-3 border-b border-white/10 bg-white/5">
            <div className="font-semibold text-xs text-white truncate">{fullName}</div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5">{user.email}</div>
            <div className="mt-2.5 flex flex-wrap gap-1">
              {user.roles.map((role) => (
                <span
                  key={role}
                  className="inline-block px-2 py-0.5 rounded-sm text-[8px] font-bold bg-white/10 text-slate-300 border border-white/10 uppercase tracking-wider"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>

          <div className="py-1 bg-[#030213]">
            <button
              onClick={() => handleNavigate("/student/profile")}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-white/5 text-left transition-colors cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5 text-slate-400" />
              Hồ sơ của tôi
            </button>
            <button
              onClick={() => handleNavigate("/student/dashboard")}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-white/5 text-left transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              Môn học của tôi
            </button>
          </div>

          <div className="border-t border-white/10 py-1 bg-[#030213]">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-rose-400 hover:bg-rose-500/10 text-left transition-colors cursor-pointer"
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