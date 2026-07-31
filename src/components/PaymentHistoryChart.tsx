import React, { useState } from 'react';
import { MonthlyPaymentHistory } from '../types';
import { FORMAT_GNF } from '../data';

interface PaymentHistoryChartProps {
  history: MonthlyPaymentHistory[];
}

export default function PaymentHistoryChart({ history }: PaymentHistoryChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // SVG Chart layout values
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 40;
  const width = 500;
  const height = 240;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...history.map(d => d.amount), 50000000); // at least 50M for scale
  const roundedMaxVal = Math.ceil(maxVal / 10000000) * 10000000; // round up to nearest 10M

  const getX = (index: number) => {
    const step = chartWidth / (history.length - 0.2);
    return paddingLeft + index * step + step * 0.1;
  };

  const getY = (val: number) => {
    return paddingTop + chartHeight - (val / roundedMaxVal) * chartHeight;
  };

  const barWidth = Math.max(12, (chartWidth / history.length) * 0.5);

  // Y Axis ticks
  const yTicks = 4;
  const tickValues = Array.from({ length: yTicks + 1 }, (_, i) => (roundedMaxVal / yTicks) * i);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col h-full justify-between">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Ã‰volution des encaissements</h3>
            <p className="text-xs text-slate-500">Flux d'Ã©volution mensuel des paiements (GNF)</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-slate-900"></span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Mensuel (GNF)</span>
          </div>
        </div>

        {/* Dynamic Interactive SVG */}
        <div className="relative w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            width="100%"
            height="100%"
            className="overflow-visible select-none"
          >
            {/* Horizontal Grid lines and Y Labels */}
            {tickValues.map((val, i) => {
              const y = getY(val);
              return (
                <g key={val} className="opacity-70">
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={width - paddingRight}
                    y2={y}
                    stroke="#F1F5F9"
                    strokeWidth="1"
                    strokeDasharray={i === 0 ? "0" : "4 4"}
                  />
                  <text
                    x={paddingLeft - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-slate-400 font-mono text-[10px]"
                  >
                    {val === 0 ? '0' : `${(val / 1000000).toFixed(0)}M`}
                  </text>
                </g>
              );
            })}

            {/* Bars */}
            {history.map((data, index) => {
              const x = getX(index);
              const barHeight = (data.amount / roundedMaxVal) * chartHeight;
              const y = getY(data.amount);
              const isHovered = hoveredIndex === index;
              const isLastMonth = index === history.length - 1;

              return (
                <g
                  key={data.month}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="cursor-pointer"
                >
                  {/* Invisible broad hitbox for easier hovering */}
                  <rect
                    x={x - barWidth}
                    y={paddingTop}
                    width={barWidth * 3}
                    height={chartHeight}
                    fill="transparent"
                  />

                  {/* Visual rounded bar */}
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={Math.max(barHeight, 2)}
                    rx="4"
                    fill={isHovered ? '#0F172A' : isLastMonth ? '#0F172A' : '#E2E8F0'}
                    className="transition-all duration-200 hover:opacity-90"
                  />

                  {/* Month Label */}
                  <text
                    x={x + barWidth / 2}
                    y={height - paddingBottom + 20}
                    textAnchor="middle"
                    className={`font-bold text-[10px] ${
                      isHovered || isLastMonth ? 'fill-slate-900 font-black' : 'fill-slate-400'
                    }`}
                  >
                    {data.month.toUpperCase()}
                  </text>
                </g>
              );
            })}

            {/* Bottom X-Axis line */}
            <line
              x1={paddingLeft}
              y1={height - paddingBottom}
              x2={width - paddingRight}
              y2={height - paddingBottom}
              stroke="#E2E8F0"
              strokeWidth="1"
            />
          </svg>

          {/* Interactive Absolute Tooltip */}
          {hoveredIndex !== null && (
            <div
              className="absolute bg-slate-900 text-white rounded-lg p-2.5 shadow-lg border border-slate-800 text-[11px] pointer-events-none transition-all duration-150 z-10"
              style={{
                left: `${(getX(hoveredIndex) / width) * 100}%`,
                bottom: '48%',
                transform: 'translateX(-50%)',
              }}
            >
              <div className="font-semibold uppercase text-slate-400">
                {history[hoveredIndex].month} 2026
              </div>
              <div className="text-sm font-bold text-teal-400 mt-0.5">
                {FORMAT_GNF(history[hoveredIndex].amount)}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Tendance active</span>
        <span className="text-emerald-600 font-bold flex items-center gap-0.5">
          â–² +7.3% vs mois prÃ©cÃ©dent
        </span>
      </div>
    </div>
  );
}

