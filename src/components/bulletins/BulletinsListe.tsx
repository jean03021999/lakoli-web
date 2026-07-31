import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Award, 
  ChevronRight, 
  Download, 
  Printer, 
  RefreshCw, 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  Search, 
  TrendingUp, 
  Sparkles,
  Layers,
  GraduationCap,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Student, ClassBulletins, StudentBulletin, SubjectGrade, Subject, AcademicLevel, LyceeStream, UserRole } from '../../types';
import { AVAILABLE_CLASSES, CLASSES_BY_LEVEL } from '../../mockData';
import { INITIAL_SUBJECTS } from '../matieres/MatieresGestion';
import { INITIAL_EVALUATIONS } from '../../mockEvaluationsData';
import BulletinApercu from './BulletinApercu';

// Helper to determine academic details from class name
export function getAcademicDetails(classe: string): { level: AcademicLevel; stream?: LyceeStream } {
  const c = classe.toLowerCase();
  if (c.includes('section') || c.includes('maternelle')) {
    return { level: 'MATERNELLE' };
  }
  if (c.includes('1ère') || c.includes('2ème') || c.includes('3ème') || c.includes('4ème') || c.includes('5ème') || c.includes('6ème') || c.includes('primary') || c.includes('primaire')) {
    return { level: 'PRIMAIRE' };
  }
  if (c.includes('7ème') || c.includes('8ème') || c.includes('9ème') || c.includes('10ème') || c.includes('collège') || c.includes('college')) {
    return { level: 'COLLEGE' };
  }
  if (c.includes('tle') || c.includes('terminale') || c.includes('11ème') || c.includes('12ème') || c.includes('lycée') || c.includes('lycee')) {
    let stream: LyceeStream = 'SCIENTIFIQUE';
    if (c.includes('littéraire') || c.includes('litteraire')) {
      stream = 'LITTERAIRE';
    } else if (c.includes('sociales')) {
      stream = 'SCIENCES_SOCIALES';
    }
    return { level: 'LYCEE', stream };
  }
  return { level: 'PRIMAIRE' }; // Fallback
}

interface BulletinsListeProps {
  students: Student[];
  role: UserRole;
  evaluations: any[]; // To cross-reference with real user-submitted notes if any
}

// Simulated initial cache of bulletins so the screen is not completely empty on startup
const STORAGE_KEY = 'lakoli_bulletins_v1';

