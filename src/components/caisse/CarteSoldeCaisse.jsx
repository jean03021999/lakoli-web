import { Wallet, ArrowDownCircle, ArrowUpCircle, Receipt, Info } from "lucide-react";
import { MOYENS, formaterGNF } from "../frais/configFrais";

// Solde de caisse (GET /caisse/synthese) : l'argent encaisse finance les salaires et les autres
// depenses. Solde global et reparti par moyen de paiement (especes en caisse, Mobile Money, banque).
export default function CarteSoldeCaisse({ synthese, chargement = false, compacte = false }) {
  const s = synthese;
  const negatif = s && s.solde < 0;
  const ligne = (icone, libelle, valeur, classe) => {
    const Icone = icone;
    return (
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="flex items-center gap-2 text-white/75">
          <Icone className="w-3.5 h-3.5" />
          {libelle}
        </span>
        <span className={`font-bold tabular-nums ${classe}`}>{chargement || !s ? "…" : formaterGNF(valeur)}</span>
      </div>
    );
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 sm:p-6 text-white shadow-md"
      style={{ background: negatif ? "linear-gradient(135deg, #9f1239 0%, #e11d48 100%)" : "linear-gradient(135deg, #064e3b 0%, #059669 100%)" }}
    >
      <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
      <div className={`relative z-10 grid gap-5 ${compacte ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-12"}`}>
        <div className={compacte ? "" : "lg:col-span-5"}>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/80">
            <Wallet className="w-4 h-4" />
            Solde de caisse disponible
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold tabular-nums tracking-tight mt-1.5">{chargement || !s ? "…" : formaterGNF(s.solde)}</div>
          <div className="mt-3 space-y-1.5 max-w-sm">
            {ligne(ArrowDownCircle, "Encaissé (familles)", s?.total_entrees, "text-white")}
            {ligne(ArrowUpCircle, "Salaires versés", -(s?.total_salaires || 0), "text-white")}
            {ligne(Receipt, "Autres dépenses", -(s?.total_depenses || 0), "text-white")}
          </div>
          {negatif && <p className="mt-3 text-xs font-semibold text-white">Les sorties dépassent les encaissements : vérifiez les saisies.</p>}
        </div>

        {!compacte && (
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3 self-center">
            {["especes", "mobile_money", "virement"].map((m) => {
              const d = s?.par_moyen?.[m];
              return (
                <div key={m} className="rounded-xl bg-white/10 border border-white/15 p-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white/75">
                    {MOYENS[m]?.emoji} {m === "especes" ? "Espèces en caisse" : m === "virement" ? "Banque" : MOYENS[m]?.libelle}
                  </p>
                  <p className={`text-lg font-extrabold tabular-nums mt-1 ${d && d.solde < 0 ? "text-rose-200" : ""}`}>{chargement || !d ? "…" : formaterGNF(d.solde)}</p>
                  {d && (
                    <p className="text-[10px] text-white/65 mt-0.5 tabular-nums">
                      +{formaterGNF(d.entrees)} · −{formaterGNF(d.salaires + d.depenses)}
                    </p>
                  )}
                </div>
              );
            })}
            <p className="sm:col-span-3 flex items-start gap-1.5 text-[11px] text-white/70">
              <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
              Chaque salaire payé et chaque dépense sont retirés du moyen utilisé (payer en espèces diminue les espèces en caisse).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
