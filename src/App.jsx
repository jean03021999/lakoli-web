import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import api from "./services/api";
import Login from "./pages/Login";
import VerificationOtp from "./pages/VerificationOtp";
import MotDePasseOublie from "./pages/MotDePasseOublie";
import ReinitialiserMotDePasse from "./pages/ReinitialiserMotDePasse";

import Layout from "./components/Layout";
import TableauDeBord from "./pages/modules/TableauDeBord";
import Eleves from "./pages/modules/Eleves";
import EleveFiche from "./pages/modules/EleveFiche";
import AjouterEleve from "./pages/modules/AjouterEleve";
import ImporterExcel from "./pages/modules/ImporterExcel";

import Enseignants from "./pages/modules/Enseignants";
import EnseignantFiche from "./pages/modules/EnseignantFiche";
import AjouterEnseignant from "./pages/modules/AjouterEnseignant";
import Matieres from "./pages/modules/Matieres";
import Affectations from "./pages/modules/Affectations";
import EmploiDuTemps from "./pages/modules/EmploiDuTemps";
import Notes from "./pages/modules/Notes";
import SaisieNotes from "./pages/modules/SaisieNotes";
import ValidationNotes from "./pages/modules/ValidationNotes";
import Bulletins from "./pages/modules/Bulletins";
import BulletinApercu from "./pages/modules/BulletinApercu";
import FraisScolarite from "./pages/modules/FraisScolarite";
import Parametres from "./pages/modules/Parametres";
import { definirEtablissement } from "./utils/etablissementCourant";
import Classes from "./pages/modules/Classes";
import Periodes from "./pages/modules/Periodes";
import PaiementsCaisse from "./pages/modules/PaiementsCaisse";
import Depenses from "./pages/modules/Depenses";
import Relances from "./pages/modules/Relances";
import RapportFinancier from "./pages/modules/RapportFinancier";
import Abonnement from "./pages/modules/Abonnement";
import Salaires from "./pages/modules/Salaires";

const AUTH_PATHS = ["/", "/verification-otp", "/mot-de-passe-oublie", "/reinitialiser-mot-de-passe"];

// Derniere session connue (role, permissions, etablissement...) : reprise au demarrage quand le
// serveur est injoignable, pour ne pas deconnecter l'utilisateur a cause d'une coupure reseau.
const CLE_SESSION = "lakoli_session";

function lireSessionMemorisee() {
  try {
    return JSON.parse(localStorage.getItem(CLE_SESSION) || "null");
  } catch {
    return null;
  }
}

// Redirige vers le tableau de bord (accessible a tous les roles) si l'utilisateur
// n'a pas la permission requise, au lieu de se fier uniquement au bouton masque
// cote UI (qui n'empeche pas la navigation directe par URL).
function RouteProtegee({ permissions, requiert, children }) {
  if (!permissions.includes(requiert)) {
    return <Navigate to="/tableau-de-bord" replace />;
  }
  return children;
}

