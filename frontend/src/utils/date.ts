import { format, parseISO, isValid } from 'date-fns';

export function formatDate(value: string | null | undefined, fmt = 'dd MMM yyyy'): string {
  if (!value) return '—';
  try {
    const d = parseISO(value);
    return isValid(d) ? format(d, fmt) : value;
  } catch {
    return value;
  }
}

export function formatDateTime(value: string | null | undefined): string {
  return formatDate(value, 'dd MMM yyyy, HH:mm');
}
