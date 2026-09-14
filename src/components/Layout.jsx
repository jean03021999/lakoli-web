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
  Briefcase,
  Building2,
  Crown,
  ShieldCheck,
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
  Shield,
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

const MODULES = [
  { nom: "Tableau de bord", icone: LayoutDashboard, chemin: "/tableau-de-bord", roles: ["COMPTABLE", "DIRECTEUR", "FONDATEUR", "PROVISEUR", "CENSEUR"] },
  { nom: "Gestion des Élèves", icone: GraduationCap, chemin: "/eleves", roles: ["COMPTABLE", "DIRECTEUR", "FONDATEUR"] },
  { nom: "Gestion des Enseignants", icone: Users, chemin: "/enseignants", roles: ["COMPTABLE", "DIRECTEUR", "FONDATEUR", "PROVISEUR", "CENSEUR"] },
  { nom: "Gestion des Classes", icone: School, chemin: "/classes", roles: ["DIRECTEUR", "PROVISEUR", "CENSEUR"] },
  { nom: "Gestion des Matières", icone: BookOpen, chemin: "/matieres", roles: ["COMPTABLE", "DIRECTEUR", "FONDATEUR"] },
  { nom: "Affectations", icone: Link2, chemin: "/affectations", roles: ["COMPTABLE", "DIRECTEUR", "FONDATEUR"] },
  { nom: "Emploi du Temps", icone: Calendar, chemin: "/emploi-du-temps", roles: ["COMPTABLE", "DIRECTEUR", "FONDATEUR", "PROVISEUR", "CENSEUR"] },
  { nom: "Gestion des Notes", icone: Award, chemin: "/notes", roles: ["DIRECTEUR", "PROVISEUR", "CENSEUR"] },
  { nom: "Bulletins", icone: FileSpreadsheet, chemin: "/bulletins", roles: ["DIRECTEUR", "FONDATEUR", "PROVISEUR", "CENSEUR"] },
  { nom: "Frais de Scolarité", icone: Wallet, chemin: "/frais-scolarite", roles: ["COMPTABLE", "DIRECTEUR", "FONDATEUR"] },
  { nom: "Journal de Caisse", icone: CreditCard, chemin: "/paiements", roles: ["COMPTABLE", "PROVISEUR"] },
  { nom: "Périodes Scolaires", icone: Clock, chemin: "/periodes", roles: ["DIRECTEUR", "PROVISEUR", "CENSEUR"] },
  { nom: "Utilisateurs", icone: UserCog, chemin: "/utilisateurs", roles: ["DIRECTEUR", "FONDATEUR", "PROVISEUR", "CENSEUR"] },
  { nom: "Abonnement", icone: Sparkles, chemin: "/abonnement", roles: ["FONDATEUR"] },
];

const ICONES_ROLES = {
  COMPTABLE: Briefcase,
  DIRECTEUR: Building2,
  FONDATEUR: Crown,
  PROVISEUR: ShieldCheck,
  CENSEUR: ClipboardCheck,
};

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

// Rôles ayant la permission notes.voir côté backend (RolePermissionSeeder)
const ROLES_NOTES_VOIR = ["DIRECTEUR", "PROVISEUR", "CENSEUR"];

