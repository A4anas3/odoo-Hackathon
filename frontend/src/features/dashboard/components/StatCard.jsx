import React from 'react';
import { Card } from '../../../components/ui/Card';
import { cn } from '../../../lib/utils/cn';

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive = true,
  className,
}) {
  return (
    <Card className={cn('p-4 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors', className)}>
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            {title}
          </span>
          <h3 className="text-xl font-bold text-slate-900 mt-1 tracking-tight">{value}</h3>
        </div>
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-[#714B67]/10 flex items-center justify-center text-[#714B67] shrink-0">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={cn(
                'font-semibold text-[11px] px-1.5 py-0.5 rounded',
                trendPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              )}
            >
              {trend}
            </span>
          )}
          {subtitle && <span className="text-slate-400 text-[11px]">{subtitle}</span>}
        </div>
      )}
    </Card>
  );
}
