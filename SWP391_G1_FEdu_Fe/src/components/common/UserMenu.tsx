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
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={fullName}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
            {initials || "U"}
          </div>
        )}

        <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
          {user.firstName}
        </span>

        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          // User info
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="font-semibold text-gray-900 truncate">{fullName}</div>
            <div className="text-xs text-gray-500 truncate">{user.email}</div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {user.roles.map((role) => (
                <span
                  key={role}
                  className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-700"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>

          <div className="py-1">
            <button
              onClick={() => handleNavigate("/student/profile")}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 text-left"
            >
              <UserIcon className="w-4 h-4 text-gray-500" />
              Hồ sơ
            </button>
            <button
              onClick={() => handleNavigate("/student/dashboard")}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 text-left"
            >
              <BookOpen className="w-4 h-4 text-gray-500" />
              Khóa học của tôi
            </button>
          </div>

          <div className="border-t border-gray-100 py-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 text-left"
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );
}