import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Sparkles, ShieldCheck, CheckCircle2, AlertTriangle, Info, X, Loader2 } from "lucide-react";
import api from "../../services/api";
import SectionEtablissement from "../../components/parametres/SectionEtablissement";
import SectionProfil from "../../components/parametres/SectionProfil";
import SectionSecurite from "../../components/parametres/SectionSecurite";
import SectionUtilisateurs from "../../components/parametres/SectionUtilisateurs";
import SectionSessions from "../../components/parametres/SectionSessions";
import SectionAbonnement from "../../components/parametres/SectionAbonnement";
import SectionAlertes from "../../components/parametres/SectionAlertes";
import SectionApparence from "../../components/parametres/SectionApparence";

// Parametres (design "Parametres LAKOLI") sur GET /parametres : etablissement, profil, securite,
// utilisateurs et roles, sessions scolaires, abonnement, alertes et apparence. La section ouverte
// est dans l'URL (?section=...) pour pouvoir y renvoyer depuis le reste de l'application.

const SECTIONS = [
  { id: "etablissement", libelle: "Mon établissement", icone: "🏫" },
  { id: "profil", libelle: "Mon profil", icone: "👤" },
  { id: "securite", libelle: "Sécurité", icone: "🔒" },
  { id: "utilisateurs", libelle: "Utilisateurs & rôles", icone: "👥" },
  { id: "session", libelle: "Session scolaire", icone: "📅" },
  { id: "abonnement", libelle: "Abonnement", icone: "💳" },
  { id: "notifications", libelle: "Notifications", icone: "🔔" },
  { id: "apparence", libelle: "Apparence", icone: "🎨" },
];

const STYLES_TOAST = {
  success: { icone: CheckCircle2, classe: "border-emerald-200 text-emerald-500" },
  warning: { icone: AlertTriangle, classe: "border-amber-200 text-amber-500" },
  info: { icone: Info, classe: "border-blue-200 text-blue-500" },
};

