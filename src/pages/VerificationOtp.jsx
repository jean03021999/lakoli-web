import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";

export default function VerificationOtp() {
  const [code, setCode] = useState("");
  const [confiance, setConfiance] = useState(true);
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const identifiant = location.state?.identifiant;

  useEffect(() => {
    if (!identifiant) {
      navigate("/");
    }
  }, [identifiant, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    setChargement(true);

    try {
      const response = await api.post("/auth/verifier-otp", {
        identifiant,
        code,
        faire_confiance_appareil: confiance,
      });

      localStorage.setItem("auth_token", response.data.token);
      if (response.data.device_token) {
        localStorage.setItem("device_token", response.data.device_token);
      }
      navigate("/tableau-de-bord");
    } catch (err) {
      setErreur(err.response?.data?.message || "Code invalide.");
    } finally {
      setChargement(false);
    }
  };

  const renvoyerCode = async () => {
    try {
      await api.post("/auth/renvoyer-otp", { identifiant });
      setErreur("");
    } catch (err) {
      setErreur("Erreur lors du renvoi du code.");
    }
  };

  return (
    <div style={styles.conteneur}>
      <div style={styles.carte}>
        <h1 style={styles.titre}>Verification de securite</h1>
        <p style={styles.sousTitre}>Un code a ete envoye a {identifiant}</p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Code a 6 chiffres"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
            style={styles.champ}
            required
          />

          <label style={styles.label}>
            <input
              type="checkbox"
              checked={confiance}
              onChange={(e) => setConfiance(e.target.checked)}
            />
            {" "}Faire confiance a cet appareil pendant 30 jours
          </label>

          {erreur && <p style={styles.erreur}>{erreur}</p>}

          <button type="submit" style={styles.bouton} disabled={chargement}>
            {chargement ? "Verification..." : "Verifier"}
          </button>
        </form>

        <p style={styles.lien} onClick={renvoyerCode}>
          Renvoyer le code
        </p>
      </div>
    </div>
  );
}

const styles = {
  conteneur: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#F8FAFC" },
  carte: { backgroundColor: "#FFFFFF", borderRadius: "24px", padding: "48px", boxShadow: "0 10px 40px rgba(0,0,0,0.08)", width: "400px" },
  titre: { color: "#0C447C", fontSize: "24px", fontWeight: "bold", marginBottom: "4px" },
  sousTitre: { color: "#6B7280", marginBottom: "24px", fontSize: "14px" },
  champ: { width: "100%", padding: "12px", marginBottom: "16px", borderRadius: "8px", border: "1px solid #D1D5DB", boxSizing: "border-box", textAlign: "center", fontSize: "18px", letterSpacing: "4px" },
  label: { display: "block", fontSize: "14px", color: "#374151", marginBottom: "16px" },
  bouton: { width: "100%", padding: "14px", backgroundColor: "#0C447C", color: "#FFFFFF", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" },
  erreur: { color: "#DC2626", fontSize: "14px", marginBottom: "12px" },
  lien: { color: "#0C447C", textAlign: "center", marginTop: "16px", cursor: "pointer", fontSize: "14px" },
};
