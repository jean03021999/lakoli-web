import { useMemo } from "react";
import { Wallet, CheckCircle, Clock, TrendingUp, Calendar, Download, Printer, Check, ArrowRight, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { degradeEnseignant, initialesEnseignant, formaterGNF } from "../enseignants/theme";
import { MOYENS, telechargerCsv } from "../frais/configFrais";
import { formaterDate } from "../../utils/impression";
import {
  MOIS,
  MOIS_COURTS,
  STYLE_CARTE,
  montantBase,
  montantHeuresSupp,
  rangPeriode,
} from "./configSalaires";
import { BadgeStatutSalaire, BadgeType } from "./BadgesSalaire";

const CONTRATS = { cdi: "CDI", cdd: "CDD", vacataire: "Vacataire" };
const SELECT = "text-xs sm:text-sm py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0C447C] font-medium text-slate-800 transition-colors cursor-pointer";

function CarteStat({ libelle, valeur, detail, pourcentage, degrade, icone: Icone }) {
  return (
    <div className="rounded-2xl p-5 text-white shadow-md relative overflow-hidden" style={{ background: degrade }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/80">{libelle}</span>
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
          <Icone className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className="text-2xl xl:text-[26px] font-black tracking-tight mt-2 font-mono tabular-nums truncate">{valeur}</div>
      <div className="text-xs text-white/75 mt-1 flex justify-between gap-2">{detail}</div>
      <div className="w-full bg-white/20 h-1.5 rounded-full mt-3 overflow-hidden">
        <div className="bg-white h-full rounded-full transition-all duration-500" style={{ width: `${pourcentage}%` }} />
      </div>
    </div>
  );
}

// Onglet "Liste des salaires" : 4 compteurs de la periode, filtres, tableau, recapitulatif et
// evolution de la masse salariale sur les 6 mois se terminant a la periode affichee.
export default function ListeSalaires({ salaires, enseignants, chargement, peutGerer, annees, filtres, setFiltres, onNouveau, onFiche, onPayer, onSupprimer, onHistorique }) {
  const { mois, annee, enseignant, statut } = filtres;
  const maj = (champ, v) => setFiltres((f) => ({ ...f, [champ]: v }));

  const parId = useMemo(() => new Map(enseignants.map((e) => [e.id, e])), [enseignants]);

  // Compteurs calcules sur toute la periode (mois + annee), independamment des autres filtres.
  const dePeriode = useMemo(() => salaires.filter((s) => s.annee === annee && (mois === "tous" || s.mois === mois)), [salaires, mois, annee]);
  const affiches = dePeriode.filter((s) => (enseignant === "tous" || s.enseignant_id === enseignant) && (statut === "tous" || s.statut === statut));

  const somme = (liste, f) => liste.reduce((t, s) => t + f(s), 0);
  const net = (s) => Number(s.montant_net) || 0;
  const total = somme(dePeriode, net);
  const paye = somme(dePeriode.filter((s) => s.statut === "paye"), net);
  const enAttente = dePeriode.filter((s) => s.statut === "en_attente");
  const attente = somme(enAttente, net);
  const supp = somme(dePeriode, montantHeuresSupp);
  const heuresSupp = somme(dePeriode, (s) => Number(s.nb_heures_supp) || 0);
  const pct = (v) => (total > 0 ? Math.round((v / total) * 100) : 0);
  const libelleSelection = mois === "tous" ? `Année ${annee}` : `${MOIS[mois - 1]} ${annee}`;

  const recap = {
    base: somme(affiches, montantBase),
    supp: somme(affiches, montantHeuresSupp),
    net: somme(affiches, net),
    payes: affiches.filter((s) => s.statut === "paye").length,
  };

  // Six mois consecutifs se terminant au mois filtre (ou decembre / mois courant si "tous").
  const fin = mois === "tous" ? (annee === new Date().getFullYear() ? new Date().getMonth() + 1 : 12) : mois;
  const donneesGraphique = useMemo(() => {
    const rangFin = rangPeriode(annee, fin);
    return Array.from({ length: 6 }, (_, i) => {
      const rang = rangFin - 5 + i;
      const [a, m] = [Math.floor(rang / 12), (rang % 12) + 1];
      const duMois = salaires.filter((s) => s.annee === a && s.mois === m);
      return {
        libelle: `${MOIS_COURTS[m - 1]}${a !== annee ? ` ${String(a).slice(2)}` : ""}`,
        complet: `${MOIS[m - 1]} ${a}`,
        base: somme(duMois, montantBase),
        supp: somme(duMois, montantHeuresSupp),
      };
    });
  }, [salaires, annee, fin]);

  const identite = (s) => {
    const e = parId.get(s.enseignant_id);
    return {
      nom: `${s.enseignant?.prenom ?? e?.prenom ?? ""} ${s.enseignant?.nom ?? e?.nom ?? ""}`.trim(),
      matricule: s.enseignant?.matricule ?? e?.matricule ?? "",
      detail: e ? [e.matieres?.join(", "), CONTRATS[e.type_contrat]].filter(Boolean).join(" · ") : "Enseignant retiré",
      initiales: initialesEnseignant(s.enseignant || e),
      fond: degradeEnseignant(s.enseignant?.matricule || e?.matricule || s.enseignant?.nom),
      existe: Boolean(e),
    };
  };

  const exporter = () => {
    telechargerCsv(
      `salaires-${mois === "tous" ? "annee" : MOIS[mois - 1].toLowerCase()}-${annee}.csv`,
      ["Référence", "Enseignant", "Matricule", "Mois", "Année", "Type", "Salaire de base", "Heures supp (h)", "Heures supp (GNF)", "Net (GNF)", "Moyen de paiement", "Statut", "Date de paiement", "Caissier", "Observation"],
      affiches.map((s) => {
        const id = identite(s);
        return [
          s.reference,
          id.nom,
          id.matricule,
          MOIS[s.mois - 1],
          s.annee,
          s.type_remuneration === "horaire" ? "Horaire" : "Fixe",
          Math.round(montantBase(s)),
          Number(s.nb_heures_supp) || 0,
          Math.round(montantHeuresSupp(s)),
          Math.round(net(s)),
          MOYENS[s.moyen_paiement]?.libelle || s.moyen_paiement,
          s.statut === "paye" ? "Payé" : "En attente",
          s.date_paiement ? formaterDate(s.date_paiement) : "",
          s.caissier?.name || "",
          s.observation || "",
        ];
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Compteurs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <CarteStat
          libelle={mois === "tous" ? "Total à payer sur l'année" : "Total à payer ce mois"}
          valeur={formaterGNF(total)}
          detail={<span>Période : {libelleSelection} · {dePeriode.length} fiche{dePeriode.length > 1 ? "s" : ""}</span>}
          pourcentage={total > 0 ? 100 : 0}
          degrade="linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)"
          icone={Wallet}
        />
        <CarteStat
          libelle="Déjà payé"
          valeur={formaterGNF(paye)}
          detail={<><span>Règlements effectués</span><span className="font-bold">{pct(paye)}%</span></>}
          pourcentage={pct(paye)}
          degrade="linear-gradient(135deg, #059669 0%, #10b981 100%)"
          icone={CheckCircle}
        />
        <CarteStat
          libelle="En attente"
          valeur={formaterGNF(attente)}
          detail={<><span>{enAttente.length} salaire{enAttente.length > 1 ? "s" : ""} à régler</span><span className="font-bold">{pct(attente)}%</span></>}
          pourcentage={pct(attente)}
          degrade="linear-gradient(135deg, #d97706 0%, #f59e0b 100%)"
          icone={Clock}
        />
        <CarteStat
          libelle="Heures supp totales"
          valeur={formaterGNF(supp)}
          detail={<><span>{heuresSupp.toLocaleString("fr-FR")} h effectuées</span><span className="font-bold">{pct(supp)}% du total</span></>}
          pourcentage={pct(supp)}
          degrade="linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)"
          icone={TrendingUp}
        />
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4" style={STYLE_CARTE}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex items-center min-w-[150px]">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <select value={mois} onChange={(e) => maj("mois", e.target.value === "tous" ? "tous" : Number(e.target.value))} className={`w-full pl-9 pr-8 ${SELECT}`}>
              <option value="tous">Tous les mois</option>
              {MOIS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <select value={annee} onChange={(e) => maj("annee", Number(e.target.value))} className={`px-3 ${SELECT}`}>
            {annees.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={enseignant} onChange={(e) => maj("enseignant", e.target.value === "tous" ? "tous" : Number(e.target.value))} className={`px-3 min-w-[200px] ${SELECT}`}>
            <option value="tous">Tous les enseignants ({enseignants.length})</option>
            {enseignants.map((e) => (
              <option key={e.id} value={e.id}>{initialesEnseignant(e)} · {e.prenom} {e.nom}{e.matieres?.length ? ` (${e.matieres[0]})` : ""}</option>
            ))}
          </select>
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
            {[["tous", "Tous"], ["paye", "Payé"], ["en_attente", "En attente"]].map(([cle, libelle]) => (
              <button
                key={cle}
                onClick={() => maj("statut", cle)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${statut === cle ? "bg-white text-[#0C447C] shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              >
                {libelle}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={exporter}
          disabled={affiches.length === 0}
          className="flex items-center gap-2 px-4 py-2 border border-[#0C447C] text-[#0C447C] hover:bg-blue-50/70 font-semibold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="Exporter la liste filtrée (CSV pour Excel)"
        >
          <Download className="w-4 h-4" />
          Exporter
        </button>
      </div>

      {/* Tableau */}
      <div className="bg-white overflow-hidden" style={STYLE_CARTE}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4 sm:px-6">Enseignant</th>
                <th className="py-3.5 px-4">Mois / Année</th>
                <th className="py-3.5 px-3">Type</th>
                <th className="py-3.5 px-4 text-right">Salaire base</th>
                <th className="py-3.5 px-4 text-right">H.Supp</th>
                <th className="py-3.5 px-4 text-right">Net à payer</th>
                <th className="py-3.5 px-4">Moyen</th>
                <th className="py-3.5 px-4">Statut</th>
                <th className="py-3.5 px-4 sm:px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {chargement ? (
                <tr><td colSpan={9} className="py-12 text-center text-slate-400">Chargement...</td></tr>
              ) : affiches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="text-3xl">📭</span>
                      <p className="font-semibold text-slate-600">Aucun salaire enregistré pour ces critères</p>
                      {peutGerer && (
                        <>
                          <p className="text-xs text-slate-400">Cliquez sur « Nouveau salaire » pour saisir un état de paie.</p>
                          <button onClick={() => onNouveau()} className="mt-2 px-4 py-2 bg-[#0C447C] text-white rounded-lg text-xs font-semibold hover:bg-[#093560] transition-colors cursor-pointer">
                            + Nouveau salaire
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                affiches.map((s) => {
                  const id = identite(s);
                  const hs = montantHeuresSupp(s);
                  const moyen = MOYENS[s.moyen_paiement];
                  return (
                    <tr key={s.id} className="hover:bg-[#f8fafc] transition-colors group">
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => id.existe && onHistorique(s.enseignant_id)}
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 transition-transform hover:scale-105 cursor-pointer"
                            style={{ background: id.fond }}
                            title={`Voir l'historique de ${id.nom}`}
                          >
                            {id.initiales}
                          </button>
                          <div className="min-w-0">
                            <button
                              onClick={() => id.existe && onHistorique(s.enseignant_id)}
                              className="font-bold text-slate-900 hover:text-[#0C447C] text-left transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <span className="whitespace-nowrap">{id.nom}</span>
                              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                            </button>
                            <div className="text-xs text-slate-400 mt-0.5 whitespace-nowrap">
                              {id.detail} · <span className="font-mono">{s.reference}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {MOIS_COURTS[s.mois - 1]}. {s.annee}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap"><BadgeType type={s.type_remuneration} /></td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-500 tabular-nums whitespace-nowrap">
                        {formaterGNF(montantBase(s))}
                        {s.type_remuneration === "horaire" && (
                          <div className="text-[10px] text-slate-400">{Number(s.nb_heures)} h × {formaterGNF(s.taux_horaire)}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                        {hs > 0 ? <span className="font-semibold text-emerald-600">+ {formaterGNF(hs)}</span> : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#0C447C] tabular-nums whitespace-nowrap text-[15px]">{formaterGNF(s.montant_net)}</td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs font-medium text-slate-700">
                        <span className="flex items-center gap-1.5"><span>{moyen?.emoji}</span><span>{moyen?.libelle || s.moyen_paiement}</span></span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <BadgeStatutSalaire statut={s.statut} />
                        {s.statut === "paye" && s.date_paiement && <div className="text-[10px] text-slate-400 mt-1">le {formaterDate(s.date_paiement)}</div>}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => onFiche(s)}
                            className="p-1.5 px-2 text-xs font-medium text-slate-700 hover:text-[#0C447C] bg-slate-100 hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            title="Imprimer la fiche de paie"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">Fiche</span>
                          </button>
                          {peutGerer && s.statut === "en_attente" && (
                            <>
                              <button
                                onClick={() => onPayer(s)}
                                className="px-2.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                title="Valider le décaissement et marquer comme payé"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                Payer
                              </button>
                              <button onClick={() => onSupprimer(s)} title="Supprimer" className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recapitulatif + evolution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white p-6 flex flex-col justify-between" style={STYLE_CARTE}>
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">Récapitulatif des salaires</h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">{affiches.length} fiche{affiches.length > 1 ? "s" : ""}</span>
            </div>
            <div className="space-y-4 mt-4">
              <div className="flex justify-between items-center py-2 px-3 rounded-xl bg-slate-50">
                <span className="text-xs font-semibold text-slate-500">Total salaires de base (brut)</span>
                <span className="text-sm font-bold text-slate-800 font-mono tabular-nums">{formaterGNF(recap.base)}</span>
              </div>
              <div className="flex justify-between items-center py-2 px-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-xs font-semibold text-emerald-800">Total heures supplémentaires</span>
                <span className="text-sm font-bold text-emerald-700 font-mono tabular-nums">+ {formaterGNF(recap.supp)}</span>
              </div>
              <div className="flex justify-between items-center py-3 px-3.5 rounded-xl bg-[#eff6ff] border border-[#0C447C]/20">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0C447C]">Total net</span>
                <span className="text-lg font-black text-[#0C447C] font-mono tabular-nums">{formaterGNF(recap.net)}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Fiches réglées</span>
            <span className={`font-semibold ${recap.payes === affiches.length && affiches.length > 0 ? "text-emerald-600" : "text-amber-600"}`}>
              {recap.payes} / {affiches.length}
            </span>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white p-6" style={STYLE_CARTE}>
          <div className="flex items-center justify-between mb-4 gap-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Évolution de la masse salariale (6 mois)</h3>
              <p className="text-xs text-slate-400">Salaires de base et heures supplémentaires, tous enseignants</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600 shrink-0">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#0C447C]" />Base</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#10b981]" />H.Supp</span>
            </div>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={donneesGraphique} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="libelle" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
                <YAxis
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => (v >= 1e6 ? `${(v / 1e6).toLocaleString("fr-FR", { maximumFractionDigits: 1 })}M` : v >= 1e3 ? `${Math.round(v / 1e3)}k` : v)}
                />
                <Tooltip
                  cursor={{ fill: "rgba(12,68,124,0.05)" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs min-w-[190px]">
                        <div className="font-bold text-slate-100 border-b border-slate-700 pb-1 mb-2">{d.complet}</div>
                        <div className="flex justify-between gap-3"><span className="text-slate-400">Base</span><span className="font-mono">{formaterGNF(d.base)}</span></div>
                        <div className="flex justify-between gap-3 text-emerald-400"><span>H.Supp</span><span className="font-mono">+ {formaterGNF(d.supp)}</span></div>
                        <div className="flex justify-between gap-3 mt-1 pt-1 border-t border-slate-700 font-bold"><span>Total</span><span className="font-mono">{formaterGNF(d.base + d.supp)}</span></div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="base" stackId="a" fill="#0C447C" />
                <Bar dataKey="supp" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
