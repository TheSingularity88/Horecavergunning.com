'use client';

import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/app/lib/utils/cn';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, ...props }, ref) => {
    return (
      // className sizes the WHOLE control, not the inner <select>. It must land
      // on this wrapper: the wrapper is the flex/grid item, and it is also what
      // the absolutely-positioned chevron is anchored to. Putting a width on
      // the inner select instead left this wrapper at w-full, which ate the
      // whole flex row (collapsing sibling content to 0px) and stranded the
      // chevron at the far edge. w-full stays the default so form layouts
      // still fill their cell; twMerge lets a passed w-* win.
      <div className={cn('w-full', className)}>
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            className={cn(
              'block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 appearance-none',
              'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent',
              'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
              'transition-colors duration-200',
              error && 'border-red-500 focus:ring-red-500'
            )}
            ref={ref}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
        {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
