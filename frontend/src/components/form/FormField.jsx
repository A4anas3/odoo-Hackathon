import React from 'react';
import { cn } from '../../lib/utils/cn';

export function FormField({ label, error, required, children, className, helperText }) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && (
        <label className="text-xs font-medium text-slate-700 flex items-center gap-1 select-none">
          {label}
          {required && <span className="text-rose-500 font-bold">*</span>}
        </label>
      )}
      {children}
      {error && <span className="text-[11px] text-rose-600 font-medium">{error}</span>}
      {helperText && !error && <span className="text-[11px] text-slate-400">{helperText}</span>}
    </div>
  );
}
