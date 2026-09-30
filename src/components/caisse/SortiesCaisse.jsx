import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Ban, X, Loader2, AlertTriangle, Save, GraduationCap } from "lucide-react";
import api from "../../services/api";
import { MOYENS, STYLE_CARTE, formaterGNF, formaterDateCourte, normaliser, telechargerCsv } from "../frais/configFrais";
import { messageErreurApi } from "../../utils/erreurs";

// Sorties de caisse (GET /caisse/sorties) : salaires verses (depuis Gestion des salaires) et autres
// depenses, avec saisie d'une depense et annulation motivee.

const COULEURS_CATEGORIES = {
  salaire: "bg-[#dbeafe] text-[#1d4ed8]",
  fournitures: "bg-amber-50 text-amber-700",
  electricite_eau: "bg-sky-50 text-sky-700",
  entretien: "bg-orange-50 text-orange-700",
  transport: "bg-violet-50 text-violet-700",
  communication: "bg-cyan-50 text-cyan-700",
  loyer: "bg-rose-50 text-rose-700",
  evenement: "bg-pink-50 text-pink-700",
  administratif: "bg-slate-100 text-slate-700",
  autre: "bg-slate-100 text-slate-600",
};

const CHAMP = "w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0C447C]/15 focus:border-[#0C447C]";

