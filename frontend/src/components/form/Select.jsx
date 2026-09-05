import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

export const Select = React.forwardRef(({
  options = [],
  className,
  error,
  placeholder,
  ...props
}, ref) => {
  return (
    <div className="relative flex items-center">
      <select
        ref={ref}
        className={cn(
          'w-full appearance-none bg-white border border-slate-200 rounded-md px-3 py-1.5 pr-8 text-xs text-slate-900 focus:outline-none focus:border-[#714B67] focus:ring-1 focus:ring-[#714B67] transition-all disabled:bg-slate-50 disabled:text-slate-500 shadow-2xs cursor-pointer',
          error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500',
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => {
          const value = typeof opt === 'object' ? opt.value : opt;
          const label = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={value} value={value}>
              {label}
            </option>
          );
        })}
      </select>
      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
    </div>
  );
});

Select.displayName = 'Select';
