import { Teacher } from './types';

export const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 'teacher-1',
    matricule: 'ENS-2026-001',
    nom: 'BEAVOGUI',
    prenom: 'Alexandre Koulemou',
    photoUrl: '', // Will fallback to initials 'BK'
    matierePrincipale: 'Mathématiques',
    matieres: ['Mathématiques', 'Informatique'],
    typeContrat: 'CDI',
    dateDebutContrat: '2022-10-01',
    salaireBase: 4500000,
    tauxHoraireSup: 150000,
    volumeHoraireSup: 4,
    diplome: 'Master en Sciences Mathématiques (UGANC Conakry)',
    telephone: '+224 622 15 48 93',
    email: 'alexandre.beavogui@lakoli.edu.gn',
    statut: 'ACTIF',
    affectations: [
      { classe: 'Tle Sciences Mathématiques', matiere: 'Mathématiques', volumeHoraire: 6 },
      { classe: '10ème Année', matiere: 'Mathématiques', volumeHoraire: 5 },
      { classe: '11ème Sciences Mathématiques', matiere: 'Informatique', volumeHoraire: 2 }
    ],
    emploiDuTemps: [
      { jour: 'Lundi', creneau: '08h00 - 10h00', classe: 'Tle Sciences Mathématiques', matiere: 'Mathématiques' },
      { jour: 'Lundi', creneau: '10h15 - 12h15', classe: '10ème Année', matiere: 'Mathématiques' },
      { jour: 'Mardi', creneau: '14h00 - 16h00', classe: '11ème Sciences Mathématiques', matiere: 'Informatique' },
      { jour: 'Mercredi', creneau: '08h00 - 10h00', classe: 'Tle Sciences Mathématiques', matiere: 'Mathématiques' },
      { jour: 'Jeudi', creneau: '10h15 - 12h15', classe: '10ème Année', matiere: 'Mathématiques' },
      { jour: 'Vendredi', creneau: '08h00 - 10h00', classe: 'Tle Sciences Mathématiques', matiere: 'Mathématiques' }
    ]
  },
  {
    id: 'teacher-2',
    matricule: 'ENS-2026-002',
    nom: 'SOUMAH',
    prenom: 'Mariama Sylla',
    photoUrl: '',
    matierePrincipale: 'Français',
    matieres: ['Français', 'Philosophie'],
    typeContrat: 'CDD',
    dateDebutContrat: '2024-09-15',
    dateFinContrat: '2026-07-31',
    salaireBase: 3800000,
    tauxHoraireSup: 120000,
    volumeHoraireSup: 2,
    diplome: 'Licence en Lettres Modernes (Université de Sonfonia)',
    telephone: '+224 628 34 77 12',
    email: 'mariama.soumah@lakoli.edu.gn',
    statut: 'ACTIF',
    affectations: [
      { classe: '11ème Sciences Sociales', matiere: 'Français', volumeHoraire: 4 },
      { classe: '12ème Sciences Sociales', matiere: 'Philosophie', volumeHoraire: 4 }
    ],
    emploiDuTemps: [
      { jour: 'Mardi', creneau: '08h00 - 10h00', classe: '11ème Sciences Sociales', matiere: 'Français' },
      { jour: 'Mardi', creneau: '10h15 - 12h15', classe: '12ème Sciences Sociales', matiere: 'Philosophie' },
      { jour: 'Jeudi', creneau: '14h00 - 16h00', classe: '11ème Sciences Sociales', matiere: 'Français' },
      { jour: 'Vendredi', creneau: '10h15 - 12h15', classe: '12ème Sciences Sociales', matiere: 'Philosophie' }
    ]
  },
  {
    id: 'teacher-3',
    matricule: 'ENS-2026-003',
    nom: 'DIALLO',
    prenom: 'Alpha Oumar',
    photoUrl: '',
    matierePrincipale: 'Physique-Chimie',
    matieres: ['Physique', 'Chimie'],
    typeContrat: 'VACATAIRE',
    dateDebutContrat: '2025-10-01',
    dateFinContrat: '2026-06-30',
    salaireBase: 2500000,
    tauxHoraireSup: 130000,
    volumeHoraireSup: 6,
    diplome: 'Licence en Enseignement de la Physique (ISSEG de Lambandji)',
    telephone: '+224 620 55 99 88',
    email: 'alpha.diallo@lakoli.edu.gn',
    statut: 'ECHEANCE_PROCHE',
    affectations: [
      { classe: '10ème Année', matiere: 'Physique-Chimie', volumeHoraire: 4 },
      { classe: 'Tle Sciences Expérimentales', matiere: 'Physique', volumeHoraire: 5 }
    ],
    emploiDuTemps: [
      { jour: 'Lundi', creneau: '14h00 - 16h00', classe: '10ème Année', matiere: 'Physique-Chimie' },
      { jour: 'Mercredi', creneau: '10h15 - 12h15', classe: 'Tle Sciences Expérimentales', matiere: 'Physique' },
      { jour: 'Jeudi', creneau: '08h00 - 10h00', classe: '10ème Année', matiere: 'Physique-Chimie' },
      { jour: 'Jeudi', creneau: '16h15 - 18h15', classe: 'Tle Sciences Expérimentales', matiere: 'Physique' },
      { jour: 'Samedi', creneau: '08h00 - 10h00', classe: 'Tle Sciences Expérimentales', matiere: 'Physique' }
    ]
  },
  {
    id: 'teacher-4',
    matricule: 'ENS-2026-004',
    nom: 'CAMARA',
    prenom: 'Aboubacar',
    photoUrl: '',
    matierePrincipale: 'Histoire-Géographie',
    matieres: ['Histoire', 'Géographie', 'Éducation Civique'],
    typeContrat: 'CDD',
    dateDebutContrat: '2025-01-10',
    dateFinContrat: '2026-08-31',
    salaireBase: 3100000,
    tauxHoraireSup: 100000,
    volumeHoraireSup: 0,
    diplome: 'Licence en Histoire d\'Afrique (Université de Kankan)',
    telephone: '+224 624 88 55 33',
    email: 'aboubacar.camara@lakoli.edu.gn',
    statut: 'ACTIF',
    affectations: [
      { classe: '9ème Année', matiere: 'Histoire-Géographie', volumeHoraire: 3 },
      { classe: '11ème Sciences Sociales', matiere: 'Histoire-Géographie', volumeHoraire: 3 }
    ],
    emploiDuTemps: [
      { jour: 'Mardi', creneau: '16h15 - 18h15', classe: '9ème Année', matiere: 'Histoire-Géographie' },
      { jour: 'Mercredi', creneau: '14h00 - 16h00', classe: '11ème Sciences Sociales', matiere: 'Histoire-Géographie' },
      { jour: 'Vendredi', creneau: '14h00 - 16h00', classe: '9ème Année', matiere: 'Histoire-Géographie' }
    ]
  },
  {
    id: 'teacher-5',
    matricule: 'ENS-2026-005',
    nom: 'KOUYATÉ',
    prenom: 'Djibril',
    photoUrl: '',
    matierePrincipale: 'Anglais',
    matieres: ['Anglais'],
    typeContrat: 'CDI',
    dateDebutContrat: '2020-10-01',
    salaireBase: 4200000,
    tauxHoraireSup: 140000,
    volumeHoraireSup: 3,
    diplome: 'Licence en Anglais d\'Affaires (Université de Sonfonia)',
    telephone: '+224 621 44 22 11',
    email: 'djibril.kouyate@lakoli.edu.gn',
    statut: 'CONGE',
    affectations: [
      { classe: '10ème Année', matiere: 'Anglais', volumeHoraire: 3 },
      { classe: 'Tle Sciences Sociales', matiere: 'Anglais', volumeHoraire: 4 }
    ],
    emploiDuTemps: [
      { jour: 'Lundi', creneau: '16h15 - 18h15', classe: '10ème Année', matiere: 'Anglais' },
      { jour: 'Mardi', creneau: '10h15 - 12h15', classe: 'Tle Sciences Sociales', matiere: 'Anglais' },
      { jour: 'Mercredi', creneau: '16h15 - 18h15', classe: '10ème Année', matiere: 'Anglais' },
      { jour: 'Vendredi', creneau: '16h15 - 18h15', classe: 'Tle Sciences Sociales', matiere: 'Anglais' }
    ]
  }
];

export const AVAILABLE_SUBJECTS = [
  'Mathématiques',
  'Français',
  'Philosophie',
  'Physique-Chimie',
  'Physique',
  'Chimie',
  'Histoire-Géographie',
  'Histoire',
  'Géographie',
  'Éducation Civique',
  'Anglais',
  'Informatique',
  'Biologie / Géologie'
];
