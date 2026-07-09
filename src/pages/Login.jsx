import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Login() {
  const [identifiant, setIdentifiant] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    setChargement(true);

    try {
      const response = await api.post("/auth/login", {
        identifiant,
        mot_de_passe: motDePasse,
      });

      if (response.data.otp_requis) {
        navigate("/verification-otp", { state: { identifiant } });
      } else {
        localStorage.setItem("auth_token", response.data.token);
        navigate("/tableau-de-bord");
      }
    } catch (err) {
      setErreur(
        err.response?.data?.message || "Une erreur est survenue."
      );
    } finally {
      setChargement(false);
    }
  };

  return (
    <div style={styles.conteneur}>
      <div style={styles.carte}>
        <h1 style={styles.titre}>LAKOLI</h1>
        <p style={styles.sousTitre}>Bienvenue sur LAKOLI</p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Adresse e-mail ou numero de telephone"
            value={identifiant}
            onChange={(e) => setIdentifiant(e.target.value)}
            style={styles.champ}
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            style={styles.champ}
            required
          />

          {erreur && <p style={styles.erreur}>{erreur}</p>}

          <button type="submit" style={styles.bouton} disabled={chargement}>
            {chargement ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  conteneur: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#F8FAFC",
  },
  carte: {
    backgroundColor: "#FFFFFF",
    borderRadius: "24px",
    padding: "48px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
    width: "400px",
  },
  titre: {
    color: "#0C447C",
    fontSize: "28px",
    fontWeight: "bold",
    marginBottom: "4px",
  },
  sousTitre: {
    color: "#6B7280",
    marginBottom: "24px",
  },
  champ: {
    width: "100%",
    padding: "12px",
    marginBottom: "16px",
    borderRadius: "8px",
    border: "1px solid #D1D5DB",
    boxSizing: "border-box",
  },
  bouton: {
    width: "100%",
    padding: "14px",
    backgroundColor: "#0C447C",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  erreur: {
    color: "#DC2626",
    fontSize: "14px",
    marginBottom: "12px",
  },
};
