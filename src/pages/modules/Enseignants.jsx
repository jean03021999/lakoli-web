import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { COULEURS } from "../../components/Layout";

export default function Enseignants() {
  const [enseignants, setEnseignants] = useState([]);
  const [stats, setStats] = useState({ total: 0, actifs: 0 });
  const [recherche, setRecherche] = useState("");
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const navigate = useNavigate();

  const charger = async () => {
    setChargement(true);
    try {
      const params = recherche ? { recherche } : {};
      const response = await api.get("/enseignants", { params });
      setEnseignants(response.data.enseignants);
      setStats(response.data.stats);
    } catch (err) {
      setErreur(err.response?.data?.message || "Impossible de charger les enseignants.");
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => { charger(); }, []);

  const badgeContrat = (type) => {
    if (type === "cdi") return { texte: "CDI", couleur: COULEURS.navy, fond: COULEURS.navyClair };
    if (type === "cdd") return { texte: "CDD", couleur: "#D97706", fond: "#FEF3C7" };
    if (type === "vacataire") return { texte: "Vacataire", couleur: COULEURS.gris, fond: COULEURS.grisClair };
    return { texte: "Aucun contrat", couleur: COULEURS.rouge, fond: COULEURS.rougeClair };
  };

  return (
    <div>
      <div style={{ backgroundColor: COULEURS.navy, borderRadius: "16px", padding: "24px", color: "#FFFFFF", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "800", margin: 0 }}>Gestion du Corps Enseignant</h1>
      </div>

      <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", flex: 1 }}>
          <p style={{ fontSize: "11px", fontWeight: "700", color: COULEURS.gris, textTransform: "uppercase", margin: 0 }}>Total enseignants</p>
          <p style={{ fontSize: "28px", fontWeight: "800", color: COULEURS.texte, margin: "8px 0 0" }}>{stats.total}</p>
        </div>
        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", flex: 1 }}>
          <p style={{ fontSize: "11px", fontWeight: "700", color: COULEURS.gris, textTransform: "uppercase", margin: 0 }}>Contrats actifs</p>
          <p style={{ fontSize: "28px", fontWeight: "800", color: COULEURS.vert, margin: "8px 0 0" }}>{stats.actifs}</p>
        </div>
      </div>

      <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="Rechercher par nom, prénom ou matricule..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && charger()}
            style={{ flex: 1, padding: "10px 14px", borderRadius: "8px", border: "1px solid #D1D5DB", fontSize: "13px", color: COULEURS.texte, backgroundColor: "#FFFFFF" }}
          />
          <button onClick={charger} style={{ padding: "10px 20px", borderRadius: "8px", border: "none", backgroundColor: COULEURS.navy, color: "#FFFFFF", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
            Rechercher
          </button>
          <button onClick={() => navigate("/enseignants-ajouter")} style={{ padding: "10px 20px", borderRadius: "8px", border: `2px solid ${COULEURS.navy}`, backgroundColor: "#FFFFFF", color: COULEURS.navy, fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
            + Ajouter un enseignant
          </button>
        </div>

        {erreur && <p style={{ color: COULEURS.rouge, fontSize: "13px" }}>{erreur}</p>}
        {chargement && <p style={{ color: COULEURS.gris, fontSize: "13px" }}>Chargement...</p>}

        {!chargement && !erreur && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #E5E7EB" }}>
                <th style={{ textAlign: "left", padding: "10px", fontSize: "11px", color: COULEURS.gris, textTransform: "uppercase" }}>Enseignant</th>
                <th style={{ textAlign: "left", padding: "10px", fontSize: "11px", color: COULEURS.gris, textTransform: "uppercase" }}>Matière(s)</th>
                <th style={{ textAlign: "left", padding: "10px", fontSize: "11px", color: COULEURS.gris, textTransform: "uppercase" }}>Contrat</th>
                <th style={{ padding: "10px" }}></th>
              </tr>
            </thead>
            <tbody>
              {enseignants.map((e) => {
                const badge = badgeContrat(e.type_contrat);
                return (
                  <tr key={e.id} onClick={() => navigate(`/enseignants/${e.id}`)} style={{ borderBottom: "1px solid #F3F4F6", cursor: "pointer" }}>
                    <td style={{ padding: "12px 10px" }}>
                      <p style={{ margin: 0, fontWeight: "700", fontSize: "13px", color: COULEURS.texte }}>{e.nom} {e.prenom}</p>
                      <p style={{ margin: 0, fontSize: "11px", color: COULEURS.gris }}>{e.matricule}</p>
                    </td>
                    <td style={{ padding: "12px 10px", fontSize: "13px", color: COULEURS.texte }}>{e.matieres?.join(", ") || "—"}</td>
                    <td style={{ padding: "12px 10px" }}>
                      <span style={{ backgroundColor: badge.fond, color: badge.couleur, padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700" }}>{badge.texte}</span>
                    </td>
                    <td style={{ padding: "12px 10px", textAlign: "right", color: COULEURS.gris }}>›</td>
                  </tr>
                );
              })}
              {enseignants.length === 0 && (
                <tr><td colSpan="4" style={{ padding: "24px", textAlign: "center", color: COULEURS.gris, fontSize: "13px" }}>Aucun enseignant trouvé.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
