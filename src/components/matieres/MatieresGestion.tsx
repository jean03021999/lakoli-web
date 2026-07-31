import React, { useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Award, 
  AlertCircle, 
  Sparkles,
  Layers,
  GraduationCap,
  Bookmark,
  ChevronRight,
  Info,
  Sliders,
  Edit2,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AcademicLevel, LyceeStream, Subject, UserRole } from '../../types';

// Realistic list of Guinean school subjects per level/stream
const REALISTIC_GUINEAN_SUBJECTS: Record<AcademicLevel, string[] | Record<LyceeStream, string[]>> = {
  MATERNELLE: [
    'Initiation à la lecture',
    'Éveil scientifique',
    'Graphisme & Dessin',
    'Chants & Comptines',
    'Éducation sensorielle',
    'Activités motrices'
  ],
  PRIMAIRE: [
    'Français (Lecture & Écriture)',
    'Mathématiques (Calcul)',
    'Sciences d\'observation',
    'Histoire',
    'Géographie',
    'Éducation civique et morale',
    'Dessin & Travaux pratiques',
    'Éducation Physique et Sportive (EPS)'
  ],
  COLLEGE: [
    'Français',
    'Mathématiques',
    'Histoire',
    'Géographie',
    'Anglais',
    'Sciences de la Vie et de la Terre (SVT)',
    'Physique-Chimie',
    'Éducation Physique et Sportive (EPS)'
  ],
  LYCEE: {
    SCIENTIFIQUE: [
      'Mathématiques',
      'Physique',
      'Chimie',
      'Sciences de la Vie et de la Terre (SVT)',
      'Français',
      'Philosophie',
      'Histoire-Géographie',
      'Anglais',
      'Éducation Physique et Sportive (EPS)'
    ],
    LITTERAIRE: [
      'Français / Littérature',
      'Philosophie',
      'Anglais',
      'Histoire-Géographie',
      'Mathématiques',
      'Langue Vivante 2 (Espagnol / Allemand)',
      'Éducation Physique et Sportive (EPS)'
    ],
    SCIENCES_SOCIALES: [
      'Économie',
      'Philosophie',
      'Histoire',
      'Géographie',
      'Français',
      'Mathématiques',
      'Anglais',
      'Sociologie',
      'Éducation Physique et Sportive (EPS)'
    ]
  }
};

