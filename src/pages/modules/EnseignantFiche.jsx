import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { COULEURS } from "../../components/Layout";

export default function EnseignantFiche() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [enseignant, setEnseignant] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    api.get(`/enseignants/${id}`)
      .then((res) => setEnseignant(res.data))
      .catch((err) => setErreur(err.response?.data?.message || "Impossible de charger la fiche."))
      .finally(() => setChargement(false));
  }, [id]);

  if (chargement) return <p style={{ color: COULEURS.gris }}>Chargement...</p>;
  if (erreur) return <p style={{ color: COULEURS.rouge }}>{erreur}</p>;
  if (!enseignant) return null;

  const contratActif = enseignant.contrats?.find((c) => c.statut === "actif");
  const carte = { backgroundColor: "#FFFFFF", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: "16px" };
  const label = { fontSize: "11px", color: COULEURS.gris, textTransform: "uppercase", fontWeight: "700", margin: 0 };
  const valeur = { fontSize: "14px", color: COULEURS.texte, margin: "4px 0 0", fontWeight: "600" };

  return (
    <div>
      <button onClick={() => navigate("/enseignants")} style={{ background: "none", border: "none", color: COULEURS.navy, fontWeight: "700", fontSize: "13px", cursor: "pointer", marginBottom: "16px", padding: 0 }}>
        ← Retour à la liste
      </button>

      <div style={carte}>
        <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
          <div style={{ width: "72px", height: "72px", borderRadius: "12px", backgroundColor: COULEURS.navyClair, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: "800", color: COULEURS.navy, flexShrink: 0 }}>
            {enseignant.nom?.[0]}{enseignant.prenom?.[0]}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: COULEURS.texte }}>{enseignant.nom} {enseignant.prenom}</h2>
            <p style={{ margin: "4px 0 16px", fontSize: "13px", color: COULEURS.gris }}>{enseignant.matricule}</p>
            <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
              <div><p style={label}>Diplôme</p><p style={valeur}>{enseignant.diplome || "—"}</p></div>
              <div><p style={label}>Téléphone</p><p style={valeur}>{enseignant.telephone || "—"}</p></div>
              <div><p style={label}>Email</p><p style={valeur}>{enseignant.email || "—"}</p></div>
            </div>
          </div>
        </div>
      </div>

      <div style={carte}>
        <p style={{ ...label, marginBottom: "16px" }}>Contrat actif</p>
        {contratActif ? (
          <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
            <div><p style={label}>Type</p><p style={valeur}>{contratActif.type?.toUpperCase()}</p></div>
            <div><p style={label}>Date de début</p><p style={valeur}>{contratActif.date_debut}</p></div>
            <div><p style={label}>Salaire de base</p><p style={valeur}>{contratActif.salaire_base} GNF</p></div>
            {contratActif.taux_horaire_heures_sup && (
              <div><p style={label}>Taux heures sup.</p><p style={valeur}>{contratActif.taux_horaire_heures_sup} GNF/h</p></div>
            )}
          </div>
        ) : (
          <p style={{ fontSize: "13px", color: COULEURS.gris, fontStyle: "italic" }}>Aucun contrat actif.</p>
        )}
      </div>

      <div style={carte}>
        <p style={{ ...label, marginBottom: "16px" }}>Affectations</p>
        {enseignant.affectations?.length > 0 ? (
          enseignant.affectations.map((aff) => (
            <div key={aff.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F3F4F6" }}>
              <span style={{ fontSize: "13px", color: COULEURS.texte }}>{aff.classe?.nom} — {aff.matiere?.nom}</span>
              <div>
                <span style={{ fontSize: "12px", color: COULEURS.gris, marginRight: "8px" }}>{aff.volume_horaire_hebdomadaire}h/semaine</span>
                {aff.est_classe_examen && (
                  <span style={{ backgroundColor: "#FEF3C7", color: "#D97706", padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: "700" }}>Classe d'examen</span>
                )}
              </div>
            </div>
          ))
        ) : (
          <p style={{ fontSize: "13px", color: COULEURS.gris, fontStyle: "italic" }}>Aucune affectation.</p>
        )}
      </div>
    </div>
  );
}
