import React from 'react';
import { X, Send, Check, AlertTriangle, FileText, Bell, GraduationCap, DollarSign } from 'lucide-react';
import { School, Evaluation, LatePayment } from '../types';
import { FORMAT_GNF } from '../data';

interface InteractiveDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: 'payments' | 'evaluations' | 'bulletins';
  school: School;
  onApproveEvaluation?: (evalId: string) => void;
  onRejectEvaluation?: (evalId: string) => void;
  onSendReminder?: (paymentId: string) => void;
  sentReminders: string[]; // Track which student IDs had reminders sent
}

export default function InteractiveDrawer({
  isOpen,
  onClose,
  title,
  type,
  school,
  onApproveEvaluation,
  onRejectEvaluation,
  onSendReminder,
  sentReminders
}: InteractiveDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer content */}
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div>
            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
              {school.name}
            </span>
            <h2 className="text-base font-black mt-1 tracking-tight">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {type === 'payments' && (
            <div className="space-y-4">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex gap-3 items-start">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-rose-900">Retards Ã  rÃ©gulariser</h4>
                  <p className="text-xs text-rose-700 mt-1 font-medium leading-relaxed">
                    Le non-paiement des frais scolaires perturbe la trÃ©sorerie de l'Ã©tablissement. Relancez les parents directement via SMS/LAKOLI.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Liste des Ã©lÃ¨ves ({school.latePayments.length})
                </h3>

                {school.latePayments.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700">Aucun paiement en retard !</p>
                  </div>
                ) : (
                  school.latePayments.map((p) => {
                    const isSent = sentReminders.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{p.studentName}</span>
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                              {p.className}
                            </span>
                          </div>
                          <p className="text-xs text-rose-600 font-bold mt-1.5">
                            ScolaritÃ© en retard : {FORMAT_GNF(p.amount)}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-slate-500 text-[11px] font-medium">
                            <span className="font-mono">{p.parentContact}</span>
                            <span>â€¢</span>
                            <span className="text-rose-500 font-bold">{p.daysOverdue}j de retard</span>
                          </div>
                        </div>

                        <button
                          onClick={() => onSendReminder?.(p.id)}
                          disabled={isSent}
                          className={`self-start sm:self-center px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            isSent
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-900 text-white hover:bg-slate-800'
                          }`}
                        >
                          {isSent ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              RelancÃ© !
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              Relancer
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {type === 'evaluations' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start">
                <GraduationCap className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-amber-900">Validation PÃ©dagogique</h4>
                  <p className="text-xs text-amber-700 mt-1 font-medium leading-relaxed">
                    VÃ©rifiez la cohÃ©rence du sujet et du barÃ¨me saisis par l'enseignant avant de valider. La validation publie l'Ã©valuation sur l'espace Ã©lÃ¨ve/parent.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Ã‰valuations en attente ({school.pendingEvaluations.length})
                </h3>

                {school.pendingEvaluations.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Check className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-800">Toutes les Ã©valuations sont validÃ©es !</p>
                    <p className="text-xs mt-1">Excellent suivi pÃ©dagogique.</p>
                  </div>
                ) : (
                  school.pendingEvaluations.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 hover:border-slate-300 transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm">{ev.course}</span>
                          <span className="text-[10px] text-slate-400 font-bold">{ev.date}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1.5">
                          Enseignant : <span className="font-bold text-slate-800">{ev.teacherName}</span>
                        </p>
                        <p className="text-xs text-slate-600">
                          Classe : <span className="font-bold text-slate-800">{ev.className}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
                        <button
                          onClick={() => onApproveEvaluation?.(ev.id)}
                          className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approuver
                        </button>
                        <button
                          onClick={() => onRejectEvaluation?.(ev.id)}
                          className="flex-1 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-700 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          Rejeter
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {type === 'bulletins' && (
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3 items-start">
                <FileText className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-emerald-900">Suivi des Bulletins</h4>
                  <p className="text-xs text-emerald-700 mt-1 font-medium leading-relaxed">
                    Ratio actuel : {school.bulletinsPublished} bulletins gÃ©nÃ©rÃ©s sur un total attendu de {school.bulletinsExpected}.
                  </p>
                </div>
              </div>

              {/* Progress visualizer */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>Progression gÃ©nÃ©rale</span>
                  <span>{Math.round((school.bulletinsPublished / school.bulletinsExpected) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-slate-900 rounded-full transition-all duration-500"
                    style={{ width: `${(school.bulletinsPublished / school.bulletinsExpected) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  DÃ©tail par cycle scolaire
                </h3>

                <div className="space-y-2">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Cycle Primaire</span>
                    <span className="font-mono text-slate-400 font-medium">60 / 60 bulletins (TerminÃ©)</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Premier Cycle (CollÃ¨ge)</span>
                    <span className="font-mono text-slate-400 font-medium">52 / 60 bulletins (En cours)</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Second Cycle (LycÃ©e)</span>
                    <span className="font-mono text-slate-400 font-medium">30 / 60 bulletins (En saisie)</span>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => {
                      alert('GÃ©nÃ©ration automatique des bulletins restants lancÃ©e avec succÃ¨s.');
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    GÃ©nÃ©rer les bulletins manquants ({school.bulletinsExpected - school.bulletinsPublished})
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-center text-xs font-medium text-slate-400">
          PropulsÃ© par la plateforme LAKOLI â€¢ Session {school.session}
        </div>
      </div>
    </div>
  );
}

