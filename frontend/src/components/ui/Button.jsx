import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

export const Button = React.forwardRef(({
  children,
  className,
  variant = 'primary',
  size = 'sm',
  isLoading = false,
  disabled = false,
  icon: Icon,
  type = 'button',
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:pointer-events-none disabled:opacity-50 select-none rounded-md cursor-pointer';

  const variants = {
    primary: 'bg-[#714B67] hover:bg-[#5B3B52] text-white shadow-xs active:bg-[#482E41]',
    secondary: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-xs',
    outline: 'border border-[#714B67] text-[#714B67] hover:bg-[#714B67]/5',
    ghost: 'text-slate-700 hover:bg-slate-100',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-xs',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs',
    subtle: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
  };

  const sizes = {
    xs: 'text-xs px-2 py-1 gap-1',
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-3.5 py-2 gap-2',
    lg: 'text-base px-4 py-2.5 gap-2',
  };

  return (
    <button
      ref={ref}
      type={type}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : Icon ? (
        <Icon className="w-3.5 h-3.5 shrink-0" />
      ) : null}
      {children}
    </button>
  );
});

Button.displayName = 'Button';
