import React from 'react';
import { TableSkeleton } from '../loading/Skeleton';
import { EmptyState } from '../empty-state/EmptyState';
import { cn } from '../../lib/utils/cn';

export function DataTable({
  columns = [],
  data = [],
  isLoading = false,
  emptyTitle = 'No data available',
  emptyDescription = 'There are no records to display.',
  onRowClick,
  className,
}) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <TableSkeleton rows={6} cols={columns.length || 4} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div className={cn('w-full bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              {columns.map((col, idx) => (
                <th
                  key={col.key || idx}
                  className={cn(
                    'py-2.5 px-3.5',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                    col.className
                  )}
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, rowIdx) => (
              <tr
                key={row.id || rowIdx}
                onClick={() => onRowClick && onRowClick(row)}
                className={cn(
                  'transition-colors',
                  onRowClick ? 'cursor-pointer hover:bg-slate-50/80' : 'hover:bg-slate-50/40'
                )}
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={col.key || colIdx}
                    className={cn(
                      'py-2.5 px-3.5 text-slate-700 whitespace-nowrap',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                      col.cellClassName
                    )}
                  >
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
