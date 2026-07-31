import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Award, 
  FileText, 
  Calendar, 
  DollarSign, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  BookOpen, 
  Clock, 
  User, 
  AlertCircle,
  TrendingUp,
  MapPin,
  CalendarDays
} from 'lucide-react';
import { Teacher, ContractType, TeacherAssignment, ScheduleItem, UserRole } from '../../types';
import { AVAILABLE_SUBJECTS } from '../../mockTeachersData';
import { AVAILABLE_CLASSES, CLASSES_BY_LEVEL } from '../../mockData';

interface EnseignantFicheProps {
  teacher: Teacher;
  onBack: () => void;
  onUpdateTeacher: (updatedTeacher: Teacher) => void;
  role: UserRole;
}

export default function EnseignantFiche({
  teacher,
  onBack,
  onUpdateTeacher,
  role
}: EnseignantFicheProps) {
  // Modal / Edit state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<Teacher>({ ...teacher });

  // Add Assignment form temp state in Edit modal
  const [newAssign, setNewAssign] = useState<TeacherAssignment>({
    classe: AVAILABLE_CLASSES[0],
    matiere: AVAILABLE_SUBJECTS[0],
    volumeHoraire: 4
  });

  // Schedule definition
  const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const SLOTS = [
    '08h00 - 10h00',
    '10h15 - 12h15',
    '14h00 - 16h00',
    '16h15 - 18h15'
  ];

  // Helper to format currency
  const formatGNF = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'GNF', maximumFractionDigits: 0 })
      .format(amount)
      .replace('GNF', 'GNF');
  };

  // Helper for exam class check
  const isExamClass = (classe: string) => {
    const norm = classe.toLowerCase();
    return norm.includes('10ème') || norm.includes('10e') || norm.includes('tle') || norm.includes('terminale') || norm.includes('6ème') || norm.includes('6e');
  };

  const hasExamClass = teacher.affectations.some(aff => isExamClass(aff.classe));

  // Compute total weekly assignment hours
  const totalWeeklyHours = teacher.affectations.reduce((sum, aff) => sum + aff.volumeHoraire, 0);

  // Overtime Calculation
  const overtimeRate = teacher.tauxHoraireSup || 0;
  const overtimeHours = teacher.volumeHoraireSup || 0;
  // Overtime payment is usually calculated monthly: Rate * Hours * 4 weeks
  const overtimeTotalMonthly = overtimeRate * overtimeHours * 4;

  // Handle Edit Input
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit edits
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Automatically recalculate matters based on assignments
    const assignmentsMatieres = editForm.affectations.map(a => a.matiere);
    const updatedMatieres = Array.from(new Set([editForm.matierePrincipale, ...assignmentsMatieres]));

    // Generate schedule if assignments changed
    let updatedSchedule = [...editForm.emploiDuTemps];
    
    // If the schedule is empty or doesn't match the new assignments, we rebuild a simple automatic one
    const isScheduleStale = editForm.affectations.length > 0 && 
      !editForm.emploiDuTemps.some(item => editForm.affectations.some(aff => aff.classe === item.classe));
      
    if (isScheduleStale || editForm.emploiDuTemps.length === 0) {
      updatedSchedule = [];
      const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
      const slots = ['08h00 - 10h00', '10h15 - 12h15', '14h00 - 16h00'];
      
      editForm.affectations.forEach((assign, index) => {
        const d = days[index % days.length];
        const s = slots[Math.floor(index / days.length) % slots.length];
        updatedSchedule.push({
          jour: d,
          creneau: s,
          classe: assign.classe,
          matiere: assign.matiere
        });
      });
    }

    const finalForm: Teacher = {
      ...editForm,
      nom: editForm.nom.toUpperCase(),
      matieres: updatedMatieres,
      emploiDuTemps: updatedSchedule
    };

    onUpdateTeacher(finalForm);
    setIsEditModalOpen(false);
  };

  // Add assignment in edit form
  const handleAddAssignment = () => {
    if (editForm.affectations.some(a => a.classe === newAssign.classe && a.matiere === newAssign.matiere)) {
      alert("Cette affectation existe déjà !");
      return;
    }
    const updatedAffectations = [...editForm.affectations, newAssign];
    
    // If we newly added an exam class, let's suggest a default overtime rate and hours
    const newlyHasExam = updatedAffectations.some(a => isExamClass(a.classe));
    const newlyTaux = editForm.tauxHoraireSup || 120000;
    const newlyVolume = editForm.volumeHoraireSup || 2;

    setEditForm(prev => ({
      ...prev,
      affectations: updatedAffectations,
      tauxHoraireSup: newlyHasExam ? newlyTaux : prev.tauxHoraireSup,
      volumeHoraireSup: newlyHasExam ? newlyVolume : prev.volumeHoraireSup
    }));
  };

  // Delete assignment in edit form
  const handleRemoveAssignment = (idx: number) => {
    const updatedAffectations = editForm.affectations.filter((_, i) => i !== idx);
    setEditForm(prev => ({
      ...prev,
      affectations: updatedAffectations
    }));
  };

  // Get course for a specific cell in the schedule
  const getCourseForCell = (day: string, slot: string) => {
    return teacher.emploiDuTemps.find(
      item => item.jour === day && item.creneau === slot
    );
  };

  return (
    <div id="enseignant-fiche-container" className="space-y-6">
      
      {/* Return & Action Buttons */}
      <div className="flex items-center justify-between">
        <button
          id="enseignant-btn-back"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-lakoli-navy transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la liste des enseignants
        </button>

        {role === 'COMPTABLE' ? (
          <button
            id="enseignant-btn-edit"
            onClick={() => {
              setEditForm({ ...teacher });
              setIsEditModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-lakoli-navy hover:bg-[#062f59] rounded-lg transition-all shadow-sm cursor-pointer"
          >
            <Edit3 className="h-3.5 w-3.5" />
            Modifier l'enseignant
          </button>
        ) : (
          <div className="inline-flex items-center px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-full text-xs font-bold gap-1.5 shadow-2xs select-none">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Mode lecture seule ({role === 'DIRECTEUR' ? 'Directeur' : role === 'FONDATEUR' ? 'Fondateur' : 'Enseignant'})
          </div>
        )}
      </div>

      {/* Grid: 2 columns layout on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Identity (Section 1) + Contract Details (Section 2) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Section 1: Identity Card */}
          <div id="section-identite" className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 text-center relative">
            <div className="absolute top-3 right-3">
              {teacher.statut === 'ACTIF' ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-lakoli-success-bg text-lakoli-success">
                  Actif
                </span>
              ) : teacher.statut === 'CONGE' ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-lakoli-warning-bg text-lakoli-warning">
                  Congé
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-lakoli-danger-bg text-lakoli-danger animate-pulse">
                  Échéance proche
                </span>
              )}
            </div>

            {/* Avatar / Photo */}
            <div className="mx-auto h-20 w-20 rounded-full bg-lakoli-navy text-white text-xl font-extrabold flex items-center justify-center border-4 border-slate-50 shadow-sm mb-4">
              {teacher.nom.charAt(0)}{teacher.prenom.charAt(0)}
            </div>

            {/* Identity Text */}
            <h2 className="text-lg font-bold text-slate-800">{teacher.nom} {teacher.prenom}</h2>
            <p className="text-xs font-mono text-slate-400 mt-1">{teacher.matricule}</p>
            
            <div className="mt-3.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs font-semibold text-slate-600">
              <Award className="h-3.5 w-3.5 text-lakoli-navy" />
              {teacher.matierePrincipale}
            </div>

            {/* Contact Details & Diploma */}
            <div className="mt-6 border-t pt-4 text-left space-y-3.5">
              <div className="flex items-start space-x-2.5">
                <BookOpen className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Diplôme académique</span>
                  <span className="text-xs font-medium text-slate-700">{teacher.diplome}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2.5">
                <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Téléphone</span>
                  <span className="text-xs font-semibold text-slate-700 font-mono">{teacher.telephone}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2.5">
                <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Adresse e-mail</span>
                  <span className="text-xs font-semibold text-slate-700 font-mono">{teacher.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Contract Card */}
          <div id="section-contrat" className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
              <FileText className="h-4 w-4 text-lakoli-navy" />
              Renseignements de Contrat
            </h3>

            {/* Contract info table */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Type de contrat</span>
                <span className="font-bold text-slate-800 bg-slate-50 px-2 py-0.5 border rounded">
                  {teacher.typeContrat}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Date d'embauche / Début</span>
                <span className="font-semibold text-slate-700 font-mono">{teacher.dateDebutContrat}</span>
              </div>
              {teacher.dateFinContrat && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Date d'échéance / Fin</span>
                  <span className="font-semibold text-rose-600 font-mono">{teacher.dateFinContrat}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xs pt-2 border-t">
                <span className="text-slate-500">Salaire de Base Mensuel</span>
                <span className="font-bold font-mono text-slate-800 text-sm">
                  {formatGNF(teacher.salaireBase)}
                </span>
              </div>
            </div>

            {/* Section 2.1: OVERTIME BLOCK (Exam class only) */}
            {hasExamClass ? (
              <div className="mt-4 p-4 bg-lakoli-info-bg/40 border border-lakoli-info/10 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-lakoli-info uppercase tracking-wider flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Heures Supplémentaires
                  </span>
                  <span className="text-[9px] font-bold bg-lakoli-info text-white px-1.5 py-0.5 rounded uppercase">
                    Classe d'examen
                  </span>
                </div>
                
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Cet enseignant est affecté à une classe d'examen (6e, 10e ou Terminale). Il bénéficie d'une tarification horaire supplémentaire.
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-blue-100 text-xs">
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Taux horaire</span>
                    <span className="font-semibold text-slate-700 font-mono">{formatGNF(overtimeRate)}/h</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Volume hebdo.</span>
                    <span className="font-semibold text-slate-700 font-mono">{overtimeHours} heures/sem</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-blue-100 flex items-center justify-between text-xs font-semibold text-slate-800">
                  <span>Montant mensuel calculé</span>
                  <span className="font-extrabold font-mono text-lakoli-info">
                    +{formatGNF(overtimeTotalMonthly)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-2 p-3 bg-slate-50 border border-slate-100 rounded-xl text-center">
                <p className="text-[10px] text-slate-400 italic">
                  Aucune heure supplémentaire applicable (pas d'affectation en classe d'examen : 6e, 10e, Terminale).
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Affectations (Section 3) + Weekly Schedule (Section 4) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 3: Class Affectations */}
          <div id="section-affectations" className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-lakoli-navy" />
                Classes & Matières Affectées
              </h3>
              <span className="text-xs text-slate-500 font-medium font-mono">
                Total : {totalWeeklyHours} heures par semaine
              </span>
            </div>

            {/* Affectations list */}
            {teacher.affectations.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">
                Aucune classe ou matière n'est actuellement affectée à cet enseignant.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teacher.affectations.map((aff, index) => {
                  const exam = isExamClass(aff.classe);
                  return (
                    <div 
                      key={index} 
                      className={`p-3.5 rounded-xl border flex items-center justify-between ${
                        exam 
                          ? 'bg-red-50/50 border-red-100 text-red-900' 
                          : 'bg-slate-50/50 border-slate-100 text-slate-800'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm">{aff.classe}</div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">{aff.matiere}</div>
                      </div>
                      <div className="text-right flex flex-col items-end space-y-1">
                        <span className="text-xs font-bold font-mono px-2 py-0.5 bg-white border rounded">
                          {aff.volumeHoraire}h/sem
                        </span>
                        {exam && (
                          <span className="text-[8px] px-1.5 py-0.5 bg-red-100 text-red-700 font-extrabold rounded uppercase tracking-wider">
                            Classe d'examen
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 4: Emploi du Temps Grid */}
          <div id="section-schedule" className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
              <CalendarDays className="h-4 w-4 text-lakoli-navy" />
              Emploi du temps hebdomadaire
            </h3>

            {/* Desktop Table Grid */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs text-center border border-slate-150 min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 font-bold text-slate-500 uppercase text-[10px]">
                    <th className="py-2.5 px-2 border-r border-slate-150 text-left pl-3 w-32">Créneaux</th>
                    {DAYS.map(day => (
                      <th key={day} className="py-2.5 px-2 border-r border-slate-150 w-28">{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {SLOTS.map((slot, sIdx) => (
                    <tr key={sIdx} className="hover:bg-slate-50/20">
                      {/* Slot Column */}
                      <td className="py-3 px-2 border-r border-slate-150 bg-slate-50 text-left font-semibold font-mono text-[10px] text-slate-500 pl-3">
                        {slot}
                      </td>

                      {/* Day Columns */}
                      {DAYS.map((day, dIdx) => {
                        const course = getCourseForCell(day, slot);
                        const isExam = course && isExamClass(course.classe);
                        return (
                          <td 
                            key={dIdx} 
                            className={`py-3 px-2 border-r border-slate-150 relative h-20 ${
                              course ? 'bg-slate-50' : ''
                            }`}
                          >
                            {course ? (
                              <div className={`absolute inset-1 p-1.5 rounded-lg flex flex-col justify-between text-left shadow-xs border ${
                                isExam 
                                  ? 'bg-red-50/70 border-red-100 text-red-950' 
                                  : 'bg-lakoli-navy/5 border-lakoli-navy/15 text-slate-800'
                              }`}>
                                <div className="font-bold leading-tight truncate text-[10px]">{course.classe}</div>
                                <div className="text-[9px] text-slate-500 truncate mt-0.5">{course.matiere}</div>
                              </div>
                            ) : (
                              <span className="text-slate-300 text-[9px] select-none">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[10px] text-slate-400 italic">
              Note : Cette grille est générée de manière synchrone selon les affectations de classe et les créneaux guinéens standard (cours du matin et de l'après-midi).
            </p>
          </div>

        </div>
      </div>

      {/* MODAL: EDIT TEACHER DETAILS & CONTRACT */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-lakoli-navy" />
                <h3 className="text-base font-bold text-slate-800">Modifier les informations de l'enseignant</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <XButton />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleEditSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                
                {/* Profile Identity Form */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-lakoli-navy uppercase tracking-wider pb-1 border-b">1. Identité & Contact</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Nom *</label>
                      <input
                        type="text"
                        name="nom"
                        required
                        value={editForm.nom}
                        onChange={handleEditInputChange}
                        className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-lakoli-navy uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Prénom *</label>
                      <input
                        type="text"
                        name="prenom"
                        required
                        value={editForm.prenom}
                        onChange={handleEditInputChange}
                        className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-lakoli-navy"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Matière Principale *</label>
                    <select
                      name="matierePrincipale"
                      value={editForm.matierePrincipale}
                      onChange={handleEditInputChange}
                      className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-lakoli-navy"
                    >
                      {AVAILABLE_SUBJECTS.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Diplôme *</label>
                    <input
                      type="text"
                      name="diplome"
                      required
                      value={editForm.diplome}
                      onChange={handleEditInputChange}
                      className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-lakoli-navy"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Téléphone *</label>
                      <input
                        type="tel"
                        name="telephone"
                        required
                        value={editForm.telephone}
                        onChange={handleEditInputChange}
                        className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-lakoli-navy"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">E-mail *</label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={editForm.email}
                        onChange={handleEditInputChange}
                        className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-lakoli-navy"
                      />
                    </div>
                  </div>
                </div>

                {/* Contract details Form */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-lakoli-navy uppercase tracking-wider pb-1 border-b">2. Contrat & Heures Supplémentaires</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Type de Contrat</label>
                      <select
                        name="typeContrat"
                        value={editForm.typeContrat}
                        onChange={handleEditInputChange}
                        className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-lakoli-navy"
                      >
                        <option value="CDI">CDI</option>
                        <option value="CDD">CDD</option>
                        <option value="VACATAIRE">Vacataire</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Statut Personnel</label>
                      <select
                        name="statut"
                        value={editForm.statut}
                        onChange={handleEditInputChange}
                        className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-lakoli-navy"
                      >
                        <option value="ACTIF">Actif</option>
                        <option value="CONGE">Congé</option>
                        <option value="ECHEANCE_PROCHE">Échéance proche</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Début du contrat *</label>
                      <input
                        type="date"
                        name="dateDebutContrat"
                        required
                        value={editForm.dateDebutContrat}
                        onChange={handleEditInputChange}
                        className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-lakoli-navy"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Fin du contrat</label>
                      <input
                        type="date"
                        name="dateFinContrat"
                        disabled={editForm.typeContrat === 'CDI'}
                        value={editForm.dateFinContrat || ''}
                        onChange={handleEditInputChange}
                        className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-lakoli-navy disabled:bg-slate-100 disabled:text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Salaire de Base Mensuel *</label>
                    <div className="relative">
                      <input
                        type="number"
                        name="salaireBase"
                        required
                        value={editForm.salaireBase}
                        onChange={handleEditInputChange}
                        className="w-full text-sm pl-3 pr-12 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-lakoli-navy font-semibold font-mono"
                      />
                      <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">GNF</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Taux Heure Sup.</label>
                      <input
                        type="number"
                        name="tauxHoraireSup"
                        value={editForm.tauxHoraireSup || ''}
                        onChange={handleEditInputChange}
                        className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-lakoli-navy font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Volume Heure Sup.</label>
                      <input
                        type="number"
                        name="volumeHoraireSup"
                        value={editForm.volumeHoraireSup || ''}
                        onChange={handleEditInputChange}
                        className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-lakoli-navy font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Class affectation panel in Edit modal */}
              <div className="border-t pt-4 space-y-4">
                <h4 className="text-xs font-bold text-lakoli-navy uppercase tracking-wider">3. Classes & Affectations Directes</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 items-end">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Classe</label>
                    <select
                      value={newAssign.classe}
                      onChange={(e) => setNewAssign(prev => ({ ...prev, classe: e.target.value }))}
                      className="w-full text-xs bg-white border border-slate-200 rounded p-1.5 focus:outline-none"
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
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Matière Enseignée</label>
                    <select
                      value={newAssign.matiere}
                      onChange={(e) => setNewAssign(prev => ({ ...prev, matiere: e.target.value }))}
                      className="w-full text-xs bg-white border border-slate-200 rounded p-1.5 focus:outline-none"
                    >
                      {AVAILABLE_SUBJECTS.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Volume Hebdomadaire</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={newAssign.volumeHoraire}
                        onChange={(e) => setNewAssign(prev => ({ ...prev, volumeHoraire: Number(e.target.value) }))}
                        className="w-full text-xs bg-white border border-slate-200 rounded p-1.5 focus:outline-none font-mono"
                      />
                      <span className="absolute right-2 top-1.5 text-[9px] text-slate-400">h/sem</span>
                    </div>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={handleAddAssignment}
                      className="w-full py-1.5 bg-lakoli-navy hover:bg-[#062f59] text-white text-xs font-bold rounded cursor-pointer transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Associer cours
                    </button>
                  </div>
                </div>

                {/* Displaying actual temporary list of assignments in edit modal */}
                {editForm.affectations.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                    {editForm.affectations.map((assign, idx) => {
                      const isExam = isExamClass(assign.classe);
                      return (
                        <div 
                          key={idx}
                          className="flex items-center justify-between px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-800">{assign.classe}</span>
                            <span className="block text-[10px] text-slate-500">{assign.matiere} • {assign.volumeHoraire}h</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            {isExam && (
                              <span className="text-[8px] bg-red-100 text-red-600 font-extrabold px-1 rounded uppercase">
                                Exam
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveAssignment(idx)}
                              className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-2">
                    Aucune classe ou matière n'est affectée. Cet enseignant ne pourra pas générer son emploi du temps.
                  </p>
                )}
              </div>

              {/* Footer Actions */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 -mx-6 -mb-6 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-lakoli-navy hover:bg-[#062f59] rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Simple close button helper
function XButton() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
