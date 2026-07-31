import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  Wallet, 
  TrendingUp, 
  Award, 
  ArrowRight,
  CheckCircle,
  Clock,
  Activity,
  AlertCircle,
  Building2,
  ChevronRight,
  ShieldCheck,
  Eye,
  ArrowLeft,
  DollarSign,
  AlertTriangle,
  BadgeCheck,
  Sparkles
} from 'lucide-react';
import { Student, Teacher, Evaluation } from '../../types';

interface DashboardProps {
  students: Student[];
  teachers: Teacher[];
  evaluations: Evaluation[];
  role: string;
}

export interface Etablissement {
  id: string;
  nom: string;
  commune: string;
  directeur: string;
  eleves: number;
  enseignants: number;
  statutAbonnement: 'actif' | 'essai' | 'suspendu';
  dateEcheance: string;
  revenusMois: number;
  paiementsEnRetard: number;
  retardairesCount: number;
}

export default function Dashboard({ students, teachers, evaluations, role }: DashboardProps) {
  const navigate = useNavigate();

  // Selected establishment for Founder drilldown
  const [selectedEtablissement, setSelectedEtablissement] = useState<Etablissement | null>(null);

  // List of establishments owned by the Founder
  const etablissements: Etablissement[] = [
    {
      id: 'matoto',
      nom: 'Complexe Scolaire LAKOLI Matoto (Siège)',
      commune: 'Matoto, Conakry',
      directeur: 'M. Mamadou Diallo',
      eleves: 450,
      enseignants: 32,
      statutAbonnement: 'actif',
      dateEcheance: '15/10/2026',
      revenusMois: 142500000,
      paiementsEnRetard: 18500000,
      retardairesCount: 5,
    },
    {
      id: 'ratoma',
      nom: 'Groupe Scolaire LAKOLI Ratoma',
      commune: 'Ratoma, Conakry',
      directeur: 'Mme Fatoumata Camara',
      eleves: 320,
      enseignants: 24,
      statutAbonnement: 'actif',
      dateEcheance: '01/12/2026',
      revenusMois: 98000000,
      paiementsEnRetard: 12000000,
      retardairesCount: 3,
    },
    {
      id: 'dixinn',
      nom: 'Collège-Lycée LAKOLI Dixinn',
      commune: 'Dixinn, Conakry',
      directeur: 'M. Alpha Oumar Sow',
      eleves: 210,
      enseignants: 18,
      statutAbonnement: 'essai',
      dateEcheance: '30/08/2026',
      revenusMois: 65000000,
      paiementsEnRetard: 4500000,
      retardairesCount: 1,
    },
    {
      id: 'kaloum',
      nom: 'École Primaire LAKOLI Kaloum',
      commune: 'Kaloum, Conakry',
      directeur: 'M. Sekou Conde',
      eleves: 180,
      enseignants: 14,
      statutAbonnement: 'actif',
      dateEcheance: '15/11/2026',
      revenusMois: 54000000,
      paiementsEnRetard: 8200000,
      retardairesCount: 2,
    },
  ];

  // Aggregated metrics for Founder
  const totalEtablissements = etablissements.length;
  const totalElevesConsolides = etablissements.reduce((acc, curr) => acc + curr.eleves, 0);
  const totalEnseignantsConsolides = etablissements.reduce((acc, curr) => acc + curr.enseignants, 0);
  const revenusConsolidesMois = etablissements.reduce((acc, curr) => acc + curr.revenusMois, 0);

  // Single School Metrics (for Director, Accountant, or Selected Establishment)
  const totalStudents = selectedEtablissement ? selectedEtablissement.eleves : students.length;
  const totalTeachers = selectedEtablissement ? selectedEtablissement.enseignants : teachers.length;
  
  const annualFeePerStudent = 3500000;
  const totalExpected = totalStudents * annualFeePerStudent;
  
  let totalCollected = 0;
  const allPayments: Array<{ studentNom: string; date: string; amount: number; libelle: string }> = [];

  students.forEach(student => {
    student.historiquePaiements.forEach(p => {
      totalCollected += p.montant;
      allPayments.push({
        studentNom: `${student.prenom} ${student.nom}`,
        date: p.date,
        amount: p.montant,
        libelle: p.libelle
      });
    });
  });

  const recentPayments = allPayments
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const recoveryRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

  const totalEvaluations = evaluations.length;
  const pendingValidation = evaluations.filter(e => e.statut === 'SOUMIS').length;

  const recentEvals = [...evaluations]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLIE':
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Publié</span>;
      case 'SOUMIS':
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">Soumis</span>;
      case 'VALIDE':
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Validé</span>;
      case 'REJETE':
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Rejeté</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-50 text-slate-600 border border-slate-200">Brouillon</span>;
    }
  };

  const getAbonnementBadge = (statut: 'actif' | 'essai' | 'suspendu') => {
    switch (statut) {
      case 'actif':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle className="h-3 w-3" /> Actif
          </span>
        );
      case 'essai':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <Clock className="h-3 w-3" /> Essai Gratuit
          </span>
        );
      case 'suspendu':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            <AlertCircle className="h-3 w-3" /> Suspendu
          </span>
        );
    }
  };

  // RENDER FOUNDER MULTI-ESTABLISHMENT CONSOLIDATED VIEW
  if (role === 'FONDATEUR' && !selectedEtablissement) {
    return (
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                Tableau de Bord Fondateur
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-lakoli-navy/10 text-lakoli-navy dark:bg-blue-500/20 dark:text-blue-300 border border-lakoli-navy/20">
                Vue Consolidée Multi-Établissements
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Supervision globale et performances de tous vos établissements gérés sous la plateforme LAKOLI.
            </p>
          </div>
          <div className="text-xs text-slate-400 font-mono bg-white dark:bg-[#1F2937] border border-slate-100 dark:border-slate-800 rounded-lg px-3 py-1.5 shadow-xs">
            Mise à jour : {new Date().toLocaleDateString('fr-FR')} • GMT
          </div>
        </div>

        {/* 4 Cards: Global Aggregate Stats for Founder */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card 1: Total Établissements */}
          <div className="bg-white dark:bg-[#1F2937] rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-xs hover:border-lakoli-navy/30 transition-all">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Établissements Gérés</span>
                <span className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{totalEtablissements}</span>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-lakoli-navy dark:text-blue-400">
                <Building2 className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Réseau scolaire</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> 100% Fonctionnel
              </span>
            </div>
          </div>

          {/* Card 2: Total Élèves (Tous établissements) */}
          <div className="bg-white dark:bg-[#1F2937] rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-xs hover:border-lakoli-navy/30 transition-all">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Élèves (Réseau)</span>
                <span className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{totalElevesConsolides.toLocaleString()}</span>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
                <GraduationCap className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Moyenne par école</span>
              <span className="font-extrabold text-slate-700 dark:text-slate-200">
                {Math.round(totalElevesConsolides / totalEtablissements)} élèves
              </span>
            </div>
          </div>

          {/* Card 3: Total Enseignants */}
          <div className="bg-white dark:bg-[#1F2937] rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-xs hover:border-lakoli-navy/30 transition-all">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Enseignants</span>
                <span className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{totalEnseignantsConsolides}</span>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-500/10 rounded-xl text-purple-600 dark:text-purple-400">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Ratio élèves/prof</span>
              <span className="font-extrabold text-slate-700 dark:text-slate-200">
                ~{(totalElevesConsolides / totalEnseignantsConsolides).toFixed(1)} élèves/prof
              </span>
            </div>
          </div>

          {/* Card 4: Revenus Consolidés du Mois */}
          <div className="bg-white dark:bg-[#1F2937] rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-xs hover:border-lakoli-navy/30 transition-all">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Revenus Consolidés / Mois</span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                  {(revenusConsolidesMois / 1000000).toFixed(1)}M GNF
                </span>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Total exact</span>
              <span className="font-extrabold text-slate-700 dark:text-slate-200">
                {revenusConsolidesMois.toLocaleString()} GNF
              </span>
            </div>
          </div>

        </div>

        {/* Multi-Establishment Table */}
        <div className="bg-white dark:bg-[#1F2937] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Building2 className="h-4 w-4 text-lakoli-navy dark:text-blue-400" />
                Aperçu des Établissements du Réseau
              </h3>
              <p className="text-[11px] text-slate-400">
                Paiements, effectifs et état des abonnements LAKOLI par établissement.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg font-extrabold text-[10px]">
                3 Actifs
              </span>
              <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg font-extrabold text-[10px]">
                1 Essai
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#111827] text-slate-500 dark:text-slate-400 uppercase text-[10px] font-extrabold tracking-wider border-y border-slate-100 dark:border-slate-800">
                  <th className="py-3 px-4">Établissement & Responsable</th>
                  <th className="py-3 px-4">Effectif Élèves</th>
                  <th className="py-3 px-4">Enseignants</th>
                  <th className="py-3 px-4">Statut Abonnement LAKOLI</th>
                  <th className="py-3 px-4">Retards de Paiement</th>
                  <th className="py-3 px-4">Revenus / Mois</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {etablissements.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    
                    {/* Nom + Directeur */}
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-extrabold text-slate-800 dark:text-slate-100 text-xs flex items-center gap-1.5">
                          {e.nom}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {e.commune} • Dir: <span className="font-semibold text-slate-600 dark:text-slate-300">{e.directeur}</span>
                        </p>
                      </div>
                    </td>

                    {/* Élèves */}
                    <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md">
                        {e.eleves} élèves
                      </span>
                    </td>

                    {/* Enseignants */}
                    <td className="py-3.5 px-4 font-medium text-slate-600 dark:text-slate-300">
                      {e.enseignants} profs
                    </td>

                    {/* Badge Abonnement */}
                    <td className="py-3.5 px-4">
                      {getAbonnementBadge(e.statutAbonnement)}
                    </td>

                    {/* Paiements en retard */}
                    <td className="py-3.5 px-4">
                      {e.paiementsEnRetard > 0 ? (
                        <div>
                          <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-xs">
                            {e.paiementsEnRetard.toLocaleString()} GNF
                          </span>
                          <p className="text-[10px] text-slate-400">
                            ({e.retardairesCount} élève{e.retardairesCount > 1 ? 's' : ''} en retard)
                          </p>
                        </div>
                      ) : (
                        <span className="text-emerald-600 font-bold text-[11px] flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> À jour
                        </span>
                      )}
                    </td>

                    {/* Revenus du Mois */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {e.revenusMois.toLocaleString()} GNF
                    </td>

                    {/* Action button */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedEtablissement(e)}
                        className="px-3 py-1.5 bg-lakoli-navy hover:bg-lakoli-navy/90 text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                      >
                        <Eye className="h-3.5 w-3.5" /> Voir le détail
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Financial & LAKOLI License Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Left: Global Fee Recovery */}
          <div className="bg-white dark:bg-[#1F2937] rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <TrendingUp className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white">Synthese du Recouvrement Réseau</h3>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span>Paiements en retard consolidés :</span>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                  {etablissements.reduce((acc, curr) => acc + curr.paiementsEnRetard, 0).toLocaleString()} GNF
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span>Élèves en retard de paiement :</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {etablissements.reduce((acc, curr) => acc + curr.retardairesCount, 0)} élèves
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                <div className="bg-emerald-500 h-full w-[82%]" />
              </div>
              <p className="text-[10px] text-slate-400 text-right">Taux moyen de recouvrement du réseau : 82%</p>
            </div>
          </div>

          {/* Right: Platform Billing Information */}
          <div className="bg-white dark:bg-[#1F2937] rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <BadgeCheck className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white">Licence & Facturation LAKOLI</h3>
            </div>
            <div className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
              <p>
                Abonnement global Groupe Scolaire : <strong className="text-slate-800 dark:text-white">Formule Pro Multi-Établissements</strong>
              </p>
              <p className="text-[11px] text-slate-400">
                Prochain renouvellement global de la licence : <strong>15 Octobre 2026</strong>.
              </p>
              <button 
                onClick={() => navigate('/frais-scolarite')}
                className="mt-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-[11px] transition-all cursor-pointer inline-flex items-center gap-1"
              >
                Accéder à la gestion des factures LAKOLI <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>

        </div>

      </div>
    );
  }

  // RENDER TEACHER SIMPLIFIED DASHBOARD VIEW
  if (role === 'ENSEIGNANT') {
    const currentTeacher = teachers[0]; // M. Camara
    const assignedClasses = currentTeacher?.affectations || [
      { classe: 'Tle Sciences Mathématiques', matiere: 'Physique-Chimie', volumeHoraire: 6 },
      { classe: '10ème Année', matiere: 'Physique-Chimie', volumeHoraire: 4 },
      { classe: '11ème SS', matiere: 'Sciences Physiques', volumeHoraire: 4 }
    ];
    const totalHours = assignedClasses.reduce((acc, curr) => acc + curr.volumeHoraire, 0);
    const teacherEvals = evaluations.slice(0, 4);

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                Tableau de Bord Enseignant
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Espace Pédagogique Enseignant
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Vos classes attribuées, plannings de cours et évaluations en cours de saisie.
            </p>
          </div>
          <div className="text-xs text-slate-400 font-mono bg-white dark:bg-[#1F2937] border border-slate-100 dark:border-slate-800 rounded-lg px-3 py-1.5 shadow-xs">
            Mise à jour : {new Date().toLocaleDateString('fr-FR')} • GMT
          </div>
        </div>

        {/* 3 Stats Cards for Teacher */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white dark:bg-[#1F2937] rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Classes Assignées</span>
                <span className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{assignedClasses.length}</span>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600 dark:text-amber-400">
                <GraduationCap className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              {assignedClasses.map(a => a.classe).join(', ')}
            </p>
          </div>

          <div className="bg-white dark:bg-[#1F2937] rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Volume Horaire</span>
                <span className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{totalHours}h / sem.</span>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              Programme officiel conforme MEPU-A
            </p>
          </div>

          <div className="bg-white dark:bg-[#1F2937] rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Évaluations à Saisir</span>
                <span className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{evaluations.filter(e => e.statut === 'BROUILLON' || e.statut === 'SOUMIS').length}</span>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400">
                <Award className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              Devoirs & Compositions récentes
            </p>
          </div>
        </div>

        {/* Assigned classes detail and recent evaluations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#1F2937] rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2 border-b pb-2">
              <BookOpen className="h-4 w-4 text-amber-500" />
              Mes Affectations de Cours
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {assignedClasses.map((aff, idx) => (
                <div key={idx} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-extrabold text-slate-800 dark:text-slate-100">{aff.classe}</p>
                    <p className="text-[10px] text-slate-400">{aff.matiere}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 font-bold rounded-lg text-slate-700 dark:text-slate-300">
                    {aff.volumeHoraire}h / semaine
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-[#1F2937] rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                Mes Dernières Évaluations
              </h3>
              <button onClick={() => navigate('/notes')} className="text-xs font-bold text-lakoli-navy dark:text-blue-400 hover:underline cursor-pointer">
                Accéder aux notes
              </button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {teacherEvals.map((e) => (
                <div key={e.id} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-extrabold text-slate-800 dark:text-slate-100">{e.libelle}</p>
                    <p className="text-[10px] text-slate-400">{e.classe} • {e.matiere}</p>
                  </div>
                  <div>
                    {getStatusBadge(e.statut)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick action buttons for Teacher */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 relative overflow-hidden shadow-sm">
          <div className="relative z-10 space-y-3">
            <h3 className="text-sm font-black tracking-tight">Raccourcis Enseignant</h3>
            <p className="text-xs text-slate-300 max-w-xl">
              Accédez rapidement à la création de devoirs ou la consultation de vos emplois du temps.
            </p>
            <div className="flex flex-wrap gap-2.5 pt-1">
              <button 
                onClick={() => navigate('/notes/new/saisie')}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer shadow-xs"
              >
                + Saisir un Devoir / Composition
              </button>
              <button 
                onClick={() => navigate('/emploi-du-temps')}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Mon Emploi du Temps
              </button>
              <button 
                onClick={() => navigate('/bulletins')}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Bulletins de mes élèves
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // RENDER DETAILED SINGLE-SCHOOL DASHBOARD VIEW (With return banner for Founder if drilled-down)
  return (
    <div className="space-y-6">
      
      {/* If Founder drilled down into a specific school, show return alert banner */}
      {role === 'FONDATEUR' && selectedEtablissement && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-lakoli-navy text-white rounded-xl">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                Affichage du détail de l'établissement : <span className="text-lakoli-navy dark:text-blue-400">{selectedEtablissement.nom}</span>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Directeur responsable : {selectedEtablissement.directeur} • Effectif : {selectedEtablissement.eleves} élèves
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedEtablissement(null)}
            className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la vue consolidée
          </button>
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            {selectedEtablissement ? selectedEtablissement.nom : 'Tableau de Bord Établissement'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Vue d'ensemble en temps réel des activités administratives et financières.
          </p>
        </div>
        <div className="text-xs text-slate-400 font-mono bg-white dark:bg-[#1F2937] border border-slate-100 dark:border-slate-800 rounded-lg px-3 py-1.5 shadow-xs">
          Mise à jour : {new Date().toLocaleDateString('fr-FR')} • GMT
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Students */}
        <div 
          onClick={() => navigate('/eleves')}
          className="bg-white dark:bg-[#1F2937] rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-xs hover:border-lakoli-navy/30 transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Élèves Inscrits</span>
              <span className="text-3xl font-black text-slate-800 dark:text-white tracking-tight group-hover:text-lakoli-navy transition-colors">{totalStudents}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 group-hover:bg-lakoli-navy/10 group-hover:text-lakoli-navy transition-colors">
              <GraduationCap className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Sessions scolaires actives</span>
            <span className="font-extrabold text-slate-700 dark:text-slate-200">2025-2026</span>
          </div>
        </div>

        {/* Card 2: Teachers */}
        <div 
          onClick={() => navigate('/enseignants')}
          className="bg-white dark:bg-[#1F2937] rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-xs hover:border-lakoli-navy/30 transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Corps Enseignant</span>
              <span className="text-3xl font-black text-slate-800 dark:text-white tracking-tight group-hover:text-lakoli-navy transition-colors">{totalTeachers}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 group-hover:bg-lakoli-navy/10 group-hover:text-lakoli-navy transition-colors">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Contrats actifs</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> 100%
            </span>
          </div>
        </div>

        {/* Card 3: Evaluations */}
        <div 
          onClick={() => navigate('/notes')}
          className="bg-white dark:bg-[#1F2937] rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-xs hover:border-lakoli-navy/30 transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Évaluations</span>
              <span className="text-3xl font-black text-slate-800 dark:text-white tracking-tight group-hover:text-lakoli-navy transition-colors">{totalEvaluations}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 group-hover:bg-lakoli-navy/10 group-hover:text-lakoli-navy transition-colors">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>En attente de validation</span>
            <span className={`font-bold ${pendingValidation > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}>
              {pendingValidation} soumise{pendingValidation > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Card 4: Financial Recovery */}
        <div 
          onClick={() => navigate('/frais-scolarite')}
          className="bg-white dark:bg-[#1F2937] rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-xs hover:border-lakoli-navy/30 transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recouvrement</span>
              <span className="text-3xl font-black text-slate-800 dark:text-white tracking-tight group-hover:text-lakoli-navy transition-colors">{recoveryRate.toFixed(1)}%</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 group-hover:bg-lakoli-navy/10 group-hover:text-lakoli-navy transition-colors">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Total Recouvré</span>
            <span className="font-extrabold text-slate-700 dark:text-slate-200">{totalCollected.toLocaleString()} GNF</span>
          </div>
        </div>
      </div>

      {/* Two Columns Section: Recent Payments & Evaluations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Recent Payments */}
        <div className="bg-white dark:bg-[#1F2937] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs p-5 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-50 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <TrendingUp className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white">Derniers versements enregistrés</h3>
            </div>
            <button 
              onClick={() => navigate('/frais-scolarite')}
              className="text-xs font-bold text-lakoli-navy dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Voir tout <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {recentPayments.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Aucun versement enregistré pour le moment.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentPayments.map((p, idx) => (
                <div key={idx} className="py-3 flex justify-between items-center text-xs">
                  <div className="space-y-0.5">
                    <p className="font-extrabold text-slate-800 dark:text-slate-100">{p.studentNom}</p>
                    <p className="text-[10px] text-slate-400">{p.libelle} • {p.date}</p>
                  </div>
                  <div className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    +{p.amount.toLocaleString()} GNF
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Recent Evaluations Status */}
        <div className="bg-white dark:bg-[#1F2937] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs p-5 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-50 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <Activity className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white">Suivi des dernières évaluations</h3>
            </div>
            <button 
              onClick={() => navigate('/notes')}
              className="text-xs font-bold text-lakoli-navy dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Gérer les notes <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {recentEvals.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Aucune évaluation créée pour le moment.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentEvals.map((e) => (
                <div key={e.id} className="py-3 flex justify-between items-center text-xs">
                  <div className="space-y-0.5">
                    <p className="font-extrabold text-slate-800 dark:text-slate-100">{e.libelle}</p>
                    <p className="text-[10px] text-slate-400">{e.classe} • {e.matiere}</p>
                  </div>
                  <div>
                    {getStatusBadge(e.statut)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Quick Actions Shortcuts */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-4 opacity-5">
          <GraduationCap className="w-48 h-48" />
        </div>
        <div className="relative z-10 space-y-3">
          <h3 className="text-sm font-black tracking-tight">Raccourcis d'administration rapides</h3>
          <p className="text-xs text-slate-300 max-w-xl">
            Accédez directement aux formulaires de saisie ou de configuration pour fluidifier les opérations au sein de l'établissement LAKOLI.
          </p>
          <div className="flex flex-wrap gap-2.5 pt-1">
            {role === 'COMPTABLE' && (
              <>
                <button 
                  onClick={() => navigate('/notes/new/saisie')}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Saisir un Devoir/Composition
                </button>
                <button 
                  onClick={() => navigate('/eleves')}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Enregistrer un Élève
                </button>
              </>
            )}
            <button 
              onClick={() => navigate('/bulletins')}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Calculer les Bulletins
            </button>
            <button 
              onClick={() => navigate('/emploi-du-temps')}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Consulter l'Emploi du Temps
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
