// Decoupage des frais de scolarite de l'etablissement (Parametres > Etablissement), modele des
// nouvelles grilles tarifaires : { mode: "trimestriel" | "mensuel" | "libre", mois: [5, 6, 10, ...]
// dans l'ordre de paiement, jour_limite: 10 }.

export const NOMS_MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

// Annee scolaire de 10 mois, d'octobre a juillet : ordre propose pour cocher les mois.
export const MOIS_ANNEE_SCOLAIRE = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8];

export const DECOUPAGE_DEFAUT = { mode: "trimestriel", mois: [], jour_limite: 10 };

export function lireDecoupage(etablissement) {
  const d = etablissement?.decoupage_frais;
  return d && d.mode ? { ...DECOUPAGE_DEFAUT, ...d, mois: d.mois || [] } : DECOUPAGE_DEFAUT;
}

// Annee de debut de l'annee scolaire en cours : a partir d'aout, celle qui commence ; avant, celle
// qui se termine (meme regle que l'installation).
export function anneeScolaireEnCours(aujourdhui = new Date()) {
  return aujourdhui.getMonth() + 1 >= 8 ? aujourdhui.getFullYear() : aujourdhui.getFullYear() - 1;
}

// Dates limites des mois, dans l'ordre de paiement : le premier mois est dans l'annee de debut,
// l'annee avance quand un mois revient en arriere (Mai 2026, Juin 2026, Octobre 2026 ... Avril 2027).
export function datesDesMois(mois, anneeDebut, jourLimite = 10) {
  let annee = anneeDebut;
  let precedent = 0;
  const jour = String(Math.min(28, Math.max(1, Number(jourLimite) || 10))).padStart(2, "0");
  return mois.map((m) => {
    if (precedent && m < precedent) annee += 1;
    precedent = m;
    return `${annee}-${String(m).padStart(2, "0")}-${jour}`;
  });
}

// Montants egaux en GNF entiers ; le dernier prend le reste pour que la somme soit exacte.
export function partsEgales(total, nombre) {
  const base = Math.floor(total / nombre);
  return Array.from({ length: nombre }, (_, i) => (i === nombre - 1 ? total - base * (nombre - 1) : base));
}

// Lignes d'echeances (libelle, montant, date_limite) du modele de l'etablissement pour un montant annuel.
export function echeancesModele(decoupage, montant, anneeDebut = anneeScolaireEnCours()) {
  const total = Math.max(0, Math.round(Number(montant) || 0));
  if (decoupage.mode === "mensuel" && decoupage.mois.length >= 2) {
    const dates = datesDesMois(decoupage.mois, anneeDebut, decoupage.jour_limite);
    const montants = partsEgales(total, decoupage.mois.length);
    return decoupage.mois.map((m, i) => ({ libelle: NOMS_MOIS[m - 1], montant: String(montants[i]), date_limite: dates[i] }));
  }
  if (decoupage.mode === "libre") {
    return [{ libelle: "Paiement unique", montant: String(total), date_limite: "" }];
  }
  // Trimestriel : 40 %, 35 %, 25 % (le dernier trimestre prend l'arrondi).
  const t1 = Math.round(total * 0.4);
  const t2 = Math.round(total * 0.35);
  return [
    { libelle: "Trimestre 1", montant: String(t1), date_limite: "" },
    { libelle: "Trimestre 2", montant: String(t2), date_limite: "" },
    { libelle: "Trimestre 3", montant: String(total - t1 - t2), date_limite: "" },
  ];
}

export function libelleDecoupage(decoupage) {
  if (decoupage.mode === "mensuel") return `${decoupage.mois.length} mensualités (${decoupage.mois.map((m) => NOMS_MOIS[m - 1]).join(", ")}), dues le ${decoupage.jour_limite} du mois`;
  if (decoupage.mode === "libre") return "Découpage libre";
  return "3 trimestres (40 %, 35 %, 25 %)";
}
