import { useState, useEffect } from "react";
import api from "../../services/api";
import { COULEURS } from "../../components/Layout";

const JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const COULEURS_MATIERES = ["#DBEAFE", "#D1FAE5", "#FEF3C7", "#FEE2E2", "#EDE9FE", "#FCE7F3"];

export default function EmploiDuTemps() {
  const [classes, setClasses] = useState([]);
  const [classeId, setClasseId] = useState("");
  const [creneaux, setCreneaux] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [erreur, setErreur] = useState("");
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [form, setForm] = useState({ jour: "lundi", matiere_id: "", enseignant_id: "", heure_debut: "", heure_fin: "" });

  useEffect(() => {
    api.get("/classes").then((res) => setClasses(res.data));
    api.get("/matieres").then((res) => setMatieres(res.data.matieres));
    api.get("/enseignants").then((res) => setEnseignants(res.data.enseignants));
  }, []);

  const chargerCreneaux = async (id) => {
    setClasseId(id);
    if (!id) { setCreneaux([]); return; }
    try {
      const res = await api.get(`/emploi-du-temps/${id}`);
      setCreneaux(res.data);
    } catch (err) { setErreur("Impossible de charger l'emploi du temps."); }
  };

  const couleurMatiere = (nom) => {
    const index = matieres.findIndex((m) => m.nom === nom);
    return COULEURS_MATIERES[index % COULEURS_MATIERES.length] || COULEURS.grisClair;
  };

  const ajouterCreneau = async (e) => {
    e.preventDefault();
    setErreur("");
    try {
      await api.post("/emploi-du-temps", { classe_id: classeId, ...form });
      setFormulaireOuvert(false);
      setForm({ jour: "lundi", matiere_id: "", enseignant_id: "", heure_debut: "", heure_fin: "" });
      chargerCreneaux(classeId);
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur lors de l'ajout du créneau.");
    }
  };

  const supprimerCreneau = async (id) => {
    await api.delete(`/emploi-du-temps/${id}`);
    chargerCreneaux(classeId);
  };

  const telecharger = async () => {
    try {
      const response = await api.get(`/emploi-du-temps/${classeId}/export`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const lien = document.createElement("a");
      lien.href = url;
      const nomClasse = classes.find((c) => c.id === parseInt(classeId))?.nom || "classe";
      lien.download = `emploi_du_temps_${nomClasse}.xlsx`;
      lien.click();
    } catch (err) {
      setErreur("Impossible de télécharger le fichier.");
    }
  };

  // Construction des lignes horaires uniques, triées
  const horaires = [...new Set(creneaux.map((c) => `${c.heure_debut}-${c.heure_fin}`))].sort();

  const trouverCreneau = (jour, horaire) => {
    const [debut, fin] = horaire.split("-");
    return creneaux.find((c) => c.jour === jour && c.heure_debut === debut && c.heure_fin === fin);
  };

  const carte = { backgroundColor: "#FFFFFF", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" };
  const champStyle = { padding: "10px 12px", borderRadius: "8px", border: "1px solid #D1D5DB", fontSize: "13px", color: COULEURS.texte, backgroundColor: "#FFFFFF" };
  const celluleEntete = { padding: "10px", fontSize: "12px", fontWeight: "800", color: COULEURS.texte, textTransform: "capitalize", backgroundColor: COULEURS.grisClair, border: "1px solid #E5E7EB", textAlign: "center" };

  return (
    <div>
      <div style={{ backgroundColor: COULEURS.navy, borderRadius: "16px", padding: "24px", color: "#FFFFFF", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "800", margin: 0 }}>Gestion des Emplois du Temps</h1>
      </div>

      <div style={{ ...carte, marginBottom: "16px", display: "flex", gap: "12px", alignItems: "center", justifyContent: "space-between" }}>
        <select value={classeId} onChange={(e) => chargerCreneaux(e.target.value)} style={champStyle}>
          <option value="">Sélectionner une classe...</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>

        {classeId && (
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => setFormulaireOuvert(!formulaireOuvert)} style={{ padding: "10px 16px", borderRadius: "8px", border: "none", backgroundColor: COULEURS.navy, color: "#FFFFFF", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
              + Ajouter un cours
            </button>
            <button onClick={telecharger} style={{ padding: "10px 16px", borderRadius: "8px", border: `2px solid ${COULEURS.navy}`, backgroundColor: "#FFFFFF", color: COULEURS.navy, fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
              ⬇ Télécharger
            </button>
          </div>
        )}
      </div>

      {erreur && <p style={{ color: COULEURS.rouge, fontSize: "13px" }}>{erreur}</p>}

      {formulaireOuvert && (
        <div style={{ ...carte, marginBottom: "16px" }}>
          <form onSubmit={ajouterCreneau} style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div>
              <label style={{ fontSize: "11px", color: COULEURS.gris, display: "block", marginBottom: "4px" }}>Jour</label>
              <select value={form.jour} onChange={(e) => setForm({ ...form, jour: e.target.value })} style={champStyle}>
                {JOURS.map((j) => <option key={j} value={j}>{j.charAt(0).toUpperCase() + j.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "11px", color: COULEURS.gris, display: "block", marginBottom: "4px" }}>Matière</label>
              <select value={form.matiere_id} onChange={(e) => setForm({ ...form, matiere_id: e.target.value })} style={champStyle} required>
                <option value="">Choisir...</option>
                {matieres.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "11px", color: COULEURS.gris, display: "block", marginBottom: "4px" }}>Enseignant</label>
              <select value={form.enseignant_id} onChange={(e) => setForm({ ...form, enseignant_id: e.target.value })} style={champStyle} required>
                <option value="">Choisir...</option>
                {enseignants.map((en) => <option key={en.id} value={en.id}>{en.nom} {en.prenom}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "11px", color: COULEURS.gris, display: "block", marginBottom: "4px" }}>Début</label>
              <input type="time" value={form.heure_debut} onChange={(e) => setForm({ ...form, heure_debut: e.target.value })} style={champStyle} required />
            </div>
            <div>
              <label style={{ fontSize: "11px", color: COULEURS.gris, display: "block", marginBottom: "4px" }}>Fin</label>
              <input type="time" value={form.heure_fin} onChange={(e) => setForm({ ...form, heure_fin: e.target.value })} style={champStyle} required />
            </div>
            <button type="submit" style={{ padding: "10px 20px", borderRadius: "8px", border: "none", backgroundColor: COULEURS.vert, color: "#FFFFFF", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
              Ajouter
            </button>
          </form>
        </div>
      )}

      {classeId && (
        <div style={{ ...carte, overflowX: "auto" }}>
          {horaires.length === 0 ? (
            <p style={{ color: COULEURS.gris, fontSize: "13px", textAlign: "center", padding: "24px" }}>Aucun cours planifié. Cliquez sur "+ Ajouter un cours" pour commencer.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
              <thead>
                <tr>
                  <th style={celluleEntete}>Horaire</th>
                  {JOURS.map((j) => <th key={j} style={celluleEntete}>{j}</th>)}
                </tr>
              </thead>
              <tbody>
                {horaires.map((horaire) => (
                  <tr key={horaire}>
                    <td style={{ padding: "8px", fontSize: "12px", fontWeight: "700", color: COULEURS.texte, border: "1px solid #E5E7EB", backgroundColor: COULEURS.grisClair, textAlign: "center", whiteSpace: "nowrap" }}>
                      {horaire.replace("-", " – ")}
                    </td>
                    {JOURS.map((jour) => {
                      const c = trouverCreneau(jour, horaire);
                      return (
                        <td key={jour} style={{ padding: "6px", border: "1px solid #E5E7EB", backgroundColor: c ? couleurMatiere(c.matiere) : "#FFFFFF", verticalAlign: "top" }}>
                          {c && (
                            <div style={{ position: "relative" }}>
                              <p style={{ margin: 0, fontSize: "11px", fontWeight: "700", color: COULEURS.texte }}>{c.matiere}</p>
                              <p style={{ margin: 0, fontSize: "10px", color: COULEURS.gris }}>{c.enseignant}</p>
                              <button onClick={() => supprimerCreneau(c.id)} style={{ position: "absolute", top: "-2px", right: "-2px", border: "none", background: "none", color: COULEURS.rouge, cursor: "pointer", fontSize: "12px" }}>✕</button>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
