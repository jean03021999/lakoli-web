// Badges du module Salaires (statut de paiement, type de remuneration).

export function BadgeStatutSalaire({ statut }) {
  return statut === "paye" ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#dcfce7] text-[#15803d] border border-[#86efac] whitespace-nowrap">
      ✓ Payé
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#fef9c3] text-[#a16207] border border-[#fcd34d] whitespace-nowrap">
      ⏳ En attente
    </span>
  );
}

export function BadgeType({ type }) {
  return type === "horaire" ? (
    <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#ede9fe] text-[#6d28d9]">Horaire</span>
  ) : (
    <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#dbeafe] text-[#1d4ed8]">Fixe</span>
  );
}
