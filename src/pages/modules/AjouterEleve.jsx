import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { COULEURS } from "../../components/Layout";

const champStyle = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1px solid #D1D5DB",
  fontSize: "13px",
  color: COULEURS.texte,
  backgroundColor: "#FFFFFF",
  boxSizing: "border-box",
  marginBottom: "14px",
};

const labelStyle = {
  fontSize: "12px",
  fontWeight: "700",
  color: COULEURS.texte,
  display: "block",
  marginBottom: "6px",
};

export default function AjouterEleve() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    date_naissance: "",
    lieu_naissance: "",
    classe_id: "",
    pere_nom: "",
    pere_telephone: "",
    mere_nom: "",
    mere_telephone: "",
    tuteur_nom: "",
    tuteur_telephone: "",
    tuteur_lien: "",
  });

  useEffect(() => {
    api.get("/classes").then((res) => setClasses(res.data)).catch(() => {});
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    setChargement(true);
    try {
      await api.post("/eleves", form);
      navigate("/eleves");
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur lors de la création de l'élève.");
    } finally {
      setChargement(false);
    }
  };

  const carte = { backgroundColor: "#FFFFFF", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: "16px" };

  return (
    <div>
      <button onClick={() => navigate("/eleves")} style={{ background: "none", border: "none", color: COULEURS.navy, fontWeight: "700", fontSize: "13px", cursor: "pointer", marginBottom: "16px", padding: 0 }}>
        ← Retour à la liste
      </button>

      <h2 style={{ fontSize: "20px", fontWeight: "800", color: COULEURS.texte, marginBottom: "16px" }}>Ajouter un élève</h2>

      <form onSubmit={handleSubmit}>
        <div style={carte}>
          <p style={{ fontSize: "13px", fontWeight: "700", color: COULEURS.gris, marginBottom: "16px", textTransform: "uppercase" }}>Identité</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={labelStyle}>Nom *</label>
              <input name="nom" value={form.nom} onChange={handleChange} style={champStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Prénom *</label>
              <input name="prenom" value={form.prenom} onChange={handleChange} style={champStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Date de naissance *</label>
              <input type="date" name="date_naissance" value={form.date_naissance} onChange={handleChange} style={champStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Lieu de naissance</label>
              <input name="lieu_naissance" value={form.lieu_naissance} onChange={handleChange} style={champStyle} />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={labelStyle}>Classe *</label>
              <select name="classe_id" value={form.classe_id} onChange={handleChange} style={champStyle} required>
                <option value="">Sélectionner une classe</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nom} ({c.niveau})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div style={carte}>
          <p style={{ fontSize: "13px", fontWeight: "700", color: COULEURS.gris, marginBottom: "16px", textTransform: "uppercase" }}>Filiation</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={labelStyle}>Nom du père</label>
              <input name="pere_nom" value={form.pere_nom} onChange={handleChange} style={champStyle} />
            </div>
            <div>
              <label style={labelStyle}>Téléphone du père</label>
              <input name="pere_telephone" value={form.pere_telephone} onChange={handleChange} style={champStyle} />
            </div>
            <div>
              <label style={labelStyle}>Nom de la mère</label>
              <input name="mere_nom" value={form.mere_nom} onChange={handleChange} style={champStyle} />
            </div>
            <div>
              <label style={labelStyle}>Téléphone de la mère</label>
              <input name="mere_telephone" value={form.mere_telephone} onChange={handleChange} style={champStyle} />
            </div>
          </div>
          <p style={{ fontSize: "12px", fontWeight: "700", color: COULEURS.gris, margin: "16px 0 12px", textTransform: "uppercase" }}>Tuteur (optionnel, si différent des parents)</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            <div>
              <label style={labelStyle}>Nom du tuteur</label>
              <input name="tuteur_nom" value={form.tuteur_nom} onChange={handleChange} style={champStyle} />
            </div>
            <div>
              <label style={labelStyle}>Téléphone du tuteur</label>
              <input name="tuteur_telephone" value={form.tuteur_telephone} onChange={handleChange} style={champStyle} />
            </div>
            <div>
              <label style={labelStyle}>Lien avec l'élève</label>
              <input name="tuteur_lien" value={form.tuteur_lien} onChange={handleChange} style={champStyle} placeholder="ex: Oncle, Grand-mère..." />
            </div>
          </div>
        </div>

        {erreur && <p style={{ color: COULEURS.rouge, fontSize: "13px" }}>{erreur}</p>}

        <button type="submit" disabled={chargement} style={{ padding: "12px 24px", borderRadius: "8px", border: "none", backgroundColor: COULEURS.navy, color: "#FFFFFF", fontWeight: "700", fontSize: "14px", cursor: "pointer" }}>
          {chargement ? "Enregistrement..." : "Enregistrer l'élève"}
        </button>
      </form>
    </div>
  );
}

