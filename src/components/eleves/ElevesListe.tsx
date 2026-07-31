import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Upload, 
  ChevronRight, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  FileSpreadsheet, 
  X,
  UserCheck,
  FileDown,
  Info
} from 'lucide-react';
import { Student, PaymentStatus, UserRole } from '../../types';
import { AVAILABLE_CLASSES, CLASSES_BY_LEVEL } from '../../mockData';

interface ElevesListeProps {
  students: Student[];
  onSelectStudent: (student: Student) => void;
  onAddStudent: (newStudent: Omit<Student, 'id'>) => void;
  onImportStudents: (imported: Student[]) => void;
  role: UserRole;
}

export default function ElevesListe({ 
  students, 
  onSelectStudent, 
  onAddStudent, 
  onImportStudents,
  role 
}: ElevesListeProps) {
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // New Student form states
  const [newStudent, setNewStudent] = useState({
    matricule: `LAK-2026-0${students.length + 1}`,
    nom: '',
    prenom: '',
    classe: AVAILABLE_CLASSES[0],
    sessionScolaire: '2025-2026',
    statutPaiement: 'A_JOUR' as PaymentStatus,
    dateNaissance: '',
    lieuNaissance: '',
    photoUrl: '',
    filiation: {
      pere: { nom: '', telephone: '' },
      mere: { nom: '', telephone: '' },
      tuteur: { nom: '', telephone: '', lien: '' }
    }
  });

  // Excel drag and drop simulator states
  const [dragActive, setDragActive] = useState(false);
  const [importedFile, setImportedFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Stats calculation
  const totalStudents = students.length;
  const upToDateStudents = students.filter(s => s.statutPaiement === 'A_JOUR').length;
  const delayedStudents = students.filter(s => s.statutPaiement === 'EN_RETARD').length;

  // Filter students based on state
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.matricule.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClass = selectedClass === 'all' || student.classe === selectedClass;
    const matchesStatus = selectedStatus === 'all' || student.statutPaiement === selectedStatus;

    return matchesSearch && matchesClass && matchesStatus;
  });

  // Helper for generating avatar initials
  const getInitials = (firstName: string, lastName: string) => {
    const first = firstName ? firstName.charAt(0) : '';
    const last = lastName ? lastName.charAt(0) : '';
    return (first + last).toUpperCase();
  };

  // Form handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child, grandChild] = name.split('.');
      if (grandChild) {
        setNewStudent(prev => ({
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
        setNewStudent(prev => ({
          ...prev,
          [parent]: {
            ...((prev as any)[parent]),
            [child]: value
          }
        }));
      }
    } else {
      setNewStudent(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.nom || !newStudent.prenom) {
      alert('Veuillez remplir le nom et le prénom de l\'élève.');
      return;
    }
    onAddStudent({
      ...newStudent,
      historiquePaiements: []
    });
    // Reset form
    setNewStudent({
      matricule: `LAK-2026-0${students.length + 2}`,
      nom: '',
      prenom: '',
      classe: AVAILABLE_CLASSES[0],
      sessionScolaire: '2025-2026',
      statutPaiement: 'A_JOUR',
      dateNaissance: '',
      lieuNaissance: '',
      photoUrl: '',
      filiation: {
        pere: { nom: '', telephone: '' },
        mere: { nom: '', telephone: '' },
        tuteur: { nom: '', telephone: '', lien: '' }
      }
    });
    setIsAddModalOpen(false);
  };

  // Excel Drag and Drop Handlers
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
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
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
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
        setImportedFile(file);
        setImportStatus('success');
      } else {
        setImportStatus('error');
      }
    }
  };

  const executeMockImport = () => {
    // Generate a few realistic students from Excel
    const importedStudents: Student[] = [
      {
        id: `import-${Date.now()}-1`,
        matricule: 'LAK-2026-EX1',
        nom: 'DIABY',
        prenom: 'Ibrahima Sory',
        classe: 'Tle Sciences Mathématiques',
        sessionScolaire: '2025-2026',
        statutPaiement: 'A_JOUR',
        dateNaissance: '2008-02-14',
        lieuNaissance: 'Boké',
        filiation: {
          pere: { nom: 'Diaby Sekou', telephone: '+224 624 33 22 11' },
          mere: { nom: 'Kaba Hadja', telephone: '+224 621 55 44 33' },
          tuteur: { nom: '', telephone: '', lien: '' }
        },
        historiquePaiements: [
          {
            id: `ip-1`,
            libelle: 'Inscription + 1ère Échéance',
            date: '2025-09-20',
            montant: 1500000,
            moyenPaiement: 'Espèces',
            soldeRestant: 1000000
          }
        ]
      },
      {
        id: `import-${Date.now()}-2`,
        matricule: 'LAK-2026-EX2',
        nom: 'TOURE',
        prenom: 'Kadiatou',
        classe: '10ème Année',
        sessionScolaire: '2025-2026',
        statutPaiement: 'EN_RETARD',
        dateNaissance: '2011-05-18',
        lieuNaissance: 'Conakry',
        filiation: {
          pere: { nom: 'Touré Moussa', telephone: '+224 620 99 88 11' },
          mere: { nom: 'Soumah M\'mah', telephone: '+224 626 44 22 11' },
          tuteur: { nom: 'Sylla Ousmane', telephone: '+224 628 33 22 55', lien: 'Tuteur légal' }
        },
        historiquePaiements: []
      }
    ];

    onImportStudents(importedStudents);
    setImportedFile(null);
    setImportStatus('idle');
    setIsImportModalOpen(false);
  };

  return (
    <div id="eleves-container" className="space-y-6">
      {/* Upper Bar: Search and Filters */}
      <div id="eleves-filters-bar" className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            id="eleves-search-input"
            type="text"
            placeholder="Rechercher par nom, prénom ou matricule..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lakoli-navy focus:border-lakoli-navy transition-colors"
          />
        </div>

        {/* Filter Dropdowns and Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Class Filter */}
          <div className="flex items-center space-x-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              id="eleves-filter-classe"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-white border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-lakoli-navy"
            >
              <option value="all">Toutes les classes</option>
              {CLASSES_BY_LEVEL.map(group => (
                <optgroup key={group.level} label={group.label}>
                  {group.classes.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Payment Status Filter */}
          <select
            id="eleves-filter-statut"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-white border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-lakoli-navy"
          >
            <option value="all">Tous les statuts de paiement</option>
            <option value="A_JOUR">À jour</option>
            <option value="EN_RETARD">En retard</option>
          </select>

          {/* Role specific actions */}
          {role === 'COMPTABLE' ? (
            <div className="flex items-center gap-2 ml-auto md:ml-0">
              <button
                id="eleves-btn-import"
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5 text-slate-500" />
                Importer Excel
              </button>
              <button
                id="eleves-btn-add"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-lakoli-navy hover:bg-[#062f59] rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Ajouter un élève
              </button>
            </div>
          ) : (
            <div className="flex items-center px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-full text-xs font-bold gap-1.5 shadow-2xs select-none">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Mode lecture seule ({role === 'DIRECTEUR' ? 'Directeur' : 'Fondateur'})
            </div>
          )}
        </div>
      </div>

      {/* 3 Stats Cards */}
      <div id="eleves-stats-grid" className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Students Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-lakoli-info-bg rounded-lg">
            <Users className="h-6 w-6 text-lakoli-info" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total élèves</p>
            <h3 className="text-2xl font-semibold text-slate-800 mt-0.5">{totalStudents}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Inscrits pour l'année en cours</p>
          </div>
        </div>

        {/* Up to Date Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-lakoli-success-bg rounded-lg">
            <CheckCircle2 className="h-6 w-6 text-lakoli-success" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Paiements à jour</p>
            <h3 className="text-2xl font-semibold text-slate-800 mt-0.5">{upToDateStudents}</h3>
            <p className="text-[10px] text-lakoli-success font-medium mt-0.5">
              {totalStudents > 0 ? `${Math.round((upToDateStudents / totalStudents) * 100)}%` : '0%'} de la scolarité à jour
            </p>
          </div>
        </div>

        {/* Delayed Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-lakoli-danger-bg rounded-lg">
            <AlertTriangle className="h-6 w-6 text-lakoli-danger" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Paiements en retard</p>
            <h3 className="text-2xl font-semibold text-slate-800 mt-0.5">{delayedStudents}</h3>
            <p className="text-[10px] text-lakoli-danger font-medium mt-0.5">
              {totalStudents > 0 ? `${Math.round((delayedStudents / totalStudents) * 100)}%` : '0%'} d'impayés à relancer
            </p>
          </div>
        </div>
      </div>

      {/* Table: Students List */}
      <div id="eleves-table-card" className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-sm font-semibold text-slate-800">Répertoire des élèves ({filteredStudents.length})</h2>
          <span className="text-xs text-slate-500">Cliquez sur un élève pour voir sa fiche détaillée</span>
        </div>

        <div className="overflow-x-auto">
          {filteredStudents.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-semibold uppercase tracking-wider bg-slate-50/20">
                  <th className="py-3 px-5">Élève</th>
                  <th className="py-3 px-5">Classe</th>
                  <th className="py-3 px-5">Session scolaire</th>
                  <th className="py-3 px-5">Statut Paiement</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredStudents.map((student) => (
                  <tr 
                    key={student.id} 
                    onClick={() => onSelectStudent(student)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* Student Identity and Avatar */}
                    <td className="py-3.5 px-5 flex items-center space-x-3">
                      {student.photoUrl ? (
                        <img 
                          src={student.photoUrl} 
                          alt={`${student.prenom} ${student.nom}`} 
                          className="h-10 w-10 rounded-full object-cover border border-slate-200"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-semibold text-xs uppercase">
                          {getInitials(student.prenom, student.nom)}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-slate-800 group-hover:text-lakoli-navy transition-colors">
                          {student.nom} {student.prenom}
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          {student.matricule}
                        </div>
                      </div>
                    </td>

                    {/* Class */}
                    <td className="py-3.5 px-5 text-slate-600 font-medium">
                      {student.classe}
                    </td>

                    {/* School Session */}
                    <td className="py-3.5 px-5 text-slate-500 text-xs">
                      {student.sessionScolaire}
                    </td>

                    {/* Payment Badge Status */}
                    <td className="py-3.5 px-5">
                      {student.statutPaiement === 'A_JOUR' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-lakoli-success-bg text-lakoli-success">
                          <span className="w-1.5 h-1.5 rounded-full bg-lakoli-success mr-1.5"></span>
                          À jour
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-lakoli-danger-bg text-lakoli-danger animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-lakoli-danger mr-1.5"></span>
                          En retard
                        </span>
                      )}
                    </td>

                    {/* Chevron icon */}
                    <td className="py-3.5 px-5 text-right">
                      <div className="inline-flex items-center text-slate-400 group-hover:text-lakoli-navy transition-all transform group-hover:translate-x-1">
                        <span className="text-xs mr-1 opacity-0 group-hover:opacity-100 transition-opacity">Fiche</span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 px-4">
              <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium text-sm">Aucun élève ne correspond aux filtres appliqués</p>
              <p className="text-slate-400 text-xs mt-1">Essayer d'ajuster votre recherche ou vos critères de filtre.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: ADD STUDENT */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-lakoli-navy" />
                <h3 className="text-base font-bold text-slate-800">Ajouter un nouvel élève</h3>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-200/50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleFormSubmit}>
              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                
                {/* Section 1: Identité */}
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
                        value={newStudent.nom}
                        onChange={handleInputChange}
                        placeholder="Ex: DIALLO"
                        className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-lakoli-navy focus:outline-none uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Prénom <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        name="prenom"
                        required
                        value={newStudent.prenom}
                        onChange={handleInputChange}
                        placeholder="Ex: Amadou"
                        className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-lakoli-navy focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Matricule</label>
                      <input
                        type="text"
                        name="matricule"
                        value={newStudent.matricule}
                        onChange={handleInputChange}
                        className="w-full text-sm px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-mono focus:outline-none cursor-not-allowed"
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Classe <span className="text-rose-500">*</span></label>
                      <select
                        name="classe"
                        value={newStudent.classe}
                        onChange={handleInputChange}
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
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Date de naissance <span className="text-rose-500">*</span></label>
                      <input
                        type="date"
                        name="dateNaissance"
                        required
                        value={newStudent.dateNaissance}
                        onChange={handleInputChange}
                        className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-lakoli-navy focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Lieu de naissance <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        name="lieuNaissance"
                        required
                        value={newStudent.lieuNaissance}
                        onChange={handleInputChange}
                        placeholder="Ex: Conakry"
                        className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-lakoli-navy focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Statut initial de paiement</label>
                      <select
                        name="statutPaiement"
                        value={newStudent.statutPaiement}
                        onChange={handleInputChange}
                        className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-lakoli-navy focus:outline-none"
                      >
                        <option value="A_JOUR">À jour</option>
                        <option value="EN_RETARD">En retard (Paiement partiel/absent)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Session scolaire</label>
                      <input
                        type="text"
                        name="sessionScolaire"
                        value={newStudent.sessionScolaire}
                        onChange={handleInputChange}
                        className="w-full text-sm px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 focus:outline-none cursor-not-allowed"
                        disabled
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Filiation */}
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
                          value={newStudent.filiation.pere.nom}
                          onChange={handleInputChange}
                          placeholder="Nom du père"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-lakoli-navy focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Téléphone</label>
                        <input
                          type="text"
                          name="filiation.pere.telephone"
                          value={newStudent.filiation.pere.telephone}
                          onChange={handleInputChange}
                          placeholder="+224 6XX XX XX XX"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-lakoli-navy focus:outline-none"
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
                          value={newStudent.filiation.mere.nom}
                          onChange={handleInputChange}
                          placeholder="Nom de la mère"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-lakoli-navy focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Téléphone</label>
                        <input
                          type="text"
                          name="filiation.mere.telephone"
                          value={newStudent.filiation.mere.telephone}
                          onChange={handleInputChange}
                          placeholder="+224 6XX XX XX XX"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-lakoli-navy focus:outline-none"
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
                          value={newStudent.filiation.tuteur.nom}
                          onChange={handleInputChange}
                          placeholder="Nom du tuteur"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-lakoli-navy focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Téléphone</label>
                        <input
                          type="text"
                          name="filiation.tuteur.telephone"
                          value={newStudent.filiation.tuteur.telephone}
                          onChange={handleInputChange}
                          placeholder="+224 6XX XX XX XX"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-lakoli-navy focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Lien avec l'élève</label>
                        <input
                          type="text"
                          name="filiation.tuteur.lien"
                          value={newStudent.filiation.tuteur.lien}
                          onChange={handleInputChange}
                          placeholder="Ex: Oncle, Tante, Frère..."
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-lakoli-navy focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-lakoli-navy hover:bg-[#062f59] rounded-lg transition-colors shadow-sm"
                >
                  Enregistrer l'élève
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: IMPORT EXCEL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-lakoli-navy" />
                <h3 className="text-base font-bold text-slate-800">Importer une liste d'élèves (.xlsx)</h3>
              </div>
              <button 
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportStatus('idle');
                  setImportedFile(null);
                }} 
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-200/50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2.5 text-xs text-blue-800">
                <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Format de fichier requis :</span> Téléversez un fichier Excel (.xlsx ou .csv) contenant les colonnes : <code className="font-mono bg-blue-100/80 px-1 rounded">nom</code>, <code className="font-mono bg-blue-100/80 px-1 rounded">prenom</code>, <code className="font-mono bg-blue-100/80 px-1 rounded">classe</code>, <code className="font-mono bg-blue-100/80 px-1 rounded">date_naissance</code>.
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer relative ${
                  dragActive ? 'border-lakoli-navy bg-slate-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100/50'
                }`}
              >
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                <div className="space-y-2">
                  <div className="h-12 w-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto">
                    <FileSpreadsheet className="h-6 w-6 text-slate-500" />
                  </div>
                  <div className="text-sm font-semibold text-slate-700">
                    {importedFile ? importedFile.name : "Glissez-déposez votre fichier d'élèves ici"}
                  </div>
                  <div className="text-xs text-slate-400">
                    Ou cliquez pour parcourir vos fichiers (Max 10Mo)
                  </div>
                </div>
              </div>

              {/* Status indicators */}
              {importStatus === 'success' && importedFile && (
                <div className="p-3 bg-lakoli-success-bg border border-lakoli-success/10 rounded-lg flex items-center justify-between text-xs text-lakoli-success">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-lakoli-success" />
                    <span>Fichier <strong className="font-bold">{importedFile.name}</strong> prêt à l'importation. <span className="text-slate-400">({(importedFile.size/1024).toFixed(1)} Ko)</span></span>
                  </div>
                  <button 
                    onClick={() => {
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
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-800">
                  <X className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>Type de fichier invalide. Veuillez importer un document Excel (.xlsx, .xls) ou CSV.</span>
                </div>
              )}

              {/* Template Download Option */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <span className="text-slate-500">Pas de modèle disponible ?</span>
                <button 
                  type="button" 
                  className="inline-flex items-center gap-1 font-semibold text-lakoli-navy hover:text-[#062f59] hover:underline cursor-pointer"
                  onClick={() => alert("Le téléchargement du gabarit Excel de LAKOLI a débuté !")}
                >
                  <FileDown className="h-3.5 w-3.5" />
                  Télécharger le gabarit.xlsx
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportStatus('idle');
                  setImportedFile(null);
                }}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={executeMockImport}
                disabled={!importedFile}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors shadow-sm inline-flex items-center gap-1.5 ${
                  importedFile 
                    ? 'bg-lakoli-navy hover:bg-[#062f59] text-white cursor-pointer' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                Valider l'importation (2 élèves)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
