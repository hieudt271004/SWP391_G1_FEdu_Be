import { Navigate, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { getRedirectPathAfterLogin } from './redirectAfterLogin';

export function GuestOnlyRoute({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-500">Đang tải...</div></div>;
  }
  if (isAuthenticated && user) {
    return <Navigate to={getRedirectPathAfterLogin(user, location)} replace />;
  }
  return <>{children}</>;
}