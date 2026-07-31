import React from 'react';
import { School, UserSession } from '../types';
import { School as SchoolIcon, Calendar, Shield, LogOut, CheckCircle, Award } from 'lucide-react';

interface HeaderProps {
  schools: School[];
  activeSchool: School;
  onSchoolChange: (schoolId: string) => void;
  session: UserSession;
  onRoleChange: (role: 'Directeur' | 'Comptable' | 'Fondateur') => void;
  selectedYear: string;
  onYearChange: (year: string) => void;
}

export default function Header({
  schools,
  activeSchool,
  onSchoolChange,
  session,
  onRoleChange,
  selectedYear,
  onYearChange
}: HeaderProps) {
  return (
    <header className="bg-white border border-slate-200 text-slate-800 shadow-xs rounded-2xl p-5 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Branding & School Selection */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2.5 border-r border-slate-200 pr-5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center font-extrabold text-lg tracking-tight text-white shadow-sm">
              L
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900">LAKOLI</span>
              <span className="text-[9px] block text-slate-400 font-extrabold uppercase tracking-widest leading-none mt-0.5">
                Scolaire Pro
              </span>
            </div>
          </div>

          {/* Active School Selector / Context */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="bg-slate-50 px-3.5 py-1.5 rounded-full border border-slate-200 flex items-center gap-1.5">
              <SchoolIcon className="w-3.5 h-3.5 text-slate-500" />
              {session.role === 'Fondateur' ? (
                <div className="text-left">
                  <span className="text-[10px] font-bold text-slate-700">Vue Consolidée Multi-écoles</span>
                </div>
              ) : (
                <select
                  value={activeSchool.id}
                  onChange={(e) => onSchoolChange(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer border-none p-0"
                >
                  {schools.map((sch) => (
                    <option key={sch.id} value={sch.id} className="bg-white text-slate-800">
                      {sch.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Session Selector */}
            <div className="bg-slate-50 px-3.5 py-1.5 rounded-full border border-slate-200 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedYear}
                onChange={(e) => onYearChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer border-none p-0"
              >
                <option value="2026-2027" className="bg-white text-slate-800">2026-2027</option>
                <option value="2025-2026" className="bg-white text-slate-800">2025-2026</option>
                <option value="2024-2025" className="bg-white text-slate-800">2024-2025</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right: User identity & Simulation Toggler */}
        <div className="flex flex-wrap items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
          {/* Simulation Role Switcher */}
          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
            <span className="text-[9px] uppercase font-bold text-slate-500 px-2">Rôle :</span>
            {(['Directeur', 'Comptable', 'Fondateur'] as const).map((role) => (
              <button
                key={role}
                onClick={() => onRoleChange(role)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  session.role === role
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          {/* User Profile Card */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="font-bold text-sm block leading-tight text-slate-900">{session.name}</span>
              <span className="text-[11px] text-slate-500 font-bold flex items-center justify-end gap-1">
                <Shield className="w-3 h-3 text-slate-400" />
                {session.role}
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-700 shadow-xs">
              {session.name.split(' ').map(n => n[0]).join('')}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
