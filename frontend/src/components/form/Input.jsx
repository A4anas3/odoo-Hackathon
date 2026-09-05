import React from 'react';
import { cn } from '../../lib/utils/cn';

export const Input = React.forwardRef(({
  className,
  error,
  type = 'text',
  icon: Icon,
  ...props
}, ref) => {
  return (
    <div className="relative flex items-center">
      {Icon && (
        <div className="absolute left-2.5 text-slate-400 pointer-events-none">
          <Icon className="w-4 h-4" />
        </div>
      )}
      <input
        ref={ref}
        type={type}
        className={cn(
          'w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#714B67] focus:ring-1 focus:ring-[#714B67] transition-all disabled:bg-slate-50 disabled:text-slate-500 shadow-2xs',
          Icon && 'pl-8',
          error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500',
          className
        )}
        {...props}
      />
    </div>
  );
});

Input.displayName = 'Input';
