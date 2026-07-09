import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function MotDePasseOublie() {
  const [identifiant, setIdentifiant] = useState("");
  const [message, setMessage] = useState("");
  const [chargement, setChargement] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);

    try {
      await api.post("/auth/mot-de-passe-oublie", { identifiant });
      navigate("/reinitialiser-mot-de-passe", { state: { identifiant } });
    } catch (err) {
      setMessage(err.response?.data?.message || "Une erreur est survenue.");
    } finally {
      setChargement(false);
    }
  };

  return (
    <div style={styles.conteneur}>
      <div style={styles.carte}>
        <h1 style={styles.titre}>Mot de passe oublie ?</h1>
        <p style={styles.sousTitre}>
          Entrez votre email ou telephone, nous vous enverrons un code.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Adresse e-mail ou numero de telephone"
            value={identifiant}
            onChange={(e) => setIdentifiant(e.target.value)}
            style={styles.champ}
            required
          />

          {message && <p style={styles.erreur}>{message}</p>}

          <button type="submit" style={styles.bouton} disabled={chargement}>
            {chargement ? "Envoi..." : "Envoyer le code de reinitialisation"}
          </button>
        </form>

        <p style={styles.lien} onClick={() => navigate("/")}>
          Retour a la connexion
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
  champ: { width: "100%", padding: "12px", marginBottom: "16px", borderRadius: "8px", border: "1px solid #D1D5DB", boxSizing: "border-box" },
  bouton: { width: "100%", padding: "14px", backgroundColor: "#0C447C", color: "#FFFFFF", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" },
  erreur: { color: "#DC2626", fontSize: "14px", marginBottom: "12px" },
  lien: { color: "#0C447C", textAlign: "center", marginTop: "16px", cursor: "pointer", fontSize: "14px" },
};
