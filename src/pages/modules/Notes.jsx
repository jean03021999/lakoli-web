import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { COULEURS } from "../../components/Layout";

export default function Notes({ role }) {
  const [evaluations, setEvaluations] = useState([]);
  const [affectations, setAffectations] = useState([]);
  const [periodes, setPeriodes] = useState([]);
  const [erreur, setErreur] = useState("");
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [form, setForm] = useState({ affectation_id: "", periode_id: "", type: "devoir", libelle: "", date_evaluation: "", bareme: 20 });
  const navigate = useNavigate();

  const vue = role === "DIRECTEUR" ? "direction" : "enseignant";

  const charger = async () => {
    try {
      const res = await api.get("/evaluations", { params: { vue } });
      setEvaluations(res.data);
      if (vue === "enseignant") {
        const resAff = await api.get("/mes-affectations");
        setAffectations(resAff.data);
      }
      const resPer = await api.get("/periodes");
      setPeriodes(resPer.data);
    } catch (err) {
      setErreur(err.response?.data?.message || "Impossible de charger les évaluations.");
    }
  };

  useEffect(() => { charger(); }, [role]);

  const badgeStatut = (statut) => {
    const map = {
      brouillon: { texte: "Brouillon", couleur: COULEURS.gris, fond: COULEURS.grisClair },
      soumis: { texte: "Soumis", couleur: "#D97706", fond: "#FEF3C7" },
      valide: { texte: "Validé", couleur: COULEURS.vert, fond: COULEURS.vertClair },
      rejete: { texte: "Rejeté", couleur: COULEURS.rouge, fond: COULEURS.rougeClair },
      publie: { texte: "Publié", couleur: "#2563EB", fond: "#DBEAFE" },
      archive: { texte: "Archivé", couleur: COULEURS.gris, fond: COULEURS.grisClair },
    };
    return map[statut] || map.brouillon;
  };

  const creerEvaluation = async (e) => {
    e.preventDefault();
    setErreur("");
    try {
      const res = await api.post("/evaluations", form);
      setFormulaireOuvert(false);
      navigate(`/notes/${res.data.id}/saisie`);
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur lors de la création.");
    }
  };

  const carte = { backgroundColor: "#FFFFFF", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" };
  const champStyle = { padding: "10px 12px", borderRadius: "8px", border: "1px solid #D1D5DB", fontSize: "13px", color: COULEURS.texte, backgroundColor: "#FFFFFF" };

  return (
    <div>
      <div style={{ backgroundColor: COULEURS.navy, borderRadius: "16px", padding: "24px", color: "#FFFFFF", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "800", margin: 0 }}>
          {vue === "direction" ? "Validation des Évaluations" : "Gestion des Notes & Évaluations"}
        </h1>
      </div>

      {erreur && <p style={{ color: COULEURS.rouge, fontSize: "13px" }}>{erreur}</p>}

      {vue === "enseignant" && (
        <div style={{ ...carte, marginBottom: "16px" }}>
          <button onClick={() => setFormulaireOuvert(!formulaireOuvert)} style={{ padding: "10px 20px", borderRadius: "8px", border: "none", backgroundColor: COULEURS.navy, color: "#FFFFFF", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
            + Nouvelle évaluation
          </button>

          {formulaireOuvert && (
            <form onSubmit={creerEvaluation} style={{ marginTop: "16px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
              <div>
                <label style={{ fontSize: "11px", color: COULEURS.gris, display: "block", marginBottom: "4px" }}>Classe / Matière</label>
                <select value={form.affectation_id} onChange={(e) => setForm({ ...form, affectation_id: e.target.value })} style={champStyle} required>
                  <option value="">Choisir...</option>
                  {affectations.map((a) => <option key={a.id} value={a.id}>{a.classe?.nom} — {a.matiere?.nom}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "11px", color: COULEURS.gris, display: "block", marginBottom: "4px" }}>Période</label>
                <select value={form.periode_id} onChange={(e) => setForm({ ...form, periode_id: e.target.value })} style={champStyle} required>
                  <option value="">Choisir...</option>
                  {periodes.map((p) => <option key={p.id} value={p.id}>{p.libelle}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "11px", color: COULEURS.gris, display: "block", marginBottom: "4px" }}>Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={champStyle}>
                  <option value="devoir">Devoir</option>
                  <option value="interrogation">Interrogation</option>
                  <option value="composition">Composition</option>
                  <option value="examen_blanc">Examen blanc</option>
                  <option value="oral">Oral</option>
                  <option value="projet">Projet</option>
                  <option value="tp">TP</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "11px", color: COULEURS.gris, display: "block", marginBottom: "4px" }}>Libellé</label>
                <input type="text" value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} style={champStyle} required />
              </div>
              <div>
                <label style={{ fontSize: "11px", color: COULEURS.gris, display: "block", marginBottom: "4px" }}>Date</label>
                <input type="date" value={form.date_evaluation} onChange={(e) => setForm({ ...form, date_evaluation: e.target.value })} style={champStyle} required />
              </div>
              <div>
                <label style={{ fontSize: "11px", color: COULEURS.gris, display: "block", marginBottom: "4px" }}>Barème</label>
                <input type="number" value={form.bareme} onChange={(e) => setForm({ ...form, bareme: e.target.value })} style={{ ...champStyle, width: "70px" }} required />
              </div>
              <button type="submit" style={{ padding: "10px 20px", borderRadius: "8px", border: "none", backgroundColor: COULEURS.vert, color: "#FFFFFF", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
                Créer
              </button>
            </form>
          )}
        </div>
      )}

      <div style={carte}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #E5E7EB" }}>
              <th style={{ textAlign: "left", padding: "10px", fontSize: "11px", color: COULEURS.gris }}>Code</th>
              <th style={{ textAlign: "left", padding: "10px", fontSize: "11px", color: COULEURS.gris }}>Libellé</th>
              <th style={{ textAlign: "left", padding: "10px", fontSize: "11px", color: COULEURS.gris }}>Classe</th>
              <th style={{ textAlign: "left", padding: "10px", fontSize: "11px", color: COULEURS.gris }}>Date</th>
              <th style={{ textAlign: "left", padding: "10px", fontSize: "11px", color: COULEURS.gris }}>Statut</th>
              <th style={{ padding: "10px" }}></th>
            </tr>
          </thead>
          <tbody>
            {evaluations.map((ev) => {
              const badge = badgeStatut(ev.statut);
              return (
                <tr key={ev.id} onClick={() => navigate(vue === "direction" ? `/notes/validation/${ev.id}` : `/notes/${ev.id}/saisie`)} style={{ borderBottom: "1px solid #F3F4F6", cursor: "pointer" }}>
                  <td style={{ padding: "10px", fontSize: "12px", color: COULEURS.gris }}>{ev.code}</td>
                  <td style={{ padding: "10px", fontSize: "13px", fontWeight: "600", color: COULEURS.texte }}>{ev.libelle}</td>
                  <td style={{ padding: "10px", fontSize: "13px", color: COULEURS.texte }}>{ev.affectation?.classe?.nom}</td>
                  <td style={{ padding: "10px", fontSize: "13px", color: COULEURS.texte }}>{ev.date_evaluation}</td>
                  <td style={{ padding: "10px" }}>
                    <span style={{ backgroundColor: badge.fond, color: badge.couleur, padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700" }}>{badge.texte}</span>
                  </td>
                  <td style={{ padding: "10px", textAlign: "right", color: COULEURS.gris }}>›</td>
                </tr>
              );
            })}
            {evaluations.length === 0 && (
              <tr><td colSpan="6" style={{ padding: "24px", textAlign: "center", color: COULEURS.gris, fontSize: "13px" }}>Aucune évaluation.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
