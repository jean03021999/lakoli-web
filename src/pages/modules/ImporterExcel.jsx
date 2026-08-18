import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { COULEURS } from "../../components/Layout";

const ETAPES = ["Importer le fichier", "Vérifier les données", "Confirmation"];
const LIGNES_PAR_PAGE = 10;

function Stepper({ etapeActive }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: "24px" }}>
      {ETAPES.map((nom, i) => (
        <div key={nom} style={{ display: "flex", alignItems: "center", flex: i < ETAPES.length - 1 ? 1 : "unset" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "800",
                fontSize: "13px",
                backgroundColor: i <= etapeActive ? COULEURS.navy : COULEURS.grisClair,
                color: i <= etapeActive ? "#FFFFFF" : COULEURS.gris,
                flexShrink: 0,
              }}
            >
              {i < etapeActive ? "✓" : i + 1}
            </div>
            <span style={{ fontSize: "13px", fontWeight: "700", color: i <= etapeActive ? COULEURS.texte : COULEURS.gris, whiteSpace: "nowrap" }}>{nom}</span>
          </div>
          {i < ETAPES.length - 1 && (
            <div style={{ flex: 1, height: "2px", backgroundColor: i < etapeActive ? COULEURS.navy : "#E5E7EB", margin: "0 16px" }} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function ImporterExcel() {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [fichier, setFichier] = useState(null);
  const [survole, setSurvole] = useState(false);
  const [resultat, setResultat] = useState(null);
  const [erreur, setErreur] = useState("");
  const [analyseEnCours, setAnalyseEnCours] = useState(false);
  const [importEnCours, setImportEnCours] = useState(false);
  const [termine, setTermine] = useState(null);
  const [filtreStatut, setFiltreStatut] = useState("tous");
  const [page, setPage] = useState(1);

  const etapeActive = termine !== null ? 2 : resultat ? 1 : 0;

  const formatTaille = (octets) => {
    if (octets < 1024) return `${octets} o`;
    if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(1)} Ko`;
    return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
  };

  const selectionnerFichier = (f) => {
    if (!f) return;
    const extension = f.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(extension)) {
      setErreur("Format non supporté. Utilisez un fichier .xlsx, .xls ou .csv.");
      return;
    }
    setErreur("");
    setFichier(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setSurvole(false);
    selectionnerFichier(e.dataTransfer.files[0]);
  };

  const telechargerModele = async () => {
    try {
      const response = await api.get("/eleves/import/modele", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const lien = document.createElement("a");
      lien.href = url;
      lien.download = "modele_import_eleves_lakoli.xlsx";
      lien.click();
    } catch (err) {
      setErreur("Impossible de télécharger le modèle.");
    }
  };

  const handleAnalyser = async () => {
    if (!fichier) return;
    setErreur("");
    setAnalyseEnCours(true);
    setResultat(null);
    const formData = new FormData();
    formData.append("fichier", fichier);
    try {
      const response = await api.post("/eleves/import/analyser", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResultat(response.data);
      setPage(1);
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur lors de l'analyse du fichier.");
    } finally {
      setAnalyseEnCours(false);
    }
  };

  const handleImporter = async () => {
    const lignesValides = resultat.lignes.filter((l) => l.statut === "ok");
    setImportEnCours(true);
    try {
      const response = await api.post("/eleves/import/executer", { lignes: lignesValides });
      setTermine(response.data.importes);
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur lors de l'import.");
    } finally {
      setImportEnCours(false);
    }
  };

  const recommencer = () => {
    setFichier(null);
    setResultat(null);
    setTermine(null);
    setErreur("");
    setFiltreStatut("tous");
    setPage(1);
  };

  const badgeStatut = (statut) => {
    if (statut === "ok") return { texte: "✓ Valide", couleur: COULEURS.vert, fond: COULEURS.vertClair };
    if (statut === "doublon") return { texte: "🔄 Doublon", couleur: "#D97706", fond: "#FEF3C7" };
    return { texte: "✕ Erreur", couleur: COULEURS.rouge, fond: COULEURS.rougeClair };
  };

  const carte = { backgroundColor: "#FFFFFF", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: "16px" };

  const lignesFiltrees = resultat ? resultat.lignes.filter((l) => filtreStatut === "tous" || l.statut === filtreStatut) : [];
  const totalPages = Math.ceil(lignesFiltrees.length / LIGNES_PAR_PAGE) || 1;
  const lignesPage = lignesFiltrees.slice((page - 1) * LIGNES_PAR_PAGE, page * LIGNES_PAR_PAGE);

  // ÉCRAN FINAL — RAPPORT
  if (termine !== null) {
    return (
      <div>
        <Stepper etapeActive={2} />
        <div style={{ ...carte, textAlign: "center", padding: "48px" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: COULEURS.vertClair, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "28px" }}>✓</div>
          <h2 style={{ color: COULEURS.texte, fontSize: "20px", fontWeight: "800", margin: "0 0 8px" }}>Import terminé</h2>
          <p style={{ color: COULEURS.vert, fontSize: "16px", fontWeight: "700", margin: "0 0 4px" }}>{termine} élève(s) importé(s) avec succès</p>
          {resultat && (resultat.stats.doublons > 0 || resultat.stats.erreurs > 0) && (
            <p style={{ color: COULEURS.gris, fontSize: "13px", margin: "0 0 24px" }}>
              {resultat.stats.doublons > 0 && `${resultat.stats.doublons} doublon(s) ignoré(s)`}
              {resultat.stats.doublons > 0 && resultat.stats.erreurs > 0 && " · "}
              {resultat.stats.erreurs > 0 && `${resultat.stats.erreurs} ligne(s) rejetée(s)`}
            </p>
          )}
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "24px" }}>
            <button onClick={() => navigate("/eleves")} style={{ padding: "12px 24px", borderRadius: "8px", border: "none", backgroundColor: COULEURS.navy, color: "#FFFFFF", fontWeight: "700", cursor: "pointer" }}>
              Voir les élèves importés
            </button>
            <button onClick={recommencer} style={{ padding: "12px 24px", borderRadius: "8px", border: `2px solid ${COULEURS.navy}`, backgroundColor: "#FFFFFF", color: COULEURS.navy, fontWeight: "700", cursor: "pointer" }}>
              Nouvel import
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => navigate("/eleves")} style={{ background: "none", border: "none", color: COULEURS.navy, fontWeight: "700", fontSize: "13px", cursor: "pointer", marginBottom: "16px", padding: 0 }}>
        ← Retour à la liste
      </button>

      <h2 style={{ fontSize: "20px", fontWeight: "800", color: COULEURS.texte, marginBottom: "20px" }}>Importer des élèves depuis Excel</h2>

      <Stepper etapeActive={etapeActive} />

      {/* ÉTAPE 1 — SÉLECTION DU FICHIER */}
      {!resultat && (
        <div style={carte}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <p style={{ fontSize: "13px", color: COULEURS.gris, margin: 0 }}>
              Colonnes reconnues automatiquement : Nom, Prénom, Matricule, Classe, Date de naissance, Lieu de naissance, filiation. La photo n'est pas importée depuis Excel.
            </p>
            <button
              onClick={telechargerModele}
              style={{ padding: "8px 16px", borderRadius: "8px", border: `1px solid ${COULEURS.navy}`, backgroundColor: "#FFFFFF", color: COULEURS.navy, fontWeight: "700", fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap", marginLeft: "16px" }}
            >
              ⬇ Modèle Excel
            </button>
          </div>

          {!fichier ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setSurvole(true); }}
              onDragLeave={() => setSurvole(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              style={{
                border: `2px dashed ${survole ? COULEURS.navy : "#D1D5DB"}`,
                borderRadius: "16px",
                padding: "48px 24px",
                textAlign: "center",
                cursor: "pointer",
                backgroundColor: survole ? COULEURS.navyClair : "#FAFAFA",
                transition: "all 0.15s",
              }}
            >
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>📊</div>
              <p style={{ fontSize: "15px", fontWeight: "700", color: COULEURS.texte, margin: "0 0 4px" }}>
                Glissez-déposez votre fichier Excel ici
              </p>
              <p style={{ fontSize: "13px", color: COULEURS.gris, margin: "0 0 16px" }}>ou</p>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                style={{ padding: "10px 20px", borderRadius: "8px", border: "none", backgroundColor: COULEURS.navy, color: "#FFFFFF", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}
              >
                Parcourir les fichiers
              </button>
              <p style={{ fontSize: "11px", color: COULEURS.gris, marginTop: "16px" }}>
                Formats acceptés : .xlsx, .xls, .csv — Taille maximale : 10 Mo
              </p>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => selectionnerFichier(e.target.files[0])}
                style={{ display: "none" }}
              />
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px", backgroundColor: COULEURS.grisClair, borderRadius: "12px" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "10px", backgroundColor: COULEURS.vertClair, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>📄</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "13px", fontWeight: "700", color: COULEURS.texte, margin: 0 }}>{fichier.name}</p>
                <p style={{ fontSize: "12px", color: COULEURS.gris, margin: "2px 0 0" }}>{formatTaille(fichier.size)} · Prêt à analyser</p>
              </div>
              <button
                onClick={() => { setFichier(null); setErreur(""); }}
                style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #D1D5DB", backgroundColor: "#FFFFFF", color: COULEURS.rouge, fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
              >
                Remplacer
              </button>
            </div>
          )}

          {erreur && <p style={{ color: COULEURS.rouge, fontSize: "13px", marginTop: "12px" }}>{erreur}</p>}

          {fichier && (
            <button
              onClick={handleAnalyser}
              disabled={analyseEnCours}
              style={{ marginTop: "16px", width: "100%", padding: "12px 20px", borderRadius: "8px", border: "none", backgroundColor: COULEURS.navy, color: "#FFFFFF", fontWeight: "700", fontSize: "14px", cursor: "pointer" }}
            >
              {analyseEnCours ? "Analyse en cours..." : "Analyser le fichier →"}
            </button>
          )}
        </div>
      )}

      {/* ÉTAPE 2 — VÉRIFICATION */}
      {resultat && (
        <>
          <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
            <button onClick={() => setFiltreStatut("tous")} style={{ ...carte, flex: 1, margin: 0, cursor: "pointer", border: filtreStatut === "tous" ? `2px solid ${COULEURS.navy}` : "2px solid transparent", textAlign: "left" }}>
              <p style={{ fontSize: "24px", fontWeight: "800", color: COULEURS.texte, margin: 0 }}>{resultat.stats.total}</p>
              <p style={{ fontSize: "12px", color: COULEURS.gris, margin: 0 }}>Total analysées</p>
            </button>
            <button onClick={() => setFiltreStatut("ok")} style={{ ...carte, flex: 1, margin: 0, cursor: "pointer", backgroundColor: COULEURS.vertClair, border: filtreStatut === "ok" ? `2px solid ${COULEURS.vert}` : "2px solid transparent", textAlign: "left" }}>
              <p style={{ fontSize: "24px", fontWeight: "800", color: COULEURS.vert, margin: 0 }}>{resultat.stats.valides}</p>
              <p style={{ fontSize: "12px", color: COULEURS.vert, margin: 0 }}>✓ Valides</p>
            </button>
            <button onClick={() => setFiltreStatut("doublon")} style={{ ...carte, flex: 1, margin: 0, cursor: "pointer", backgroundColor: "#FEF3C7", border: filtreStatut === "doublon" ? "2px solid #D97706" : "2px solid transparent", textAlign: "left" }}>
              <p style={{ fontSize: "24px", fontWeight: "800", color: "#D97706", margin: 0 }}>{resultat.stats.doublons}</p>
              <p style={{ fontSize: "12px", color: "#D97706", margin: 0 }}>🔄 Doublons</p>
            </button>
            <button onClick={() => setFiltreStatut("erreur")} style={{ ...carte, flex: 1, margin: 0, cursor: "pointer", backgroundColor: COULEURS.rougeClair, border: filtreStatut === "erreur" ? `2px solid ${COULEURS.rouge}` : "2px solid transparent", textAlign: "left" }}>
              <p style={{ fontSize: "24px", fontWeight: "800", color: COULEURS.rouge, margin: 0 }}>{resultat.stats.erreurs}</p>
              <p style={{ fontSize: "12px", color: COULEURS.rouge, margin: 0 }}>✕ Erreurs</p>
            </button>
          </div>

          <div style={carte}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #E5E7EB" }}>
                  <th style={{ textAlign: "left", padding: "8px", fontSize: "11px", color: COULEURS.gris }}>Statut</th>
                  <th style={{ textAlign: "left", padding: "8px", fontSize: "11px", color: COULEURS.gris }}>Nom</th>
                  <th style={{ textAlign: "left", padding: "8px", fontSize: "11px", color: COULEURS.gris }}>Prénom</th>
                  <th style={{ textAlign: "left", padding: "8px", fontSize: "11px", color: COULEURS.gris }}>Classe</th>
                  <th style={{ textAlign: "left", padding: "8px", fontSize: "11px", color: COULEURS.gris }}>Détail</th>
                </tr>
              </thead>
              <tbody>
                {lignesPage.map((ligne, i) => {
                  const badge = badgeStatut(ligne.statut);
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #F3F4F6" }}>
                      <td style={{ padding: "10px 8px" }}>
                        <span style={{ backgroundColor: badge.fond, color: badge.couleur, padding: "3px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: "700", whiteSpace: "nowrap" }}>{badge.texte}</span>
                      </td>
                      <td style={{ padding: "10px 8px", fontSize: "13px", color: COULEURS.texte }}>{ligne.nom}</td>
                      <td style={{ padding: "10px 8px", fontSize: "13px", color: COULEURS.texte }}>{ligne.prenom}</td>
                      <td style={{ padding: "10px 8px", fontSize: "13px", color: COULEURS.texte }}>{ligne.classe_nom}</td>
                      <td style={{ padding: "10px 8px", fontSize: "12px", color: COULEURS.gris }}>{ligne.message}</td>
                    </tr>
                  );
                })}
                {lignesPage.length === 0 && (
                  <tr><td colSpan="5" style={{ padding: "24px", textAlign: "center", color: COULEURS.gris, fontSize: "13px" }}>Aucune ligne dans cette catégorie.</td></tr>
                )}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginTop: "16px" }}>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #D1D5DB", backgroundColor: "#FFFFFF", cursor: page === 1 ? "default" : "pointer", opacity: page === 1 ? 0.4 : 1 }}>←</button>
                <span style={{ fontSize: "13px", color: COULEURS.gris }}>Page {page} / {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #D1D5DB", backgroundColor: "#FFFFFF", cursor: page === totalPages ? "default" : "pointer", opacity: page === totalPages ? 0.4 : 1 }}>→</button>
              </div>
            )}

            <div style={{ marginTop: "20px", padding: "16px", backgroundColor: COULEURS.navyClair, borderRadius: "10px" }}>
              <p style={{ fontSize: "13px", color: COULEURS.texte, margin: "0 0 12px", fontWeight: "600" }}>
                {resultat.stats.valides} élève(s) seront importés · {resultat.stats.doublons + resultat.stats.erreurs} ligne(s) seront ignorées
              </p>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={handleImporter}
                  disabled={resultat.stats.valides === 0 || importEnCours}
                  style={{ padding: "12px 24px", borderRadius: "8px", border: "none", backgroundColor: resultat.stats.valides === 0 ? COULEURS.gris : COULEURS.vert, color: "#FFFFFF", fontWeight: "700", cursor: resultat.stats.valides === 0 ? "default" : "pointer" }}
                >
                  {importEnCours ? "Import en cours..." : `Confirmer l'import (${resultat.stats.valides})`}
                </button>
                <button onClick={recommencer} style={{ padding: "12px 24px", borderRadius: "8px", border: `1px solid ${COULEURS.gris}`, backgroundColor: "#FFFFFF", color: COULEURS.texte, fontWeight: "700", cursor: "pointer" }}>
                  Recommencer
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
