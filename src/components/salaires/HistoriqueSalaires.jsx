import { useMemo } from "react";
import { CheckCircle2, Clock, Printer, Plus, Users } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import BadgeContrat from "../enseignants/BadgeContrat";
import { degradeEnseignant, initialesEnseignant, formaterGNF } from "../enseignants/theme";
import { MOYENS } from "../frais/configFrais";
import { formaterDate } from "../../utils/impression";
import { MOIS, MOIS_COURTS, STYLE_CARTE, montantBase, montantHeuresSupp } from "./configSalaires";

const SELECT = "text-xs sm:text-sm px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0C447C] font-semibold text-slate-800 transition-colors cursor-pointer";
const LIBELLE_CHAMP = "text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1";

// Onglet "Historique par enseignant" : fiche, compteurs annuels, courbe des 12 mois et
// chronologie des versements de l'enseignant choisi.
export default function HistoriqueSalaires({ salaires, enseignants, enseignantId, setEnseignantId, annee, setAnnee, annees, peutGerer, onNouveau, onFiche }) {
  const enseignant = enseignants.find((e) => e.id === enseignantId) || null;

  const deLAnnee = useMemo(
    () => salaires.filter((s) => s.enseignant_id === enseignantId && s.annee === annee).sort((a, b) => b.mois - a.mois),
    [salaires, enseignantId, annee]
  );

  const net = (s) => Number(s.montant_net) || 0;
  const totalAnnuel = deLAnnee.reduce((t, s) => t + net(s), 0);
  const payes = deLAnnee.filter((s) => s.statut === "paye");
  const totalPercu = payes.reduce((t, s) => t + net(s), 0);
  const heuresSupp = deLAnnee.reduce((t, s) => t + (Number(s.nb_heures_supp) || 0), 0);
  const montantSupp = deLAnnee.reduce((t, s) => t + montantHeuresSupp(s), 0);

  const evolution = MOIS.map((m, i) => {
    const s = deLAnnee.find((x) => x.mois === i + 1);
    return {
      mois: MOIS_COURTS[i],
      complet: m,
      net: s ? net(s) : 0,
      base: s ? montantBase(s) : 0,
      supp: s ? montantHeuresSupp(s) : 0,
      statut: s ? (s.statut === "paye" ? "Payé" : s.statut === "annule" ? "Annulé" : "En attente") : "Non saisi",
    };
  });

  if (enseignants.length === 0) {
    return (
      <div className="bg-white p-12 text-center text-slate-400" style={STYLE_CARTE}>
        <Users className="w-10 h-10 mx-auto text-slate-300" />
        <p className="text-sm font-semibold text-slate-600 mt-3">Aucun enseignant enregistré.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tete avec selection */}
      <div className="bg-white p-6" style={STYLE_CARTE}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {enseignant ? (
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-md shrink-0" style={{ background: degradeEnseignant(enseignant.matricule || enseignant.nom) }}>
                {initialesEnseignant(enseignant)}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{enseignant.prenom} {enseignant.nom}</h2>
                  <BadgeContrat type={enseignant.type_contrat} />
                  <span className="text-xs font-mono font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{enseignant.matricule}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                  <span className="font-semibold text-slate-700">{enseignant.matieres?.length ? `Professeur de ${enseignant.matieres.join(", ")}` : "Aucune matière affectée"}</span>
                  {enseignant.classes?.length > 0 && (
                    <>
                      <span>·</span>
                      <span>Classes : <span className="text-slate-600 font-medium">{enseignant.classes.map((c) => c.nom).join(", ")}</span></span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Sélectionnez un enseignant pour consulter son historique.</p>
          )}

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className={LIBELLE_CHAMP}>Sélectionner un enseignant</label>
              <select value={enseignantId ?? ""} onChange={(e) => setEnseignantId(Number(e.target.value))} className={SELECT}>
                {!enseignant && <option value="">— Choisir —</option>}
                {enseignants.map((e) => (
                  <option key={e.id} value={e.id}>{e.prenom} {e.nom}{e.matieres?.length ? ` (${e.matieres[0]})` : ""}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LIBELLE_CHAMP}>Année</label>
              <select value={annee} onChange={(e) => setAnnee(Number(e.target.value))} className={SELECT}>
                {annees.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            {peutGerer && enseignant && (
              <button
                onClick={() => onNouveau(enseignant.id)}
                className="px-4 py-2 bg-[#0C447C] hover:bg-[#093560] text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Nouveau salaire
              </button>
            )}
          </div>
        </div>

        {enseignant && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total annuel ({annee})</span>
              <div className="text-2xl font-black text-slate-900 mt-1 font-mono tabular-nums">{formaterGNF(totalAnnuel)}</div>
              <div className="text-xs text-slate-500 mt-1">
                Sur {deLAnnee.length} mois enregistré{deLAnnee.length > 1 ? "s" : ""} · {formaterGNF(totalPercu)} perçus
              </div>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100">
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">Mois réglés</span>
              <div className="text-2xl font-black text-emerald-800 mt-1 font-mono tabular-nums">{payes.length} / {deLAnnee.length} mois</div>
              <div className="text-xs text-emerald-700/80 mt-1">
                {deLAnnee.length === 0
                  ? "Aucun salaire saisi cette année"
                  : deLAnnee.length > payes.length
                    ? `${deLAnnee.length - payes.length} en attente de caisse`
                    : "Tous les versements sont à jour"}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100">
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider block">Heures supp cumulées</span>
              <div className="text-2xl font-black text-blue-900 mt-1 font-mono tabular-nums">{heuresSupp.toLocaleString("fr-FR")} h</div>
              <div className="text-xs text-blue-700/80 mt-1 font-mono">+ {formaterGNF(montantSupp)}</div>
            </div>
          </div>
        )}
      </div>

      {enseignant && (
        <>
          {/* Courbe annuelle */}
          <div className="bg-white p-6" style={STYLE_CARTE}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-2 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">Évolution mensuelle des rémunérations · {annee}</h3>
                <p className="text-xs text-slate-500">Salaire net et part des heures supplémentaires</p>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#0C447C]" />Salaire net</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#10b981]" />Heures supp</span>
              </div>
            </div>
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolution} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salaireNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0C447C" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#0C447C" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="salaireSupp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="mois" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => (v >= 1e6 ? `${(v / 1e6).toLocaleString("fr-FR", { maximumFractionDigits: 1 })}M` : v >= 1e3 ? `${Math.round(v / 1e3)}k` : v)}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs min-w-[200px]">
                          <div className="font-bold text-sm text-slate-100 border-b border-slate-700 pb-1 mb-2">{d.complet} {annee}</div>
                          <div className="space-y-1">
                            <div className="flex justify-between gap-3"><span className="text-slate-400">Total net</span><span className="font-mono font-bold text-blue-300">{formaterGNF(d.net)}</span></div>
                            <div className="flex justify-between gap-3"><span className="text-slate-400">Base</span><span className="font-mono">{formaterGNF(d.base)}</span></div>
                            {d.supp > 0 && <div className="flex justify-between gap-3 text-emerald-400"><span>Heures supp</span><span className="font-mono">+ {formaterGNF(d.supp)}</span></div>}
                            <div className="pt-1 mt-1 border-t border-slate-700 flex justify-between text-[11px]">
                              <span className="text-slate-400">Statut</span>
                              <span className={d.statut === "Payé" ? "text-emerald-400" : d.statut === "En attente" ? "text-amber-400" : "text-slate-500"}>{d.statut}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Area type="monotone" dataKey="net" stroke="#0C447C" strokeWidth={2.5} fill="url(#salaireNet)" />
                  <Area type="monotone" dataKey="supp" stroke="#10b981" strokeWidth={2} fill="url(#salaireSupp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chronologie */}
          <div className="bg-white p-6" style={STYLE_CARTE}>
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Chronologie des versements ({deLAnnee.length})</h3>
                <p className="text-xs text-slate-500">Fiches de paie de l'année {annee}</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 whitespace-nowrap">{enseignant.prenom} {enseignant.nom}</span>
            </div>

            {deLAnnee.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm font-semibold text-slate-600">Aucun versement enregistré pour cette année</p>
                {peutGerer && (
                  <button onClick={() => onNouveau(enseignant.id)} className="mt-3 px-4 py-2 bg-[#0C447C] text-white rounded-lg text-xs font-semibold hover:bg-[#093560] transition-colors cursor-pointer">
                    Créer la première fiche
                  </button>
                )}
              </div>
            ) : (
              <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2 sm:before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                {deLAnnee.map((s) => {
                  const estPaye = s.statut === "paye";
                  const hs = montantHeuresSupp(s);
                  const moyen = MOYENS[s.moyen_paiement];
                  return (
                    <div key={s.id} className="relative group">
                      <div
                        className={`absolute -left-6 sm:-left-8 top-4 w-4 h-4 rounded-full border-2 border-white shadow-sm -translate-x-[1px] sm:translate-x-[1px] ${
                          estPaye ? "bg-emerald-500 ring-2 ring-emerald-200" : "bg-amber-500 ring-2 ring-amber-200"
                        }`}
                      />
                      <div className="bg-slate-50 hover:bg-slate-100/80 transition-all rounded-xl p-4 sm:p-5 border border-slate-200/90 group-hover:shadow-md">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-base font-bold text-slate-900">{MOIS[s.mois - 1]} {s.annee}</span>
                            {estPaye ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#dcfce7] text-[#15803d] border border-[#86efac]">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Payé{s.date_paiement ? ` le ${formaterDate(s.date_paiement)}` : ""}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#fef9c3] text-[#a16207] border border-[#fcd34d]">
                                <Clock className="w-3.5 h-3.5" />
                                En attente de caisse
                              </span>
                            )}
                          </div>
                          <div className="text-lg sm:text-xl font-black text-[#0C447C] font-mono tabular-nums">{formaterGNF(s.montant_net)}</div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-xs">
                          <div>
                            <span className="text-slate-400 font-medium block">Décomposition</span>
                            <div className="font-medium text-slate-700 mt-0.5 font-mono">
                              {s.type_remuneration === "horaire" ? `${Number(s.nb_heures)} h × ${formaterGNF(s.taux_horaire)}` : `Base : ${formaterGNF(montantBase(s))}`}
                            </div>
                            {hs > 0 && (
                              <div className="text-emerald-700 font-semibold font-mono">H.Supp ({Number(s.nb_heures_supp)} h) : + {formaterGNF(hs)}</div>
                            )}
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium block">Mode de paiement & référence</span>
                            <div className="text-slate-700 font-medium mt-0.5">{moyen ? `${moyen.emoji} ${moyen.libelle}` : s.moyen_paiement}</div>
                            <div className="font-mono text-slate-500 text-[11px]">
                              Réf : {s.reference}{s.caissier?.name ? ` · par ${s.caissier.name}` : ""}
                            </div>
                          </div>
                          <div className="flex items-center sm:justify-end">
                            <button
                              onClick={() => onFiche(s)}
                              className="px-3 py-1.5 bg-white hover:bg-blue-50 text-[#0C447C] border border-slate-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Voir la fiche de paie
                            </button>
                          </div>
                        </div>
                        {s.observation && <p className="text-[11px] text-slate-500 italic mt-3 pt-2 border-t border-slate-200">{s.observation}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
