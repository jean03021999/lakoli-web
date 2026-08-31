import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { COULEURS } from "../../components/Layout";

export default function Bulletins({ role }) {
  const [classes, setClasses] = useState([]);
  const [periodes, setPeriodes] = useState([]);
  const [classeId, setClasseId] = useState("");
  const [periodeId, setPeriodeId] = useState("");
  const [bulletins, setBulletins] = useState([]);
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  const [generation, setGeneration] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/classes").then((res) => setClasses(res.data));
    api.get("/periodes").then((res) => setPeriodes(res.data));
  }, []);

  const charger = async () => {
    if (!classeId || !periodeId) return;
    setErreur("");
    try {
      const res = await api.get("/bulletins/par-classe", { params: { classe_id: classeId, periode_id: periodeId } });
      setBulletins(res.data);
    } catch (err) {
      setErreur("Impossible de charger les bulletins.");
    }
  };

  useEffect(() => { charger(); }, [classeId, periodeId]);

  const genererBulletins = async () => {
    setGeneration(true);
    setErreur(""); setSucces("");
    try {
      const res = await api.post("/bulletins/generer", { classe_id: classeId, periode_id: periodeId });
      setSucces(res.data.message);
      charger();
    } catch (err) {
      const manquantes = err.response?.data?.matieres_manquantes;
      if (manquantes && manquantes.length > 0) {
        setErreur(`${err.response.data.message} Matières manquantes : ${manquantes.join(", ")}.`);
      } else {
        setErreur(err.response?.data?.message || "Erreur lors de la génération.");
      }
    } finally {
      setGeneration(false);
    }
  };

  const carte = { backgroundColor: "#FFFFFF", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" };
  const champStyle = { padding: "10px 12px", borderRadius: "8px", border: "1px solid #D1D5DB", fontSize: "13px", color: COULEURS.texte, backgroundColor: "#FFFFFF" };

  const rangAffiche = (rang, effectif) => {
    if (!rang) return "—";
    const suffixe = rang === 1 ? "er" : "e";
    return `${rang}${suffixe} / ${effectif}`;
  };

  return (
    <div>
      <div style={{ backgroundColor: COULEURS.navy, borderRadius: "16px", padding: "24px", color: "#FFFFFF", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "800", margin: 0 }}>Production des Bulletins de Notes</h1>
      </div>

      <div style={{ ...carte, marginBottom: "16px", display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
        <div>
          <label style={{ fontSize: "11px", color: COULEURS.gris, display: "block", marginBottom: "4px" }}>Classe</label>
          <select value={classeId} onChange={(e) => setClasseId(e.target.value)} style={champStyle}>
            <option value="">Choisir une classe...</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: "11px", color: COULEURS.gris, display: "block", marginBottom: "4px" }}>Période</label>
          <select value={periodeId} onChange={(e) => setPeriodeId(e.target.value)} style={champStyle}>
            <option value="">Choisir une période...</option>
            {periodes.map((p) => <option key={p.id} value={p.id}>{p.libelle}</option>)}
          </select>
        </div>
        {role === "DIRECTEUR" && classeId && periodeId && (
          <button onClick={genererBulletins} disabled={generation} style={{ padding: "10px 20px", borderRadius: "8px", border: "none", backgroundColor: COULEURS.navy, color: "#FFFFFF", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
            {generation ? "Génération..." : "Générer les bulletins de la classe"}
          </button>
        )}
      </div>

      {erreur && <p style={{ color: COULEURS.rouge, fontSize: "13px" }}>{erreur}</p>}
      {succes && <p style={{ color: COULEURS.vert, fontSize: "13px" }}>{succes}</p>}

      {classeId && periodeId && (
        <div style={carte}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #E5E7EB" }}>
                <th style={{ textAlign: "left", padding: "10px", fontSize: "11px", color: COULEURS.gris }}>Élève</th>
                <th style={{ textAlign: "left", padding: "10px", fontSize: "11px", color: COULEURS.gris }}>Moyenne</th>
                <th style={{ textAlign: "left", padding: "10px", fontSize: "11px", color: COULEURS.gris }}>Rang</th>
                <th style={{ textAlign: "left", padding: "10px", fontSize: "11px", color: COULEURS.gris }}>Version</th>
                <th style={{ padding: "10px" }}></th>
              </tr>
            </thead>
            <tbody>
              {bulletins.map((b) => (
                <tr key={b.id} onClick={() => navigate(`/bulletins/${b.id}`)} style={{ borderBottom: "1px solid #F3F4F6", cursor: "pointer" }}>
                  <td style={{ padding: "10px", fontSize: "13px", fontWeight: "600", color: COULEURS.texte }}>{b.eleve?.nom} {b.eleve?.prenom}</td>
                  <td style={{ padding: "10px", fontSize: "14px", fontWeight: "700", color: COULEURS.navy }}>{b.moyenne}</td>
                  <td style={{ padding: "10px", fontSize: "13px", color: COULEURS.texte }}>{rangAffiche(b.rang, b.effectif_classe)}</td>
                  <td style={{ padding: "10px", fontSize: "12px", color: COULEURS.gris }}>v{b.version}</td>
                  <td style={{ padding: "10px", textAlign: "right", color: COULEURS.gris }}>›</td>
                </tr>
              ))}
              {bulletins.length === 0 && (
                <tr><td colSpan="5" style={{ padding: "24px", textAlign: "center", color: COULEURS.gris, fontSize: "13px" }}>Aucun bulletin généré pour cette classe et cette période.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

