import { useEffect, useMemo, useState } from "react";
import { X, Loader2, Trash2, ShieldCheck } from "lucide-react";
import api from "../../services/api";
import { LIBELLES_ROLES, messageErreur } from "./outils";

// Creation ou modification d'un role (POST /roles, PUT /roles/{id}) : nom et droits coches par
// module, d'apres le catalogue GET /roles/permissions. Le Fondateur garde toujours la gestion des
// roles et des comptes ; les roles de base (Fondateur, Directeur...) ne se renomment pas.

export const MODULES = {
  administration: "Administration",
  eleves: "Élèves", enseignants: "Enseignants", matieres: "Matières", classes: "Classes", affectations: "Affectations",
  emploi_du_temps: "Emploi du temps", periodes: "Périodes", notes: "Notes", bulletins: "Bulletins", frais: "Frais & caisse", abonnement: "Abonnement",
};
const ORDRE_MODULES = Object.keys(MODULES);
const TOUJOURS_FONDATEUR = ["roles.gerer", "utilisateurs.gerer"];

export default function ModaleRole({ role = null, onFermer, onEnregistre }) {
  const estFondateur = role?.nom?.toLowerCase() === "fondateur";
  const estDeBase = !!role && !!LIBELLES_ROLES[role.nom.toUpperCase()];
  const [catalogue, setCatalogue] = useState(null);
  const [nom, setNom] = useState(role?.nom || "");
  const [coches, setCoches] = useState(() => new Set((role?.permissions || []).map((p) => p.nom)));
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    api.get("/roles/permissions")
      .then((res) => setCatalogue(res.data))
      .catch((err) => setErreur(messageErreur(err, "Impossible de charger la liste des droits.")));
  }, []);

  const parModule = useMemo(() => {
    const groupes = {};
    (catalogue || []).forEach((p) => (groupes[p.module] ||= []).push(p));
    return Object.entries(groupes).sort(([a], [b]) => (ORDRE_MODULES.indexOf(a) + 100 * (ORDRE_MODULES.indexOf(a) < 0)) - (ORDRE_MODULES.indexOf(b) + 100 * (ORDRE_MODULES.indexOf(b) < 0)));
  }, [catalogue]);

  const verrouille = (p) => estFondateur && TOUJOURS_FONDATEUR.includes(p);
  const basculer = (p) => {
    if (verrouille(p)) return;
    setCoches((c) => {
      const n = new Set(c);
      n.has(p) ? n.delete(p) : n.add(p);
      return n;
    });
  };
  const basculerModule = (permissions, tout) =>
    setCoches((c) => {
      const n = new Set(c);
      permissions.forEach((p) => (tout ? n.add(p.nom) : !verrouille(p.nom) && n.delete(p.nom)));
      return n;
    });

  const enregistrer = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    setErreur("");
    try {
      const donnees = { nom: nom.trim(), permissions: [...coches] };
      const res = role ? await api.put(`/roles/${role.id}`, donnees) : await api.post("/roles", donnees);
      onEnregistre(res.data.message);
    } catch (err) {
      setErreur(messageErreur(err, "Enregistrement impossible."));
      setEnvoi(false);
    }
  };

  const supprimer = async () => {
    if (!window.confirm(`Supprimer le rôle « ${role.nom} » ?`)) return;
    setEnvoi(true);
    setErreur("");
    try {
      const res = await api.delete(`/roles/${role.id}`);
      onEnregistre(res.data.message);
    } catch (err) {
      setErreur(messageErreur(err, "Suppression impossible."));
      setEnvoi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-4" onClick={() => !envoi && onFermer()}>
      <form onSubmit={enregistrer} className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-blue-50 text-[#0C447C] flex items-center justify-center"><ShieldCheck className="w-5 h-5" /></span>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">{role ? `Rôle « ${role.nom} »` : "Nouveau rôle"}</h3>
              <p className="text-xs text-slate-500">{coches.size} droit{coches.size > 1 ? "s" : ""} coché{coches.size > 1 ? "s" : ""}</p>
            </div>
          </div>
          <button type="button" onClick={onFermer} disabled={envoi} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer" aria-label="Fermer"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">Nom du rôle</label>
            <input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              disabled={estDeBase}
              placeholder="ex : Secrétaire, Caissier, Surveillant"
              aria-label="Nom du rôle"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0C447C]/20 disabled:text-slate-500"
              required
            />
            {estDeBase && <p className="text-[11px] text-slate-400 mt-1">Rôle de base : son nom ne change pas, ses droits oui.</p>}
          </div>

          {!catalogue && !erreur && <p className="text-xs text-slate-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Chargement des droits…</p>}
          {parModule.map(([module, permissions]) => {
            const tout = permissions.every((p) => coches.has(p.nom));
            return (
              <div key={module} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{MODULES[module] || module}</h4>
                  <button type="button" onClick={() => basculerModule(permissions, !tout)} className="text-[11px] font-semibold text-[#0C447C] hover:underline cursor-pointer">
                    {tout ? "Tout décocher" : "Tout cocher"}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {permissions.map((p) => (
                    <label key={p.nom} className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs ${coches.has(p.nom) ? "border-[#0C447C]/40 bg-blue-50/50" : "border-slate-200"} ${verrouille(p.nom) ? "opacity-70" : "cursor-pointer"}`}>
                      <input type="checkbox" checked={coches.has(p.nom)} disabled={verrouille(p.nom)} onChange={() => basculer(p.nom)} className="mt-0.5 accent-[#0C447C]" aria-label={p.description || p.nom} />
                      <span>
                        <span className="font-semibold text-slate-800">{p.description || p.nom}</span>
                        {verrouille(p.nom) && <span className="block text-[10px] text-slate-400">Toujours accordé au Fondateur</span>}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}

          {erreur && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">{erreur}</div>}
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100">
          {role && !estFondateur ? (
            <button type="button" onClick={supprimer} disabled={envoi} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer disabled:opacity-50">
              <Trash2 className="w-4 h-4" /> Supprimer le rôle
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button type="button" onClick={onFermer} disabled={envoi} className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">Annuler</button>
            <button type="submit" disabled={envoi || !catalogue || nom.trim().length < 2} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0C447C] hover:bg-[#093663] text-white text-xs font-bold disabled:opacity-50 cursor-pointer">
              {envoi && <Loader2 className="w-4 h-4 animate-spin" />}
              {role ? "Enregistrer les droits" : "Créer le rôle"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
