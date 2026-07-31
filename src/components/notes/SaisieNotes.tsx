import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Send, 
  Check, 
  AlertCircle, 
  Users, 
  BookOpen, 
  Award,
  Clock,
  UserCheck
} from 'lucide-react';
import { Student, Evaluation, StudentGrade, PresenceStatus, EvaluationType } from '../../types';
import { INITIAL_STUDENTS, AVAILABLE_CLASSES, CLASSES_BY_LEVEL } from '../../mockData';
import { AVAILABLE_SUBJECTS } from '../../mockTeachersData';

interface SaisieNotesProps {
  evaluation: Evaluation | null; // null if creating a new one
  onSave: (evaluation: Evaluation) => void;
  onCancel: () => void;
}

export default function SaisieNotes({
  evaluation,
  onSave,
  onCancel
}: SaisieNotesProps) {
  // Setup fields based on evaluation being edited or new one
  const [libelle, setLibelle] = useState(evaluation?.libelle || '');
  const [classe, setClasse] = useState(evaluation?.classe || AVAILABLE_CLASSES[3] || ''); // Default 10ème Année
  const [matiere, setMatiere] = useState(evaluation?.matiere || AVAILABLE_SUBJECTS[0] || '');
  const [periode, setPeriode] = useState(evaluation?.periode || 'Trimestre 2');
  const [type, setType] = useState<EvaluationType>(evaluation?.type || 'DEVOIR');
  const [bareme, setBareme] = useState<number>(evaluation?.bareme || 20);
  const [date, setDate] = useState(evaluation?.date || new Date().toISOString().split('T')[0]);

  // Find all students in this class
  const classStudents = INITIAL_STUDENTS.filter(s => s.classe === classe);

  // Notes state
  const [grades, setGrades] = useState<Record<string, { note: string; statutPresence: PresenceStatus }>>({});

  // Initialize grades from existing evaluation, or empty for new
  useEffect(() => {
    const initialGrades: Record<string, { note: string; statutPresence: PresenceStatus }> = {};
    
    classStudents.forEach(student => {
      const existingGrade = evaluation?.notes.find(n => n.studentId === student.id);
      if (existingGrade) {
        initialGrades[student.id] = {
          note: existingGrade.note !== undefined && existingGrade.note !== null ? existingGrade.note.toString() : '',
          statutPresence: existingGrade.statutPresence
        };
      } else {
        initialGrades[student.id] = {
          note: '',
          statutPresence: 'PRESENT'
        };
      }
    });

    setGrades(initialGrades);
  }, [evaluation, classe]);

  // Handle grade text change
  const handleGradeChange = (studentId: string, value: string) => {
    // Only allow numbers, dots, and make sure it's <= barème
    if (value === '') {
      setGrades(prev => ({
        ...prev,
        [studentId]: { ...prev[studentId], note: '' }
      }));
      return;
    }

    const num = parseFloat(value);
    if (isNaN(num)) return;
    if (num < 0 || num > bareme) return;

    setGrades(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], note: value }
    }));
  };

  // Handle presence state change
  const handlePresenceChange = (studentId: string, status: PresenceStatus) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: {
        note: status === 'PRESENT' ? prev[studentId]?.note || '' : '',
        statutPresence: status
      }
    }));
  };

  // Validate if all grades/attendance are filled correctly
  const isComplete = () => {
    if (!libelle.trim() || !classe || !matiere || !periode) return false;
    if (classStudents.length === 0) return false;

    // Check if every student has either a valid grade or is marked absent
    return classStudents.every(student => {
      const state = grades[student.id];
      if (!state) return false;
      if (state.statutPresence === 'PRESENT') {
        return state.note !== '';
      }
      return true; // Absent students don't require grades
    });
  };

  // Handle Save draft or Submit
  const handleSubmitAction = (status: 'BROUILLON' | 'SOUMIS') => {
    const studentGradesList: StudentGrade[] = classStudents.map(student => {
      const state = grades[student.id] || { note: '', statutPresence: 'PRESENT' as PresenceStatus };
      return {
        studentId: student.id,
        note: state.statutPresence === 'PRESENT' && state.note !== '' ? parseFloat(state.note) : undefined,
        statutPresence: state.statutPresence
      };
    });

    const finalEvaluation: Evaluation = {
      id: evaluation?.id || `eval-${Date.now()}`,
      code: evaluation?.code || `EVAL-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      libelle,
      type,
      matiere,
      classe,
      periode,
      bareme,
      date,
      statut: status,
      notes: studentGradesList
    };

    onSave(finalEvaluation);
  };

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la liste des évaluations
        </button>
        <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
          {evaluation ? `ÉDITION: ${evaluation.code}` : 'NOUVELLE ÉVALUATION'}
        </span>
      </div>

      {/* Main Info Card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
        <h3 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-3">
          {evaluation ? 'Modifier l’évaluation & Saisir les notes' : 'Définir la nouvelle évaluation'}
        </h3>

        {/* If rejected, show reject comment prominently */}
        {evaluation?.statut === 'REJETE' && evaluation.commentaireRejet && (
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-800">
              <span className="font-bold block mb-1">ÉVALUATION REJETÉE PAR LA DIRECTION :</span>
              "{evaluation.commentaireRejet}"
            </div>
          </div>
        )}

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">
              Libellé de l’évaluation *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Devoir de Mathématiques #2, Composition de fin de trimestre..."
              value={libelle}
              onChange={e => setLibelle(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium focus:ring-1 focus:ring-lakoli-navy outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">
              Type d’évaluation *
            </label>
            <select
              value={type}
              onChange={e => setType(e.target.value as EvaluationType)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-lakoli-navy outline-none"
            >
              <option value="DEVOIR">Devoir de classe</option>
              <option value="COMPOSITION">Composition trimestrielle</option>
              <option value="EXAMEN_BLANC_1">Examen Blanc Régional #1</option>
              <option value="EXAMEN_BLANC_2">Examen Blanc National #2</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">
              Classe *
            </label>
            <select
              value={classe}
              onChange={e => setClasse(e.target.value)}
              disabled={!!evaluation} // Cannot change class once created
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-lakoli-navy outline-none disabled:opacity-60"
            >
              {CLASSES_BY_LEVEL.map(group => (
                <optgroup key={group.level} label={group.label}>
                  {group.classes.map(cl => (
                    <option key={cl} value={cl}>{cl}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">
              Matière dispensée *
            </label>
            <select
              value={matiere}
              onChange={e => setMatiere(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-lakoli-navy outline-none"
            >
              {AVAILABLE_SUBJECTS.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">
              Période Académique *
            </label>
            <select
              value={periode}
              onChange={e => setPeriode(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-lakoli-navy outline-none"
            >
              <option value="Trimestre 1">1er Trimestre</option>
              <option value="Trimestre 2">2ème Trimestre</option>
              <option value="Trimestre 3">3ème Trimestre</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">
              Barème d’évaluation *
            </label>
            <select
              value={bareme}
              onChange={e => setBareme(parseInt(e.target.value))}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-lakoli-navy outline-none"
            >
              <option value={10}>Note sur 10</option>
              <option value={20}>Note sur 20</option>
              <option value={40}>Note sur 40</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">
              Date de l’évaluation *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-lakoli-navy outline-none"
            />
          </div>
        </div>
      </div>

      {/* Student List & Grade Entry Grid */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-lakoli-navy" />
            <div>
              <h4 className="text-sm font-black text-slate-800">Grille de saisie des notes</h4>
              <p className="text-[10px] text-slate-500">
                Saisissez les notes de chaque élève de la classe : <span className="font-bold text-slate-700">{classe}</span>
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
            Effectif : {classStudents.length} élève{classStudents.length > 1 ? 's' : ''}
          </span>
        </div>

        {classStudents.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <AlertCircle className="h-8 w-8 mx-auto text-slate-300" />
            <p className="text-xs font-semibold">Aucun élève enregistré dans la classe de "{classe}"</p>
            <p className="text-[10px] max-w-sm mx-auto text-slate-400">
              Veuillez ajouter des élèves à cette classe ou changer la classe de cette évaluation pour pouvoir entrer les notes.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-150 text-[10px] uppercase font-bold text-slate-400">
                  <th className="py-3 px-5">Élève</th>
                  <th className="py-3 px-5">Matricule</th>
                  <th className="py-3 px-5 w-48">Statut de Présence</th>
                  <th className="py-3 px-5 w-48 text-right">Note (sur {bareme})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classStudents.map(student => {
                  const state = grades[student.id] || { note: '', statutPresence: 'PRESENT' as PresenceStatus };
                  const initials = `${student.prenom[0] || ''}${student.nom[0] || ''}`;
                  
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Avatar + Student Name */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-100 text-[11px] font-extrabold text-lakoli-navy flex items-center justify-center shrink-0 border border-slate-200">
                            {initials.toUpperCase()}
                          </div>
                          <div>
                            <span className="block text-xs font-bold text-slate-800">{student.nom.toUpperCase()}</span>
                            <span className="block text-[10px] text-slate-500">{student.prenom}</span>
                          </div>
                        </div>
                      </td>

                      {/* Student ID */}
                      <td className="py-3.5 px-5 font-mono text-[10px] text-slate-500">
                        {student.matricule}
                      </td>

                      {/* Presence State Selector */}
                      <td className="py-3.5 px-5">
                        <select
                          value={state.statutPresence}
                          onChange={e => handlePresenceChange(student.id, e.target.value as PresenceStatus)}
                          className={`text-[11px] font-bold rounded-lg border px-2.5 py-1.5 focus:outline-none focus:ring-1 cursor-pointer transition-colors ${
                            state.statutPresence === 'PRESENT'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 focus:ring-emerald-500'
                              : state.statutPresence === 'ABSENT_JUSTIFIE'
                                ? 'bg-orange-50 border-orange-200 text-orange-700 focus:ring-orange-500'
                                : 'bg-rose-50 border-rose-200 text-rose-700 focus:ring-rose-500'
                          }`}
                        >
                          <option value="PRESENT">Présent(e)</option>
                          <option value="ABSENT_JUSTIFIE">Absent(e) Justifié(e)</option>
                          <option value="ABSENT_NON_JUSTIFIE">Absent(e) Non Justifié(e)</option>
                        </select>
                      </td>

                      {/* Input Field for the Grade */}
                      <td className="py-3.5 px-5 text-right">
                        {state.statutPresence === 'PRESENT' ? (
                          <div className="inline-flex items-center gap-2">
                            <input
                              type="number"
                              step="0.25"
                              min="0"
                              max={bareme}
                              placeholder="Note"
                              value={state.note}
                              onChange={e => handleGradeChange(student.id, e.target.value)}
                              className="w-24 text-xs font-extrabold text-right bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-lakoli-navy outline-none"
                            />
                            <span className="text-[10px] font-bold text-slate-400">/ {bareme}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-extrabold text-slate-400 italic bg-slate-100 px-3 py-1.5 rounded-lg">
                            Non applicable
                          </span>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer Submission Action Bar */}
      <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <AlertCircle className="h-4 w-4 text-slate-400 shrink-0" />
          <span>
            {isComplete() 
              ? 'Toutes les notes et statuts de présence sont correctement configurés.' 
              : 'Saisissez la note de tous les élèves présents pour soumettre l’évaluation à la direction.'}
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
          >
            Annuler
          </button>
          
          {/* Save Draft */}
          <button
            type="button"
            onClick={() => handleSubmitAction('BROUILLON')}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Save className="h-4 w-4" />
            Enregistrer brouillon
          </button>

          {/* Submit to Direction */}
          <button
            type="button"
            disabled={!isComplete()}
            onClick={() => handleSubmitAction('SOUMIS')}
            className="px-5 py-2 text-xs font-bold text-white bg-lakoli-navy hover:bg-[#062f59] disabled:opacity-50 disabled:hover:bg-lakoli-navy rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm"
            title={!isComplete() ? 'Veuillez renseigner toutes les notes requises' : 'Soumettre à la validation'}
          >
            <Send className="h-4 w-4" />
            Soumettre à la direction
          </button>
        </div>
      </div>

    </div>
  );
}
