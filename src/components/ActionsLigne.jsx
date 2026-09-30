import { Pencil, Trash2, Check, X, Loader2 } from "lucide-react";

// Boutons d'une ligne de tableau editable : Modifier / Supprimer, ou Enregistrer / Annuler en
// mode edition.
export default function ActionsLigne({ enEdition, enCours, onModifier, onSupprimer, onEnregistrer, onAnnuler, libelle = "" }) {
  if (enCours) return <Loader2 className="w-4 h-4 animate-spin text-slate-400 ml-auto" />;
  if (enEdition) {
    return (
      <div className="flex items-center justify-end gap-1">
        <button type="button" onClick={onEnregistrer} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 cursor-pointer" title="Enregistrer">
          <Check className="w-4 h-4" />
        </button>
        <button type="button" onClick={onAnnuler} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer" title="Annuler">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-end gap-1">
      <button type="button" onClick={onModifier} className="p-1.5 rounded-lg text-slate-400 hover:text-[#0C447C] hover:bg-blue-50 cursor-pointer" title={`Modifier ${libelle}`.trim()}>
        <Pencil className="w-4 h-4" />
      </button>
      <button type="button" onClick={onSupprimer} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer" title={`Supprimer ${libelle}`.trim()}>
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
