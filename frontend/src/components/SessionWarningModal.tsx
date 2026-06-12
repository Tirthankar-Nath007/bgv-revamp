import { useSessionGuard } from '@/hooks/useSessionGuard';
import { AlertTriangle, LogOut, RefreshCw } from 'lucide-react';

export default function SessionWarningModal() {
  const { showWarning, secondsRemaining, extendSession, forceLogout } = useSessionGuard();

  if (!showWarning) return null;

  const isUrgent = secondsRemaining <= 15;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="card relative w-full max-w-sm p-6 space-y-5">
        {/* Icon + heading */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Session Expiring Soon</h2>
            <p className="mt-1 text-sm text-gray-500">
              Your session will expire in
            </p>
          </div>
        </div>

        {/* Countdown */}
        <div className="flex flex-col items-center gap-1 py-2">
          <span
            className={`text-6xl font-bold tabular-nums transition-colors ${
              isUrgent ? 'text-red-500' : 'text-amber-500'
            }`}
          >
            {secondsRemaining}
          </span>
          <span className="text-sm text-gray-400 font-medium">seconds</span>

          {/* Progress bar */}
          <div className="mt-2 w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                isUrgent ? 'bg-red-500' : 'bg-amber-400'
              }`}
              style={{ width: `${(secondsRemaining / 60) * 100}%` }}
            />
          </div>
        </div>

        <p className="text-xs text-gray-500 text-center">
          Click <span className="font-semibold text-gray-700">Continue Session</span> to stay logged in, or you will be automatically logged out.
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button onClick={forceLogout} className="btn-ghost flex-1 text-red-600 hover:bg-red-50">
            <LogOut className="h-4 w-4" />
            Logout
          </button>
          <button onClick={extendSession} className="btn-primary flex-1">
            <RefreshCw className="h-4 w-4" />
            Continue Session
          </button>
        </div>
      </div>
    </div>
  );
}
