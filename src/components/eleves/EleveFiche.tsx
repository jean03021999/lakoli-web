import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Edit3, 
  Plus, 
  Calendar, 
  MapPin, 
  User, 
  Users, 
  Phone, 
  CreditCard, 
  Clock, 
  X, 
  Check, 
  UserCheck, 
  Sparkles,
  DollarSign,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { Student, PaymentHistoryItem, PaymentStatus, UserRole } from '../../types';
import { AVAILABLE_CLASSES, CLASSES_BY_LEVEL } from '../../mockData';

interface EleveFicheProps {
  student: Student;
  onBack: () => void;
  onUpdateStudent: (updatedStudent: Student) => void;
  role: UserRole;
}

export default function EleveFiche({ 
  student, 
  onBack, 
  onUpdateStudent, 
  role 
}: EleveFicheProps) {
  // Modal toggle states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Edit student form state
  const [editForm, setEditForm] = useState<Student>({ ...student });

  // Add payment form state
  const [paymentForm, setPaymentForm] = useState<Omit<PaymentHistoryItem, 'id'>>({
    libelle: '',
    date: new Date().toISOString().split('T')[0],
    montant: 0,
    moyenPaiement: 'Espèces',
    soldeRestant: 0
  });

  const getInitials = (firstName: string, lastName: string) => {
    const first = firstName ? firstName.charAt(0) : '';
    const last = lastName ? lastName.charAt(0) : '';
    return (first + last).toUpperCase();
  };

  // Format currency helper
  const formatGNF = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'GNF', minimumFractionDigits: 0 }).format(amount);
  };

  // Form input changes for Edit
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child, grandChild] = name.split('.');
      if (grandChild) {
        setEditForm(prev => ({
          ...prev,
          filiation: {
            ...prev.filiation,
            [child]: {
              ...((prev.filiation as any)[child]),
              [grandChild]: value
            }
          }
        }));
      } else {
        setEditForm(prev => ({
          ...prev,
          [parent]: {
            ...((prev as any)[parent]),
            [child]: value
          }
        }));
      }
    } else {
      setEditForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStudent(editForm);
    setIsEditModalOpen(false);
  };

  // Form input changes for Payment
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.libelle || paymentForm.montant <= 0) {
      alert('Veuillez remplir un libellé valide et un montant supérieur à 0 GNF.');
      return;
    }

    const newPayment: PaymentHistoryItem = {
      id: `p-add-${Date.now()}`,
      libelle: paymentForm.libelle,
      date: paymentForm.date,
      montant: Number(paymentForm.montant),
      moyenPaiement: paymentForm.moyenPaiement as any,
      soldeRestant: paymentForm.soldeRestant !== undefined ? Number(paymentForm.soldeRestant) : undefined
    };

    // Auto update status to A_JOUR if the entered remaining balance is 0 GNF
    let updatedStatus: PaymentStatus = student.statutPaiement;
    if (newPayment.soldeRestant === 0) {
      updatedStatus = 'A_JOUR';
    }

    const updatedStudent: Student = {
      ...student,
      statutPaiement: updatedStatus,
      historiquePaiements: [newPayment, ...student.historiquePaiements]
    };

    onUpdateStudent(updatedStudent);
    
    // Reset payment form
    setPaymentForm({
      libelle: '',
      date: new Date().toISOString().split('T')[0],
      montant: 0,
      moyenPaiement: 'Espèces',
      soldeRestant: 0
    });
    
    setIsPaymentModalOpen(false);
  };

  return (
    <div id="eleve-fiche-view" className="space-y-6">
      {/* Header Back Button & Action buttons */}
      <div id="eleve-fiche-header" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          id="eleve-btn-back"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-semibold transition-colors group cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
          Retour au répertoire
        </button>

        {role === 'COMPTABLE' ? (
          <div className="flex items-center gap-2">
            <button
              id="eleve-btn-edit"
              onClick={() => {
                setEditForm({ ...student });
                setIsEditModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-950 transition-all shadow-sm cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Modifier l'élève
            </button>
            <button
              id="eleve-btn-add-payment"
              onClick={() => setIsPaymentModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-lakoli-navy hover:bg-[#062f59] rounded-lg transition-all shadow-sm cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter un paiement
            </button>
          </div>
        ) : (
          <div className="inline-flex items-center px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-full text-xs font-bold gap-1.5 shadow-2xs select-none">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Mode lecture seule ({role === 'DIRECTEUR' ? 'Directeur' : 'Fondateur'})
          </div>
        )}
      </div>

      {/* Grid Layout: Left Column = Identité & Filiation, Right Column = Historique */}
      <div id="eleve-fiche-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (Lg: 5/12 columns) - Identity & Filiation */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Section 1 — Identité */}
          <div id="eleve-identite-card" className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-5">
            <div className="flex items-start space-x-4">
              {/* Profile Photo */}
              {student.photoUrl ? (
                <img 
                  src={student.photoUrl} 
                  alt={`${student.prenom} ${student.nom}`} 
                  className="h-20 w-20 rounded-xl object-cover border border-slate-200 shadow-sm"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-20 w-20 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 shadow-sm flex items-center justify-center font-bold text-2xl uppercase select-none">
                  {getInitials(student.prenom, student.nom)}
                </div>
              )}

              {/* Basic information */}
              <div className="space-y-1.5 flex-1">
                <div className="inline-flex">
                  {student.statutPaiement === 'A_JOUR' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-lakoli-success-bg text-lakoli-success">
                      À jour
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-lakoli-danger-bg text-lakoli-danger animate-pulse">
                      En retard
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-slate-800 uppercase leading-none">{student.nom}</h2>
                <p className="text-base font-semibold text-slate-600">{student.prenom}</p>
                <div className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 inline-block">
                  {student.matricule}
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Identity details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Classe</span>
                <span className="font-semibold text-slate-800">{student.classe}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Session scolaire</span>
                <span className="font-semibold text-slate-800">{student.sessionScolaire}</span>
              </div>
              <div className="col-span-2">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Né(e) le</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  {student.dateNaissance ? new Date(student.dateNaissance).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Non renseigné'}
                </span>
              </div>
              <div className="col-span-2">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">À (Lieu de naissance)</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  {student.lieuNaissance || 'Non renseigné'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2 — Filiation (separate card, 3 distinct blocks) */}
          <div id="eleve-filiation-card" className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-slate-400" />
              Filiation de l'élève
            </h3>

            <div className="space-y-3">
              {/* Bloc 1: Père */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100/80">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Père</span>
                {student.filiation.pere.nom ? (
                  <div className="space-y-1">
                    <span className="block text-sm font-semibold text-slate-800">{student.filiation.pere.nom}</span>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-mono">
                      <Phone className="h-3 w-3 text-slate-400" />
                      {student.filiation.pere.telephone || 'Aucun numéro renseigné'}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs italic text-slate-400">Non renseigné</span>
                )}
              </div>

              {/* Bloc 2: Mère */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100/80">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mère</span>
                {student.filiation.mere.nom ? (
                  <div className="space-y-1">
                    <span className="block text-sm font-semibold text-slate-800">{student.filiation.mere.nom}</span>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-mono">
                      <Phone className="h-3 w-3 text-slate-400" />
                      {student.filiation.mere.telephone || 'Aucun numéro renseigné'}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs italic text-slate-400">Non renseigné</span>
                )}
              </div>

              {/* Bloc 3: Tuteur */}
              <div className="p-3 bg-lakoli-neutral-bg/65 rounded-lg border border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="block text-[10px] font-bold text-lakoli-neutral uppercase tracking-wider">Tuteur / Tutrice</span>
                  {student.filiation.tuteur.lien && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-lakoli-neutral-bg text-lakoli-neutral font-semibold uppercase">
                      {student.filiation.tuteur.lien}
                    </span>
                  )}
                </div>
                {student.filiation.tuteur.nom ? (
                  <div className="space-y-1">
                    <span className="block text-sm font-semibold text-slate-800">{student.filiation.tuteur.nom}</span>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-mono">
                      <Phone className="h-3 w-3 text-slate-400" />
                      {student.filiation.tuteur.telephone || 'Aucun numéro renseigné'}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs italic text-slate-400">Non renseigné</span>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN (Lg: 7/12 columns) - Historique de paiement */}
        <div className="lg:col-span-7">
          
          {/* Section 3 — Historique paiement */}
          <div id="eleve-historique-card" className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <CreditCard className="h-4.5 w-4.5 text-lakoli-navy" />
                Historique des paiements de scolarité
              </h3>
              
              {/* Total paid calculation */}
              <div className="text-right">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Cumul payé</span>
                <span className="text-sm font-bold text-slate-800">
                  {formatGNF(student.historiquePaiements.reduce((acc, p) => acc + p.montant, 0))}
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-x-auto">
              {student.historiquePaiements.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50/10">
                      <th className="py-3 px-5">Libellé paiement</th>
                      <th className="py-3 px-5">Date</th>
                      <th className="py-3 px-5">Méthode</th>
                      <th className="py-3 px-5 text-right">Montant</th>
                      <th className="py-3 px-5 text-right">Solde restant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {student.historiquePaiements.map((payment) => (
                      <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-5 font-semibold text-slate-800">
                          {payment.libelle}
                        </td>
                        <td className="py-3 px-5 text-slate-500 font-medium">
                          {new Date(payment.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium text-[10px]">
                            {payment.moyenPaiement}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-right font-bold text-slate-800">
                          {formatGNF(payment.montant)}
                        </td>
                        <td className="py-3 px-5 text-right">
                          {payment.soldeRestant !== undefined ? (
                            payment.soldeRestant === 0 ? (
                              <span className="inline-flex items-center text-lakoli-success font-bold">
                                Apuré (0 GNF)
                              </span>
                            ) : (
                              <span className="text-lakoli-danger font-bold font-mono">
                                {formatGNF(payment.soldeRestant)}
                              </span>
                            )
                          ) : (
                            <span className="text-slate-400 italic">Non spécifié</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-16 px-4">
                  <div className="h-12 w-12 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center mb-3">
                    <Clock className="h-6 w-6 text-slate-400" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-700">Aucun paiement enregistré</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">Cet élève n'a pas encore de paiements enregistrés pour la session scolaire {student.sessionScolaire}.</p>
                  
                  {role === 'COMPTABLE' && (
                    <button
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-lakoli-navy hover:bg-[#062f59] rounded-lg transition-colors shadow-sm cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                      Saisir le versement d'inscription
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Modal: EDIT STUDENT INFO */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-lakoli-navy" />
                <h3 className="text-base font-bold text-slate-800">Modifier les informations de l'élève</h3>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-200/50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditSubmit}>
              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                
                {/* 1. Identity */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 border-b pb-1">
                    1. Identité de l'élève
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Nom <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        name="nom"
                        required
                        value={editForm.nom}
                        onChange={handleEditInputChange}
                        className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-lakoli-navy focus:outline-none uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Prénom <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        name="prenom"
                        required
                        value={editForm.prenom}
                        onChange={handleEditInputChange}
                        className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-lakoli-navy focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Classe <span className="text-rose-500">*</span></label>
                      <select
                        name="classe"
                        value={editForm.classe}
                        onChange={handleEditInputChange}
                        className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-lakoli-navy focus:outline-none"
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
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Date de naissance</label>
                      <input
                        type="date"
                        name="dateNaissance"
                        value={editForm.dateNaissance}
                        onChange={handleEditInputChange}
                        className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-lakoli-navy focus:outline-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Lieu de naissance</label>
                      <input
                        type="text"
                        name="lieuNaissance"
                        value={editForm.lieuNaissance}
                        onChange={handleEditInputChange}
                        className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-lakoli-navy focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Statut Paiement</label>
                      <select
                        name="statutPaiement"
                        value={editForm.statutPaiement}
                        onChange={handleEditInputChange}
                        className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-lakoli-navy focus:outline-none"
                      >
                        <option value="A_JOUR">À jour</option>
                        <option value="EN_RETARD">En retard</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Session scolaire</label>
                      <input
                        type="text"
                        name="sessionScolaire"
                        value={editForm.sessionScolaire}
                        disabled
                        className="w-full text-sm px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Filiation */}
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 border-b pb-1">
                    2. Filiation & Contacts d'urgence
                  </h4>
                  
                  {/* Père & Mère */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Père block */}
                    <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-150 space-y-3">
                      <span className="text-xs font-bold text-slate-700 block">Père de l'élève</span>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Nom complet</label>
                        <input
                          type="text"
                          name="filiation.pere.nom"
                          value={editForm.filiation.pere.nom}
                          onChange={handleEditInputChange}
                          placeholder="Nom du père"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-lakoli-navy"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Téléphone</label>
                        <input
                          type="text"
                          name="filiation.pere.telephone"
                          value={editForm.filiation.pere.telephone}
                          onChange={handleEditInputChange}
                          placeholder="+224 6XX XX XX XX"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-lakoli-navy"
                        />
                      </div>
                    </div>

                    {/* Mère block */}
                    <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-150 space-y-3">
                      <span className="text-xs font-bold text-slate-700 block">Mère de l'élève</span>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Nom complet</label>
                        <input
                          type="text"
                          name="filiation.mere.nom"
                          value={editForm.filiation.mere.nom}
                          onChange={handleEditInputChange}
                          placeholder="Nom de la mère"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-lakoli-navy"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Téléphone</label>
                        <input
                          type="text"
                          name="filiation.mere.telephone"
                          value={editForm.filiation.mere.telephone}
                          onChange={handleEditInputChange}
                          placeholder="+224 6XX XX XX XX"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-lakoli-navy"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tuteur block */}
                  <div className="bg-emerald-50/40 p-3.5 rounded-lg border border-emerald-100 space-y-3">
                    <span className="text-xs font-bold text-emerald-800 block">Tuteur de l'élève (Optionnel)</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Nom complet</label>
                        <input
                          type="text"
                          name="filiation.tuteur.nom"
                          value={editForm.filiation.tuteur.nom}
                          onChange={handleEditInputChange}
                          placeholder="Nom du tuteur"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-lakoli-navy"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Téléphone</label>
                        <input
                          type="text"
                          name="filiation.tuteur.telephone"
                          value={editForm.filiation.tuteur.telephone}
                          onChange={handleEditInputChange}
                          placeholder="+224 6XX XX XX XX"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-lakoli-navy"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Lien avec l'élève</label>
                        <input
                          type="text"
                          name="filiation.tuteur.lien"
                          value={editForm.filiation.tuteur.lien}
                          onChange={handleEditInputChange}
                          placeholder="Ex: Oncle, Tante..."
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-lakoli-navy"
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-lakoli-navy hover:bg-[#062f59] rounded-lg transition-colors shadow-sm"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: ADD PAYMENT */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-lakoli-navy" />
                <h3 className="text-base font-bold text-slate-800">Ajouter un versement / paiement</h3>
              </div>
              <button 
                onClick={() => setIsPaymentModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-200/50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handlePaymentSubmit}>
              <div className="p-6 space-y-4">
                
                {/* Libellé */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Libellé du paiement <span className="text-rose-500">*</span></label>
                  <select
                    required
                    value={paymentForm.libelle}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, libelle: e.target.value }))}
                    className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-lakoli-navy focus:outline-none"
                  >
                    <option value="">Sélectionnez un motif...</option>
                    <option value="Frais d'inscription Scolarité">Frais d'inscription Scolarité</option>
                    <option value="1ère Échéance Scolarité">1ère Échéance Scolarité</option>
                    <option value="2ème Échéance Scolarité">2ème Échéance Scolarité</option>
                    <option value="Acompte Scolarité">Acompte Scolarité</option>
                    <option value="Solde Scolarité">Solde Scolarité</option>
                    <option value="Frais d'Examen National">Frais d'Examen National</option>
                  </select>
                </div>

                {/* Montant */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Montant versé (GNF) <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="1"
                      value={paymentForm.montant || ''}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, montant: Number(e.target.value) }))}
                      placeholder="Ex: 500000"
                      className="w-full text-sm pl-3 pr-12 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-lakoli-navy focus:outline-none font-semibold font-mono"
                    />
                    <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">GNF</span>
                  </div>
                </div>

                {/* Moyen de Paiement */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Moyen de paiement</label>
                  <select
                    value={paymentForm.moyenPaiement}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, moyenPaiement: e.target.value as any }))}
                    className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-lakoli-navy focus:outline-none"
                  >
                    <option value="Espèces">Espèces</option>
                    <option value="Mobile Money">Mobile Money (Orange Money, Moov, etc.)</option>
                    <option value="Chèque">Chèque bancaire</option>
                    <option value="Virement">Virement bancaire</option>
                  </select>
                </div>

                {/* Solde Restant */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Solde restant après ce paiement (GNF)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={paymentForm.soldeRestant || '0'}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, soldeRestant: Number(e.target.value) }))}
                      placeholder="Ex: 1000000"
                      className="w-full text-sm pl-3 pr-12 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-lakoli-navy focus:outline-none font-semibold font-mono text-lakoli-danger"
                    />
                    <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">GNF</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Saisir <strong className="font-bold">0 GNF</strong> si l'échéance ou l'inscription est intégralement payée. Le statut de l'élève passera automatiquement à "À jour".</p>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Date du versement</label>
                  <input
                    type="date"
                    required
                    value={paymentForm.date}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-lakoli-navy focus:outline-none"
                  />
                </div>

              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-lakoli-navy hover:bg-[#062f59] rounded-lg transition-colors shadow-sm"
                >
                  Valider le versement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
