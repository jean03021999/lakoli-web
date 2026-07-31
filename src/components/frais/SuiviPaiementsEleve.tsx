import React, { useState, useEffect } from 'react';
import { 
  User, 
  Search, 
  Layers, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Plus, 
  ArrowRight, 
  DollarSign, 
  Calendar, 
  CreditCard,
  ChevronRight,
  Filter,
  Sparkles,
  Bookmark,
  Check,
  X
} from 'lucide-react';
import { Student, PaymentHistoryItem, UserRole } from '../../types';
import { AVAILABLE_CLASSES, CLASSES_BY_LEVEL } from '../../mockData';
import { ClassFeeGrid, FeeInstallment, FeeType, DEFAULT_FEE_GRIDS } from './GrillesTarifaires';

export interface StudentFeePayment {
  studentId: string;
  typeFrais: FeeType;
  installmentId: string;
  montantPaye: number;
  datePaiement?: string;
  moyenPaiement?: 'Espèces' | 'Chèque' | 'Mobile Money' | 'Virement';
}

const STORAGE_KEY_PAYMENTS = 'lakoli_frais_paiements_v2';
const STORAGE_KEY_GRIDS = 'lakoli_frais_grilles_v1';

// Format helper
const formatGNF = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'GNF', maximumFractionDigits: 0 })
    .format(amount)
    .replace('GNF', 'FG');
};

interface SuiviPaiementsEleveProps {
  students: Student[];
  onUpdateStudent: (updatedStudent: Student) => void;
  role: UserRole;
}

