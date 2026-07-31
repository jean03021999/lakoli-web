import React from 'react';
import * as Icons from 'lucide-react';

interface MetricCardProps {
  iconName: keyof typeof Icons;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  trendType?: 'up' | 'down' | 'neutral';
  color?: string;
}

export default function MetricCard({
  iconName,
  title,
  value,
  subtitle,
  trend,
  trendType = 'neutral',
  color = 'text-blue-600 bg-blue-50'
}: MetricCardProps) {
  const Icon = Icons[iconName] as React.ComponentType<{ className?: string }>;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4">
      <div className={`p-3 rounded-xl shrink-0 ${color}`}>
        {Icon && <Icon className="w-6 h-6" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-black text-slate-900 mt-1 tracking-tight truncate">
          {value}
        </p>
        {(subtitle || trend) && (
          <div className="flex items-center gap-1.5 mt-1.5 text-[11px]">
            {trend && (
              <span className={`font-bold shrink-0 ${
                trendType === 'up' ? 'text-emerald-600' :
                trendType === 'down' ? 'text-rose-600' : 'text-slate-500'
              }`}>
                {trend}
              </span>
            )}
            {subtitle && <span className="text-slate-400 font-medium truncate">• {subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
