import { useRef, useState } from "react";
import { X, Loader2, Save, Paperclip, FileText, Image as ImageIcon } from "lucide-react";
import api from "../../services/api";
import { MOYENS, formaterGNF } from "../frais/configFrais";
import { messageErreurApi } from "../../utils/erreurs";
import { CHAMP, TYPES_PIECES, aujourdhui, tailleLisible, verifierPieces } from "./configCaisse";

// Saisie ou correction d'une depense (hors salaires). A la creation, les pieces justificatives
// (photo de la facture / du recu ou PDF) peuvent etre jointes directement.

const LIBELLE = "block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5";

export default function ModaleDepense({ categories, soldeParMoyen, depense = null, onFermer, onEnregistree }) {
  const modification = Boolean(depense);
  const [form, setForm] = useState(() => ({
    date_depense: depense?.date || aujourdhui(),
    categorie: depense?.categorie || "fournitures",
    libelle: depense?.libelle || "",
    montant: depense ? String(Math.round(depense.montant)) : "",
    moyen_paiement: depense?.moyen_paiement || "especes",
    beneficiaire: depense?.beneficiaire || "",
    numero_piece: depense?.numero_piece || "",
    observation: depense?.observation || "",
  }));
  const [pieces, setPieces] = useState([]);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const selecteur = useRef(null);
  const maj = (c, v) => setForm((f) => ({ ...f, [c]: v }));

  // En modification, le montant deja sorti de ce moyen redevient disponible.
  const disponibleBrut = soldeParMoyen?.[form.moyen_paiement]?.solde;
  const disponible = disponibleBrut === undefined
    ? undefined
    : disponibleBrut + (modification && depense.moyen_paiement === form.moyen_paiement ? depense.montant : 0);
  const depasse = disponible !== undefined && Number(form.montant) > disponible;

  const choisirPieces = (e) => {
    const nouveaux = [...pieces, ...Array.from(e.target.files || [])];
    e.target.value = "";
    const probleme = verifierPieces(nouveaux);
    setErreur(probleme);
    if (!probleme) setPieces(nouveaux);
  };

  const enregistrer = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    setErreur("");
    try {
      let res;
      if (modification) {
        res = await api.put(`/caisse/depenses/${depense.id}`, { ...form, montant: Number(form.montant) });
      } else {
        const donnees = new FormData();
        Object.entries(form).forEach(([cle, valeur]) => donnees.append(cle, cle === "montant" ? String(Number(valeur)) : valeur));
        pieces.forEach((f) => donnees.append("justificatifs[]", f));
        res = await api.post("/caisse/depenses", donnees);
      }
      onEnregistree(res.data.message, res.data.depense);
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
            <h3 className="text-base font-extrabold text-slate-900">{modification ? `Modifier la dépense ${depense.reference || ""}` : "Nouvelle dépense"}</h3>
            <p className="text-xs text-slate-500">Sortie d'argent de la caisse (hors salaires)</p>
          </div>
          <button type="button" onClick={onFermer} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer" aria-label="Fermer"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LIBELLE}>Date *</label>
              <input type="date" max={aujourdhui()} value={form.date_depense} onChange={(e) => maj("date_depense", e.target.value)} required className={CHAMP} />
            </div>
            <div>
              <label className={LIBELLE}>Catégorie *</label>
              <select value={form.categorie} onChange={(e) => maj("categorie", e.target.value)} className={CHAMP}>
                {Object.entries(categories).map(([cle, libelle]) => <option key={cle} value={cle}>{libelle}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={LIBELLE}>Objet de la dépense *</label>
            <input value={form.libelle} onChange={(e) => maj("libelle", e.target.value)} required placeholder="Ex : Facture d'électricité de septembre" className={CHAMP} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LIBELLE}>Montant (GNF) *</label>
              <input type="number" min="1" value={form.montant} onChange={(e) => maj("montant", e.target.value)} required className={`${CHAMP} tabular-nums font-bold`} />
            </div>
            <div>
              <label className={LIBELLE}>Bénéficiaire</label>
              <input value={form.beneficiaire} onChange={(e) => maj("beneficiaire", e.target.value)} placeholder="Ex : EDG, Librairie…" className={CHAMP} />
            </div>
          </div>
          <div>
            <label className={LIBELLE}>Payé par</label>
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

          {/* Justification */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Justification</p>
            <div>
              <label className={LIBELLE}>N° de facture / reçu / bon</label>
              <input value={form.numero_piece} onChange={(e) => maj("numero_piece", e.target.value)} placeholder="Ex : FAC-2026-0457" className={CHAMP} />
            </div>
            {!modification && (
              <div>
                <input ref={selecteur} type="file" multiple accept={TYPES_PIECES} onChange={choisirPieces} className="hidden" />
                <button type="button" onClick={() => selecteur.current?.click()} className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl border-2 border-dashed border-slate-300 text-xs font-semibold text-slate-600 hover:border-[#0C447C] hover:text-[#0C447C] bg-white cursor-pointer">
                  <Paperclip className="w-4 h-4" />
                  Joindre la facture ou le reçu (photo ou PDF, 5 Mo max)
                </button>
                {pieces.length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {pieces.map((f, i) => (
                      <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs">
                        <span className="flex items-center gap-2 min-w-0">
                          {/\.pdf$/i.test(f.name) ? <FileText className="w-4 h-4 text-rose-500 shrink-0" /> : <ImageIcon className="w-4 h-4 text-sky-500 shrink-0" />}
                          <span className="truncate">{f.name}</span>
                          <span className="text-slate-400 shrink-0">{tailleLisible(f.size)}</span>
                        </span>
                        <button type="button" onClick={() => setPieces((p) => p.filter((_, j) => j !== i))} className="p-1 rounded text-slate-400 hover:text-rose-600 cursor-pointer" aria-label="Retirer"><X className="w-3.5 h-3.5" /></button>
                      </li>
                    ))}
                  </ul>
                )}
                {pieces.length === 0 && <p className="mt-1.5 text-[11px] text-amber-700">Sans pièce jointe, la dépense sera marquée « À justifier ».</p>}
              </div>
            )}
          </div>

          <div>
            <label className={LIBELLE}>Observation</label>
            <textarea rows={2} value={form.observation} onChange={(e) => maj("observation", e.target.value)} className={`${CHAMP} resize-none`} />
          </div>
          {erreur && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">{erreur}</div>}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button type="button" onClick={onFermer} disabled={envoi} className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">Annuler</button>
          <button type="submit" disabled={envoi} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0C447C] hover:bg-[#093663] text-white text-xs font-bold disabled:opacity-50 cursor-pointer">
            {envoi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {modification ? "Enregistrer les modifications" : "Enregistrer la dépense"}
          </button>
        </div>
      </form>
    </div>
  );
}
