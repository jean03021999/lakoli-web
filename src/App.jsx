import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import VerificationOtp from "./pages/VerificationOtp";
import MotDePasseOublie from "./pages/MotDePasseOublie";
import ReinitialiserMotDePasse from "./pages/ReinitialiserMotDePasse";

function TableauDeBord() {
  return <h1 style={{ textAlign: "center", marginTop: "100px" }}>Bienvenue sur le tableau de bord LAKOLI</h1>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/verification-otp" element={<VerificationOtp />} />
        <Route path="/mot-de-passe-oublie" element={<MotDePasseOublie />} />
        <Route path="/reinitialiser-mot-de-passe" element={<ReinitialiserMotDePasse />} />
        <Route path="/tableau-de-bord" element={<TableauDeBord />} />
      </Routes>
    </BrowserRouter>
  );
}
