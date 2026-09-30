import { useState } from "react";
import { X, Plus, Trash2, Save, Loader2, Info } from "lucide-react";
import api from "../../services/api";
import { formaterGNF } from "./configFrais";

// Modification d'une grille tarifaire (PUT /frais/grilles/{id}) : montant et echeances, avec report
// optionnel du nouveau tarif aux eleves deja factures par cette grille qui n'ont encore rien paye.

const CHAMP = "w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#0C447C]/20 focus:border-[#0C447C]";

export default function ModaleGrille({ grille, onFermer, onEnregistree }) {
  const [echeances, setEcheances] = useState(() =>
    (grille.echeances || []).map((e) => ({ libelle: e.libelle, montant: String(Math.round(Number(e.montant))), date_limite: String(e.date_limite).slice(0, 10) }))
  );
  const [propager, setPropager] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  const total = echeances.reduce((s, e) => s + (Number(e.montant) || 0), 0);
  const valide = echeances.length > 0 && total > 0 && echeances.every((e) => e.libelle.trim() && e.date_limite);
  const maj = (i, champ, valeur) => setEcheances((l) => l.map((e, j) => (j === i ? { ...e, [champ]: valeur } : e)));

  const enregistrer = async () => {
    setEnvoi(true);
    setErreur("");
    try {
      const res = await api.put(`/frais/grilles/${grille.id}`, {
        montant: total,
        echeances: echeances.map((e) => ({ libelle: e.libelle.trim(), montant: Number(e.montant) || 0, date_limite: e.date_limite })),
        propager,
      });
      onEnregistree(res.data.message);
    } catch (err) {
      const liste = err.response?.data?.errors;
      setErreur(liste ? Object.values(liste).flat()[0] : err.response?.data?.message || "Erreur lors de l'enregistrement.");
      setEnvoi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-4" onClick={() => !envoi && onFermer()}>
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Modifier la grille tarifaire</h3>
            <p className="text-xs text-slate-500">{grille.type_frais?.nom} · {grille.classe?.nom}</p>
          </div>
          <button onClick={onFermer} disabled={envoi} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer" aria-label="Fermer"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 px-0.5">
              <span className="col-span-5">Échéance</span>
              <span className="col-span-3">Montant (GNF)</span>
              <span className="col-span-3">Date limite</span>
            </div>
            {echeances.map((e, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <input value={e.libelle} onChange={(ev) => maj(i, "libelle", ev.target.value)} className={`${CHAMP} col-span-5 font-semibold`} />
                <input type="number" min="0" value={e.montant} onChange={(ev) => maj(i, "montant", ev.target.value)} className={`${CHAMP} col-span-3 tabular-nums font-bold`} />
                <input type="date" value={e.date_limite} onChange={(ev) => maj(i, "date_limite", ev.target.value)} className={`${CHAMP} col-span-3`} />
                <button
                  type="button"
                  disabled={echeances.length === 1}
                  onClick={() => setEcheances((l) => l.filter((_, j) => j !== i))}
                  className="col-span-1 justify-self-end text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                  title="Retirer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setEcheances((l) => [...l, { libelle: `Tranche ${l.length + 1}`, montant: "0", date_limite: "" }])}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-slate-300 text-xs text-slate-500 hover:bg-slate-50 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Ajouter une échéance
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#eff6ff] border border-[#0C447C]/15">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0C447C]">Nouveau montant annuel</span>
            <span className="text-lg font-extrabold text-[#0C447C] tabular-nums">{formaterGNF(total)}</span>
          </div>

          <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
            <input type="checkbox" checked={propager} onChange={(e) => setPropager(e.target.checked)} className="mt-0.5 accent-[#0C447C]" />
            <span className="text-xs text-slate-700">
              <strong className="block text-slate-900">Appliquer aussi aux élèves déjà facturés</strong>
              Seuls les élèves qui n'ont encore rien payé sur ce frais passent au nouveau tarif. Ceux qui ont déjà payé gardent leur échéancier.
            </span>
          </label>

          <p className="flex items-start gap-2 text-[11px] text-slate-500">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            Sans cette option, le nouveau tarif ne s'applique qu'aux prochains élèves inscrits dans la classe.
          </p>

          {erreur && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">{erreur}</div>}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button type="button" onClick={onFermer} disabled={envoi} className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">Annuler</button>
          <button
            type="button"
            onClick={enregistrer}
            disabled={!valide || envoi}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0C447C] hover:bg-[#093663] text-white text-xs font-bold disabled:bg-slate-300 disabled:cursor-not-allowed cursor-pointer"
          >
            {envoi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {envoi ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}
