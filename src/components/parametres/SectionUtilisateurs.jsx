import { useEffect, useState } from "react";
import { Users, ShieldCheck, ChevronDown, ChevronUp, Search, Phone, Ban } from "lucide-react";
import api from "../../services/api";
import AvatarUtilisateur from "../AvatarUtilisateur";
import { Carte } from "./ui";
import { LIBELLES_ROLES, momentRelatif } from "./outils";

const STYLES_ROLES = {
  FONDATEUR: "bg-purple-50 text-purple-700 border-purple-200",
  DIRECTEUR: "bg-indigo-50 text-indigo-700 border-indigo-200",
  PROVISEUR: "bg-blue-50 text-blue-700 border-blue-200",
  CENSEUR: "bg-emerald-50 text-emerald-700 border-emerald-200",
  COMPTABLE: "bg-amber-50 text-amber-700 border-amber-200",
};
const COULEURS_AVATAR = ["bg-blue-600", "bg-emerald-600", "bg-amber-600", "bg-indigo-600", "bg-purple-600", "bg-sky-700", "bg-rose-600"];

// Libelles des modules de permissions (colonne permissions.module).
const MODULES = {
  eleves: "Élèves", enseignants: "Enseignants", matieres: "Matières", classes: "Classes", affectations: "Affectations",
  emploi_du_temps: "Emploi du temps", periodes: "Périodes", notes: "Notes", bulletins: "Bulletins", frais: "Frais & caisse", abonnement: "Abonnement",
};

function libelleRole(nom) {
  return LIBELLES_ROLES[String(nom || "").toUpperCase()] || nom;
}

// Utilisateurs de l'etablissement (GET /utilisateurs) et roles avec leurs permissions reelles.
export default function SectionUtilisateurs({ roles }) {
  const [utilisateurs, setUtilisateurs] = useState(null);
  const [erreur, setErreur] = useState("");
  const [recherche, setRecherche] = useState("");
  const [filtreRole, setFiltreRole] = useState("tous");
  const [roleOuvert, setRoleOuvert] = useState(null);

  useEffect(() => {
    api.get("/utilisateurs")
      .then((res) => setUtilisateurs(res.data))
      .catch(() => setErreur("Impossible de charger les utilisateurs."));
  }, []);

  const q = recherche.trim().toLowerCase();
  const affiches = (utilisateurs || []).filter(
    (u) => (!q || `${u.name} ${u.email} ${u.telephone || ""}`.toLowerCase().includes(q)) && (filtreRole === "tous" || u.roles.includes(filtreRole))
  );

  return (
    <div className="space-y-6">
      <Carte icone={Users} titre="Utilisateurs de l'établissement" description={utilisateurs ? `${utilisateurs.length} compte${utilisateurs.length > 1 ? "s" : ""} ayant accès à LAKOLI` : "Chargement..."}>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher par nom, e-mail..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Rôle :</span>
            {["tous", ...roles.map((r) => r.nom)].map((r) => (
              <button
                key={r}
                onClick={() => setFiltreRole(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${filtreRole === r ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                {r === "tous" ? "Tous" : libelleRole(r)}
              </button>
            ))}
          </div>
        </div>

        {erreur && <p className="mt-4 text-xs text-rose-600">{erreur}</p>}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3">Collaborateur</th>
                <th className="py-3 px-3">Rôle</th>
                <th className="py-3 px-3">Téléphone</th>
                <th className="py-3 px-3">Dernière activité</th>
                <th className="py-3 px-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {utilisateurs === null && !erreur ? (
                <tr><td colSpan={5} className="py-8 text-center text-slate-400">Chargement...</td></tr>
              ) : affiches.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-slate-400">Aucun utilisateur ne correspond à ces critères.</td></tr>
              ) : (
                affiches.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        <AvatarUtilisateur nom={u.name} photoUrl={u.photo_url} className="w-9 h-9 rounded-xl text-xs" classeFond={COULEURS_AVATAR[u.id % COULEURS_AVATAR.length]} />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-sm truncate">{u.name}</p>
                          <p className="text-slate-400 text-[11px] truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.length === 0 ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          u.roles.map((r) => (
                            <span key={r} className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold border ${STYLES_ROLES[String(r).toUpperCase()] || "bg-slate-50 text-slate-700 border-slate-200"}`}>{libelleRole(r)}</span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                      {u.telephone ? <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" />{u.telephone}</span> : "—"}
                    </td>
                    <td className="py-3.5 px-3 text-slate-500 font-medium whitespace-nowrap">{momentRelatif(u.derniere_activite)}</td>
                    <td className="py-3.5 px-3">
                      {u.statut === "suspendu" ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200"><Ban className="w-3 h-3" />Suspendu</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Actif</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Carte>

      <Carte icone={ShieldCheck} titre="Rôles et permissions" description="Droits d'accès réellement accordés à chaque rôle de l'établissement">
        <div className="space-y-3">
          {roles.map((role) => {
            const ouvert = roleOuvert === role.id;
            const parModule = role.permissions.reduce((acc, p) => {
              (acc[p.module] ||= []).push(p);
              return acc;
            }, {});
            return (
              <div key={role.id} className="border border-slate-200/80 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setRoleOuvert(ouvert ? null : role.id)}
                  className="w-full px-4 py-3.5 bg-slate-50/70 hover:bg-slate-100/70 flex items-center justify-between gap-4 text-left transition cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${STYLES_ROLES[role.nom.toUpperCase()] || "bg-slate-50 text-slate-700 border-slate-200"}`}>{libelleRole(role.nom)}</span>
                    <span className="text-xs text-slate-500 hidden sm:inline">
                      {role.utilisateurs} utilisateur{role.utilisateurs > 1 ? "s" : ""} · {role.permissions.length} permission{role.permissions.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <span className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                    <span className="hidden md:inline">{ouvert ? "Masquer" : "Voir les permissions"}</span>
                    {ouvert ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                  </span>
                </button>
                {ouvert && (
                  <div className="p-5 bg-white border-t border-slate-100 space-y-4">
                    {role.permissions.length === 0 && <p className="text-xs text-slate-400 italic">Aucune permission accordée à ce rôle.</p>}
                    {Object.entries(parModule).map(([module, permissions]) => (
                      <div key={module} className="space-y-2">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{MODULES[module] || module}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {permissions.map((p) => (
                            <div key={p.nom} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                              <span className="mt-0.5 w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800">{p.description || p.nom}</p>
                                <p className="text-[11px] text-slate-400 font-mono mt-0.5">{p.nom}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Carte>
    </div>
  );
}
