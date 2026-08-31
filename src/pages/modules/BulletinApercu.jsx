import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { COULEURS } from "../../components/Layout";

export default function BulletinApercu() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bulletin, setBulletin] = useState(null);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    api.get(`/bulletins/${id}`).then((res) => setBulletin(res.data)).catch(() => setErreur("Impossible de charger ce bulletin."));
  }, [id]);

  if (erreur) return <p style={{ color: COULEURS.rouge }}>{erreur}</p>;
  if (!bulletin) return <p style={{ color: COULEURS.gris }}>Chargement...</p>;

  const sommeCoef = bulletin.lignes.reduce((s, l) => s + parseFloat(l.coefficient), 0);
  const sommeValeurs = bulletin.lignes.reduce((s, l) => s + parseFloat(l.valeur_ponderee), 0);

  return (
    <div>
      <button onClick={() => navigate("/bulletins")} style={{ background: "none", border: "none", color: COULEURS.navy, fontWeight: "700", fontSize: "13px", cursor: "pointer", marginBottom: "16px", padding: 0 }}>
        ← Retour à la liste
      </button>

      <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", padding: "32px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", maxWidth: "700px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "24px", borderBottom: `2px solid ${COULEURS.navy}`, paddingBottom: "16px" }}>
          <p style={{ fontSize: "11px", color: COULEURS.gris, margin: 0 }}>RÉPUBLIQUE DE GUINÉE — Travail-Justice-Solidarité</p>
          <h2 style={{ fontSize: "20px", fontWeight: "800", color: COULEURS.navy, margin: "8px 0" }}>BULLETIN DE NOTES</h2>
          <p style={{ fontSize: "13px", color: COULEURS.texte, margin: 0 }}>{bulletin.eleve?.nom} {bulletin.eleve?.prenom}</p>
          <p style={{ fontSize: "12px", color: COULEURS.gris, margin: "4px 0 0" }}>{bulletin.periode?.libelle} — Version {bulletin.version}{bulletin.statut === "remplacee" && " (remplacée)"}</p>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
          <thead>
            <tr style={{ backgroundColor: COULEURS.navy, color: "#FFFFFF" }}>
              <th style={{ padding: "8px", fontSize: "11px", textAlign: "left" }}>Matière</th>
              <th style={{ padding: "8px", fontSize: "11px" }}>Coef.</th>
              <th style={{ padding: "8px", fontSize: "11px" }}>Moyenne</th>
              <th style={{ padding: "8px", fontSize: "11px" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {bulletin.lignes.map((l) => (
              <tr key={l.id} style={{ borderBottom: "1px solid #E5E7EB" }}>
                <td style={{ padding: "8px", fontSize: "13px", color: COULEURS.texte }}>{l.matiere?.nom}</td>
                <td style={{ padding: "8px", fontSize: "13px", textAlign: "center", color: COULEURS.texte }}>{l.coefficient}</td>
                <td style={{ padding: "8px", fontSize: "13px", textAlign: "center", color: COULEURS.texte }}>{l.moyenne_matiere}</td>
                <td style={{ padding: "8px", fontSize: "13px", textAlign: "center", fontWeight: "700", color: COULEURS.texte }}>{l.valeur_ponderee}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: COULEURS.grisClair, fontWeight: "800" }}>
              <td style={{ padding: "10px", fontSize: "13px" }}>TOTAL</td>
              <td style={{ padding: "10px", fontSize: "13px", textAlign: "center" }}>{sommeCoef}</td>
              <td colSpan="2" style={{ padding: "10px", fontSize: "13px", textAlign: "center" }}>{sommeValeurs.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        <div style={{ display: "flex", justifyContent: "space-between", backgroundColor: COULEURS.navyClair, borderRadius: "10px", padding: "16px" }}>
          <div>
            <p style={{ fontSize: "11px", color: COULEURS.gris, margin: 0 }}>MOYENNE GÉNÉRALE</p>
            <p style={{ fontSize: "24px", fontWeight: "800", color: COULEURS.navy, margin: 0 }}>{bulletin.moyenne}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "11px", color: COULEURS.gris, margin: 0 }}>RANG</p>
            <p style={{ fontSize: "24px", fontWeight: "800", color: COULEURS.navy, margin: 0 }}>{bulletin.rang}{bulletin.rang === 1 ? "er" : "e"} / {bulletin.effectif_classe}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
