import { useState } from "react";
import { COULEURS } from "./Layout";

const MATIERES_PAR_NIVEAU = {
  maternelle: ["Langage", "Eveil", "Chant", "EPS", "Arts Plastiques"],
  primaire: ["Calcul", "Francais", "Eveil Scientifique", "Education Civique et Morale", "EPS", "Arts Plastiques", "Chant"],
  college: ["Francais", "Mathematiques", "Anglais", "Histoire", "Geographie", "SVT", "Physique-Chimie", "EPS", "Education Civique", "Arts Plastiques"],
  lycee: ["Francais", "Mathematiques", "Anglais", "Histoire", "Geographie", "Philosophie", "EPS", "Physique-Chimie", "SVT", "Economie", "Biologie", "Chimie"],
};

function getSuggestions(niveau) {
  if (!niveau) return [...new Set(Object.values(MATIERES_PAR_NIVEAU).flat())];
  if (["Petite Section", "Moyenne Section", "Grande Section"].includes(niveau)) return MATIERES_PAR_NIVEAU.maternelle;
  if (["1ere annee","2eme annee","3eme annee","4eme annee","5eme annee","6eme annee"].includes(niveau)) return MATIERES_PAR_NIVEAU.primaire;
  if (["7eme","8eme","9eme","10eme"].includes(niveau)) return MATIERES_PAR_NIVEAU.college;
  return MATIERES_PAR_NIVEAU.lycee;
}

export default function ChampMatiere({ value, onChange, niveau, style, required }) {
  const [ouvert, setOuvert] = useState(false);
  const suggestions = getSuggestions(niveau).filter(s => s.toLowerCase().includes(value.toLowerCase()));

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        placeholder="Ex: Calcul, Français..."
        value={value}
        onChange={(e) => { onChange(e.target.value); setOuvert(true); }}
        onFocus={() => setOuvert(true)}
        onBlur={() => setTimeout(() => setOuvert(false), 150)}
        style={style}
        required={required}
        autoComplete="off"
      />
      {ouvert && suggestions.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, backgroundColor: "#FFFFFF", border: "1px solid #D1D5DB", borderRadius: "8px", zIndex: 100, maxHeight: "200px", overflowY: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
          {suggestions.map((s) => (
            <div
              key={s}
              onMouseDown={() => { onChange(s); setOuvert(false); }}
              style={{ padding: "8px 14px", fontSize: "13px", cursor: "pointer", color: COULEURS.texte }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COULEURS.grisClair}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#FFFFFF"}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
