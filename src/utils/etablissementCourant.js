// Fiche de l'etablissement de l'utilisateur connecte (GET /user), tenue a jour par App au chargement
// et apres chaque modification dans Parametres. Les documents imprimes la completent avec ce que
// leur page leur transmet (parfois seulement le nom), pour afficher partout le logo, les
// coordonnees, l'agrement et le slogan.

let courant = {};

export function definirEtablissement(etablissement) {
  courant = etablissement ? { ...etablissement } : {};
}

// `etablissement` : objet partiel, simple nom (chaine) ou rien.
export function completerEtablissement(etablissement) {
  if (typeof etablissement === "string") return { ...courant, nom: etablissement || courant.nom };
  const renseigne = Object.fromEntries(Object.entries(etablissement || {}).filter(([, v]) => v !== null && v !== undefined && v !== ""));
  return { ...courant, ...renseigne };
}
