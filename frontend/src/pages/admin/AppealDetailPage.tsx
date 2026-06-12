import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ArrowLeft, Building2, User, FileText, CheckCircle2, XCircle, Clock, CheckCheck } from 'lucide-react';
import { getAppeal, respondToAppeal } from '@/features/appeals/appealsApi';
import { formatDateTime } from '@/utils/date';

const schema = z.object({
  hrComments: z.string().min(2, 'Response must be at least 2 characters').max(2000),
});
type FormData = z.infer<typeof schema>;

function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase();
  if (s === 'pending') return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
      <Clock className="h-3.5 w-3.5" />Pending Review
    </span>
  );
  if (s === 'completed') return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
      <CheckCheck className="h-3.5 w-3.5" />Completed
    </span>
  );
  return <span className="badge-gray">{status}</span>;
}

export default function AppealDetailPage() {
  const { appealId } = useParams<{ appealId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: appeal, isLoading } = useQuery({
    queryKey: ['appeal', appealId],
    queryFn: () => getAppeal(appealId!),
    enabled: !!appealId,
  });

  const { mutate: respond, isPending } = useMutation({
    mutationFn: ({ comments }: { comments: string }) => respondToAppeal(appealId!, comments),
    onSuccess: () => {
      toast.success('Response submitted — email notification sent to verifier');
      qc.invalidateQueries({ queryKey: ['appeal', appealId] });
      qc.invalidateQueries({ queryKey: ['appeals'] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to submit response';
      toast.error(msg);
    },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => respond({ comments: data.hrComments });

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-6xl">
        <div className="h-8 w-40 skeleton rounded" />
        <div className="card p-6 h-64 skeleton" />
      </div>
    );
  }

  if (!appeal) {
    return (
      <div className="text-center py-16 text-gray-400">
        <FileText className="h-12 w-12 mx-auto mb-3" />
        <p className="font-medium">Appeal not found</p>
      </div>
    );
  }

  const isPending_ = appeal.status?.toLowerCase() === 'pending';

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Back + header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <button onClick={() => navigate('/admin/appeals')} className="btn-ghost mb-2 -ml-2 text-gray-500">
            <ArrowLeft className="h-4 w-4" />
            Back to Appeals
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 font-mono">{appeal.appealId}</h1>
            <StatusBadge status={appeal.status} />
          </div>
          <p className="text-sm text-gray-500 mt-0.5">Submitted {formatDateTime(appeal.createdAt)}</p>
        </div>
      </div>

      {/* Info panels — 2 columns on md+, 1 on mobile */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="card p-4 space-y-2 xl:col-span-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <User className="h-4 w-4 text-primary" />
            Employee
          </div>
          <p className="font-medium text-gray-900">{appeal.employee?.name ?? '—'}</p>
          <p className="text-sm text-gray-500">ID: <span className="font-mono">{appeal.employeeId}</span></p>
          <p className="text-sm text-gray-500">{appeal.employee?.designation}</p>
          <p className="text-sm text-gray-500">{appeal.employee?.department}</p>
        </div>

        <div className="card p-4 space-y-2 xl:col-span-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Building2 className="h-4 w-4 text-secondary" />
            Verifier
          </div>
          <p className="font-medium text-gray-900">{appeal.verifier?.companyName ?? '—'}</p>
          <p className="text-sm text-gray-500">{appeal.verifier?.email}</p>
          <p className="text-sm text-gray-500 mt-1">
            Verification: <span className="font-mono text-xs">{appeal.verification?.verificationId ?? '—'}</span>
          </p>
          <p className="text-sm text-gray-500">
            Match score: <span className="font-medium">{appeal.verification?.matchScore ?? '—'}%</span>
          </p>
        </div>
      </div>

      {/* All verification fields */}
      {(appeal.allComparisonResults?.length ?? 0) > 0 ? (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Verification Fields</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Field</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <span className="flex items-center gap-1"><XCircle className="h-3.5 w-3.5 text-gray-400" />Submitted by Verifier</span>
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-gray-400" />Official Record</span>
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {appeal.allComparisonResults!.map((f) => {
                  const isDisputed = appeal.mismatchedFields?.some(
                    (m) => m.fieldName.toLowerCase() === f.field.toLowerCase()
                  );
                  const rowCls = isDisputed ? 'bg-amber-50/60' : 'hover:bg-gray-50';
                  return (
                    <tr key={f.field} className={rowCls}>
                      <td className="px-3 py-2.5 font-medium text-gray-700 capitalize whitespace-nowrap">
                        {f.field.replace(/([A-Z])/g, ' $1')}
                        {isDisputed && (
                          <span className="ml-2 text-xs rounded-full bg-amber-100 text-amber-700 px-1.5 py-0.5 font-semibold">disputed</span>
                        )}
                      </td>
                      <td className={`px-3 py-2.5 ${isDisputed ? 'text-red-700' : 'text-gray-700'}`}>
                        {f.verifierValue || '—'}
                      </td>
                      <td className={`px-3 py-2.5 ${isDisputed ? 'text-green-700' : 'text-gray-700'}`}>
                        {f.companyValue || '—'}
                      </td>
                      <td className="px-3 py-2.5">
                        {f.isMatch ? (
                          <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5" />Match
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600 text-xs font-medium">
                            <XCircle className="h-3.5 w-3.5" />Mismatch
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (appeal.mismatchedFields?.length ?? 0) > 0 ? (
        /* Fallback: show disputed fields only if full results unavailable */
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Disputed Fields</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Field</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <span className="flex items-center gap-1"><XCircle className="h-3.5 w-3.5 text-red-400" />Submitted by Verifier</span>
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-400" />Official Record</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {appeal.mismatchedFields.map((f) => (
                  <tr key={f.fieldName} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 font-medium text-gray-700 capitalize">
                      {f.fieldName.replace(/([A-Z])/g, ' $1')}
                    </td>
                    <td className="px-3 py-2.5 text-red-700 bg-red-50/50">{f.verifierValue || '—'}</td>
                    <td className="px-3 py-2.5 text-green-700 bg-green-50/50">{f.companyValue || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Verifier explanation */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-2">Verifier's Explanation</h2>
        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{appeal.appealReason}</p>
      </div>

      {/* HR Response section */}
      {!isPending_ ? (
        <div className="card p-5 border-l-4 border-green-400">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-3">
            <h2 className="text-sm font-semibold text-gray-900">HR Response</h2>
            <p className="text-xs text-gray-500">
              Reviewed by admin · {formatDateTime(appeal.reviewedAt)}
            </p>
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {appeal.hrComments ?? appeal.hrResponse ?? '—'}
          </p>
        </div>
      ) : (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Submit HR Response</h2>
          <p className="text-xs text-gray-500 mb-4">
            The verifier will receive an email notification once you submit.
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="field-label">
                Response / Comments <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('hrComments')}
                rows={6}
                placeholder="Provide your official HR response to this query. Be factual and clear."
                className="field-input resize-none"
              />
              {errors.hrComments && <p className="field-error">{errors.hrComments.message}</p>}
            </div>
            <button type="submit" disabled={isPending} className="btn-primary">
              {isPending ? <span className="spinner" /> : 'Submit Response & Notify Verifier'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
