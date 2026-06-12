import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { User, ArrowLeft, ArrowRight, Info } from 'lucide-react';
import { toast } from 'sonner';
import { validateEmployee } from '@/features/verify/verifyApi';
import { useAuth } from '@/hooks/useAuth';

const ENTITY_OPTIONS = [
  'TVS Credit Services Ltd.',
  'Harita Receivables and Collection Services LLP',
  'Harita Insurance Broking LLP',
];

const VERIFICATION_COMPANIES = [
  { id: 'TVS Credit Services Ltd.', name: 'TVS Credit Services Ltd.' },
  { id: 'Harita Receivables and Collection Services LLP', name: 'Harita Receivables and Collection Services LLP' },
  { id: 'Harita Insurance Broking LLP', name: 'Harita Insurance Broking LLP' },
];

const schema = z.object({
  entityName: z.string().optional(),
  verifyingForCompany: z.string().optional(),
  employeeId: z.string().min(1, 'Employee ID is required'),
  name: z.string().min(2, 'Full name is required'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  defaultValues: Partial<FormData>;
  onNext: (data: FormData) => void;
  onBack: () => void;
}

export default function StepEmployee({ defaultValues, onNext, onBack }: Props) {
  const { verifier } = useAuth();
  const isBgvAgency = verifier?.isBgvAgency ?? false;

  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const onSubmit = async (data: FormData) => {
    // Conditional required-field checks (Zod schema keeps them optional to avoid hidden-field failures)
    if (isBgvAgency && !data.verifyingForCompany) {
      setError('verifyingForCompany', { message: 'Select a company' });
      return;
    }
    if (!isBgvAgency && !data.entityName) {
      setError('entityName', { message: 'Select an entity' });
      return;
    }

    const entityName = isBgvAgency ? (data.verifyingForCompany ?? '') : (data.entityName ?? '');

    try {
      const result = await validateEmployee({
        employeeId: data.employeeId.trim(),
        name: data.name.trim(),
        entityName,
      });
      if (!result.found) {
        toast.error(result.message || 'Employee not found or name mismatch');
        return;
      }
      onNext({ ...data, entityName });
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { message?: string } } })?.response?.status;
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (status === 403) {
        toast.error(msg ?? 'Your account has been blocked. Please contact the administrator.');
      } else {
        toast.error(msg ?? 'Validation failed. Please try again.');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25 }}
      className="card max-w-2xl mx-auto p-6 sm:p-8 space-y-6"
    >
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
          <User className="h-7 w-7 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Employee Identification</h2>
        <p className="mt-1 text-sm text-gray-500">Step 2 of 4 — Enter details exactly as on the relieving letter</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {isBgvAgency ? (
          <div>
            <label className="field-label">Verifying For <span className="text-red-500">*</span></label>
            <select {...register('verifyingForCompany')} className="field-select">
              <option value="">Select company</option>
              {VERIFICATION_COMPANIES.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.verifyingForCompany && <p className="field-error">{errors.verifyingForCompany.message}</p>}
          </div>
        ) : (
          <div>
            <label className="field-label">Entity Name <span className="text-red-500">*</span></label>
            <select {...register('entityName')} className="field-select">
              <option value="">Select entity</option>
              {ENTITY_OPTIONS.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
            {errors.entityName && <p className="field-error">{errors.entityName.message}</p>}
          </div>
        )}

        <div>
          <label className="field-label">Employee ID <span className="text-red-500">*</span></label>
          <input
            {...register('employeeId')}
            placeholder="e.g., 6002056"
            className="field-input"
          />
          {errors.employeeId && <p className="field-error">{errors.employeeId.message}</p>}
        </div>

        <div>
          <label className="field-label">Full Name <span className="text-red-500">*</span></label>
          <input
            {...register('name')}
            placeholder="e.g., S Sathish"
            className="field-input"
          />
          {errors.name && <p className="field-error">{errors.name.message}</p>}
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <span>After 3 failed attempts, your account will be temporarily blocked for this employee.</span>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onBack} className="btn-secondary flex-1">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
            {isSubmitting ? <span className="spinner" /> : <><span>Validate &amp; Next</span><ArrowRight className="h-4 w-4" /></>}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
