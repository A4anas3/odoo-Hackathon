import React, { useState } from 'react';
import { formatCurrency } from '../../lib/utils/formatters';

/**
 * Premium Executive BarChart Component
 * Visualizes department compensation with background track columns,
 * smooth rounded gradient bars, top value chips, and rich interactive hover tooltips.
 */
export function BarChart({
  data = [],
  height = 210,
  isCurrency = true,
  barColor = '#714B67',
  gradientTo = '#8E5B82',
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div
        className="w-full flex items-center justify-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200"
        style={{ height }}
      >
        No department compensation data found
      </div>
    );
  }

  // Display top 6 departments
  const displayData = data.slice(0, 6);
  const values = displayData.map((d) => Number(d.value || 0));
  const rawMax = Math.max(...values, 1);
  const maxValue = rawMax * 1.15; // 15% headroom for top value badges

  // Formatter for short value chips
  const formatShort = (val) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${Math.round(val / 1000)}k`;
    return `₹${val}`;
  };

  return (
    <div className="w-full relative select-none flex flex-col justify-between" style={{ height }}>
      {/* Background horizontal guide lines */}
      <div className="absolute inset-x-0 top-6 bottom-8 flex flex-col justify-between pointer-events-none opacity-40">
        <div className="border-b border-dashed border-slate-200 w-full" />
        <div className="border-b border-dashed border-slate-200 w-full" />
        <div className="border-b border-slate-200 w-full" />
      </div>

      {/* Main Bars Container */}
      <div className="relative w-full h-[calc(100%-28px)] flex items-end justify-between gap-2 px-1 pt-4">
        {displayData.map((item, idx) => {
          const val = Number(item.value || 0);
          const heightPercent = Math.max(Math.round((val / maxValue) * 100), 8);
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Value Chip Above Bar */}
              <div
                className={`text-[9px] font-bold tracking-tight mb-1.5 transition-all duration-200 ${
                  isHovered ? 'text-slate-900 scale-105' : 'text-slate-500'
                }`}
              >
                {isCurrency ? formatShort(val) : val}
              </div>

              {/* Bar Column with Soft Background Track */}
              <div className="w-full max-w-[42px] h-[calc(100%-24px)] flex items-end justify-center relative bg-slate-100/70 rounded-t-md p-0.5">
                {/* Active Gradient Bar */}
                <div
                  className={`w-full rounded-t-sm transition-all duration-300 relative ${
                    isHovered ? 'brightness-110 shadow-md scale-[1.02]' : 'opacity-95'
                  }`}
                  style={{
                    height: `${heightPercent}%`,
                    background: `linear-gradient(to top, ${barColor}, ${gradientTo})`,
                  }}
                >
                  {/* Subtle top gloss highlight */}
                  <div className="w-full h-1 bg-white/20 rounded-t-sm" />
                </div>
              </div>

              {/* Floating Tooltip Card */}
              {isHovered && (
                <div className="absolute -top-12 z-30 pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
                  <div className="bg-slate-900/95 backdrop-blur-xs text-white px-3 py-2 rounded-lg shadow-xl border border-slate-700/60 text-left">
                    <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">
                      {item.label}
                    </div>
                    <div className="text-xs font-bold text-white tracking-tight flex items-baseline gap-1">
                      <span>{isCurrency ? formatCurrency(val) : val}</span>
                      {item.percentage && (
                        <span className="text-[10px] text-emerald-400 font-semibold">
                          ({item.percentage}%)
                        </span>
                      )}
                    </div>
                    {item.count > 0 && (
                      <div className="text-[9px] text-slate-300 mt-1 pt-1 border-t border-slate-800 font-medium">
                        {item.count} {item.count === 1 ? 'active contract' : 'active contracts'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* X-axis Labels */}
      <div className="flex items-center justify-between gap-2 border-t border-slate-200/80 pt-1.5 px-1">
        {displayData.map((item, idx) => (
          <div
            key={idx}
            className="flex-1 text-center"
            title={item.label}
          >
            <span
              className={`text-[10px] block truncate transition-colors duration-150 ${
                hoveredIdx === idx ? 'text-slate-900 font-bold' : 'text-slate-500 font-medium'
              }`}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
