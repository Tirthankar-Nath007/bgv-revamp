import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ShieldCheck, Lock } from 'lucide-react';
import { adminLogin } from '@/features/auth/authApi';
import { useAppDispatch } from '@/app/hooks';
import { loginAdmin } from '@/features/auth/authSlice';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isAdmin } = useAuth();

  useEffect(() => {
    if (isAuthenticated && isAdmin) navigate('/admin/dashboard', { replace: true });
  }, [isAuthenticated, isAdmin, navigate]);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const result = await adminLogin(data);
      dispatch(loginAdmin(result));
      toast.success(`Welcome, ${result.admin.fullName || result.admin.username}!`);
      navigate('/admin/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Invalid credentials';
      toast.error(msg);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
          <p className="mt-1 text-sm text-gray-400">TVS Credit BGV Administration</p>
        </div>

        <div className="rounded-xl bg-gray-800 p-6 ring-1 ring-gray-700 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Username</label>
              <input
                {...register('username')}
                placeholder="admin"
                className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3.5 py-2.5 text-sm text-white placeholder:text-gray-500 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                autoComplete="username"
              />
              {errors.username && <p className="field-error text-red-400">{errors.username.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Password</label>
              <input
                {...register('password')}
                type="password"
                placeholder="Your password"
                className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3.5 py-2.5 text-sm text-white placeholder:text-gray-500 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                autoComplete="current-password"
              />
              {errors.password && <p className="field-error text-red-400">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting ? <span className="spinner" /> : <><Lock className="h-4 w-4" />Sign in to Admin</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