export default function SuiviPaiementsEleve({
  students,
  onUpdateStudent,
  role
}: SuiviPaiementsEleveProps) {
  const [selectedClass, setSelectedClass] = useState<string>('10ème Année');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFeeType, setSelectedFeeType] = useState<FeeType>('Scolarité');

  // Load configured grids from localStorage or fallback
  const [grids, setGrids] = useState<ClassFeeGrid[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_GRIDS);
    return saved ? JSON.parse(saved) : DEFAULT_FEE_GRIDS;
  });

  // Track payments
  const [payments, setPayments] = useState<StudentFeePayment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PAYMENTS);
    if (saved) {
      return JSON.parse(saved);
    }
    // Generate initial realistic payments for current students
    return generateDefaultPayments(students, grids);
  });

  // Keep state updated when props change or reset is needed
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PAYMENTS, JSON.stringify(payments));
  }, [payments]);

  // Generate initial payments function
  function generateDefaultPayments(initialStudents: Student[], currentGrids: ClassFeeGrid[]): StudentFeePayment[] {
    const initial: StudentFeePayment[] = [];
    initialStudents.forEach(student => {
      const studentGrids = currentGrids.filter(g => g.classe === student.classe);
      
      studentGrids.forEach(grid => {
        grid.installments.forEach((inst, index) => {
          let paye = 0;
          let datePaiement: string | undefined = undefined;
          let moyenPaiement: any = undefined;
          
          if (grid.typeFrais === 'Scolarité') {
            const matchedHist = student.historiquePaiements.find(p => 
              p.libelle.toLowerCase().includes(inst.libelle.toLowerCase()) ||
              (index === 0 && p.libelle.toLowerCase().includes('inscription')) ||
              (index === 1 && p.libelle.toLowerCase().includes('1ère')) ||
              (index === 2 && p.libelle.toLowerCase().includes('2ème'))
            );
            if (matchedHist) {
              paye = matchedHist.montant;
              datePaiement = matchedHist.date;
              moyenPaiement = matchedHist.moyenPaiement;
            }
          } else {
            // Seed others deterministically
            const isGoodPayer = ['student-1', 'student-3', 'student-5'].includes(student.id);
            if (isGoodPayer) {
              if (index < grid.installments.length - 1) {
                paye = inst.montant;
                datePaiement = inst.dateLimite;
                moyenPaiement = 'Mobile Money';
              } else {
                if (student.id === 'student-5') {
                  paye = Math.round(inst.montant / 2); // partial
                  datePaiement = inst.dateLimite;
                  moyenPaiement = 'Espèces';
                } else {
                  paye = inst.montant;
                  datePaiement = inst.dateLimite;
                  moyenPaiement = 'Virement';
                }
              }
            } else {
              // Bad payer
              if (index === 0) {
                paye = inst.montant;
                datePaiement = inst.dateLimite;
                moyenPaiement = 'Espèces';
              } else if (index === 1 && student.id === 'student-2') {
                paye = Math.round(inst.montant * 0.4); // partial
                datePaiement = inst.dateLimite;
                moyenPaiement = 'Mobile Money';
              } else {
                paye = 0;
              }
            }
          }
          
          if (paye > 0) {
            initial.push({
              studentId: student.id,
              typeFrais: grid.typeFrais,
              installmentId: inst.id,
              montantPaye: paye,
              datePaiement,
              moyenPaiement
            });
          }
        });
      });
    });
    return initial;
  }

  // Filter students in selected class
  const classStudents = students.filter(s => s.classe === selectedClass);

  // Auto select first student of class if none selected or if selected student is not in class
  useEffect(() => {
    if (classStudents.length > 0) {
      const isStillInClass = classStudents.some(s => s.id === selectedStudentId);
      if (!isStillInClass) {
        setSelectedStudentId(classStudents[0].id);
      }
    } else {
      setSelectedStudentId('');
    }
  }, [selectedClass, students]);

  const activeStudent = students.find(s => s.id === selectedStudentId) || null;

  // Find fee grid of selected class and type
  const activeGrid = grids.find(
    g => g.classe === selectedClass && g.typeFrais === selectedFeeType
  ) || {
    classe: selectedClass,
    typeFrais: selectedFeeType,
    montantTotal: 0,
    installments: []
  };

  // State for recording payment
  const [isRecordingPayment, setIsRecordingPayment] = useState<boolean>(false);
  const [paymentInstallmentId, setPaymentInstallmentId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Espèces' | 'Chèque' | 'Mobile Money' | 'Virement'>('Espèces');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().substring(0, 10));

  // Auto select first installment when opening payment modal
  useEffect(() => {
    if (activeGrid.installments.length > 0) {
      setPaymentInstallmentId(activeGrid.installments[0].id);
      setPaymentAmount(activeGrid.installments[0].montant);
    }
  }, [isRecordingPayment, selectedFeeType, selectedClass]);

  // Compute stats for current student across the selected fee type
  const getInstallmentPayment = (instId: string) => {
    const studentPayments = payments.filter(p => p.studentId === selectedStudentId && p.installmentId === instId);
    return studentPayments.reduce((sum, p) => sum + p.montantPaye, 0);
  };

  // Compute status for an installment
  const getInstallmentStatus = (inst: FeeInstallment) => {
    const paid = getInstallmentPayment(inst.id);
    const today = '2026-07-20'; // Current evaluation date based on system metadata

    if (paid >= inst.montant) {
      return { label: 'Payée', variant: 'success' };
    }
    if (paid > 0) {
      return { label: 'Partiellement payée', variant: 'warning' };
    }
    if (today > inst.dateLimite) {
      return { label: 'En retard', variant: 'danger' };
    }
    return { label: 'À échoir', variant: 'neutral' };
  };

  // Overall calculations for progress bar
  const totalDue = activeGrid.montantTotal;
  const totalPaid = activeGrid.installments.reduce((sum, inst) => sum + getInstallmentPayment(inst.id), 0);
  const balanceRemaining = Math.max(0, totalDue - totalPaid);
  const progressPercent = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0;

  // Handle Recording of Payment
  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent || !paymentInstallmentId || paymentAmount <= 0) return;

    const targetInstallment = activeGrid.installments.find(i => i.id === paymentInstallmentId);
    if (!targetInstallment) return;

    // Check previous paid amount to not exceed (or allow overpaying optionally)
    const previouslyPaid = getInstallmentPayment(paymentInstallmentId);
    const newPaid = previouslyPaid + paymentAmount;

    // 1. Update Payments State
    const updatedPayments = [...payments];
    const existingIndex = updatedPayments.findIndex(
      p => p.studentId === activeStudent.id && p.installmentId === paymentInstallmentId
    );

    if (existingIndex >= 0) {
      updatedPayments[existingIndex] = {
        ...updatedPayments[existingIndex],
        montantPaye: newPaid,
        datePaiement: paymentDate,
        moyenPaiement: paymentMethod
      };
    } else {
      updatedPayments.push({
        studentId: activeStudent.id,
        typeFrais: selectedFeeType,
        installmentId: paymentInstallmentId,
        montantPaye: paymentAmount,
        datePaiement: paymentDate,
        moyenPaiement: paymentMethod
      });
    }

    setPayments(updatedPayments);

    // 2. Synchronize with Student's payment history in LAKOLI general state
    const newHistoryItem: PaymentHistoryItem = {
      id: `p-rec-${Date.now()}`,
      libelle: `${selectedFeeType} - ${targetInstallment.libelle}`,
      date: paymentDate,
      montant: paymentAmount,
      moyenPaiement: paymentMethod,
      soldeRestant: Math.max(0, totalDue - (totalPaid + paymentAmount))
    };

    const updatedStudent: Student = {
      ...activeStudent,
      historiquePaiements: [newHistoryItem, ...activeStudent.historiquePaiements],
      // Re-evaluate main payment status based on whether there's any overdue payments in Scolarité
      statutPaiement: (totalPaid + paymentAmount >= totalDue) ? 'A_JOUR' : 'EN_RETARD'
    };

    onUpdateStudent(updatedStudent);
    setIsRecordingPayment(false);
    setPaymentAmount(0);
  };

  return (
    <div className="space-y-6">
      
      {/* Title Header Card */}
      <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0f172a] text-[#f8fafc]">
            Facturation Élèves
          </span>
          <h2 className="text-xl font-bold text-slate-800">Suivi des Paiements Individuels</h2>
          <p className="text-xs text-slate-500 max-w-xl">
            Consultez le solde restant d'un élève, observez le statut de ses échéances et enregistrez de nouveaux versements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeStudent && (role === 'COMPTABLE' ? (
            <button
              onClick={() => setIsRecordingPayment(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-lakoli-navy hover:bg-[#062f59] rounded-xl cursor-pointer transition-all shadow-md"
            >
              <Plus className="h-4 w-4" />
              Enregistrer un paiement
            </button>
          ) : (
            <div className="flex items-center px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-full text-xs font-bold gap-1.5 shadow-2xs select-none">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Mode lecture seule ({role === 'DIRECTEUR' ? 'Directeur' : 'Fondateur'})
            </div>
          ))}
        </div>
      </div>

      {/* FILTERS & STUDENT SELECTOR PANEL */}
      <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        {/* Class Selection */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1">
            <Layers className="h-3.5 w-3.5 text-lakoli-navy" />
            Filtrer par classe
          </label>
          <select
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setSearchQuery('');
            }}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-1 focus:ring-lakoli-navy outline-none font-bold text-slate-700"
          >
            {CLASSES_BY_LEVEL.map(group => (
              <optgroup key={group.level} label={group.label}>
                {group.classes.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Student Selector */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1">
            <User className="h-3.5 w-3.5 text-lakoli-navy" />
            Sélectionner l'élève
          </label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-1 focus:ring-lakoli-navy outline-none font-bold text-slate-700"
          >
            {classStudents.length === 0 ? (
              <option value="">Aucun élève dans cette classe</option>
            ) : (
              classStudents.map(student => (
                <option key={student.id} value={student.id}>
                  {student.nom} {student.prenom} ({student.matricule})
                </option>
              ))
            )}
          </select>
        </div>

        {/* Fee Type Selector */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5 text-lakoli-navy" />
            Type de redevance
          </label>
          <select
            value={selectedFeeType}
            onChange={(e) => setSelectedFeeType(e.target.value as FeeType)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-1 focus:ring-lakoli-navy outline-none font-bold text-slate-700"
          >
            <option value="Scolarité">Scolarité (Frais Généraux)</option>
            <option value="Cantine">Cantine Scolaire</option>
            <option value="Transport">Transport Scolaire (Bus)</option>
            <option value="Tenues & Assurance">Tenues & Assurance</option>
          </select>
        </div>
      </div>

      {/* PAYMENT TRACKING MAIN AREA */}
      {!activeStudent ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-150">
          <User className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-extrabold text-slate-700">Aucun élève sélectionné</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Veuillez sélectionner une classe avec des élèves puis choisir l'élève à auditer.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LEFT PANEL: FEE PROGRESS BAR & MAIN TOTALS */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-150 p-6 shadow-xs space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-lakoli-navy/10 text-lakoli-navy rounded-full font-bold flex items-center justify-center shrink-0">
                {activeStudent.nom[0]}{activeStudent.prenom[0]}
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Élève Audité</span>
                <span className="font-extrabold text-sm text-slate-800 uppercase leading-tight">{activeStudent.nom}</span>
                <span className="block text-xs font-semibold text-slate-500">{activeStudent.prenom}</span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold">Progression {selectedFeeType}</span>
                  <span className="font-mono font-black text-lakoli-navy">{progressPercent}%</span>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      progressPercent === 100 
                        ? 'bg-emerald-500' 
                        : progressPercent > 50 
                          ? 'bg-blue-500' 
                          : 'bg-amber-500'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>

              {/* Dynamic Financial Numbers */}
              <div className="grid grid-cols-1 gap-2 pt-2">
                <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl flex justify-between items-center">
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Montant Total Exigé</span>
                    <span className="text-xs font-mono font-bold text-slate-600">{formatGNF(totalDue)}</span>
                  </div>
                  <DollarSign className="h-5 w-5 text-slate-400" />
                </div>

                <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl flex justify-between items-center">
                  <div>
                    <span className="block text-[9px] font-bold text-emerald-600 uppercase">Montant Total Payé</span>
                    <span className="text-xs font-mono font-black text-emerald-700">{formatGNF(totalPaid)}</span>
                  </div>
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                </div>

                <div className={`p-3 rounded-xl border flex justify-between items-center ${
                  balanceRemaining > 0 
                    ? 'bg-rose-50/50 border-rose-100' 
                    : 'bg-slate-50 border-slate-150'
                }`}>
                  <div>
                    <span className={`block text-[9px] font-bold uppercase ${
                      balanceRemaining > 0 ? 'text-rose-500' : 'text-slate-400'
                    }`}>Solde Restant Dû</span>
                    <span className={`text-xs font-mono font-black ${
                      balanceRemaining > 0 ? 'text-rose-600' : 'text-slate-500'
                    }`}>{formatGNF(balanceRemaining)}</span>
                  </div>
                  <Clock className={`h-5 w-5 ${balanceRemaining > 0 ? 'text-rose-400' : 'text-slate-400'}`} />
                </div>
              </div>

            </div>

            <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-2">
              <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Statut Général Compte</span>
              <div className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${
                  activeStudent.statutPaiement === 'A_JOUR' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}></span>
                <span className="text-xs font-extrabold text-slate-700">
                  {activeStudent.statutPaiement === 'A_JOUR' 
                    ? 'Régulier (Scolarité à jour)' 
                    : 'Impératif (Arriérés de paiement)'}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: CHRONOLOGICAL LIST OF INSTALLMENTS */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-150 p-6 shadow-xs space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">
                  Détail par Échéance ({selectedFeeType})
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold">
                  Fiche de recouvrement de l'élève pour l'année scolaire en cours.
                </p>
              </div>
            </div>

            {/* List of installments with status badges */}
            <div className="space-y-4">
              {activeGrid.installments.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 border border-slate-100 rounded-xl">
                  <p className="text-xs text-slate-400">Aucune échéance configurée pour cette grille.</p>
                </div>
              ) : (
                activeGrid.installments.map((inst, index) => {
                  const paid = getInstallmentPayment(inst.id);
                  const status = getInstallmentStatus(inst);
                  const remaining = Math.max(0, inst.montant - paid);

                  return (
                    <div 
                      key={inst.id} 
                      className="border border-slate-150 rounded-xl p-4 hover:border-slate-300 transition-all bg-slate-50/20 grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
                    >
                      {/* Title & Date */}
                      <div className="md:col-span-5 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="h-5 w-5 rounded-md bg-slate-100 text-[10px] font-mono font-black text-slate-500 flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="font-bold text-slate-800 text-xs">{inst.libelle}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 pl-7">
                          <Calendar className="h-3 w-3" />
                          Date limite : {new Date(inst.dateLimite).toLocaleDateString('fr-FR')}
                        </div>
                      </div>

                      {/* Amounts breakdown */}
                      <div className="md:col-span-4 grid grid-cols-3 gap-1 text-[11px] font-mono border-l border-slate-100 pl-4 md:border-l-2 md:pl-4">
                        <div>
                          <span className="block text-[8px] font-bold text-slate-400 uppercase">Dû</span>
                          <span className="font-bold text-slate-600">{formatGNF(inst.montant)}</span>
                        </div>
                        <div>
                          <span className="block text-[8px] font-bold text-emerald-500 uppercase">Payé</span>
                          <span className="font-black text-emerald-600">{formatGNF(paid)}</span>
                        </div>
                        <div>
                          <span className={`block text-[8px] font-bold uppercase ${remaining > 0 ? 'text-rose-400' : 'text-slate-400'}`}>Reste</span>
                          <span className={`font-bold ${remaining > 0 ? 'text-rose-600 font-black' : 'text-slate-500'}`}>{formatGNF(remaining)}</span>
                        </div>
                      </div>

                      {/* Status badge */}
                      <div className="md:col-span-3 text-right">
                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-extrabold border ${
                          status.variant === 'success'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : status.variant === 'warning'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : status.variant === 'danger'
                                ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {status.label}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick history excerpt */}
            <div className="pt-4 border-t border-slate-100">
              <span className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Paiements enregistrés récemment dans la fiche</span>
              {activeStudent.historiquePaiements.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">Aucune écriture de paiement enregistrée pour l'instant.</p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {activeStudent.historiquePaiements.slice(0, 4).map((hist) => (
                    <div key={hist.id} className="flex justify-between items-center text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-700 block">{hist.libelle}</span>
                        <span className="text-[9px] text-slate-400 font-medium">le {new Date(hist.date).toLocaleDateString('fr-FR')} via {hist.moyenPaiement}</span>
                      </div>
                      <span className="font-mono font-black text-emerald-600">+{formatGNF(hist.montant)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* RECORD PAYMENT POPUP/MODAL OVERLAY */}
      {isRecordingPayment && activeStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-scaleUp">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-lakoli-navy text-white rounded-lg">
                  <DollarSign className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Enregistrer un Versement</h3>
                  <span className="text-[10px] text-slate-400 font-bold block">Élève : {activeStudent.nom} {activeStudent.prenom}</span>
                </div>
              </div>
              <button 
                onClick={() => setIsRecordingPayment(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
              
              {/* Installment selection */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Échéance concernée</label>
                <select
                  required
                  value={paymentInstallmentId}
                  onChange={(e) => {
                    const instId = e.target.value;
                    setPaymentInstallmentId(instId);
                    // Autofill remaining amount of that installment
                    const targetInst = activeGrid.installments.find(i => i.id === instId);
                    if (targetInst) {
                      const alreadyPaid = getInstallmentPayment(instId);
                      setPaymentAmount(Math.max(0, targetInst.montant - alreadyPaid));
                    }
                  }}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-700 focus:ring-1 focus:ring-lakoli-navy outline-none"
                >
                  {activeGrid.installments.map(inst => {
                    const paid = getInstallmentPayment(inst.id);
                    const remaining = Math.max(0, inst.montant - paid);
                    return (
                      <option key={inst.id} value={inst.id}>
                        {inst.libelle} (Reste : {formatGNF(remaining)})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Amount, Method, and Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Montant Versé (FG)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Montant du versement"
                    value={paymentAmount || ''}
                    onChange={(e) => setPaymentAmount(parseInt(e.target.value) || 0)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-slate-700 focus:ring-1 focus:ring-lakoli-navy outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Moyen de règlement</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-700 focus:ring-1 focus:ring-lakoli-navy outline-none"
                  >
                    <option value="Espèces">Espèces</option>
                    <option value="Mobile Money">Mobile Money (Orange / MTN)</option>
                    <option value="Virement">Virement Bancaire</option>
                    <option value="Chèque">Chèque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Date d'opération</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-700 focus:ring-1 focus:ring-lakoli-navy outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRecordingPayment(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="h-4 w-4" />
                  Enregistrer le paiement
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
