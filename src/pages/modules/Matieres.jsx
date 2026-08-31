import { useState, useEffect } from "react";
import api from "../../services/api";
import ChampMatiere from "../../components/ChampMatiere";
import { COULEURS } from "../../components/Layout";

const TOUS_NIVEAUX = ["Petite Section", "Moyenne Section", "Grande Section", "1ere annee", "2eme annee", "3eme annee", "4eme annee", "5eme annee", "6eme annee", "7eme", "8eme", "9eme", "10eme", "11eme", "12eme", "Terminale"];
const NIVEAUX_COLLEGE_LYCEE = ["7eme", "8eme", "9eme", "10eme", "11eme", "12eme", "Terminale"];

const MATIERES_PAR_NIVEAU = {
  primaire: ["Calcul", "Francais", "Eveil Scientifique", "Education Civique et Morale", "EPS", "Arts Plastiques", "Chant"],
  college: ["Francais", "Mathematiques", "Anglais", "Histoire", "Geographie", "SVT", "Physique-Chimie", "EPS", "Education Civique", "Arts Plastiques"],
  lycee: ["Francais", "Mathematiques", "Anglais", "Histoire", "Geographie", "Philosophie", "EPS", "Physique-Chimie", "SVT", "Economie", "Biologie", "Chimie"],
};

const niveauxPrimaire = ["1ere annee", "2eme annee", "3eme annee", "4eme annee", "5eme annee", "6eme annee"];
const niveauxCollege = ["7eme", "8eme", "9eme", "10eme"];

function matieresSuggereesPourNiveau(niveau) {
  if (niveauxPrimaire.includes(niveau)) return MATIERES_PAR_NIVEAU.primaire;
  if (niveauxCollege.includes(niveau)) return MATIERES_PAR_NIVEAU.college;
  if (niveau) return MATIERES_PAR_NIVEAU.lycee;
  return [...new Set([...MATIERES_PAR_NIVEAU.primaire, ...MATIERES_PAR_NIVEAU.college, ...MATIERES_PAR_NIVEAU.lycee])];
}

