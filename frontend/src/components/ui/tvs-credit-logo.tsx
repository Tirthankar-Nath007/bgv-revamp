import { cn } from '@/lib/utils';

interface TvsCreditLogoProps {
  /** 'dark' = full-colour logo (use on light backgrounds); 'light' = white logo (use on dark backgrounds) */
  variant?: 'dark' | 'light';
  showSubtitle?: boolean;
  subtitle?: string;
  className?: string;
  logoClassName?: string;
}

export function TvsCreditLogo({
  variant = 'dark',
  showSubtitle = false,
  subtitle,
  className,
  logoClassName,
}: TvsCreditLogoProps) {
  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      <img
        src="/tvscredit-logo.png"
        alt="TVS Credit"
        className={cn(
          'h-8 w-auto object-contain',
          variant === 'light' && 'brightness-0 invert',
          logoClassName
        )}
      />
      {showSubtitle && subtitle && (
        <p className={cn(
          'text-xs font-medium leading-none',
          variant === 'light' ? 'text-white/60' : 'text-gray-500'
        )}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
