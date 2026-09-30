import { useState } from "react";
import { X, Save, Loader2, Copy, Check, KeyRound } from "lucide-react";
import api from "../../services/api";
import { CHAMP, LIBELLES_ROLES, messageErreur } from "./outils";

// Fenetres de gestion des comptes (direction) : creation / modification, et affichage du mot de
// passe provisoire a transmettre a l'utilisateur.

export function ModaleUtilisateur({ utilisateur, roles, onFermer, onEnregistre }) {
  const modification = Boolean(utilisateur);
  const [form, setForm] = useState({
    name: utilisateur?.name || "",
    email: utilisateur?.email || "",
    telephone: utilisateur?.telephone || "",
    role_id: utilisateur?.role_id ? String(utilisateur.role_id) : roles[0] ? String(roles[0].id) : "",
  });
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const maj = (champ, v) => setForm((f) => ({ ...f, [champ]: v }));

  const enregistrer = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    setErreur("");
    try {
      const donnees = { ...form, telephone: form.telephone.trim() || null, role_id: Number(form.role_id) };
      const res = modification ? await api.put(`/utilisateurs/${utilisateur.id}`, donnees) : await api.post("/utilisateurs", donnees);
      onEnregistre(res.data);
    } catch (err) {
      setErreur(messageErreur(err, "Erreur lors de l'enregistrement."));
      setEnvoi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-4" onClick={() => !envoi && onFermer()}>
      <form onSubmit={enregistrer} className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">{modification ? "Modifier le compte" : "Ajouter un utilisateur"}</h3>
            <p className="text-xs text-slate-500">{modification ? utilisateur.email : "Un mot de passe provisoire sera généré"}</p>
          </div>
          <button type="button" onClick={onFermer} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer" aria-label="Fermer"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Nom complet *</label>
            <input value={form.name} onChange={(e) => maj("name", e.target.value)} required className={CHAMP} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Adresse e-mail (identifiant) *</label>
            <input type="email" value={form.email} onChange={(e) => maj("email", e.target.value)} required className={CHAMP} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Téléphone</label>
            <input type="tel" value={form.telephone} onChange={(e) => maj("telephone", e.target.value)} placeholder="+224 6XX XX XX XX" className={CHAMP} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Rôle *</label>
            <select value={form.role_id} onChange={(e) => maj("role_id", e.target.value)} required className={CHAMP}>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{LIBELLES_ROLES[String(r.nom).toUpperCase()] || r.nom}</option>
              ))}
            </select>
          </div>
          {erreur && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">{erreur}</div>}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button type="button" onClick={onFermer} disabled={envoi} className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">Annuler</button>
          <button type="submit" disabled={envoi} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0C447C] hover:bg-[#093663] text-white text-xs font-bold disabled:opacity-50 cursor-pointer">
            {envoi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {modification ? "Enregistrer" : "Créer le compte"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function ModaleMotDePasse({ nom, email, motDePasse, onFermer }) {
  const [copie, setCopie] = useState(false);
  const copier = async () => {
    try {
      await navigator.clipboard.writeText(motDePasse);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      setCopie(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
        <div className="flex items-start gap-3">
          <span className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"><KeyRound className="w-5 h-5" /></span>
          <div>
            <h3 className="text-base font-bold text-slate-900">Mot de passe provisoire</h3>
            <p className="text-xs text-slate-500">{nom} · {email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
          <span className="flex-1 font-mono text-lg font-bold tracking-wider text-slate-900 select-all">{motDePasse}</span>
          <button onClick={copier} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer">
            {copie ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copie ? "Copié" : "Copier"}
          </button>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Transmettez-le à la personne : elle se connecte avec son e-mail et ce mot de passe, puis le change dans
          <strong> Paramètres → Sécurité</strong>. Il ne sera plus affiché après fermeture de cette fenêtre.
        </p>
        <div className="flex justify-end">
          <button onClick={onFermer} className="px-5 py-2.5 rounded-xl bg-[#0C447C] text-white text-xs font-bold cursor-pointer">J'ai noté le mot de passe</button>
        </div>
      </div>
    </div>
  );
}
