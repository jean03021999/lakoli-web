import React, { useState } from 'react';
import { School } from '../types';
import MetricCard from './MetricCard';
import { FORMAT_GNF } from '../data';
import { Building, Users, GraduationCap, Coins, Plus, Eye, CheckCircle, ShieldAlert, AlertTriangle, PlusCircle } from 'lucide-react';

interface FounderDashboardProps {
  schools: School[];
  onSelectSchool: (schoolId: string) => void;
  onAddSchool: (newSchool: School) => void;
  onShowNotification: (msg: string, type: 'success' | 'info') => void;
}

export default function FounderDashboard({
  schools,
  onSelectSchool,
  onAddSchool,
  onShowNotification
}: FounderDashboardProps) {
  // Local states for simulating a new school setup
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolCity, setNewSchoolCity] = useState('Conakry');
  const [newSchoolPupils, setNewSchoolPupils] = useState('');
  const [newSchoolTeachers, setNewSchoolTeachers] = useState('');

  // Calculate Aggregations
  const totalSchools = schools.length;
  const totalPupils = schools.reduce((sum, s) => sum + s.pupilsCount, 0);
  const totalTeachers = schools.reduce((sum, s) => sum + s.teachersCount, 0);
  const totalRevenue = schools.reduce((sum, s) => sum + s.monthlyRevenue, 0);

  // Status Badge Helper
  const getSubscriptionBadge = (status: 'actif' | 'essai' | 'suspendu') => {
    switch (status) {
      case 'actif':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            ACTIF
          </span>
        );
      case 'essai':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            ESSAI GRATUIT
          </span>
        );
      case 'suspendu':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            SUSPENDU
          </span>
        );
    }
  };

  // Handle Simulated School Creation
  const handleCreateSchoolSim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName || !newSchoolPupils || !newSchoolTeachers) {
      alert('Veuillez remplir tous les champs de simulation.');
      return;
    }

    const pupils = parseInt(newSchoolPupils);
    const teachers = parseInt(newSchoolTeachers);

    if (isNaN(pupils) || isNaN(teachers)) {
      alert('Veuillez entrer des chiffres valides.');
      return;
    }

    const newSchoolObj: School = {
      id: `school-${Date.now()}`,
      name: newSchoolName,
      city: newSchoolCity,
      session: '2026-2027',
      pupilsCount: pupils,
      teachersCount: teachers,
      classesCount: Math.ceil(pupils / 30),
      monthlyRevenue: pupils * 70000, // rough simulation
      subscriptionStatus: 'essai',
      bulletinsPublished: 0,
      bulletinsExpected: pupils,
      latePayments: [],
      pendingEvaluations: [],
      paymentHistory: [
        { month: 'Mai', amount: pupils * 65000 },
        { month: 'Jui', amount: pupils * 68000 },
        { month: 'Jul', amount: pupils * 70000 }
      ],
      recentActivities: [
        {
          id: `act-${Date.now()}`,
          text: `Création de l'établissement par le Fondateur`,
          type: 'admin',
          timeAgo: 'à l\'instant',
          user: 'Fondateur'
        }
      ]
    };

    onAddSchool(newSchoolObj);
    onShowNotification(`L'établissement ${newSchoolName} a été créé dans le réseau consolidé.`, 'success');

    setNewSchoolName('');
    setNewSchoolPupils('');
    setNewSchoolTeachers('');
  };

  return (
    <div className="space-y-6">
      {/* 4 Aggregate Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          iconName="Building"
          title="Établissements gérés"
          value={totalSchools}
          subtitle="Écoles dans le groupe"
          trend="Vue d'ensemble"
          trendType="neutral"
          color="text-slate-600 bg-slate-100"
        />
        <MetricCard
          iconName="Users"
          title="Élèves (Consolidés)"
          value={totalPupils}
          subtitle="Élèves scolarisés"
          trend="+18% de croissance"
          trendType="up"
          color="text-blue-600 bg-blue-50"
        />
        <MetricCard
          iconName="GraduationCap"
          title="Total Enseignants"
          value={totalTeachers}
          subtitle="Enseignants actifs"
          trend="Moyenne 15 élèves / prof"
          trendType="neutral"
          color="text-indigo-600 bg-indigo-50"
        />
        <MetricCard
          iconName="Coins"
          title="Revenus du Groupe (Mois)"
          value={FORMAT_GNF(totalRevenue)}
          subtitle="Encaissé sur le réseau"
          trend="+9.2% de rentabilité"
          trendType="up"
          color="text-emerald-600 bg-emerald-50"
        />
      </div>

      {/* Main Layout: School Performance Table & Quick Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table: List of schools */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-6 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Statut par établissement</h3>
              <p className="text-xs text-slate-500">Suivi consolidé des abonnements et de la scolarité</p>
            </div>
            <span className="text-[10px] font-black tracking-widest bg-slate-100 text-slate-700 uppercase px-3 py-1 rounded-full border border-slate-200">
              {totalSchools} Écoles actives
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Établissement / Ville</th>
                  <th className="py-3 px-4">Élèves</th>
                  <th className="py-3 px-4">Statut LAKOLI</th>
                  <th className="py-3 px-4">Retards</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schools.map((school) => (
                  <tr key={school.id} className="hover:bg-slate-50/70 transition-colors text-xs">
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900 text-sm">{school.name}</div>
                      <div className="text-slate-400 mt-0.5">{school.city}, Guinée</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-bold text-slate-700 font-mono text-sm">
                        {school.pupilsCount}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {getSubscriptionBadge(school.subscriptionStatus)}
                    </td>
                    <td className="py-4 px-4">
                      {school.latePayments.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-rose-800 font-bold bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-200">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {school.latePayments.length} élèves en retard
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-800 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          À jour
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => onSelectSchool(school.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all hover:shadow-xs text-xs cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Consulter
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Simulator Form */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <span className="text-[9px] font-black tracking-widest text-slate-600 uppercase bg-slate-200/60 px-2.5 py-1 rounded">
                Console Fondateur
              </span>
              <h3 className="text-sm font-bold text-slate-800 mt-2">
                Simuler l'ouverture d'un nouvel établissement
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Créez une nouvelle école dans le réseau LAKOLI pour simuler la croissance consolidée des revenus du groupe.
              </p>
            </div>

            <form onSubmit={handleCreateSchoolSim} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Nom de l'établissement :</label>
                <input
                  type="text"
                  placeholder="ex: Lycée LAKOLI - Mamou"
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-900 text-slate-800 placeholder-slate-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Ville :</label>
                <select
                  value={newSchoolCity}
                  onChange={(e) => setNewSchoolCity(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-900 text-slate-800"
                >
                  <option value="Mamou">Mamou</option>
                  <option value="Siguiri">Siguiri</option>
                  <option value="Boké">Boké</option>
                  <option value="Conakry">Conakry</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Effectif élèves :</label>
                  <input
                    type="number"
                    placeholder="ex: 300"
                    value={newSchoolPupils}
                    onChange={(e) => setNewSchoolPupils(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-900 text-slate-800 placeholder-slate-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Enseignants :</label>
                  <input
                    type="number"
                    placeholder="ex: 18"
                    value={newSchoolTeachers}
                    onChange={(e) => setNewSchoolTeachers(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-900 text-slate-800 placeholder-slate-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm mt-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                Intégrer au Groupe LAKOLI
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 text-center text-xs text-slate-400 font-medium">
            LAKOLI Group Cloud Center • Guinée
          </div>
        </div>
      </div>
    </div>
  );
}
