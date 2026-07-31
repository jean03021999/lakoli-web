import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Send, 
  AlertCircle, 
  Users, 
  TrendingUp, 
  MessageSquare, 
  BookOpen, 
  Calendar,
  Check,
  X,
  Lock,
  CornerDownRight,
  Eye,
  Award
} from 'lucide-react';
import { Evaluation, StudentGrade, Teacher, Student } from '../../types';
import { INITIAL_STUDENTS } from '../../mockData';

interface ValidationNotesProps {
  evaluations: Evaluation[];
  onUpdateStatus: (id: string, newStatus: Evaluation['statut'], comment?: string) => void;
}

export default function ValidationNotes({
  evaluations,
  onUpdateStatus
}: ValidationNotesProps) {
  // Select which evaluation to inspect in details
  const [selectedEvalId, setSelectedEvalId] = useState<string | null>(
    evaluations.find(ev => ev.statut === 'SOUMIS')?.id || evaluations[0]?.id || null
  );

  // Filter evaluations to only show pending submissions ('SOUMIS') or approved ready for publish ('VALIDE')
  const pendingEvals = evaluations.filter(ev => ev.statut === 'SOUMIS');
  const approvedEvals = evaluations.filter(ev => ev.statut === 'VALIDE');
  const historyEvals = evaluations.filter(ev => ['REJETE', 'PUBLIE', 'ARCHIVE'].includes(ev.statut));

  // Active sub-tab in validation dashboard
  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'approved' | 'history'>('pending');

  // Currently selected evaluation
  const activeEval = evaluations.find(ev => ev.id === selectedEvalId);

  // Reject dialog states
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectComment, setRejectComment] = useState('');

  // Helper to calculate statistics of an evaluation
  const getEvalStats = (evaluation: Evaluation) => {
    const presentNotes = evaluation.notes.filter(n => n.statutPresence === 'PRESENT' && n.note !== undefined);
    if (presentNotes.length === 0) return { avg: 0, min: 0, max: 0, rate: 0 };

    const gradesList = presentNotes.map(n => n.note as number);
    const sum = gradesList.reduce((acc, curr) => acc + curr, 0);
    const avg = parseFloat((sum / gradesList.length).toFixed(2));
    const min = Math.min(...gradesList);
    const max = Math.max(...gradesList);

    // Success rate: grades >= barème / 2
    const passThreshold = evaluation.bareme / 2;
    const passes = gradesList.filter(g => g >= passThreshold).length;
    const rate = parseFloat(((passes / gradesList.length) * 100).toFixed(0));

    return { avg, min, max, rate };
  };

  const getStudentInfo = (studentId: string): Student | undefined => {
    return INITIAL_STUDENTS.find(s => s.id === studentId);
  };

  // Status badges mapping
  const statusLabels: Record<Evaluation['statut'], { text: string; bg: string; textCol: string; border: string }> = {
    BROUILLON: { text: 'Brouillon', bg: 'bg-slate-50', textCol: 'text-slate-600', border: 'border-slate-200' },
    SOUMIS: { text: 'En attente', bg: 'bg-amber-50', textCol: 'text-amber-700', border: 'border-amber-200' },
    REJETE: { text: 'Rejeté', bg: 'bg-rose-50', textCol: 'text-rose-700', border: 'border-rose-200' },
    VALIDE: { text: 'Validé', bg: 'bg-emerald-50', textCol: 'text-emerald-700', border: 'border-emerald-200' },
    PUBLIE: { text: 'Publié', bg: 'bg-blue-50', textCol: 'text-blue-700', border: 'border-blue-200' },
    ARCHIVE: { text: 'Archivé', bg: 'bg-purple-50', textCol: 'text-purple-700', border: 'border-purple-200' },
  };

  // Perform Validate Action
  const handleValidate = () => {
    if (!activeEval) return;
    onUpdateStatus(activeEval.id, 'VALIDE');
    setShowRejectBox(false);
  };

  // Perform Reject Action
  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEval || !rejectComment.trim()) return;
    onUpdateStatus(activeEval.id, 'REJETE', rejectComment.trim());
    setShowRejectBox(false);
    setRejectComment('');
  };

  // Perform Publish Action
  const handlePublish = () => {
    if (!activeEval) return;
    onUpdateStatus(activeEval.id, 'PUBLIE');
  };

  // Pick evaluations to show based on active sub tab
  const visibleEvals = 
    activeSubTab === 'pending' ? pendingEvals : 
    activeSubTab === 'approved' ? approvedEvals : 
    historyEvals;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-lakoli-navy text-[#f8fafc]">
          Espace de Validation Directorial
        </span>
        <h2 className="text-xl font-bold text-slate-800 mt-1">Validation & Publication des Notes</h2>
        <p className="text-xs text-slate-500 max-w-xl mt-0.5">
          Examinez les notes soumises par les enseignants, approuvez-les ou rejetez-les en cas d'erreur avant leur publication sur le portail des élèves et parents guinéens.
        </p>
      </div>

      {/* Main Grid: Left side list, Right side detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Evaluation List */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden space-y-3 p-4">
          
          {/* Sub tabs in sidebar */}
          <div className="flex border-b border-slate-100 pb-2 gap-2">
            <button
              onClick={() => {
                setActiveSubTab('pending');
                setSelectedEvalId(pendingEvals[0]?.id || null);
              }}
              className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'pending'
                  ? 'bg-amber-50 text-amber-800 border border-amber-100'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              En attente ({pendingEvals.length})
            </button>
            <button
              onClick={() => {
                setActiveSubTab('approved');
                setSelectedEvalId(approvedEvals[0]?.id || null);
              }}
              className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'approved'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              Prêt à publier ({approvedEvals.length})
            </button>
            <button
              onClick={() => {
                setActiveSubTab('history');
                setSelectedEvalId(historyEvals[0]?.id || null);
              }}
              className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'history'
                  ? 'bg-blue-50 text-blue-800 border border-blue-100'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              Historique
            </button>
          </div>

          {/* Evaluations list items */}
          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {visibleEvals.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <AlertCircle className="h-6 w-6 mx-auto mb-1 text-slate-300" />
                <p className="text-xs font-bold">Aucune évaluation</p>
                <p className="text-[10px] text-slate-400">
                  {activeSubTab === 'pending' 
                    ? 'Aucun devoir en attente de validation.' 
                    : activeSubTab === 'approved'
                      ? 'Aucun devoir validé en attente de publication.'
                      : 'L’historique des évaluations validées est vide.'}
                </p>
              </div>
            ) : (
              visibleEvals.map(ev => {
                const isSelected = ev.id === selectedEvalId;
                const stats = getEvalStats(ev);
                const badge = statusLabels[ev.statut] || statusLabels.BROUILLON;
                
                return (
                  <div
                    key={ev.id}
                    onClick={() => {
                      setSelectedEvalId(ev.id);
                      setShowRejectBox(false);
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'border-lakoli-navy bg-slate-50/70 ring-1 ring-lakoli-navy'
                        : 'border-slate-150 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                        {ev.code}
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${badge.bg} ${badge.textCol} ${badge.border}`}>
                        {badge.text}
                      </span>
                    </div>

                    <h4 className="text-xs font-black text-slate-800 mt-1.5 line-clamp-1">
                      {ev.libelle}
                    </h4>

                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-500 font-medium">
                      <div className="flex items-center gap-1 text-lakoli-navy">
                        <BookOpen className="h-3 w-3" />
                        <span>{ev.matiere}</span>
                      </div>
                      <span className="text-slate-800 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                        {ev.classe}
                      </span>
                    </div>

                    {/* Quick Stats on badge */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                      <span>Moyenne: <strong className="text-slate-600 font-mono font-bold">{stats.avg}/{ev.bareme}</strong></span>
                      <span>Réussite: <strong className="text-slate-600 font-bold">{stats.rate}%</strong></span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Selected Evaluation Detail Panel */}
        <div className="lg:col-span-7 space-y-4">
          {activeEval ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
              
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    CODE: {activeEval.code}
                  </span>
                  <h3 className="text-base font-black text-slate-800">
                    {activeEval.libelle}
                  </h3>
                  
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 font-medium pt-1">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-lakoli-navy" />
                      Matière: <strong className="text-slate-700">{activeEval.matiere}</strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      Période: <strong className="text-slate-700">{activeEval.periode}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Barème Global</span>
                  <span className="text-xl font-black text-lakoli-navy">/ {activeEval.bareme}</span>
                </div>
              </div>

              {/* Statistics Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-150 rounded-xl p-4">
                <div className="text-center p-1 border-r border-slate-200 last:border-0">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase">Moyenne</span>
                  <span className="text-sm font-black font-mono text-slate-800">
                    {getEvalStats(activeEval).avg} / {activeEval.bareme}
                  </span>
                </div>
                <div className="text-center p-1 border-r border-slate-200 last:border-0">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase">Taux de Réussite</span>
                  <span className="text-sm font-black text-emerald-600">
                    {getEvalStats(activeEval).rate}%
                  </span>
                </div>
                <div className="text-center p-1 border-r border-slate-200 last:border-0">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase">Note Minimale</span>
                  <span className="text-sm font-black font-mono text-rose-600">
                    {getEvalStats(activeEval).min} / {activeEval.bareme}
                  </span>
                </div>
                <div className="text-center p-1">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase">Note Maximale</span>
                  <span className="text-sm font-black font-mono text-emerald-600">
                    {getEvalStats(activeEval).max} / {activeEval.bareme}
                  </span>
                </div>
              </div>

              {/* Rejection comment display if currently rejected */}
              {activeEval.statut === 'REJETE' && activeEval.commentaireRejet && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex gap-3">
                  <XCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-rose-800">
                    <span className="font-bold block mb-1">MOTIF DU REJET :</span>
                    "{activeEval.commentaireRejet}"
                  </div>
                </div>
              )}

              {/* Grade detail list */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  Notes nominatives des élèves
                </h4>

                <div className="border border-slate-150 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                  {activeEval.notes.map((g, idx) => {
                    const student = getStudentInfo(g.studentId);
                    const name = student ? `${student.nom.toUpperCase()} ${student.prenom}` : 'Élève inconnu';
                    const mat = student ? student.matricule : '-';
                    const initials = student ? `${student.prenom[0] || ''}${student.nom[0] || ''}` : 'EL';

                    return (
                      <div key={idx} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50/50">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-slate-100 text-[10px] font-extrabold text-lakoli-navy flex items-center justify-center border border-slate-200">
                            {initials.toUpperCase()}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-800 block">{name}</span>
                            <span className="text-[9px] font-mono text-slate-400">{mat}</span>
                          </div>
                        </div>

                        <div>
                          {g.statutPresence === 'PRESENT' ? (
                            <span className="font-extrabold font-mono text-slate-800 text-sm">
                              {g.note} <span className="text-[10px] font-normal text-slate-400">/ {activeEval.bareme}</span>
                            </span>
                          ) : (
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                              g.statutPresence === 'ABSENT_JUSTIFIE'
                                ? 'bg-orange-50 text-orange-700 border border-orange-100'
                                : 'bg-rose-50 text-rose-700 border border-rose-100'
                            }`}>
                              {g.statutPresence === 'ABSENT_JUSTIFIE' ? 'Abs. Justifiée' : 'Abs. Non Justifiée'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ACTION ROW BAR FOR EXECUTIVES */}
              <div className="pt-4 border-t border-slate-100">
                {showRejectBox ? (
                  <form onSubmit={handleRejectSubmit} className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700">
                      <XCircle className="h-4.5 w-4.5" />
                      <span>Rédiger le motif du rejet</span>
                    </div>

                    <textarea
                      required
                      placeholder="Spécifiez clairement pourquoi l’évaluation est rejetée (ex: barème incorrect, notes manquantes, etc.)"
                      value={rejectComment}
                      onChange={e => setRejectComment(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 min-h-[80px] outline-none focus:ring-1 focus:ring-rose-400"
                    />

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowRejectBox(false);
                          setRejectComment('');
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer flex items-center gap-1"
                      >
                        <X className="h-3.5 w-3.5" />
                        Confirmer le rejet
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>Actions d’autorité réservées à la Direction</span>
                    </div>

                    <div className="flex items-center gap-2">
                      
                      {/* Submitting Status: Reject and Approve buttons */}
                      {activeEval.statut === 'SOUMIS' && (
                        <>
                          <button
                            onClick={() => setShowRejectBox(true)}
                            className="px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-150 rounded-xl cursor-pointer transition-colors flex items-center gap-1"
                          >
                            <X className="h-4 w-4" />
                            Rejeter
                          </button>
                          
                          <button
                            onClick={handleValidate}
                            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm"
                          >
                            <Check className="h-4 w-4" />
                            Valider les notes
                          </button>
                        </>
                      )}

                      {/* Approved status: ready to publish button */}
                      {activeEval.statut === 'VALIDE' && (
                        <button
                          onClick={handlePublish}
                          className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <Send className="h-4 w-4" />
                          Publier l’évaluation
                        </button>
                      )}

                      {/* Published / History info label */}
                      {['REJETE', 'PUBLIE', 'ARCHIVE'].includes(activeEval.statut) && (
                        <span className="text-xs font-extrabold text-slate-400 bg-slate-100 px-3 py-2 rounded-lg">
                          Cette évaluation a été traitée
                        </span>
                      )}

                    </div>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-150 shadow-sm p-12 text-center text-slate-400">
              <AlertCircle className="h-10 w-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold">Aucune évaluation sélectionnée</p>
              <p className="text-xs text-slate-400">
                Sélectionnez une évaluation dans le menu de gauche pour afficher ses détails et effectuer les validations.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
