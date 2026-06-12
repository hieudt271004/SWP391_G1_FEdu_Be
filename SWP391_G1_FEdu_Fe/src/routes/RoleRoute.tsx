import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/user';
import { getRedirectPathAfterLogin } from './redirectAfterLogin';

interface Props {
  children: ReactNode;
  allowedRoles: UserRole[];
}

export function RoleRoute({ children, allowedRoles }: Props) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const hasPermission = user.roles.some((role) =>
    allowedRoles.includes(role)
  );

  if (!hasPermission) {
    return <Navigate to={getRedirectPathAfterLogin(user)} replace />;  
  }

  return <>{children}</>;
}