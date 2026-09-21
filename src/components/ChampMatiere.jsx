import ChampAutocomplete from "./ChampAutocomplete";

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
  "11ème Année - Série Littéraire": "lycee_litteraire",
  "12ème Année - Série Scientifique": "lycee_scientifique",
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
  return (
    <ChampAutocomplete
      value={value}
      onChange={onChange}
      suggestions={getSuggestions(niveau)}
      placeholder="Ex: Calcul, Français..."
      style={style}
      required={required}
    />
  );
}
