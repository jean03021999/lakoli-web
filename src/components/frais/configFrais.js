// Configurations visuelles partagees par Frais de scolarite, Grilles tarifaires et Journal de caisse
// (design "Frais de scolarite & facturation").

export function normaliser(texte) {
  return (texte || "").normalize("NFD").replace(/\p{Mn}/gu, "").toLowerCase();
}

export function formaterGNF(montant) {
  return `${Math.round(Number(montant) || 0).toLocaleString("fr-FR")} GNF`;
}

export function formaterDateCourte(valeur) {
  const m = String(valeur ?? "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "—";
}

// Statut global d'un eleve (a_jour...) ou d'une echeance (paye...).
export const STATUTS = {
  a_jour: { libelle: "À jour", badge: "bg-[#dcfce7] text-[#15803d]", barre: "bg-emerald-500" },
  paye: { libelle: "Soldé", badge: "bg-[#dcfce7] text-[#15803d]", barre: "bg-emerald-500" },
  partiel: { libelle: "Partiel", badge: "bg-[#fef3c7] text-[#b45309]", barre: "bg-amber-500" },
  en_retard: { libelle: "En retard", badge: "bg-[#fee2e2] text-[#dc2626]", barre: "bg-rose-500" },
  a_echoir: { libelle: "À échoir", badge: "bg-slate-100 text-slate-700", barre: "bg-slate-300" },
};

export const STATUT_AUCUN = { libelle: "Aucun frais", badge: "bg-slate-50 text-slate-400", barre: "bg-slate-200" };

export function statut(cle) {
  return STATUTS[cle] || STATUT_AUCUN;
}

// Type de frais reconnu par son nom (les ids different d'un etablissement a l'autre).
export function configTypeFrais(nom) {
  const n = normaliser(nom);
  if (n.startsWith("scolarit")) return { cle: "scolarite", libelle: nom, classe: "bg-[#dbeafe] text-[#1d4ed8]", barre: "bg-blue-600" };
  if (n === "reinscription") return { cle: "reinscription", libelle: nom, classe: "bg-[#ede9fe] text-[#6d28d9]", barre: "bg-purple-600" };
  if (n.includes("inscription")) return { cle: "inscription", libelle: nom, classe: "bg-[#dcfce7] text-[#15803d]", barre: "bg-emerald-600" };
  if (n.includes("cantine")) return { cle: "cantine", libelle: nom, classe: "bg-[#fef9c3] text-[#a16207]", barre: "bg-amber-500" };
  if (n.includes("transport")) return { cle: "transport", libelle: nom, classe: "bg-[#fee2e2] text-[#dc2626]", barre: "bg-rose-500" };
  return { cle: n || "autre", libelle: nom || "Autre", classe: "bg-slate-100 text-slate-700", barre: "bg-slate-500" };
}

export const MOYENS = {
  especes: { libelle: "Espèces", emoji: "💵", classe: "bg-[#f1f5f9] text-[#475569]", barre: "bg-slate-500" },
  mobile_money: { libelle: "Mobile Money", emoji: "📱", classe: "bg-[#f0fdf4] text-[#15803d]", barre: "bg-emerald-500" },
  virement: { libelle: "Virement", emoji: "🏦", classe: "bg-[#eff6ff] text-[#1d4ed8]", barre: "bg-blue-600" },
  cheque: { libelle: "Chèque", emoji: "📝", classe: "bg-[#fdf4ff] text-[#7c3aed]", barre: "bg-purple-600" },
};

export const COULEURS_AVATAR = ["bg-blue-600", "bg-emerald-600", "bg-violet-600", "bg-amber-600", "bg-rose-600", "bg-cyan-600", "bg-indigo-600"];

export function couleurAvatar(nom) {
  let h = 0;
  for (const c of nom || "") h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return COULEURS_AVATAR[h % COULEURS_AVATAR.length];
}

export const STYLE_CARTE = { borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" };

// Telecharge un CSV (separateur ";" et BOM UTF-8 : s'ouvre directement dans Excel en francais).
export function telechargerCsv(nomFichier, entetes, lignes) {
  const cellule = (v) => {
    const t = String(v ?? "");
    return /[";\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const contenu = "﻿" + [entetes, ...lignes].map((l) => l.map(cellule).join(";")).join("\n");
  const url = URL.createObjectURL(new Blob([contenu], { type: "text/csv;charset=utf-8" }));
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = nomFichier;
  lien.click();
  URL.revokeObjectURL(url);
}
