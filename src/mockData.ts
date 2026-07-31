import { Student } from './types';

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'student-1',
    matricule: 'LAK-2026-001',
    nom: 'DIALLO',
    prenom: 'Mamadou Alimou',
    classe: 'Tle Sciences Expérimentales',
    sessionScolaire: '2025-2026',
    statutPaiement: 'A_JOUR',
    dateNaissance: '2008-04-12',
    lieuNaissance: 'Conakry',
    photoUrl: '', // Will fall back to initials 'MD'
    filiation: {
      pere: {
        nom: 'Diallo Ousmane',
        telephone: '+224 622 34 56 78',
      },
      mere: {
        nom: 'Bah Fatoumata Binta',
        telephone: '+224 621 98 76 54',
      },
      tuteur: {
        nom: '',
        telephone: '',
        lien: '',
      }
    },
    historiquePaiements: [
      {
        id: 'p-1-1',
        libelle: 'Frais d\'inscription Scolarité',
        date: '2025-09-15',
        montant: 500000,
        moyenPaiement: 'Espèces',
        soldeRestant: 2000000
      },
      {
        id: 'p-1-2',
        libelle: '1ère Échéance Scolarité',
        date: '2025-11-10',
        montant: 1000000,
        moyenPaiement: 'Mobile Money',
        soldeRestant: 1000000
      },
      {
        id: 'p-1-3',
        libelle: '2ème Échéance Scolarité',
        date: '2026-02-05',
        montant: 1000000,
        moyenPaiement: 'Virement',
        soldeRestant: 0
      }
    ]
  },
  {
    id: 'student-2',
    matricule: 'LAK-2026-002',
    nom: 'CAMARA',
    prenom: 'Mariama Sylla',
    classe: '11ème Sciences Mathématiques',
    sessionScolaire: '2025-2026',
    statutPaiement: 'EN_RETARD',
    dateNaissance: '2009-09-23',
    lieuNaissance: 'Kindia',
    photoUrl: '',
    filiation: {
      pere: {
        nom: 'Camara Aboubacar',
        telephone: '+224 620 44 33 22',
      },
      mere: {
        nom: 'Sylla Aminata',
        telephone: '+224 628 55 66 77',
      },
      tuteur: {
        nom: 'Camara Sekou (Oncle)',
        telephone: '+224 625 11 22 33',
        lien: 'Oncle paternel',
      }
    },
    historiquePaiements: [
      {
        id: 'p-2-1',
        libelle: 'Frais d\'inscription Scolarité',
        date: '2025-09-18',
        montant: 500000,
        moyenPaiement: 'Mobile Money',
        soldeRestant: 2000000
      },
      {
        id: 'p-2-2',
        libelle: '1ère Échéance Scolarité',
        date: '2025-11-20',
        montant: 1000000,
        moyenPaiement: 'Espèces',
        soldeRestant: 1000000
      }
      // Missing 2nd Échéance (due in Feb 2026) -> EN_RETARD
    ]
  },
  {
    id: 'student-3',
    matricule: 'LAK-2026-003',
    nom: 'SOW',
    prenom: 'Amadou Oury',
    classe: '10ème Année',
    sessionScolaire: '2025-2026',
    statutPaiement: 'A_JOUR',
    dateNaissance: '2011-01-05',
    lieuNaissance: 'Labé',
    photoUrl: '',
    filiation: {
      pere: {
        nom: 'Sow Thierno',
        telephone: '+224 623 88 99 00',
      },
      mere: {
        nom: 'Diallo Kadidiatou',
        telephone: '+224 624 77 66 55',
      },
      tuteur: {
        nom: '',
        telephone: '',
        lien: '',
      }
    },
    historiquePaiements: [
      {
        id: 'p-3-1',
        libelle: 'Frais d\'inscription Scolarité',
        date: '2025-09-12',
        montant: 400000,
        moyenPaiement: 'Espèces',
        soldeRestant: 1600000
      },
      {
        id: 'p-3-2',
        libelle: '1ère Échéance Scolarité',
        date: '2025-11-15',
        montant: 800000,
        moyenPaiement: 'Mobile Money',
        soldeRestant: 800000
      },
      {
        id: 'p-3-3',
        libelle: '2ème Échéance Scolarité',
        date: '2026-02-10',
        montant: 800000,
        moyenPaiement: 'Mobile Money',
        soldeRestant: 0
      }
    ]
  },
  {
    id: 'student-4',
    matricule: 'LAK-2026-004',
    nom: 'KOUROUMA',
    prenom: 'Sékou Blaise',
    classe: 'Tle Sciences Mathématiques',
    sessionScolaire: '2025-2026',
    statutPaiement: 'EN_RETARD',
    dateNaissance: '2007-12-14',
    lieuNaissance: 'N\'Zérékoré',
    photoUrl: '',
    filiation: {
      pere: {
        nom: 'Kourouma Jean-Pierre',
        telephone: '+224 621 12 34 56',
      },
      mere: {
        nom: 'Loua Hélène',
        telephone: '+224 626 65 43 21',
      },
      tuteur: {
        nom: 'Kourouma Antoine',
        telephone: '+224 629 11 22 44',
        lien: 'Frère aîné',
      }
    },
    historiquePaiements: [
      {
        id: 'p-4-1',
        libelle: 'Frais d\'inscription Scolarité',
        date: '2025-09-20',
        montant: 500000,
        moyenPaiement: 'Chèque',
        soldeRestant: 2000000
      }
      // Both 1st and 2nd Échéance are missing or unpaid -> EN_RETARD
    ]
  },
  {
    id: 'student-5',
    matricule: 'LAK-2026-005',
    nom: 'BARRY',
    prenom: 'Aïssatou Djouldé',
    classe: '7ème Année',
    sessionScolaire: '2025-2026',
    statutPaiement: 'A_JOUR',
    dateNaissance: '2014-06-30',
    lieuNaissance: 'Mamou',
    photoUrl: '',
    filiation: {
      pere: {
        nom: 'Barry Amadou',
        telephone: '+224 627 33 44 55',
      },
      mere: {
        nom: 'Baldé Hassatou',
        telephone: '+224 622 66 77 88',
      },
      tuteur: {
        nom: '',
        telephone: '',
        lien: '',
      }
    },
    historiquePaiements: [
      {
        id: 'p-5-1',
        libelle: 'Frais d\'inscription Scolarité',
        date: '2025-09-10',
        montant: 400000,
        moyenPaiement: 'Espèces',
        soldeRestant: 1600000
      },
      {
        id: 'p-5-2',
        libelle: '1ère Échéance Scolarité',
        date: '2025-11-05',
        montant: 800000,
        moyenPaiement: 'Mobile Money',
        soldeRestant: 800000
      },
      {
        id: 'p-5-3',
        libelle: '2ème Échéance Scolarité',
        date: '2026-02-02',
        montant: 800000,
        moyenPaiement: 'Mobile Money',
        soldeRestant: 0
      }
    ]
  },
  {
    id: 'student-6',
    matricule: 'LAK-2026-006',
    nom: 'TRAORÉ',
    prenom: 'Fatoumata',
    classe: '12ème Sciences Sociales',
    sessionScolaire: '2025-2026',
    statutPaiement: 'EN_RETARD',
    dateNaissance: '2008-11-03',
    lieuNaissance: 'Kankan',
    photoUrl: '',
    filiation: {
      pere: {
        nom: 'Traoré Lanciné',
        telephone: '+224 625 99 88 77',
      },
      mere: {
        nom: 'Condé Fanta',
        telephone: '+224 623 11 22 33',
      },
      tuteur: {
        nom: '',
        telephone: '',
        lien: '',
      }
    },
    historiquePaiements: [
      {
        id: 'p-6-1',
        libelle: 'Frais d\'inscription Scolarité',
        date: '2025-09-22',
        montant: 500000,
        moyenPaiement: 'Mobile Money',
        soldeRestant: 2000000
      },
      {
        id: 'p-6-2',
        libelle: '1ère Échéance Scolarité',
        date: '2025-11-25',
        montant: 1000000,
        moyenPaiement: 'Espèces',
        soldeRestant: 1000000
      }
    ]
  },
  {
    id: 'student-7',
    matricule: 'LAK-2026-007',
    nom: 'CONDÉ',
    prenom: 'Kadiatou Bintou',
    classe: 'Petite Section',
    sessionScolaire: '2025-2026',
    statutPaiement: 'A_JOUR',
    dateNaissance: '2022-03-15',
    lieuNaissance: 'Conakry',
    photoUrl: '',
    filiation: {
      pere: { nom: 'Condé Ibrahima', telephone: '+224 622 11 00 99' },
      mere: { nom: 'Camara Mabinty', telephone: '+224 621 33 44 55' },
      tuteur: { nom: '', telephone: '', lien: '' }
    },
    historiquePaiements: [
      {
        id: 'p-7-1',
        libelle: 'Frais d\'inscription Scolarité',
        date: '2025-09-05',
        montant: 300000,
        moyenPaiement: 'Espèces',
        soldeRestant: 1200000
      },
      {
        id: 'p-7-2',
        libelle: '1ère Échéance Scolarité',
        date: '2025-11-01',
        montant: 600000,
        moyenPaiement: 'Mobile Money',
        soldeRestant: 600000
      },
      {
        id: 'p-7-3',
        libelle: '2ème Échéance Scolarité',
        date: '2026-02-01',
        montant: 600000,
        moyenPaiement: 'Mobile Money',
        soldeRestant: 0
      }
    ]
  },
  {
    id: 'student-8',
    matricule: 'LAK-2026-008',
    nom: 'SYLLA',
    prenom: 'Mohamed Lamine',
    classe: '3ème Année',
    sessionScolaire: '2025-2026',
    statutPaiement: 'A_JOUR',
    dateNaissance: '2017-08-20',
    lieuNaissance: 'Dubréka',
    photoUrl: '',
    filiation: {
      pere: { nom: 'Sylla Ousmane', telephone: '+224 628 77 66 55' },
      mere: { nom: 'Bangoura Fanta', telephone: '+224 629 44 33 22' },
      tuteur: { nom: '', telephone: '', lien: '' }
    },
    historiquePaiements: [
      {
        id: 'p-8-1',
        libelle: 'Frais d\'inscription Scolarité',
        date: '2025-09-08',
        montant: 350000,
        moyenPaiement: 'Espèces',
        soldeRestant: 1450000
      },
      {
        id: 'p-8-2',
        libelle: '1ère Échéance Scolarité',
        date: '2025-11-10',
        montant: 725000,
        moyenPaiement: 'Mobile Money',
        soldeRestant: 725000
      },
      {
        id: 'p-8-3',
        libelle: '2ème Échéance Scolarité',
        date: '2026-02-05',
        montant: 725000,
        moyenPaiement: 'Espèces',
        soldeRestant: 0
      }
    ]
  }
];

