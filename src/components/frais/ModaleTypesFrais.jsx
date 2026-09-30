import { useState } from "react";
import { X, Pencil, Trash2, Check, Loader2 } from "lucide-react";
import api from "../../services/api";
import { configTypeFrais } from "./configFrais";

// Gestion des types de frais : renommer, supprimer (refuse par le serveur si le type est utilise).

export default function ModaleTypesFrais({ typesFrais, onFermer, onModifies, onMessage }) {
  const [enEdition, setEnEdition] = useState(null); // { id, nom }
  const [enCours, setEnCours] = useState(null);
  const [erreur, setErreur] = useState("");

  const renommer = async () => {
    if (!enEdition?.nom.trim()) return;
    setEnCours(enEdition.id);
    setErreur("");
    try {
      await api.put(`/frais/types/${enEdition.id}`, { nom: enEdition.nom.trim() });
      setEnEdition(null);
      await onModifies();
      onMessage("succes", "Type de frais renommé.");
    } catch (err) {
      const liste = err.response?.data?.errors;
      setErreur(liste ? Object.values(liste).flat()[0] : err.response?.data?.message || "Erreur lors du renommage.");
    } finally {
      setEnCours(null);
    }
  };

  const supprimer = async (type) => {
    if (!window.confirm(`Supprimer le type de frais « ${type.nom} » ?`)) return;
    setEnCours(type.id);
    setErreur("");
    try {
      const res = await api.delete(`/frais/types/${type.id}`);
      await onModifies();
      onMessage("succes", res.data.message);
    } catch (err) {
      setErreur(err.response?.data?.message || "Suppression impossible.");
    } finally {
      setEnCours(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-4" onClick={onFermer}>
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Types de frais</h3>
            <p className="text-xs text-slate-500">Un type utilisé par une grille ou un élève ne peut pas être supprimé</p>
          </div>
          <button onClick={onFermer} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer" aria-label="Fermer"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-2">
          {erreur && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">{erreur}</div>}
          {typesFrais.map((t) => {
            const edition = enEdition?.id === t.id;
            return (
              <div key={t.id} className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-slate-200">
                {edition ? (
                  <input
                    autoFocus
                    value={enEdition.nom}
                    onChange={(e) => setEnEdition({ ...enEdition, nom: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") renommer();
                      if (e.key === "Escape") setEnEdition(null);
                    }}
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#0C447C]"
                  />
                ) : (
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${configTypeFrais(t.nom).classe}`}>{t.nom}</span>
                )}
                <div className="flex items-center gap-1 shrink-0">
                  {enCours === t.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  ) : edition ? (
                    <>
                      <button onClick={renommer} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 cursor-pointer" title="Valider"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setEnEdition(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer" title="Annuler"><X className="w-4 h-4" /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setEnEdition({ id: t.id, nom: t.nom })} className="p-1.5 rounded-lg text-slate-400 hover:text-[#0C447C] hover:bg-blue-50 cursor-pointer" title="Renommer"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => supprimer(t)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