// Initial state with realistic subjects and coefficients
export const INITIAL_SUBJECTS: Subject[] = [
  // Maternelle
  { id: 'sub-mat-1', nom: 'Initiation à la lecture', level: 'MATERNELLE', coefficient: 1 },
  { id: 'sub-mat-2', nom: 'Éveil scientifique', level: 'MATERNELLE', coefficient: 1 },
  { id: 'sub-mat-3', nom: 'Graphisme & Dessin', level: 'MATERNELLE', coefficient: 1 },
  { id: 'sub-mat-4', nom: 'Chants & Comptines', level: 'MATERNELLE', coefficient: 1 },
  
  // Primaire
  { id: 'sub-pri-1', nom: 'Français (Lecture & Écriture)', level: 'PRIMAIRE', coefficient: 2 },
  { id: 'sub-pri-2', nom: 'Mathématiques (Calcul)', level: 'PRIMAIRE', coefficient: 2 },
  { id: 'sub-pri-3', nom: 'Sciences d\'observation', level: 'PRIMAIRE', coefficient: 1 },
  { id: 'sub-pri-4', nom: 'Histoire', level: 'PRIMAIRE', coefficient: 1 },
  { id: 'sub-pri-5', nom: 'Géographie', level: 'PRIMAIRE', coefficient: 1 },

  // Collège
  { id: 'sub-col-1', nom: 'Français', level: 'COLLEGE', coefficient: 4 },
  { id: 'sub-col-2', nom: 'Mathématiques', level: 'COLLEGE', coefficient: 4 },
  { id: 'sub-col-3', nom: 'Physique-Chimie', level: 'COLLEGE', coefficient: 3 },
  { id: 'sub-col-4', nom: 'Histoire', level: 'COLLEGE', coefficient: 2 },
  { id: 'sub-col-5', nom: 'Géographie', level: 'COLLEGE', coefficient: 2 },
  { id: 'sub-col-6', nom: 'Anglais', level: 'COLLEGE', coefficient: 2 },
  { id: 'sub-col-7', nom: 'Sciences de la Vie et de la Terre (SVT)', level: 'COLLEGE', coefficient: 2 },

  // Lycée - Scientifique
  { id: 'sub-lyc-s1', nom: 'Mathématiques', level: 'LYCEE', stream: 'SCIENTIFIQUE', coefficient: 5 },
  { id: 'sub-lyc-s2', nom: 'Physique', level: 'LYCEE', stream: 'SCIENTIFIQUE', coefficient: 4 },
  { id: 'sub-lyc-s3', nom: 'Chimie', level: 'LYCEE', stream: 'SCIENTIFIQUE', coefficient: 3 },
  { id: 'sub-lyc-s4', nom: 'Sciences de la Vie et de la Terre (SVT)', level: 'LYCEE', stream: 'SCIENTIFIQUE', coefficient: 4 },
  { id: 'sub-lyc-s5', nom: 'Français', level: 'LYCEE', stream: 'SCIENTIFIQUE', coefficient: 3 },
  { id: 'sub-lyc-s6', nom: 'Philosophie', level: 'LYCEE', stream: 'SCIENTIFIQUE', coefficient: 2 },

  // Lycée - Littéraire
  { id: 'sub-lyc-l1', nom: 'Français / Littérature', level: 'LYCEE', stream: 'LITTERAIRE', coefficient: 5 },
  { id: 'sub-lyc-l2', nom: 'Philosophie', level: 'LYCEE', stream: 'LITTERAIRE', coefficient: 4 },
  { id: 'sub-lyc-l3', nom: 'Anglais', level: 'LYCEE', stream: 'LITTERAIRE', coefficient: 4 },
  { id: 'sub-lyc-l4', nom: 'Histoire-Géographie', level: 'LYCEE', stream: 'LITTERAIRE', coefficient: 3 },
  { id: 'sub-lyc-l5', nom: 'Langue Vivante 2 (Espagnol / Allemand)', level: 'LYCEE', stream: 'LITTERAIRE', coefficient: 3 },

  // Lycée - Sciences Sociales
  { id: 'sub-lyc-ss1', nom: 'Économie', level: 'LYCEE', stream: 'SCIENCES_SOCIALES', coefficient: 4 },
  { id: 'sub-lyc-ss2', nom: 'Philosophie', level: 'LYCEE', stream: 'SCIENCES_SOCIALES', coefficient: 4 },
  { id: 'sub-lyc-ss3', nom: 'Histoire', level: 'LYCEE', stream: 'SCIENCES_SOCIALES', coefficient: 3 },
  { id: 'sub-lyc-ss4', nom: 'Géographie', level: 'LYCEE', stream: 'SCIENCES_SOCIALES', coefficient: 3 },
  { id: 'sub-lyc-ss5', nom: 'Sociologie', level: 'LYCEE', stream: 'SCIENCES_SOCIALES', coefficient: 2 }
];

interface MatieresGestionProps {
  role: UserRole;
}

