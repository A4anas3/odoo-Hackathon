import React from 'react';
import { cn } from '../../lib/utils/cn';

export const Checkbox = React.forwardRef(({
  label,
  className,
  id,
  ...props
}, ref) => {
  const inputId = id || Math.random().toString(36).substring(2, 9);

  return (
    <div className={cn('inline-flex items-center gap-2 select-none cursor-pointer', className)}>
      <input
        ref={ref}
        type="checkbox"
        id={inputId}
        className="w-4 h-4 text-[#714B67] bg-white border-slate-300 rounded-sm focus:ring-[#714B67] cursor-pointer"
        {...props}
      />
      {label && (
        <label htmlFor={inputId} className="text-xs text-slate-700 cursor-pointer">
          {label}
        </label>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';
