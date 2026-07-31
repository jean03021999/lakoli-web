export type PaymentStatus = 'A_JOUR' | 'EN_RETARD';

export interface ParentInfo {
  nom: string;
  telephone: string;
}

export interface TuteurInfo {
  nom: string;
  telephone: string;
  lien: string; // empty means "Non renseigné"
}

export interface Filiation {
  pere: ParentInfo;
  mere: ParentInfo;
  tuteur: TuteurInfo;
}

export interface PaymentHistoryItem {
  id: string;
  libelle: string;
  date: string;
  montant: number;
  moyenPaiement: 'Espèces' | 'Chèque' | 'Mobile Money' | 'Virement';
  soldeRestant?: number;
}

export interface Student {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  classe: string;
  sessionScolaire: string;
  statutPaiement: PaymentStatus;
  dateNaissance: string;
  lieuNaissance: string;
  filiation: Filiation;
  historiquePaiements: PaymentHistoryItem[];
  photoUrl?: string; // If absent, show avatar initials
}

export type UserRole = 'COMPTABLE' | 'DIRECTEUR' | 'FONDATEUR' | 'ENSEIGNANT';

export interface TeacherAssignment {
  classe: string;
  matiere: string;
  volumeHoraire: number; // h/semaine
}

export type ContractType = 'CDI' | 'CDD' | 'VACATAIRE';

export interface ScheduleItem {
  jour: string;
  creneau: string;
  classe: string;
  matiere: string;
}

export interface Teacher {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  photoUrl?: string;
  matierePrincipale: string;
  matieres: string[];
  typeContrat: ContractType;
  dateDebutContrat: string;
  dateFinContrat?: string;
  salaireBase: number;
  tauxHoraireSup?: number; // GNF/heure
  volumeHoraireSup?: number; // heures/semaine
  diplome: string;
  telephone: string;
  email: string;
  statut: 'ACTIF' | 'CONGE' | 'ECHEANCE_PROCHE';
  affectations: TeacherAssignment[];
  emploiDuTemps: ScheduleItem[];
}

export type AcademicLevel = 'MATERNELLE' | 'PRIMAIRE' | 'COLLEGE' | 'LYCEE';
export type LyceeStream = 'SCIENTIFIQUE' | 'LITTERAIRE' | 'SCIENCES_SOCIALES';

export interface Subject {
  id: string;
  nom: string;
  level: AcademicLevel;
  stream?: LyceeStream;
  coefficient: number;
  isCustom?: boolean;
}

export type EvaluationStatus = 'BROUILLON' | 'SOUMIS' | 'VALIDE' | 'REJETE' | 'PUBLIE' | 'ARCHIVE';
export type EvaluationType = 'DEVOIR' | 'COMPOSITION' | 'EXAMEN_BLANC_1' | 'EXAMEN_BLANC_2';
export type PresenceStatus = 'PRESENT' | 'ABSENT_JUSTIFIE' | 'ABSENT_NON_JUSTIFIE';

export interface StudentGrade {
  studentId: string;
  note?: number;
  statutPresence: PresenceStatus;
}

export interface Evaluation {
  id: string;
  code: string;
  libelle: string;
  type: EvaluationType;
  matiere: string;
  classe: string;
  periode: string; // e.g. "Trimestre 1", "Trimestre 2", "Trimestre 3"
  bareme: number; // e.g. 10, 20
  date: string;
  statut: EvaluationStatus;
  notes: StudentGrade[];
  commentaireRejet?: string;
}

export interface SubjectGrade {
  subjectId: string;
  subjectNom: string;
  coefficient: number;
  note: number; // sur 20
  appreciation: string;
}

export interface StudentBulletin {
  studentId: string;
  studentNom: string;
  studentPrenom: string;
  matricule: string;
  grades: SubjectGrade[];
  totalCoefficients: number;
  totalPoints: number;
  moyenneGenerale: number;
  rang: string;
  decision: string;
}

export interface ClassBulletins {
  classe: string;
  periode: string;
  version: number; // 1, 2, etc.
  bulletins: StudentBulletin[];
  generatedAt: string;
}