export default function Parametres({ permissions = [], onUtilisateurMaj, onEtablissementMaj, onSessionMaj }) {
  const [parametres, setParametres] = useSearchParams();
  const section = SECTIONS.some((s) => s.id === parametres.get("section")) ? parametres.get("section") : "etablissement";
  const [donnees, setDonnees] = useState(null);
  const [erreur, setErreur] = useState("");
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    api.get("/parametres")
      .then((res) => setDonnees(res.data))
      .catch(() => setErreur("Impossible de charger les paramètres."));
  }, []);

  const toast = (titre, message, type = "success") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((t) => [...t, { id, titre, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  };

  const ouvrir = (id) => {
    setParametres({ section: id }, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const maj = (cle, valeur) => setDonnees((d) => ({ ...d, [cle]: typeof valeur === "function" ? valeur(d[cle]) : valeur }));

  if (erreur) {
    return <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{erreur}</div>;
  }
  if (!donnees) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-sm text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        Chargement des paramètres...
      </div>
    );
  }

  const { etablissement } = donnees;
  const sessionActive = donnees.sessions.find((s) => s.est_active);

  return (
    <div className="space-y-8">
      {/* Banniere */}
      <div style={{ background: "linear-gradient(135deg, #0C447C 0%, #1a6bb5 100%)" }} className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-10 w-48 h-48 bg-sky-400/10 rounded-full blur-xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 min-w-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-2xl sm:text-3xl shrink-0 overflow-hidden">
              {etablissement.logo_url ? <img src={etablissement.logo_url} alt="" className="w-full h-full object-contain bg-white" /> : "⚙️"}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 border border-white/25">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  LAKOLI
                </span>
                <span className="text-xs text-white/80 font-medium truncate">• {etablissement.nom}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Paramètres</h1>
              <p className="text-sm sm:text-base text-white/70 mt-0.5">Configurez votre établissement et votre compte</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 border border-white/15 rounded-xl px-3.5 py-2 flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                {sessionActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${sessionActive ? "bg-emerald-400" : "bg-slate-300"}`} />
              </span>
              <div>
                <p className="text-[10px] uppercase font-bold text-white/60 tracking-wider">Session active</p>
                <p className="text-xs font-semibold">{sessionActive?.libelle || "Aucune"}</p>
              </div>
            </div>
            <div className="bg-white/10 border border-white/15 rounded-xl px-3.5 py-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <div>
                <p className="text-[10px] uppercase font-bold text-white/60 tracking-wider">{etablissement.agrement ? "Agrément" : "Code établissement"}</p>
                <p className="text-xs font-semibold font-mono">{etablissement.agrement || etablissement.code}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Navigation des sections */}
        <aside className="w-full lg:w-64 xl:w-72 shrink-0 lg:sticky lg:top-0">
          <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-100/80 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Navigation des paramètres</p>
            </div>
            <nav className="p-2 space-y-1 flex lg:block overflow-x-auto gap-1">
              {SECTIONS.map((s) => {
                const actif = section === s.id;
                const badge = s.id === "abonnement" && etablissement.statut !== "actif" ? { texte: etablissement.statut === "essai" ? "Essai" : "Suspendu", danger: etablissement.statut === "suspendu" } : null;
                return (
                  <button
                    key={s.id}
                    onClick={() => ouvrir(s.id)}
                    className={`shrink-0 lg:w-full flex items-center justify-between gap-2 px-3.5 py-3 rounded-xl text-left text-sm transition-all border-l-[3px] cursor-pointer whitespace-nowrap ${
                      actif ? "bg-[#eff6ff] font-semibold text-[#0C447C] border-[#0C447C] shadow-sm" : "text-[#475569] font-medium hover:bg-[#f8fafc] hover:text-slate-900 border-transparent"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-lg leading-none">{s.icone}</span>
                      {s.libelle}
                    </span>
                    {badge && (
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${badge.danger ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800"}`}>{badge.texte}</span>
                    )}
                  </button>
                );
              })}
            </nav>
            <div className="hidden lg:block p-4 m-3 mt-2 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/50 border border-blue-100/60">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-xs font-semibold text-slate-700">Connecté à {etablissement.nom}</p>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {donnees.peut_administrer ? "Vous pouvez modifier la fiche de l'établissement et les sessions." : "La fiche de l'établissement et les sessions sont gérées par la direction."}
              </p>
            </div>
          </div>
        </aside>

        {/* Section ouverte (cle : etat du formulaire remis a zero apres une mise a jour externe) */}
        <div className="flex-1 w-full min-w-0">
          {section === "etablissement" && (
            <SectionEtablissement
              etablissement={etablissement}
              effectif={donnees.consommation.eleves}
              peutAdministrer={donnees.peut_administrer}
              onToast={toast}
              onMaj={(e) => {
                maj("etablissement", e);
                onEtablissementMaj?.(e);
              }}
            />
          )}
          {section === "profil" && (
            <SectionProfil
              profil={donnees.profil}
              onToast={toast}
              onMaj={(p) => {
                maj("profil", (actuel) => ({ ...actuel, ...p }));
                onUtilisateurMaj?.(p);
              }}
            />
          )}
          {section === "securite" && <SectionSecurite securite={donnees.securite} email={donnees.profil.email} onToast={toast} onMaj={(s) => maj("securite", s)} />}
          {section === "utilisateurs" && <SectionUtilisateurs roles={donnees.roles} />}
          {section === "session" && (
            <SectionSessions
              sessions={donnees.sessions}
              peutAdministrer={donnees.peut_administrer}
              onToast={toast}
              onMaj={(sessions, nouvelleActive) => {
                maj("sessions", sessions);
                if (nouvelleActive) onSessionMaj?.(nouvelleActive);
              }}
            />
          )}
          {section === "abonnement" && <SectionAbonnement etablissement={etablissement} consommation={donnees.consommation} />}
          {section === "notifications" && <SectionAlertes permissions={permissions} onToast={toast} />}
          {section === "apparence" && <SectionApparence onToast={toast} />}
        </div>
      </div>

      {/* Notifications de la page */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-[calc(100%-3rem)] pointer-events-none">
          {toasts.map((t) => {
            const style = STYLES_TOAST[t.type] || STYLES_TOAST.success;
            return (
              <div key={t.id} className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border bg-white shadow-xl animate-dropdown ${style.classe}`}>
                <style.icone className="w-5 h-5 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-slate-800">{t.titre}</h4>
                  {t.message && <p className="text-xs text-slate-600 mt-0.5">{t.message}</p>}
                </div>
                <button onClick={() => setToasts((l) => l.filter((x) => x.id !== t.id))} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer" aria-label="Fermer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
