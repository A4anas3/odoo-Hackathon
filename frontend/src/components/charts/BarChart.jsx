import React from 'react';
import { formatCurrency } from '../../lib/utils/formatters';

export function BarChart({ data = [], height = 180, isCurrency = true }) {
  if (!data || data.length === 0) {
    return <div className="h-40 flex items-center justify-center text-xs text-slate-400">No chart data</div>;
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="w-full flex flex-col justify-end pt-4" style={{ height }}>
      <div className="flex items-end justify-between gap-2 h-full pb-6 border-b border-slate-200">
        {data.map((item, idx) => {
          const heightPercent = Math.max(Math.round((item.value / maxValue) * 100), 4);
          return (
            <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
              {/* Tooltip */}
              <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] py-0.5 px-1.5 rounded shadow-sm pointer-events-none whitespace-nowrap z-10">
                {isCurrency ? formatCurrency(item.value) : item.value}
              </div>

              {/* Bar */}
              <div
                className="w-full max-w-[36px] bg-[#714B67] hover:bg-[#5B3B52] rounded-t-sm transition-all duration-300"
                style={{ height: `${heightPercent}%` }}
              />

              {/* Label */}
              <span className="text-[10px] text-slate-500 font-medium mt-2 truncate w-full text-center">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
