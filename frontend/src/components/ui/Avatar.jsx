import React from 'react';
import { cn } from '../../lib/utils/cn';

export function Avatar({ name = '', src = '', size = 'md', className }) {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm font-semibold',
    xl: 'w-14 h-14 text-base font-bold',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover shrink-0', sizes[size], className)}
      />
    );
  }

  // Consistent background color based on name hash
  const colors = [
    'bg-violet-100 text-violet-700',
    'bg-indigo-100 text-indigo-700',
    'bg-sky-100 text-sky-700',
    'bg-teal-100 text-teal-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
  ];
  const charCodeSum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorClass = colors[charCodeSum % colors.length];

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-medium shrink-0 select-none',
        sizes[size],
        colorClass,
        className
      )}
    >
      {initials}
    </div>
  );
}
