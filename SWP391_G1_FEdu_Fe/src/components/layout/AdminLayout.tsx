import { useState, useRef, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  BookOpen,
  Users,
  GraduationCap,
  Bell,
  Menu,
  X,
  ChevronDown,
  UserCircle,
  LogOut,
  Search,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.png";
import { getFullName, getInitials } from "../../utils/userHelpers";
import { useNotifications } from "../../context/NotificationContext";
import { Button } from "../ui/button";

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
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
    <div className="min-h-screen flex bg-background text-foreground overflow-hidden relative">
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
          bg-sidebar text-sidebar-foreground flex flex-col shrink-0 border-r border-sidebar-border
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="FEdu Logo" className="w-10 h-10 rounded-lg object-cover" />
            <div>
              <div className="text-sm font-bold text-sidebar-foreground leading-tight">
                FEdu Learning
              </div>
              <div className="text-[10px] text-sidebar-foreground/60">Admin Portal</div>
            </div>
          </div>
          {/* Close button for mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="px-3 mb-3 lg:block hidden">
            <span className="text-[10px] font-bold text-sidebar-foreground/40 tracking-wider">
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
                className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 cursor-pointer border-0 rounded-md ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground font-medium"
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
        <header className="shrink-0 px-6 py-4 bg-background border-b border-border z-30">
          <div className="flex items-center justify-between gap-4">
            {/* Left side: Hamburger menu + Search */}
            <div className="flex items-center gap-3 flex-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </Button>

              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-muted text-muted-foreground focus-within:ring-2 focus-within:ring-ring focus-within:bg-background border border-input max-w-md flex-1 rounded-md">
                <Search className="w-4 h-4 shrink-0 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* Right side: Notifications + Avatar Dropdown */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="w-9 h-9 text-muted-foreground hover:text-foreground"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
              </Button>

              {/* Notifications Bell */}
              <div className="relative" ref={notiRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setNotiOpen(!notiOpen)}
                  className="relative text-muted-foreground hover:text-foreground"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full ring-2 ring-background animate-pulse" />
                  )}
                </Button>

                {/* Notifications Dropdown */}
                {notiOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 shadow-xl bg-popover text-popover-foreground border border-border overflow-hidden z-50 rounded-lg">
                    <div className="p-3 border-b border-border flex items-center justify-between bg-accent/30">
                      <span className="font-semibold text-sm text-foreground">Thông báo</span>
                      {unreadCount > 0 && (
                        <Button
                          variant="link"
                          onClick={markAllAsRead}
                          className="text-xs h-auto p-0 text-primary"
                        >
                          Đọc tất cả
                        </Button>
                      )}
                    </div>
                    
                    <div className="max-h-72 overflow-y-auto divide-y divide-border">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-muted-foreground">
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
                              noti.isRead ? 'bg-popover hover:bg-accent/40' : 'bg-accent/20 hover:bg-accent/50'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <span className={`text-xs font-medium ${noti.isRead ? 'text-foreground/80' : 'text-foreground font-bold'}`}>
                                {noti.title}
                              </span>
                              {!noti.isRead && (
                                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1" />
                              )}
                            </div>
                            {noti.message && (
                              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                                {noti.message}
                              </p>
                            )}
                            <span className="text-[9px] text-muted-foreground/60 mt-1 block">
                              {new Date(noti.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(noti.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        ))
                      )}
                    </div>

                    {notifications.length > 0 && (
                      <div className="p-2 border-t border-border text-center bg-accent/30">
                        <Button
                          variant="link"
                          onClick={clearAll}
                          className="text-xs h-auto p-0 text-destructive hover:text-destructive/80 font-medium"
                        >
                          Xóa tất cả
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* User Dropdown */}
              <div className="relative pl-3 border-l border-border" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-accent transition-colors cursor-pointer border-none bg-transparent"
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden bg-muted text-foreground border border-border">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-semibold text-sm">
                        {getInitials(user)}
                      </span>
                    )}
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-semibold text-foreground max-w-[120px] truncate">
                      {getFullName(user) || "Administrator"}
                    </div>
                    <div className="text-xs text-muted-foreground">Quản trị viên</div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground transition-transform ${
                      dropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu Overlay */}
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 shadow-xl bg-popover text-popover-foreground border border-border rounded-xl overflow-hidden z-50">
                    {/* User Info Header */}
                    <div className="p-4 border-b border-border bg-popover">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 overflow-hidden bg-primary text-primary-foreground">
                          {user?.avatarUrl ? (
                            <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-lg font-semibold">
                              {getInitials(user)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-foreground truncate">
                            {getFullName(user) || "Administrator"}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {user?.email || "admin@fedu.vn"}
                          </div>
                        </div>
                      </div>
                      <div className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold bg-secondary text-secondary-foreground rounded-md">
                        <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-primary" />
                        Quản trị viên
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="py-1.5 bg-popover">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          navigate("/admin/profile");
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-foreground hover:bg-accent text-sm transition-colors text-left border-0 cursor-pointer bg-transparent"
                      >
                        <UserCircle className="w-4 h-4 text-muted-foreground" />
                        Thông tin cá nhân
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-destructive hover:bg-destructive/10 text-sm font-medium transition-colors text-left border-0 cursor-pointer bg-transparent"
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
        <main className="flex-1 overflow-auto bg-background text-foreground border-l border-border">
          <div className="max-w-7xl mx-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}