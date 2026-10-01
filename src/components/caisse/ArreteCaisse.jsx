import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Lock, Printer, CheckCircle2, AlertTriangle, ArrowDownCircle, ArrowUpCircle, Wallet, Sunrise } from "lucide-react";
import api from "../../services/api";
import { MOYENS, STYLE_CARTE, formaterGNF } from "../frais/configFrais";
import { messageErreurApi } from "../../utils/erreurs";
import { imprimerDocument, genererArreteCaisseHtml, formaterDate } from "../../utils/impression";
import { CHAMP, aujourdhui } from "./configCaisse";

// Arrete de caisse du jour : especes attendues selon le systeme (veille + entrees - sorties en
// especes), comptage des billets, ecart justifie, fiche imprimable et historique.

function decalerJour(date, jours) {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + jours);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function billetageVide(coupures) {
  return Object.fromEntries(coupures.map((c) => [String(c), ""]));
}

export default function ArreteCaisse({ etablissement, peutArreter, onArrete }) {
  const [date, setDate] = useState(aujourdhui());
  const [situation, setSituation] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [billetage, setBilletage] = useState({});
  const [observation, setObservation] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState("");
  const [historique, setHistorique] = useState([]);
  const [rechargement, setRechargement] = useState(0);

  useEffect(() => {
    let annule = false;
    setChargement(true);
    setErreur("");
    api.get("/caisse/arretes/preparer", { params: { date } })
      .then((res) => {
        if (annule) return;
        const s = res.data;
        setSituation(s);
        const base = billetageVide(s.coupures);
        if (s.arrete) Object.entries(s.arrete.billetage || {}).forEach(([c, n]) => { base[c] = n ? String(n) : ""; });
        setBilletage(base);
        setObservation(s.arrete?.observation || "");
      })
      .catch((err) => { if (!annule) { setSituation(null); setErreur(messageErreurApi(err, "Impossible de charger la journée.")); } })
      .finally(() => { if (!annule) setChargement(false); });
    return () => { annule = true; };
  }, [date, rechargement]);

  useEffect(() => {
    api.get("/caisse/arretes").then((res) => setHistorique(res.data)).catch(() => setHistorique([]));
  }, [rechargement]);

  const comptees = useMemo(() => Object.entries(billetage).reduce((t, [c, n]) => t + Number(c) * (Number(n) || 0), 0), [billetage]);
  const saisi = Object.values(billetage).some((n) => n !== "" && n !== null);
  const attendues = situation?.especes_theoriques ?? 0;
  const ecart = comptees - attendues;
  const juste = Math.abs(ecart) < 1;
  const arrete = situation?.arrete;
  const sortiesEspeces = (situation?.sorties?.especes?.salaires || 0) + (situation?.sorties?.especes?.depenses || 0);
  const estAujourdhui = date === aujourdhui();

  const enregistrer = async () => {
    setEnvoi(true);
    setErreur("");
    try {
      const res = await api.post("/caisse/arretes", {
        date,
        billetage: Object.fromEntries(Object.entries(billetage).map(([c, n]) => [c, Number(n) || 0])),
        observation: observation.trim(),
      });
      setMessage(res.data.message);
      setRechargement((n) => n + 1);
      onArrete?.();
    } catch (err) {
      setErreur(messageErreurApi(err, "Enregistrement impossible."));
    } finally {
      setEnvoi(false);
    }
  };

  const imprimer = (sit, arr) => {
    if (!imprimerDocument(`Arrêté de caisse ${formaterDate(sit.date)}`, genererArreteCaisseHtml({ etablissement: etablissement?.nom, situation: sit, arrete: arr }))) {
      setErreur("Le navigateur a bloqué la fenêtre d'impression. Autorisez les pop-ups pour ce site.");
    }
  };

  // Reimpression d'un arrete de l'historique : on recharge la situation du jour concerne.
  const imprimerHistorique = async (a) => {
    try {
      const res = await api.get("/caisse/arretes/preparer", { params: { date: a.date } });
      imprimer(res.data, res.data.arrete || a);
    } catch (err) {
      setErreur(messageErreurApi(err, "Impression impossible."));
    }
  };

  const carte = (Icone, libelle, valeur, detail, couleur, fond) => (
    <div className="bg-white p-4 border border-slate-100" style={STYLE_CARTE}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[11px] font-bold uppercase tracking-wider ${couleur}`}>{libelle}</span>
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${fond} ${couleur}`}><Icone className="w-4 h-4" /></span>
      </div>
      <p className="text-lg font-extrabold text-slate-900 tabular-nums">{chargement ? "…" : valeur}</p>
      <p className="text-[11px] text-slate-500 mt-0.5">{detail}</p>
    </div>
  );

  return (
    <div className="space-y-5">
      {message && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
          {message}
          <button onClick={() => setMessage("")} className="text-emerald-500 cursor-pointer text-xs">Fermer</button>
        </div>
      )}
      {erreur && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5">{erreur}</p>}

      {/* Journee */}
      <div className="bg-white p-4 flex flex-wrap items-center justify-between gap-3 border border-slate-100" style={STYLE_CARTE}>
        <div className="flex items-center gap-2">
          <button onClick={() => setDate((d) => decalerJour(d, -1))} className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer" aria-label="Jour précédent"><ChevronLeft className="w-4 h-4" /></button>
          <input type="date" max={aujourdhui()} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl px-3 py-2" />
          <button onClick={() => setDate((d) => decalerJour(d, 1))} disabled={estAujourdhui} className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-40" aria-label="Jour suivant"><ChevronRight className="w-4 h-4" /></button>
          {!estAujourdhui && <button onClick={() => setDate(aujourdhui())} className="text-xs font-semibold text-[#0C447C] hover:underline cursor-pointer ml-1">Aujourd'hui</button>}
        </div>
        {arrete ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold">
            <Lock className="w-3.5 h-3.5" /> Arrêtée par {arrete.arrete_par || "—"} · {formaterDate(arrete.arrete_le)} à {String(arrete.arrete_le || "").slice(11, 16)}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 text-xs font-bold">
            <AlertTriangle className="w-3.5 h-3.5" /> Caisse non arrêtée pour cette journée
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {carte(Sunrise, "Espèces à l'ouverture", formaterGNF(situation?.especes_veille || 0), "Fin de la veille, selon le système", "text-slate-600", "bg-slate-100")}
        {carte(ArrowDownCircle, "Entrées en espèces", `+${formaterGNF(situation?.entrees?.especes || 0)}`, `${situation?.nombre_versements || 0} versement(s) du jour, tous moyens`, "text-emerald-600", "bg-emerald-50")}
        {carte(ArrowUpCircle, "Sorties en espèces", `−${formaterGNF(sortiesEspeces)}`, "Salaires et dépenses payés en espèces", "text-rose-600", "bg-rose-50")}
        {carte(Wallet, "Espèces attendues", formaterGNF(attendues), "Ce qui doit se trouver dans la caisse", "text-[#0C447C]", "bg-blue-50")}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* Comptage */}
        <div className="xl:col-span-3 bg-white border border-slate-100 overflow-hidden" style={STYLE_CARTE}>
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-900">Comptage des espèces (billetage)</h3>
            <p className="text-xs text-slate-500">Comptez les billets présents dans la caisse et saisissez leur nombre.</p>
          </div>
          <div className="p-5 space-y-4">
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              {(situation?.coupures || []).map((c) => {
                const n = billetage[String(c)] ?? "";
                return (
                  <div key={c} className="grid grid-cols-3 items-center gap-3 px-4 py-2 text-sm">
                    <span className="font-semibold text-slate-700 tabular-nums">{formaterGNF(c)}</span>
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={n}
                      disabled={!peutArreter}
                      onChange={(e) => setBilletage((b) => ({ ...b, [String(c)]: e.target.value }))}
                      placeholder="0"
                      aria-label={`Nombre de billets de ${c}`}
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-center tabular-nums focus:outline-none focus:border-[#0C447C] disabled:bg-slate-50"
                    />
                    <span className="text-right font-bold text-slate-800 tabular-nums">{formaterGNF(c * (Number(n) || 0))}</span>
                  </div>
                );
              })}
            </div>

            <div className={`rounded-xl p-4 border ${!saisi ? "bg-slate-50 border-slate-200" : juste ? "bg-emerald-50 border-emerald-200" : ecart < 0 ? "bg-rose-50 border-rose-200" : "bg-amber-50 border-amber-200"}`}>
              <div className="flex items-center justify-between text-sm"><span className="text-slate-600">Espèces comptées</span><span className="font-extrabold tabular-nums">{formaterGNF(comptees)}</span></div>
              <div className="flex items-center justify-between text-sm mt-1"><span className="text-slate-600">Espèces attendues</span><span className="font-bold tabular-nums text-slate-700">{formaterGNF(attendues)}</span></div>
              {saisi && (
                <div className={`flex items-center justify-between mt-2 pt-2 border-t border-black/5 text-sm font-extrabold ${juste ? "text-emerald-700" : ecart < 0 ? "text-rose-700" : "text-amber-800"}`}>
                  <span className="flex items-center gap-1.5">{juste ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}{juste ? "Caisse juste" : ecart < 0 ? "Manquant" : "Excédent"}</span>
                  {!juste && <span className="tabular-nums">{formaterGNF(Math.abs(ecart))}</span>}
                </div>
              )}
            </div>

            {peutArreter && (
              <>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">Observation {saisi && !juste && <span className="text-rose-600">* (obligatoire en cas d'écart)</span>}</label>
                  <textarea rows={2} value={observation} onChange={(e) => setObservation(e.target.value)} placeholder="Ex : dépôt de 5 000 000 GNF à la banque, erreur de rendu de monnaie…" className={`${CHAMP} resize-none`} />
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {situation && (
                    <button onClick={() => imprimer(situation, arrete)} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">
                      <Printer className="w-4 h-4" /> Imprimer la fiche
                    </button>
                  )}
                  <button onClick={enregistrer} disabled={envoi || chargement || !saisi || (!juste && !observation.trim())} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0C447C] hover:bg-[#093663] text-white text-xs font-bold disabled:opacity-40 cursor-pointer">
                    {envoi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    {arrete ? "Refaire l'arrêté" : "Arrêter la caisse"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mouvements du jour */}
        <div className="xl:col-span-2 space-y-5">
          <div className="bg-white border border-slate-100 overflow-hidden" style={STYLE_CARTE}>
            <div className="px-5 py-3.5 border-b border-slate-100"><h3 className="text-sm font-extrabold text-slate-900">Mouvements du jour par moyen</h3></div>
            <table className="w-full text-xs">
              <thead><tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500"><th className="py-2 px-4 text-left">Moyen</th><th className="py-2 px-3 text-right">Entrées</th><th className="py-2 px-4 text-right">Sorties</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(MOYENS).map(([m, info]) => {
                  const e = situation?.entrees?.[m] || 0;
                  const s = (situation?.sorties?.[m]?.salaires || 0) + (situation?.sorties?.[m]?.depenses || 0);
                  return (
                    <tr key={m}>
                      <td className="py-2 px-4 font-semibold text-slate-700">{info.emoji} {info.libelle}</td>
                      <td className="py-2 px-3 text-right tabular-nums text-emerald-700 font-bold">{e ? `+${formaterGNF(e)}` : "—"}</td>
                      <td className="py-2 px-4 text-right tabular-nums text-rose-600 font-bold">{s ? `−${formaterGNF(s)}` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-white border border-slate-100 overflow-hidden" style={STYLE_CARTE}>
            <div className="px-5 py-3.5 border-b border-slate-100"><h3 className="text-sm font-extrabold text-slate-900">Opérations du jour ({situation?.operations?.length || 0})</h3></div>
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {(situation?.operations || []).length === 0 ? (
                <p className="px-5 py-6 text-xs text-slate-400 text-center">Aucune opération enregistrée ce jour.</p>
              ) : (
                situation.operations.map((o, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 px-5 py-2.5 text-xs">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{o.libelle || "—"}</p>
                      <p className="text-[10px] text-slate-400 truncate">{[o.detail, MOYENS[o.moyen_paiement]?.libelle].filter(Boolean).join(" · ")}</p>
                    </div>
                    <span className={`font-extrabold tabular-nums whitespace-nowrap ${o.type === "entree" ? "text-emerald-700" : "text-rose-600"}`}>{o.type === "entree" ? "+" : "−"}{formaterGNF(o.montant)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Historique */}
      <div className="bg-white border border-slate-100 overflow-hidden" style={STYLE_CARTE}>
        <div className="px-5 py-3.5 border-b border-slate-100"><h3 className="text-sm font-extrabold text-slate-900">Historique des arrêtés</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-2.5 px-4 text-left">Date</th><th className="py-2.5 px-3 text-right">Attendu</th><th className="py-2.5 px-3 text-right">Compté</th><th className="py-2.5 px-3 text-right">Écart</th><th className="py-2.5 px-3 text-left">Observation</th><th className="py-2.5 px-3 text-left">Par</th><th className="py-2.5 px-4" />
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {historique.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-400">Aucun arrêté de caisse enregistré.</td></tr>
              ) : historique.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-4 font-bold text-slate-800"><button onClick={() => setDate(a.date)} className="hover:underline cursor-pointer">{formaterDate(a.date)}</button></td>
                  <td className="py-2.5 px-3 text-right tabular-nums">{formaterGNF(a.especes_theoriques)}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-semibold">{formaterGNF(a.especes_comptees)}</td>
                  <td className={`py-2.5 px-3 text-right tabular-nums font-extrabold ${Math.abs(a.ecart) < 1 ? "text-emerald-700" : a.ecart < 0 ? "text-rose-600" : "text-amber-700"}`}>{Math.abs(a.ecart) < 1 ? "Juste" : `${a.ecart > 0 ? "+" : "−"}${formaterGNF(Math.abs(a.ecart))}`}</td>
                  <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">{a.observation || "—"}</td>
                  <td className="py-2.5 px-3 text-slate-600">{a.arrete_par || "—"}</td>
                  <td className="py-2.5 px-4 text-right"><button onClick={() => imprimerHistorique(a)} className="p-1.5 rounded-lg text-slate-400 hover:text-[#0C447C] hover:bg-blue-50 cursor-pointer" title="Imprimer la fiche"><Printer className="w-4 h-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
