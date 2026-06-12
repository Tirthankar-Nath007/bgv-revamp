import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ShieldCheck, Building2, CheckCircle, ArrowRight } from 'lucide-react';
import { registerVerifier } from '@/features/auth/authApi';

const PERSONAL_DOMAINS = ['gmail', 'yahoo', 'outlook', 'hotmail', 'rediffmail', 'icloud', 'protonmail'];

const schema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters').max(100),
  email: z
    .string()
    .email('Enter a valid email')
    .refine((v) => {
      const domain = v.split('@')[1]?.split('.')[0]?.toLowerCase();
      return domain && !PERSONAL_DOMAINS.includes(domain);
    }, 'Use your official company email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  isBgvAgency: z.boolean(),
});

type FormData = z.infer<typeof schema>;

const features = [
  { icon: ShieldCheck, title: 'Secure Verification', desc: 'JWT-based authentication with encrypted data transmission' },
  { icon: Building2, title: 'Enterprise Ready', desc: 'Designed for BGV agencies and HR departments' },
  { icon: CheckCircle, title: 'Instant Results', desc: 'Real-time comparison with official employment records' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { isBgvAgency: false },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await registerVerifier(data);
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Registration failed';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-primary/80 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* Left: copy */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm backdrop-blur">
                <ShieldCheck className="h-4 w-4 text-green-400" />
                BGV Verification Portal
              </div>
              <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
                Verify Employment<br />
                <span className="text-green-400">Instantly &amp; Securely</span>
              </h1>
              <p className="max-w-md text-lg text-gray-300">
                The official portal for verifying ex-employee records of TVS Credit Services Ltd. and group entities.
              </p>
              <div className="flex flex-wrap gap-4">
                {features.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3 rounded-xl bg-white/10 p-4 backdrop-blur sm:max-w-[220px]">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />
                    <div>
                      <p className="text-sm font-semibold text-white">{title}</p>
                      <p className="text-xs text-gray-300">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: registration card */}
            <div className="card p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Create your account</h2>
                <p className="mt-1 text-sm text-gray-500">Register to start verifying employment records</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="field-label">Company Name</label>
                  <input
                    {...register('companyName')}
                    placeholder="e.g., Acme BGV Solutions"
                    className="field-input"
                  />
                  {errors.companyName && <p className="field-error">{errors.companyName.message}</p>}
                </div>

                <div>
                  <label className="field-label">Work Email</label>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="you@company.com"
                    className="field-input"
                  />
                  {errors.email && <p className="field-error">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="field-label">Password</label>
                  <input
                    {...register('password')}
                    type="password"
                    placeholder="Min. 6 characters"
                    className="field-input"
                  />
                  {errors.password && <p className="field-error">{errors.password.message}</p>}
                </div>

                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
                  <input
                    {...register('isBgvAgency')}
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary accent-primary"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">We are a BGV agency</p>
                    <p className="text-xs text-gray-500">Verifying on behalf of client companies</p>
                  </div>
                </label>

                <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                  {isSubmitting ? <span className="spinner" /> : <><span>Create Account</span><ArrowRight className="h-4 w-4" /></>}
                </button>

                <p className="text-center text-sm text-gray-500">
                  Already have an account?{' '}
                  <Link to="/login" className="font-medium text-primary hover:text-primary-dark">
                    Sign in
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