function AppContent() {
  const location = useLocation();
  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [etablissement, setEtablissement] = useState(null);
  const [session, setSession] = useState(null);
  const [utilisateur, setUtilisateur] = useState(null);
  const [chargementRole, setChargementRole] = useState(true);
  const [serveurInjoignable, setServeurInjoignable] = useState(false);
  const [tentative, setTentative] = useState(0);

  const estPageAuth = AUTH_PATHS.includes(location.pathname);

  useEffect(() => {
    if (estPageAuth) {
      setChargementRole(false);
      return;
    }
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setChargementRole(false);
      return;
    }
    const appliquer = (donnees) => {
      setRole(donnees.role);
      setPermissions(donnees.permissions || []);
      setEtablissement(donnees.etablissement || null);
      definirEtablissement(donnees.etablissement);
      setSession(donnees.session || null);
      setUtilisateur(donnees.user || null);
    };
    api.get("/user")
      .then((res) => {
        appliquer(res.data);
        setServeurInjoignable(false);
        try {
          localStorage.setItem(CLE_SESSION, JSON.stringify(res.data));
        } catch {
          // stockage indisponible : pas de reprise hors ligne, sans autre consequence
        }
        if (res.data.user?.name) {
          localStorage.setItem("user_name", res.data.user.name);
        }
      })
      .catch((err) => {
        // Jeton refuse par le serveur : vraie deconnexion.
        if (err.response?.status === 401) {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("device_token");
          localStorage.removeItem(CLE_SESSION);
          setRole(null);
          return;
        }
        // Serveur injoignable (coupure reseau...) : on garde la connexion et la derniere session.
        const memorisee = lireSessionMemorisee();
        if (memorisee) appliquer(memorisee);
        setServeurInjoignable(true);
      })
      .finally(() => setChargementRole(false));
  }, [estPageAuth, tentative]);

  if (estPageAuth) {
    return (
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/verification-otp" element={<VerificationOtp />} />
        <Route path="/mot-de-passe-oublie" element={<MotDePasseOublie />} />
        <Route path="/reinitialiser-mot-de-passe" element={<ReinitialiserMotDePasse />} />
      </Routes>
    );
  }

  if (chargementRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] text-slate-400 text-sm">
        Chargement...
      </div>
    );
  }

  if (!role && serveurInjoignable) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6">
        <div className="max-w-sm w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center space-y-3">
          <p className="text-base font-bold text-slate-900">Serveur LAKOLI injoignable</p>
          <p className="text-sm text-slate-500">Vérifiez la connexion réseau puis réessayez. Vous restez connecté.</p>
          <button
            onClick={() => {
              setChargementRole(true);
              setTentative((n) => n + 1);
            }}
            className="px-4 py-2 rounded-xl bg-[#0C447C] text-white text-sm font-semibold cursor-pointer"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!role) {
    return <Navigate to="/" />;
  }

  return (
    <Layout role={role} permissions={permissions} etablissement={etablissement} session={session} utilisateur={utilisateur}>
      <Routes>
        <Route path="/tableau-de-bord" element={<TableauDeBord role={role} />} />
        <Route path="/eleves" element={<Eleves permissions={permissions} />} />
        <Route path="/eleves/:id" element={<EleveFiche permissions={permissions} />} />
        <Route
          path="/eleves-ajouter"
          element={<RouteProtegee permissions={permissions} requiert="eleves.creer"><AjouterEleve /></RouteProtegee>}
        />
        <Route
          path="/eleves-importer"
          element={<RouteProtegee permissions={permissions} requiert="eleves.importer"><ImporterExcel /></RouteProtegee>}
        />

        <Route path="/enseignants" element={<Enseignants permissions={permissions} etablissement={etablissement} session={session} />} />
        <Route path="/enseignants/:id" element={<EnseignantFiche permissions={permissions} etablissement={etablissement} />} />
        <Route path="/enseignants-ajouter" element={<RouteProtegee permissions={permissions} requiert="enseignants.creer"><AjouterEnseignant /></RouteProtegee>} />
        <Route path="/matieres" element={<Matieres permissions={permissions} />} />
        <Route path="/affectations" element={<Affectations />} />
        <Route path="/emploi-du-temps" element={<RouteProtegee permissions={permissions} requiert="emploi_du_temps.voir"><EmploiDuTemps permissions={permissions} /></RouteProtegee>} />
        <Route path="/notes" element={<Notes role={role} />} />
        <Route path="/notes/:id/saisie" element={<SaisieNotes />} />
        <Route path="/notes/validation/:id" element={<ValidationNotes />} />
        <Route path="/bulletins" element={<Bulletins role={role} />} />
        <Route path="/bulletins/:id" element={<BulletinApercu />} />
        <Route
          path="/frais-scolarite"
          element={<RouteProtegee permissions={permissions} requiert="frais.voir"><FraisScolarite permissions={permissions} etablissement={etablissement} /></RouteProtegee>}
        />
        <Route path="/classes" element={<Classes permissions={permissions} />} />
        <Route path="/periodes" element={<Periodes permissions={permissions} />} />
        <Route path="/utilisateurs" element={<Navigate to="/parametres?section=utilisateurs" replace />} />
        <Route path="/paiements" element={<RouteProtegee permissions={permissions} requiert="frais.voir"><PaiementsCaisse etablissement={etablissement} permissions={permissions} /></RouteProtegee>} />
        <Route path="/depenses" element={<RouteProtegee permissions={permissions} requiert="frais.voir"><Depenses etablissement={etablissement} permissions={permissions} /></RouteProtegee>} />
        <Route path="/relances" element={<RouteProtegee permissions={permissions} requiert="frais.voir"><Relances etablissement={etablissement} permissions={permissions} /></RouteProtegee>} />
        <Route path="/rapport-financier" element={<RouteProtegee permissions={permissions} requiert="frais.voir"><RapportFinancier etablissement={etablissement} /></RouteProtegee>} />
        <Route
          path="/salaires"
          element={<RouteProtegee permissions={permissions} requiert="enseignants.salaires.voir"><Salaires permissions={permissions} /></RouteProtegee>}
        />
        <Route path="/abonnement" element={<Abonnement />} />
        <Route
          path="/parametres"
          element={
            <Parametres
              permissions={permissions}
              onUtilisateurMaj={(u) => {
                setUtilisateur((actuel) => ({ ...actuel, ...u }));
                if (u.name) localStorage.setItem("user_name", u.name);
              }}
              onEtablissementMaj={(e) => {
                setEtablissement((actuel) => ({ ...actuel, ...e }));
                definirEtablissement(e);
              }}
              onSessionMaj={setSession}
            />
          }
        />
        <Route path="*" element={<Navigate to="/tableau-de-bord" />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}







