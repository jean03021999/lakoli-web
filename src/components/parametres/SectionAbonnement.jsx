import { CreditCard, Database, GraduationCap, Users, UserCog, School, Clock, AlertTriangle } from "lucide-react";
import { Carte } from "./ui";
import { dateLongue } from "./outils";

const STATUTS = {
  essai: { libelle: "Période d'essai", classe: "bg-amber-400/20 text-amber-100 border-amber-300/40" },
  actif: { libelle: "Licence active", classe: "bg-emerald-400/20 text-emerald-100 border-emerald-300/40" },
  suspendu: { libelle: "Licence suspendue", classe: "bg-rose-400/25 text-rose-100 border-rose-300/40" },
};

function joursRestants(date) {
  if (!date) return null;
  const fin = new Date(`${String(date).slice(0, 10)}T23:59:59`);
  return Math.ceil((fin - Date.now()) / 86400000);
}

// Statut de la licence (GET /parametres -> etablissement) et consommation reelle de l'etablissement.
export default function SectionAbonnement({ etablissement, consommation }) {
  const statut = STATUTS[etablissement.statut] || STATUTS.actif;
  const jours = etablissement.statut === "essai" ? joursRestants(etablissement.date_fin_essai) : null;

  const compteurs = [
    { libelle: "Élèves inscrits", valeur: consommation.eleves, detail: "Session active", icone: GraduationCap, couleur: "text-blue-600" },
    { libelle: "Enseignants", valeur: consommation.enseignants, detail: "Corps enseignant", icone: Users, couleur: "text-emerald-600" },
    { libelle: "Utilisateurs", valeur: consommation.utilisateurs, detail: "Comptes du personnel", icone: UserCog, couleur: "text-purple-600" },
    { libelle: "Classes", valeur: consommation.classes, detail: "Toutes sessions", icone: School, couleur: "text-amber-600" },
  ];

  return (
    <div className="space-y-6">
      <div style={{ background: "linear-gradient(135deg, #0C447C 0%, #1a6bb5 100%)" }} className="rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase border ${statut.classe}`}>{statut.libelle}</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold">{etablissement.nom}</h2>
            <p className="text-xs sm:text-sm text-white/80">
              Code établissement : <span className="font-mono font-bold">{etablissement.code}</span> · Devise de facturation : {etablissement.devise}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 md:w-80 shrink-0 space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-white/70 font-bold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {etablissement.statut === "essai" ? "Fin de la période d'essai" : "Échéance"}
            </p>
            {etablissement.statut === "essai" && etablissement.date_fin_essai ? (
              <>
                <p className="text-base font-bold">{dateLongue(etablissement.date_fin_essai)}</p>
                <p className={`text-xs font-semibold ${jours > 7 ? "text-emerald-300" : "text-amber-300"}`}>
                  {jours > 0 ? `⏳ ${jours} jour${jours > 1 ? "s" : ""} restant${jours > 1 ? "s" : ""}` : "Période d'essai terminée"}
                </p>
              </>
            ) : (
              <p className="text-sm font-semibold text-white/90">{etablissement.statut === "essai" ? "Date de fin non définie" : "Aucune échéance enregistrée"}</p>
            )}
          </div>
        </div>
      </div>

      {etablissement.statut === "suspendu" && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed">La licence de l'établissement est suspendue. Contactez l'équipe LAKOLI pour la réactiver.</p>
        </div>
      )}

      <Carte icone={Database} titre="Consommation de l'établissement" description="Volume de données actuellement géré sur LAKOLI">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {compteurs.map((c) => (
            <div key={c.libelle} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <c.icone className={`w-4 h-4 ${c.couleur}`} />
                {c.libelle}
              </span>
              <p className="text-2xl font-black text-slate-900 mt-2 font-mono">{c.valeur.toLocaleString("fr-FR")}</p>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">{c.detail}</p>
            </div>
          ))}
        </div>
      </Carte>

      <Carte icone={CreditCard} titre="Forfait et facturation" description="Offres et modalités de paiement de la plateforme">
        <p className="text-sm text-slate-600">
          Les forfaits, la facturation et le renouvellement de la licence sont gérés directement avec l'équipe LAKOLI. Pour changer d'offre ou régler votre abonnement, contactez votre interlocuteur LAKOLI.
        </p>
      </Carte>
    </div>
  );
}
