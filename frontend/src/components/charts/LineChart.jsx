import React from 'react';
import { formatCurrency } from '../../lib/utils/formatters';

export function LineChart({ data = [], height = 180, isCurrency = true }) {
  if (!data || data.length < 2) {
    return <div className="h-40 flex items-center justify-center text-xs text-slate-400">Not enough data</div>;
  }

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values, min + 1);
  const range = max - min;

  const points = data.map((d, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((d.value - min) / range) * 80 - 10;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full flex flex-col justify-between pt-2" style={{ height }}>
      <div className="relative w-full h-[calc(100%-24px)]">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Subtle grid line */}
          <line x1="0" y1="50" x2="100" y2="50" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="2,2" />

          {/* Area fill */}
          <polygon
            points={`0,100 ${points} 100,100`}
            fill="#714B67"
            fillOpacity="0.08"
          />

          {/* Main line */}
          <polyline
            fill="none"
            stroke="#714B67"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
            vectorEffect="non-scaling-stroke"
          />

          {/* Data dots */}
          {data.map((d, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 100 - ((d.value - min) / range) * 80 - 10;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                className="fill-[#714B67] stroke-white stroke-2 cursor-pointer hover:r-4 transition-all"
              >
                <title>{`${d.label}: ${isCurrency ? formatCurrency(d.value) : d.value}`}</title>
              </circle>
            );
          })}
        </svg>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between text-[10px] text-slate-400 font-medium px-1 border-t border-slate-100 pt-1.5">
        {data.map((d, idx) => (
          <span key={idx}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}
