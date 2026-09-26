// Badges du module Gestion des Eleves (design Lakoli 2) : statut de paiement global et type
// d'inscription.

const TAILLES = { sm: "px-2.5 py-0.5 text-[11px]", md: "px-3 py-1 text-xs" };

const STATUTS_PAIEMENT = {
  a_jour: { libelle: "À jour", classe: "bg-[#dcfce7] text-[#15803d] border-emerald-200/60" },
  paye: { libelle: "Payé", classe: "bg-[#dcfce7] text-[#15803d] border-emerald-200/60" },
  partiel: { libelle: "Partiel", classe: "bg-[#fef9c3] text-[#a16207] border-amber-200/60" },
  a_echoir: { libelle: "À échoir", classe: "bg-[#f1f5f9] text-[#475569] border-slate-200/60" },
  en_retard: { libelle: "En retard", classe: "bg-[#fee2e2] text-[#dc2626] border-rose-200/60" },
};

const AUCUN_FRAIS = { libelle: "Aucun frais", classe: "bg-slate-50 text-slate-400 border-slate-200/60" };

function Pastille({ libelle, classe, taille }) {
  return (
    <span className={`inline-flex items-center font-bold rounded-full border whitespace-nowrap tracking-tight ${TAILLES[taille]} ${classe}`}>
      {libelle}
    </span>
  );
}

export function BadgeStatutPaiement({ statut, taille = "sm" }) {
  const s = STATUTS_PAIEMENT[statut] || AUCUN_FRAIS;
  return <Pastille {...s} taille={taille} />;
}

// type : "inscription" | "nouvelle" | "reinscription" | null (frais d'inscription pas encore reglés)
export function BadgeInscription({ type, taille = "sm" }) {
  if (type === "reinscription") {
    return <Pastille libelle="Réinscription" classe="bg-[#ede9fe] text-[#6d28d9] border-purple-200/60" taille={taille} />;
  }
  if (type === "inscription" || type === "nouvelle") {
    return <Pastille libelle="Nouvelle" classe="bg-[#dbeafe] text-[#1d4ed8] border-blue-200/60" taille={taille} />;
  }
  return <Pastille libelle="Non inscrit" classe="bg-amber-50 text-amber-700 border-amber-200/60" taille={taille} />;
}
