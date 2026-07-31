import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { COULEURS } from "../../components/Layout";

export default function Eleves() {
  const [eleves, setEleves] = useState([]);
  const [stats, setStats] = useState({ total: 0, a_jour: 0, en_retard: 0 });
  const [recherche, setRecherche] = useState("");
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const navigate = useNavigate();

  const chargerEleves = async () => {
    setChargement(true);
    setErreur("");
    try {
      const params = recherche ? { recherche } : {};
      const response = await api.get("/eleves", { params });
      setEleves(response.data.eleves);
      setStats(response.data.stats);
    } catch (err) {
      setErreur(err.response?.data?.message || "Impossible de charger les élèves.");
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerEleves();
  }, []);

  const handleRecherche = (e) => {
    e.preventDefault();
    chargerEleves();
  };

  const badgeStatut = (statut) => {
    if (statut === "a_jour") {
      return { texte: "À jour", couleur: COULEURS.vert, fond: COULEURS.vertClair };
    }
    if (statut === "en_retard") {
      return { texte: "En retard", couleur: COULEURS.rouge, fond: COULEURS.rougeClair };
    }
    return { texte: "Aucun frais", couleur: COULEURS.gris, fond: COULEURS.grisClair };
  };

  return (
    <div>
      <div style={{ backgroundColor: COULEURS.navy, borderRadius: "16px", padding: "24px", color: "#FFFFFF", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "800", margin: 0 }}>Gestion de la Scolarité & des Élèves</h1>
      </div>

      <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", flex: 1 }}>
          <p style={{ fontSize: "11px", fontWeight: "700", color: COULEURS.gris, textTransform: "uppercase", margin: 0 }}>Total élèves</p>
          <p style={{ fontSize: "28px", fontWeight: "800", color: COULEURS.texte, margin: "8px 0 0" }}>{stats.total}</p>
        </div>
        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", flex: 1 }}>
          <p style={{ fontSize: "11px", fontWeight: "700", color: COULEURS.gris, textTransform: "uppercase", margin: 0 }}>Paiements à jour</p>
          <p style={{ fontSize: "28px", fontWeight: "800", color: COULEURS.vert, margin: "8px 0 0" }}>{stats.a_jour}</p>
        </div>
        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", flex: 1 }}>
          <p style={{ fontSize: "11px", fontWeight: "700", color: COULEURS.gris, textTransform: "uppercase", margin: 0 }}>Paiements en retard</p>
          <p style={{ fontSize: "28px", fontWeight: "800", color: COULEURS.rouge, margin: "8px 0 0" }}>{stats.en_retard}</p>
        </div>
      </div>

      <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <form onSubmit={handleRecherche} style={{ marginBottom: "20px", display: "flex", gap: "8px" }}>
          <input
            type="text"
            placeholder="Rechercher par nom, prénom ou matricule..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            style={{ flex: 1, padding: "10px 14px", borderRadius: "8px", border: "1px solid #D1D5DB", fontSize: "13px", color: COULEURS.texte, backgroundColor: "#FFFFFF" }}
          />
          <button type="submit" style={{ padding: "10px 20px", borderRadius: "8px", border: "none", backgroundColor: COULEURS.navy, color: "#FFFFFF", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
            Rechercher
          </button>
          <button type="button" onClick={() => navigate("/eleves-ajouter")} style={{ padding: "10px 20px", borderRadius: "8px", border: `2px solid ${COULEURS.navy}`, backgroundColor: "#FFFFFF", color: COULEURS.navy, fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
            + Ajouter un élève
          </button>
        </form>

        {erreur && <p style={{ color: COULEURS.rouge, fontSize: "13px" }}>{erreur}</p>}
        {chargement && <p style={{ color: COULEURS.gris, fontSize: "13px" }}>Chargement...</p>}

        {!chargement && !erreur && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #E5E7EB" }}>
                <th style={{ textAlign: "left", padding: "10px", fontSize: "11px", color: COULEURS.gris, textTransform: "uppercase" }}>Élève</th>
                <th style={{ textAlign: "left", padding: "10px", fontSize: "11px", color: COULEURS.gris, textTransform: "uppercase" }}>Classe</th>
                <th style={{ textAlign: "left", padding: "10px", fontSize: "11px", color: COULEURS.gris, textTransform: "uppercase" }}>Statut paiement</th>
                <th style={{ padding: "10px" }}></th>
              </tr>
            </thead>
            <tbody>
              {eleves.map((eleve) => {
                const badge = badgeStatut(eleve.statut_paiement);
                return (
                  <tr
                    key={eleve.id}
                    onClick={() => navigate(`/eleves/${eleve.id}`)}
                    style={{ borderBottom: "1px solid #F3F4F6", cursor: "pointer" }}
                  >
                    <td style={{ padding: "12px 10px" }}>
                      <p style={{ margin: 0, fontWeight: "700", fontSize: "13px", color: COULEURS.texte }}>{eleve.nom} {eleve.prenom}</p>
                      <p style={{ margin: 0, fontSize: "11px", color: COULEURS.gris }}>{eleve.matricule}</p>
                    </td>
                    <td style={{ padding: "12px 10px", fontSize: "13px", color: COULEURS.texte }}>{eleve.classe || "—"}</td>
                    <td style={{ padding: "12px 10px" }}>
                      <span style={{ backgroundColor: badge.fond, color: badge.couleur, padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700" }}>
                        {badge.texte}
                      </span>
                    </td>
                    <td style={{ padding: "12px 10px", textAlign: "right", color: COULEURS.gris }}>›</td>
                  </tr>
                );
              })}
              {eleves.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: "24px", textAlign: "center", color: COULEURS.gris, fontSize: "13px" }}>
                    Aucun élève trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}


