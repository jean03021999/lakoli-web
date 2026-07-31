import React, { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  GraduationCap,
  Wallet,
  Briefcase,
  Settings,
  LogOut,
  User,
  Users,
  BookOpen,
  Calendar,
  ShieldCheck,
  Building,
  Award,
  FileSpreadsheet,
  LayoutDashboard,
} from "lucide-react";

import { INITIAL_STUDENTS } from "./mockData";
import { INITIAL_TEACHERS } from "./mockTeachersData";
import { INITIAL_EVALUATIONS } from "./mockEvaluationsData";

import Login from "./pages/Login";
import VerificationOtp from "./pages/VerificationOtp";
import MotDePasseOublie from "./pages/MotDePasseOublie";
import ReinitialiserMotDePasse from "./pages/ReinitialiserMotDePasse";

import ElevesListe from "./components/eleves/ElevesListe";
import EleveFiche from "./components/eleves/EleveFiche";
import EnseignantsListe from "./components/enseignants/EnseignantsListe";
import EnseignantFiche from "./components/enseignants/EnseignantFiche";
import MatieresGestion from "./components/matieres/MatieresGestion";
import EmploiDuTempsGrille from "./components/emploi-du-temps/EmploiDuTempsGrille";
import EvaluationsListe from "./components/notes/EvaluationsListe";
import BulletinsListe from "./components/bulletins/BulletinsListe";
import GrillesTarifaires from "./components/frais/GrillesTarifaires";
import SuiviPaiementsEleve from "./components/frais/SuiviPaiementsEleve";
import Dashboard from "./components/dashboard/Dashboard";
import SaisieNotes from "./components/notes/SaisieNotes";
import ParametresCompte from "./components/parametres/ParametresCompte";

const AUTH_PATHS = [
  "/",
  "/connexion",
  "/login",
  "/verification-otp",
  "/mot-de-passe-oublie",
  "/reinitialiser-mot-de-passe",
];

