import { useState } from "react";

const MATIERES_PAR_NIVEAU = {
  maternelle: ["Langage", "Éveil", "Chant et Récitation", "EPS", "Arts Plastiques"],
  primaire: ["Calcul", "Lecture", "Rédaction", "Dictée", "Éveil Scientifique", "Éducation Civique et Morale", "EPS", "Arts Plastiques", "Chant et Récitation"],
  college: ["Dictée", "Rédaction", "Mathématiques", "Anglais", "Histoire-Géographie", "SVT", "Physique-Chimie", "EPS", "Éducation Civique"],
  lycee_scientifique: ["Mathématiques", "Physique-Chimie", "SVT", "Français", "Anglais", "Histoire-Géographie", "EPS", "Philosophie"],
  lycee_litteraire: ["Français", "Anglais", "Histoire-Géographie", "Philosophie", "EPS", "Économie", "Mathématiques"],
  terminale_maths: ["Mathématiques", "Physique-Chimie", "SVT", "Français", "Anglais", "Philosophie", "EPS"],
  terminale_sociales: ["Histoire-Géographie", "Économie", "Philosophie", "Français", "Anglais", "Mathématiques", "EPS"],
  terminale_experimentales: ["SVT", "Physique-Chimie", "Mathématiques", "Français", "Anglais", "Philosophie", "EPS"],
};

const NIVEAU_VERS_CATEGORIE = {
  "Petite Section": "maternelle",
  "Moyenne Section": "maternelle",
  "Grande Section": "maternelle",
  "1ère Année": "primaire",
  "2ème Année": "primaire",
  "3ème Année": "primaire",
  "4ème Année": "primaire",
  "5ème Année": "primaire",
  "6ème Année": "primaire",
  "7ème Année": "college",
  "8ème Année": "college",
  "9ème Année": "college",
  "10ème Année": "college",
  "11ème Année - Série Scientifique": "lycee_scientifique",
  "12ème Année - Série Scientifique": "lycee_scientifique",
  "11ème Année - Série Littéraire": "lycee_litteraire",
  "12ème Année - Série Littéraire": "lycee_litteraire",
  "Terminale - Sciences Mathématiques": "terminale_maths",
  "Terminale - Sciences Sociales": "terminale_sociales",
  "Terminale - Sciences Expérimentales": "terminale_experimentales",
};

export function getSuggestions(niveau) {
  if (!niveau) {
    return Array.from(new Set(Object.values(MATIERES_PAR_NIVEAU).flat()));
  }
  const categorie = NIVEAU_VERS_CATEGORIE[niveau];
  return categorie ? MATIERES_PAR_NIVEAU[categorie] : [];
}

export default function ChampMatiere({ value, onChange, niveau, style, required }) {
  const [ouvert, setOuvert] = useState(false);

  const suggestionsFiltrees = value.trim()
    ? getSuggestions(niveau).filter((m) => m.toLowerCase().includes(value.trim().toLowerCase()))
    : [];

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        placeholder="Ex: Calcul, Français..."
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOuvert(true);
        }}
        onFocus={() => setOuvert(true)}
        onBlur={() => setTimeout(() => setOuvert(false), 150)}
        style={style}
        required={required}
        autoComplete="off"
      />
      {ouvert && suggestionsFiltrees.length > 0 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "100%",
            marginTop: "4px",
            maxHeight: "220px",
            overflowY: "auto",
            backgroundColor: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "10px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            zIndex: 20,
          }}
        >
          {suggestionsFiltrees.map((matiere) => (
            <button
              key={matiere}
              type="button"
              onClick={() => {
                onChange(matiere);
                setOuvert(false);
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "8px 14px",
                fontSize: "13px",
                color: "#1e293b",
                backgroundColor: "transparent",
                border: "none",
                borderBottom: "1px solid #F1F5F9",
                cursor: "pointer",
              }}
            >
              {matiere}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
