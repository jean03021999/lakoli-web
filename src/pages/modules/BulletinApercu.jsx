import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { COULEURS } from "../../components/Layout";

export default function BulletinApercu() {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef();
  const [bulletin, setBulletin] = useState(null);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    api.get(`/bulletins/${id}`)
      .then((res) => setBulletin(res.data))
      .catch(() => setErreur("Impossible de charger ce bulletin."));
  }, [id]);

  const imprimer = () => {
    const contenu = printRef.current.innerHTML;
    const fenetre = window.open("", "_blank");
    fenetre.document.write(`
      <html>
        <head>
          <title>Bulletin de Notes</title>
          <style>
            body { font-family: 'Times New Roman', serif; margin: 20px; color: #000; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; }
            th, td { border: 1px solid #000; padding: 6px 10px; font-size: 13px; }
            th { background-color: #1a3a5c; color: #fff; }
            .entete { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px; }
            .footer { display: flex; justify-content: space-between; margin-top: 32px; }
            .moyenne-box { display: flex; justify-content: space-between; background: #f0f4f8; padding: 12px 20px; border: 1px solid #000; margin-top: 8px; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>${contenu}</body>
      </html>
    `);
    fenetre.document.close();
    fenetre.focus();
    fenetre.print();
    fenetre.close();
  };

  if (erreur) return <p style={{ color: COULEURS.rouge }}>{erreur}</p>;
  if (!bulletin) return <p style={{ color: COULEURS.gris }}>Chargement...</p>;

  const sommeCoef = bulletin.lignes?.reduce((s, l) => s + parseFloat(l.coefficient), 0) || 0;
  const sommeValeurs = bulletin.lignes?.reduce((s, l) => s + parseFloat(l.valeur_ponderee), 0) || 0;

  const mention = (moyenne) => {
    if (moyenne >= 16) return { texte: "Tres Bien", couleur: COULEURS.vert };
    if (moyenne >= 14) return { texte: "Bien", couleur: "#2563EB" };
    if (moyenne >= 12) return { texte: "Assez Bien", couleur: "#D97706" };
    if (moyenne >= 10) return { texte: "Passable", couleur: COULEURS.gris };
    return { texte: "Insuffisant", couleur: COULEURS.rouge };
  };

  const m = mention(parseFloat(bulletin.moyenne));

  return (
    <div>
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
        <button onClick={() => navigate("/bulletins")} style={{ padding: "10px 20px", borderRadius: "8px", border: "none", backgroundColor: COULEURS.gris, color: "#FFFFFF", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
          ← Retour
        </button>
        <button onClick={imprimer} style={{ padding: "10px 20px", borderRadius: "8px", border: "none", backgroundColor: COULEURS.navy, color: "#FFFFFF", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
          🖨️ Imprimer
        </button>
      </div>

      <div ref={printRef} style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", padding: "40px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", maxWidth: "750px", margin: "0 auto" }}>

        {/* En-tête officiel */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px" }}>
          <div>
            <p style={{ margin: 0, fontWeight: "700" }}>REPUBLIQUE DE GUINEE</p>
            <p style={{ margin: 0 }}>Travail - Justice - Solidarite</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontWeight: "700" }}>ANNEE SCOLAIRE</p>
            <p style={{ margin: 0 }}>{bulletin.periode?.libelle || "2025-2026"}</p>
          </div>
        </div>

        <div style={{ textAlign: "center", borderTop: "2px solid " + COULEURS.navy, borderBottom: "2px solid " + COULEURS.navy, padding: "12px 0", margin: "12px 0" }}>
          <p style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: COULEURS.navy, letterSpacing: "2px" }}>BULLETIN DE NOTES</p>
        </div>

        {/* Infos élève */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "20px", fontSize: "13px" }}>
          <div style={{ borderBottom: "1px solid #D1D5DB", paddingBottom: "6px" }}>
            <span style={{ color: COULEURS.gris }}>Nom et Prénom : </span>
            <strong>{bulletin.eleve?.nom} {bulletin.eleve?.prenom}</strong>
          </div>
          <div style={{ borderBottom: "1px solid #D1D5DB", paddingBottom: "6px" }}>
            <span style={{ color: COULEURS.gris }}>Période : </span>
            <strong>{bulletin.periode?.libelle}</strong>
          </div>
          <div style={{ borderBottom: "1px solid #D1D5DB", paddingBottom: "6px" }}>
            <span style={{ color: COULEURS.gris }}>Rang : </span>
            <strong>{bulletin.rang}{bulletin.rang === 1 ? "er" : "e"} / {bulletin.effectif_classe} élèves</strong>
          </div>
          <div style={{ borderBottom: "1px solid #D1D5DB", paddingBottom: "6px" }}>
            <span style={{ color: COULEURS.gris }}>Version : </span>
            <strong>v{bulletin.version}{bulletin.statut === "remplacee" ? " (remplacée)" : ""}</strong>
          </div>
        </div>

        {/* Tableau des notes */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px" }}>
          <thead>
            <tr style={{ backgroundColor: COULEURS.navy, color: "#FFFFFF" }}>
              <th style={{ padding: "10px", fontSize: "12px", textAlign: "left", border: "1px solid #E5E7EB" }}>N°</th>
              <th style={{ padding: "10px", fontSize: "12px", textAlign: "left", border: "1px solid #E5E7EB" }}>Matière</th>
              <th style={{ padding: "10px", fontSize: "12px", textAlign: "center", border: "1px solid #E5E7EB" }}>Coef.</th>
              <th style={{ padding: "10px", fontSize: "12px", textAlign: "center", border: "1px solid #E5E7EB" }}>Moy.</th>
              <th style={{ padding: "10px", fontSize: "12px", textAlign: "center", border: "1px solid #E5E7EB" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {bulletin.lignes?.map((l, i) => (
              <tr key={l.id} style={{ backgroundColor: i % 2 === 0 ? "#F8FAFC" : "#FFFFFF" }}>
                <td style={{ padding: "8px 10px", fontSize: "13px", border: "1px solid #E5E7EB", textAlign: "center" }}>{i + 1}</td>
                <td style={{ padding: "8px 10px", fontSize: "13px", border: "1px solid #E5E7EB", fontWeight: "600" }}>{l.matiere?.nom}</td>
                <td style={{ padding: "8px 10px", fontSize: "13px", border: "1px solid #E5E7EB", textAlign: "center" }}>{l.coefficient}</td>
                <td style={{ padding: "8px 10px", fontSize: "13px", border: "1px solid #E5E7EB", textAlign: "center", fontWeight: "700", color: parseFloat(l.moyenne_matiere) >= 10 ? COULEURS.vert : COULEURS.rouge }}>{l.moyenne_matiere}</td>
                <td style={{ padding: "8px 10px", fontSize: "13px", border: "1px solid #E5E7EB", textAlign: "center", fontWeight: "700" }}>{l.valeur_ponderee}</td>
              </tr>
            ))}
            <tr style={{ backgroundColor: COULEURS.grisClair, fontWeight: "800" }}>
              <td colSpan="2" style={{ padding: "10px", border: "1px solid #E5E7EB", textAlign: "right", fontSize: "13px" }}>TOTAL</td>
              <td style={{ padding: "10px", border: "1px solid #E5E7EB", textAlign: "center", fontSize: "13px" }}>{sommeCoef}</td>
              <td style={{ padding: "10px", border: "1px solid #E5E7EB" }}></td>
              <td style={{ padding: "10px", border: "1px solid #E5E7EB", textAlign: "center", fontSize: "13px" }}>{sommeValeurs.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        {/* Résultat final */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
          <div style={{ flex: 1, backgroundColor: COULEURS.navyClair, borderRadius: "10px", padding: "16px", textAlign: "center", border: `2px solid ${COULEURS.navy}` }}>
            <p style={{ fontSize: "11px", color: COULEURS.gris, margin: 0, textTransform: "uppercase" }}>Moyenne Générale</p>
            <p style={{ fontSize: "32px", fontWeight: "800", color: COULEURS.navy, margin: "4px 0" }}>{bulletin.moyenne}</p>
            <span style={{ backgroundColor: m.couleur, color: "#FFFFFF", padding: "2px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "700" }}>{m.texte}</span>
          </div>
          <div style={{ flex: 1, backgroundColor: COULEURS.grisClair, borderRadius: "10px", padding: "16px", textAlign: "center" }}>
            <p style={{ fontSize: "11px", color: COULEURS.gris, margin: 0, textTransform: "uppercase" }}>Rang / Effectif</p>
            <p style={{ fontSize: "32px", fontWeight: "800", color: COULEURS.texte, margin: "4px 0" }}>{bulletin.rang}{bulletin.rang === 1 ? "er" : "e"}</p>
            <p style={{ fontSize: "13px", color: COULEURS.gris, margin: 0 }}>sur {bulletin.effectif_classe} élèves</p>
          </div>
        </div>

        {/* Zone appréciation et signatures */}
        <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: "20px" }}>
          <div style={{ marginBottom: "20px" }}>
            <p style={{ fontSize: "12px", color: COULEURS.gris, margin: "0 0 8px" }}>Appréciation du conseil des professeurs :</p>
            <div style={{ borderBottom: "1px solid #D1D5DB", height: "24px", marginBottom: "8px" }}></div>
            <div style={{ borderBottom: "1px solid #D1D5DB", height: "24px" }}></div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "32px" }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "12px", color: COULEURS.texte, margin: "0 0 40px" }}>Le Professeur Principal</p>
              <div style={{ borderTop: "1px solid #000", width: "120px", margin: "0 auto" }}></div>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "12px", color: COULEURS.texte, margin: "0 0 40px" }}>Le Directeur / Censeur</p>
              <div style={{ borderTop: "1px solid #000", width: "120px", margin: "0 auto" }}></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