export interface LevelGroup {
  level: string;
  label: string;
  classes: string[];
}

export const CLASSES_BY_LEVEL: LevelGroup[] = [
  {
    level: 'MATERNELLE',
    label: 'Maternelle',
    classes: [
      'Petite Section',
      'Moyenne Section',
      'Grande Section'
    ]
  },
  {
    level: 'PRIMAIRE',
    label: 'Primaire',
    classes: [
      '1ère Année',
      '2ème Année',
      '3ème Année',
      '4ème Année',
      '5ème Année',
      '6ème Année'
    ]
  },
  {
    level: 'COLLEGE',
    label: 'Collège',
    classes: [
      '7ème Année',
      '8ème Année',
      '9ème Année',
      '10ème Année'
    ]
  },
  {
    level: 'LYCEE',
    label: 'Lycée',
    classes: [
      '11ème Sciences Mathématiques',
      '11ème Sciences Expérimentales',
      '11ème Sciences Sociales',
      '12ème Sciences Mathématiques',
      '12ème Sciences Expérimentales',
      '12ème Sciences Sociales',
      'Tle Sciences Mathématiques',
      'Tle Sciences Expérimentales',
      'Tle Sciences Sociales'
    ]
  }
];

export const AVAILABLE_CLASSES = CLASSES_BY_LEVEL.flatMap(g => g.classes);
