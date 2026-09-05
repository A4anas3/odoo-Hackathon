import React from 'react';
import { Breadcrumbs } from './Breadcrumbs';
import { cn } from '../../lib/utils/cn';

export function PageContainer({
  title,
  description,
  breadcrumbs,
  actions,
  children,
  className,
}) {
  return (
    <div className={cn('p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-5', className)}>
      {/* Top Header & Breadcrumbs */}
      <div>
        <Breadcrumbs items={breadcrumbs} />
        {(title || actions) && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
            <div>
              {title && <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>}
              {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
            </div>
            {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
          </div>
        )}
      </div>

      {/* Main Page Content */}
      <div className="space-y-4">{children}</div>
    </div>
  );
}
