import React, { useState, useRef } from 'react';
import { 
  Search, 
  Plus, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  UserCheck, 
  FileSpreadsheet, 
  FileDown, 
  Upload, 
  X,
  BookOpen,
  Briefcase,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Teacher, ContractType, TeacherAssignment, ScheduleItem, UserRole } from '../../types';
import { AVAILABLE_SUBJECTS } from '../../mockTeachersData';
import { AVAILABLE_CLASSES, CLASSES_BY_LEVEL } from '../../mockData';
import EnseignantFiche from './EnseignantFiche';

interface EnseignantsListeProps {
  teachers: Teacher[];
  onSelectTeacher: (teacher: Teacher) => void;
  onAddTeacher: (teacher: Omit<Teacher, 'id'>) => void;
  onImportTeachers: (imported: Teacher[]) => void;
  role: UserRole;
}

export default function EnseignantsListe({
  teachers,
  onSelectTeacher,
  onAddTeacher,
  onImportTeachers,
  role
}: EnseignantsListeProps) {
  // If role is ENSEIGNANT, show only their own fiche in read-only mode
  if (role === 'ENSEIGNANT') {
    const currentTeacher = teachers[0]; // M. Camara
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-4 rounded-xl text-amber-800 dark:text-amber-300 text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
            Mode lecture seule — Votre fiche personnelle enseignant
          </div>
        </div>
        <EnseignantFiche
          teacher={currentTeacher}
          onBack={() => {}}
          onUpdateTeacher={() => {}}
          role={role}
        />
      </div>
    );
  }

  // Filters and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedContractType, setSelectedContractType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // New Teacher Form state
  const [newTeacher, setNewTeacher] = useState({
    nom: '',
    prenom: '',
    matierePrincipale: AVAILABLE_SUBJECTS[0],
    matieres: [AVAILABLE_SUBJECTS[0]],
    typeContrat: 'CDI' as ContractType,
    dateDebutContrat: new Date().toISOString().split('T')[0],
    dateFinContrat: '',
    salaireBase: 3500000,
    tauxHoraireSup: 120000,
    volumeHoraireSup: 0,
    diplome: '',
    telephone: '',
    email: '',
    statut: 'ACTIF' as 'ACTIF' | 'CONGE' | 'ECHEANCE_PROCHE'
  });

  // Temp lists for new teacher assignments
  const [tempAssignments, setTempAssignments] = useState<TeacherAssignment[]>([]);
  const [newAssignment, setNewAssignment] = useState<TeacherAssignment>({
    classe: AVAILABLE_CLASSES[0],
    matiere: AVAILABLE_SUBJECTS[0],
    volumeHoraire: 4
  });

  // Excel drag & drop state
  const [dragActive, setDragActive] = useState(false);
  const [importedFile, setImportedFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered teachers logic
  const filteredTeachers = teachers.filter(teacher => {
    const fullName = `${teacher.nom} ${teacher.prenom}`.toLowerCase();
    const matchesSearch = 
      fullName.includes(searchTerm.toLowerCase()) || 
      teacher.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.matierePrincipale.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSubject = 
      selectedSubject === 'all' || 
      teacher.matierePrincipale === selectedSubject || 
      teacher.matieres.includes(selectedSubject);

    const matchesContract = 
      selectedContractType === 'all' || 
      teacher.typeContrat === selectedContractType;

    const matchesStatus = 
      selectedStatus === 'all' || 
      teacher.statut === selectedStatus;

    return matchesSearch && matchesSubject && matchesContract && matchesStatus;
  });

  // Stats calculations
  const totalTeachers = teachers.length;
  const activeContracts = teachers.filter(t => t.statut === 'ACTIF').length;
  const expiringSoonContracts = teachers.filter(t => t.statut === 'ECHEANCE_PROCHE').length;

  // Helper to format currency
  const formatGNF = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'GNF', maximumFractionDigits: 0 })
      .format(amount)
      .replace('GNF', 'GNF');
  };

  // Helper for initials
  const getInitials = (nom: string, prenom: string) => {
    const n = nom ? nom.charAt(0) : '';
    const p = prenom ? prenom.charAt(0) : '';
    return `${n}${p}`.toUpperCase();
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setImportedFile(file);
        setImportStatus('success');
      } else {
        setImportStatus('error');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setImportedFile(file);
        setImportStatus('success');
      } else {
        setImportStatus('error');
      }
    }
  };

  // Submit manual teacher
  const handleAddTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Generate automatic matricule (ENS-2026-0XX)
    const nextNum = String(teachers.length + 1).padStart(3, '0');
    const autoMatricule = `ENS-2026-${nextNum}`;

    // Create default schedule for new teacher based on assignments
    const defaultSchedule: ScheduleItem[] = [];
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
    const slots = ['08h00 - 10h00', '10h15 - 12h15', '14h00 - 16h00'];

    tempAssignments.forEach((assign, index) => {
      const day = days[index % days.length];
      const slot = slots[Math.floor(index / days.length) % slots.length];
      defaultSchedule.push({
        jour: day,
        creneau: slot,
        classe: assign.classe,
        matiere: assign.matiere
      });
    });

    const addedTeacher: Omit<Teacher, 'id'> = {
      matricule: autoMatricule,
      nom: newTeacher.nom.toUpperCase(),
      prenom: newTeacher.prenom,
      matierePrincipale: newTeacher.matierePrincipale,
      matieres: Array.from(new Set([newTeacher.matierePrincipale, ...tempAssignments.map(a => a.matiere)])),
      typeContrat: newTeacher.typeContrat,
      dateDebutContrat: newTeacher.dateDebutContrat,
      dateFinContrat: newTeacher.typeContrat !== 'CDI' ? (newTeacher.dateFinContrat || undefined) : undefined,
      salaireBase: Number(newTeacher.salaireBase),
      tauxHoraireSup: Number(newTeacher.tauxHoraireSup) || 0,
      volumeHoraireSup: Number(newTeacher.volumeHoraireSup) || 0,
      diplome: newTeacher.diplome || 'Non spécifié',
      telephone: newTeacher.telephone,
      email: newTeacher.email || `${newTeacher.prenom.toLowerCase().replace(/\s+/g, '')}.${newTeacher.nom.toLowerCase()}@lakoli.edu.gn`,
      statut: newTeacher.statut,
      affectations: tempAssignments,
      emploiDuTemps: defaultSchedule
    };

    onAddTeacher(addedTeacher);
    setIsAddModalOpen(false);

    // Reset state
    setNewTeacher({
      nom: '',
      prenom: '',
      matierePrincipale: AVAILABLE_SUBJECTS[0],
      matieres: [AVAILABLE_SUBJECTS[0]],
      typeContrat: 'CDI',
      dateDebutContrat: new Date().toISOString().split('T')[0],
      dateFinContrat: '',
      salaireBase: 3500000,
      tauxHoraireSup: 120000,
      volumeHoraireSup: 0,
      diplome: '',
      telephone: '',
      email: '',
      statut: 'ACTIF'
    });
    setTempAssignments([]);
  };

  // Add assignment to list
  const handleAddAssignment = () => {
    if (!newAssignment.classe || !newAssignment.matiere) return;
    setTempAssignments(prev => [...prev, newAssignment]);
    
    // Auto-update volumeHoraireSup if it's an exam class (6e/10e/Terminale/Tle)
    const isExam = newAssignment.classe.includes('10ème') || newAssignment.classe.includes('Tle') || newAssignment.classe.includes('6ème');
    if (isExam) {
      setNewTeacher(prev => ({
        ...prev,
        volumeHoraireSup: prev.volumeHoraireSup + 2 // auto propose 2 overtime hours
      }));
    }
  };

  const handleRemoveAssignment = (index: number) => {
    setTempAssignments(prev => prev.filter((_, i) => i !== index));
  };

  // Submit simulated Excel import
  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importedFile) return;

    // Simulate import of 3 pre-configured teachers
    const simulatedTeachers: Teacher[] = [
      {
        id: `teacher-${Date.now()}-1`,
        matricule: `ENS-2026-00${teachers.length + 1}`,
        nom: 'SYLLA',
        prenom: 'Aboubacar Demba',
        photoUrl: '',
        matierePrincipale: 'Français',
        matieres: ['Français', 'Philosophie'],
        typeContrat: 'CDI',
        dateDebutContrat: '2023-01-15',
        salaireBase: 4100000,
        tauxHoraireSup: 130000,
        volumeHoraireSup: 2,
        diplome: 'Licence en Enseignement du Français (ISSEG Labe)',
        telephone: '+224 621 88 44 22',
        email: 'aboubacar.sylla@lakoli.edu.gn',
        statut: 'ACTIF',
        affectations: [
          { classe: '10ème Année', matiere: 'Français', volumeHoraire: 5 },
          { classe: '11ème Sciences Sociales', matiere: 'Français', volumeHoraire: 4 }
        ],
        emploiDuTemps: [
          { jour: 'Lundi', creneau: '10h15 - 12h15', classe: '10ème Année', matiere: 'Français' },
          { jour: 'Mardi', creneau: '08h00 - 10h00', classe: '11ème Sciences Sociales', matiere: 'Français' }
        ]
      },
      {
        id: `teacher-${Date.now()}-2`,
        matricule: `ENS-2026-00${teachers.length + 2}`,
        nom: 'BARRY',
        prenom: 'Mamadou Alimou',
        photoUrl: '',
        matierePrincipale: 'Mathématiques',
        matieres: ['Mathématiques'],
        typeContrat: 'VACATAIRE',
        dateDebutContrat: '2025-10-01',
        salaireBase: 2400000,
        tauxHoraireSup: 120000,
        volumeHoraireSup: 4,
        diplome: 'Licence de Mathématiques (Université de Kankan)',
        telephone: '+224 623 55 66 77',
        email: 'alimou.barry@lakoli.edu.gn',
        statut: 'ACTIF',
        affectations: [
          { classe: '9ème Année', matiere: 'Mathématiques', volumeHoraire: 4 },
          { classe: 'Tle Sciences Expérimentales', matiere: 'Mathématiques', volumeHoraire: 4 }
        ],
        emploiDuTemps: [
          { jour: 'Mercredi', creneau: '08h00 - 10h00', classe: '9ème Année', matiere: 'Mathématiques' },
          { jour: 'Jeudi', creneau: '10h15 - 12h15', classe: 'Tle Sciences Expérimentales', matiere: 'Mathématiques' }
        ]
      }
    ];

    onImportTeachers(simulatedTeachers);
    setIsImportModalOpen(false);
    setImportedFile(null);
    setImportStatus('idle');
  };

  return (
    <div id="enseignants-liste-container" className="space-y-6">
      
      {/* Search and Filters Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search Bar */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            id="enseignants-search"
            type="text"
            placeholder="Rechercher par nom, matricule, matière..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lakoli-navy focus:border-lakoli-navy transition-colors"
          />
        </div>

        {/* Filters Panel */}
        <div className="w-full md:w-auto flex flex-wrap gap-2.5 items-center justify-end">
          
          {/* Subject Filter */}
          <select
            id="filter-subject"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-white border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-lakoli-navy"
          >
            <option value="all">Toutes les matières</option>
            {AVAILABLE_SUBJECTS.map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>

          {/* Contract Type Filter */}
          <select
            id="filter-contract"
            value={selectedContractType}
            onChange={(e) => setSelectedContractType(e.target.value)}
            className="bg-white border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-lakoli-navy"
          >
            <option value="all">Tous les contrats</option>
            <option value="CDI">CDI</option>
            <option value="CDD">CDD</option>
            <option value="VACATAIRE">Vacataire</option>
          </select>

          {/* Status Filter */}
          <select
            id="filter-status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-white border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-lakoli-navy"
          >
            <option value="all">Tous les statuts</option>
            <option value="ACTIF">Actif</option>
            <option value="CONGE">En congé</option>
            <option value="ECHEANCE_PROCHE">Échéance proche</option>
          </select>

          {/* Action buttons (COMPTABLE ONLY) */}
          {role === 'COMPTABLE' ? (
            <div className="flex gap-2 ml-2">
              <button
                id="enseignants-btn-add"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-lakoli-navy hover:bg-[#062f59] rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Nouveau
              </button>
              <button
                id="enseignants-btn-import"
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                Importer
              </button>
            </div>
          ) : (
            <div className="flex items-center px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-full text-xs font-bold gap-1.5 shadow-2xs select-none ml-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Mode lecture seule ({role === 'DIRECTEUR' ? 'Directeur' : 'Fondateur'})
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards Row */}
      <div id="enseignants-stats-grid" className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Total Teachers Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-lakoli-info-bg rounded-lg">
            <Users className="h-6 w-6 text-lakoli-info" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Enseignants</p>
            <p className="text-2xl font-bold text-slate-800">{totalTeachers}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Enseignants sous contrat d'établissement</p>
          </div>
        </div>

        {/* Active Contracts Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-lakoli-success-bg rounded-lg">
            <CheckCircle2 className="h-6 w-6 text-lakoli-success" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Contrats Actifs</p>
            <p className="text-2xl font-bold text-slate-800">{activeContracts}</p>
            <p className="text-[10px] text-lakoli-success font-medium mt-0.5">
              {totalTeachers > 0 ? `${Math.round((activeContracts / totalTeachers) * 100)}%` : '0%'} du personnel en activité
            </p>
          </div>
        </div>

        {/* Expiring Soon Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-lakoli-danger-bg rounded-lg">
            <AlertTriangle className="h-6 w-6 text-lakoli-danger" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Échéances Proches / Fin de contrat</p>
            <p className="text-2xl font-bold text-slate-800">{expiringSoonContracts}</p>
            <p className="text-[10px] text-lakoli-danger font-medium mt-0.5">
              {expiringSoonContracts} contrat(s) à renouveler ou relancer
            </p>
          </div>
        </div>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-5">Enseignant</th>
                <th className="py-3 px-5">Matière Principale</th>
                <th className="py-3 px-5">Type de Contrat</th>
                <th className="py-3 px-5">Salaire de Base</th>
                <th className="py-3 px-5">Statut</th>
                <th className="py-3 px-5 text-right">Fiche</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    Aucun enseignant trouvé correspondant à vos critères de recherche.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map(teacher => {
                  const initials = getInitials(teacher.nom, teacher.prenom);
                  return (
                    <tr 
                      key={teacher.id}
                      onClick={() => onSelectTeacher(teacher)}
                      className="group hover:bg-slate-50/50 transition-colors cursor-pointer"
                    >
                      {/* Photo + Identity */}
                      <td className="py-3.5 px-5 flex items-center space-x-3.5">
                        <div className="h-10 w-10 rounded-full bg-lakoli-navy text-white text-xs font-extrabold flex items-center justify-center border border-slate-100 shadow-xs">
                          {initials}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 group-hover:text-lakoli-navy transition-colors">
                            {teacher.nom} {teacher.prenom}
                          </div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">
                            {teacher.matricule} • {teacher.diplome.split('(')[0].trim()}
                          </div>
                        </div>
                      </td>

                      {/* Primary Subject */}
                      <td className="py-3.5 px-5">
                        <span className="font-semibold text-slate-700">{teacher.matierePrincipale}</span>
                        {teacher.matieres.length > 1 && (
                          <span className="block text-[10px] text-slate-400 font-medium">
                            +{teacher.matieres.length - 1} autres matières
                          </span>
                        )}
                      </td>

                      {/* Contract Badge */}
                      <td className="py-3.5 px-5">
                        {teacher.typeContrat === 'CDI' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                            CDI (Indéterminé)
                          </span>
                        )}
                        {teacher.typeContrat === 'CDD' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                            CDD (Déterminé)
                          </span>
                        )}
                        {teacher.typeContrat === 'VACATAIRE' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            Vacataire
                          </span>
                        )}
                      </td>

                      {/* Base Salary */}
                      <td className="py-3.5 px-5 font-mono font-semibold text-slate-700">
                        {formatGNF(teacher.salaireBase)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-5">
                        {teacher.statut === 'ACTIF' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-lakoli-success-bg text-lakoli-success">
                            <span className="w-1.5 h-1.5 rounded-full bg-lakoli-success mr-1.5"></span>
                            Actif
                          </span>
                        )}
                        {teacher.statut === 'CONGE' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-lakoli-warning-bg text-lakoli-warning">
                            <span className="w-1.5 h-1.5 rounded-full bg-lakoli-warning mr-1.5"></span>
                            Congé
                          </span>
                        )}
                        {teacher.statut === 'ECHEANCE_PROCHE' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-lakoli-danger-bg text-lakoli-danger animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-lakoli-danger mr-1.5"></span>
                            Échéance proche
                          </span>
                        )}
                      </td>

                      {/* Chevron Arrow */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="inline-flex items-center text-slate-400 group-hover:text-lakoli-navy transition-all transform group-hover:translate-x-1">
                          <span className="text-xs mr-1 opacity-0 group-hover:opacity-100 transition-opacity">Consulter</span>
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD TEACHER */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-lakoli-navy" />
                <h3 className="text-base font-bold text-slate-800">Ajouter un enseignant</h3>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  setIsAddModalOpen(false);
                  setTempAssignments([]);
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleAddTeacherSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                
                {/* Identity Information */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-lakoli-navy uppercase tracking-wider pb-1 border-b">1. Identité & Contact</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Nom (En capitales) *</label>
                      <input
                        type="text"
                        required
                        value={newTeacher.nom}
                        onChange={(e) => setNewTeacher(prev => ({ ...prev, nom: e.target.value }))}
                        placeholder="Ex: BEAVOGUI"
                        className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-lakoli-navy focus:outline-none uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Prénom *</label>
                      <input
                        type="text"
                        required
                        value={newTeacher.prenom}
                        onChange={(e) => setNewTeacher(prev => ({ ...prev, prenom: e.target.value }))}
                        placeholder="Ex: Alexandre"
                        className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-lakoli-navy focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Matière Principale *</label>
                    <select
                      value={newTeacher.matierePrincipale}
                      onChange={(e) => setNewTeacher(prev => ({ ...prev, matierePrincipale: e.target.value }))}
                      className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-lakoli-navy focus:outline-none"
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
                      required
                      value={newTeacher.diplome}
                      onChange={(e) => setNewTeacher(prev => ({ ...prev, diplome: e.target.value }))}
                      placeholder="Ex: Master en Sciences Mathématiques (UGANC)"
                      className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-lakoli-navy focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Téléphone *</label>
                      <input
                        type="tel"
                        required
                        value={newTeacher.telephone}
                        onChange={(e) => setNewTeacher(prev => ({ ...prev, telephone: e.target.value }))}
                        placeholder="+224 6XX XX XX XX"
                        className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-lakoli-navy focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">E-mail (Optionnel)</label>
                      <input
                        type="email"
                        value={newTeacher.email}
                        onChange={(e) => setNewTeacher(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Ex: alexandre@lakoli.edu.gn"
                        className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-lakoli-navy focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Contract & Salary */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-lakoli-navy uppercase tracking-wider pb-1 border-b">2. Contrat & Rémunération</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Type de Contrat</label>
                      <select
                        value={newTeacher.typeContrat}
                        onChange={(e) => setNewTeacher(prev => ({ ...prev, typeContrat: e.target.value as ContractType }))}
                        className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-lakoli-navy focus:outline-none"
                      >
                        <option value="CDI">CDI (Indéterminé)</option>
                        <option value="CDD">CDD (Déterminé)</option>
                        <option value="VACATAIRE">Vacataire / Horaire</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Statut Personnel</label>
                      <select
                        value={newTeacher.statut}
                        onChange={(e) => setNewTeacher(prev => ({ ...prev, statut: e.target.value as any }))}
                        className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-lakoli-navy focus:outline-none"
                      >
                        <option value="ACTIF">Actif / Présent</option>
                        <option value="CONGE">Congé / Indisponible</option>
                        <option value="ECHEANCE_PROCHE">Échéance proche</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Date Début Contrat *</label>
                      <input
                        type="date"
                        required
                        value={newTeacher.dateDebutContrat}
                        onChange={(e) => setNewTeacher(prev => ({ ...prev, dateDebutContrat: e.target.value }))}
                        className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-lakoli-navy focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Date Fin (CDD/Vacataire)</label>
                      <input
                        type="date"
                        disabled={newTeacher.typeContrat === 'CDI'}
                        value={newTeacher.dateFinContrat}
                        onChange={(e) => setNewTeacher(prev => ({ ...prev, dateFinContrat: e.target.value }))}
                        className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-lakoli-navy focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Salaire de Base Mensuel *</label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        value={newTeacher.salaireBase}
                        onChange={(e) => setNewTeacher(prev => ({ ...prev, salaireBase: Number(e.target.value) }))}
                        placeholder="Ex: 3800000"
                        className="w-full text-sm pl-3 pr-12 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-lakoli-navy focus:outline-none font-semibold font-mono"
                      />
                      <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">GNF</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Taux Heure Sup.</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={newTeacher.tauxHoraireSup}
                          onChange={(e) => setNewTeacher(prev => ({ ...prev, tauxHoraireSup: Number(e.target.value) }))}
                          placeholder="Ex: 120000"
                          className="w-full text-xs pl-2 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-lakoli-navy font-mono"
                        />
                        <span className="absolute right-2 top-2 text-[10px] font-bold text-slate-400">GNF/h</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Vol. Horaire Sup. / sem</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={newTeacher.volumeHoraireSup}
                          onChange={(e) => setNewTeacher(prev => ({ ...prev, volumeHoraireSup: Number(e.target.value) }))}
                          placeholder="Ex: 4"
                          className="w-full text-xs pl-2 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-lakoli-navy font-mono"
                        />
                        <span className="absolute right-2 top-2 text-[10px] font-bold text-slate-400">heures</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Affectations & Classes */}
              <div className="space-y-4 border-t pt-4 mb-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-lakoli-navy uppercase tracking-wider">3. Affectations de Classes</h4>
                  <span className="text-[10px] text-slate-400">Affecter des cours pour calculer l'emploi du temps</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 items-end">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Classe</label>
                    <select
                      value={newAssignment.classe}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, classe: e.target.value }))}
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
                      value={newAssignment.matiere}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, matiere: e.target.value }))}
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
                        value={newAssignment.volumeHoraire}
                        onChange={(e) => setNewAssignment(prev => ({ ...prev, volumeHoraire: Number(e.target.value) }))}
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
                      Ajouter l'affectation
                    </button>
                  </div>
                </div>

                {/* List of current assignments in form */}
                {tempAssignments.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {tempAssignments.map((assign, idx) => {
                      const isExam = assign.classe.includes('10ème') || assign.classe.includes('Tle') || assign.classe.includes('6ème');
                      return (
                        <div 
                          key={idx}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        >
                          <span className="font-semibold text-slate-700">{assign.classe}</span>
                          <span className="text-slate-400">|</span>
                          <span className="text-slate-600">{assign.matiere}</span>
                          <span className="font-mono text-slate-500 bg-slate-100 px-1 rounded">({assign.volumeHoraire}h)</span>
                          {isExam && (
                            <span className="text-[9px] px-1 bg-red-50 text-red-600 font-bold rounded">Exam</span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveAssignment(idx)}
                            className="text-slate-400 hover:text-red-500 ml-1.5 font-bold"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-2">
                    Aucune classe affectée. Veuillez ajouter des classes ci-dessus.
                  </p>
                )}
              </div>

              {/* Modal Actions */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 -mx-6 -mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setTempAssignments([]);
                  }}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-lakoli-navy hover:bg-[#062f59] rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  Enregistrer l'enseignant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EXCEL IMPORT SIMULATOR */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-lakoli-navy" />
                <h3 className="text-base font-bold text-slate-800">Importer une liste d'enseignants</h3>
              </div>
              <button 
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportedFile(null);
                  setImportStatus('idle');
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleImportSubmit} className="p-6 space-y-5">
              
              <p className="text-xs text-slate-500 leading-relaxed">
                Importez rapidement vos fiches enseignants de l'établissement LAKOLI depuis un fichier Excel. Notre simulateur intègre automatiquement les matières, les volumes horaires hebdomadaires et les contrats types correspondants.
              </p>

              {/* Drag and Drop Box */}
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer relative ${
                  dragActive ? 'border-lakoli-navy bg-slate-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100/50'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                <Upload className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-700">Glissez-déposez votre fichier ici</p>
                <p className="text-xs text-slate-400 mt-1">ou cliquez pour parcourir vos dossiers (.xlsx ou .xls uniquement)</p>
              </div>

              {/* Status Indicators */}
              {importStatus === 'success' && importedFile && (
                <div className="p-3 bg-lakoli-success-bg border border-lakoli-success/10 rounded-lg flex items-center justify-between text-xs text-lakoli-success">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-lakoli-success" />
                    <span>Fichier <strong className="font-bold">{importedFile.name}</strong> prêt. <span className="text-slate-400">({(importedFile.size/1024).toFixed(1)} Ko)</span></span>
                  </div>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImportedFile(null);
                      setImportStatus('idle');
                    }}
                    className="text-lakoli-success hover:underline font-bold"
                  >
                    Supprimer
                  </button>
                </div>
              )}

              {importStatus === 'error' && (
                <div className="p-3 bg-lakoli-danger-bg border border-lakoli-danger/10 rounded-lg flex items-center gap-2 text-xs text-lakoli-danger">
                  <AlertCircle className="h-4 w-4" />
                  <span>Format invalide. Veuillez sélectionner un fichier Excel standard (.xlsx ou .xls).</span>
                </div>
              )}

              {/* Template download link */}
              <div className="flex items-center justify-between text-xs border-t pt-4">
                <span className="text-slate-500">Pas de modèle disponible ?</span>
                <button 
                  type="button" 
                  className="inline-flex items-center gap-1 font-semibold text-lakoli-navy hover:text-[#062f59] hover:underline cursor-pointer"
                  onClick={() => alert("Le téléchargement du gabarit Excel de LAKOLI a débuté (Simulé) !")}
                >
                  <FileDown className="h-3.5 w-3.5" />
                  Gabarit Enseignants
                </button>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setImportedFile(null);
                    setImportStatus('idle');
                  }}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!importedFile}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors shadow-sm inline-flex items-center gap-1.5 ${
                    importedFile 
                      ? 'bg-lakoli-navy hover:bg-[#062f59] text-white cursor-pointer' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Lancer l'importation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
