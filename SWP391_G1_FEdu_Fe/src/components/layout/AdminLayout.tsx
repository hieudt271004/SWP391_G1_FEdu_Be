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
import logo from "../../assets/logo.png";
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
    { icon: BookOpen, label: "Quản lý Môn học", path: "/admin/subjects" },
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
    window.location.href = "/";
  };
  const isActive = (path: string) => {
    if (path === "/admin/users") {
      return location.pathname.startsWith("/admin/users");
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex bg-white overflow-hidden relative" style={{ fontFamily: "Outfit, sans-serif" }}>
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
          bg-[#030213] text-slate-300 flex flex-col shrink-0
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="FEdu Logo" className="w-10 h-10 rounded-lg object-cover" />
            <div>
              <div className="text-sm font-bold text-white leading-tight">
                F<span style={{ color: "#ececf0" }}>Edu</span> Learning
              </div>
              <div className="text-[10px] text-slate-500">Admin Portal</div>
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
                className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 cursor-pointer border-0 ${
                  active
                    ? "bg-[#1c1b2d] text-white font-bold"
                    : "hover:bg-[#1c1b2d]/50 hover:text-white font-medium"
                }`}
                style={{ borderRadius: "6px" }}
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
        <header className="shrink-0 px-6 py-4 bg-white border-b border-black/10 z-30">
          <div className="flex items-center justify-between gap-4">
            {/* Left side: Hamburger menu + Search */}
            <div className="flex items-center gap-3 flex-1">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="hidden sm:flex items-center gap-2 px-4 py-2 transition-all focus-within:ring-2 focus-within:ring-[#030213] focus-within:bg-white max-w-md flex-1" style={{ backgroundColor: "#ececf0", borderRadius: "6px" }}>
                <Search className="w-4 h-4 shrink-0 text-[#717182]" />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  className="flex-1 bg-transparent outline-none text-sm text-[#000000]"
                />
              </div>
            </div>

            {/* Right side: Notifications + Avatar Dropdown */}
            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100">
                <Bell className="w-5 h-5" />
              </button>

              {/* User Dropdown */}
              <div className="relative pl-3 border-l border-slate-200" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#ececf0", border: "1px solid rgba(0, 0, 0, 0.1)" }}>
                    <span className="font-semibold text-sm" style={{ color: "#030213" }}>
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
                  <div className="absolute right-0 top-full mt-2 w-64 shadow-xl bg-white border border-black/10 overflow-hidden z-50" style={{ borderRadius: "10px" }}>
                    {/* User Info Header */}
                    <div className="p-4 border-b border-black/5 bg-white">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#030213" }}>
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
                      <div className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold" style={{ backgroundColor: "#ececf0", color: "#030213", borderRadius: "6px" }}>
                        <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: "#030213" }} />
                        Quản trị viên
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="py-1.5">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          navigate("/admin/profile");
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-gray-50 text-sm transition-colors text-left border-0 cursor-pointer bg-transparent"
                      >
                        <UserCircle className="w-4 h-4 text-slate-400" />
                        Thông tin cá nhân
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-rose-600 hover:bg-rose-50 text-sm font-medium transition-colors text-left border-0 cursor-pointer bg-transparent"
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
        <main className="flex-1 overflow-auto bg-white" style={{ borderLeft: "1px solid rgba(0, 0, 0, 0.1)" }}>
          <div className="max-w-7xl mx-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}