export default function MatieresGestion({ role }: MatieresGestionProps) {
  const [subjects, setSubjects] = useState<Subject[]>(INITIAL_SUBJECTS);
  
  // Selection States
  const [selectedLevel, setSelectedLevel] = useState<AcademicLevel>('COLLEGE');
  const [selectedStream, setSelectedStream] = useState<LyceeStream>('SCIENTIFIQUE');

  // Add Subject Form States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedStandardMatiere, setSelectedStandardMatiere] = useState('');
  const [newCoefficient, setNewCoefficient] = useState<number>(2);

  // Custom Subject Form States
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [customName, setCustomName] = useState('');

  // Editing Coefficient State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCoefficient, setEditingCoefficient] = useState<number>(1);

  // Get subjects matching current filters
  const filteredSubjects = subjects.filter(sub => {
    if (sub.level !== selectedLevel) return false;
    if (selectedLevel === 'LYCEE' && sub.stream !== selectedStream) return false;
    return true;
  });

  // Get standard subjects lists based on current level & stream
  const getStandardOptionsForCurrentFilter = (): string[] => {
    let options: string[] = [];
    if (selectedLevel === 'LYCEE') {
      const list = REALISTIC_GUINEAN_SUBJECTS['LYCEE'] as Record<LyceeStream, string[]>;
      options = list[selectedStream] || [];
    } else {
      options = REALISTIC_GUINEAN_SUBJECTS[selectedLevel] as string[] || [];
    }
    
    // Exclude already added ones
    return options.filter(opt => !filteredSubjects.some(sub => sub.nom.toLowerCase() === opt.toLowerCase()));
  };

  const standardOptions = getStandardOptionsForCurrentFilter();

  // Reset standard selection when filters change
  React.useEffect(() => {
    const opts = getStandardOptionsForCurrentFilter();
    if (opts.length > 0) {
      setSelectedStandardMatiere(opts[0]);
    } else {
      setSelectedStandardMatiere('');
    }
    setIsAddOpen(false);
    setIsCustomOpen(false);
  }, [selectedLevel, selectedStream]);

  // Handle adding a standard subject
  const handleAddStandardSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStandardMatiere) return;

    const newSubject: Subject = {
      id: `sub-${Date.now()}`,
      nom: selectedStandardMatiere,
      level: selectedLevel,
      stream: selectedLevel === 'LYCEE' ? selectedStream : undefined,
      coefficient: Number(newCoefficient) || 1,
      isCustom: false
    };

    setSubjects(prev => [...prev, newSubject]);
    setIsAddOpen(false);
    
    // Auto reset selection
    const updatedOptions = standardOptions.filter(opt => opt !== selectedStandardMatiere);
    if (updatedOptions.length > 0) {
      setSelectedStandardMatiere(updatedOptions[0]);
    } else {
      setSelectedStandardMatiere('');
    }
  };

  // Handle adding a custom subject
  const handleAddCustomSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    // Check duplicate
    const isDuplicate = filteredSubjects.some(
      sub => sub.nom.trim().toLowerCase() === customName.trim().toLowerCase()
    );
    if (isDuplicate) {
      alert('Cette matière existe déjà pour ce niveau !');
      return;
    }

    const newSubject: Subject = {
      id: `sub-custom-${Date.now()}`,
      nom: customName.trim(),
      level: selectedLevel,
      stream: selectedLevel === 'LYCEE' ? selectedStream : undefined,
      coefficient: Number(newCoefficient) || 1,
      isCustom: true
    };

    setSubjects(prev => [...prev, newSubject]);
    setCustomName('');
    setIsCustomOpen(false);
  };

  // Handle deleting a subject
  const handleDeleteSubject = (id: string) => {
    if (role !== 'COMPTABLE') return;
    if (confirm('Êtes-vous sûr de vouloir retirer cette matière ?')) {
      setSubjects(prev => prev.filter(sub => sub.id !== id));
    }
  };

  // Handle updating coefficient
  const handleStartEditCoefficient = (sub: Subject) => {
    if (role !== 'COMPTABLE') return;
    setEditingId(sub.id);
    setEditingCoefficient(sub.coefficient);
  };

  const handleSaveCoefficient = (id: string) => {
    setSubjects(prev => prev.map(sub => 
      sub.id === id ? { ...sub, coefficient: Number(editingCoefficient) || 1 } : sub
    ));
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Banner Info */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0f172a] text-[#f8fafc]">
            Module Pédagogique
          </span>
          <h2 className="text-xl font-bold text-slate-800">Coefficients & Matières Officielles</h2>
          <p className="text-xs text-slate-500 max-w-xl">
            Configurez les coefficients des examens nationaux guinéens (Maternelle, Certificat d'Études Primaires, BEPC, Baccalauréat Unique) et ajoutez des matières spécifiques à l'établissement LAKOLI.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3 shrink-0">
          <Award className="h-8 w-8 text-lakoli-navy shrink-0" />
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Global</div>
            <div className="text-base font-extrabold text-slate-800 font-mono">{subjects.length} Matières</div>
          </div>
        </div>
      </div>

      {/* Grid: Selector Panel + Main Config Card */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* LEFT COLUMN: Academic Level Selectors & Stream selectors */}
        <div className="lg:col-span-1 space-y-4">
          
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
              <Layers className="h-4 w-4 text-lakoli-navy" />
              Niveau Scolaire
            </h3>

            {/* Level selection buttons */}
            <div className="space-y-1.5">
              {(['MATERNELLE', 'PRIMAIRE', 'COLLEGE', 'LYCEE'] as AcademicLevel[]).map(level => {
                const isActive = selectedLevel === level;
                const count = subjects.filter(s => s.level === level).length;
                
                return (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(level)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      isActive
                        ? 'bg-lakoli-navy border-lakoli-navy text-white shadow-sm'
                        : 'bg-white border-slate-100 hover:border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 shrink-0" />
                      {level === 'MATERNELLE' && 'Maternelle'}
                      {level === 'PRIMAIRE' && 'Primaire'}
                      {level === 'COLLEGE' && 'Collège'}
                      {level === 'LYCEE' && 'Lycée'}
                    </span>
                    <span className={`px-1.5 py-0.5 text-[9px] rounded-full font-mono ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditional Lycée stream selection */}
          {selectedLevel === 'LYCEE' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3"
            >
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                <Sliders className="h-4 w-4 text-lakoli-navy" />
                Série / Filière
              </h3>

              <div className="space-y-1.5">
                {(['SCIENTIFIQUE', 'LITTERAIRE', 'SCIENCES_SOCIALES'] as LyceeStream[]).map(stream => {
                  const isActive = selectedStream === stream;
                  const count = subjects.filter(s => s.level === 'LYCEE' && s.stream === stream).length;
                  
                  return (
                    <button
                      key={stream}
                      onClick={() => setSelectedStream(stream)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                        isActive
                          ? 'bg-blue-50 border-blue-200 text-lakoli-navy font-bold'
                          : 'bg-white border-slate-100 hover:border-slate-200 text-slate-500'
                      }`}
                    >
                      <span className="truncate">
                        {stream === 'SCIENTIFIQUE' && 'Sciences Math/Exp'}
                        {stream === 'LITTERAIRE' && 'Sciences Littéraires'}
                        {stream === 'SCIENCES_SOCIALES' && 'Sciences Sociales'}
                      </span>
                      <span className={`px-1.5 py-0.5 text-[9px] rounded font-mono shrink-0 ${
                        isActive ? 'bg-lakoli-navy text-white font-bold' : 'bg-slate-50 text-slate-400'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Note section about coefficients mandatory from Lycée */}
          <div className="p-4 bg-lakoli-info-bg/40 border border-lakoli-info/10 rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5 text-lakoli-info font-bold text-xs">
              <Info className="h-4 w-4 shrink-0" />
              <span>Note Officielle</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Le coefficient de chaque matière est <strong className="text-slate-800">obligatoire à partir du Lycée</strong> pour le calcul de la moyenne d'orientation et de l'admissibilité au baccalauréat guinéen.
            </p>
          </div>

        </div>

        {/* RIGHT COLUMN: Active List + Actions */}
        <div className="lg:col-span-3 space-y-6">
          
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
            
            {/* List Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-lakoli-navy" />
                  Matières configurées en{' '}
                  <span className="text-lakoli-navy">
                    {selectedLevel === 'MATERNELLE' && 'Maternelle'}
                    {selectedLevel === 'PRIMAIRE' && 'Primaire'}
                    {selectedLevel === 'COLLEGE' && 'Collège'}
                    {selectedLevel === 'LYCEE' && (
                      <>
                        Lycée ({selectedStream === 'SCIENTIFIQUE' && 'Sciences Math/Exp'}
                        {selectedStream === 'LITTERAIRE' && 'Sciences Littéraires'}
                        {selectedStream === 'SCIENCES_SOCIALES' && 'Sciences Sociales'})
                      </>
                    )}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Matières actives pour ce niveau. Les coefficients déterminent la pondération des évaluations.
                </p>
              </div>

              {role === 'COMPTABLE' ? (
                <div className="flex flex-wrap gap-2 shrink-0">
                  {standardOptions.length > 0 && (
                    <button
                      onClick={() => {
                        setIsAddOpen(true);
                        setIsCustomOpen(false);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-lakoli-navy hover:bg-[#062f59] rounded-lg transition-colors cursor-pointer shadow-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Associer une matière
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setIsCustomOpen(true);
                      setIsAddOpen(false);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    Matière personnalisée
                  </button>
                </div>
              ) : (
                <div className="flex items-center px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-full text-xs font-bold gap-1.5 shadow-2xs select-none shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  Mode lecture seule ({role === 'DIRECTEUR' ? 'Directeur' : 'Fondateur'})
                </div>
              )}
            </div>

            {/* In-Line adding panel (Standard Subject) */}
            <AnimatePresence>
              {isAddOpen && standardOptions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <form onSubmit={handleAddStandardSubject} className="bg-slate-50 rounded-2xl border border-slate-150 p-4 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Bookmark className="h-4 w-4 text-lakoli-navy" />
                        Associer une matière officielle guinéenne
                      </h4>
                      <button 
                        type="button" 
                        onClick={() => setIsAddOpen(false)}
                        className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        Fermer
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Matière disponible</label>
                        <select
                          value={selectedStandardMatiere}
                          onChange={(e) => setSelectedStandardMatiere(e.target.value)}
                          className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-lakoli-navy outline-none"
                        >
                          {standardOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Coefficient
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max="10"
                            required
                            value={newCoefficient}
                            onChange={(e) => setNewCoefficient(Number(e.target.value))}
                            className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 pr-10 focus:ring-1 focus:ring-lakoli-navy outline-none font-bold font-mono"
                          />
                          <span className="absolute right-3 top-2 text-[9px] font-bold text-slate-400">COEF</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                        <span>Note : Obligatoire à partir du Lycée</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setIsAddOpen(false)}
                          className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-md cursor-pointer"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1.5 text-xs font-bold text-white bg-lakoli-navy hover:bg-[#062f59] rounded-md cursor-pointer transition-colors"
                        >
                          Ajouter au programme
                        </button>
                      </div>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* In-Line adding panel (Custom Subject) */}
            <AnimatePresence>
              {isCustomOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <form onSubmit={handleAddCustomSubject} className="bg-amber-50/40 rounded-2xl border border-amber-100 p-4 space-y-4">
                    <div className="flex items-center justify-between border-b border-amber-100 pb-1.5">
                      <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        Créer une matière personnalisée hors-liste
                      </h4>
                      <button 
                        type="button" 
                        onClick={() => setIsCustomOpen(false)}
                        className="text-xs font-bold text-amber-600 hover:text-amber-800 cursor-pointer"
                      >
                        Fermer
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nom de la matière personnalisée</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Informatique pratique, Économie locale..."
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-lakoli-navy outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Coefficient
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max="10"
                            required
                            value={newCoefficient}
                            onChange={(e) => setNewCoefficient(Number(e.target.value))}
                            className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 pr-10 focus:ring-1 focus:ring-lakoli-navy outline-none font-bold font-mono"
                          />
                          <span className="absolute right-3 top-2 text-[9px] font-bold text-slate-400">COEF</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-amber-100">
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                        <span>Note : Obligatoire à partir du Lycée</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setIsCustomOpen(false)}
                          className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-md cursor-pointer"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1.5 text-xs font-bold text-white bg-lakoli-navy hover:bg-[#062f59] rounded-md cursor-pointer transition-colors"
                        >
                          Enregistrer la matière
                        </button>
                      </div>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Dynamic Subjects List Table */}
            {filteredSubjects.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-500">Aucune matière configurée</h4>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-1">
                  Associez des matières officielles de la liste ou créez des matières personnalisées pour ce niveau scolaire.
                </p>
                {role === 'COMPTABLE' && (
                  <button
                    onClick={() => setIsAddOpen(true)}
                    className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-lakoli-navy hover:underline cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    Associer la première matière
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-hidden border border-slate-100 rounded-xl">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-400 text-[10px] uppercase">
                      <th className="py-3 px-4">Matière</th>
                      <th className="py-3 px-4">Pédagogie & Niveau</th>
                      <th className="py-3 px-4 text-center w-36">Coefficient</th>
                      {role === 'COMPTABLE' && <th className="py-3 px-4 text-right w-24">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSubjects.map((sub) => {
                      const isEditing = editingId === sub.id;
                      
                      return (
                        <tr key={sub.id} className="hover:bg-slate-50/40 transition-colors group">
                          {/* Subject Name */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className={`p-1.5 rounded-lg ${
                                sub.isCustom 
                                  ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                                  : 'bg-lakoli-navy/5 text-lakoli-navy border border-lakoli-navy/10'
                              }`}>
                                <Bookmark className="h-3.5 w-3.5" />
                              </div>
                              <div>
                                <span className="font-bold text-slate-800">{sub.nom}</span>
                                {sub.isCustom && (
                                  <span className="ml-2 inline-flex items-center px-1.5 py-0.2 rounded-full text-[8px] font-extrabold bg-amber-100 text-amber-700 uppercase">
                                    Perso
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Level / Stream Info */}
                          <td className="py-3.5 px-4 text-slate-500 font-medium">
                            <span className="inline-flex items-center gap-1">
                              {sub.level === 'MATERNELLE' && 'Maternelle'}
                              {sub.level === 'PRIMAIRE' && 'Primaire'}
                              {sub.level === 'COLLEGE' && 'Collège'}
                              {sub.level === 'LYCEE' && `Lycée • ${
                                sub.stream === 'SCIENTIFIQUE' ? 'Sc. Math/Exp' :
                                sub.stream === 'LITTERAIRE' ? 'Lettres' : 'Sciences Soc.'
                              }`}
                            </span>
                          </td>

                          {/* Coefficient with Edit Trigger */}
                          <td className="py-3.5 px-4 text-center">
                            {isEditing ? (
                              <div className="inline-flex items-center gap-1">
                                <input
                                  type="number"
                                  min="1"
                                  max="10"
                                  value={editingCoefficient}
                                  onChange={(e) => setEditingCoefficient(Number(e.target.value))}
                                  className="w-16 px-1.5 py-1 text-center font-bold font-mono text-xs border border-slate-300 rounded focus:ring-1 focus:ring-lakoli-navy outline-none"
                                />
                                <button
                                  onClick={() => handleSaveCoefficient(sub.id)}
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer transition-colors"
                                  title="Valider"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="relative inline-block group/coef">
                                <span 
                                  onClick={() => handleStartEditCoefficient(sub)}
                                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-mono font-bold text-xs select-none ${
                                    role === 'COMPTABLE' 
                                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer' 
                                      : 'bg-slate-100 text-slate-500'
                                  }`}
                                  title={role === 'COMPTABLE' ? "Cliquez pour modifier le coefficient" : ""}
                                >
                                  {sub.coefficient}
                                  {role === 'COMPTABLE' && (
                                    <Edit2 className="h-2.5 w-2.5 text-slate-400 group-hover/coef:text-slate-600 transition-colors" />
                                  )}
                                </span>
                                
                                {/* Info Tooltip for Coefficient */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover/coef:block bg-slate-900 text-white text-[9px] font-semibold py-1 px-2 rounded whitespace-nowrap shadow-md z-10">
                                  Coefficient : {sub.coefficient} • Obligatoire à partir du Lycée
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Actions (Delete) */}
                          {role === 'COMPTABLE' && (
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => handleDeleteSubject(sub.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-all"
                                title="Retirer cette matière"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Coefficients Quick Recap footer */}
            {filteredSubjects.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 border border-slate-100 p-4 rounded-xl text-xs font-semibold text-slate-600">
                <div className="flex items-center gap-2">
                  <Bookmark className="h-4 w-4 text-lakoli-navy" />
                  <span>Somme des coefficients pour le bulletin :</span>
                  <span className="font-mono font-extrabold text-slate-800 text-sm">
                    {filteredSubjects.reduce((sum, s) => sum + s.coefficient, 0)}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 italic">
                  Note : Les bulletins scolaires calculent la moyenne pondérée de l'élève sur cette base.
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
