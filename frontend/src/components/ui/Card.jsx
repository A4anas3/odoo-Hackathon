import React from 'react';
import { cn } from '../../lib/utils/cn';

export function Card({ children, className, ...props }) {
  return (
    <div
      className={cn(
        'bg-white border border-slate-200/80 rounded-lg shadow-xs overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, title, subtitle, action, ...props }) {
  return (
    <div
      className={cn(
        'px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2',
        className
      )}
      {...props}
    >
      <div>
        {title && <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>}
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        {children}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardContent({ children, className, ...props }) {
  return (
    <div className={cn('p-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...props }) {
  return (
    <div
      className={cn(
        'px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
