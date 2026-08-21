import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { COULEURS } from "../../components/Layout";

export default function ValidationNotes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState(null);
  const [commentaire, setCommentaire] = useState("");
  const [erreur, setErreur] = useState("");
  const [afficherRejet, setAfficherRejet] = useState(false);

  const charger = async () => {
    try {
      const res = await api.get(`/evaluations/${id}`);
      setEvaluation(res.data);
    } catch (err) { setErreur("Impossible de charger l'évaluation."); }
  };

  useEffect(() => { charger(); }, [id]);

  const valider = async () => {
    setErreur("");
    try {
      await api.post(`/evaluations/${id}/valider`);
      navigate("/notes");
    } catch (err) { setErreur(err.response?.data?.message || "Erreur lors de la validation."); }
  };

  const rejeter = async () => {
    setErreur("");
    try {
      await api.post(`/evaluations/${id}/rejeter`, { commentaire });
      navigate("/notes");
    } catch (err) { setErreur(err.response?.data?.message || "Erreur lors du rejet."); }
  };

  const publier = async () => {
    setErreur("");
    try {
      await api.post(`/evaluations/${id}/publier`);
      navigate("/notes");
    } catch (err) { setErreur(err.response?.data?.message || "Erreur lors de la publication."); }
  };

  if (!evaluation) return <p style={{ color: COULEURS.gris }}>Chargement...</p>;

  const carte = { backgroundColor: "#FFFFFF", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" };

  return (
    <div>
      <button onClick={() => navigate("/notes")} style={{ background: "none", border: "none", color: COULEURS.navy, fontWeight: "700", fontSize: "13px", cursor: "pointer", marginBottom: "16px", padding: 0 }}>
        ← Retour
      </button>

      <div style={{ backgroundColor: COULEURS.navy, borderRadius: "16px", padding: "24px", color: "#FFFFFF", marginBottom: "16px" }}>
        <p style={{ fontSize: "11px", opacity: 0.8, margin: 0 }}>{evaluation.code}</p>
        <h2 style={{ fontSize: "20px", fontWeight: "800", margin: "4px 0" }}>{evaluation.libelle}</h2>
        <p style={{ fontSize: "12px", opacity: 0.85, margin: 0 }}>{evaluation.affectation?.classe?.nom} — {evaluation.affectation?.matiere?.nom} — Statut: {evaluation.statut}</p>
      </div>

      {erreur && <p style={{ color: COULEURS.rouge, fontSize: "13px" }}>{erreur}</p>}

      <div style={carte}>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #E5E7EB" }}>
              <th style={{ textAlign: "left", padding: "10px", fontSize: "11px", color: COULEURS.gris }}>Élève</th>
              <th style={{ textAlign: "left", padding: "10px", fontSize: "11px", color: COULEURS.gris }}>Note / {evaluation.bareme}</th>
              <th style={{ textAlign: "left", padding: "10px", fontSize: "11px", color: COULEURS.gris }}>Présence</th>
            </tr>
          </thead>
          <tbody>
            {evaluation.notes?.map((n) => (
              <tr key={n.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                <td style={{ padding: "10px", fontSize: "13px", color: COULEURS.texte }}>{n.eleve?.nom} {n.eleve?.prenom}</td>
                <td style={{ padding: "10px", fontSize: "13px", color: COULEURS.texte }}>{n.valeur ?? "—"}</td>
                <td style={{ padding: "10px", fontSize: "12px", color: COULEURS.gris }}>{n.statut_presence.replace("_", " ")}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {evaluation.statut === "soumis" && (
          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={valider} style={{ padding: "12px 24px", borderRadius: "8px", border: "none", backgroundColor: COULEURS.vert, color: "#FFFFFF", fontWeight: "700", cursor: "pointer" }}>
              ✓ Valider
            </button>
            <button onClick={() => setAfficherRejet(!afficherRejet)} style={{ padding: "12px 24px", borderRadius: "8px", border: `2px solid ${COULEURS.rouge}`, backgroundColor: "#FFFFFF", color: COULEURS.rouge, fontWeight: "700", cursor: "pointer" }}>
              ✕ Rejeter
            </button>
          </div>
        )}

        {evaluation.statut === "valide" && (
          <button onClick={publier} style={{ padding: "12px 24px", borderRadius: "8px", border: "none", backgroundColor: "#2563EB", color: "#FFFFFF", fontWeight: "700", cursor: "pointer" }}>
            📢 Publier
          </button>
        )}

        {afficherRejet && (
          <div style={{ marginTop: "16px" }}>
            <textarea
              placeholder="Motif du rejet (obligatoire)..."
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #D1D5DB", fontSize: "13px", minHeight: "80px", boxSizing: "border-box" }}
            />
            <button onClick={rejeter} disabled={!commentaire} style={{ marginTop: "8px", padding: "10px 20px", borderRadius: "8px", border: "none", backgroundColor: COULEURS.rouge, color: "#FFFFFF", fontWeight: "700", cursor: "pointer" }}>
              Confirmer le rejet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
