// Outils partages du module Parametres (design "Parametres LAKOLI").

export const BLEU = "#0C447C";

export const CHAMP =
  "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/40 text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed";

export const LIBELLES_ROLES = {
  COMPTABLE: "Comptable",
  DIRECTEUR: "Directeur",
  FONDATEUR: "Fondateur",
  PROVISEUR: "Proviseur",
  CENSEUR: "Censeur",
};

export function messageErreur(err, defaut) {
  const erreurs = err.response?.data?.errors;
  return erreurs ? Object.values(erreurs).flat()[0] : err.response?.data?.message || defaut;
}

export function initiales(nom) {
  if (!nom) return "U";
  return nom.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() || "").join("");
}

const MOIS_LONGS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

// "2026-10-01" -> "1 octobre 2026"
export function dateLongue(valeur) {
  const m = String(valeur ?? "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${Number(m[3])} ${MOIS_LONGS[Number(m[2]) - 1]} ${m[1]}` : "—";
}

// Horodatage ISO -> "Aujourd'hui à 09:24", "Hier à 16:42", "25 septembre 2026 à 14:02".
export function momentRelatif(iso) {
  if (!iso) return "Jamais";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const heure = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const jour = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  const ecart = Math.round((aujourdhui - jour) / 86400000);
  if (ecart === 0) return `Aujourd'hui à ${heure}`;
  if (ecart === 1) return `Hier à ${heure}`;
  return `${d.getDate()} ${MOIS_LONGS[d.getMonth()]} ${d.getFullYear()} à ${heure}`;
}

// Navigateur et systeme lisibles depuis un User-Agent ("Chrome 151 · Windows").
export function decrireAppareil(userAgent) {
  const ua = userAgent || "";
  const navigateur =
    (ua.match(/Edg\/(\d+)/) && `Edge ${ua.match(/Edg\/(\d+)/)[1]}`) ||
    (ua.match(/OPR\/(\d+)/) && `Opera ${ua.match(/OPR\/(\d+)/)[1]}`) ||
    (ua.match(/Firefox\/(\d+)/) && `Firefox ${ua.match(/Firefox\/(\d+)/)[1]}`) ||
    (ua.match(/Chrome\/(\d+)/) && `Chrome ${ua.match(/Chrome\/(\d+)/)[1]}`) ||
    (ua.match(/Version\/(\d+).*Safari/) && `Safari ${ua.match(/Version\/(\d+)/)[1]}`) ||
    "Navigateur inconnu";
  const systeme = /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "Système inconnu";
  const mobile = /Android|iPhone|iPad|Mobile/.test(ua);
  return { navigateur, systeme, mobile };
}

// ---------------------------------------------------------------------------
// Apparence : preferences propres a ce navigateur (fond de l'espace de travail, police).
// Layout les applique au chargement et a chaque evenement "lakoli:apparence".
// ---------------------------------------------------------------------------
const CLE_APPARENCE = "lakoli_apparence";
export const EVENEMENT_APPARENCE = "lakoli:apparence";
export const FOND_PAR_DEFAUT = "min-gris-lakoli";

export const POLICES = {
  systeme: { libelle: "Système (défaut)", famille: "", description: "Police native de l'appareil, la plus rapide à afficher" },
  Inter: { libelle: "Inter", famille: "'Inter', sans-serif", description: "Optimisée pour la lisibilité sur écrans administratifs" },
  Roboto: { libelle: "Roboto", famille: "'Roboto', sans-serif", description: "Classique, sobre et géométrique" },
  Poppins: { libelle: "Poppins", famille: "'Poppins', sans-serif", description: "Chaleureuse, aux formes rondes" },
};

export function lireApparence() {
  try {
    return { fond: FOND_PAR_DEFAUT, image: null, police: "systeme", ...JSON.parse(localStorage.getItem(CLE_APPARENCE) || "{}") };
  } catch {
    return { fond: FOND_PAR_DEFAUT, image: null, police: "systeme" };
  }
}

// Retourne false si le navigateur refuse (quota depasse par une image trop lourde, stockage bloque).
export function enregistrerApparence(apparence) {
  try {
    localStorage.setItem(CLE_APPARENCE, JSON.stringify(apparence));
    window.dispatchEvent(new Event(EVENEMENT_APPARENCE));
    return true;
  } catch {
    return false;
  }
}

// Charge la police Google Fonts choisie (une seule fois).
export function chargerPolice(police) {
  if (!POLICES[police]?.famille || document.getElementById(`police-${police}`)) return;
  const lien = document.createElement("link");
  lien.id = `police-${police}`;
  lien.rel = "stylesheet";
  lien.href = `https://fonts.googleapis.com/css2?family=${police}:wght@400;500;600;700;800;900&display=swap`;
  document.head.appendChild(lien);
}

export const CATEGORIES_FONDS = [
  { id: "degrades", libelle: "🎨 Dégradés" },
  { id: "guinee", libelle: "🇬🇳 Guinée" },
  { id: "scolaire", libelle: "🏫 Scolaire" },
  { id: "nature", libelle: "🌿 Nature" },
  { id: "minimaliste", libelle: "⬜ Minimaliste" },
];

export const FONDS = [
  { id: "deg-ocean", nom: "Océan LAKOLI", categorie: "degrades", css: "linear-gradient(135deg, #0C447C, #1a6bb5, #0ea5e9)", description: "Le bleu signature de LAKOLI", badge: "Signature" },
  { id: "deg-nuit-guinee", nom: "Nuit guinéenne", categorie: "degrades", css: "linear-gradient(135deg, #020817, #0C447C, #1e293b)", description: "Profondeur nocturne apaisante" },
  { id: "deg-aurore", nom: "Aurore", categorie: "degrades", css: "linear-gradient(135deg, #7c3aed, #0C447C, #10b981)", description: "Nuances d'aube lumineuse" },
  { id: "deg-coucher-soleil", nom: "Coucher de soleil", categorie: "degrades", css: "linear-gradient(135deg, #dc2626, #f59e0b, #f97316)", description: "Chaleur crépusculaire" },
  { id: "deg-foret", nom: "Forêt", categorie: "degrades", css: "linear-gradient(135deg, #064e3b, #059669, #10b981)", description: "Fraîcheur des massifs forestiers" },
  { id: "deg-ciel-afrique", nom: "Ciel d'Afrique", categorie: "degrades", css: "linear-gradient(135deg, #1e3a5f, #2563eb, #7dd3fc)", description: "Bleu azur tropical" },
  { id: "deg-violet-royal", nom: "Violet royal", categorie: "degrades", css: "linear-gradient(135deg, #4c1d95, #7c3aed, #a78bfa)", description: "Élégance académique" },
  { id: "deg-or-guineen", nom: "Or guinéen", categorie: "degrades", css: "linear-gradient(135deg, #78350f, #d97706, #fbbf24)", description: "Richesse aurifère de Siguiri" },

  { id: "gui-drapeau", nom: "Drapeau guinéen", categorie: "guinee", apercu: "linear-gradient(90deg, #CE1126 33.3%, #FCD116 33.3% 66.6%, #009460 66.6%)", css: "linear-gradient(90deg, rgba(206,17,38,0.12) 0% 33.33%, rgba(252,209,22,0.12) 33.33% 66.66%, rgba(0,148,96,0.12) 66.66% 100%), #ffffff", description: "Rouge, jaune, vert en transparence douce", badge: "National" },
  { id: "gui-savane", nom: "Savane", categorie: "guinee", css: "linear-gradient(180deg, #fef3c7 0%, #fde68a 60%, #92400e 100%)", description: "Savane dorée de Haute-Guinée" },
  { id: "gui-fouta", nom: "Fouta-Djallon", categorie: "guinee", css: "linear-gradient(135deg, #e0f2fe 0%, #7dd3fc 35%, #059669 70%, #065f46 100%)", description: "Château d'eau de l'Afrique de l'Ouest" },
  { id: "gui-conakry-nuit", nom: "Conakry la nuit", categorie: "guinee", css: "radial-gradient(ellipse at bottom, #1e293b 0%, #0f172a 100%)", description: "La presqu'île de Kaloum sous les étoiles" },
  { id: "gui-kente", nom: "Motifs tissés", categorie: "guinee", apercu: "repeating-linear-gradient(45deg, #d97706 0 8px, #059669 8px 16px, #ce1126 16px 24px)", css: "repeating-linear-gradient(45deg, rgba(217,119,6,0.08) 0 8px, rgba(5,150,105,0.08) 8px 16px, rgba(206,17,38,0.08) 16px 24px), #ffffff", description: "Tissage géométrique ouest-africain" },
  { id: "gui-mangroves", nom: "Mangroves", categorie: "guinee", css: "linear-gradient(135deg, #064e3b, #065f46, #047857)", description: "Côte maritime et estuaires" },

  { id: "sco-tableau-noir", nom: "Tableau noir", categorie: "scolaire", css: "#1a2332", description: "Ambiance ardoise de salle de classe" },
  { id: "sco-bibliotheque", nom: "Bibliothèque", categorie: "scolaire", css: "linear-gradient(180deg, #fdf8f0 0%, #fef3c7 100%)", description: "Parchemin et sérénité" },
  { id: "sco-papier-ligne", nom: "Papier ligné", categorie: "scolaire", apercu: "repeating-linear-gradient(#ffffff, #ffffff 18px, #93c5fd 19px, #93c5fd 20px)", css: "linear-gradient(90deg, transparent 59px, #ef4444 60px, transparent 61px), repeating-linear-gradient(#ffffff, #ffffff 27px, #e2e8f0 28px)", description: "Cahier d'écolier avec marge rouge" },
  { id: "sco-constellation", nom: "Constellation", categorie: "scolaire", css: "radial-gradient(circle, #38bdf8 1px, #0f172a 1px) 0 0 / 16px 16px", description: "Carte du ciel étoilé" },
  { id: "sco-ardoise", nom: "Ardoise", categorie: "scolaire", css: "linear-gradient(135deg, #1e2832, #111827)", description: "Surface mate anthracite" },
  { id: "sco-diplome-dore", nom: "Diplôme doré", categorie: "scolaire", css: "linear-gradient(135deg, #ffffff 70%, #fef3c7 100%)", description: "Prestige des distinctions" },

  { id: "nat-brume-matinale", nom: "Brume matinale", categorie: "nature", css: "linear-gradient(135deg, #e0f2fe, #bae6fd, #f0fdf4)", description: "Fraîcheur des matins de rentrée" },
  { id: "nat-foret-guineenne", nom: "Forêt guinéenne", categorie: "nature", css: "linear-gradient(135deg, #064e3b, #022c22)", description: "Canopée des monts Nimba" },
  { id: "nat-ocean-atlantique", nom: "Océan Atlantique", categorie: "nature", css: "linear-gradient(135deg, #0c4a6e, #0369a1, #0ea5e9)", description: "Vagues des îles de Loos" },
  { id: "nat-ciel-nuageux", nom: "Ciel nuageux", categorie: "nature", css: "linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)", description: "Doux et sans éblouissement" },
  { id: "nat-savane-doree", nom: "Savane dorée", categorie: "nature", css: "linear-gradient(135deg, #fef3c7, #fde68a)", description: "Champs de fonio lumineux" },
  { id: "nat-nuit-etoilee", nom: "Nuit étoilée", categorie: "nature", css: "linear-gradient(180deg, #020617 0%, #0f172a 100%)", description: "Ciel pur du Fouta" },

  { id: "min-blanc-pur", nom: "Blanc pur", categorie: "minimaliste", css: "#ffffff", description: "Contraste net" },
  { id: FOND_PAR_DEFAUT, nom: "Gris LAKOLI", categorie: "minimaliste", css: "#F8FAFC", description: "Teinte LAKOLI par défaut", badge: "Défaut" },
  { id: "min-gris-ardoise", nom: "Gris ardoise", categorie: "minimaliste", css: "#f1f5f9", description: "Nuance ardoise douce" },
  { id: "min-gris-chaud", nom: "Gris chaud", categorie: "minimaliste", css: "#fafaf9", description: "Pierre calcaire chaleureuse" },
  { id: "min-beige-doux", nom: "Beige doux", categorie: "minimaliste", css: "#fdf8f0", description: "Confort de lecture prolongée" },
  { id: "min-bleu-glace", nom: "Bleu glacé", categorie: "minimaliste", css: "#f0f9ff", description: "Pointe polaire rafraîchissante" },
];

// Valeur CSS du fond a appliquer a la zone de contenu.
export function cssFond(apparence) {
  if (apparence.image) return `url('${apparence.image}') center / cover no-repeat`;
  return (FONDS.find((f) => f.id === apparence.fond) || FONDS.find((f) => f.id === FOND_PAR_DEFAUT)).css;
}

// Regions administratives et prefectures / communes de Guinee.
export const REGIONS_GUINEE = {
  Conakry: ["Kaloum", "Dixinn", "Matam", "Matoto", "Ratoma", "Gbessia", "Tombolia", "Kagbélen"],
  Kindia: ["Kindia", "Coyah", "Dubréka", "Forécariah", "Télimélé"],
  Boké: ["Boké", "Boffa", "Fria", "Gaoual", "Koundara"],
  Labé: ["Labé", "Koubia", "Lélouma", "Mali", "Tougué"],
  Mamou: ["Mamou", "Dalaba", "Pita"],
  Kankan: ["Kankan", "Kérouané", "Kouroussa", "Mandiana", "Siguiri"],
  Faranah: ["Faranah", "Dabola", "Dinguiraye", "Kissidougou"],
  Nzérékoré: ["Nzérékoré", "Beyla", "Guéckédou", "Lola", "Macenta", "Yomou"],
};

// ---------------------------------------------------------------------------
// Alertes de l'en-tete : quelles notifications afficher (preference de ce navigateur).
// ---------------------------------------------------------------------------
const CLE_ALERTES = "lakoli_alertes";
export const EVENEMENT_ALERTES = "lakoli:alertes";

export function lireAlertes() {
  try {
    return { retards: true, evaluations: true, ...JSON.parse(localStorage.getItem(CLE_ALERTES) || "{}") };
  } catch {
    return { retards: true, evaluations: true };
  }
}

export function enregistrerAlertes(alertes) {
  try {
    localStorage.setItem(CLE_ALERTES, JSON.stringify(alertes));
    window.dispatchEvent(new Event(EVENEMENT_ALERTES));
    return true;
  } catch {
    return false;
  }
}
