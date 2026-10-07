import { useEffect, useMemo, useState } from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import { Printer, TrendingUp, ArrowDownCircle, ArrowUpCircle, Wallet, Target, Loader2, ChevronRight } from "lucide-react";
import api from "../../services/api";
import { STYLE_CARTE, formaterGNF } from "../../components/frais/configFrais";
import { messageErreurApi } from "../../utils/erreurs";
import { imprimerDocument, genererRapportFinancierHtml } from "../../utils/impression";

// Rapport financier (GET /caisse/evolution) : la session mois par mois — attendu selon
// l'echeancier et recouvre, encaissements, salaires, depenses, solde cumule — avec graphique,
// detail d'un mois et impression (annee ou mois).

const millions = (v) => {
  const n = Math.abs(v);
  if (n >= 1e9) return `${(v / 1e9).toFixed(1).replace(".", ",")} Md`;
  if (n >= 1e6) return `${(v / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(".", ",")} M`;
  if (n >= 1e3) return `${Math.round(v / 1e3)} k`;
  return String(v);
};

const MOIS_COURTS = ["Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."];

function pourcentage(part, tout) {
  return tout > 0 ? Math.round((part / tout) * 100) : null;
}

export default function RapportFinancier({ etablissement = null }) {
  const [donnees, setDonnees] = useState(null);
  const [sessionId, setSessionId] = useState("");
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [moisChoisi, setMoisChoisi] = useState(null);

  useEffect(() => {
    let annule = false;
    setChargement(true);
    api.get("/caisse/evolution", { params: sessionId ? { session_id: sessionId } : {} })
      .then((res) => {
        if (annule) return;
        setDonnees(res.data);
        setErreur("");
        // Mois ouvert par defaut : le mois en cours s'il fait partie de la session, sinon le dernier passe.
        const courant = new Date().toISOString().slice(0, 7);
        const passes = res.data.mois.filter((m) => !m.futur);
        setMoisChoisi((res.data.mois.find((m) => m.mois === courant) || passes[passes.length - 1] || res.data.mois[0])?.mois || null);
      })
      .catch((err) => { if (!annule) setErreur(messageErreurApi(err, "Impossible de charger le rapport financier.")); })
      .finally(() => { if (!annule) setChargement(false); });
    return () => { annule = true; };
  }, [sessionId]);

  const t = donnees?.totaux;
  const mois = donnees?.mois || [];
  const detail = mois.find((m) => m.mois === moisChoisi);
  const graphique = useMemo(
    () => mois.map((m) => ({ nom: MOIS_COURTS[Number(m.mois.slice(5, 7)) - 1], Encaissé: m.entrees, Salaires: m.salaires, Dépenses: m.depenses, "Solde cumulé": m.futur ? null : m.solde_cumule, futur: m.futur })),
    [mois]
  );

  const imprimer = (moisDetail = null) => {
    const html = genererRapportFinancierHtml({ etablissement: etablissement?.nom, donnees, moisDetail });
    const titre = moisDetail ? `Rapport mensuel - ${detail?.libelle}` : `Rapport financier ${donnees.session.libelle}`;
    if (!imprimerDocument(titre, html)) setErreur("Le navigateur a bloqué la fenêtre d'impression. Autorisez les pop-ups pour ce site.");
  };

  const tauxEchu = t ? pourcentage(t.recouvre_echu, t.attendu_echu) : null;
  const cartes = t ? [
    { libelle: "Total encaissé", valeur: formaterGNF(t.entrees), detail: t.dont_reprises > 0 ? `dont ${formaterGNF(t.dont_reprises)} payés avant LAKOLI (hors caisse)` : `Année ${donnees.session.libelle}`, icone: ArrowDownCircle, couleur: "text-emerald-600", fond: "bg-emerald-50", bord: "border-emerald-100" },
    { libelle: "Total des sorties", valeur: formaterGNF(t.salaires + t.depenses), detail: `Salaires ${formaterGNF(t.salaires)} · dépenses ${formaterGNF(t.depenses)}`, icone: ArrowUpCircle, couleur: "text-rose-600", fond: "bg-rose-50", bord: "border-rose-100" },
    { libelle: "Solde de l'année", valeur: formaterGNF(t.solde), detail: "Encaissé − sorties", icone: Wallet, couleur: "text-[#0C447C]", fond: "bg-blue-50", bord: "border-blue-100" },
    { libelle: "Recouvrement échu", valeur: tauxEchu === null ? "—" : `${tauxEchu} %`, detail: `${formaterGNF(t.recouvre_echu)} sur ${formaterGNF(t.attendu_echu)} attendus à ce jour`, icone: Target, couleur: "text-amber-700", fond: "bg-amber-50", bord: "border-amber-100" },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs" style={{ background: "#0C447C" }}>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Rapport financier</h1>
          <p className="text-xs text-white/80 mt-0.5">Évolution mois par mois · Attendu, encaissé, salaires, dépenses et solde</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {donnees?.sessions?.length > 1 && (
            <select value={sessionId || donnees.session.id} onChange={(e) => setSessionId(e.target.value)} className="bg-white/10 border border-white/20 text-white text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:outline-none">
              {donnees.sessions.map((s) => <option key={s.id} value={s.id} className="text-slate-800">{s.libelle}{s.est_active ? " (en cours)" : ""}</option>)}
            </select>
          )}
          <button onClick={() => imprimer()} disabled={!donnees} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-[#0C447C] hover:bg-slate-100 text-xs font-bold cursor-pointer disabled:opacity-50">
            <Printer className="w-3.5 h-3.5" /> Imprimer l'année
          </button>
        </div>
      </div>

      {erreur && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5">{erreur}</p>}

      {chargement && !donnees ? (
        <div className="py-20 text-center text-slate-400 text-sm"><Loader2 className="w-5 h-5 animate-spin inline" /> Calcul du rapport…</div>
      ) : donnees && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {cartes.map((c) => {
              const Icone = c.icone;
              return (
                <div key={c.libelle} className={`bg-white p-4 border ${c.bord}`} style={STYLE_CARTE}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${c.couleur}`}>{c.libelle}</span>
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.fond} ${c.couleur}`}><Icone className="w-4 h-4" /></span>
                  </div>
                  <p className="text-lg sm:text-xl font-extrabold text-slate-900 tabular-nums">{c.valeur}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{c.detail}</p>
                </div>
              );
            })}
          </div>

          <div className="bg-white p-5 border border-slate-100" style={STYLE_CARTE}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-[#0C447C]" />
              <h3 className="text-sm font-extrabold text-slate-900">Entrées, sorties et solde cumulé</h3>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={graphique} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="nom" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={millions} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={48} />
                  <Tooltip formatter={(v) => (v === null ? "—" : formaterGNF(v))} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Encaissé" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Salaires" stackId="sorties" fill="#3b82f6" />
                  <Bar dataKey="Dépenses" stackId="sorties" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="Solde cumulé" stroke="#0C447C" strokeWidth={2.5} dot={{ r: 3 }} connectNulls={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
            <div className="xl:col-span-3 bg-white border border-slate-100 overflow-hidden" style={STYLE_CARTE}>
              <div className="px-5 py-3.5 border-b border-slate-100"><h3 className="text-sm font-extrabold text-slate-900">Mois par mois</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-2.5 px-4 text-left">Mois</th>
                      <th className="py-2.5 px-3 text-right">Attendu</th>
                      <th className="py-2.5 px-3 text-right">Recouvré</th>
                      <th className="py-2.5 px-3 text-right">Encaissé</th>
                      <th className="py-2.5 px-3 text-right">Sorties</th>
                      <th className="py-2.5 px-3 text-right">Solde cumulé</th>
                      <th className="py-2.5 pr-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mois.map((m) => {
                      const p = pourcentage(m.recouvre, m.attendu);
                      return (
                        <tr key={m.mois} onClick={() => setMoisChoisi(m.mois)} className={`cursor-pointer ${m.mois === moisChoisi ? "bg-blue-50/70" : "hover:bg-slate-50/70"} ${m.futur ? "text-slate-400" : ""}`}>
                          <td className="py-2.5 px-4 font-bold text-slate-800">{m.libelle}{m.futur && <span className="ml-1.5 text-[10px] font-normal text-slate-400">à venir</span>}</td>
                          <td className="py-2.5 px-3 text-right tabular-nums">{m.attendu ? formaterGNF(m.attendu) : "—"}</td>
                          <td className="py-2.5 px-3 text-right">
                            {p === null ? "—" : (
                              <span className={`inline-flex px-1.5 py-0.5 rounded-md text-[10px] font-bold ${p >= 80 ? "bg-emerald-50 text-emerald-700" : p >= 40 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-600"}`}>{p} %</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-emerald-700">{m.entrees ? formaterGNF(m.entrees) : "—"}</td>
                          <td className="py-2.5 px-3 text-right tabular-nums text-rose-600">{m.salaires + m.depenses ? formaterGNF(m.salaires + m.depenses) : "—"}</td>
                          <td className="py-2.5 px-3 text-right tabular-nums font-extrabold text-slate-800">{m.futur ? "—" : formaterGNF(m.solde_cumule)}</td>
                          <td className="py-2.5 pr-3 text-slate-300"><ChevronRight className="w-4 h-4" /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {detail && (
              <div className="xl:col-span-2 bg-white border border-slate-100 overflow-hidden self-start" style={STYLE_CARTE}>
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-extrabold text-slate-900">{detail.libelle}</h3>
                  <button onClick={() => imprimer(detail.mois)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">
                    <Printer className="w-3.5 h-3.5" /> Rapport du mois
                  </button>
                </div>
                <div className="p-5 space-y-5 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-emerald-50 p-3"><p className="text-[10px] font-bold uppercase text-emerald-700">Encaissé</p><p className="text-base font-extrabold tabular-nums text-slate-900">{formaterGNF(detail.entrees)}</p>{detail.dont_reprises > 0 && <p className="text-[10px] text-emerald-700">dont {formaterGNF(detail.dont_reprises)} de reprise</p>}</div>
                    <div className="rounded-xl bg-rose-50 p-3"><p className="text-[10px] font-bold uppercase text-rose-600">Sorties</p><p className="text-base font-extrabold tabular-nums text-slate-900">{formaterGNF(detail.salaires + detail.depenses)}</p></div>
                    <div className="rounded-xl bg-blue-50 p-3"><p className="text-[10px] font-bold uppercase text-[#0C447C]">Solde du mois</p><p className="text-base font-extrabold tabular-nums text-slate-900">{formaterGNF(detail.solde)}</p></div>
                    <div className="rounded-xl bg-amber-50 p-3"><p className="text-[10px] font-bold uppercase text-amber-700">Reste à recouvrer</p><p className="text-base font-extrabold tabular-nums text-slate-900">{formaterGNF(Math.max(0, detail.attendu - detail.recouvre))}</p></div>
                  </div>

                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Encaissements par type</p>
                    {[["Scolarité", detail.entrees_par_type.scolarite, "bg-emerald-500"], ["Inscriptions", detail.entrees_par_type.inscription, "bg-sky-500"], ["Autres frais", detail.entrees_par_type.autres, "bg-violet-500"]].map(([lib, v, couleur]) => (
                      <div key={lib} className="mb-2">
                        <div className="flex justify-between"><span className="text-slate-600">{lib}</span><span className="font-bold tabular-nums">{formaterGNF(v)}</span></div>
                        <div className="h-1.5 rounded-full bg-slate-100 mt-1"><div className={`h-1.5 rounded-full ${couleur}`} style={{ width: `${detail.entrees ? (v / detail.entrees) * 100 : 0}%` }} /></div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Sorties</p>
                    {detail.salaires + detail.depenses === 0 ? (
                      <p className="text-slate-400 italic">Aucune sortie ce mois.</p>
                    ) : (
                      <ul className="divide-y divide-slate-100">
                        {detail.salaires > 0 && <li className="flex justify-between py-1.5"><span className="text-slate-600">Salaires ({detail.nombre_salaires})</span><span className="font-bold tabular-nums">{formaterGNF(detail.salaires)}</span></li>}
                        {detail.depenses_par_categorie.map((c) => <li key={c.categorie} className="flex justify-between py-1.5"><span className="text-slate-600">{c.libelle}</span><span className="font-bold tabular-nums">{formaterGNF(c.total)}</span></li>)}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
