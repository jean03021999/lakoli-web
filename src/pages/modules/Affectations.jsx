import { useState, useEffect } from "react";
import api from "../../services/api";
import ChampMatiere from "../../components/ChampMatiere";
import { COULEURS } from "../../components/Layout";

export default function Affectations() {
  const [affectations, setAffectations] = useState([]);
  const [classes, setClasses] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  const [form, setForm] = useState({ enseignant_id: "", classe_id: "", matiere_id: "", volume_horaire_hebdomadaire: "", est_classe_examen: false });

  const charger = async () => {
    try {
      const [resAff, resClasses, resMat, resEns] = await Promise.all([
        api.get("/affectations"),
        api.get("/classes"),
        api.get("/matieres"),
        api.get("/enseignants"),
      ]);
      setAffectations(resAff.data);
      setClasses(resClasses.data);
      setMatieres(resMat.data.matieres);
      setEnseignants(resEns.data.enseignants);
    } catch (err) {
      setErreur("Impossible de charger les données.");
    }
  };

  useEffect(() => { charger(); }, []);

  const ajouter = async (e) => {
    e.preventDefault();
    setErreur(""); setSucces("");
    try {
      await api.post("/affectations", form);
      setSucces("Affectation créée avec succès.");
      setForm({ enseignant_id: "", classe_id: "", matiere_id: "", volume_horaire_hebdomadaire: "", est_classe_examen: false });
      charger();
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur lors de la création.");
    }
  };

  const supprimer = async (id) => {
    setErreur(""); setSucces("");
    try {
      await api.delete(`/affectations/${id}`);
      setSucces("Affectation supprimée.");
      charger();
    } catch (err) {
      setErreur(err.response?.data?.message || "Impossible de supprimer.");
    }
  };

  const carte = { backgroundColor: "#FFFFFF", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: "16px" };
  const champStyle = { padding: "10px 12px", borderRadius: "8px", border: "1px solid #D1D5DB", fontSize: "13px", color: COULEURS.texte, backgroundColor: "#FFFFFF" };

  return (
    <div>
      <div style={{ backgroundColor: COULEURS.navy, borderRadius: "16px", padding: "24px", color: "#FFFFFF", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "800", margin: 0 }}>Gestion des Affectations</h1>
        <p style={{ fontSize: "13px", opacity: 0.85, margin: "6px 0 0" }}>Lier un enseignant à une classe et une matière.</p>
      </div>

      {erreur && <p style={{ color: COULEURS.rouge, fontSize: "13px", marginBottom: "12px" }}>{erreur}</p>}
      {succes && <p style={{ color: COULEURS.vert, fontSize: "13px", marginBottom: "12px" }}>{succes}</p>}

      <div style={carte}>
        <p style={{ fontSize: "13px", fontWeight: "700", color: COULEURS.gris, marginBottom: "16px", textTransform: "uppercase" }}>Nouvelle affectation</p>
        <form onSubmit={ajouter} style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <label style={{ fontSize: "11px", color: COULEURS.gris, display: "block", marginBottom: "4px" }}>Enseignant</label>
            <select value={form.enseignant_id} onChange={(e) => setForm({ ...form, enseignant_id: e.target.value })} style={champStyle} required>
              <option value="">Choisir...</option>
              {enseignants.map((en) => <option key={en.id} value={en.id}>{en.nom} {en.prenom}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "11px", color: COULEURS.gris, display: "block", marginBottom: "4px" }}>Classe</label>
            <select value={form.classe_id} onChange={(e) => setForm({ ...form, classe_id: e.target.value })} style={champStyle} required>
              <option value="">Choisir...</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "11px", color: COULEURS.gris, display: "block", marginBottom: "4px" }}>Matière</label>
            <ChampMatiere
              value={form.nomMatiere || ""}
              onChange={(val) => {
                const mat = matieres.find(m => m.nom.toLowerCase() === val.toLowerCase());
                setForm({ ...form, nomMatiere: val, matiere_id: mat?.id || "" });
              }}
              niveau={classes.find(c => c.id === parseInt(form.classe_id))?.niveau}
              style={champStyle}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: "11px", color: COULEURS.gris, display: "block", marginBottom: "4px" }}>Volume horaire/semaine</label>
            <input type="number" min="1" value={form.volume_horaire_hebdomadaire} onChange={(e) => setForm({ ...form, volume_horaire_hebdomadaire: e.target.value })} style={{ ...champStyle, width: "80px" }} required />
          </div>
          <div>
            <label style={{ fontSize: "11px", color: COULEURS.gris, display: "block", marginBottom: "4px" }}>Classe d'examen</label>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: COULEURS.texte, padding: "10px 0" }}>
              <input type="checkbox" checked={form.est_classe_examen} onChange={(e) => setForm({ ...form, est_classe_examen: e.target.checked })} />
              Oui
            </label>
          </div>
          <button type="submit" style={{ padding: "10px 20px", borderRadius: "8px", border: "none", backgroundColor: COULEURS.navy, color: "#FFFFFF", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
            Affecter
          </button>
        </form>
      </div>

      <div style={carte}>
        <p style={{ fontSize: "13px", fontWeight: "700", color: COULEURS.gris, marginBottom: "16px", textTransform: "uppercase" }}>Affectations existantes</p>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #E5E7EB" }}>
              <th style={{ textAlign: "left", padding: "10px", fontSize: "11px", color: COULEURS.gris }}>Enseignant</th>
              <th style={{ textAlign: "left", padding: "10px", fontSize: "11px", color: COULEURS.gris }}>Classe</th>
              <th style={{ textAlign: "left", padding: "10px", fontSize: "11px", color: COULEURS.gris }}>Matière</th>
              <th style={{ textAlign: "left", padding: "10px", fontSize: "11px", color: COULEURS.gris }}>H/semaine</th>
              <th style={{ padding: "10px" }}></th>
            </tr>
          </thead>
          <tbody>
            {affectations.map((a) => (
              <tr key={a.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                <td style={{ padding: "10px", fontSize: "13px", color: COULEURS.texte }}>{a.enseignant}</td>
                <td style={{ padding: "10px", fontSize: "13px", color: COULEURS.texte }}>{a.classe}</td>
                <td style={{ padding: "10px", fontSize: "13px", color: COULEURS.texte }}>{a.matiere}</td>
                <td style={{ padding: "10px", fontSize: "13px", color: COULEURS.texte }}>{a.volume_horaire_hebdomadaire}h</td>
                <td style={{ padding: "10px", textAlign: "right" }}>
                  <button onClick={() => supprimer(a.id)} style={{ padding: "4px 10px", borderRadius: "6px", border: `1px solid ${COULEURS.rouge}`, backgroundColor: "#FFFFFF", color: COULEURS.rouge, fontSize: "11px", cursor: "pointer" }}>
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
            {affectations.length === 0 && (
              <tr><td colSpan="5" style={{ padding: "24px", textAlign: "center", color: COULEURS.gris, fontSize: "13px" }}>Aucune affectation créée.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

