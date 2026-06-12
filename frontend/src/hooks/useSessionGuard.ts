import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { logout, refreshSession } from '@/features/auth/authSlice';
import { useAuth } from './useAuth';
import { revokeToken, refreshToken } from '@/features/auth/authApi';

const WARNING_BEFORE_EXPIRY_S = 60; // show dialog this many seconds before token expires

export function useSessionGuard() {
  const dispatch = useAppDispatch();
  const { token, expiresAt, isVerifier } = useAuth();

  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(WARNING_BEFORE_EXPIRY_S);

  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAllTimers = useCallback(() => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    warningTimerRef.current = null;
    expiryTimerRef.current = null;
    countdownRef.current = null;
  }, []);

  const performLogout = useCallback(async () => {
    clearAllTimers();
    setShowWarning(false);
    await revokeToken();
    dispatch(logout());
  }, [clearAllTimers, dispatch]);

  const scheduleTimers = useCallback((expAt: number) => {
    clearAllTimers();

    const nowS = Math.floor(Date.now() / 1000);
    const secsUntilExpiry = expAt - nowS;

    if (secsUntilExpiry <= 0) {
      performLogout();
      return;
    }

    const secsUntilWarning = secsUntilExpiry - WARNING_BEFORE_EXPIRY_S;

    const startCountdown = (remaining: number) => {
      setShowWarning(true);
      setSecondsRemaining(remaining);
      countdownRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(countdownRef.current!);
            countdownRef.current = null;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    if (secsUntilWarning > 0) {
      warningTimerRef.current = setTimeout(() => {
        startCountdown(WARNING_BEFORE_EXPIRY_S);
      }, secsUntilWarning * 1000);
    } else {
      // Less than 60s left on mount — show warning immediately
      startCountdown(Math.max(0, secsUntilExpiry));
    }

    // Hard expiry — auto-logout when token expires
    expiryTimerRef.current = setTimeout(() => {
      performLogout();
    }, secsUntilExpiry * 1000);
  }, [clearAllTimers, performLogout]);

  // Re-schedule whenever expiresAt changes (login, refresh, logout)
  useEffect(() => {
    if (!isVerifier || !token || !expiresAt) {
      clearAllTimers();
      setShowWarning(false);
      return;
    }

    const nowS = Math.floor(Date.now() / 1000);
    if (expiresAt <= nowS) {
      performLogout();
      return;
    }

    scheduleTimers(expiresAt);
    return () => clearAllTimers();
  }, [token, expiresAt, isVerifier, scheduleTimers, clearAllTimers, performLogout]);

  const extendSession = useCallback(async () => {
    try {
      const { token: newToken } = await refreshToken();
      dispatch(refreshSession({ token: newToken }));
      setShowWarning(false);
      // scheduleTimers will be called automatically via the useEffect above when expiresAt updates
    } catch {
      // Refresh failed — let the hard expiry timer handle it
    }
  }, [dispatch]);

  const forceLogout = useCallback(() => {
    performLogout();
  }, [performLogout]);

  return { showWarning, secondsRemaining, extendSession, forceLogout };
}