function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();

  const [students, setStudents] = useState(INITIAL_STUDENTS);
  const [teachers, setTeachers] = useState(INITIAL_TEACHERS);
  const [evaluations, setEvaluations] = useState(INITIAL_EVALUATIONS);
  const [fraisSubTab, setFraisSubTab] = useState("suivi");

  // IMPORTANT : ce sélecteur de rôle est temporaire, pour la démonstration.
  // Il devra être remplacé par le vrai rôle de l'utilisateur connecté,
  // recupéré depuis l'API (user->roles), une fois le backend branché.
  const [role, setRole] = useState("COMPTABLE");

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("lakoli-theme") || "light";
  });
  const [fontFamily, setFontFamily] = useState(() => {
    return localStorage.getItem("lakoli-font") || "inter";
  });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("lakoli-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("lakoli-font", fontFamily);
  }, [fontFamily]);

  useEffect(() => {
    const link1 = document.createElement("link");
    link1.rel = "preconnect";
    link1.href = "https://fonts.googleapis.com";

    const link2 = document.createElement("link");
    link2.rel = "preconnect";
    link2.href = "https://fonts.gstatic.com";
    link2.crossOrigin = "anonymous";

    const link3 = document.createElement("link");
    link3.rel = "stylesheet";
    link3.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap";

    document.head.appendChild(link1);
    document.head.appendChild(link2);
    document.head.appendChild(link3);

    return () => {
      try {
        document.head.removeChild(link1);
        document.head.removeChild(link2);
        document.head.removeChild(link3);
      } catch (e) {}
    };
  }, []);

  const handleUpdateStudent = (updatedStudent) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s))
    );
  };
  const handleAddStudent = (newStudentData) => {
    const newStudent = { ...newStudentData, id: `student-${Date.now()}` };
    setStudents((prev) => [newStudent, ...prev]);
  };
  const handleImportStudents = (imported) => {
    setStudents((prev) => [...imported, ...prev]);
  };

  const handleUpdateTeacher = (updatedTeacher) => {
    setTeachers((prev) =>
      prev.map((t) => (t.id === updatedTeacher.id ? updatedTeacher : t))
    );
  };
  const handleAddTeacher = (newTeacherData) => {
    const newTeacher = { ...newTeacherData, id: `teacher-${Date.now()}` };
    setTeachers((prev) => [newTeacher, ...prev]);
  };
  const handleImportTeachers = (imported) => {
    setTeachers((prev) => [...imported, ...prev]);
  };

  const handleSaveEvaluation = (savedEval) => {
    setEvaluations((prev) => {
      const exists = prev.some((e) => e.id === savedEval.id);
      if (exists) {
        return prev.map((e) => (e.id === savedEval.id ? savedEval : e));
      }
      return [savedEval, ...prev];
    });
  };
  const handleDeleteEvaluation = (id) => {
    setEvaluations((prev) => prev.filter((e) => e.id !== id));
  };
  const handleUpdateEvaluationStatus = (id, newStatus, comment) => {
    setEvaluations((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, statut: newStatus, commentaireRejet: comment } : e
      )
    );
  };

  const isRouteAllowed = (userRole, path) => {
    if (
      path === "/tableau-de-bord" ||
      path === "/" ||
      path === "/parametres"
    )
      return true;
    if (path.startsWith("/eleves"))
      return ["COMPTABLE", "DIRECTEUR", "FONDATEUR"].includes(userRole);
    if (path.startsWith("/enseignants"))
      return ["COMPTABLE", "DIRECTEUR", "FONDATEUR", "ENSEIGNANT"].includes(
        userRole
      );
    if (path.startsWith("/matieres"))
      return ["COMPTABLE", "DIRECTEUR", "FONDATEUR"].includes(userRole);
    if (path.startsWith("/emploi-du-temps"))
      return ["COMPTABLE", "DIRECTEUR", "FONDATEUR", "ENSEIGNANT"].includes(
        userRole
      );
    if (path.startsWith("/notes"))
      return ["DIRECTEUR", "ENSEIGNANT"].includes(userRole);
    if (path.startsWith("/bulletins"))
      return ["DIRECTEUR", "FONDATEUR", "ENSEIGNANT"].includes(userRole);
    if (path.startsWith("/frais-scolarite"))
      return ["COMPTABLE", "DIRECTEUR", "FONDATEUR"].includes(userRole);
    return true;
  };

  const allSidebarItems = [
    { name: "Tableau de bord", path: "/tableau-de-bord", icon: LayoutDashboard, roles: ["COMPTABLE", "DIRECTEUR", "FONDATEUR", "ENSEIGNANT"] },
    { name: "Gestion des Élèves", path: "/eleves", icon: GraduationCap, roles: ["COMPTABLE", "DIRECTEUR", "FONDATEUR"] },
    { name: "Gestion des Enseignants", path: "/enseignants", icon: Users, roles: ["COMPTABLE", "DIRECTEUR", "FONDATEUR", "ENSEIGNANT"] },
    { name: "Gestion des Matières", path: "/matieres", icon: BookOpen, roles: ["COMPTABLE", "DIRECTEUR", "FONDATEUR"] },
    { name: "Emploi du Temps", path: "/emploi-du-temps", icon: Calendar, roles: ["COMPTABLE", "DIRECTEUR", "FONDATEUR", "ENSEIGNANT"] },
    { name: "Gestion des Notes", path: "/notes", icon: Award, roles: ["DIRECTEUR", "ENSEIGNANT"] },
    { name: "Bulletins", path: "/bulletins", icon: FileSpreadsheet, roles: ["DIRECTEUR", "FONDATEUR", "ENSEIGNANT"] },
    { name: "Frais de Scolarité", path: "/frais-scolarite", icon: Wallet, roles: ["COMPTABLE", "DIRECTEUR", "FONDATEUR"] },
  ];

  const sidebarItems = allSidebarItems.filter((item) => item.roles.includes(role));

  const isActive = (path) => {
    if (path === "/tableau-de-bord") {
      return location.pathname === "/tableau-de-bord";
    }
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    if (!isRouteAllowed(role, location.pathname)) {
      navigate("/tableau-de-bord");
    }
  }, [role, location.pathname, navigate]);

  const RestrictedView = () => (
    <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm text-center max-w-md mx-auto my-12 space-y-4">
      <div className="h-12 w-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500">
        <ShieldCheck className="h-6 w-6" />
      </div>
      <h3 className="text-base font-black text-slate-800">Accès Restreint</h3>
      <p className="text-xs text-slate-500 leading-relaxed">
        Ce module n'est pas accessible avec le rôle actuellement sélectionné.
      </p>
    </div>
  );

  const StudentDetailsPage = () => {
    const { id } = useParams();
    const student = students.find((s) => s.id === id);
    if (!student) return <Navigate to="/eleves" />;
    return (
      <EleveFiche
        student={student}
        onBack={() => navigate("/eleves")}
        onUpdateStudent={handleUpdateStudent}
        role={role}
      />
    );
  };

  const TeacherDetailsPage = () => {
    const { id } = useParams();
    const teacher = teachers.find((t) => t.id === id);
    if (!teacher) return <Navigate to="/enseignants" />;
    return (
      <EnseignantFiche
        teacher={teacher}
        onBack={() => navigate("/enseignants")}
        onUpdateTeacher={handleUpdateTeacher}
        role={role}
      />
    );
  };

  const SaisieNotesPage = () => {
    const { id } = useParams();
    const evaluation = id !== "new" ? evaluations.find((e) => e.id === id) || null : null;
    return (
      <SaisieNotes
        evaluation={evaluation}
        onSave={(savedEval) => {
          handleSaveEvaluation(savedEval);
          navigate("/notes");
        }}
        onCancel={() => navigate("/notes")}
      />
    );
  };

  const getBannerContent = () => {
    const path = location.pathname;
    const roleLabel = role === "COMPTABLE" ? "Comptable" : role === "DIRECTEUR" ? "Directeur" : role === "FONDATEUR" ? "Fondateur" : "Enseignant";
    if (path === "/tableau-de-bord") {
      return { tag: `Espace de Travail ${roleLabel}`, title: "Tableau de Bord LAKOLI", desc: "Aperçu global en temps réel des indicateurs financiers et des activités pédagogiques de l'établissement." };
    }
    if (path.startsWith("/eleves")) {
      return { tag: `Espace de Travail ${roleLabel}`, title: "Gestion de la Scolarité & des Élèves", desc: "Suivi en temps réel des versements, des fiches de filiation, et du recouvrement des frais de scolarité." };
    }
    if (path.startsWith("/enseignants")) {
      return { tag: `Espace de Travail ${roleLabel}`, title: "Gestion du Corps Enseignant & Contrats", desc: "Suivi des contrats de travail, des matières dispensées, des heures supplémentaires et des emplois du temps." };
    }
    if (path.startsWith("/matieres")) {
      return { tag: `Espace de Travail ${roleLabel}`, title: "Gestion des Matières & Coefficients", desc: "Configuration des coefficients par niveau scolaire et filière." };
    }
    if (path.startsWith("/emploi-du-temps")) {
      return { tag: `Espace de Travail ${roleLabel}`, title: "Gestion des Emplois du Temps", desc: "Planification hebdomadaire des cours par classe." };
    }
    if (path.startsWith("/notes")) {
      return { tag: `Espace de Travail ${roleLabel}`, title: "Gestion des Notes & Évaluations", desc: "Saisie, validation et publication des notes." };
    }
    if (path.startsWith("/bulletins")) {
      return { tag: `Espace de Travail ${roleLabel}`, title: "Production des Bulletins de Notes", desc: "Calcul des moyennes, classements et génération des bulletins officiels." };
    }
    if (path.startsWith("/frais-scolarite")) {
      return { tag: `Espace de Travail ${roleLabel}`, title: "Frais de Scolarité & Facturation", desc: "Suivi du recouvrement et grilles tarifaires." };
    }
    return { tag: "Espace de Travail LAKOLI", title: "Gestion Scolaire Intégrée", desc: "Portail sécurisé de gestion administrative et financière." };
  };

  const fontStyle = {
    inter: "'Inter', sans-serif",
    roboto: "'Roboto', sans-serif",
    opensans: "'Open Sans', sans-serif",
    system: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  }[fontFamily];

  const banner = getBannerContent();

  return (
    <div style={{ fontFamily: fontStyle }} className="min-h-screen bg-slate-50 flex flex-col text-slate-800 pb-16 md:pb-0">
      <header id="lakoli-header" className="sticky top-0 z-40 bg-white border-b border-slate-150 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#0C447C] rounded-xl text-white shadow-md">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xl font-extrabold text-slate-900 tracking-tight">LAKOLI</span>
                <span className="hidden sm:inline-block text-[10px] text-slate-400 uppercase font-bold tracking-wider ml-2 px-2 py-0.5 bg-slate-100 rounded-full">Édition Guinée</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button onClick={() => navigate("/parametres")} className={`p-2 rounded-lg transition-all cursor-pointer flex items-center justify-center ${location.pathname === "/parametres" ? "bg-[#0C447C]/10 text-[#0C447C] font-bold" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"}`} title="Paramètres du compte">
                <User className="h-5 w-5" />
              </button>

              <button onClick={() => { localStorage.removeItem("auth_token"); navigate("/"); }} className="p-2 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-all cursor-pointer flex items-center justify-center" title="Déconnexion">
                <LogOut className="h-5 w-5" />
              </button>

              <div className="relative mr-2">
                <button onClick={() => setShowSettings(!showSettings)} className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-all flex items-center justify-center cursor-pointer" title="Paramètres d'affichage">
                  <Settings className={`h-5 w-5 ${showSettings ? "rotate-45" : ""} transition-transform duration-200`} />
                </button>
                {showSettings && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)} />
                    <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-150 rounded-2xl shadow-xl p-5 z-50 space-y-4 text-xs text-slate-800">
                      <div className="pb-2 border-b border-slate-100">
                        <h4 className="font-extrabold text-slate-900 text-sm">Paramètres d'affichage</h4>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-700">Mode Sombre</span>
                          <button onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))} className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${theme === "dark" ? "bg-[#0C447C]" : "bg-slate-200"}`}>
                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${theme === "dark" ? "translate-x-4" : "translate-x-0"}`} />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="font-bold text-slate-700 block">Style de police</label>
                        <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium outline-none text-slate-800">
                          <option value="inter">Inter (Par défaut)</option>
                          <option value="roboto">Roboto</option>
                          <option value="opensans">Open Sans</option>
                          <option value="system">Système UI</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 gap-1.5 shadow-inner">
                <button onClick={() => setRole("COMPTABLE")} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${role === "COMPTABLE" ? "bg-white text-slate-800 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-800"}`}>
                  <Briefcase className="h-3.5 w-3.5 text-[#0C447C]" /> Comptable
                </button>
                <button onClick={() => setRole("DIRECTEUR")} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${role === "DIRECTEUR" ? "bg-white text-slate-800 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-800"}`}>
                  <User className="h-3.5 w-3.5 text-blue-600" /> Directeur
                </button>
                <button onClick={() => setRole("FONDATEUR")} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${role === "FONDATEUR" ? "bg-white text-slate-800 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-800"}`}>
                  <Building className="h-3.5 w-3.5 text-indigo-600" /> Fondateur
                </button>
                <button onClick={() => setRole("ENSEIGNANT")} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${role === "ENSEIGNANT" ? "bg-white text-slate-800 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-800"}`}>
                  <GraduationCap className="h-3.5 w-3.5 text-amber-600" /> Enseignant
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 w-full max-w-7xl mx-auto">
        <aside className="w-64 border-r border-slate-150 bg-white shrink-0 hidden md:block">
          <div className="sticky top-20 p-4 space-y-1">
            {sidebarItems.map((item) => {
              const active = isActive(item.path);
              return (
                <button key={item.path} onClick={() => navigate(item.path)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${active ? "bg-[#0C447C]/10 text-[#0C447C] border-l-4 border-[#0C447C] pl-3" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-l-4 border-transparent"}`}>
                  <div className="flex items-center gap-3">
                    <item.icon className={`h-4 w-4 ${active ? "text-[#0C447C]" : "text-slate-400"}`} />
                    <span>{item.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="flex-1 px-4 sm:px-6 md:px-8 py-8 space-y-6 overflow-x-hidden">
          <div className="bg-[#0C447C] rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-6 opacity-10">
              <GraduationCap className="w-64 h-64" />
            </div>
            <div className="relative z-10 space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/10 rounded-full text-xs font-semibold backdrop-blur-md">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-200" />
                {banner.tag}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{banner.title}</h1>
              <p className="text-xs sm:text-sm text-blue-100 font-medium">{banner.desc}</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/tableau-de-bord" element={<Dashboard students={students} teachers={teachers} evaluations={evaluations} role={role} />} />

              <Route path="/eleves" element={!isRouteAllowed(role, "/eleves") ? <RestrictedView /> : <ElevesListe students={students} onSelectStudent={(s) => navigate(`/eleves/${s.id}`)} onAddStudent={handleAddStudent} onImportStudents={handleImportStudents} role={role} />} />
              <Route path="/eleves/:id" element={!isRouteAllowed(role, "/eleves") ? <RestrictedView /> : <StudentDetailsPage />} />

              <Route path="/enseignants" element={!isRouteAllowed(role, "/enseignants") ? <RestrictedView /> : <EnseignantsListe teachers={teachers} onSelectTeacher={(t) => navigate(`/enseignants/${t.id}`)} onAddTeacher={handleAddTeacher} onImportTeachers={handleImportTeachers} role={role} />} />
              <Route path="/enseignants/:id" element={!isRouteAllowed(role, "/enseignants") ? <RestrictedView /> : <TeacherDetailsPage />} />

              <Route path="/matieres" element={!isRouteAllowed(role, "/matieres") ? <RestrictedView /> : <MatieresGestion role={role} />} />

              <Route path="/emploi-du-temps" element={!isRouteAllowed(role, "/emploi-du-temps") ? <RestrictedView /> : <EmploiDuTempsGrille teachers={teachers} onUpdateTeacher={handleUpdateTeacher} role={role} />} />

              <Route path="/notes" element={!isRouteAllowed(role, "/notes") ? <RestrictedView /> : <EvaluationsListe role={role} teachers={teachers} evaluations={evaluations} onDeleteEvaluation={handleDeleteEvaluation} onUpdateStatus={handleUpdateEvaluationStatus} subView={role === "DIRECTEUR" ? "direction" : "enseignant"} />} />
              <Route path="/notes/validation" element={!isRouteAllowed(role, "/notes") ? <RestrictedView /> : <EvaluationsListe role={role} teachers={teachers} evaluations={evaluations} onDeleteEvaluation={handleDeleteEvaluation} onUpdateStatus={handleUpdateEvaluationStatus} subView="direction" />} />
              <Route path="/notes/:id/saisie" element={!isRouteAllowed(role, "/notes") ? <RestrictedView /> : <SaisieNotesPage />} />

              <Route path="/bulletins" element={!isRouteAllowed(role, "/bulletins") ? <RestrictedView /> : <BulletinsListe students={students} role={role} evaluations={evaluations} />} />

              <Route path="/frais-scolarite" element={!isRouteAllowed(role, "/frais-scolarite") ? <RestrictedView /> : (
                <div className="space-y-6">
                  <div className="flex border-b border-slate-200">
                    <button onClick={() => setFraisSubTab("suivi")} className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${fraisSubTab === "suivi" ? "border-[#0C447C] text-[#0C447C]" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
                      Suivi des Paiements
                    </button>
                    {role === "COMPTABLE" && (
                      <button onClick={() => setFraisSubTab("grilles")} className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${fraisSubTab === "grilles" ? "border-[#0C447C] text-[#0C447C]" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
                        Grilles Tarifaires (Comptable)
                      </button>
                    )}
                  </div>
                  {fraisSubTab === "grilles" && role === "COMPTABLE" ? <GrillesTarifaires role={role} /> : <SuiviPaiementsEleve students={students} onUpdateStudent={handleUpdateStudent} role={role} />}
                </div>
              )} />

              <Route path="/parametres" element={<ParametresCompte role={role} />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex justify-around items-center h-16 px-2 shadow-lg">
        {sidebarItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button key={item.path} onClick={() => navigate(item.path)} className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${active ? "text-[#0C447C] font-extrabold" : "text-slate-500 hover:text-slate-800"}`}>
              <item.icon className="h-4 w-4" />
              <span className="text-[8px] mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[55px]">{item.name.replace("Gestion des ", "").replace("Frais de ", "")}</span>
            </button>
          );
        })}
      </nav>

      <footer className="mt-12 border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400 space-y-1 select-none">
          <p>© 2026 LAKOLI - Tous droits réservés.</p>
          <p>Espace sécurisé de gestion scolaire de l'établissement LAKOLI</p>
        </div>
      </footer>
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const isAuthPage = AUTH_PATHS.includes(location.pathname);

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/connexion" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verification-otp" element={<VerificationOtp />} />
        <Route path="/mot-de-passe-oublie" element={<MotDePasseOublie />} />
        <Route path="/reinitialiser-mot-de-passe" element={<ReinitialiserMotDePasse />} />
      </Routes>
    );
  }

  return <AppShell />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
