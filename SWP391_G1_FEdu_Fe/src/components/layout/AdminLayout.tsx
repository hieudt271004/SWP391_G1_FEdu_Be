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
  Clock,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.png";
import { getFullName, getInitials } from "../../utils/userHelpers";
import { useNotifications } from "../../context/NotificationContext";

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notiRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();

  const menuItems = [
    { icon: Home, label: "Tổng quan", path: "/admin/dashboard" },
    { icon: Users, label: "Quản lý Người dùng", path: "/admin/users" },
    { icon: BookOpen, label: "Quản lý Môn học", path: "/admin/subjects" },
    { icon: GraduationCap, label: "Quản lý Lớp học", path: "/admin/classes" },
    { icon: Clock, label: "Quản lý Ca học", path: "/admin/slots" },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (notiRef.current && !notiRef.current.contains(event.target as Node)) {
        setNotiOpen(false);
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
            {/* Left side: Hamburger menu */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>

            {/* Right side: Notifications + Avatar Dropdown */}
            <div className="flex items-center gap-3">
              {/* Notifications Bell */}
              <div className="relative" ref={notiRef}>
                <button
                  onClick={() => setNotiOpen(!notiOpen)}
                  className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notiOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 shadow-xl bg-white border border-black/10 overflow-hidden z-50 rounded-lg">
                    <div className="p-3 border-b border-black/5 flex items-center justify-between bg-slate-50">
                      <span className="font-semibold text-sm text-slate-800">Thông báo</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline border-0 bg-transparent cursor-pointer"
                        >
                          Đọc tất cả
                        </button>
                      )}
                    </div>
                    
                    <div className="max-h-72 overflow-y-auto divide-y divide-black/5">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400">
                          Không có thông báo nào
                        </div>
                      ) : (
                        notifications.map((noti) => (
                          <div
                            key={noti.id}
                            onClick={() => {
                              markAsRead(noti.id);
                            }}
                            className={`p-3 text-left transition-colors cursor-pointer ${
                              noti.isRead ? 'bg-white hover:bg-slate-50' : 'bg-indigo-50/40 hover:bg-indigo-50/70'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <span className={`text-xs font-medium ${noti.isRead ? 'text-slate-700' : 'text-slate-900 font-bold'}`}>
                                {noti.title}
                              </span>
                              {!noti.isRead && (
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0 mt-1" />
                              )}
                            </div>
                            {noti.message && (
                              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                                {noti.message}
                              </p>
                            )}
                            <span className="text-[9px] text-slate-400 mt-1 block">
                              {new Date(noti.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(noti.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        ))
                      )}
                    </div>

                    {notifications.length > 0 && (
                      <div className="p-2 border-t border-black/5 text-center bg-slate-50">
                        <button
                          onClick={clearAll}
                          className="text-xs text-red-600 hover:text-red-800 hover:underline border-0 bg-transparent cursor-pointer font-medium"
                        >
                          Xóa tất cả
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* User Dropdown */}
              <div className="relative pl-3 border-l border-slate-200" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden" style={{ backgroundColor: "#ececf0", border: "1px solid rgba(0, 0, 0, 0.1)" }}>
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-semibold text-sm" style={{ color: "#030213" }}>
                        {getInitials(user)}
                      </span>
                    )}
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
                  <div className="absolute left-0 right-0 top-full mt-2 min-w-[200px] shadow-xl bg-white border border-black/10 overflow-hidden z-50" style={{ borderRadius: "10px" }}>
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