function aujourdhui() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function ModaleDepense({ categories, soldeParMoyen, onFermer, onEnregistree }) {
  const [form, setForm] = useState({ date_depense: aujourdhui(), categorie: "fournitures", libelle: "", montant: "", moyen_paiement: "especes", beneficiaire: "", observation: "" });
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const maj = (c, v) => setForm((f) => ({ ...f, [c]: v }));
  const disponible = soldeParMoyen?.[form.moyen_paiement]?.solde;
  const depasse = disponible !== undefined && Number(form.montant) > disponible;

  const enregistrer = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    setErreur("");
    try {
      const res = await api.post("/caisse/depenses", { ...form, montant: Number(form.montant) });
      onEnregistree(res.data.message);
    } catch (err) {
      setErreur(messageErreurApi(err, "Erreur lors de l'enregistrement."));
      setEnvoi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-4" onClick={() => !envoi && onFermer()}>
      <form onSubmit={enregistrer} className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Nouvelle dépense</h3>
            <p className="text-xs text-slate-500">Sortie d'argent de la caisse (hors salaires)</p>
          </div>
          <button type="button" onClick={onFermer} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer" aria-label="Fermer"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">Date *</label>
              <input type="date" max={aujourdhui()} value={form.date_depense} onChange={(e) => maj("date_depense", e.target.value)} required className={CHAMP} />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">Catégorie *</label>
              <select value={form.categorie} onChange={(e) => maj("categorie", e.target.value)} className={CHAMP}>
                {Object.entries(categories).map(([cle, libelle]) => <option key={cle} value={cle}>{libelle}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">Objet de la dépense *</label>
            <input value={form.libelle} onChange={(e) => maj("libelle", e.target.value)} required placeholder="Ex : Facture d'électricité de septembre" className={CHAMP} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">Montant (GNF) *</label>
              <input type="number" min="1" value={form.montant} onChange={(e) => maj("montant", e.target.value)} required className={`${CHAMP} tabular-nums font-bold`} />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">Bénéficiaire</label>
              <input value={form.beneficiaire} onChange={(e) => maj("beneficiaire", e.target.value)} placeholder="Ex : EDG, Librairie…" className={CHAMP} />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">Payé par</label>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {Object.entries(MOYENS).map(([cle, m]) => (
                <button
                  key={cle}
                  type="button"
                  onClick={() => maj("moyen_paiement", cle)}
                  className={`p-2 rounded-xl border font-semibold cursor-pointer ${form.moyen_paiement === cle ? "border-[#0C447C] bg-blue-50 text-[#0C447C] ring-1 ring-[#0C447C]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                >
                  {m.emoji} {m.libelle}
                </button>
              ))}
            </div>
            {disponible !== undefined && (
              <p className={`mt-1.5 text-[11px] ${depasse ? "text-rose-600 font-semibold" : "text-slate-500"}`}>
                Disponible par ce moyen : {formaterGNF(disponible)}
                {depasse && " — le montant dépasse ce qui est disponible."}
              </p>
            )}
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">Observation</label>
            <textarea rows={2} value={form.observation} onChange={(e) => maj("observation", e.target.value)} className={`${CHAMP} resize-none`} />
          </div>
          {erreur && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">{erreur}</div>}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button type="button" onClick={onFermer} disabled={envoi} className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">Annuler</button>
          <button type="submit" disabled={envoi} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0C447C] hover:bg-[#093663] text-white text-xs font-bold disabled:opacity-50 cursor-pointer">
            {envoi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Enregistrer la dépense
          </button>
        </div>
      </form>
    </div>
  );
}

export default function SortiesCaisse({ synthese, peutEnregistrer, onModifiee }) {
  const [sorties, setSorties] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState("tous");
  const [nouvelle, setNouvelle] = useState(false);
  const [aAnnuler, setAAnnuler] = useState(null);
  const [motif, setMotif] = useState("");
  const [annulation, setAnnulation] = useState({ envoi: false, erreur: "" });
  const [message, setMessage] = useState("");
  const [rechargement, setRechargement] = useState(0);

  useEffect(() => {
    let annule = false;
    api.get("/caisse/sorties")
      .then((res) => { if (!annule) setSorties(res.data); })
      .catch(() => { if (!annule) setErreur("Impossible de charger les sorties de caisse."); })
      .finally(() => { if (!annule) setChargement(false); });
    return () => { annule = true; };
  }, [rechargement]);

  const categories = synthese?.categories || {};
  const libelleCategorie = (c) => (c === "salaire" ? "Salaire" : categories[c] || c);

  const termes = normaliser(recherche).split(/\s+/).filter(Boolean);
  const affichees = useMemo(
    () =>
      sorties.filter((s) => {
        const cible = normaliser(`${s.libelle} ${s.beneficiaire || ""} ${s.reference || ""} ${libelleCategorie(s.categorie)}`);
        return termes.every((t) => cible.includes(t)) && (filtre === "tous" || (filtre === "salaire" ? s.source === "salaire" : s.source === "depense"));
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sorties, recherche, filtre, categories]
  );
  const total = affichees.filter((s) => !s.annule).reduce((t, s) => t + s.montant, 0);

  const apresModification = (texte) => {
    setMessage(texte);
    setRechargement((n) => n + 1);
    onModifiee();
  };

  const annuler = async () => {
    setAnnulation({ envoi: true, erreur: "" });
    try {
      const res = await api.post(`/caisse/depenses/${aAnnuler.id}/annuler`, { motif: motif.trim() });
      setAAnnuler(null);
      setMotif("");
      setAnnulation({ envoi: false, erreur: "" });
      apresModification(res.data.message);
    } catch (err) {
      setAnnulation({ envoi: false, erreur: messageErreurApi(err, "Annulation impossible.") });
    }
  };

  const exporter = () =>
    telechargerCsv(
      `sorties-de-caisse-${aujourdhui()}.csv`,
      ["Date", "Référence", "Catégorie", "Objet", "Bénéficiaire", "Montant (GNF)", "Moyen", "Enregistré par", "Statut"],
      affichees.map((s) => [
        formaterDateCourte(s.date),
        s.reference || "",
        libelleCategorie(s.categorie),
        s.libelle,
        s.beneficiaire || "",
        Math.round(s.montant),
        MOYENS[s.moyen_paiement]?.libelle || s.moyen_paiement,
        s.par || "",
        s.annule ? `Annulée : ${s.motif_annulation || ""}` : "Valide",
      ])
    );

  return (
    <div className="space-y-4">
      {message && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
          {message}
          <button onClick={() => setMessage("")} className="text-emerald-500 cursor-pointer" aria-label="Fermer"><X className="w-4 h-4" /></button>
        </div>
      )}
      {erreur && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5">{erreur}</p>}

      <div className="bg-white p-4 flex flex-wrap items-center justify-between gap-3 border border-slate-100" style={STYLE_CARTE}>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher un objet, bénéficiaire…" className="w-64 bg-slate-50 border border-slate-200 text-xs rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:border-[#0C447C]" />
          </div>
          <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            {[["tous", "Tout"], ["salaire", "Salaires"], ["depense", "Dépenses"]].map(([cle, lib]) => (
              <button key={cle} onClick={() => setFiltre(cle)} className={`px-3 py-1.5 rounded-lg cursor-pointer ${filtre === cle ? "bg-white text-[#0C447C] shadow-sm" : "text-slate-600"}`}>{lib}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exporter} disabled={affichees.length === 0} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-40">Exporter</button>
          {peutEnregistrer && (
            <button onClick={() => setNouvelle(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0C447C] hover:bg-[#093663] text-white text-xs font-bold cursor-pointer">
              <Plus className="w-4 h-4" /> Nouvelle dépense
            </button>
          )}
        </div>
      </div>

      <div className="bg-white overflow-hidden border border-slate-100" style={STYLE_CARTE}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-3">Catégorie</th>
                <th className="py-3 px-3">Objet</th>
                <th className="py-3 px-3">Bénéficiaire</th>
                <th className="py-3 px-4 text-right">Montant</th>
                <th className="py-3 px-3">Moyen</th>
                <th className="py-3 px-3">Référence</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {chargement ? (
                <tr><td colSpan={8} className="py-12 text-center text-slate-400">Chargement…</td></tr>
              ) : affichees.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-slate-400">{sorties.length === 0 ? "Aucune sortie de caisse enregistrée." : "Aucune sortie ne correspond."}</td></tr>
              ) : (
                affichees.map((s) => {
                  const moyen = MOYENS[s.moyen_paiement];
                  return (
                    <tr key={s.cle} className={s.annule ? "bg-rose-50/40" : "hover:bg-slate-50/70"}>
                      <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap">{formaterDateCourte(s.date)}</td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${COULEURS_CATEGORIES[s.categorie] || COULEURS_CATEGORIES.autre}`}>
                          {s.source === "salaire" && <GraduationCap className="w-3 h-3" />}
                          {libelleCategorie(s.categorie)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-800 font-semibold">
                        {s.libelle}
                        {s.annule && <div className="text-[10px] text-rose-600 font-normal mt-0.5">Annulée{s.annule_par ? ` par ${s.annule_par}` : ""} : {s.motif_annulation}</div>}
                      </td>
                      <td className="py-3 px-3 text-slate-600">{s.beneficiaire || "—"}</td>
                      <td className={`py-3 px-4 text-right font-extrabold tabular-nums whitespace-nowrap ${s.annule ? "text-slate-400 line-through" : "text-rose-600"}`}>−{formaterGNF(s.montant)}</td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${moyen?.classe || "bg-slate-100"}`}>{moyen?.emoji} {moyen?.libelle}</span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-[11px] text-slate-500 tabular-nums">
                        {s.reference}
                        {s.par && <div className="text-[10px] text-slate-400">par {s.par}</div>}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {peutEnregistrer && s.source === "depense" && !s.annule && (
                          <button onClick={() => { setAAnnuler(s); setMotif(""); setAnnulation({ envoi: false, erreur: "" }); }} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer" title="Annuler cette dépense">
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-100 text-xs">
          <span className="text-slate-500">{affichees.length} sortie{affichees.length > 1 ? "s" : ""} · les salaires payés viennent de Gestion des salaires</span>
          <span className="font-extrabold text-rose-600 tabular-nums">Total : −{formaterGNF(total)}</span>
        </div>
      </div>

      {nouvelle && (
        <ModaleDepense
          categories={categories}
          soldeParMoyen={synthese?.par_moyen}
          onFermer={() => setNouvelle(false)}
          onEnregistree={(texte) => {
            setNouvelle(false);
            apresModification(texte);
          }}
        />
      )}

      {aAnnuler && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-4" onClick={() => !annulation.envoi && setAAnnuler(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <span className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0"><AlertTriangle className="w-5 h-5" /></span>
              <div>
                <h3 className="text-base font-bold text-slate-900">Annuler cette dépense ?</h3>
                <p className="text-xs text-slate-500 mt-0.5">{aAnnuler.libelle} · {formaterGNF(aAnnuler.montant)} · {aAnnuler.reference}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600">Elle reste visible, barrée, avec votre nom et le motif, et l'argent revient dans le solde de caisse.</p>
            <input autoFocus value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Motif : montant erroné, saisie en double…" className={CHAMP} />
            {annulation.erreur && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">{annulation.erreur}</div>}
            <div className="flex justify-end gap-3">
              <button onClick={() => setAAnnuler(null)} disabled={annulation.envoi} className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">Retour</button>
              <button onClick={annuler} disabled={annulation.envoi || motif.trim().length < 3} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50 cursor-pointer">
                {annulation.envoi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                Annuler la dépense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
