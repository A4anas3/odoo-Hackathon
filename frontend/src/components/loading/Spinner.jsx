import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

export function Spinner({ size = 'md', className }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className="flex items-center justify-center p-4">
      <Loader2 className={cn('animate-spin text-[#714B67]', sizes[size], className)} />
    </div>
  );
}
