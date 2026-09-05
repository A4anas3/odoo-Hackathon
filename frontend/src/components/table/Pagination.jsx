import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';

export function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
}) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between px-3 py-2.5 bg-white border-t border-slate-200 text-xs text-slate-500">
      <div>
        Showing <span className="font-semibold text-slate-700">{startItem}</span> to{' '}
        <span className="font-semibold text-slate-700">{endItem}</span> of{' '}
        <span className="font-semibold text-slate-700">{totalItems}</span> entries
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="secondary"
          size="xs"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Previous
        </Button>
        <span className="px-2 font-medium text-slate-700">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="secondary"
          size="xs"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
