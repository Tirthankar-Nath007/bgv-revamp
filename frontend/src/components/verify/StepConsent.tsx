import { FileCheck2, Shield, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  consentGiven: boolean;
  onConsentChange: (v: boolean) => void;
  onNext: () => void;
}

export default function StepConsent({ consentGiven, onConsentChange, onNext }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25 }}
      className="card max-w-2xl mx-auto p-6 sm:p-8 space-y-6"
    >
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-light">
          <FileCheck2 className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Consent &amp; Authorization</h2>
        <p className="mt-1 text-sm text-gray-500">Step 1 of 4</p>
      </div>

      {/* Notice */}
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-medium">Important Notice</p>
          <p className="mt-1">
            This portal is intended for authorised background verification agencies and future employers.
            Unauthorized access or misuse is strictly prohibited and may result in legal action.
          </p>
        </div>
      </div>

      {/* Terms */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 space-y-2">
        <p className="font-medium text-gray-900 flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Data Usage Agreement
        </p>
        <ul className="list-inside list-disc space-y-1 text-gray-600">
          <li>The candidate has provided written consent for this verification.</li>
          <li>Information will only be used for legitimate employment purposes.</li>
          <li>All data is handled in compliance with applicable privacy regulations.</li>
          <li>Results are confidential and must not be shared with unauthorized parties.</li>
        </ul>
      </div>

      {/* Consent checkbox */}
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-gray-200 p-4 transition hover:border-primary hover:bg-primary-light/30 has-[:checked]:border-primary has-[:checked]:bg-primary-light/30">
        <input
          type="checkbox"
          checked={consentGiven}
          onChange={(e) => onConsentChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-primary"
        />
        <span className="text-sm text-gray-800 leading-relaxed">
          I confirm that I have obtained <strong>explicit written consent</strong> from the candidate and
          agree to the terms of this verification portal.
        </span>
      </label>

      <button
        onClick={onNext}
        disabled={!consentGiven}
        className="btn-primary w-full"
      >
        Proceed to Employee Details
      </button>
    </motion.div>
  );
}
