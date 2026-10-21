import { useState } from "react";

/**
 * Champ de saisie libre avec suggestions filtrees dès la 1ère lettre,
 * dans un dropdown React controle (evite <datalist>, peu fiable sur Safari).
 * L'utilisateur peut toujours valider une valeur absente des suggestions.
 */
// Comparaison sans majuscules ni accents : « labe » trouve « Labé ».
const normaliser = (texte) => texte.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function ChampAutocomplete({ value, onChange, suggestions = [], placeholder, style, className = "", required }) {
  const [ouvert, setOuvert] = useState(false);

  const saisie = normaliser(value.trim());
  const suggestionsFiltrees = saisie
    ? suggestions.filter((s) => normaliser(s).includes(saisie) && normaliser(s) !== saisie)
    : [];

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOuvert(true);
        }}
        onFocus={() => setOuvert(true)}
        onBlur={() => setTimeout(() => setOuvert(false), 150)}
        style={style}
        className={className}
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
          {suggestionsFiltrees.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                onChange(suggestion);
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
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
