import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, FileWarning } from 'lucide-react';
import { toast } from 'sonner';
import { submitAppeal } from '@/features/appeals/appealsApi';
import type { ComparisonResult } from '@/features/verify/verifyApi';

const schema = z.object({
  comments: z.string().min(10, 'Please provide at least 10 characters explaining the discrepancy').max(1000),
});

type FormData = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  verificationId: string;
  mismatchedFields: ComparisonResult[];
  onSuccess?: () => void;
}

export default function AppealModal({ isOpen, onClose, verificationId, mismatchedFields, onSuccess }: Props) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  if (!isOpen) return null;

  const onSubmit = async (data: FormData) => {
    try {
      await submitAppeal({
        verificationId,
        comments: data.comments,
        mismatchedFields: mismatchedFields.filter((f) => !f.isMatch).map((f) => ({
          fieldName: f.field,
          verifierValue: f.verifierValue,
          companyValue: f.companyValue,
        })),
      });
      toast.success('Query submitted successfully. HR will review it shortly.');
      reset();
      onClose();
      onSuccess?.();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to submit query';
      toast.error(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="card relative w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileWarning className="h-5 w-5 text-amber-600" />
            <h2 className="text-lg font-bold text-gray-900">Raise a Query</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Mismatched fields */}
        {mismatchedFields.filter((f) => !f.isMatch).length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Mismatched Fields</p>
            <div className="space-y-2">
              {mismatchedFields.filter((f) => !f.isMatch).map((f) => (
                <div key={f.field} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs">
                  <p className="font-medium text-gray-700 capitalize">{f.field.replace(/([A-Z])/g, ' $1')}</p>
                  <div className="mt-1">
                    <span className="text-gray-400">Submitted: </span>
                    <span className="text-gray-900">{f.verifierValue || '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="field-label">Explanation / Comments <span className="text-red-500">*</span></label>
            <textarea
              {...register('comments')}
              rows={4}
              placeholder="Describe why you believe the data is incorrect, referencing your source documents..."
              className="field-input resize-none"
            />
            {errors.comments && <p className="field-error">{errors.comments.message}</p>}
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
              {isSubmitting ? <span className="spinner" /> : 'Submit Query'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
