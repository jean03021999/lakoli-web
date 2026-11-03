import { Calculator, Calendar, AlertCircle, CheckCircle2, Save, Layers, Loader2 } from "lucide-react";
import { formaterGNF, formaterDateCourte } from "../configFrais";
import { total } from "./outilsFiche";

// Recapitulatif colle a droite du formulaire : totaux nouvel / ancien eleve, echeancier, et
// bouton d'enregistrement qui dit toujours ce qui manque quand il est grise.
export default function RecapitulatifFiche({ session, classesNoms, inscription, reinscription, echeances, autresFrais, manquants, onEnregistrer, envoi, enModification, elevesAyantPaye, erreur }) {
  const scolarite = total(echeances);
  const obligatoires = autresFrais
    .filter((f) => f.obligatoire)
    .reduce((s, f) => s + (f.montant || 0) * (f.periodicite === "echeance" ? echeances.length || 1 : 1), 0);
  const valide = manquants.length === 0;

  const Total = ({ titre, sousTitre, entree, libelleEntree, couleurs }) => (
    <div className={`p-3.5 rounded-xl border ${couleurs.fond}`}>
      <div className={`flex items-center justify-between text-xs mb-1 ${couleurs.texte}`}>
        <span className="font-bold uppercase tracking-wider text-[11px]">{titre}</span>
        <span className="text-[10px] font-medium">{sousTitre}</span>
      </div>
      <div className={`text-lg font-extrabold tabular-nums ${couleurs.texte}`}>{formaterGNF(entree + scolarite + obligatoires)}</div>
      <div className={`mt-1 text-[10px] leading-tight space-y-0.5 ${couleurs.texte} opacity-90`}>
        <div>• {libelleEntree} : {formaterGNF(entree)}</div>
        <div>• Scolarité : {formaterGNF(scolarite)}</div>
        {obligatoires > 0 && <div>• Frais obligatoires : {formaterGNF(obligatoires)}</div>}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-5">
      <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-blue-50 text-[#0C447C] flex items-center justify-center"><Calculator className="w-4 h-4" /></span>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Récapitulatif financier</h3>
            <p className="text-[11px] text-slate-500">Synthèse du barème</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Session</span>
          <span className="text-xs font-bold text-[#0C447C]">{session || "—"}</span>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-600 font-semibold flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-[#0C447C]" /> Classes couvertes :</span>
          <span className="font-bold text-slate-900">{classesNoms.length} classe{classesNoms.length > 1 ? "s" : ""}</span>
        </div>
        {classesNoms.length > 0 ? (
          <div className="flex flex-wrap gap-1 mt-1 max-h-24 overflow-y-auto">
            {classesNoms.map((n) => (
              <span key={n} className="text-[10px] bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-medium truncate max-w-[140px]">{n}</span>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-amber-700 italic">Aucune classe pour l'instant</p>
        )}
      </div>

      <div className="space-y-3">
        <Total titre="Total nouvel élève" sousTitre="Inscription + année" entree={inscription} libelleEntree="Inscription" couleurs={{ fond: "bg-emerald-50/70 border-emerald-200", texte: "text-emerald-800" }} />
        <Total titre="Total ancien élève" sousTitre="Réinscription + année" entree={reinscription} libelleEntree="Réinscription" couleurs={{ fond: "bg-blue-50/70 border-blue-200", texte: "text-[#0C447C]" }} />
      </div>

      <div>
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-bold text-slate-800 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-500" /> Échéancier ({echeances.length})</span>
          <span className="text-xs font-bold text-slate-700 tabular-nums">{formaterGNF(scolarite)}</span>
        </div>
        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
          {echeances.map((e, i) => (
            <div key={e.cle} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
              <div className="truncate max-w-[150px]">
                <div className="font-semibold text-slate-800 truncate">{e.libelle || `Échéance ${i + 1}`}</div>
                <div className="text-[10px] text-slate-500">Limite : {e.date_limite ? formaterDateCourte(e.date_limite) : "non définie"}</div>
              </div>
              <div className="text-right font-bold text-slate-900 tabular-nums">{formaterGNF(e.montant)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 space-y-3">
        <button
          type="button"
          onClick={() => valide && !envoi && onEnregistrer()}
          disabled={!valide || envoi}
          className="w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer bg-[#0C447C] hover:bg-[#09325c] text-white disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed"
        >
          {envoi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {envoi ? "Enregistrement…" : enModification ? "Mettre à jour la fiche" : "Enregistrer la fiche"}
        </button>

        {!valide ? (
          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-amber-800"><AlertCircle className="w-4 h-4 shrink-0 text-amber-600" /> Pour enregistrer, complétez :</div>
            <ul className="list-disc list-inside space-y-1 pl-1 text-[11px]">
              {manquants.map((m) => <li key={m}>{m}</li>)}
            </ul>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> Tout est rempli : prêt à enregistrer.
          </div>
        )}

        {erreur && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">{erreur}</div>}

        {enModification && elevesAyantPaye > 0 && (
          <div className="text-[11px] text-amber-800 bg-amber-50/90 p-2.5 rounded-lg border border-amber-300">
            <strong>Attention :</strong> {elevesAyantPaye} élève{elevesAyantPaye > 1 ? "s ont" : " a"} déjà payé sur ce barème. Si vous changez un montant ou une échéance, une confirmation vous sera demandée.
          </div>
        )}
      </div>
    </div>
  );
}
