import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  BookOpen, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  TrendingUp,
  Award,
  Send,
  HelpCircle,
  ShieldAlert,
  Archive
} from 'lucide-react';
import { Evaluation, EvaluationStatus, EvaluationType, Teacher, UserRole } from '../../types';
import { INITIAL_EVALUATIONS } from '../../mockEvaluationsData';
import { AVAILABLE_CLASSES, CLASSES_BY_LEVEL } from '../../mockData';
import { AVAILABLE_SUBJECTS } from '../../mockTeachersData';
import SaisieNotes from './SaisieNotes';
import ValidationNotes from './ValidationNotes';
import { useNavigate } from 'react-router-dom';

interface EvaluationsListeProps {
  role: UserRole;
  teachers: Teacher[];
  evaluations: Evaluation[];
  onDeleteEvaluation: (id: string) => void;
  onUpdateStatus: (id: string, newStatus: EvaluationStatus, comment?: string) => void;
  subView: 'enseignant' | 'direction';
}

export default function EvaluationsListe({
  role,
  teachers,
  evaluations,
  onDeleteEvaluation,
  onUpdateStatus,
  subView
}: EvaluationsListeProps) {
  const navigate = useNavigate();

  // Filter States
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Status mapping colors & labels
  const statusLabels: Record<EvaluationStatus, { text: string; bg: string; textCol: string; border: string }> = {
    BROUILLON: { text: 'Brouillon', bg: 'bg-slate-50', textCol: 'text-slate-600', border: 'border-slate-200' },
    SOUMIS: { text: 'Soumis', bg: 'bg-amber-50', textCol: 'text-amber-700', border: 'border-amber-200' },
    REJETE: { text: 'Rejeté', bg: 'bg-rose-50', textCol: 'text-rose-700', border: 'border-rose-200' },
    VALIDE: { text: 'Validé', bg: 'bg-emerald-50', textCol: 'text-emerald-700', border: 'border-emerald-200' },
    PUBLIE: { text: 'Publié', bg: 'bg-blue-50', textCol: 'text-blue-700', border: 'border-blue-200' },
    ARCHIVE: { text: 'Archivé', bg: 'bg-purple-50', textCol: 'text-purple-700', border: 'border-purple-200' },
  };

  // Type label mapping
  const typeLabels: Record<EvaluationType, string> = {
    DEVOIR: 'Devoir',
    COMPOSITION: 'Composition',
    EXAMEN_BLANC_1: 'Examen Blanc 1',
    EXAMEN_BLANC_2: 'Examen Blanc 2',
  };

  // Statistics calculation
  const totalCount = evaluations.length;
  const pendingCount = evaluations.filter(e => e.statut === 'SOUMIS').length;
  const publishedCount = evaluations.filter(e => e.statut === 'PUBLIE').length;
  const draftCount = evaluations.filter(e => e.statut === 'BROUILLON').length;

  // Handle CRUD actions
  const handleCreateNewClick = () => {
    navigate('/notes/new/saisie');
  };

  const handleEditClick = (evaluation: Evaluation) => {
    // Only allow editing draft or rejected evaluations if role is Comptable/Enseignant
    if (role === 'DIRECTEUR' && !['VALIDE', 'PUBLIE'].includes(evaluation.statut)) {
      alert("Mode lecture seule : Vous ne pouvez pas éditer cette évaluation.");
      return;
    }
    navigate(`/notes/${evaluation.id}/saisie`);
  };

  const handleDeleteClick = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette évaluation définitivement ?")) {
      onDeleteEvaluation(id);
    }
  };

  // Filtered list
  const filteredEvaluations = evaluations.filter(ev => {
    const matchesClass = filterClass === 'all' || ev.classe === filterClass;
    const matchesSubject = filterSubject === 'all' || ev.matiere === filterSubject;
    const matchesPeriod = filterPeriod === 'all' || ev.periode === filterPeriod;
    const matchesStatus = filterStatus === 'all' || ev.statut === filterStatus;
    const matchesQuery = searchQuery === '' || 
      ev.libelle.toLowerCase().includes(searchQuery.toLowerCase()) || 
      ev.code.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesClass && matchesSubject && matchesPeriod && matchesStatus && matchesQuery;
  });

  return (
    <div className="space-y-6">
      
      {/* Header and Mode Toggler for Directorial vs Teacher view */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        
        {/* Module Sub-tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 shrink-0">
          <button
            onClick={() => navigate('/notes')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              subView === 'enseignant'
                ? 'bg-white text-lakoli-navy shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Vue Enseignant (Saisie & Liste)
          </button>
          <button
            onClick={() => navigate('/notes/validation')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              subView === 'direction'
                ? 'bg-white text-lakoli-navy shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Vue Direction (Validation)
            {pendingCount > 0 && (
              <span className="h-2 w-2 rounded-full bg-amber-500 inline-block animate-ping"></span>
            )}
          </button>
        </div>

        {/* Warning Badge if locked in director read-only mode on Teacher view */}
        {subView === 'enseignant' && role === 'DIRECTEUR' && (
          <div className="flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Lecture seule (Directeur). Pour valider, passez sur l'onglet "Vue Direction".</span>
          </div>
        )}
      </div>

      {/* Render validation view if active */}
      {subView === 'direction' ? (
        <ValidationNotes
          evaluations={evaluations}
          onUpdateStatus={onUpdateStatus}
        />
      ) : (
        // Render teacher evaluations list (ECRAN 1)
        <>
          {/* Quick stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-4.5 shadow-sm space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Évaluations Totales</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-slate-800">{totalCount}</span>
                <span className="text-[10px] text-slate-400">gérées</span>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4.5 shadow-sm space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">En attente de validation</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-amber-600">{pendingCount}</span>
                <span className="text-[10px] text-amber-500">soumises</span>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4.5 shadow-sm space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Publications actives</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-blue-600">{publishedCount}</span>
                <span className="text-[10px] text-blue-500">visibles parents</span>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4.5 shadow-sm space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Brouillons de travail</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-slate-500">{draftCount}</span>
                <span className="text-[10px] text-slate-400">non soumis</span>
              </div>
            </div>
          </div>

          {/* Table container & Filters */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            
            {/* Header of Table */}
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
              <div className="space-y-0.5">
                <h3 className="text-sm font-black text-slate-800">Registre des Évaluations scolaires</h3>
                <p className="text-[10px] text-slate-500">Créez et suivez l'avancement des devoirs et compositions.</p>
              </div>

              {/* Nouvelle Évaluation button */}
              {role === 'COMPTABLE' && (
                <button
                  onClick={handleCreateNewClick}
                  className="px-4 py-2 bg-lakoli-navy hover:bg-[#062f59] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer w-full md:w-auto justify-center"
                >
                  <Plus className="h-4 w-4" />
                  Nouvelle évaluation
                </button>
              )}
            </div>

            {/* Filters panel */}
            <div className="p-4 border-b border-slate-100 bg-white grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-center">
              
              {/* Search */}
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher par libellé, code..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-8.5 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-lakoli-navy"
                />
              </div>

              {/* Filter Class */}
              <select
                value={filterClass}
                onChange={e => setFilterClass(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none cursor-pointer"
              >
                <option value="all">Toutes les classes</option>
                {CLASSES_BY_LEVEL.map(group => (
                  <optgroup key={group.level} label={group.label}>
                    {group.classes.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </optgroup>
                ))}
              </select>

              {/* Filter Subject */}
              <select
                value={filterSubject}
                onChange={e => setFilterSubject(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none cursor-pointer"
              >
                <option value="all">Toutes les matières</option>
                {AVAILABLE_SUBJECTS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              {/* Filter Period */}
              <select
                value={filterPeriod}
                onChange={e => setFilterPeriod(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none cursor-pointer"
              >
                <option value="all">Toutes les périodes</option>
                <option value="Trimestre 1">1er Trimestre</option>
                <option value="Trimestre 2">2ème Trimestre</option>
                <option value="Trimestre 3">3ème Trimestre</option>
              </select>

              {/* Filter Status */}
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none cursor-pointer"
              >
                <option value="all">Tous les statuts</option>
                <option value="BROUILLON">Brouillon</option>
                <option value="SOUMIS">Soumis</option>
                <option value="VALIDE">Validé</option>
                <option value="REJETE">Rejeté</option>
                <option value="PUBLIE">Publié</option>
                <option value="ARCHIVE">Archivé</option>
              </select>

            </div>

            {/* List Table */}
            {filteredEvaluations.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <AlertCircle className="h-10 w-10 mx-auto text-slate-300" />
                <p className="text-sm font-black text-slate-700">Aucune évaluation correspondante</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Ajustez vos filtres de recherche ou créez une nouvelle évaluation pour commencer à l'administrer.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-[10px] uppercase font-bold text-slate-400">
                      <th className="py-3 px-5">Code</th>
                      <th className="py-3 px-5">Libellé</th>
                      <th className="py-3 px-5">Type</th>
                      <th className="py-3 px-5">Classe & Matière</th>
                      <th className="py-3 px-5">Date</th>
                      <th className="py-3 px-5">Statut</th>
                      <th className="py-3 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEvaluations.map(ev => {
                      const badge = statusLabels[ev.statut] || statusLabels.BROUILLON;
                      
                      return (
                        <tr key={ev.id} className="hover:bg-slate-50/30 transition-colors">
                          {/* Code */}
                          <td className="py-4 px-5 font-mono text-[10px] font-bold text-slate-500">
                            {ev.code}
                          </td>

                          {/* Libellé with rejects alerts if relevant */}
                          <td className="py-4 px-5">
                            <div>
                              <span className="font-extrabold text-xs text-slate-800 block">{ev.libelle}</span>
                              <span className="text-[10px] text-slate-400 font-medium">{ev.periode}</span>
                            </div>
                          </td>

                          {/* Type */}
                          <td className="py-4 px-5 text-xs font-semibold text-slate-600">
                            {typeLabels[ev.type]}
                          </td>

                          {/* Classe & Matière */}
                          <td className="py-4 px-5 text-xs">
                            <div className="flex flex-col">
                              <span className="font-extrabold text-slate-700">{ev.classe}</span>
                              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                <BookOpen className="h-3 w-3 text-lakoli-navy" />
                                {ev.matiere}
                              </span>
                            </div>
                          </td>

                          {/* Date */}
                          <td className="py-4 px-5 font-mono text-[10px] text-slate-500">
                            {ev.date}
                          </td>

                          {/* Status Badge */}
                          <td className="py-4 px-5">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase inline-block ${badge.bg} ${badge.textCol} ${badge.border}`}>
                              {badge.text}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-5 text-right">
                            <div className="inline-flex items-center gap-2">
                              {/* Edit or input notes action */}
                              {role === 'COMPTABLE' && ['BROUILLON', 'REJETE'].includes(ev.statut) ? (
                                <button
                                  onClick={() => handleEditClick(ev)}
                                  className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                                  title="Saisir / Modifier les notes"
                                >
                                  <Edit className="h-3.5 w-3.5 text-lakoli-navy" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleEditClick(ev)}
                                  className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                                  title="Consulter le détail"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                              )}

                              {/* Delete only drafts */}
                              {role === 'COMPTABLE' && ev.statut === 'BROUILLON' && (
                                <button
                                  onClick={() => handleDeleteClick(ev.id)}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-100 transition-colors cursor-pointer"
                                  title="Supprimer définitivement"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
}
