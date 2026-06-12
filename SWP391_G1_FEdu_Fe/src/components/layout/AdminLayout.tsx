import { useState, useRef, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  BookOpen,
  Users,
  GraduationCap,
  Shield,
  Search,
  Bell,
  Menu,
  X,
  ChevronDown,
  UserCircle,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getFullName, getInitials } from "../../utils/userHelpers";

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const menuItems = [
    { icon: Home, label: "Tổng quan", path: "/admin/dashboard" },
    { icon: Users, label: "Quản lý Người dùng", path: "/admin/users" },
    { icon: BookOpen, label: "Quản lý Khóa học", path: "/admin/courses" },
    { icon: GraduationCap, label: "Quản lý Lớp học", path: "/admin/classes" },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate("/login");
  };

  const isActive = (path: string) => {
    if (path === "/admin/users") {
      return location.pathname.startsWith("/admin/users");
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 overflow-hidden relative">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64
          bg-slate-900 text-slate-300 flex flex-col shrink-0
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold text-white">
                F<span className="text-indigo-400">Edu</span>
              </div>
              <div className="text-xs text-slate-500">Admin Portal</div>
            </div>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="px-3 mb-3 lg:block hidden">
            <span className="text-[10px] font-bold text-slate-500 tracking-wider">
              MENU CHÍNH
            </span>
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer border-0 ${
                  active
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10 font-bold"
                    : "hover:bg-slate-800 hover:text-white font-medium"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen">
        {/* Topbar */}
        <header className="shrink-0 px-6 py-4 bg-white border-b border-slate-200 shadow-sm z-30">
          <div className="flex items-center justify-between gap-4">
            {/* Left side: Hamburger menu + Search */}
            <div className="flex items-center gap-3 flex-1">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full max-w-md flex-1">
                <Search className="w-4 h-4 shrink-0 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  className="flex-1 bg-transparent outline-none text-sm text-slate-800"
                />
              </div>
            </div>

            {/* Right side: Notifications + Avatar Dropdown */}
            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
              </button>

              {/* User Dropdown */}
              <div className="relative pl-3 border-l border-slate-200" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                    <span className="text-indigo-600 font-semibold text-sm">
                      {getInitials(user)}
                    </span>
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-semibold text-slate-800 max-w-[120px] truncate">
                      {getFullName(user) || "Administrator"}
                    </div>
                    <div className="text-xs text-slate-400">Quản trị viên</div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      dropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu Overlay */}
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 rounded-xl shadow-xl bg-white border border-slate-200 overflow-hidden z-50">
                    {/* User Info Header */}
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                          <span className="text-white text-lg font-semibold">
                            {getInitials(user)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-800 truncate">
                            {getFullName(user) || "Administrator"}
                          </div>
                          <div className="text-xs text-slate-400 truncate">
                            {user?.email || "admin@fedu.vn"}
                          </div>
                        </div>
                      </div>
                      <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-50 text-[11px] text-indigo-600 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mr-1.5" />
                        Quản trị viên
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="py-1.5">
                      <button className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-50 text-sm transition-colors text-left border-0 cursor-pointer">
                        <UserCircle className="w-4 h-4 text-slate-400" />
                        Thông tin cá nhân
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-rose-600 hover:bg-rose-50 text-sm font-medium transition-colors text-left border-0 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-slate-50">
          <div className="max-w-7xl mx-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}