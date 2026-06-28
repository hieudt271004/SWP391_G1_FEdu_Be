import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, BookOpen, Users, BarChart3, Settings, GraduationCap, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getFullName, getInitials } from '../../utils/userHelpers';
import logo from '../../assets/logo.png';

export function TeacherLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { icon: Home, label: 'Tổng quan', path: '/teacher/dashboard' },
    { icon: BookOpen, label: 'Môn học', path: '/teacher/courses' },
    { icon: GraduationCap, label: 'Lớp học', path: '/teacher/classes' },
    { icon: MessageSquare, label: 'Ticket hỗ trợ', path: '/teacher/tickets' },
    { icon: Settings, label: 'Cài đặt', path: '/teacher/profile' },
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shrink-0">
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <img src={logo} alt="FEdu Logo" className="w-10 h-10 rounded-lg object-cover" />
            <div>
              <div className="text-sm font-bold text-gray-900 leading-tight">
                F<span className="text-indigo-600">Edu</span> Learning
              </div>
              <div className="text-[10px] text-gray-500">Teacher Portal</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  active
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-indigo-600 font-semibold text-sm">
                {getInitials(user)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {getFullName(user) || 'Giáo viên'}
              </div>
              <div className="text-xs text-gray-500 truncate">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}