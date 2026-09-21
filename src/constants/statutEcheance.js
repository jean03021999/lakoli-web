// Statut d'une echeance selon ce qui a ete paye et sa date limite :
// - paye      : montant_paye >= montant
// - partiel   : 0 < montant_paye < montant
// - a_echoir  : rien paye et date limite pas encore depassee (le jour meme compris)
// - en_retard : rien paye et date limite depassee
// Meme regle que EcheanceEleve::getStatutAttribute cote backend.
export function calculerStatutEcheance({ montant, montant_paye, date_limite }) {
  const paye = Number(montant_paye) || 0;
  if (paye >= Number(montant)) return "paye";
  if (paye > 0) return "partiel";

  // Comparaison de dates AAAA-MM-JJ (date locale) : evite tout decalage d'heure ou de fuseau.
  const d = new Date();
  const aujourdhui = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return String(date_limite).slice(0, 10) < aujourdhui ? "en_retard" : "a_echoir";
}

// Le "!" force les couleurs par-dessus celles du composant Badge.
export const STATUTS_ECHEANCE = {
  paye: {
    libelle: "Payé",
    badge: "!bg-emerald-50 !text-emerald-600 !border-emerald-100",
    texte: "text-emerald-600",
  },
  partiel: {
    libelle: "Partiel",
    badge: "!bg-orange-50 !text-orange-600 !border-orange-100",
    texte: "text-orange-500",
  },
  a_echoir: {
    libelle: "À échoir",
    badge: "!bg-slate-100 !text-slate-500 !border-slate-200",
    texte: "text-slate-500",
  },
  en_retard: {
    libelle: "En retard",
    badge: "!bg-rose-50 !text-rose-600 !border-rose-100",
    texte: "text-rose-600",
  },
};
