import React, { useState } from 'react';
import { 
  Calendar, 
  Download, 
  Plus, 
  Trash2, 
  Users, 
  BookOpen, 
  Clock, 
  AlertCircle,
  HelpCircle,
  Printer,
  ChevronRight,
  Sparkles,
  Check,
  X
} from 'lucide-react';
import { Teacher, ScheduleItem, UserRole } from '../../types';
import { AVAILABLE_CLASSES, CLASSES_BY_LEVEL } from '../../mockData';
import { AVAILABLE_SUBJECTS } from '../../mockTeachersData';

interface EmploiDuTempsGrilleProps {
  teachers: Teacher[];
  onUpdateTeacher: (updatedTeacher: Teacher) => void;
  role: UserRole;
}

export default function EmploiDuTempsGrille({
  teachers,
  onUpdateTeacher,
  role
}: EmploiDuTempsGrilleProps) {
  // Select active class (initially 10ème Année as it has pre-populated data in mock teachers)
  const [selectedClass, setSelectedClass] = useState<string>(AVAILABLE_CLASSES[3] || AVAILABLE_CLASSES[0]);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [clickedCell, setClickedCell] = useState<{ day: string; slot: string } | null>(null);
  
  // Form States
  const [selectedMatiere, setSelectedMatiere] = useState<string>('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');

  // Weekly structure
  const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const SLOTS = [
    '08h00 - 10h00',
    '10h15 - 12h15',
    '14h00 - 16h00',
    '16h15 - 18h15'
  ];

  // Map of courses for the selected class
  // Key: "Day_Slot" -> { teacher: Teacher, item: ScheduleItem }
  const classScheduleMap: Record<string, { teacher: Teacher; item: ScheduleItem }> = {};

  teachers.forEach(teacher => {
    (teacher.emploiDuTemps || []).forEach(item => {
      if (item.classe === selectedClass) {
        const key = `${item.jour}_${item.creneau}`;
        classScheduleMap[key] = { teacher, item };
      }
    });
  });

  // Dynamic Pastel HSL Color Generator by subject name
  const getColorsForSubject = (subject: string) => {
    let hash = 0;
    for (let i = 0; i < subject.length; i++) {
      hash = subject.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return {
      bg: `hsl(${hue}, 80%, 96%)`,
      text: `hsl(${hue}, 80%, 25%)`,
      border: `hsl(${hue}, 80%, 90%)`,
      badgeBg: `hsl(${hue}, 80%, 90%)`
    };
  };

  // Check if a teacher is already busy at a specific day/slot
  const getTeacherBusyClass = (teacherId: string, day: string, slot: string): string | null => {
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return null;
    const busySlot = (teacher.emploiDuTemps || []).find(
      item => item.jour === day && item.creneau === slot
    );
    return busySlot ? busySlot.classe : null;
  };

  // Open scheduling modal for a specific empty cell
  const handleCellClick = (day: string, slot: string) => {
    if (role !== 'COMPTABLE') return; // Read-only for non-comptables

    setClickedCell({ day, slot });
    
    // Default subject to first available or empty
    setSelectedMatiere(AVAILABLE_SUBJECTS[0]);
    
    // Default teacher to first qualified, or first overall
    const firstTeacher = teachers[0];
    setSelectedTeacherId(firstTeacher ? firstTeacher.id : '');
    
    setIsAddModalOpen(true);
  };

  // Handle adding course to schedule
  const handleAddCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clickedCell || !selectedTeacherId || !selectedMatiere) return;

    const { day, slot } = clickedCell;

    // Double check conflict
    const busyClass = getTeacherBusyClass(selectedTeacherId, day, slot);
    if (busyClass) {
      if (!confirm(`Attention : Cet enseignant dispense déjà un cours à la même heure dans la classe "${busyClass}". Voulez-vous quand même forcer cette affectation ?`)) {
        return;
      }
    }

    const targetTeacher = teachers.find(t => t.id === selectedTeacherId);
    if (!targetTeacher) return;

    // Create schedule item
    const newItem: ScheduleItem = {
      jour: day,
      creneau: slot,
      classe: selectedClass,
      matiere: selectedMatiere
    };

    // Update teacher's schedules (remove existing for that same cell if any, then add)
    const filteredEmploi = (targetTeacher.emploiDuTemps || []).filter(
      item => !(item.jour === day && item.creneau === slot && item.classe === selectedClass)
    );

    const updatedTeacher: Teacher = {
      ...targetTeacher,
      emploiDuTemps: [...filteredEmploi, newItem]
    };

    onUpdateTeacher(updatedTeacher);
    setIsAddModalOpen(false);
    setClickedCell(null);
  };

  // Handle deleting a course from schedule
  const handleDeleteCourse = (day: string, slot: string, teacherId: string) => {
    if (role === 'DIRECTEUR') return;
    
    if (confirm("Êtes-vous sûr de vouloir libérer ce créneau ?")) {
      const targetTeacher = teachers.find(t => t.id === teacherId);
      if (!targetTeacher) return;

      const updatedTeacher: Teacher = {
        ...targetTeacher,
        emploiDuTemps: (targetTeacher.emploiDuTemps || []).filter(
          item => !(item.jour === day && item.creneau === slot && item.classe === selectedClass)
        )
      };

      onUpdateTeacher(updatedTeacher);
    }
  };

  // Export / Print view
  const handleExportPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* CSS print utility specifically inside this component */}
      <style>{`
        @media print {
          /* Hide everything except the timetable container */
          body * {
            visibility: hidden;
            background-color: white !important;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100vw;
            padding: 0;
            margin: 0;
          }
          .no-print {
            display: none !important;
          }
          /* Grid table styling optimized for print layout */
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border: 1px solid #94a3b8 !important;
            padding: 8px !important;
          }
        }
      `}</style>

      {/* Module Title Banner */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0f172a] text-[#f8fafc]">
            Gestion du Temps
          </span>
          <h2 className="text-xl font-bold text-slate-800">Emplois du Temps Hebdomadaires</h2>
          <p className="text-xs text-slate-500 max-w-xl">
            Établissez et synchronisez les plannings de cours des différentes classes. Les heures programmées mettent automatiquement à jour le volume horaire du personnel.
          </p>
        </div>

        {/* Action Button & Badges */}
        <div className="flex flex-wrap items-center gap-3">
          {role !== 'COMPTABLE' && (
            <div className="flex items-center px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-full text-xs font-bold gap-1.5 shadow-2xs select-none">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Mode lecture seule ({role === 'DIRECTEUR' ? 'Directeur' : role === 'FONDATEUR' ? 'Fondateur' : 'Enseignant'})
            </div>
          )}
          <button
            onClick={handleExportPrint}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-lakoli-navy hover:bg-[#062f59] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Printer className="h-4 w-4" />
            Exporter l'Emploi du Temps (PDF)
          </button>
        </div>
      </div>

      {/* Class Selector Panel */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-150 flex items-center justify-center text-lakoli-navy shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Sélectionnez une Classe
            </label>
            <div className="flex items-center gap-1.5 mt-0.5">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="text-sm font-extrabold text-slate-800 bg-transparent focus:outline-none cursor-pointer border-b-2 border-slate-200 hover:border-slate-300 pb-0.5 transition-colors"
              >
                {CLASSES_BY_LEVEL.map(group => (
                  <optgroup key={group.level} label={group.label}>
                    {group.classes.map(classe => (
                      <option key={classe} value={classe}>{classe}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-slate-100 border border-slate-300 inline-block"></span>
            <span>Case vide = Créneau Libre</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-blue-100 border border-blue-300 inline-block"></span>
            <span>Case Colorée = Cours programmé</span>
          </div>
        </div>
      </div>

      {/* MAIN PLANNIG GRID */}
      <div id="print-area" className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        
        {/* Print-Only Header */}
        <div className="hidden print:block border-b-2 border-slate-800 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight uppercase">Établissement Scolaire Privé LAKOLI</h1>
              <p className="text-xs text-slate-500 uppercase">République de Guinée — Ministère de l'Enseignement Pré-Universitaire</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-slate-900 text-white font-mono text-[10px] font-bold rounded uppercase">
                Année Scolaire 2025-2026
              </span>
            </div>
          </div>
          <h2 className="text-center font-black text-slate-800 text-lg mt-6 tracking-wide">
            EMPLOI DU TEMPS OFFICIEL : CLASSE DE {selectedClass.toUpperCase()}
          </h2>
        </div>

        {/* Schedule grid table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-slate-150 min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400">
                <th className="py-3 px-3 border-r border-slate-150 text-left pl-4 w-36">Créneaux</th>
                {DAYS.map(day => (
                  <th key={day} className="py-3 px-3 border-r border-slate-150 text-center w-28">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {SLOTS.map((slot, sIdx) => (
                <tr key={sIdx} className="hover:bg-slate-50/10 h-28">
                  {/* Slot Column */}
                  <td className="py-4 px-3 border-r border-slate-150 bg-slate-50/70 text-left font-semibold font-mono text-[10px] text-slate-500 pl-4">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>{slot}</span>
                    </div>
                  </td>

                  {/* Day Columns */}
                  {DAYS.map((day, dIdx) => {
                    const key = `${day}_${slot}`;
                    const active = classScheduleMap[key];

                    if (active) {
                      const colors = getColorsForSubject(active.item.matiere);
                      const isExam = selectedClass.toLowerCase().includes('10è') || selectedClass.toLowerCase().includes('tle') || selectedClass.toLowerCase().includes('6è');
                      
                      return (
                        <td 
                          key={dIdx} 
                          className="py-1 px-1 border-r border-slate-150 text-center relative group"
                          style={{ backgroundColor: colors.bg }}
                        >
                          <div 
                            className="absolute inset-1 p-2 rounded-xl flex flex-col justify-between text-left border shadow-xs transition-all"
                            style={{ 
                              color: colors.text, 
                              borderColor: colors.border,
                              backgroundColor: colors.bg
                            }}
                          >
                            <div className="space-y-1">
                              <span className="block text-xs font-black tracking-tight leading-tight uppercase truncate">
                                {active.item.matiere}
                              </span>
                              
                              <span className="inline-flex items-center gap-1 text-[9px] font-semibold opacity-85">
                                <Users className="h-3 w-3 opacity-70" />
                                <span className="truncate">{active.teacher.prenom.split(' ')[0]} {active.teacher.nom}</span>
                              </span>
                            </div>

                            {/* Additional metadata tags */}
                            <div className="flex justify-between items-end mt-1.5">
                              <span className="text-[8px] font-mono opacity-60">
                                {active.teacher.matricule}
                              </span>

                              {isExam && (
                                <span 
                                  className="text-[7px] font-extrabold px-1 rounded-sm uppercase tracking-wider"
                                  style={{ backgroundColor: colors.badgeBg }}
                                >
                                  Exam
                                </span>
                              )}
                            </div>

                            {/* Hover Trash Action */}
                            {role === 'COMPTABLE' && (
                              <button
                                onClick={() => handleDeleteCourse(day, slot, active.teacher.id)}
                                className="absolute top-1 right-1 p-1 bg-white hover:bg-rose-50 text-rose-500 rounded-lg shadow-sm border border-rose-100 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer no-print"
                                title="Supprimer ce cours"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </td>
                      );
                    }

                    // Empty cell
                    return (
                      <td 
                        key={dIdx} 
                        onClick={() => handleCellClick(day, slot)}
                        className={`py-2 px-2 border-r border-slate-150 text-center relative group h-full ${
                          role === 'COMPTABLE' ? 'cursor-pointer hover:bg-slate-50' : 'cursor-default'
                        }`}
                      >
                        {role === 'COMPTABLE' ? (
                          <div className="opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-slate-400 absolute inset-0 transition-opacity no-print">
                            <Plus className="h-4 w-4 stroke-[3px] text-lakoli-navy" />
                            <span className="text-[8px] font-bold uppercase mt-1 text-lakoli-navy">Ajouter</span>
                          </div>
                        ) : null}
                        <span className="text-slate-200 text-[10px] select-none">-</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Information Notice */}
        <div className="flex items-start gap-2.5 bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs text-slate-500 leading-relaxed no-print">
          <AlertCircle className="h-4.5 w-4.5 text-lakoli-navy shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-700 block mb-0.5">Note importante sur la synchronisation :</span>
            Cet emploi du temps est bidirectionnel. Programmer un cours ici l'inscrit automatiquement dans l'emploi du temps individuel de l'enseignant sélectionné, comptabilise ses heures hebdomadaires et calcule ses heures supplémentaires s'il s'agit d'une classe d'examen (6e, 10e, Terminale).
          </div>
        </div>

      </div>

      {/* ADD COURSE MODAL (Only for Comptable / Write access) */}
      {isAddModalOpen && clickedCell && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Calendar className="h-4.5 w-4.5 text-lakoli-navy" />
                <h3 className="text-sm font-extrabold text-slate-800">Programmer un nouveau cours</h3>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  setIsAddModalOpen(false);
                  setClickedCell(null);
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddCourseSubmit} className="p-5 space-y-4">
              
              {/* Context Info (Pre-filled) */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs">
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase">Jour</span>
                  <span className="font-extrabold text-slate-800">{clickedCell.day}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase">Créneau horaire</span>
                  <span className="font-extrabold text-slate-800 font-mono">{clickedCell.slot}</span>
                </div>
                <div className="col-span-2 pt-1 border-t border-slate-200">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase">Classe ciblée</span>
                  <span className="font-extrabold text-lakoli-navy">{selectedClass}</span>
                </div>
              </div>

              {/* Subject Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Matière *</label>
                <select
                  required
                  value={selectedMatiere}
                  onChange={(e) => setSelectedMatiere(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-lakoli-navy outline-none"
                >
                  <option value="" disabled>-- Sélectionnez une matière --</option>
                  {AVAILABLE_SUBJECTS.map(matiere => (
                    <option key={matiere} value={matiere}>{matiere}</option>
                  ))}
                </select>
              </div>

              {/* Teacher Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Enseignant *</label>
                <select
                  required
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-lakoli-navy outline-none"
                >
                  <option value="" disabled>-- Sélectionnez un enseignant --</option>
                  {teachers.map(t => {
                    const busy = getTeacherBusyClass(t.id, clickedCell.day, clickedCell.slot);
                    const qualifies = t.matieres.includes(selectedMatiere) || t.matierePrincipale === selectedMatiere;
                    
                    return (
                      <option 
                        key={t.id} 
                        value={t.id}
                        disabled={!!busy}
                      >
                        {t.nom.toUpperCase()} {t.prenom} ({t.matierePrincipale}) {qualifies ? '★' : ''} {busy ? `— Indisponible (${busy})` : '— Libre'}
                      </option>
                    );
                  })}
                </select>
                <p className="text-[10px] text-slate-400 mt-1 italic">
                  Note : Les enseignants portant une étoile (★) possèdent des compétences certifiées pour enseigner la matière sélectionnée.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setClickedCell(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-lakoli-navy hover:bg-[#062f59] rounded-lg cursor-pointer transition-colors flex items-center gap-1"
                >
                  <Check className="h-3.5 w-3.5" />
                  Placer le cours
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
