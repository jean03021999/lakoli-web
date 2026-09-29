import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import EnTete from "./EnTete";
import AvatarUtilisateur from "./AvatarUtilisateur";
import { lireApparence, cssFond, chargerPolice, POLICES, EVENEMENT_APPARENCE, lireAlertes, EVENEMENT_ALERTES } from "./parametres/outils";
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
  LogOut,
  School,
  Clock,
  CreditCard,
  UserCog,
  Sparkles,
  X,
  DollarSign,
  Building,
  AlertTriangle,
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


// Contenu de la barre laterale (design Google AI Studio), commun au bureau et au tiroir mobile :
// logo + drapeau guineen, etablissement/session reels, modules visibles selon les permissions,
// carte utilisateur et deconnexion.
// Fond de la barre laterale (bureau et tiroir mobile).
const FOND_SIDEBAR = { background: "linear-gradient(180deg, #0C447C 0%, #0a2d5a 100%)" };

function ContenuSidebar({ modules, estActif, onNaviguer, etablissement, session, nomUtilisateur, photoUtilisateur, libelleRole, enLigne, onDeconnexion }) {
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
            <AvatarUtilisateur nom={nomUtilisateur} photoUrl={photoUtilisateur} className="h-9 w-9 rounded-full text-xs" fond="linear-gradient(135deg, #f59e0b 0%, #f97316 100%)" />
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

export default function Layout({ children, role, permissions = [], etablissement = null, session = null, utilisateur = null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuMobileOuvert, setMenuMobileOuvert] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [eleves, setEleves] = useState([]); // aussi utilises par la recherche de l'en-tete
  const [apparence, setApparence] = useState(lireApparence);
  const [alertes, setAlertes] = useState(lireAlertes);
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
      if (eleves.status === "fulfilled") setEleves(eleves.value.data.eleves || []);
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

  // Preferences de ce navigateur (module Parametres) : fond, police et alertes affichees.
  useEffect(() => {
    const majApparence = () => setApparence(lireApparence());
    const majAlertes = () => setAlertes(lireAlertes());
    window.addEventListener(EVENEMENT_APPARENCE, majApparence);
    window.addEventListener(EVENEMENT_ALERTES, majAlertes);
    return () => {
      window.removeEventListener(EVENEMENT_APPARENCE, majApparence);
      window.removeEventListener(EVENEMENT_ALERTES, majAlertes);
    };
  }, []);

  useEffect(() => {
    chargerPolice(apparence.police);
    document.body.style.fontFamily = POLICES[apparence.police]?.famille || "";
  }, [apparence.police]);

  const notificationsAffichees = notifications.filter((n) => alertes[n.id] !== false);

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

  const nomUtilisateur = utilisateur?.name || localStorage.getItem("user_name") || "Utilisateur";

  return (
    <div className="h-screen overflow-hidden bg-[#F8FAFC] text-slate-800 flex font-sans selection:bg-[#0C447C] selection:text-white">
      <div className="flex flex-1 min-h-0 w-full max-w-7xl mx-auto">
        {/* Sidebar (fixe, pleine hauteur jusqu'au logo, ne défile pas) */}
        <aside
          className="w-60 shrink-0 hidden md:block h-full"
          style={FOND_SIDEBAR}
        >
          <ContenuSidebar
            modules={modulesVisibles}
            estActif={estActif}
            etablissement={etablissement}
            session={session}
            nomUtilisateur={nomUtilisateur}
            photoUtilisateur={utilisateur?.photo_url}
            libelleRole={LABELS_ROLES[role] || role}
            enLigne={enLigne}
            onDeconnexion={handleDeconnexion}
            onNaviguer={navigate}
          />
        </aside>

        <div className="flex-1 min-w-0 h-full flex flex-col">
      <EnTete
        etablissement={etablissement}
        session={session}
        utilisateur={utilisateur}
        libelleRole={LABELS_ROLES[role] || role}
        enLigne={enLigne}
        notifications={notificationsAffichees}
        eleves={eleves}
        modules={modulesVisibles}
        permissions={permissions}
        onMenu={() => setMenuMobileOuvert(true)}
        onNaviguer={navigate}
        onDeconnexion={handleDeconnexion}
      />

        {/* Contenu principal (seule zone qui défile) */}
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden min-w-0 px-4 sm:px-6 md:px-8 py-6 space-y-6" style={{ background: cssFond(apparence) }}>
          {children}
        </main>
        </div>
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
            style={FOND_SIDEBAR}
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
              photoUtilisateur={utilisateur?.photo_url}
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
