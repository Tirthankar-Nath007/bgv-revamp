import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Briefcase, ArrowLeft, ArrowRight, Info } from 'lucide-react';
import { DatePickerField } from '@/components/ui/date-picker-field';

const EXIT_REASONS = [
  'Resignation',
  'Group Transfer',
  'Expired',
  'Absconding',
  'Termination',
  'Retirement',
  'Retrenchment',
];

const schema = z.object({
  dateOfJoining: z.string().min(1, 'Date of joining is required'),
  dateOfLeaving: z.string().min(1, 'Date of leaving is required'),
  designation: z.string().min(1, 'Designation is required'),
  exitReason: z.string().min(1, 'Exit reason is required'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  defaultValues: Partial<FormData>;
  onNext: (data: FormData) => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

export default function StepEmployment({ defaultValues, onNext, onBack, isSubmitting: externalSubmitting }: Props) {
  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const loading = isSubmitting || externalSubmitting;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25 }}
      className="card max-w-2xl mx-auto p-6 sm:p-8 space-y-6"
    >
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-100">
          <Briefcase className="h-7 w-7 text-purple-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Employment Details</h2>
        <p className="mt-1 text-sm text-gray-500">Step 3 of 4 — Enter as per the relieving letter</p>
      </div>

      <form onSubmit={handleSubmit(onNext)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="dateOfJoining">Date of Joining <span className="text-red-500">*</span></label>
            <Controller
              name="dateOfJoining"
              control={control}
              render={({ field }) => (
                <DatePickerField
                  id="dateOfJoining"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select date of joining"
                />
              )}
            />
            {errors.dateOfJoining && <p className="field-error">{errors.dateOfJoining.message}</p>}
          </div>

          <div>
            <label className="field-label" htmlFor="dateOfLeaving">Date of Leaving <span className="text-red-500">*</span></label>
            <Controller
              name="dateOfLeaving"
              control={control}
              render={({ field }) => (
                <DatePickerField
                  id="dateOfLeaving"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select date of leaving"
                />
              )}
            />
            {errors.dateOfLeaving && <p className="field-error">{errors.dateOfLeaving.message}</p>}
          </div>

          <div>
            <label className="field-label">Designation <span className="text-red-500">*</span></label>
            <input
              {...register('designation')}
              placeholder="e.g., Executive, Manager"
              className="field-input"
            />
            {errors.designation && <p className="field-error">{errors.designation.message}</p>}
          </div>

          <div>
            <label className="field-label">Exit Reason <span className="text-red-500">*</span></label>
            <select {...register('exitReason')} className="field-select">
              <option value="">Select exit reason</option>
              {EXIT_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            {errors.exitReason && <p className="field-error">{errors.exitReason.message}</p>}
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <span>Designation is case-sensitive. Enter it exactly as it appears on the relieving letter.</span>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onBack} className="btn-secondary flex-1">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? <span className="spinner" /> : <><span>Verify Details</span><ArrowRight className="h-4 w-4" /></>}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
