import { CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import type { ComparisonResult } from '@/features/verify/verifyApi';

const FIELD_LABELS: Record<string, string> = {
  employeeId: 'Employee ID',
  name: 'Full Name',
  entityName: 'Entity / Business',
  dateOfJoining: 'Date of Joining',
  dateOfLeaving: 'Date of Leaving',
  designation: 'Designation',
  exitReason: 'Exit Reason',
};

interface Props {
  results: ComparisonResult[];
}

export default function ComparisonTable({ results }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      {/* Desktop table */}
      <table className="hidden w-full sm:table">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Field</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Submitted</th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {results.map((row) => (
            <tr key={row.field} className={row.isMatch ? 'bg-green-50/30' : 'bg-red-50/30'}>
              <td className="px-4 py-3 text-sm font-medium text-gray-700">
                {FIELD_LABELS[row.field] ?? row.field}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">{row.verifierValue || '—'}</td>
              <td className="px-4 py-3 text-center">
                <StatusBadge isMatch={row.isMatch} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile cards */}
      <div className="divide-y divide-gray-100 sm:hidden">
        {results.map((row) => (
          <div key={row.field} className={`p-4 ${row.isMatch ? 'bg-green-50/30' : 'bg-red-50/30'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{FIELD_LABELS[row.field] ?? row.field}</span>
              <StatusBadge isMatch={row.isMatch} />
            </div>
            <div className="text-xs mt-1">
              <p className="text-gray-400 mb-0.5">Submitted</p>
              <p className="text-gray-900 font-medium">{row.verifierValue || '—'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ isMatch }: { isMatch: boolean }) {
  if (isMatch) {
    return (
      <span className="badge-success">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Match
      </span>
    );
  }
  return (
    <span className="badge-danger">
      <XCircle className="h-3.5 w-3.5" />
      Mismatch
    </span>
  );
}

export function EmptyField() {
  return (
    <span className="badge-gray">
      <MinusCircle className="h-3.5 w-3.5" />
      Not provided
    </span>
  );
}
