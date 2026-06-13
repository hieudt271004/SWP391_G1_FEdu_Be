import { User, UserRole } from '../types/user';
import { Location } from 'react-router-dom';

const ROLE_PRIORITY: { role: UserRole; path: string }[] = [
  { role: 'ADMIN', path: '/admin/dashboard' },
  { role: 'TEACHER', path: '/teacher/dashboard' },
  { role: 'STUDENT', path: '/student/dashboard' },
  { role: 'SUB_MENTOR', path: '/student/dashboard' },
];

export function getRedirectPathAfterLogin(
  user: User,
  location?: Location
): string {
  const from = (location?.state as { from?: Location } | null)?.from;
  if (from?.pathname && from.pathname !== '/login') {
    return from.pathname + (from.search || '');
  }
  for (const { role, path } of ROLE_PRIORITY) {
    if (user.roles.includes(role)) {
      return path;
    }
  }
  return '/';
}