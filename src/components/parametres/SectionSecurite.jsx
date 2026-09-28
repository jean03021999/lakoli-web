import { useState } from "react";
import { Lock, KeyRound, ShieldCheck, Smartphone, Laptop, LogOut, Eye, EyeOff, MonitorSmartphone, Trash2 } from "lucide-react";
import api from "../../services/api";
import { Carte, Champ } from "./ui";
import { CHAMP, BLEU, decrireAppareil, momentRelatif, dateLongue, messageErreur } from "./outils";

function ChampSecret({ valeur, onChange, placeholder, autoComplete }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input type={visible ? "text" : "password"} value={valeur} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete} className={`${CHAMP} pr-11`} />
      <button type="button" onClick={() => setVisible((v) => !v)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer" aria-label={visible ? "Masquer" : "Afficher"}>
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function SectionSecurite({ securite, email, onMaj, onToast }) {
  const [actuel, setActuel] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const criteres = [
    { ok: nouveau.length >= 8, libelle: "8 caractères min." },
    { ok: /[A-Z]/.test(nouveau), libelle: "1 lettre majuscule" },
    { ok: /[0-9]/.test(nouveau), libelle: "1 chiffre (0-9)" },
    { ok: /[^A-Za-z0-9]/.test(nouveau), libelle: "1 symbole spécial" },
  ];
  const score = criteres.filter((c) => c.ok).length;
  const force = score <= 2 ? { libelle: "Faible", barre: "bg-rose-500", texte: "text-rose-600", largeur: "33%" } : score === 3 ? { libelle: "Moyen", barre: "bg-amber-500", texte: "text-amber-600", largeur: "66%" } : { libelle: "Fort", barre: "bg-emerald-500", texte: "text-emerald-600", largeur: "100%" };

  const changerMotDePasse = async () => {
    if (!actuel) return onToast("Mot de passe actuel requis", "Saisissez votre mot de passe actuel.", "warning");
    if (nouveau !== confirmation) return onToast("Confirmation différente", "Les deux nouveaux mots de passe ne correspondent pas.", "warning");
    if (!criteres[0].ok || score < 3) return onToast("Mot de passe trop faible", "Respectez au moins 8 caractères et 3 critères de sécurité.", "warning");
    setEnvoi(true);
    try {
      await api.put("/parametres/mot-de-passe", { mot_de_passe_actuel: actuel, nouveau_mot_de_passe: nouveau, nouveau_mot_de_passe_confirmation: confirmation });
      setActuel("");
      setNouveau("");
      setConfirmation("");
      const res = await api.get("/parametres");
      onMaj(res.data.securite);
      onToast("Mot de passe mis à jour", "Vos autres connexions ouvertes ont été fermées par sécurité.");
    } catch (err) {
      onToast("Changement refusé", messageErreur(err, "Erreur lors du changement de mot de passe."), "warning");
    } finally {
      setEnvoi(false);
    }
  };

  const action = async (requete, titre, message, confirmationTexte) => {
    if (confirmationTexte && !window.confirm(confirmationTexte)) return;
    try {
      const res = await requete();
      onMaj(res.data);
      onToast(titre, message, "info");
    } catch (err) {
      onToast("Action impossible", messageErreur(err, "Erreur inattendue."), "warning");
    }
  };

  const autres = securite.connexions.filter((c) => !c.courante);
  const nonAffichees = securite.total_connexions - securite.connexions.length;

  return (
    <div className="space-y-6">
      <Carte icone={KeyRound} titre="Changer le mot de passe" description="Protégez l'accès aux données des élèves et de la caisse">
        <div className="space-y-5 max-w-xl">
          <Champ libelle="Mot de passe actuel" requis>
            <ChampSecret valeur={actuel} onChange={setActuel} placeholder="••••••••••••" autoComplete="current-password" />
          </Champ>
          <Champ libelle="Nouveau mot de passe" requis>
            <ChampSecret valeur={nouveau} onChange={setNouveau} placeholder="Minimum 8 caractères" autoComplete="new-password" />
            {nouveau && (
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Force du mot de passe :</span>
                  <span className={`font-bold ${force.texte}`}>{force.libelle}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className={`h-full transition-all duration-300 rounded-full ${force.barre}`} style={{ width: force.largeur }} />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 mt-3">
              {criteres.map((c) => (
                <div key={c.libelle} className={`flex items-center gap-1.5 text-xs ${c.ok ? "text-emerald-600 font-semibold" : "text-slate-400"}`}>
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${c.ok ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>{c.ok ? "✓" : "•"}</span>
                  {c.libelle}
                </div>
              ))}
            </div>
          </Champ>
          <Champ libelle="Confirmer le nouveau mot de passe" requis>
            <input type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} placeholder="Répétez le mot de passe" autoComplete="new-password" className={CHAMP} />
          </Champ>
          <div className="pt-2">
            <button
              type="button"
              onClick={changerMotDePasse}
              disabled={envoi}
              style={{ backgroundColor: BLEU }}
              className="px-5 py-2.5 rounded-xl text-white text-xs font-bold hover:brightness-110 shadow-sm transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {envoi ? "Mise à jour..." : "Mettre à jour le mot de passe"}
            </button>
          </div>
        </div>
      </Carte>

      <Carte icone={ShieldCheck} titre="Double authentification" description="Vérification par code envoyé par e-mail">
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
            <div>
              <p className="text-sm font-bold text-slate-900">Code de vérification à la connexion</p>
              <p className="text-xs text-slate-600 mt-0.5">
                Chaque connexion depuis un nouvel appareil demande un code à 6 chiffres envoyé à <strong>{email}</strong>.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Toujours active
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Appareils de confiance ({securite.appareils.length})</h3>
                <p className="text-[11px] text-slate-500">Appareils dispensés du code pendant un an. Retirez ceux que vous n'utilisez plus.</p>
              </div>
              {securite.appareils.length > 1 && (
                <button
                  type="button"
                  onClick={() => action(() => api.delete("/parametres/appareils"), "Appareils oubliés", "Le code sera redemandé sur tous vos appareils.", "Retirer tous les appareils de confiance ?")}
                  className="text-xs font-bold text-rose-600 hover:underline shrink-0 cursor-pointer"
                >
                  Tout retirer
                </button>
              )}
            </div>
            {securite.appareils.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-3">Aucun appareil de confiance : le code est demandé à chaque connexion.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {securite.appareils.map((a) => {
                  const app = decrireAppareil(a.nom);
                  const Icone = app.mobile ? Smartphone : Laptop;
                  return (
                    <div key={a.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2.5 rounded-xl bg-slate-100 shrink-0"><Icone className="w-5 h-5 text-slate-700" /></div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900">{app.navigateur} · {app.systeme}</p>
                          <p className="text-slate-500 mt-0.5">Ajouté {momentRelatif(a.ajoute_le).toLowerCase()} · valable jusqu'au {dateLongue(a.expire_le)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => action(() => api.delete(`/parametres/appareils/${a.id}`), "Appareil retiré", "Le code sera redemandé sur cet appareil.")}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg shrink-0 cursor-pointer"
                        title="Retirer cet appareil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Carte>

      <Carte
        icone={Lock}
        titre="Connexions ouvertes"
        description={`${securite.total_connexions} session${securite.total_connexions > 1 ? "s" : ""} ouverte${securite.total_connexions > 1 ? "s" : ""} sur votre compte`}
        action={
          autres.length > 0 && (
            <button
              type="button"
              onClick={() => action(() => api.delete("/parametres/connexions/autres"), "Sessions fermées", "Toutes vos autres connexions ont été déconnectées.", "Déconnecter toutes les autres sessions ?")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition shrink-0 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Déconnecter toutes les autres
            </button>
          )
        }
      >
        <div className="divide-y divide-slate-100">
          {securite.connexions.map((c) => (
            <div key={c.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-slate-100"><MonitorSmartphone className="w-5 h-5 text-slate-700" /></div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">Session n° {c.id}</p>
                    {c.courante && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Session actuelle
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 mt-0.5">Ouverte {momentRelatif(c.ouverte_le).toLowerCase()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 pl-12 sm:pl-0">
                <span className="text-slate-500"><span className="text-slate-400">Activité : </span><span className="text-slate-700 font-semibold">{momentRelatif(c.derniere_activite)}</span></span>
                {!c.courante && (
                  <button
                    type="button"
                    onClick={() => action(() => api.delete(`/parametres/connexions/${c.id}`), "Session fermée", `La session n° ${c.id} est déconnectée.`)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                    title="Déconnecter cette session"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {nonAffichees > 0 && <p className="pt-3 text-[11px] text-slate-400">… et {nonAffichees} session{nonAffichees > 1 ? "s" : ""} plus ancienne{nonAffichees > 1 ? "s" : ""}, fermée{nonAffichees > 1 ? "s" : ""} aussi par « Déconnecter toutes les autres ».</p>}
        </div>
      </Carte>
    </div>
  );
}
