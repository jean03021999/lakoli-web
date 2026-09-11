import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const C = {
  navy: "#0C447C",
  dark: "#0f172a",
  card: "#1e293b",
  cardBorder: "#334155",
  text: "#f1f5f9",
  textMuted: "#94a3b8",
  vert: "#10b981",
  rouge: "#ef4444",
  orange: "#f59e0b",
  bleu: "#3b82f6",
};

function mention(moyenne) {
  if (moyenne >= 16) return { texte: "Tres Bien", couleur: C.vert };
  if (moyenne >= 14) return { texte: "Bien", couleur: C.bleu };
  if (moyenne >= 12) return { texte: "Assez Bien", couleur: C.orange };
  if (moyenne >= 10) return { texte: "Passage", couleur: C.vert };
  return { texte: "Echec", couleur: C.rouge };
}

export default function Bulletins({ role }) {
  const [classes, setClasses] = useState([]);
  const [periodes, setPeriodes] = useState([]);
  const [classeId, setClasseId] = useState("");
  const [periodeId, setPeriodeId] = useState("");
  const [recherche, setRecherche] = useState("");
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
      setTimeout(() => charger(), 500);
    } catch (err) {
      const manquantes = err.response?.data?.matieres_manquantes;
      if (manquantes?.length > 0) {
        setErreur(`Generation impossible. Matieres sans note publiee : ${manquantes.join(", ")}.`);
      } else {
        setErreur(err.response?.data?.message || "Erreur lors de la generation.");
      }
    } finally {
      setGeneration(false);
    }
  };

  const bulletinsFiltres = bulletins.filter((b) => {
    if (!recherche) return true;
    const r = recherche.toLowerCase();
    return (b.eleve?.nom + " " + b.eleve?.prenom).toLowerCase().includes(r);
  });

  const moyenneClasse = bulletins.length > 0 ? (bulletins.reduce((s, b) => s + parseFloat(b.moyenne), 0) / bulletins.length).toFixed(2) : null;
  const meilleureNote = bulletins.length > 0 ? Math.max(...bulletins.map(b => parseFloat(b.moyenne))).toFixed(2) : null;
  const plusFaible = bulletins.length > 0 ? Math.min(...bulletins.map(b => parseFloat(b.moyenne))).toFixed(2) : null;
  const admis = bulletins.filter(b => parseFloat(b.moyenne) >= 10).length;
  const tauxAdmissibilite = bulletins.length > 0 ? Math.round((admis / bulletins.length) * 100) : null;

  const classeNom = classes.find(c => c.id === parseInt(classeId))?.nom || "";
  const periodeNom = periodes.find(p => p.id === parseInt(periodeId))?.libelle || "";

  const selectStyle = { padding: "10px 16px", borderRadius: "8px", border: "1px solid " + C.cardBorder, backgroundColor: C.card, color: C.text, fontSize: "13px", fontWeight: "600", cursor: "pointer", width: "100%" };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.dark, color: C.text, padding: "0" }}>

      {/* Banniere */}
      <div style={{ background: `linear-gradient(135deg, ${C.navy} 0%, #1e3a5f 100%)`, borderRadius: "16px", padding: "28px 32px", marginBottom: "24px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: "-20px", top: "-20px", opacity: 0.08, fontSize: "160px" }}>📋</div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <span style={{ backgroundColor: "rgba(255,255,255,0.15)", padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" }}>Espace de Travail {role}</span>
        </div>
        <h1 style={{ fontSize: "28px", fontWeight: "800", margin: "0 0 8px", color: "#FFFFFF" }}>Production des Bulletins de Notes</h1>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.75)", margin: 0 }}>Calcul des moyennes trimestrielles, classements et generation des releves de notes officiels.</p>
      </div>

      {/* Sélecteurs */}
      <div style={{ backgroundColor: C.card, borderRadius: "16px", padding: "20px 24px", marginBottom: "20px", border: "1px solid " + C.cardBorder }}>
        <div style={{ display: "flex", gap: "16px", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "180px" }}>
            <label style={{ fontSize: "10px", color: C.textMuted, textTransform: "uppercase", fontWeight: "700", display: "block", marginBottom: "6px" }}>Selectionner la classe</label>
            <select value={classeId} onChange={(e) => setClasseId(e.target.value)} style={selectStyle}>
              <option value="">Choisir une classe...</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: "180px" }}>
            <label style={{ fontSize: "10px", color: C.textMuted, textTransform: "uppercase", fontWeight: "700", display: "block", marginBottom: "6px" }}>Periode scolaire</label>
            <select value={periodeId} onChange={(e) => setPeriodeId(e.target.value)} style={selectStyle}>
              <option value="">Choisir une periode...</option>
              {periodes.map((p) => <option key={p.id} value={p.id}>{p.libelle}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: "180px" }}>
            <label style={{ fontSize: "10px", color: C.textMuted, textTransform: "uppercase", fontWeight: "700", display: "block", marginBottom: "6px" }}>Rechercher un eleve</label>
            <input type="text" placeholder="Nom, matricule..." value={recherche} onChange={(e) => setRecherche(e.target.value)} style={{ ...selectStyle, border: "1px solid " + C.cardBorder }} />
          </div>
          {classeId && periodeId && (
            <button onClick={genererBulletins} disabled={generation} style={{ padding: "10px 20px", borderRadius: "8px", border: "none", backgroundColor: C.bleu, color: "#FFFFFF", fontWeight: "700", fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "6px" }}>
              🔄 {generation ? "Generation..." : "Regenerer la classe"}
            </button>
          )}
        </div>
      </div>

      {erreur && <p style={{ color: C.rouge, fontSize: "13px", marginBottom: "12px" }}>{erreur}</p>}
      {succes && <p style={{ color: C.vert, fontSize: "13px", marginBottom: "12px" }}>{succes}</p>}

      {/* Cartes statistiques */}
      {bulletins.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "20px" }}>
          {[
            { label: "Moyenne de classe", valeur: `${moyenneClasse} / 20`, icon: "📈", couleur: C.bleu },
            { label: "Meilleure moyenne", valeur: `${meilleureNote} / 20`, icon: "🏆", couleur: C.vert },
            { label: "Plus faible moyenne", valeur: `${plusFaible} / 20`, icon: "⚠️", couleur: C.rouge },
            { label: "Taux d'admissibilite", valeur: `${tauxAdmissibilite}% (${admis} / ${bulletins.length})`, icon: "✅", couleur: C.orange },
          ].map((stat) => (
            <div key={stat.label} style={{ backgroundColor: C.card, borderRadius: "12px", padding: "16px 20px", border: "1px solid " + C.cardBorder }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <span style={{ fontSize: "20px" }}>{stat.icon}</span>
                <span style={{ fontSize: "10px", color: C.textMuted, textTransform: "uppercase", fontWeight: "700" }}>{stat.label}</span>
              </div>
              <p style={{ fontSize: "20px", fontWeight: "800", color: stat.couleur, margin: 0 }}>{stat.valeur}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tableau des bulletins */}
      {classeId && periodeId && (
        <div style={{ backgroundColor: C.card, borderRadius: "16px", border: "1px solid " + C.cardBorder, overflow: "hidden" }}>
          {bulletinsFiltres.length > 0 && (
            <div style={{ padding: "16px 24px", borderBottom: "1px solid " + C.cardBorder, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "12px" }}>📋</span>
                <span style={{ fontSize: "12px", color: C.textMuted }}>Periode : {periodeNom} • {bulletins.length} bulletin(s) genere(s)</span>
              </div>
              <span style={{ backgroundColor: C.navy, color: "#FFFFFF", padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" }}>v{bulletinsFiltres[0]?.version || 1}</span>
            </div>
          )}

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                {["Rang", "Nom de l'eleve", "Matricule", "Moyenne generale", "Mention / Decision", "Bulletin"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", fontSize: "10px", color: C.textMuted, textTransform: "uppercase", fontWeight: "700", textAlign: "left", borderBottom: "1px solid " + C.cardBorder }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bulletinsFiltres.map((b) => {
                const m = mention(parseFloat(b.moyenne));
                return (
                  <tr key={b.id} style={{ borderBottom: "1px solid " + C.cardBorder }}>
                    <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: "700", color: C.text }}>
                      {b.rang}{b.rang === 1 ? "er" : "e"}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: C.navy, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "800", color: "#FFFFFF", flexShrink: 0 }}>
                          {b.eleve?.nom?.[0]}{b.eleve?.prenom?.[0]}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: C.text }}>{b.eleve?.nom} {b.eleve?.prenom}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "12px", color: C.textMuted }}>{b.eleve?.matricule || "—"}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ backgroundColor: parseFloat(b.moyenne) >= 10 ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", color: parseFloat(b.moyenne) >= 10 ? C.vert : C.rouge, padding: "4px 12px", borderRadius: "8px", fontSize: "13px", fontWeight: "700" }}>
                        {b.moyenne} / 20
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ backgroundColor: `${m.couleur}22`, color: m.couleur, padding: "4px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>
                        {m.texte}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <button onClick={() => navigate(`/bulletins/${b.id}`)} style={{ padding: "6px 16px", borderRadius: "6px", border: "1px solid " + C.cardBorder, backgroundColor: "transparent", color: C.text, fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
                        Consulter →
                      </button>
                    </td>
                  </tr>
                );
              })}
              {bulletinsFiltres.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: "48px", textAlign: "center", color: C.textMuted, fontSize: "13px" }}>
                    {classeId && periodeId ? "Aucun bulletin genere. Cliquez sur 'Regenerer la classe'." : "Selectionnez une classe et une periode."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {bulletinsFiltres.length > 0 && (
            <div style={{ padding: "12px 24px", borderTop: "1px solid " + C.cardBorder, textAlign: "center" }}>
              <p style={{ fontSize: "11px", color: C.textMuted, margin: 0, fontStyle: "italic" }}>
                Impression securisee LAKOLI • Certifie conforme aux normes scolaires de la Republique de Guinee.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
