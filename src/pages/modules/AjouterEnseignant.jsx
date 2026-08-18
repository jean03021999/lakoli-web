import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { COULEURS } from "../../components/Layout";

const champStyle = { width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #D1D5DB", fontSize: "13px", color: COULEURS.texte, backgroundColor: "#FFFFFF", boxSizing: "border-box", marginBottom: "14px" };
const labelStyle = { fontSize: "12px", fontWeight: "700", color: COULEURS.texte, display: "block", marginBottom: "6px" };

export default function AjouterEnseignant() {
  const navigate = useNavigate();
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);
  const [form, setForm] = useState({
    nom: "", prenom: "", date_naissance: "", lieu_naissance: "", diplome: "", telephone: "", email: "",
    type_contrat: "cdi", salaire_base: "", taux_horaire_heures_sup: "", date_debut_contrat: "",
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    setChargement(true);
    try {
      await api.post("/enseignants", form);
      navigate("/enseignants");
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur lors de la création.");
    } finally {
      setChargement(false);
    }
  };

  const carte = { backgroundColor: "#FFFFFF", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: "16px" };

  return (
    <div>
      <button onClick={() => navigate("/enseignants")} style={{ background: "none", border: "none", color: COULEURS.navy, fontWeight: "700", fontSize: "13px", cursor: "pointer", marginBottom: "16px", padding: 0 }}>
        ← Retour à la liste
      </button>
      <h2 style={{ fontSize: "20px", fontWeight: "800", color: COULEURS.texte, marginBottom: "16px" }}>Ajouter un enseignant</h2>

      <form onSubmit={handleSubmit}>
        <div style={carte}>
          <p style={{ fontSize: "13px", fontWeight: "700", color: COULEURS.gris, marginBottom: "16px", textTransform: "uppercase" }}>Identité</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div><label style={labelStyle}>Nom *</label><input name="nom" value={form.nom} onChange={handleChange} style={champStyle} required /></div>
            <div><label style={labelStyle}>Prénom *</label><input name="prenom" value={form.prenom} onChange={handleChange} style={champStyle} required /></div>
            <div><label style={labelStyle}>Date de naissance *</label><input type="date" name="date_naissance" value={form.date_naissance} onChange={handleChange} style={champStyle} required /></div>
            <div><label style={labelStyle}>Lieu de naissance</label><input name="lieu_naissance" value={form.lieu_naissance} onChange={handleChange} style={champStyle} /></div>
            <div><label style={labelStyle}>Diplôme</label><input name="diplome" value={form.diplome} onChange={handleChange} style={champStyle} /></div>
            <div><label style={labelStyle}>Téléphone</label><input name="telephone" value={form.telephone} onChange={handleChange} style={champStyle} /></div>
            <div style={{ gridColumn: "span 2" }}><label style={labelStyle}>Email</label><input type="email" name="email" value={form.email} onChange={handleChange} style={champStyle} /></div>
          </div>
        </div>

        <div style={carte}>
          <p style={{ fontSize: "13px", fontWeight: "700", color: COULEURS.gris, marginBottom: "16px", textTransform: "uppercase" }}>Contrat</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={labelStyle}>Type de contrat *</label>
              <select name="type_contrat" value={form.type_contrat} onChange={handleChange} style={champStyle}>
                <option value="cdi">CDI</option>
                <option value="cdd">CDD</option>
                <option value="vacataire">Vacataire</option>
              </select>
            </div>
            <div><label style={labelStyle}>Date de début *</label><input type="date" name="date_debut_contrat" value={form.date_debut_contrat} onChange={handleChange} style={champStyle} required /></div>
            <div><label style={labelStyle}>Salaire de base (GNF) *</label><input type="number" name="salaire_base" value={form.salaire_base} onChange={handleChange} style={champStyle} required /></div>
            <div><label style={labelStyle}>Taux horaire heures sup. (GNF)</label><input type="number" name="taux_horaire_heures_sup" value={form.taux_horaire_heures_sup} onChange={handleChange} style={champStyle} /></div>
          </div>
        </div>

        {erreur && <p style={{ color: COULEURS.rouge, fontSize: "13px" }}>{erreur}</p>}

        <button type="submit" disabled={chargement} style={{ padding: "12px 24px", borderRadius: "8px", border: "none", backgroundColor: COULEURS.navy, color: "#FFFFFF", fontWeight: "700", fontSize: "14px", cursor: "pointer" }}>
          {chargement ? "Enregistrement..." : "Enregistrer l'enseignant"}
        </button>
      </form>
    </div>
  );
}
