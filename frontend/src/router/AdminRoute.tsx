import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppDispatch } from '@/app/hooks';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/features/auth/authSlice';
import { isTokenExpired } from '@/utils/token';

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'];

export default function AdminRoute() {
  const dispatch = useAppDispatch();
  const { token, expiresAt, role } = useAuth();
  const location = useLocation();

  if (!token || isTokenExpired(expiresAt) || !role || !ADMIN_ROLES.includes(role)) {
    if (token && isTokenExpired(expiresAt)) {
      dispatch(logout());
    }
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
