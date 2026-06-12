'use client';

import * as React from 'react';
import { format, parse, isValid } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DatePickerFieldProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function DatePickerField({
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled,
  className,
  id,
}: DatePickerFieldProps) {
  const selected = React.useMemo(() => {
    if (!value) return undefined;
    const d = parse(value, 'yyyy-MM-dd', new Date());
    return isValid(d) ? d : undefined;
  }, [value]);

  const handleSelect = (day: Date | undefined) => {
    onChange?.(day ? format(day, 'yyyy-MM-dd') : '');
  };

  return (
    <Popover>
      <PopoverTrigger
        id={id}
        disabled={disabled}
        className={cn(
          'field-input flex items-center gap-2 text-left',
          !value && 'text-gray-400',
          className
        )}
      >
        <CalendarIcon className="h-4 w-4 shrink-0 text-gray-400" />
        {selected ? format(selected, 'dd MMM yyyy') : <span>{placeholder}</span>}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" side="bottom">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          captionLayout="dropdown"
          startMonth={new Date(1990, 0, 1)}
          endMonth={new Date()}
          disabled={(d) => d > new Date()}
        />
      </PopoverContent>
    </Popover>
  );
}
