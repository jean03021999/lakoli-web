// Outils partages du module Enseignants (design "Gestion des enseignants").

// Degrade propre a chaque enseignant, stable (deduit de son matricule ou de son nom).
const DEGRADES = [
  { de: "#0C447C", a: "#1a6bb5" },
  { de: "#047857", a: "#10b981" },
  { de: "#6d28d9", a: "#a78bfa" },
  { de: "#b45309", a: "#f59e0b" },
  { de: "#be123c", a: "#fb7185" },
  { de: "#0e7490", a: "#22d3ee" },
  { de: "#4338ca", a: "#818cf8" },
];

export function degradeEnseignant(cle) {
  let h = 0;
  for (const c of cle || "") h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const d = DEGRADES[h % DEGRADES.length];
  return `linear-gradient(135deg, ${d.de}, ${d.a})`;
}

export function initialesEnseignant(e) {
  return `${e?.prenom?.[0] || ""}${e?.nom?.[0] || ""}`.toUpperCase();
}

// Anciennete en annees depuis le debut du contrat (null si inconnue ou a venir).
export function anciennete(dateDebut) {
  if (!dateDebut) return null;
  const debut = new Date(`${String(dateDebut).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(debut.getTime()) || debut > new Date()) return null;
  return Math.floor((Date.now() - debut.getTime()) / (365.25 * 24 * 3600 * 1000));
}

export function libelleAnciennete(dateDebut) {
  const a = anciennete(dateDebut);
  if (a === null) return null;
  if (a === 0) return "Moins d'un an";
  return `${a} an${a > 1 ? "s" : ""} d'ancienneté`;
}

export function formaterGNF(montant) {
  return `${Math.round(Number(montant) || 0).toLocaleString("fr-FR")} GNF`;
}

export function formaterDate(valeur) {
  const m = String(valeur ?? "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : null;
}

export function normaliser(texte) {
  return (texte || "").normalize("NFD").replace(/\p{Mn}/gu, "").toLowerCase();
}
