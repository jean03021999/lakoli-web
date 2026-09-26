import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import {
  GraduationCap,
  Users,
  BookOpen,
  Link2,
  Calendar,
  Award,
  FileSpreadsheet,
  Wallet,
  LayoutDashboard,
  ClipboardCheck,
  Settings,
  LogOut,
  School,
  Clock,
  CreditCard,
  UserCog,
  Sparkles,
  Menu,
  Bell,
  ChevronDown,
  X,
  DollarSign,
  Building,
  Calendar as CalendarIcon,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

const COULEURS = {
  navy: "#0C447C",
  navyClair: "#EFF6FF",
  vert: "#059669",
  vertClair: "#D1FAE5",
  rouge: "#DC2626",
  rougeClair: "#FEE2E2",
  gris: "#6B7280",
  grisClair: "#F3F4F6",
  fond: "#F8FAFC",
  texte: "#1F2937",
};

// Visibilite pilotee par les permissions reelles de l'utilisateur (GET /user) :
// permission null = toujours visible, sinon visible seulement si l'utilisateur la possede.
const MODULES = [
  { nom: "Tableau de bord", icone: LayoutDashboard, chemin: "/tableau-de-bord", permission: null },
  { nom: "Gestion des Élèves", icone: GraduationCap, chemin: "/eleves", permission: "eleves.voir" },
  { nom: "Gestion des Enseignants", icone: Users, chemin: "/enseignants", permission: "enseignants.voir" },
  { nom: "Gestion des Classes", icone: School, chemin: "/classes", permission: "classes.gerer" },
  { nom: "Gestion des Matières", icone: BookOpen, chemin: "/matieres", permission: "matieres.gerer" },
  { nom: "Affectations", icone: Link2, chemin: "/affectations", permission: "affectations.gerer" },
  { nom: "Emploi du Temps", icone: Calendar, chemin: "/emploi-du-temps", permission: "emploi_du_temps.voir" },
  { nom: "Gestion des Notes", icone: Award, chemin: "/notes", permission: "notes.voir" },
  { nom: "Bulletins", icone: FileSpreadsheet, chemin: "/bulletins", permission: "bulletins.voir" },
  { nom: "Frais de Scolarité", icone: Wallet, chemin: "/frais-scolarite", permission: "frais.voir" },
  { nom: "Gestion des Salaires", icone: DollarSign, chemin: "/salaires", permission: "enseignants.salaires.voir" },
  { nom: "Journal de Caisse", icone: CreditCard, chemin: "/paiements", permission: "frais.voir" },
  { nom: "Périodes Scolaires", icone: Clock, chemin: "/periodes", permission: "periodes.gerer" },
  // Pas de permission dediee cote backend pour les utilisateurs : on garde la liste de roles.
  { nom: "Utilisateurs", icone: UserCog, chemin: "/utilisateurs", roles: ["DIRECTEUR", "FONDATEUR", "PROVISEUR", "CENSEUR"] },
  { nom: "Abonnement", icone: Sparkles, chemin: "/abonnement", permission: "abonnement.voir" },
];

function moduleVisible(module, permissions, role) {
  if (module.roles) return module.roles.includes(role);
  return module.permission === null || permissions.includes(module.permission);
}

const LABELS_ROLES = {
  COMPTABLE: "Comptable",
  DIRECTEUR: "Directeur",
  FONDATEUR: "Fondateur",
  PROVISEUR: "Proviseur",
  CENSEUR: "Censeur",
};

export { COULEURS };

function initiales(nom) {
  if (!nom) return "U";
  return nom
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}

// Contenu de la barre laterale (design Google AI Studio), commun au bureau et au tiroir mobile :
// logo + drapeau guineen, etablissement/session reels, modules visibles selon les permissions,
// carte utilisateur et deconnexion.
function ContenuSidebar({ modules, estActif, onNaviguer, etablissement, session, nomUtilisateur, libelleRole, enLigne, onDeconnexion }) {
  return (
    <div className="h-full flex flex-col">
      {/* Logo LAKOLI + mini drapeau guineen */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4 shrink-0">
        <span className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
          <GraduationCap className="h-5 w-5 text-white" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold tracking-[2px] text-white leading-none">LAKOLI</span>
            <span className="flex h-3 w-[18px] rounded-[2px] overflow-hidden ring-1 ring-white/30 shrink-0" title="Guinée">
              <span className="flex-1" style={{ backgroundColor: "#CE1126" }} />
              <span className="flex-1" style={{ backgroundColor: "#FCD116" }} />
              <span className="flex-1" style={{ backgroundColor: "#009460" }} />
            </span>
          </div>
          <p className="text-[10px] text-white/60 mt-1">Gestion scolaire · Guinée</p>
        </div>
      </div>

      {/* Etablissement et session active */}
      {(etablissement?.nom || session) && (
        <div className="mx-3 mb-3 px-3 py-2.5 rounded-xl bg-white/10 border border-white/10 shrink-0">
          {etablissement?.nom && (
            <p className="flex items-center gap-1.5 text-xs font-semibold text-white truncate">
              <Building className="h-3.5 w-3.5 text-white/70 shrink-0" />
              <span className="truncate">{etablissement.nom}</span>
            </p>
          )}
          {(etablissement?.ville || session) && (
            <p className="mt-1 text-[11px] text-white/60 truncate">
              {[etablissement?.ville, session && `Session ${session}`].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-1">
        {modules.map((m) => {
          const actif = estActif(m.chemin);
          return (
            <button
              key={m.chemin}
              onClick={() => onNaviguer(m.chemin)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                actif ? "bg-white text-[#0C447C] shadow-sm" : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              <m.icone className="h-4 w-4 shrink-0" />
              <span className="truncate">{m.nom}</span>
            </button>
          );
        })}
      </nav>

      {/* Carte utilisateur + deconnexion */}
      <div className="p-3 border-t border-white/10 space-y-2 shrink-0">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-white/10">
          <span className="relative shrink-0">
            <span
              className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)" }}
            >
              {initiales(nomUtilisateur)}
            </span>
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-[#0b3a6b] ${enLigne ? "bg-emerald-400" : "bg-slate-400"}`}
              title={enLigne ? "En ligne" : "Hors ligne"}
            />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{nomUtilisateur}</p>
            <p className="text-[11px] text-white/60 truncate">{libelleRole}</p>
          </div>
        </div>
        <button
          onClick={onDeconnexion}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </div>
    </div>
  );
}

export default function Layout({ children, role, permissions = [], etablissement = null, session = null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuCompteOuvert, setMenuCompteOuvert] = useState(false);
  const [menuMobileOuvert, setMenuMobileOuvert] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [menuNotificationsOuvert, setMenuNotificationsOuvert] = useState(false);
  const [enLigne, setEnLigne] = useState(typeof navigator === "undefined" ? true : navigator.onLine);

  const modulesVisibles = MODULES.filter((m) => moduleVisible(m, permissions, role));
  const peutVoirEleves = permissions.includes("eleves.voir");
  const peutVoirNotes = permissions.includes("notes.voir");

  // Notifications réelles : élèves en retard (eleves.voir) + évaluations soumises en attente
  // de validation (notes.voir), chacune seulement si l'utilisateur a la permission.
  useEffect(() => {
    async function chargerNotifications() {
      const [eleves, evaluations] = await Promise.allSettled([
        peutVoirEleves ? api.get("/eleves") : Promise.reject(),
        peutVoirNotes ? api.get("/evaluations", { params: { vue: "direction" } }) : Promise.reject(),
      ]);

      const liste = [];
      const nbRetard = eleves.status === "fulfilled" ? eleves.value.data.stats.en_retard || 0 : 0;
      if (nbRetard > 0) {
        liste.push({
          id: "retards",
          icone: AlertTriangle,
          couleur: "bg-rose-50 text-rose-600",
          titre: `${nbRetard} élève${nbRetard > 1 ? "s" : ""} en retard de paiement`,
          detail: "Échéance de scolarité dépassée, à relancer.",
          chemin: "/eleves",
        });
      }
      const nbSoumises = evaluations.status === "fulfilled"
        ? evaluations.value.data.filter((ev) => ev.statut === "soumis").length
        : 0;
      if (nbSoumises > 0) {
        liste.push({
          id: "evaluations",
          icone: ClipboardCheck,
          couleur: "bg-blue-50 text-blue-600",
          titre: `${nbSoumises} évaluation${nbSoumises > 1 ? "s" : ""} à valider`,
          detail: "Notes soumises par les enseignants.",
          chemin: "/notes",
        });
      }
      setNotifications(liste);
    }
    if (role) chargerNotifications();
  }, [role, peutVoirEleves, peutVoirNotes]);

  // Etat reel de la connexion : le badge "synchronise" ne doit pas s'afficher hors ligne.
  useEffect(() => {
    const maj = () => setEnLigne(navigator.onLine);
    window.addEventListener("online", maj);
    window.addEventListener("offline", maj);
    return () => {
      window.removeEventListener("online", maj);
      window.removeEventListener("offline", maj);
    };
  }, []);

  const nbNotifications = notifications.length;
  const libelleEtablissement = [etablissement?.nom, etablissement?.ville].filter(Boolean).join(" · ");

  const allerA = (chemin) => {
    setMenuMobileOuvert(false);
    navigate(chemin);
  };

  const estActif = (chemin) => {
    if (chemin === "/tableau-de-bord") {
      return location.pathname === "/tableau-de-bord" || location.pathname === "/";
    }
    return location.pathname.startsWith(chemin);
  };

  const handleDeconnexion = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("device_token");
    navigate("/");
  };

  const nomUtilisateur = localStorage.getItem("user_name") || "Utilisateur";

  return (
    <div className="h-screen overflow-hidden bg-[#F8FAFC] text-slate-800 flex flex-col font-sans selection:bg-[#0C447C] selection:text-white">
      {/* En-tête */}
      <header
        className="sticky top-0 shrink-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/70"
        style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.04)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 h-16">
            {/* Icône menu hamburger (mobile : ouvre le menu complet) */}
            <button
              onClick={() => setMenuMobileOuvert(true)}
              className="md:hidden p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              title="Menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Logo LAKOLI (retour au tableau de bord) */}
            <button
              onClick={() => navigate("/tableau-de-bord")}
              className="md:hidden flex items-center gap-2.5 cursor-pointer select-none shrink-0"
              title="Tableau de bord"
            >
              <span
                className="h-9 w-9 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #0C447C 0%, #1a6bb5 100%)", boxShadow: "0 4px 14px rgba(12,68,124,0.3)" }}
              >
                <GraduationCap className="h-5 w-5 text-white" />
              </span>
              <span className="hidden lg:inline text-base font-bold tracking-[2px] text-[#0C447C]">LAKOLI</span>
            </button>

            {/* Etablissement et session active (GET /user) */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {libelleEtablissement && (
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold min-w-0">
                  <Building className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{libelleEtablissement}</span>
                </span>
              )}
              {session && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold whitespace-nowrap border border-blue-100">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {session}
                </span>
              )}
            </div>

            {/* Outils de droite */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <span
                className={`hidden xl:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                  enLigne ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"
                }`}
              >
                <span className="relative flex h-2 w-2">
                  {enLigne && <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />}
                  <span className={`relative inline-flex h-2 w-2 rounded-full ${enLigne ? "bg-emerald-500" : "bg-rose-500"}`} />
                </span>
                {enLigne ? "Serveur Caisse Synchronisé" : "Hors ligne"}
              </span>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setMenuNotificationsOuvert((v) => !v)}
                  className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                  title={nbNotifications > 0 ? `${nbNotifications} notification(s)` : "Aucune notification"}
                >
                  <Bell className="h-5 w-5" />
                  {nbNotifications > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                      {nbNotifications}
                    </span>
                  )}
                </button>

                {menuNotificationsOuvert && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuNotificationsOuvert(false)} />
                    <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-900">Notifications</p>
                        <span className="text-[11px] font-semibold text-slate-400">{nbNotifications} en attente</span>
                      </div>
                      {notifications.length === 0 ? (
                        <p className="px-4 py-6 text-center text-xs text-slate-400">Aucune notification pour le moment.</p>
                      ) : (
                        notifications.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => {
                              setMenuNotificationsOuvert(false);
                              navigate(n.chemin);
                            }}
                            className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <span className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${n.couleur}`}>
                              <n.icone className="h-4 w-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold text-slate-900">{n.titre}</span>
                              <span className="block text-xs text-slate-500">{n.detail}</span>
                            </span>
                            <ArrowRight className="h-4 w-4 text-slate-300 mt-1 shrink-0" />
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Compte utilisateur */}
              <div className="relative">
                <button
                  onClick={() => setMenuCompteOuvert((v) => !v)}
                  className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <div
                    className="h-9 w-9 rounded-full text-white flex items-center justify-center font-bold text-xs shrink-0"
                    style={{ background: "linear-gradient(135deg, #0C447C 0%, #1a6bb5 100%)" }}
                  >
                    {initiales(nomUtilisateur)}
                  </div>
                  <div className="hidden sm:block text-left leading-tight">
                    <p className="text-sm font-semibold text-slate-900">{nomUtilisateur}</p>
                    <p className="text-[11px] text-slate-500">{LABELS_ROLES[role] || role}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-400 hidden sm:block" />
                </button>

                {menuCompteOuvert && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuCompteOuvert(false)} />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-lg z-50 overflow-hidden py-1">
                      <button
                        onClick={() => {
                          setMenuCompteOuvert(false);
                          navigate("/parametres");
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <Settings className="h-4 w-4 text-slate-400" />
                        Paramètres
                      </button>
                      <button
                        onClick={handleDeconnexion}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <LogOut className="h-4 w-4" />
                        Déconnexion
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 w-full max-w-7xl mx-auto">
        {/* Sidebar (fixe, ne défile pas) */}
        <aside
          className="w-60 shrink-0 hidden md:block h-full"
          style={{ background: "linear-gradient(180deg, #0C447C 0%, #0a2d5a 100%)" }}
        >
          <ContenuSidebar
            modules={modulesVisibles}
            estActif={estActif}
            etablissement={etablissement}
            session={session}
            nomUtilisateur={nomUtilisateur}
            libelleRole={LABELS_ROLES[role] || role}
            enLigne={enLigne}
            onDeconnexion={handleDeconnexion}
            onNaviguer={navigate}
          />
        </aside>

        {/* Contenu principal (seule zone qui défile) */}
        <main className="flex-1 h-full overflow-y-auto overflow-x-hidden min-w-0 px-4 sm:px-6 md:px-8 py-6 space-y-6">
          {children}
        </main>
      </div>

      {/* Navigation mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0C447C] border-t border-[#0a3663] flex justify-around items-center h-16 px-1 shadow-lg">
        {modulesVisibles.slice(0, 5).map((m) => {
          const active = estActif(m.chemin);
          return (
            <button
              key={m.chemin}
              onClick={() => navigate(m.chemin)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
                active ? "text-white font-bold" : "text-white/50"
              }`}
            >
              <m.icone className="h-4 w-4" />
              <span className="text-[9px] mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[60px]">
                {m.nom}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Menu mobile complet (tiroir ouvert via le hamburger du header) */}
      {menuMobileOuvert && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setMenuMobileOuvert(false)}
          />
          <div
            className="absolute inset-y-0 left-0 w-72 max-w-[80%] shadow-2xl"
            style={{ background: "linear-gradient(180deg, #0C447C 0%, #0a2d5a 100%)" }}
          >
            <button
              onClick={() => setMenuMobileOuvert(false)}
              className="absolute top-4 right-3 z-10 p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Fermer le menu"
            >
              <X className="h-5 w-5" />
            </button>
            <ContenuSidebar
              modules={modulesVisibles}
              estActif={estActif}
              etablissement={etablissement}
              session={session}
              nomUtilisateur={nomUtilisateur}
              libelleRole={LABELS_ROLES[role] || role}
              enLigne={enLigne}
              onDeconnexion={handleDeconnexion}
              onNaviguer={allerA}
            />
          </div>
        </div>
      )}

    </div>
  );
}
