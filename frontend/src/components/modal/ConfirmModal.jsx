import React from 'react';
import { Modal } from './Modal';
import { Button } from '../ui/Button';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  isLoading = false,
}) {
  const icons = {
    danger: <AlertTriangle className="w-5 h-5 text-rose-600" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600" />,
    info: <Info className="w-5 h-5 text-blue-600" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
  };

  const confirmVariants = {
    danger: 'danger',
    warning: 'primary',
    info: 'primary',
    success: 'success',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <div className="flex items-start gap-3.5">
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
            type === 'danger' && 'bg-rose-50',
            type === 'warning' && 'bg-amber-50',
            type === 'info' && 'bg-blue-50',
            type === 'success' && 'bg-emerald-50'
          )}
        >
          {icons[type]}
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-slate-900 mb-1">{title}</h4>
          <p className="text-xs text-slate-500 leading-relaxed">{message}</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onClose} disabled={isLoading}>
          {cancelText}
        </Button>
        <Button
          variant={confirmVariants[type]}
          size="sm"
          onClick={onConfirm}
          isLoading={isLoading}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}
