import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, BookOpen, Upload, BarChart3, Settings, GraduationCap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getFullName, getInitials } from '../../utils/userHelpers';
import logo from '../../assets/logo.png';

export function StudentLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/student/dashboard' },
    { icon: BookOpen, label: 'My Courses', path: '/student/courses' },
    { icon: Upload, label: 'Submissions', path: '/student/submissions' },
    { icon: BarChart3, label: 'Progress', path: '/student/progress' },
    { icon: Settings, label: 'Settings', path: '/student/profile' },
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <img src={logo} alt="FEdu Logo" className="w-10 h-10 rounded-lg object-cover" />
            <div>
              <div className="text-sm font-bold text-gray-900 leading-tight">
                F<span className="text-[#030213]">Edu</span> Learning
              </div>
              <div className="text-[10px] text-gray-500">Student Portal</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  active
                    ? 'bg-[#030213]/5 text-[#030213]'
                    : 'text-gray-700 hover:bg-gray-150'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#030213]/10 flex items-center justify-center">
              <span className="text-[#030213] font-semibold text-sm">
                {getInitials(user)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {getFullName(user) || 'Student'}
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

      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}