export default function Layout({ children, role }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuCompteOuvert, setMenuCompteOuvert] = useState(false);
  const [menuMobileOuvert, setMenuMobileOuvert] = useState(false);
  const [nbNotifications, setNbNotifications] = useState(0);

  const modulesVisibles = MODULES.filter((m) => m.roles.includes(role));

  // Notifications réelles : élèves en retard (tous rôles ont eleves.voir) +
  // évaluations soumises en attente de validation (rôles avec notes.voir)
  useEffect(() => {
    async function chargerNotifications() {
      const requetes = [api.get("/eleves")];
      if (ROLES_NOTES_VOIR.includes(role)) {
        requetes.push(api.get("/evaluations", { params: { vue: "direction" } }));
      }
      const resultats = await Promise.allSettled(requetes);

      let total = 0;
      if (resultats[0].status === "fulfilled") {
        total += resultats[0].value.data.stats.en_retard || 0;
      }
      if (resultats[1]?.status === "fulfilled") {
        total += resultats[1].value.data.filter((ev) => ev.statut === "soumis").length;
      }
      setNbNotifications(total);
    }
    if (role) chargerNotifications();
  }, [role]);

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
      <header className="shrink-0 z-40 bg-[#0C447C]" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            {/* Icône menu hamburger (mobile : ouvre le menu complet) */}
            <button
              onClick={() => setMenuMobileOuvert(true)}
              className="md:hidden p-2 -ml-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              title="Menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Logo LAKOLI */}
            <div
              onClick={() => navigate("/tableau-de-bord")}
              className="flex items-center gap-3.5 cursor-pointer select-none shrink-0"
            >
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #0C447C 0%, #1a6bb5 60%, #2980d9 100%)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(12,68,124,0.35)', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '-8px', right: '-8px', width: '24px', height: '24px', background: 'rgba(255,255,255,0.12)', borderRadius: '50%' }} />
                  <GraduationCap size={20} color="white" style={{ position: 'relative', zIndex: 1 }} />
                </div>
                <div style={{ position: 'absolute', bottom: '0px', right: '0px', width: '10px', height: '10px', background: '#10b981', borderRadius: '50%', border: '2px solid #0C447C', boxShadow: '0 0 0 2px rgba(16,185,129,0.25)' }} />
              </div>
              <div className="hidden sm:flex" style={{ flexDirection: 'column', gap: '3px' }}>
                <span style={{ fontSize: '18px', fontWeight: '600', letterSpacing: '2.5px', color: '#ffffff', lineHeight: '1' }}>LAKOLI</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.65)' }}>Gestion Scolaire</span>
                  <span style={{ width: '3px', height: '3px', background: 'rgba(255,255,255,0.35)', borderRadius: '50%', display: 'inline-block' }} />
                  <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.65)' }}>Guinée</span>
                  <span style={{ width: '3px', height: '3px', background: 'rgba(255,255,255,0.35)', borderRadius: '50%', display: 'inline-block' }} />
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', color: '#0C447C', fontSize: '9px', fontWeight: '500', padding: '2px 7px', borderRadius: '6px', border: '0.5px solid #bfdbfe' }}>
                    <Shield size={8} /> SaaS 2026
                  </span>
                </div>
              </div>
            </div>

            {/* Espace de travail (rôle actif), centré */}
            <div className="flex-1 flex justify-center">
              <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/15 text-white text-xs font-bold whitespace-nowrap">
                Espace de Travail {LABELS_ROLES[role] || role}
              </span>
            </div>

            {/* Outils de droite */}
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <button
                onClick={() => navigate("/eleves")}
                className="relative p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title={nbNotifications > 0 ? `${nbNotifications} élément(s) à traiter` : "Aucune alerte"}
              >
                <Bell className="h-5 w-5" />
                {nbNotifications > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {nbNotifications > 9 ? "9+" : nbNotifications}
                  </span>
                )}
              </button>

              <div className="relative">
                <button
                  onClick={() => setMenuCompteOuvert((v) => !v)}
                  className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div className="h-9 w-9 rounded-full bg-white/15 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {initiales(nomUtilisateur)}
                  </div>
                  <div className="hidden sm:block text-left leading-tight">
                    <p className="text-sm font-semibold text-white">{nomUtilisateur}</p>
                    <p className="text-[11px] text-white/60">{LABELS_ROLES[role] || role}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-white/70 hidden sm:block" />
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
          className="w-52 shrink-0 hidden md:block h-full overflow-y-auto"
          style={{ background: "linear-gradient(to bottom, #0C447C, #0a2d5a)" }}
        >
          <div className="p-3 space-y-1">
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '10px 12px 16px' }}>
              <div style={{ width: '4px', height: '20px', background: 'linear-gradient(180deg, #60a5fa, #2980d9)', borderRadius: '2px', flexShrink: 0 }} />
              <span style={{ fontSize: '13.5px', fontWeight: '800', letterSpacing: '1.2px', textTransform: 'uppercase', lineHeight: '1' }}>
                <span style={{ color: 'rgba(255,255,255,0.85)' }}>Menu </span>
                <span style={{ color: '#60a5fa' }}>LAKOLI</span>
              </span>
            </div>
            {modulesVisibles.map((m) => {
              const active = estActif(m.chemin);
              return (
                <button
                  key={m.chemin}
                  onClick={() => navigate(m.chemin)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? "bg-white/15 text-white shadow-sm"
                      : "text-white/75 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <m.icone className={`h-4 w-4 ${active ? "text-white" : "text-white/75"}`} />
                  <span>{m.nom}</span>
                </button>
              );
            })}
          </div>
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
            className="absolute inset-y-0 left-0 w-72 max-w-[80%] shadow-2xl flex flex-col"
            style={{ background: "linear-gradient(to bottom, #0C447C, #0a2d5a)" }}
          >
            <div className="flex items-center justify-between px-4 h-16 border-b border-white/10 shrink-0">
              <span className="text-lg font-bold text-white">Menu LAKOLI</span>
              <button
                onClick={() => setMenuMobileOuvert(false)}
                className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Fermer le menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {modulesVisibles.map((m) => {
                const active = estActif(m.chemin);
                return (
                  <button
                    key={m.chemin}
                    onClick={() => allerA(m.chemin)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      active
                        ? "bg-white/15 text-white shadow-sm"
                        : "text-white/75 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <m.icone className={`h-4 w-4 ${active ? "text-white" : "text-white/75"}`} />
                    <span>{m.nom}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-3 border-t border-white/10 shrink-0">
              <button
                onClick={handleDeconnexion}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-white/75 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
