import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, BookOpen, Settings, GraduationCap, MessageSquare, Menu, Sun, Moon, ClipboardCheck } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getFullName, getInitials } from '../../utils/userHelpers';
import logo from '../../assets/logo.png';
import { Sheet, SheetContent, SheetTitle } from '../ui/sheet';

interface SidebarContentProps {
  menuItems: Array<{
    icon: React.ComponentType<any>;
    label: string;
    path: string;
  }>;
  isActive: (path: string) => boolean;
  navigate: (path: string) => void;
  user: any;
  logout: () => void;
  onItemClick?: () => void;
}

function SidebarContent({
  menuItems,
  isActive,
  navigate,
  user,
  logout,
  onItemClick,
}: SidebarContentProps) {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="flex flex-col h-full bg-sidebar">
      {}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src={logo} alt="FEdu Logo" className="w-10 h-10 rounded-lg object-cover" />
          <div>
            <div className="text-sm font-bold text-foreground leading-tight">
              FEdu Learning
            </div>
            <div className="text-[10px] text-muted-foreground">Teacher Portal</div>
          </div>
        </div>
      </div>

      {}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                if (onItemClick) onItemClick();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {}
      <div className="px-4 py-2.5 border-t border-sidebar-border flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Giao diện</span>
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors cursor-pointer border-none bg-transparent"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-foreground font-semibold text-sm">
                {getInitials(user)}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground truncate">
              {getFullName(user) || 'Giáo viên'}
            </div>
            <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
          </div>
        </div>
        <button
          onClick={() => {
            navigate("/");
            setTimeout(() => {
              logout();
            }, 0);
            if (onItemClick) onItemClick();
          }}
          className="w-full px-4 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
        >
          Đăng xuất
        </button>
      </div>
    </div>
  );
}

export function TeacherLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { icon: Home, label: 'Tổng quan', path: '/teacher/dashboard' },
    { icon: BookOpen, label: 'Thư viện Lộ trình', path: '/teacher/courses' },
    { icon: GraduationCap, label: 'Lớp học', path: '/teacher/classes' },
    { icon: ClipboardCheck, label: 'Chấm bài', path: '/teacher/grading' },
    { icon: MessageSquare, label: 'Ticket hỗ trợ', path: '/teacher/tickets' },
    { icon: Settings, label: 'Cài đặt', path: '/teacher/profile' },
  ];

  const isActive = (path: string) => {
    if (path === '/teacher/classes') {
      return location.pathname.startsWith('/teacher/classes') || location.pathname.startsWith('/teacher/classroom-subjects');
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-background overflow-hidden">
      {}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-sidebar border-b border-sidebar-border shrink-0">
        <div className="flex items-center gap-3">
          <img src={logo} alt="FEdu Logo" className="w-8 h-8 rounded-lg object-cover" />
          <div>
            <div className="text-sm font-bold text-foreground leading-tight">
              FEdu Learning
            </div>
            <div className="text-[10px] text-muted-foreground">Teacher Portal</div>
          </div>
        </div>
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <SheetContent side="left" className="w-64 p-0 bg-sidebar">
            <SheetTitle className="sr-only">Menu điều hướng</SheetTitle>
            <SidebarContent
              menuItems={menuItems}
              isActive={isActive}
              navigate={navigate}
              user={user}
              logout={logout}
              onItemClick={() => setIsMobileMenuOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </header>

      {}
      <aside className="hidden md:flex w-64 bg-sidebar border-r border-sidebar-border flex-col h-full shrink-0">
        <SidebarContent
          menuItems={menuItems}
          isActive={isActive}
          navigate={navigate}
          user={user}
          logout={logout}
        />
      </aside>

      {}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}