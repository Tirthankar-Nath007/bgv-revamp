import { ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>BGV Portal — TVS Credit Services Ltd.</span>
          </div>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} TVS Credit Services. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