export default function BulletinsListe({
  students,
  role,
  evaluations
}: BulletinsListeProps) {
  // Filters state
  const [selectedClass, setSelectedClass] = useState<string>('10ème Année');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Trimestre 1');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Bulletins state
  const [allClassBulletins, setAllClassBulletins] = useState<ClassBulletins[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  // Selected bulletin for detailed preview
  const [activeBulletin, setActiveBulletin] = useState<StudentBulletin | null>(null);

  // Save bulletins to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allClassBulletins));
  }, [allClassBulletins]);

  // Find bulletins generated for currently selected class & period
  const activeClassBulletins = allClassBulletins.find(
    cb => cb.classe === selectedClass && cb.periode === selectedPeriod
  ) || null;

  // Filter students belonging to the selected class
  const classStudents = students.filter(s => s.classe === selectedClass);

  // Handle generating or regenerating bulletins for the class
  const handleGenerateBulletins = () => {
    if (role !== 'DIRECTEUR') return;

    // Get subjects for this academic level
    const { level, stream } = getAcademicDetails(selectedClass);
    
    // Filter subjects matching current academic level and stream
    const classSubjects = INITIAL_SUBJECTS.filter(sub => {
      if (sub.level !== level) return false;
      if (level === 'LYCEE' && sub.stream !== stream) return false;
      return true;
    });

    // If no subjects found, fall back to a reasonable list to make sure report is filled
    const activeSubjects = classSubjects.length > 0 ? classSubjects : INITIAL_SUBJECTS.filter(s => s.level === 'COLLEGE');

    // For each student in the class, generate their report card grades
    const generatedStudentBulletins: StudentBulletin[] = classStudents.map(student => {
      let totalCoefficients = 0;
      let totalPoints = 0;
      
      const grades: SubjectGrade[] = activeSubjects.map((sub, index) => {
        // 1. Check if there are real published evaluations for this student, subject, class, and period
        const actualEvaluations = (evaluations && evaluations.length > 0) ? evaluations : INITIAL_EVALUATIONS;
        const matchingRealEvaluations = actualEvaluations.filter(
          e => e.classe === selectedClass && 
               e.periode === selectedPeriod && 
               e.matiere.toLowerCase() === sub.nom.toLowerCase() &&
               (e.statut === 'PUBLIE' || e.statut === 'VALIDE')
        );

        let finalNote = 10; // Default
        
        if (matchingRealEvaluations.length > 0) {
          // Average the notes from matching real evaluations
          let sumNotes = 0;
          let count = 0;
          matchingRealEvaluations.forEach(evalItem => {
            const studentGradeObj = evalItem.notes.find((n: any) => n.studentId === student.id);
            if (studentGradeObj && studentGradeObj.statutPresence === 'PRESENT') {
              // Scale to 20 if needed
              const scaledNote = (studentGradeObj.note / evalItem.bareme) * 20;
              sumNotes += scaledNote;
              count++;
            }
          });
          if (count > 0) {
            finalNote = sumNotes / count;
          } else {
            // Student was absent in all, let's keep simulated or give 0? Usually we'll simulate a medium score
            finalNote = generateRealisticGrade(student.id, index, sub.nom);
          }
        } else {
          // 2. Fall back to realistic simulated grading
          finalNote = generateRealisticGrade(student.id, index, sub.nom);
        }

        // Keep grade in reasonable bounds [0, 20]
        finalNote = Math.max(0, Math.min(20, Math.round(finalNote * 100) / 100));

        // Appreciation wording
        let appreciation = "Travail convenable.";
        if (finalNote >= 16) appreciation = "Excellent trimestre. Félicitations !";
        else if (finalNote >= 14) appreciation = "Très bon trimestre. Travail sérieux.";
        else if (finalNote >= 12) appreciation = "Bon travail, poursuivez ainsi.";
        else if (finalNote >= 10) appreciation = "Résultats satisfaisants. Travail régulier.";
        else if (finalNote >= 8) appreciation = "Travail trop juste. Doit s'investir davantage.";
        else appreciation = "En grande difficulté. Doit redoubler d'efforts.";

        totalCoefficients += sub.coefficient;
        totalPoints += finalNote * sub.coefficient;

        return {
          subjectId: sub.id,
          subjectNom: sub.nom,
          coefficient: sub.coefficient,
          note: finalNote,
          appreciation
        };
      });

      const moyenneGenerale = totalCoefficients > 0 ? totalPoints / totalCoefficients : 10;

      // Board decisions
      let decision = "Admis / Encouragements";
      if (moyenneGenerale >= 16) decision = "Félicitations du Conseil de classe";
      else if (moyenneGenerale >= 14) decision = "Compliments du Conseil de classe";
      else if (moyenneGenerale >= 12) decision = "Encouragements de la Direction";
      else if (moyenneGenerale >= 10) decision = "Passage Satisfaisant";
      else decision = "Avertissement de travail de la Direction";

      return {
        studentId: student.id,
        studentNom: student.nom,
        studentPrenom: student.prenom,
        matricule: student.matricule,
        grades,
        totalCoefficients,
        totalPoints,
        moyenneGenerale,
        rang: '', // Computed after sorting
        decision
      };
    });

    // Compute ranks and handle ex-aequo
    const sortedBulletins = [...generatedStudentBulletins].sort((a, b) => b.moyenneGenerale - a.moyenneGenerale);
    
    let currentRank = 1;
    const bulletinsWithRanks = sortedBulletins.map((bul, index) => {
      if (index > 0 && bul.moyenneGenerale < sortedBulletins[index - 1].moyenneGenerale) {
        currentRank = index + 1;
      }
      
      const suffix = currentRank === 1 ? 'er' : 'e';
      return {
        ...bul,
        rang: `${currentRank}${suffix}`
      };
    });

    // Check if there is already a generation record to increment the version
    const existingIndex = allClassBulletins.findIndex(
      cb => cb.classe === selectedClass && cb.periode === selectedPeriod
    );

    const newVersion = existingIndex >= 0 ? allClassBulletins[existingIndex].version + 1 : 1;

    const newClassBulletins: ClassBulletins = {
      classe: selectedClass,
      periode: selectedPeriod,
      version: newVersion,
      bulletins: bulletinsWithRanks,
      generatedAt: new Date().toISOString()
    };

    setAllClassBulletins(prev => {
      const updated = [...prev];
      if (existingIndex >= 0) {
        updated[existingIndex] = newClassBulletins;
      } else {
        updated.push(newClassBulletins);
      }
      return updated;
    });
  };

  // Realistic deterministic grade generator for students
  const generateRealisticGrade = (studentId: string, subjectIndex: number, subjectName: string): number => {
    let base = 11.5;
    
    // Personal student performance levels
    if (studentId === 'student-5') base = 16.5;      // Barry Aïssatou (Excellent)
    else if (studentId === 'student-1') base = 14.8; // Diallo Mamadou (Very Good)
    else if (studentId === 'student-2') base = 13.2; // Camara Mariama (Good)
    else if (studentId === 'student-6') base = 13.0; // Traoré Fatoumata (Good)
    else if (studentId === 'student-3') base = 11.8; // Sow Amadou (Medium)
    else if (studentId === 'student-4') base = 8.5;  // Kourouma Sékou (Struggling)

    // Add subject-based variance to make it realistic
    // Some students are slightly better or worse in specific subjects
    const charSum = subjectName.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const variance = Math.sin(charSum + subjectIndex) * 2.2;
    
    return Math.max(4, Math.min(20, base + variance));
  };

  // Filter generated student bulletins on search queries
  const filteredStudentBulletins = activeClassBulletins
    ? activeClassBulletins.bulletins.filter(bul => {
        const fullSearchString = `${bul.studentNom} ${bul.studentPrenom} ${bul.matricule}`.toLowerCase();
        return fullSearchString.includes(searchQuery.toLowerCase());
      })
    : [];

  // Statistics calculation for the generated class bulletins
  const stats = activeClassBulletins ? {
    count: activeClassBulletins.bulletins.length,
    moyenneClasse: activeClassBulletins.bulletins.reduce((acc, b) => acc + b.moyenneGenerale, 0) / activeClassBulletins.bulletins.length,
    maxNote: Math.max(...activeClassBulletins.bulletins.map(b => b.moyenneGenerale)),
    minNote: Math.min(...activeClassBulletins.bulletins.map(b => b.moyenneGenerale)),
    passingCount: activeClassBulletins.bulletins.filter(b => b.moyenneGenerale >= 10).length
  } : null;

  return (
    <div className="space-y-6">
      
      {/* Detail Preview Modal/Overlay Overlay */}
      <AnimatePresence>
        {activeBulletin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-slate-50 rounded-3xl w-full max-w-5xl p-6 md:p-8 max-h-[90vh] overflow-y-auto shadow-2xl relative"
            >
              <BulletinApercu
                bulletin={activeBulletin}
                classe={selectedClass}
                periode={selectedPeriod}
                onClose={() => setActiveBulletin(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0f172a] text-[#f8fafc]">
            Gestion des Bulletins
          </span>
          <h2 className="text-xl font-bold text-slate-800">Génération & Consultation des Bulletins</h2>
          <p className="text-xs text-slate-500 max-w-xl">
            Générez les bulletins officiels de classe conformes aux directives pédagogiques guinéennes. Consultez les moyennes générales et distribuez les relevés.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3 shrink-0">
          <FileText className="h-8 w-8 text-lakoli-navy shrink-0" />
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Statut Période</div>
            <div className="text-xs font-extrabold text-slate-800">
              {activeClassBulletins ? '✅ Bulletins Générés' : '❌ Non Générés'}
            </div>
          </div>
        </div>
      </div>

      {/* FILTERS PANEL */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        {/* Class Selection */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1">
            <Layers className="h-3.5 w-3.5 text-lakoli-navy" />
            Sélectionner la classe
          </label>
          <select
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setSearchQuery('');
            }}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:ring-1 focus:ring-lakoli-navy outline-none font-bold"
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

        {/* Period Selection */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-lakoli-navy" />
            Période scolaire
          </label>
          <select
            value={selectedPeriod}
            onChange={(e) => {
              setSelectedPeriod(e.target.value);
              setSearchQuery('');
            }}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:ring-1 focus:ring-lakoli-navy outline-none font-bold"
          >
            <option value="Trimestre 1">Trimestre 1</option>
            <option value="Trimestre 2">Trimestre 2</option>
            <option value="Trimestre 3">Trimestre 3</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="relative">
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1">
            <Search className="h-3.5 w-3.5 text-lakoli-navy" />
            Rechercher un élève
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Nom, matricule..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 pl-9 focus:ring-1 focus:ring-lakoli-navy outline-none"
            />
            <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

        {/* Generation Action Button */}
        <div>
          {role === 'DIRECTEUR' ? (
            <button
              onClick={handleGenerateBulletins}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-lakoli-navy hover:bg-[#062f59] rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <RefreshCw className="h-4 w-4" />
              {activeClassBulletins ? 'Régénérer la classe' : 'Générer les bulletins'}
            </button>
          ) : (
            <div className="flex items-center justify-center p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 gap-1.5 shadow-2xs select-none">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Mode lecture seule ({role === 'FONDATEUR' ? 'Fondateur' : 'Enseignant'})
            </div>
          )}
        </div>
      </div>

      {/* DASHBOARD GRID ONCE BULLETINS ARE GENERATED */}
      {activeClassBulletins && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Stat card 1: Class Average */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Moyenne de classe</div>
              <div className="text-sm font-extrabold text-slate-800 font-mono mt-0.5">
                {stats.moyenneClasse.toFixed(2)} / 20
              </div>
            </div>
          </div>

          {/* Stat card 2: Max grade */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Meilleure moyenne</div>
              <div className="text-sm font-extrabold text-emerald-700 font-mono mt-0.5">
                {stats.maxNote.toFixed(2)} / 20
              </div>
            </div>
          </div>

          {/* Stat card 3: Min grade */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Plus faible moyenne</div>
              <div className="text-sm font-extrabold text-rose-700 font-mono mt-0.5">
                {stats.minNote.toFixed(2)} / 20
              </div>
            </div>
          </div>

          {/* Stat card 4: Success rate */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Taux d'admissibilité</div>
              <div className="text-sm font-extrabold text-slate-800 font-mono mt-0.5">
                {((stats.passingCount / stats.count) * 100).toFixed(0)}% ({stats.passingCount} / {stats.count})
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN DATA SCREEN */}
      {classStudents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-extrabold text-slate-700">Aucun élève inscrit</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Il n'y a pas d'élève affecté à la classe "{selectedClass}". Veuillez ajouter des élèves dans la section "Gestion des Élèves".
          </p>
        </div>
      ) : !activeClassBulletins ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-extrabold text-slate-700">Bulletins en attente de génération</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Les bulletins d'évaluation officiels n'ont pas encore été générés pour la classe <strong className="text-slate-700">{selectedClass}</strong> pour le <strong className="text-slate-700">{selectedPeriod}</strong>.
          </p>
          
          {role === 'DIRECTEUR' ? (
            <button
              onClick={handleGenerateBulletins}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-lakoli-navy hover:bg-[#062f59] rounded-xl transition-all cursor-pointer shadow-md"
            >
              <Sparkles className="h-4 w-4" />
              Générer les bulletins maintenant
            </button>
          ) : (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl text-xs font-semibold text-amber-700 max-w-sm">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
              <span>Veuillez demander à la Direction (Directeur) de lancer la génération.</span>
            </div>
          )}
        </div>
      ) : filteredStudentBulletins.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <Search className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <h4 className="text-xs font-bold text-slate-500">Aucun élève trouvé</h4>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-1">
            Aucun bulletin de cette classe ne correspond aux critères de recherche "{searchQuery}".
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          
          {/* Header of Table */}
          <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-lakoli-navy" />
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">
                  Moyennes générales et classements
                </h3>
                <span className="text-[10px] text-slate-400 font-bold block">
                  Période : {selectedPeriod} • Généré le {new Date(activeClassBulletins.generatedAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>

            {/* Version Badge */}
            <div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold ${
                activeClassBulletins.version === 1
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {activeClassBulletins.version === 1 ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                    Version v1
                  </>
                ) : (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                    v{activeClassBulletins.version} - remplace v{activeClassBulletins.version - 1}
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Student list table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-400 text-[10px] uppercase">
                  <th className="py-3 px-6">Rang</th>
                  <th className="py-3 px-6">Nom de l'Élève</th>
                  <th className="py-3 px-6">Matricule</th>
                  <th className="py-3 px-6 text-center">Moyenne Générale</th>
                  <th className="py-3 px-6 text-center">Mention / Décision</th>
                  <th className="py-3 px-6 text-right">Bulletin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudentBulletins.map((bul) => {
                  const isPassing = bul.moyenneGenerale >= 10;
                  const isFirst = bul.rang === '1er';
                  
                  return (
                    <tr key={bul.studentId} className="hover:bg-slate-50/40 transition-colors group">
                      {/* Rank Column */}
                      <td className="py-4 px-6 font-bold">
                        <span className={`inline-flex items-center justify-center h-7 w-9 rounded-lg font-black text-xs font-mono ${
                          isFirst 
                            ? 'bg-amber-100 text-amber-700 border border-amber-200 shadow-xs'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {isFirst ? '🏆 1er' : bul.rang}
                        </span>
                      </td>

                      {/* Name with custom initials */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-lakoli-navy/10 text-lakoli-navy font-bold flex items-center justify-center text-[11px] border border-lakoli-navy/15 shadow-2xs">
                            {bul.studentNom[0]}{bul.studentPrenom[0]}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-800 uppercase block">
                              {bul.studentNom}
                            </span>
                            <span className="text-slate-500 font-semibold text-[11px]">
                              {bul.studentPrenom}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Matricule */}
                      <td className="py-4 px-6 text-slate-500 font-mono font-bold">
                        {bul.matricule}
                      </td>

                      {/* Period Average */}
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-block font-mono font-black text-xs px-2.5 py-1 rounded-md ${
                          isPassing 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' 
                            : 'bg-rose-50 text-rose-700 border border-rose-150'
                        }`}>
                          {bul.moyenneGenerale.toFixed(2)} / 20
                        </span>
                      </td>

                      {/* Decision */}
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          bul.moyenneGenerale >= 14 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : bul.moyenneGenerale >= 10 
                              ? 'bg-blue-50 text-blue-700 border border-blue-250' 
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {bul.decision.split(' ')[0]}
                        </span>
                      </td>

                      {/* Consultation Action */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setActiveBulletin(bul)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-white bg-slate-50 hover:bg-lakoli-navy border border-slate-200 hover:border-lakoli-navy rounded-lg cursor-pointer transition-all shadow-3xs"
                        >
                          Consulter
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Quick Notice footer */}
          <div className="bg-slate-50 border-t border-slate-100 p-4 text-[10px] font-semibold text-slate-400 italic text-center select-none">
            Impression sécurisée LAKOLI • Certifié conforme aux normes scolaires de la République de Guinée.
          </div>

        </div>
      )}

    </div>
  );
}
