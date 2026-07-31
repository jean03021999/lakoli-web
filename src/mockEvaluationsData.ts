import { Evaluation } from './types';

export const INITIAL_EVALUATIONS: Evaluation[] = [
  {
    id: 'eval-1',
    code: 'EVAL-2026-000001',
    libelle: 'Devoir de Mathématiques Algèbre',
    type: 'DEVOIR',
    matiere: 'Mathématiques',
    classe: 'Tle Sciences Expérimentales',
    periode: 'Trimestre 1',
    bareme: 20,
    date: '2026-01-15',
    statut: 'PUBLIE',
    notes: [
      {
        studentId: 'student-1',
        note: 16.5,
        statutPresence: 'PRESENT'
      }
    ]
  },
  {
    id: 'eval-2',
    code: 'EVAL-2026-000002',
    libelle: 'Composition Trimestrielle Chimie',
    type: 'COMPOSITION',
    matiere: 'Physique-Chimie',
    classe: 'Tle Sciences Expérimentales',
    periode: 'Trimestre 2',
    bareme: 20,
    date: '2026-03-10',
    statut: 'SOUMIS',
    notes: [
      {
        studentId: 'student-1',
        note: 14,
        statutPresence: 'PRESENT'
      }
    ]
  },
  {
    id: 'eval-3',
    code: 'EVAL-2026-000003',
    libelle: 'Devoir de Français Rédaction',
    type: 'DEVOIR',
    matiere: 'Français',
    classe: '10ème Année',
    periode: 'Trimestre 2',
    bareme: 10,
    date: '2026-02-18',
    statut: 'REJETE',
    commentaireRejet: 'Veuillez revérifier le barème global, il doit être sur 20 et non sur 10 pour cette matière.',
    notes: [
      {
        studentId: 'student-3',
        note: 8.5,
        statutPresence: 'PRESENT'
      }
    ]
  },
  {
    id: 'eval-4',
    code: 'EVAL-2026-000004',
    libelle: 'Devoir d’Histoire Géographie',
    type: 'DEVOIR',
    matiere: 'Histoire-Géographie',
    classe: '10ème Année',
    periode: 'Trimestre 2',
    bareme: 20,
    date: '2026-03-01',
    statut: 'BROUILLON',
    notes: [
      {
        studentId: 'student-3',
        note: 12,
        statutPresence: 'PRESENT'
      }
    ]
  },
  {
    id: 'eval-5',
    code: 'EVAL-2026-000005',
    libelle: 'Examen Blanc Régional #1 Mathématiques',
    type: 'EXAMEN_BLANC_1',
    matiere: 'Mathématiques',
    classe: 'Tle Sciences Mathématiques',
    periode: 'Trimestre 2',
    bareme: 20,
    date: '2026-04-12',
    statut: 'SOUMIS',
    notes: [
      {
        studentId: 'student-4',
        note: 15,
        statutPresence: 'PRESENT'
      }
    ]
  }
];
