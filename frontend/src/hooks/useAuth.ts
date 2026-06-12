import { useAppSelector } from '@/app/hooks';
import { isTokenExpired } from '@/utils/token';

export function useAuth() {
  const auth = useAppSelector((s) => s.auth);

  const isAuthenticated = !!auth.token && !isTokenExpired(auth.expiresAt);
  const isAdmin = auth.role === 'ADMIN' || auth.role === 'SUPER_ADMIN' || auth.role === 'HR_MANAGER';
  const isVerifier = auth.role === 'VERIFIER';

  return {
    ...auth,
    isAuthenticated,
    isAdmin,
    isVerifier,
  };
}
