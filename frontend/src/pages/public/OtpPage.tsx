import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { verifyOtp } from '@/features/auth/authApi';
import { useAppDispatch } from '@/app/hooks';
import { loginVerifier } from '@/features/auth/authSlice';
import { useAuth } from '@/hooks/useAuth';

const OTP_LENGTH = 6;

export default function OtpPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { pendingOtpEmail, isAuthenticated, isVerifier } = useAuth();
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!pendingOtpEmail) navigate('/login', { replace: true });
    if (isAuthenticated && isVerifier) navigate('/verify', { replace: true });
  }, [pendingOtpEmail, isAuthenticated, isVerifier, navigate]);

  const focusNext = (index: number) => inputRefs.current[index + 1]?.focus();
  const focusPrev = (index: number) => inputRefs.current[index - 1]?.focus();

  const handleChange = (index: number, value: string) => {
    const char = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    if (char) focusNext(index);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index]) focusPrev(index);
    if (e.key === 'ArrowLeft') focusPrev(index);
    if (e.key === 'ArrowRight') focusNext(index);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    const next = [...digits];
    pasted.split('').forEach((c, i) => { next[i] = c; });
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleSubmit = async () => {
    const otp = digits.join('');
    if (otp.length < OTP_LENGTH) {
      toast.error('Please enter the complete OTP');
      return;
    }
    setLoading(true);
    try {
      const result = await verifyOtp({ email: pendingOtpEmail!, otp });
      dispatch(loginVerifier(result));
      toast.success('Signed in successfully!');
      navigate('/verify');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Invalid OTP';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Verify your identity</h1>
          <p className="mt-1 text-sm text-gray-500">
            Enter the OTP sent to <span className="font-medium text-gray-800">{pendingOtpEmail}</span>
          </p>
        </div>

        <div className="card p-6 sm:p-8 space-y-6">
          <div>
            <p className="mb-4 text-center text-sm font-medium text-gray-700">One-Time Password</p>
            <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="h-12 w-12 rounded-lg border-2 border-gray-300 text-center text-lg font-bold text-gray-900 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleSubmit}
              disabled={loading || digits.some((d) => !d)}
              className="btn-primary w-full"
            >
              {loading ? <span className="spinner" /> : 'Verify OTP'}
            </button>
            <button
              onClick={() => navigate('/login')}
              className="btn-ghost w-full text-gray-500"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </button>
          </div>

          <p className="text-center text-xs text-gray-400">
            Didn't receive it? Check your spam folder or contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
