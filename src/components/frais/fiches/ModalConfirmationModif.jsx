import { useState } from "react";
import { AlertTriangle, X, CheckCircle, ArrowRight } from "lucide-react";
import { formaterGNF } from "../configFrais";
import { total } from "./outilsFiche";

// Confirmation exigee par le serveur (409) quand des eleves ont deja paye sur un tarif modifie :
// il faut taper CONFIRMER. Ceux qui ont paye gardent leur echeancier, les autres passent au nouveau tarif.
export default function ModalConfirmationModif({ nomFiche, elevesAyantPaye, avant, apres, onConfirmer, onAnnuler, envoi }) {
  const [texte, setTexte] = useState("");
  const ok = texte.trim().toUpperCase() === "CONFIRMER";

  const lignes = [
    ["Inscription (nouvel élève)", formaterGNF(avant.frais_inscription), formaterGNF(apres.frais_inscription)],
    ["Réinscription (ancien élève)", formaterGNF(avant.frais_reinscription), formaterGNF(apres.frais_reinscription)],
    ["Scolarité annuelle", formaterGNF(total(avant.echeances)), formaterGNF(total(apres.echeances))],
    ["Nombre d'échéances", avant.echeances.length, apres.echeances.length],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-[2px]" onClick={() => !envoi && onAnnuler()}>
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-amber-300 overflow-hidden max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center"><AlertTriangle className="w-5 h-5" /></span>
            <div>
              <h3 className="font-bold text-base leading-tight">Des élèves ont déjà payé</h3>
              <p className="text-xs text-amber-100">{elevesAyantPaye} élève{elevesAyantPaye > 1 ? "s ont" : " a"} déjà payé sur les tarifs modifiés</p>
            </div>
          </div>
          <button type="button" onClick={onAnnuler} disabled={envoi} className="p-1 rounded-lg hover:bg-white/10 cursor-pointer" aria-label="Fermer"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-5 text-xs text-slate-700">
          <p className="leading-relaxed">
            Vous modifiez la fiche <strong className="text-slate-900">« {nomFiche} »</strong>. Les élèves qui ont déjà payé <strong>gardent leur échéancier actuel</strong> et leurs reçus ;
            ceux qui n'ont encore rien payé passent au nouveau tarif, tout comme les prochains inscrits.
          </p>

          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
            <div className="px-4 py-2.5 bg-slate-100 font-bold text-slate-800 text-[11px] uppercase tracking-wider">Résumé des changements</div>
            <div className="p-3 space-y-2">
              {lignes.map(([libelle, a, b]) => (
                <div key={libelle} className="flex items-center justify-between py-1 border-b border-slate-200/60 last:border-0">
                  <span className="font-medium text-slate-600">{libelle} :</span>
                  <span className="flex items-center gap-2 font-bold tabular-nums">
                    {String(a) !== String(b) ? (
                      <>
                        <span className="text-slate-400 line-through">{a}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[#0C447C]">{b}</span>
                      </>
                    ) : (
                      <span className="text-slate-500">{b} (inchangé)</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 space-y-2">
            <label htmlFor="mot-confirmation" className="block font-bold text-amber-950">
              Pour valider, tapez <span className="bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-extrabold">CONFIRMER</span> :
            </label>
            <input
              id="mot-confirmation"
              autoFocus
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              placeholder="Tapez CONFIRMER ici…"
              className="w-full px-3 py-2 rounded-lg border border-amber-300 focus:border-amber-600 bg-white font-bold text-sm text-slate-900 outline-none uppercase"
            />
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button type="button" onClick={onAnnuler} disabled={envoi} className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs cursor-pointer">Annuler</button>
          <button
            type="button"
            onClick={onConfirmer}
            disabled={!ok || envoi}
            className="px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer bg-amber-600 hover:bg-amber-700 text-white disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-4 h-4" /> {envoi ? "Enregistrement…" : "Valider définitivement"}
          </button>
        </div>
      </div>
    </div>
  );
}
