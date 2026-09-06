import React, { useState } from 'react';
import { formatCurrency } from '../../lib/utils/formatters';

/**
 * Premium Executive LineChart Component
 * Renders a silky-smooth cubic Bezier spline with gradient area fill,
 * crisp Y-axis currency scale, dashed gridlines, and interactive hover tooltip.
 */
export function LineChart({
  data = [],
  height = 210,
  isCurrency = true,
  lineColor = '#714B67',
  areaColor = '#714B67',
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div
        className="w-full flex items-center justify-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200"
        style={{ height }}
      >
        No historical payroll trend data available
      </div>
    );
  }

  // Coordinate geometry inside SVG viewBox
  const viewBoxW = 560;
  const viewBoxH = 190;
  const marginLeft = 56;
  const marginRight = 24;
  const marginTop = 20;
  const marginBottom = 34;

  const plotW = viewBoxW - marginLeft - marginRight;
  const plotH = viewBoxH - marginTop - marginBottom;
  const bottomY = marginTop + plotH;

  const values = data.map((d) => Number(d.value || 0));
  const rawMax = Math.max(...values, 1);
  // Give 15% headroom above highest value for aesthetics
  const maxVal = Math.ceil((rawMax * 1.15) / 1000) * 1000 || 1000;
  const minVal = 0;
  const range = maxVal - minVal;

  // Compute (x, y) coordinates
  const points = data.map((d, index) => {
    const x =
      data.length === 1
        ? marginLeft + plotW / 2
        : marginLeft + (index / (data.length - 1)) * plotW;
    const val = Number(d.value || 0);
    const y = bottomY - ((val - minVal) / range) * plotH;
    return { x, y, data: d };
  });

  // Catmull-Rom to Cubic Bezier curve path
  const createCurvedPath = (pts) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;

    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];

      const cp1x = p1.x + (p2.x - p0.x) / 5.5;
      const cp1y = p1.y + (p2.y - p0.y) / 5.5;
      const cp2x = p2.x - (p3.x - p1.x) / 5.5;
      const cp2y = p2.y - (p3.y - p1.y) / 5.5;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
  };

  const linePath = createCurvedPath(points);
  const areaPath =
    points.length > 1
      ? `${linePath} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`
      : '';

  // 4 Y-axis tick intervals
  const yTicks = [0, 0.33, 0.67, 1].map((ratio) => {
    const val = Math.round(minVal + ratio * range);
    const yPos = bottomY - ratio * plotH;
    let label = `${val}`;
    if (isCurrency) {
      if (val >= 100000) {
        label = `₹${(val / 100000).toFixed(1)}L`;
      } else if (val >= 1000) {
        label = `₹${Math.round(val / 1000)}k`;
      } else {
        label = `₹${val}`;
      }
    }
    return { val, yPos, label };
  });

  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div className="w-full relative select-none flex flex-col justify-between" style={{ height }}>
      <div className="relative w-full h-full">
        <svg
          className="w-full h-full overflow-visible"
          viewBox={`0 0 ${viewBoxW} ${viewBoxH}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="payrollTrendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={areaColor} stopOpacity="0.25" />
              <stop offset="85%" stopColor={areaColor} stopOpacity="0.04" />
              <stop offset="100%" stopColor={areaColor} stopOpacity="0.0" />
            </linearGradient>

            <filter id="lineGlow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor={lineColor} floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Horizontal Reference Gridlines & Y-axis labels */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={marginLeft}
                y1={tick.yPos}
                x2={marginLeft + plotW}
                y2={tick.yPos}
                stroke="#E2E8F0"
                strokeWidth={i === 0 ? '1.2' : '0.9'}
                strokeDasharray={i === 0 ? 'none' : '3 3'}
                opacity={0.8}
              />
              <text
                x={marginLeft - 8}
                y={tick.yPos + 3.5}
                textAnchor="end"
                className="fill-slate-400 text-[10px] font-medium tracking-tight"
              >
                {tick.label}
              </text>
            </g>
          ))}

          {/* Area Fill */}
          {areaPath && <path d={areaPath} fill="url(#payrollTrendGrad)" />}

          {/* Curved Line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke={lineColor}
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#lineGlow)"
              vectorEffect="non-scaling-stroke"
            />
          )}

          {/* Vertical Guide Line on Hover */}
          {activePoint && (
            <line
              x1={activePoint.x}
              y1={marginTop}
              x2={activePoint.x}
              y2={bottomY}
              stroke={lineColor}
              strokeWidth="1.2"
              strokeDasharray="2 2"
              opacity={0.6}
            />
          )}

          {/* Data Points */}
          {points.map((pt, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <g
                key={idx}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Invisible hit target for smooth mouse interaction */}
                <circle cx={pt.x} cy={pt.y} r="16" fill="transparent" />

                {/* Soft outer glow circle */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 7.5 : 5.5}
                  fill={lineColor}
                  opacity={isHovered ? 0.28 : 0.14}
                  className="transition-all duration-200"
                />

                {/* Inner crisp node */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 4.8 : 3.8}
                  fill={lineColor}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="transition-all duration-200"
                />
              </g>
            );
          })}

          {/* X-axis labels */}
          {points.map((pt, idx) => (
            <text
              key={idx}
              x={pt.x}
              y={bottomY + 18}
              textAnchor="middle"
              className={`text-[10px] font-semibold transition-colors duration-150 ${
                hoveredIdx === idx ? 'fill-slate-900 font-bold' : 'fill-slate-500'
              }`}
            >
              {pt.data.label}
            </text>
          ))}
        </svg>

        {/* Dynamic Floating Tooltip */}
        {activePoint && (
          <div
            className="absolute pointer-events-none z-20 transition-all duration-150 -translate-x-1/2"
            style={{
              left: `${(activePoint.x / viewBoxW) * 100}%`,
              top: `${Math.max(4, ((activePoint.y - 12) / viewBoxH) * 100 - 32)}%`,
            }}
          >
            <div className="bg-slate-900/95 backdrop-blur-xs text-white px-3 py-2 rounded-lg shadow-xl border border-slate-700/50 text-left min-w-[130px]">
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">
                {activePoint.data.fullLabel || activePoint.data.label}
              </div>
              <div className="text-xs font-bold text-white tracking-tight flex items-baseline gap-1">
                <span>{isCurrency ? formatCurrency(activePoint.data.value) : activePoint.data.value}</span>
                <span className="text-[9px] font-normal text-slate-400">{activePoint.data.unit || 'net'}</span>
              </div>
              {(activePoint.data.payslipsCount > 0 || activePoint.data.payrunsCount > 0) && (
                <div className="text-[9px] text-slate-300 mt-1 pt-1 border-t border-slate-800 flex items-center gap-1.5 font-medium">
                  {activePoint.data.payrunsCount > 0 && (
                    <span>{activePoint.data.payrunsCount} {activePoint.data.payrunsCount === 1 ? 'payrun' : 'payruns'}</span>
                  )}
                  {activePoint.data.payslipsCount > 0 && (
                    <span>• {activePoint.data.payslipsCount} slips</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
