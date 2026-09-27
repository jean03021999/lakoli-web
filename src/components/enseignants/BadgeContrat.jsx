const TAILLES = {
  sm: "text-[11px] px-2 py-0.5 font-medium rounded-md",
  md: "text-xs px-2.5 py-1 font-semibold rounded-lg",
};

const CONTRATS = {
  cdi: { libelle: "CDI", classe: "bg-[#dbeafe] text-[#1d4ed8] border border-blue-200/60" },
  cdd: { libelle: "CDD", classe: "bg-[#fef9c3] text-[#a16207] border border-amber-200/60" },
  vacataire: { libelle: "Vacataire", classe: "bg-[#f3e8ff] text-[#7c3aed] border border-purple-200/60" },
};

export default function BadgeContrat({ type, taille = "md" }) {
  const c = CONTRATS[type] || { libelle: "Sans contrat", classe: "bg-rose-50 text-rose-600 border border-rose-200/60" };
  return <span className={`inline-flex items-center tracking-wide whitespace-nowrap ${TAILLES[taille]} ${c.classe}`}>{c.libelle}</span>;
}
