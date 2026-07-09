import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";

export default function ReinitialiserMotDePasse() {
  const [code, setCode] = useState("");
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const identifiant = location.state?.identifiant;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    setChargement(true);

    try {
      await api.post("/auth/reinitialiser-mot-de-passe", {
        identifiant,
        code,
        nouveau_mot_de_passe: nouveauMotDePasse,
        nouveau_mot_de_passe_confirmation: confirmation,
      });
      navigate("/");
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur de reinitialisation.");
    } finally {
      setChargement(false);
    }
  };

  return (
    <div style={styles.conteneur}>
      <div style={styles.carte}>
        <h1 style={styles.titre}>Nouveau mot de passe</h1>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Code recu"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={styles.champ}
            required
          />
          <input
            type="password"
            placeholder="Nouveau mot de passe"
            value={nouveauMotDePasse}
            onChange={(e) => setNouveauMotDePasse(e.target.value)}
            style={styles.champ}
            required
          />
          <input
            type="password"
            placeholder="Confirmer le mot de passe"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            style={styles.champ}
            required
          />

          {erreur && <p style={styles.erreur}>{erreur}</p>}

          <button type="submit" style={styles.bouton} disabled={chargement}>
            {chargement ? "Reinitialisation..." : "Reinitialiser le mot de passe"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  conteneur: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#F8FAFC" },
  carte: { backgroundColor: "#FFFFFF", borderRadius: "24px", padding: "48px", boxShadow: "0 10px 40px rgba(0,0,0,0.08)", width: "400px" },
  titre: { color: "#0C447C", fontSize: "24px", fontWeight: "bold", marginBottom: "24px" },
  champ: { width: "100%", padding: "12px", marginBottom: "16px", borderRadius: "8px", border: "1px solid #D1D5DB", boxSizing: "border-box" },
  bouton: { width: "100%", padding: "14px", backgroundColor: "#0C447C", color: "#FFFFFF", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" },
  erreur: { color: "#DC2626", fontSize: "14px", marginBottom: "12px" },
};
