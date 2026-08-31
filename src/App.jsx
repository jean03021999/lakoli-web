import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

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
import FraisScolarite from "./pages/modules/FraisScolarite";
import Parametres from "./pages/modules/Parametres";

const AUTH_PATHS = ["/", "/verification-otp", "/mot-de-passe-oublie", "/reinitialiser-mot-de-passe"];

function AppContent() {
  const location = useLocation();
  const [role, setRole] = useState("COMPTABLE");

  const estPageAuth = AUTH_PATHS.includes(location.pathname);

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

  return (
    <Layout role={role} setRole={setRole}>
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
        <Route path="/bulletins" element={<Bulletins />} />
        <Route path="/frais-scolarite" element={<FraisScolarite />} />
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






