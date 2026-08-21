import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { COULEURS } from "../../components/Layout";

export default function SaisieNotes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState(null);
  const [notes, setNotes] = useState({});
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");

  const charger = async () => {
    try {
      const res = await api.get(`/evaluations/${id}`);
      setEvaluation(res.data);
      const init = {};
      res.data.notes.forEach((n) => { init[n.eleve_id] = { valeur: n.valeur || "", statut_presence: n.statut_presence }; });
      setNotes(init);
    } catch (err) { setErreur("Impossible de charger l'évaluation."); }
  };

  useEffect(() => { charger(); }, [id]);

  const modifierNote = (eleveId, champ, valeur) => {
    setNotes({ ...notes, [eleveId]: { ...notes[eleveId], [champ]: valeur } });
  };

  const enregistrer = async () => {
    setErreur(""); setSucces("");
    try {
      const payload = Object.entries(notes).map(([eleve_id, n]) => ({ eleve_id: parseInt(eleve_id), ...n }));
      await api.put(`/evaluations/${id}/notes`, { notes: payload });
      setSucces("Notes enregistrées.");
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur lors de l'enregistrement.");
    }
  };

  const soumettre = async () => {
    setErreur("");
    try {
      await enregistrer();
      await api.post(`/evaluations/${id}/soumettre`);
      navigate("/notes");
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur lors de la soumission.");
    }
  };

  if (!evaluation) return <p style={{ color: COULEURS.gris }}>Chargement...</p>;

  const carte = { backgroundColor: "#FFFFFF", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" };
  const estBrouillon = evaluation.statut === "brouillon";

  return (
    <div>
      <button onClick={() => navigate("/notes")} style={{ background: "none", border: "none", color: COULEURS.navy, fontWeight: "700", fontSize: "13px", cursor: "pointer", marginBottom: "16px", padding: 0 }}>
        ← Retour à la liste
      </button>

      <div style={{ backgroundColor: COULEURS.navy, borderRadius: "16px", padding: "24px", color: "#FFFFFF", marginBottom: "16px" }}>
        <p style={{ fontSize: "11px", opacity: 0.8, margin: 0 }}>{evaluation.code}</p>
        <h2 style={{ fontSize: "20px", fontWeight: "800", margin: "4px 0" }}>{evaluation.libelle}</h2>
        <p style={{ fontSize: "12px", opacity: 0.85, margin: 0 }}>{evaluation.affectation?.classe?.nom} — {evaluation.affectation?.matiere?.nom} — Barème: {evaluation.bareme}</p>
      </div>

      {!estBrouillon && (
        <div style={{ ...carte, backgroundColor: "#FEF3C7", marginBottom: "16px" }}>
          <p style={{ fontSize: "13px", color: "#D97706", margin: 0, fontWeight: "600" }}>Cette évaluation est au statut "{evaluation.statut}" — les notes ne peuvent plus être modifiées.</p>
        </div>
      )}

      {erreur && <p style={{ color: COULEURS.rouge, fontSize: "13px" }}>{erreur}</p>}
      {succes && <p style={{ color: COULEURS.vert, fontSize: "13px" }}>{succes}</p>}

      <div style={carte}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #E5E7EB" }}>
              <th style={{ textAlign: "left", padding: "10px", fontSize: "11px", color: COULEURS.gris }}>Élève</th>
              <th style={{ textAlign: "left", padding: "10px", fontSize: "11px", color: COULEURS.gris }}>Note / {evaluation.bareme}</th>
              <th style={{ textAlign: "left", padding: "10px", fontSize: "11px", color: COULEURS.gris }}>Présence</th>
            </tr>
          </thead>
          <tbody>
            {evaluation.notes?.map((n) => (
              <tr key={n.eleve_id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                <td style={{ padding: "10px", fontSize: "13px", color: COULEURS.texte }}>{n.eleve?.nom} {n.eleve?.prenom}</td>
                <td style={{ padding: "10px" }}>
                  <input
                    type="number" step="0.5" min="0" max={evaluation.bareme}
                    disabled={!estBrouillon || notes[n.eleve_id]?.statut_presence !== "present"}
                    value={notes[n.eleve_id]?.valeur ?? ""}
                    onChange={(e) => modifierNote(n.eleve_id, "valeur", e.target.value)}
                    style={{ width: "70px", padding: "6px 10px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "13px" }}
                  />
                </td>
                <td style={{ padding: "10px" }}>
                  <select
                    disabled={!estBrouillon}
                    value={notes[n.eleve_id]?.statut_presence || "present"}
                    onChange={(e) => modifierNote(n.eleve_id, "statut_presence", e.target.value)}
                    style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "12px" }}
                  >
                    <option value="present">Présent</option>
                    <option value="absent_justifie">Absent justifié</option>
                    <option value="absent_non_justifie">Absent non justifié</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {estBrouillon && (
          <div style={{ marginTop: "20px", display: "flex", gap: "12px" }}>
            <button onClick={enregistrer} style={{ padding: "12px 24px", borderRadius: "8px", border: `2px solid ${COULEURS.navy}`, backgroundColor: "#FFFFFF", color: COULEURS.navy, fontWeight: "700", cursor: "pointer" }}>
              Enregistrer brouillon
            </button>
            <button onClick={soumettre} style={{ padding: "12px 24px", borderRadius: "8px", border: "none", backgroundColor: COULEURS.navy, color: "#FFFFFF", fontWeight: "700", cursor: "pointer" }}>
              Soumettre à la direction
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
