import React from 'react';
import * as Icons from 'lucide-react';

interface AlertCardProps {
  iconName: keyof typeof Icons;
  title: string;
  value: string | number;
  badgeLabel: string;
  badgeType: 'success' | 'warning' | 'error' | 'info';
  actionLabel: string;
  onActionClick: () => void;
  statusText?: string;
}

export default function AlertCard({
  iconName,
  title,
  value,
  badgeLabel,
  badgeType,
  actionLabel,
  onActionClick,
  statusText
}: AlertCardProps) {
  const Icon = Icons[iconName] as React.ComponentType<{ className?: string }>;

  const borderColors = {
    success: 'border-l-4 border-l-emerald-500 border-y border-r border-slate-200',
    warning: 'border-l-4 border-l-amber-500 border-y border-r border-slate-200',
    error: 'border-l-4 border-l-rose-500 border-y border-r border-slate-200',
    info: 'border-l-4 border-l-blue-500 border-y border-r border-slate-200'
  };

  const badgeColors = {
    success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    error: 'bg-rose-100 text-rose-800 border-rose-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200'
  };

  const textColors = {
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    error: 'text-rose-600',
    info: 'text-blue-600'
  };

  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full ${borderColors[badgeType]}`}>
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="p-2.5 rounded-lg bg-slate-100 text-slate-800">
            {Icon && <Icon className="w-5 h-5" />}
          </div>
          <span className={`px-2.5 py-0.5 text-[10px] font-black tracking-widest rounded-full uppercase border ${badgeColors[badgeType]}`}>
            {badgeLabel}
          </span>
        </div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</h3>
        <p className={`text-3xl font-black mt-2 tracking-tight ${textColors[badgeType]}`}>
          {value}
        </p>
        {statusText && (
          <p className="text-xs text-slate-500 mt-1 font-medium">{statusText}</p>
        )}
      </div>
      <div className="mt-5 pt-4 border-t border-slate-100">
        <button
          onClick={onActionClick}
          className="text-xs font-bold text-slate-900 underline underline-offset-4 hover:text-slate-600 flex items-center gap-1 group transition-colors"
        >
          {actionLabel}
          <Icons.ArrowRight className="w-3.5 h-3.5 no-underline transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}

