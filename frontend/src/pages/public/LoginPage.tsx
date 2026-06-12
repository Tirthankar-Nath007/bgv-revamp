import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ShieldCheck, ArrowRight, LogIn } from 'lucide-react';
import { initiateLogin } from '@/features/auth/authApi';
import { useAppDispatch } from '@/app/hooks';
import { setPendingOtp } from '@/features/auth/authSlice';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isVerifier } = useAuth();

  useEffect(() => {
    if (isAuthenticated && isVerifier) navigate('/verify', { replace: true });
  }, [isAuthenticated, isVerifier, navigate]);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await initiateLogin(data);
      dispatch(setPendingOtp(data.email));
      navigate('/otp');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Invalid credentials';
      toast.error(msg);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to your BGV Portal account</p>
        </div>

        <div className="card p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="field-label">Work Email</label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@company.com"
                className="field-input"
                autoComplete="email"
              />
              {errors.email && <p className="field-error">{errors.email.message}</p>}
            </div>

            <div>
              <label className="field-label">Password</label>
              <input
                {...register('password')}
                type="password"
                placeholder="Your password"
                className="field-input"
                autoComplete="current-password"
              />
              {errors.password && <p className="field-error">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting
                ? <span className="spinner" />
                : <><LogIn className="h-4 w-4" /><span>Continue</span><ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <div className="mt-6 space-y-3">
            <div className="relative flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs text-gray-400">or</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>
            <p className="text-center text-sm text-gray-500">
              Don't have an account?{' '}
              <Link to="/" className="font-medium text-primary hover:text-primary-dark">Register here</Link>
            </p>
            <p className="text-center text-sm text-gray-500">
              Are you an admin?{' '}
              <Link to="/admin/login" className="font-medium text-secondary hover:text-secondary-dark">Admin login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
