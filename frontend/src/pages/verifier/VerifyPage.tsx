import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import { clsx } from 'clsx';
import StepConsent from '@/components/verify/StepConsent';
import StepEmployee from '@/components/verify/StepEmployee';
import StepEmployment from '@/components/verify/StepEmployment';
import StepResults from '@/components/verify/StepResults';
import { submitVerification, type VerificationResponse } from '@/features/verify/verifyApi';

interface FormData {
  employeeId: string;
  name: string;
  entityName: string;
  verifyingForCompany?: string;
  dateOfJoining: string;
  dateOfLeaving: string;
  designation: string;
  exitReason: string;
}

const STEPS = ['Consent', 'Employee', 'Employment', 'Results'];

export default function VerifyPage() {
  const [step, setStep] = useState(1);
  const [consent, setConsent] = useState(false);
  const [formData, setFormData] = useState<Partial<FormData>>({});
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleEmployeeNext = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(3);
  };

  const handleEmploymentNext = async (data: { dateOfJoining: string; dateOfLeaving: string; designation: string; exitReason: string }) => {
    const merged = { ...formData, ...data } as FormData;
    setFormData(merged);
    setSubmitting(true);
    try {
      const res = await submitVerification({
        employeeId: merged.employeeId!,
        name: merged.name!,
        entityName: merged.entityName!,
        dateOfJoining: merged.dateOfJoining!,
        dateOfLeaving: merged.dateOfLeaving!,
        designation: merged.designation!,
        exitReason: merged.exitReason!,
        consentGiven: true,
      });
      setResult(res);
      setStep(4);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Verification failed';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartOver = () => {
    setStep(1);
    setConsent(false);
    setFormData({});
    setResult(null);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Step indicator */}
      {step < 4 && (
        <div className="mb-8">
          <div className="relative flex items-center justify-between">
            {/* Progress line */}
            <div className="absolute left-0 top-4 h-0.5 w-full bg-gray-200">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
              />
            </div>
            {/* Step dots */}
            {STEPS.map((label, i) => {
              const num = i + 1;
              const done = step > num;
              const active = step === num;
              return (
                <div key={label} className="relative flex flex-col items-center">
                  <div
                    className={clsx(
                      'z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ring-2 transition-all',
                      done && 'bg-primary ring-primary text-white',
                      active && 'bg-white ring-primary text-primary shadow-md shadow-primary/20',
                      !done && !active && 'bg-white ring-gray-200 text-gray-400'
                    )}
                  >
                    {done ? <Check className="h-4 w-4" /> : num}
                  </div>
                  <span className={clsx(
                    'mt-2 hidden text-xs font-medium sm:block',
                    active ? 'text-primary' : 'text-gray-400'
                  )}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step content */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <StepConsent
            key="consent"
            consentGiven={consent}
            onConsentChange={setConsent}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <StepEmployee
            key="employee"
            defaultValues={{ employeeId: formData.employeeId, name: formData.name, entityName: formData.entityName }}
            onNext={handleEmployeeNext}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <StepEmployment
            key="employment"
            defaultValues={{
              dateOfJoining: formData.dateOfJoining,
              dateOfLeaving: formData.dateOfLeaving,
              designation: formData.designation,
              exitReason: formData.exitReason,
            }}
            onNext={handleEmploymentNext}
            onBack={() => setStep(2)}
            isSubmitting={submitting}
          />
        )}
        {step === 4 && result && (
          <StepResults key="results" result={result} onStartOver={handleStartOver} />
        )}
      </AnimatePresence>
    </div>
  );
}
