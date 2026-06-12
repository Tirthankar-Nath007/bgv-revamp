import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Download, FileWarning, RotateCw, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/axios';
import ComparisonTable from './ComparisonTable';
import AppealModal from './AppealModal';
import type { VerificationResponse } from '@/features/verify/verifyApi';

interface Props {
  result: VerificationResponse;
  onStartOver: () => void;
}

function MatchScoreBadge({ score, status }: { score: number; status: string }) {
  if (status === 'MATCH') {
    return (
      <div className="flex flex-col items-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 ring-4 ring-green-200">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <span className="mt-2 text-2xl font-bold text-green-600">{score}%</span>
        <span className="badge-success mt-1">Full Match</span>
      </div>
    );
  }
  if (status === 'PARTIAL_MATCH') {
    return (
      <div className="flex flex-col items-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 ring-4 ring-amber-200">
          <AlertTriangle className="h-10 w-10 text-amber-600" />
        </div>
        <span className="mt-2 text-2xl font-bold text-amber-600">{score}%</span>
        <span className="badge-warning mt-1">Partial Match</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 ring-4 ring-red-200">
        <XCircle className="h-10 w-10 text-red-600" />
      </div>
      <span className="mt-2 text-2xl font-bold text-red-600">{score}%</span>
      <span className="badge-danger mt-1">Mismatch</span>
    </div>
  );
}

export default function StepResults({ result, onStartOver }: Props) {
  const [appealOpen, setAppealOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const hasMismatch = result.comparisonResults.some((r) => !r.isMatch);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await api.get(`/api/reports/generate?verificationId=${result.verificationId}`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bgv-report-${result.verificationId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Report downloaded!');
    } catch {
      toast.error('Failed to generate report. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Result header card */}
      <div className="card p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold text-gray-900">Verification Complete</h2>
            </div>
            <p className="text-sm text-gray-500">
              ID: <span className="font-mono font-medium text-gray-800">{result.verificationId}</span>
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              Employee: <span className="font-medium text-gray-800">{result.employee.name}</span>
              {' · '}
              <span className="font-mono text-xs">{result.employee.employeeId}</span>
            </p>
          </div>
          <MatchScoreBadge score={result.matchScore} status={result.overallStatus} />
        </div>
      </div>

      {/* Comparison table */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Field-by-Field Comparison</h3>
        <ComparisonTable results={result.comparisonResults} />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {hasMismatch && (
          <button onClick={() => setAppealOpen(true)} className="btn-ghost border border-amber-300 text-amber-700 hover:bg-amber-50">
            <FileWarning className="h-4 w-4" />
            Raise Query
          </button>
        )}
        <button onClick={handleDownload} disabled={downloading} className="btn-secondary">
          {downloading ? <span className="spinner" /> : <Download className="h-4 w-4" />}
          Download Report
        </button>
        <button onClick={onStartOver} className="btn-ghost">
          <RotateCw className="h-4 w-4" />
          New Verification
        </button>
      </div>

      {/* Appeal modal */}
      <AppealModal
        isOpen={appealOpen}
        onClose={() => setAppealOpen(false)}
        verificationId={result.verificationId}
        mismatchedFields={result.comparisonResults}
      />
    </motion.div>
  );
}
