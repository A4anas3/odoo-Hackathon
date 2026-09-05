import React from 'react';
import { cn } from '../../lib/utils/cn';

const STATUS_CONFIGS = {
  // Common / Employee
  ACTIVE: { label: 'Active', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  INACTIVE: { label: 'Inactive', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
  TERMINATED: { label: 'Terminated', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  ON_LEAVE: { label: 'On Leave', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  PROBATION: { label: 'Probation', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },

  // Payrun / Payslip
  DRAFT: { label: 'Draft', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  CALCULATING: { label: 'Calculating', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  CALCULATED: { label: 'Calculated', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  VALIDATED: { label: 'Validated', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  PAID: { label: 'Paid', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },

  // Time Off / Approvals
  PENDING: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  APPROVED: { label: 'Approved', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  REJECTED: { label: 'Rejected', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },

  // Attendance
  PRESENT: { label: 'Present', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  LATE: { label: 'Late', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  ABSENT: { label: 'Absent', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  OVERTIME: { label: 'Overtime', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  MISSING_CHECKOUT: { label: 'Missing Out', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
};

export function StatusBadge({ status, className }) {
  if (!status) return null;
  const key = String(status).toUpperCase();
  const config = STATUS_CONFIGS[key] || {
    label: status,
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border shrink-0 capitalize leading-none select-none',
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', config.text.replace('text-', 'bg-'))} />
      {config.label}
    </span>
  );
}
