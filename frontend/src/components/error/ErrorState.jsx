import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

export function ErrorState({
  title = 'Failed to load data',
  message = 'An unexpected error occurred while communicating with the server.',
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-3 border border-rose-100">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-semibold text-slate-800 mb-1">{title}</h4>
      <p className="text-xs text-slate-500 max-w-sm mb-4 leading-relaxed">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="secondary" size="sm" icon={RefreshCw}>
          Try Again
        </Button>
      )}
    </div>
  );
}
