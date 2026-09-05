import React from 'react';
import { cn } from '../../lib/utils/cn';

export function Tabs({ tabs, activeTab, onChange, className }) {
  return (
    <div className={cn('flex border-b border-slate-200 gap-6 overflow-x-auto no-scrollbar', className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'pb-2.5 pt-1 text-xs font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer',
              isActive
                ? 'border-[#714B67] text-[#714B67] font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            )}
          >
            {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
            {tab.label}
            {tab.badge !== undefined && (
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-semibold',
                  isActive ? 'bg-[#714B67]/10 text-[#714B67]' : 'bg-slate-100 text-slate-600'
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