export default function Matieres() {
  const [matieres, setMatieres] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [classes, setClasses] = useState([]);
  const [nomClasse, setNomClasse] = useState("");
  const [niveauClasse, setNiveauClasse] = useState("");
  const [filiereClasse, setFiliereClasse] = useState("");
  const [nomMatiere, setNomMatiere] = useState("");
  const [coefficient, setCoefficient] = useState("");
  const [compteDansMoyenne, setCompteDansMoyenne] = useState(true);
  const [filiereId, setFiliereId] = useState("");
  const [niveau, setNiveau] = useState("");
  const [nomFiliere, setNomFiliere] = useState("");
  const [erreur, setErreur] = useState("");

  const charger = async () => {
    try {
      const response = await api.get("/matieres");
      setMatieres(response.data.matieres);
      setFilieres(response.data.filieres);
      const resClasses = await api.get("/classes");
      setClasses(resClasses.data);
    } catch (err) {
      setErreur("Impossible de charger les données.");
    }
  };

  const ajouterClasse = async (e) => {
    e.preventDefault();
    setErreur("");
    try {
      await api.post("/classes", { nom: nomClasse, niveau: niveauClasse, filiere_id: filiereClasse || null });
      setNomClasse(""); setNiveauClasse(""); setFiliereClasse("");
      charger();
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur lors de l'ajout de la classe.");
    }
  };

  useEffect(() => { charger(); }, []);

  const ajouterMatiere = async (e) => {
    e.preventDefault();
    try {
      await api.post("/matieres", {
        nom: nomMatiere,
        coefficient: coefficient || null,
        filiere_id: filiereId || null,
        niveau: niveau || null,
        compte_dans_moyenne: compteDansMoyenne,
      });
      setNomMatiere(""); setCoefficient(""); setFiliereId(""); setNiveau(""); setCompteDansMoyenne(true);
      charger();
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur lors de l'ajout.");
    }
  };

  const ajouterFiliere = async (e) => {
    e.preventDefault();
    try {
      await api.post("/filieres", { nom: nomFiliere, niveau_a_partir_de: "11eme" });
      setNomFiliere("");
      charger();
    } catch (err) {
      setErreur("Erreur lors de l'ajout de la filière.");
    }
  };

  const carte = { backgroundColor: "#FFFFFF", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: "16px" };
  const champStyle = { padding: "10px 14px", borderRadius: "8px", border: "1px solid #D1D5DB", fontSize: "13px", color: COULEURS.texte, backgroundColor: "#FFFFFF" };

  return (
    <div>
      <div style={{ backgroundColor: COULEURS.navy, borderRadius: "16px", padding: "24px", color: "#FFFFFF", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "800", margin: 0 }}>Gestion des Matières & Coefficients</h1>
      </div>

      {erreur && <p style={{ color: COULEURS.rouge, fontSize: "13px" }}>{erreur}</p>}

      <div style={carte}>
        <p style={{ fontSize: "13px", fontWeight: "700", color: COULEURS.gris, marginBottom: "16px", textTransform: "uppercase" }}>Ajouter une matière</p>
        <form onSubmit={ajouterMatiere} style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <label style={{ fontSize: "11px", color: COULEURS.gris, display: "block", marginBottom: "4px" }}>Matière</label>
            <ChampMatiere
              value={nomMatiere}
              onChange={setNomMatiere}
              niveau={niveau}
              style={champStyle}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: "11px", color: COULEURS.gris, display: "block", marginBottom: "4px" }}>Coefficient</label>
            <input type="number" value={coefficient} onChange={(e) => setCoefficient(e.target.value)} style={{ ...champStyle, width: "80px" }} />
          </div>
          <div>
            <label style={{ fontSize: "11px", color: COULEURS.gris, display: "block", marginBottom: "4px" }}>Niveau</label>
            <select value={niveau} onChange={(e) => setNiveau(e.target.value)} style={champStyle}>
              <option value="">Tous niveaux</option>
              {NIVEAUX_COLLEGE_LYCEE.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "11px", color: COULEURS.gris, display: "block", marginBottom: "4px" }}>Filière (si Lycée)</label>
            <select value={filiereId} onChange={(e) => setFiliereId(e.target.value)} style={champStyle}>
              <option value="">Aucune</option>
              {filieres.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </select>
          </div>
          <button type="submit" style={{ padding: "10px 20px", borderRadius: "8px", border: "none", backgroundColor: COULEURS.navy, color: "#FFFFFF", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
            Ajouter
          </button>
        </form>
      </div>

      <div style={carte}>
        <p style={{ fontSize: "13px", fontWeight: "700", color: COULEURS.gris, marginBottom: "16px", textTransform: "uppercase" }}>Ajouter une filière (Lycée)</p>
        <form onSubmit={ajouterFiliere} style={{ display: "flex", gap: "10px" }}>
          <input type="text" placeholder="ex: Scientifique, Littéraire..." value={nomFiliere} onChange={(e) => setNomFiliere(e.target.value)} style={{ ...champStyle, flex: 1 }} required />
          <button type="submit" style={{ padding: "10px 20px", borderRadius: "8px", border: `2px solid ${COULEURS.navy}`, backgroundColor: "#FFFFFF", color: COULEURS.navy, fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
            Ajouter la filière
          </button>
        </form>
      </div>

      <div style={carte}>
        <p style={{ fontSize: "13px", fontWeight: "700", color: COULEURS.gris, marginBottom: "16px", textTransform: "uppercase" }}>Ajouter une classe</p>
        <form onSubmit={ajouterClasse} style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input type="text" placeholder="Nom (ex: 6ème A)" value={nomClasse} onChange={(e) => setNomClasse(e.target.value)} style={champStyle} required />
          <select value={niveauClasse} onChange={(e) => setNiveauClasse(e.target.value)} style={champStyle} required>
            <option value="">Niveau...</option>
            {TOUS_NIVEAUX.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <select value={filiereClasse} onChange={(e) => setFiliereClasse(e.target.value)} style={champStyle}>
            <option value="">Sans filière</option>
            {filieres.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
          </select>
          <button type="submit" style={{ padding: "10px 20px", borderRadius: "8px", border: "none", backgroundColor: COULEURS.navy, color: "#FFFFFF", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
            Ajouter la classe
          </button>
        </form>
      </div>

      <div style={carte}>
        <p style={{ fontSize: "13px", fontWeight: "700", color: COULEURS.gris, marginBottom: "16px", textTransform: "uppercase" }}>Classes existantes</p>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #E5E7EB" }}>
              <th style={{ textAlign: "left", padding: "8px", fontSize: "11px", color: COULEURS.gris }}>Classe</th>
              <th style={{ textAlign: "left", padding: "8px", fontSize: "11px", color: COULEURS.gris }}>Niveau</th>
              <th style={{ textAlign: "left", padding: "8px", fontSize: "11px", color: COULEURS.gris }}>Filière</th>
              <th style={{ textAlign: "left", padding: "8px", fontSize: "11px", color: COULEURS.gris }}>Élèves</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((c) => (
              <tr key={c.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                <td style={{ padding: "10px 8px", fontSize: "13px", fontWeight: "600", color: COULEURS.texte }}>{c.nom}</td>
                <td style={{ padding: "10px 8px", fontSize: "13px", color: COULEURS.texte }}>{c.niveau}</td>
                <td style={{ padding: "10px 8px", fontSize: "13px", color: COULEURS.texte }}>{c.filiere || "—"}</td>
                <td style={{ padding: "10px 8px", fontSize: "13px", color: COULEURS.texte }}>{c.nombre_eleves}</td>
              </tr>
            ))}
            {classes.length === 0 && (
              <tr><td colSpan="4" style={{ padding: "24px", textAlign: "center", color: COULEURS.gris, fontSize: "13px" }}>Aucune classe créée.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={carte}>
        <p style={{ fontSize: "13px", fontWeight: "700", color: COULEURS.gris, marginBottom: "16px", textTransform: "uppercase" }}>Matières existantes</p>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #E5E7EB" }}>
              <th style={{ textAlign: "left", padding: "8px", fontSize: "11px", color: COULEURS.gris }}>Matière</th>
              <th style={{ textAlign: "left", padding: "8px", fontSize: "11px", color: COULEURS.gris }}>Coefficients définis</th>
            </tr>
          </thead>
          <tbody>
            {matieres.map((m) => (
              <tr key={m.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                <td style={{ padding: "10px 8px", fontSize: "13px", fontWeight: "600", color: COULEURS.texte }}>{m.nom}</td>
                <td style={{ padding: "10px 8px", fontSize: "12px", color: COULEURS.gris }}>
                  {m.coefficients?.length > 0
                    ? m.coefficients.map((c) => `${c.filiere?.nom || c.niveau || "Général"}: ${c.coefficient}`).join(" · ")
                    : "Non défini"}
                </td>
              </tr>
            ))}
            {matieres.length === 0 && (
              <tr><td colSpan="2" style={{ padding: "24px", textAlign: "center", color: COULEURS.gris, fontSize: "13px" }}>Aucune matière ajoutée.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}







