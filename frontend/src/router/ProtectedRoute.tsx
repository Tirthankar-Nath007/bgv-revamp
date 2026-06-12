import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppDispatch } from '@/app/hooks';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/features/auth/authSlice';
import { isTokenExpired } from '@/utils/token';

export default function ProtectedRoute() {
  const dispatch = useAppDispatch();
  const { token, expiresAt, role } = useAuth();
  const location = useLocation();

  if (!token || isTokenExpired(expiresAt) || role !== 'VERIFIER') {
    if (token && isTokenExpired(expiresAt)) {
      dispatch(logout());
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
