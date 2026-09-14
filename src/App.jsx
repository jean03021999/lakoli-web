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
import Classes from "./pages/modules/Classes";
import Periodes from "./pages/modules/Periodes";
import Utilisateurs from "./pages/modules/Utilisateurs";
import PaiementsCaisse from "./pages/modules/PaiementsCaisse";
import Abonnement from "./pages/modules/Abonnement";

const AUTH_PATHS = ["/", "/verification-otp", "/mot-de-passe-oublie", "/reinitialiser-mot-de-passe"];

function AppContent() {
  const location = useLocation();
  const [role, setRole] = useState(null);
  const [chargementRole, setChargementRole] = useState(true);

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
    api.get("/user")
      .then((res) => {
        setRole(res.data.role);
        if (res.data.user?.name) {
          localStorage.setItem("user_name", res.data.user.name);
        }
      })
      .catch(() => {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("device_token");
        setRole(null);
      })
      .finally(() => setChargementRole(false));
  }, [estPageAuth]);

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

  if (!role) {
    return <Navigate to="/" />;
  }

  return (
    <Layout role={role}>
      <Routes>
        <Route path="/tableau-de-bord" element={<TableauDeBord role={role} />} />
        <Route path="/eleves" element={<Eleves />} />
        <Route path="/eleves/:id" element={<EleveFiche />} />
        <Route path="/eleves-ajouter" element={<AjouterEleve />} />

        <Route path="/eleves-importer" element={<ImporterExcel />} />
        <Route path="/enseignants" element={<Enseignants />} />
        <Route path="/enseignants/:id" element={<EnseignantFiche />} />
        <Route path="/enseignants-ajouter" element={<AjouterEnseignant />} />
        <Route path="/matieres" element={<Matieres />} />
        <Route path="/affectations" element={<Affectations />} />
        <Route path="/emploi-du-temps" element={<EmploiDuTemps />} />
        <Route path="/notes" element={<Notes role={role} />} />
        <Route path="/notes/:id/saisie" element={<SaisieNotes />} />
        <Route path="/notes/validation/:id" element={<ValidationNotes />} />
        <Route path="/bulletins" element={<Bulletins role={role} />} />
        <Route path="/bulletins/:id" element={<BulletinApercu />} />
        <Route path="/frais-scolarite" element={<FraisScolarite />} />
        <Route path="/classes" element={<Classes />} />
        <Route path="/periodes" element={<Periodes />} />
        <Route path="/utilisateurs" element={<Utilisateurs />} />
        <Route path="/paiements" element={<PaiementsCaisse />} />
        <Route path="/abonnement" element={<Abonnement />} />
        <Route path="/parametres" element={<Parametres />} />
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







