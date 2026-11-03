import { normaliser } from "../configFrais";

// Outils de la fiche tarifaire (design "Fiche tarifaire" de Google AI Studio, relie a /frais/fiches).

// Montant saisi en texte ("1 200 000") : seuls les chiffres comptent.
export function parseGNF(valeur) {
  const n = parseInt(String(valeur ?? "").replace(/[^\d]/g, ""), 10);
  return Number.isNaN(n) ? 0 : n;
}

export function afficherMontant(montant) {
  return montant ? Number(montant).toLocaleString("fr-FR") : "";
}

// Mois de l'annee scolaire, de septembre (annee 1) a aout (annee 2).
export const MOIS_SCOLAIRES = [
  { id: "septembre", nomCourt: "Sept", nom: "Septembre", num: 9 },
  { id: "octobre", nomCourt: "Oct", nom: "Octobre", num: 10 },
  { id: "novembre", nomCourt: "Nov", nom: "Novembre", num: 11 },
  { id: "decembre", nomCourt: "Déc", nom: "Décembre", num: 12 },
  { id: "janvier", nomCourt: "Jan", nom: "Janvier", num: 1 },
  { id: "fevrier", nomCourt: "Fév", nom: "Février", num: 2 },
  { id: "mars", nomCourt: "Mar", nom: "Mars", num: 3 },
  { id: "avril", nomCourt: "Avr", nom: "Avril", num: 4 },
  { id: "mai", nomCourt: "Mai", nom: "Mai", num: 5 },
  { id: "juin", nomCourt: "Juin", nom: "Juin", num: 6 },
  { id: "juillet", nomCourt: "Juil", nom: "Juillet", num: 7 },
  { id: "aout", nomCourt: "Août", nom: "Août", num: 8 },
];

export const MOIS_OCT_JUIN = ["octobre", "novembre", "decembre", "janvier", "fevrier", "mars", "avril", "mai", "juin"];

// Annees de debut et de fin d'une session "2026-2027" (a defaut, l'annee scolaire en cours).
export function anneesSession(libelle) {
  const m = String(libelle ?? "").match(/(\d{4})/);
  if (m) return [Number(m[1]), Number(m[1]) + 1];
  const d = new Date();
  const debut = d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1;
  return [debut, debut + 1];
}

function date(annee, mois, jour) {
  return `${annee}-${String(mois).padStart(2, "0")}-${String(jour).padStart(2, "0")}`;
}

// Date limite par defaut d'un mois : le 5.
export function dateDuMois(idMois, session) {
  const [a1, a2] = anneesSession(session);
  const m = MOIS_SCOLAIRES.find((x) => x.id === idMois);
  return m ? date(m.num >= 9 ? a1 : a2, m.num, 5) : "";
}

export function trimestresDefaut(session) {
  const [a1, a2] = anneesSession(session);
  return [
    { libelle: "1er trimestre", date_limite: date(a1, 10, 5) },
    { libelle: "2e trimestre", date_limite: date(a2, 1, 10) },
    { libelle: "3e trimestre", date_limite: date(a2, 4, 10) },
  ];
}

let compteur = 0;
export const nouvelleCle = () => `l${++compteur}`;

// Lignes d'echeances (sans montant) pour un mode de paiement.
export function lignesPourMode(mode, mois, session, actuelles) {
  if (mode === "trimestre") return trimestresDefaut(session).map((t) => ({ ...t, cle: nouvelleCle() }));
  if (mode === "mois") {
    return MOIS_SCOLAIRES.filter((m) => mois.includes(m.id)).map((m) => ({
      cle: nouvelleCle(),
      libelle: `Mois de ${m.nom.toLowerCase()}`,
      date_limite: dateDuMois(m.id, session),
      mois: m.id,
    }));
  }
  if (actuelles.length > 0) return actuelles.map((e) => ({ cle: e.cle, libelle: e.libelle, date_limite: e.date_limite }));
  const [a1, a2] = anneesSession(session);
  return [
    { cle: nouvelleCle(), libelle: "1re tranche (rentrée)", date_limite: date(a1, 10, 5) },
    { cle: nouvelleCle(), libelle: "2e tranche", date_limite: date(a1, 12, 10) },
    { cle: nouvelleCle(), libelle: "3e tranche", date_limite: date(a2, 2, 15) },
    { cle: nouvelleCle(), libelle: "4e tranche (solde)", date_limite: date(a2, 4, 20) },
  ];
}

// Montant par echeance : le meme partout, ou l'annuel reparti (l'arrondi va sur la derniere).
export function appliquerMontants(lignes, modeSaisie, montant) {
  const n = lignes.length;
  if (modeSaisie === "echeance") return lignes.map((l) => ({ ...l, montant }));
  const part = Math.floor(montant / (n || 1));
  return lignes.map((l, i) => ({ ...l, montant: i === n - 1 ? montant - part * (n - 1) : part }));
}

// Cycle guineen d'une classe, d'apres son niveau ("Petite Section", "7ème Année", "Terminale - SM").
export const CYCLES = [
  { id: "maternelle", nom: "Maternelle", description: "Crèche et préscolaire" },
  { id: "primaire", nom: "Primaire", description: "1re à 6e année" },
  { id: "college", nom: "Collège", description: "7e à 10e année" },
  { id: "lycee", nom: "Lycée", description: "11e, 12e année et Terminale" },
  { id: "autres", nom: "Autres classes", description: "Niveau non reconnu" },
];

export function cycleDeClasse(classe) {
  const n = normaliser(classe.niveau || classe.nom);
  if (/creche|section|maternelle|jardin/.test(n)) return "maternelle";
  if (n.includes("terminale")) return "lycee";
  const num = Number(n.match(/^(\d+)/)?.[1]);
  if (num >= 1 && num <= 6) return "primaire";
  if (num >= 7 && num <= 10) return "college";
  if (num >= 11 && num <= 13) return "lycee";
  return "autres";
}

export const LIBELLES_MODE = { trimestre: "Trimestre", mois: "Mois", personnalise: "Personnalisé" };

export const total = (lignes) => lignes.reduce((s, l) => s + (Number(l.montant) || 0), 0);
