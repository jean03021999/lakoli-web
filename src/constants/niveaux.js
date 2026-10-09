// Niveaux officiels, dans l'ordre pedagogique (meme ordre que Classe::scopeOrdonneesPedagogiquement).
// 11e et 12e : series SM, SE, SS. Les anciennes « Série Scientifique / Littéraire » ne sont plus
// proposees ; les classes creees avant les gardent (NIVEAUX_ANCIENS).
export const TOUS_NIVEAUX = [
  // Maternelle
  "Crèche",
  "Petite Section",
  "Moyenne Section",
  "Grande Section",
  // Primaire
  "1ère Année",
  "2ème Année",
  "3ème Année",
  "4ème Année",
  "5ème Année",
  "6ème Année",
  // Collège
  "7ème Année",
  "8ème Année",
  "9ème Année",
  "10ème Année",
  // Lycée
  "11ème Année - Sciences Mathématiques",
  "11ème Année - Sciences Expérimentales",
  "11ème Année - Sciences Sociales",
  "12ème Année - Sciences Mathématiques",
  "12ème Année - Sciences Expérimentales",
  "12ème Année - Sciences Sociales",
  // Terminale
  "Terminale - Sciences Mathématiques",
  "Terminale - Sciences Expérimentales",
  "Terminale - Sciences Sociales"
];

// Niveaux des classes creees avant le passage aux series SM, SE, SS.
export const NIVEAUX_ANCIENS = [
  "11ème Année - Série Scientifique",
  "11ème Année - Série Littéraire",
  "12ème Année - Série Scientifique",
  "12ème Année - Série Littéraire"
];

export const CYCLES = {
  maternelle: ["Crèche", "Petite Section", "Moyenne Section", "Grande Section"],
  primaire: ["1ère Année", "2ème Année", "3ème Année", "4ème Année", "5ème Année", "6ème Année"],
  college: ["7ème Année", "8ème Année", "9ème Année", "10ème Année"],
  lycee: [
    "11ème Année - Sciences Mathématiques", "11ème Année - Sciences Expérimentales", "11ème Année - Sciences Sociales",
    "12ème Année - Sciences Mathématiques", "12ème Année - Sciences Expérimentales", "12ème Année - Sciences Sociales"
  ],
  terminale: ["Terminale - Sciences Mathématiques", "Terminale - Sciences Expérimentales", "Terminale - Sciences Sociales"]
};
