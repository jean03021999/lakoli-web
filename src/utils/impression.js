// Documents imprimables (recu de paiement, releve) : HTML complet injecte dans une fenetre
// ouverte avec window.open(), style noir et blanc optimise pour @media print.

import QRCode from "qrcode";
import { completerEtablissement } from "./etablissementCourant";

export function echapperHtml(valeur) {
  return String(valeur ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// QR code en SVG inline : genere localement (aucun service externe), s'imprime net a toute taille.
// Le texte est encode en UTF-8, lisible par l'appareil photo de n'importe quel telephone.
function qrCodeSvg(texte, taille) {
  const { modules } = QRCode.create(texte, { errorCorrectionLevel: "M" });
  const marge = 2;
  const cote = modules.size + marge * 2;
  let chemin = "";
  for (let y = 0; y < modules.size; y++) {
    for (let x = 0; x < modules.size; x++) {
      if (modules.get(y, x)) chemin += `M${x + marge} ${y + marge}h1v1h-1z`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cote} ${cote}" width="${taille}" height="${taille}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${chemin}" fill="#000"/></svg>`;
}

// Montant en texte brut pour le QR code (espaces simples, pas d'entites HTML).
function montantTexte(montant) {
  return String(Math.round(Number(montant) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

// Retourne du HTML sur (chiffres et espaces insecables uniquement) : ne pas l'echapper une 2e fois.
export function formaterMontant(montant) {
  const n = Math.round(Number(montant) || 0);
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "&nbsp;");
}

// "2026-10-05" (ou date ISO) -> "05/10/2026"
export function formaterDate(valeur) {
  const m = String(valeur ?? "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "—";
}

export function formaterHeure(valeur) {
  const d = new Date(valeur);
  const date = Number.isNaN(d.getTime()) ? new Date() : d;
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function dateImpression() {
  return new Date().toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" });
}

// Reference de secours pour un paiement de scolarite ordinaire : le backend ne genere une
// reference (colonne paiements.reference) que pour les frais d'inscription / reinscription.
export function referenceLocale(paiementId, datePaiement) {
  const dateCompacte = String(datePaiement ?? "").replace(/\D/g, "").slice(0, 8);
  return `REF-${paiementId}-${dateCompacte}`;
}

// ---------------------------------------------------------------------------
// Montant en lettres (francais)
// ---------------------------------------------------------------------------
const UNITES = [
  "zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix",
  "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf",
];
const DIZAINES = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante"];

// 0..99. `final` : le nombre termine l'expression ("quatre-vingts" seulement dans ce cas).
function moinsDeCent(n, final) {
  if (n < 20) return UNITES[n];
  const d = Math.floor(n / 10);
  const u = n % 10;
  if (d === 7) return u === 1 ? "soixante et onze" : `soixante-${UNITES[10 + u]}`;
  if (d === 9) return `quatre-vingt-${UNITES[10 + u]}`;
  if (d === 8) return u === 0 ? (final ? "quatre-vingts" : "quatre-vingt") : `quatre-vingt-${UNITES[u]}`;
  if (u === 0) return DIZAINES[d];
  if (u === 1) return `${DIZAINES[d]} et un`;
  return `${DIZAINES[d]}-${UNITES[u]}`;
}

// 1..999
function moinsDeMille(n, final) {
  const c = Math.floor(n / 100);
  const r = n % 100;
  let s = "";
  if (c > 0) {
    s = c === 1 ? "cent" : `${UNITES[c]} cent`;
    if (c > 1 && r === 0 && final) s += "s";
  }
  if (r > 0) s += (s ? " " : "") + moinsDeCent(r, final);
  return s;
}

export function nombreEnLettres(nombre) {
  let n = Math.floor(Math.abs(Number(nombre) || 0));
  if (n === 0) return "zéro";

  const milliards = Math.floor(n / 1e9);
  n %= 1e9;
  const millions = Math.floor(n / 1e6);
  n %= 1e6;
  const milliers = Math.floor(n / 1e3);
  const reste = n % 1e3;

  const parties = [];
  if (milliards) parties.push(`${moinsDeMille(milliards, true)} milliard${milliards > 1 ? "s" : ""}`);
  if (millions) parties.push(`${moinsDeMille(millions, true)} million${millions > 1 ? "s" : ""}`);
  // "mille" est invariable : "deux cent mille", "quatre-vingt mille"
  if (milliers) parties.push(milliers === 1 ? "mille" : `${moinsDeMille(milliers, false)} mille`);
  if (reste) parties.push(moinsDeMille(reste, true));
  return parties.join(" ");
}

// "Un million cinq cent mille francs guinéens"
export function montantEnLettres(montant) {
  const n = Math.round(Number(montant) || 0);
  const texte = `${nombreEnLettres(n)} franc${n > 1 ? "s" : ""} guinéen${n > 1 ? "s" : ""}`;
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

// ---------------------------------------------------------------------------
// Fenetre d'impression
// ---------------------------------------------------------------------------
const LOGO_SVG = `<svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="1.5" y="1.5" width="41" height="41" rx="10" fill="none" stroke="#000" stroke-width="3"/><g transform="translate(10 10)" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></g></svg>`;
// Meme logo, trait blanc : utilise sur fond fonce (en-tete premium du releve).
export const LOGO_SVG_BLANC = LOGO_SVG.split('stroke="#000"').join('stroke="#fff"');

// Logo de l'etablissement (Parametres) s'il existe, sinon le pictogramme LAKOLI.
// `classe` : classe CSS du conteneur (logo-ecole pour les documents A4).
export function logoEcoleHtml(etablissement, classe = "logo-ecole") {
  return etablissement?.logo_url
    ? `<div class="${classe} avec-image"><img src="${echapperHtml(etablissement.logo_url)}" alt=""></div>`
    : `<div class="${classe}">${LOGO_SVG_BLANC}</div>`;
}

// Coordonnees completes de l'etablissement, en une ligne.
export function coordonneesEcole(etablissement) {
  const e = etablissement || {};
  const telephones = [e.telephone, e.telephone_secondaire].filter(Boolean).join(" / ");
  return [
    [e.adresse, e.quartier, e.ville].filter(Boolean).join(", "),
    telephones && `Tél : ${telephones}`,
    e.email,
  ].filter(Boolean);
}

// Agrement et slogan sous le nom de l'etablissement (vide si non renseignes).
export function mentionsEcoleHtml(etablissement) {
  const e = etablissement || {};
  return [
    e.agrement ? `<div class="agrement">Agrément n° ${echapperHtml(e.agrement)}</div>` : "",
    e.slogan ? `<div class="slogan">« ${echapperHtml(e.slogan)} »</div>` : "",
  ].join("");
}

const STYLES = `
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #000; background: #fff; margin: 0; padding: 24px; font-size: 13px; line-height: 1.4; }
  .page { max-width: 760px; margin: 0 auto; }
  .actions { display: flex; gap: 8px; justify-content: flex-end; margin-bottom: 16px; }
  .actions button { padding: 8px 20px; border: 1px solid #000; background: #fff; color: #000; font-size: 13px; font-weight: bold; cursor: pointer; border-radius: 4px; }
  .actions button.primaire { background: #000; color: #fff; }
  .entete { display: flex; align-items: center; justify-content: space-between; gap: 16px; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px; }
  .logo { display: flex; align-items: center; gap: 10px; }
  .logo svg { width: 46px; height: 46px; flex-shrink: 0; }
  .logo .nom { font-size: 22px; font-weight: bold; letter-spacing: 3px; }
  .logo .sous { font-size: 11px; margin-top: 2px; }
  .titre { text-align: right; }
  .titre h1 { margin: 0; font-size: 20px; letter-spacing: 1px; }
  .titre .detail { font-family: "Courier New", monospace; font-size: 12px; margin-top: 4px; }
  .bloc { border: 1px solid #000; margin-bottom: 14px; }
  .bloc h2 { margin: 0; padding: 6px 10px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #000; background: #eee; }
  .bloc .contenu { padding: 8px 10px; }
  table.infos { width: 100%; border-collapse: collapse; }
  table.infos td { padding: 4px 0; vertical-align: top; }
  table.infos td.lib { width: 36%; font-weight: bold; }
  .montant { font-size: 16px; font-weight: bold; }
  .lettres { font-style: italic; }
  .statut-paye { color: #15803d; font-weight: bold; letter-spacing: 0.5px; }
  .statut-partiel { color: #b45309; font-weight: bold; letter-spacing: 0.5px; }
  .statut-partiel .reste { font-weight: normal; }
  table.tableau { width: 100%; border-collapse: collapse; }
  table.tableau th, table.tableau td { border: 1px solid #000; padding: 6px 8px; text-align: left; }
  table.tableau th { background: #eee; font-size: 11px; text-transform: uppercase; }
  table.tableau .droite { text-align: right; }
  table.tableau tr.total td { font-weight: bold; background: #eee; }
  .signatures { display: flex; justify-content: flex-end; margin-top: 40px; }
  .signature { width: 240px; text-align: center; border-top: 1px solid #000; padding-top: 6px; font-size: 11px; }
  .pied { margin-top: 28px; border-top: 1px solid #000; padding-top: 8px; font-size: 11px; text-align: center; }
  .bloc h2, table.tableau th, table.tableau tr.total td { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

  /* Releve de paiements : design premium en couleur, isole sous .doc-releve pour ne jamais
     affecter le recu de paiement (qui reste noir et blanc). */
  .doc-releve * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .doc-releve .entete-premium {
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    background: #0C447C; color: #fff; padding: 20px 24px; border-radius: 10px;
  }
  .doc-releve .entete-premium .logo { display: flex; align-items: center; gap: 10px; }
  .doc-releve .entete-premium .logo svg { width: 46px; height: 46px; flex-shrink: 0; }
  .doc-releve .entete-premium .logo-premium { display: flex; flex-shrink: 0; }
  .doc-releve .entete-premium .logo-premium.avec-image { width: 50px; height: 50px; padding: 3px; border-radius: 10px; background: #fff; }
  .doc-releve .entete-premium .logo-premium img { width: 100%; height: 100%; object-fit: contain; }
  .doc-releve .entete-premium .mentions-premium { margin-top: 4px; font-size: 10px; color: rgba(255, 255, 255, 0.85); }
  .doc-releve .entete-premium .mentions-premium .slogan { font-style: italic; }
  .doc-releve .entete-premium .nom { font-size: 22px; font-weight: bold; letter-spacing: 3px; color: #fff; }
  .doc-releve .entete-premium .badge-etablissement {
    display: inline-block; margin-top: 5px; padding: 3px 10px; border-radius: 999px;
    background: rgba(255, 255, 255, 0.2); color: #fff; font-size: 11px; font-weight: 600;
  }
  .doc-releve .entete-premium .titre h1 { margin: 0; font-size: 20px; letter-spacing: 1px; color: #fff; }

  .doc-releve .bloc-eleve {
    background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
    padding: 14px 18px; margin: 18px 0;
  }
  .doc-releve .bloc-eleve h2 {
    margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #0C447C;
  }

  table.tableau-premium { width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden; }
  table.tableau-premium th {
    background: #0C447C; color: #fff; padding: 10px 12px; text-align: left;
    font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;
  }
  table.tableau-premium td { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; }
  table.tableau-premium .droite { text-align: right; }
  table.tableau-premium tbody tr:nth-child(even) { background: #f8fafc; }
  table.tableau-premium tr.total td { background: #1e293b; color: #fff; font-weight: bold; border-bottom: none; }

  .badge-statut { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: bold; }
  .badge-paye { background: #dcfce7; color: #15803d; }
  .badge-partiel { background: #fff7ed; color: #b45309; }
  .badge-echoir { background: #f1f5f9; color: #64748b; }
  .badge-retard { background: #fee2e2; color: #dc2626; }
  .badge-annule { background: #f1f5f9; color: #64748b; text-decoration: line-through; }
  .doc-releve.rapport tr.annulee td { color: #94a3b8; }
  .doc-releve.rapport .alerte-caisse { margin-top: 8px; padding: 8px 12px; border-radius: 8px; background: #fee2e2; color: #b91c1c; font-size: 12px; font-weight: bold; }
  .doc-releve .signature-zone.double { justify-content: space-between; }
  .doc-releve.lettre-relance .entete-premium .nom { font-size: 19px; letter-spacing: 0.5px; line-height: 1.25; }
  .doc-releve.lettre-relance .corps-lettre { margin-top: 22px; font-size: 13px; line-height: 1.6; color: #1e293b; }
  .doc-releve.lettre-relance .corps-lettre p { margin: 0 0 12px; }
  .doc-releve.lettre-relance .droite-lettre { text-align: right; }
  .doc-releve.lettre-relance .destinataire { margin: 18px 0 20px auto !important; width: 55%; padding: 10px 14px; border-left: 3px solid #0C447C; background: #f8fafc; }
  .doc-releve.lettre-relance table { margin: 6px 0 16px; }

  .doc-releve .signature-zone { display: flex; justify-content: flex-end; margin-top: 50px; }
  .doc-releve .signature-zone .cadre { width: 260px; text-align: center; }
  .doc-releve .signature-zone .ligne { height: 40px; border-top: 1px dashed #64748b; margin-bottom: 6px; }
  .doc-releve .signature-zone .libelle { font-size: 11px; color: #475569; }

  /* Liste des eleves par classe : une page par classe, nom de la classe en grand dans l'en-tete. */
  .doc-releve .entete-premium .titre { text-align: right; }
  .doc-releve .entete-premium .titre .classe { margin-top: 6px; font-size: 26px; font-weight: 800; color: #fff; }
  .doc-releve .entete-premium .titre .session { margin-top: 2px; font-size: 12px; color: rgba(255, 255, 255, 0.8); }
  .doc-releve.liste-classe + .doc-releve.liste-classe { break-before: page; page-break-before: always; }
  .doc-releve .resume-classe { display: flex; gap: 24px; font-size: 12px; color: #475569; margin: 14px 0; }
  .doc-releve .resume-classe strong { color: #0C447C; font-size: 14px; }
  table.tableau-premium td.num { width: 36px; text-align: center; color: #64748b; }
  table.tableau-premium td.mono { font-family: "Courier New", monospace; font-size: 12px; }

  /* Rapport comptable : titres de section, tuiles d'indicateurs, tableaux compacts. */
  .doc-releve.rapport h2.section {
    margin: 22px 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #0C447C;
    border-bottom: 2px solid #0C447C; padding-bottom: 4px; break-after: avoid;
  }
  .doc-releve.rapport .tuiles { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .doc-releve.rapport .tuile { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; background: #f8fafc; break-inside: avoid; }
  .doc-releve.rapport .tuile .lib { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; }
  .doc-releve.rapport .tuile .val { margin-top: 4px; font-size: 17px; font-weight: bold; color: #0C447C; }
  .doc-releve.rapport table.tableau-premium.compact th, .doc-releve.rapport table.tableau-premium.compact td { padding: 6px 8px; font-size: 11.5px; }
  .doc-releve.rapport .indisponible { padding: 10px 12px; border: 1px dashed #f59e0b; border-radius: 8px; background: #fffbeb; color: #b45309; font-size: 12px; }
  .doc-releve.rapport .vide { color: #64748b; font-style: italic; font-size: 12px; }
  .doc-releve.rapport .note { margin: 6px 0 0; color: #64748b; font-size: 11px; }
  .doc-releve.rapport .gris { color: #64748b; font-size: 11px; }

  table.tableau-premium.journal { table-layout: fixed; }
  table.tableau-premium.journal th, table.tableau-premium.journal td { padding: 6px 6px; font-size: 10.5px; word-break: break-word; }
  table.tableau-premium.journal th:nth-child(1) { width: 26px; }
  table.tableau-premium.journal th:nth-child(2) { width: 68px; }
  table.tableau-premium.journal th:nth-child(3) { width: 118px; }
  table.tableau-premium.journal th:nth-child(8) { width: 82px; }
  .doc-releve .repartitions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; }
  .doc-releve .tuile-repartition { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; background: #f8fafc; font-size: 12px; break-inside: avoid; }
  .doc-releve .tuile-repartition strong { display: block; color: #0C447C; margin-bottom: 6px; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
  .doc-releve .tuile-repartition div { display: flex; justify-content: space-between; padding: 2px 0; }
  .doc-releve .pied-premium {
    margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0;
    text-align: center; font-size: 11px; color: #475569;
  }

  /* Releve A4 de l'eleve (design "Prestige academique") : double cadre marine/or, en-tete
     officiel, cartouche 3 colonnes, paves financiers, echeancier et coupon detachable. */
  .releve-a4 { position: relative; padding: 22px 24px; font-size: 11px; }
  .releve-a4 .cadre-a4 { position: absolute; inset: 4px; border: 2px solid rgba(12,68,124,0.4); pointer-events: none; }
  .releve-a4 .cadre-a4::after { content: ""; position: absolute; inset: 3px; border: 1px solid rgba(217,119,6,0.4); }
  .releve-a4 .coin { position: absolute; width: 12px; height: 12px; border-color: #d97706; border-style: solid; border-width: 0; }
  .releve-a4 .coin.hg { top: -5px; left: -5px; border-top-width: 2px; border-left-width: 2px; }
  .releve-a4 .coin.hd { top: -5px; right: -5px; border-top-width: 2px; border-right-width: 2px; }
  .releve-a4 .coin.bg { bottom: -5px; left: -5px; border-bottom-width: 2px; border-left-width: 2px; }
  .releve-a4 .coin.bd { bottom: -5px; right: -5px; border-bottom-width: 2px; border-right-width: 2px; }
  .releve-a4 .mono { font-family: "Courier New", monospace; }
  .releve-a4 .bleu { color: #0C447C; }
  .releve-a4 .vert { color: #047857; }
  .releve-a4 .maj { text-transform: uppercase; }
  .releve-a4 .droite { text-align: right; }
  .releve-a4 .centre { text-align: center; }

  .releve-a4 .entete-a4 { display: flex; align-items: flex-start; gap: 14px; border-bottom: 2px solid #0C447C; padding-bottom: 12px; }
  .releve-a4 .republique { width: 34%; font-size: 9px; color: #475569; }
  .releve-a4 .republique .pays { display: flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 900; letter-spacing: 0.5px; color: #1e293b; }
  .releve-a4 .drapeau { display: inline-flex; width: 26px; height: 12px; border: 1px solid #cbd5e1; }
  .releve-a4 .drapeau i { flex: 1; }
  .releve-a4 .devise { font-style: italic; font-weight: bold; margin-top: 2px; }
  .releve-a4 .ministere { margin-top: 4px; font-weight: 600; text-transform: uppercase; color: #1e293b; font-size: 8.5px; line-height: 1.3; }
  .releve-a4 .ecole { flex: 1; text-align: center; }
  .releve-a4 .logo-ecole { display: inline-flex; width: 44px; height: 44px; padding: 5px; border-radius: 10px; background: #0C447C; }
  .releve-a4 .logo-ecole svg { width: 100%; height: 100%; }
  .releve-a4 .logo-ecole.avec-image { width: 56px; height: 56px; padding: 2px; background: #fff; border: 1px solid #e2e8f0; }
  .releve-a4 .logo-ecole img { width: 100%; height: 100%; object-fit: contain; }
  .releve-a4 .ecole .agrement { margin-top: 2px; font-size: 8.5px; font-weight: 700; color: #334155; }
  .releve-a4 .ecole .slogan { margin-top: 1px; font-size: 9px; font-style: italic; color: #0C447C; }
  .releve-a4 .nom-ecole { margin-top: 4px; font-size: 16px; font-weight: 900; text-transform: uppercase; color: #0C447C; line-height: 1.1; }
  .releve-a4 .coord { margin-top: 3px; font-size: 8.5px; color: #64748b; }
  .releve-a4 .reference { width: 30%; display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
  .releve-a4 .boite-ref { width: 100%; text-align: right; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 6px 8px; }
  .releve-a4 .boite-ref .lib { display: block; font-size: 8px; font-weight: bold; text-transform: uppercase; color: #64748b; }
  .releve-a4 .boite-ref .val { display: block; font-family: "Courier New", monospace; font-size: 11px; font-weight: 800; color: #0C447C; word-break: break-all; }
  .releve-a4 .boite-ref .date { display: block; font-size: 8.5px; color: #475569; margin-top: 2px; }
  .releve-a4 .qr svg { display: block; }

  .releve-a4 .bandeau-titre { margin: 12px 0; padding: 8px 14px; border-radius: 8px; text-align: center; color: #fff;
    background: linear-gradient(135deg, #0C447C 0%, #155b9e 100%); border-top: 2px solid #fbbf24; border-bottom: 2px solid #fbbf24; }
  .releve-a4 .bandeau-titre h1 { margin: 0; font-size: 13px; font-weight: 900; letter-spacing: 0.6px; color: #fde68a; }
  .releve-a4 .bandeau-titre p { margin: 2px 0 0; font-size: 9px; color: rgba(255,255,255,0.85); }

  .releve-a4 .cartouche { display: grid; grid-template-columns: repeat(3, 1fr); background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; }
  .releve-a4 .cartouche .col { display: flex; flex-direction: column; gap: 1px; padding: 0 10px; font-size: 10.5px; color: #1e293b; }
  .releve-a4 .cartouche .col + .col { border-left: 1px solid #e2e8f0; }
  .releve-a4 .cartouche .titre-col { font-size: 8.5px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.6px; color: #0C447C; border-bottom: 1px solid #bfdbfe; padding-bottom: 2px; margin-bottom: 4px; }
  .releve-a4 .cartouche .lib { font-size: 8.5px; color: #64748b; margin-top: 3px; }

  .releve-a4 .paves { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 12px 0; }
  .releve-a4 .pave { border: 1px solid #cbd5e1; border-radius: 8px; padding: 7px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .releve-a4 .pave .lib { font-size: 8px; font-weight: bold; text-transform: uppercase; color: #64748b; }
  .releve-a4 .pave .val { font-size: 13px; font-weight: 900; color: #0f172a; }
  .releve-a4 .pave.gris { background: #f0f4f8; }
  .releve-a4 .pave.vert { background: #ecfdf5; border-color: #6ee7b7; }
  .releve-a4 .pave.vert .val { color: #047857; }
  .releve-a4 .pave.ambre { background: #fffbeb; border-color: #fcd34d; }
  .releve-a4 .pave.ambre .val { color: #b45309; }
  .releve-a4 .pave.rouge { background: #fff1f2; border-color: #fda4af; }
  .releve-a4 .pave.rouge .val { color: #be123c; }
  .releve-a4 .pastille { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 9.5px; font-weight: 900; text-transform: uppercase; border: 1px solid; }
  .releve-a4 .pastille.vert { background: #d1fae5; color: #065f46; border-color: #6ee7b7; }
  .releve-a4 .pastille.ambre { background: #fef3c7; color: #92400e; border-color: #fcd34d; }
  .releve-a4 .pastille.rouge { background: #ffe4e6; color: #9f1239; border-color: #fda4af; }

  .releve-a4 .titre-livre { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: #0C447C; }
  .releve-a4 .titre-livre .devise-legale { font-family: "Courier New", monospace; font-size: 8px; font-weight: normal; text-transform: none; color: #64748b; }
  .releve-a4 table.livre { width: 100%; border-collapse: collapse; font-size: 9.5px; border: 1px solid #cbd5e1; }
  .releve-a4 table.livre th { background: #0C447C; color: #fff; padding: 5px 5px; font-size: 8px; text-transform: uppercase; text-align: left; }
  .releve-a4 table.livre th.droite { text-align: right; }
  .releve-a4 table.livre th.centre { text-align: center; }
  .releve-a4 table.livre td { padding: 5px 5px; border-top: 1px solid #e2e8f0; vertical-align: top; }
  .releve-a4 table.livre tbody tr:nth-child(even) { background: #f8fafc; }
  .releve-a4 table.livre .num { width: 22px; text-align: center; color: #64748b; font-family: "Courier New", monospace; }
  .releve-a4 table.livre .sous { display: block; font-size: 8.5px; color: #64748b; font-weight: normal; }
  .releve-a4 table.livre .vide { text-align: center; color: #64748b; font-style: italic; padding: 14px; }
  .releve-a4 table.livre tfoot td { background: #f1f5f9; font-weight: 900; color: #0C447C; border-top: 2px solid #cbd5e1; text-transform: uppercase; }
  .releve-a4 table.livre tfoot td.droite:last-child { text-transform: none; font-weight: normal; color: #475569; }
  .releve-a4 .etat { display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: 8px; font-weight: bold; }
  .releve-a4 .etat-paye { background: #d1fae5; color: #065f46; }
  .releve-a4 .etat-partiel { background: #fef3c7; color: #92400e; }
  .releve-a4 .etat-retard { background: #ffe4e6; color: #9f1239; }
  .releve-a4 .etat-echoir { background: #f1f5f9; color: #475569; }
  .releve-a4 .arrete { margin-top: 4px; padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 4px; background: #f8fafc; font-size: 9px; }
  .releve-a4 .arrete em { color: #0C447C; font-weight: 600; }

  .releve-a4 .mention { margin-top: 10px; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 8px; background: #f8fafc; font-size: 9px; color: #334155; }
  .releve-a4 .signatures-a4 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; align-items: end; margin-top: 14px; padding-top: 8px; border-top: 1px solid #cbd5e1; }
  .releve-a4 .sig { display: flex; flex-direction: column; font-size: 9px; }
  .releve-a4 .sig.droite { text-align: right; }
  .releve-a4 .sig.centre { text-align: center; align-self: center; }
  .releve-a4 .sig .role { font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: #0C447C; }
  .releve-a4 .sig .note { font-style: italic; color: #64748b; font-size: 8.5px; }
  .releve-a4 .sig .ligne-sig { display: block; height: 44px; border-bottom: 1px dashed #64748b; }

  .releve-a4 .coupon { margin-top: 14px; padding-top: 8px; border-top: 2px dashed #94a3b8; break-inside: avoid; }
  .releve-a4 .coupon-titre { display: flex; justify-content: space-between; font-family: "Courier New", monospace; font-size: 8px; text-transform: uppercase; color: #475569; margin-bottom: 5px; }
  .releve-a4 .coupon-titre span:first-child { font-weight: bold; }
  .releve-a4 .coupon-corps { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 7px 10px; border: 1px solid #fcd34d; border-radius: 8px; background: #fffbeb; font-size: 10px; }
  .releve-a4 .coupon-corps .pill { display: inline-block; margin: 0 4px; padding: 0 6px; border-radius: 4px; background: #dbeafe; color: #0C447C; font-weight: bold; font-size: 9px; }
  .releve-a4 .coupon .petit { font-size: 8.5px; color: #475569; }
  .releve-a4 .coupon-etat { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
  @media print { .releve-a4 { padding: 18px 20px; } .releve-a4 table.livre tr { break-inside: avoid; } }

  @media print {
    body { padding: 0; }
    .no-print { display: none !important; }
    .bloc, table.tableau tr, table.tableau-premium tr { break-inside: avoid; }
    @page { margin: 15mm; }
  }
`;

// A appeler pendant le clic de l'utilisateur : les navigateurs bloquent window.open()
// s'il est appele apres un appel reseau (ex : apres l'enregistrement d'un paiement).
export function ouvrirFenetreVierge(largeur = 860, hauteur = 900) {
  return window.open("", "_blank", `width=${largeur},height=${hauteur}`);
}

export function ecrireDocumentImpression(fenetre, titre, corps) {
  fenetre.document.open();
  fenetre.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${echapperHtml(titre)}</title>
<style>${STYLES}</style>
</head>
<body>
<div class="page">
  <div class="actions no-print">
    <button class="primaire" onclick="window.print()">Imprimer</button>
    <button onclick="window.close()">Fermer</button>
  </div>
  ${corps}
</div>
</body>
</html>`);
  fenetre.document.close();
  fenetre.focus();
}

// Retourne false si le navigateur a bloque la fenetre.
export function imprimerDocument(titre, corps) {
  const fenetre = ouvrirFenetreVierge();
  if (!fenetre) return false;
  ecrireDocumentImpression(fenetre, titre, corps);
  return true;
}

export const MOYENS_PAIEMENT = {
  especes: "Espèces",
  mobile_money: "Mobile Money",
  virement: "Virement",
  cheque: "Chèque",
};

// ---------------------------------------------------------------------------
// Recu de paiement — document HTML autonome (son propre <style>, pas de dependance a STYLES
// ni a ecrireDocumentImpression) : unique pour tous les types (scolarite, inscription,
// reinscription), une ou plusieurs lignes reglees en un seul geste (ex. inscription + trimestre).
// ---------------------------------------------------------------------------
// data.reference : numero du recu ;
// data.eleve : { nom, prenom, matricule, classe } ;
// data.session : libelle de la session scolaire active, ex. "2026-2027" ;
// data.lignes : [{ libelle, montant }] — une ligne par frais regle dans cette transaction ;
// data.total : somme des lignes (ce qui a ete physiquement encaisse) ;
// data.estSolde : true si l'echeance concernee est desormais entierement payee ;
// data.resteAPayer : solde restant si estSolde est false ;
// data.moyen : moyen de paiement deja traduit en francais (ex. "Espèces") ;
// data.date / data.heure : date et heure du paiement, deja formatees ;
// data.caissier : nom du caissier ;
// data.situationGlobale : optionnel — { totalScolarite, totalPaye, resteGlobal,
// echeances: [{ libelle, montant, montant_paye, reste, statut }], inscription: { libelle,
// montant, montant_paye, statut } | null } — vue d'ensemble affichee sous la section Règlement.
//
// Ouvre sa propre fenetre par defaut (utiliser tel quel pour un clic direct, ex. "Réimprimer
// le reçu"), ou ecrit dans `fenetrePreouverte` si elle est fournie — a ouvrir des le clic
// initial (avant tout appel reseau) pour ne pas se faire bloquer par le navigateur.
// Retourne false si la fenetre est indisponible (bloquee par le navigateur).
export function genererEtImprimerRecu(data, fenetrePreouverte) {
  const fenetre = fenetrePreouverte || window.open("", "_blank");
  if (!fenetre) return false;

  fenetre.document.open();
  fenetre.document.write(genererRecuHtml(data));
  fenetre.document.close();
  fenetre.focus();
  return true;
}

// Document HTML complet du recu (separe de l'ouverture de la fenetre pour pouvoir le tester).
// Meme habillage A4 que le releve de l'historique des paiements (.releve-a4) : double cadre,
// en-tete officiel, bandeau titre, cartouche, paves, tableaux, signatures et coupon detachable.
function etatDepuisLibelle(statut) {
  const s = normaliserTexte(statut);
  if (s === "paye") return { libelle: "Soldé", classe: "etat-paye" };
  if (s === "partiel") return { libelle: "Partiel", classe: "etat-partiel" };
  if (s === "en retard") return { libelle: "Échu", classe: "etat-retard" };
  if (s === "non paye") return { libelle: "Non payé", classe: "etat-retard" };
  return { libelle: "À échoir", classe: "etat-echoir" };
}

export function genererRecuHtml(data) {
  const tiret = "—";
  const e = (v) => echapperHtml(v || tiret);
  const etablissement = completerEtablissement(data.etablissement);
  const eleve = data.eleve || {};
  const situation = data.situationGlobale;
  const nomComplet = `${eleve.nom || ""} ${eleve.prenom || ""}`.trim();
  const inscription = eleve.inscription_active;
  const regime = { nouvelle: "Nouvelle admission", reinscription: "Réinscription" }[inscription?.type_inscription];

  const resteAnnee = situation ? Math.max(0, situation.resteGlobal) : null;
  const ton = data.estSolde ? "vert" : "ambre";

  const coordonnees = coordonneesEcole(etablissement);

  const qr = qrCodeSvg(
    [
      "LAKOLI - Reçu de paiement",
      etablissement.nom,
      `Réf : ${data.reference}`,
      `Élève : ${nomComplet}${eleve.matricule ? ` (${eleve.matricule})` : ""}`,
      `Montant : ${montantTexte(data.total)} GNF`,
      `Date : ${data.date} ${data.heure}`,
      `Statut : ${data.estSolde ? "Soldé" : `Partiel, reste ${montantTexte(data.resteAPayer)} GNF`}`,
    ].filter(Boolean).join("\n"),
    64
  );

  const lignesPaiement = data.lignes
    .map(
      (l, i) => `<tr>
        <td class="num">${i + 1}</td>
        <td><strong>${echapperHtml(l.libelle)}</strong></td>
        <td class="droite mono vert">${formaterMontant(l.montant)}</td>
      </tr>`
    )
    .join("");

  const lignesSituation = situation
    ? [
        ...(situation.inscription
          ? [{ libelle: situation.inscription.libelle, date_limite: null, montant: situation.inscription.montant, montant_paye: situation.inscription.montant_paye, statut: situation.inscription.statut }]
          : []),
        ...(situation.echeances || []).map((ech) => ({ ...ech, libelle: `Scolarité · ${ech.libelle}` })),
      ]
        .map((l, i) => {
          const etat = etatDepuisLibelle(l.statut);
          return `<tr>
            <td class="num">${i + 1}</td>
            <td><strong>${echapperHtml(l.libelle)}</strong></td>
            <td>${l.date_limite ? formaterDate(l.date_limite) : tiret}</td>
            <td class="droite mono">${formaterMontant(l.montant)}</td>
            <td class="droite mono vert">${formaterMontant(l.montant_paye)}</td>
            <td class="droite mono">${formaterMontant(Math.max(0, l.montant - l.montant_paye))}</td>
            <td class="centre"><span class="etat ${etat.classe}">${etat.libelle}</span></td>
          </tr>`;
        })
        .join("")
    : "";

  const corps = `
  <div class="doc-releve releve-a4 page-recu">
    <div class="cadre-a4"><span class="coin hg"></span><span class="coin hd"></span><span class="coin bg"></span><span class="coin bd"></span></div>

    <div class="entete-a4">
      <div class="republique">
        <div class="pays"><span class="drapeau"><i style="background:#CE1126"></i><i style="background:#FCD116"></i><i style="background:#009460"></i></span>RÉPUBLIQUE DE GUINÉE</div>
        <div class="devise">Travail — Justice — Solidarité</div>
        <div class="ministere">Ministère de l'Enseignement Pré-Universitaire et de l'Alphabétisation</div>
      </div>
      <div class="ecole">
        ${logoEcoleHtml(etablissement)}
        <div class="nom-ecole">${echapperHtml(etablissement.nom || "LAKOLI")}</div>
        ${coordonnees.length ? `<div class="coord">${coordonnees.map(echapperHtml).join(" · ")}</div>` : ""}
        ${mentionsEcoleHtml(etablissement)}
      </div>
      <div class="reference">
        <div class="boite-ref">
          <span class="lib">Reçu N°</span>
          <span class="val">${e(data.reference)}</span>
          <span class="date">Payé le <strong>${e(data.date)}</strong> à ${e(data.heure)}</span>
        </div>
        <div class="qr">${qr}</div>
      </div>
    </div>

    <div class="bandeau-titre">
      <h1>REÇU DE PAIEMENT</h1>
      <p>${data.session && data.session !== tiret ? `Année scolaire ${echapperHtml(data.session)} · ` : ""}Paiement encaissé à la caisse de l'établissement</p>
    </div>

    <div class="cartouche">
      <div class="col">
        <span class="titre-col">1. Élève</span>
        <span class="lib">Nom &amp; prénoms</span><strong class="maj">${e(nomComplet)}</strong>
        <span class="lib">Matricule</span><span class="mono bleu">${e(eleve.matricule)}</span>
        <span class="lib">Né(e) le / à</span><span>${eleve.date_naissance ? formaterDate(eleve.date_naissance) : tiret}${eleve.lieu_naissance ? ` à ${echapperHtml(eleve.lieu_naissance)}` : ""}</span>
      </div>
      <div class="col">
        <span class="titre-col">2. Scolarité</span>
        <span class="lib">Classe</span><strong class="bleu">${e(eleve.classe)}</strong>
        <span class="lib">Année scolaire</span><span>${e(data.session)}</span>
        <span class="lib">Régime d'inscription</span><span>${e(regime)}</span>
      </div>
      <div class="col">
        <span class="titre-col">3. Règlement</span>
        <span class="lib">Moyen de paiement</span><strong>${e(data.moyen)}</strong>
        <span class="lib">Date et heure</span><span>${e(data.date)} à ${e(data.heure)}</span>
        <span class="lib">Caissier</span><span>${e(data.caissier)}</span>
      </div>
    </div>

    <div class="paves">
      <div class="pave vert"><span class="lib">Montant encaissé</span><span class="val">${formaterMontant(data.total)} GNF</span></div>
      <div class="pave ${ton}"><span class="lib">Reste sur l'échéance</span><span class="val">${formaterMontant(data.estSolde ? 0 : data.resteAPayer)} GNF</span></div>
      <div class="pave gris"><span class="lib">Reste scolarité (année)</span><span class="val">${resteAnnee === null ? tiret : `${formaterMontant(resteAnnee)} GNF`}</span></div>
      <div class="pave blanc"><span class="lib">Statut</span><span class="pastille ${ton}">${data.estSolde ? "✓ Payé en intégralité" : "⏳ Paiement partiel"}</span></div>
    </div>

    <div class="titre-livre">
      <span>Détail du paiement</span>
      <span class="devise-legale">Montants en francs guinéens (GNF)</span>
    </div>
    <table class="livre">
      <thead><tr><th class="num">N°</th><th>Désignation</th><th class="droite">Montant</th></tr></thead>
      <tbody>${lignesPaiement}</tbody>
      <tfoot><tr><td colspan="2">Total encaissé</td><td class="droite mono">${formaterMontant(data.total)}</td></tr></tfoot>
    </table>
    <div class="arrete">
      <strong>Arrêté le présent reçu à la somme de :</strong>
      <em>${echapperHtml(montantEnLettres(data.total))}</em>
    </div>

    ${situation ? `
    <div class="titre-livre espace">
      <span>Situation globale de l'élève</span>
      <span class="devise-legale">Scolarité annuelle : ${formaterMontant(situation.totalScolarite)} GNF</span>
    </div>
    <table class="livre">
      <thead><tr><th class="num">N°</th><th>Rubrique</th><th>Échéance</th><th class="droite">Exigible</th><th class="droite">Payé</th><th class="droite">Reste</th><th class="centre">État</th></tr></thead>
      <tbody>${lignesSituation}</tbody>
      <tfoot><tr><td colspan="3">Scolarité</td><td class="droite mono">${formaterMontant(situation.totalScolarite)}</td><td class="droite mono">${formaterMontant(situation.totalPaye)}</td><td class="droite mono">${formaterMontant(resteAnnee)}</td><td></td></tr></tfoot>
    </table>` : ""}

    <div class="signatures-a4">
      <div class="sig">
        <span class="role">Le Caissier</span>
        <span class="note">Signature et cachet</span>
        <span class="ligne-sig"></span>
      </div>
      <div class="sig centre">
        <span class="note">Document généré par LAKOLI</span>
      </div>
      <div class="sig droite">
        <span class="role">Le Chef d'Établissement</span>
        <span class="note">${etablissement.ville ? `${echapperHtml(etablissement.ville)}, le ` : "Le "}${e(data.date)}</span>
        <span class="ligne-sig"></span>
      </div>
    </div>

    <div class="coupon">
      <div class="coupon-titre"><span>✂ Coupon détachable — talon de caisse</span><span>À conserver par le parent</span></div>
      <div class="coupon-corps">
        <div>
          <div><strong class="maj">${e(nomComplet)}</strong>
            ${eleve.classe ? `<span class="pill">${echapperHtml(eleve.classe)}</span>` : ""}
            <span class="mono">${e(eleve.matricule)}</span></div>
          <div class="petit">Reçu : <strong class="mono">${e(data.reference)}</strong> · ${e(data.date)} · ${e(data.moyen)} · Encaissé : <strong class="vert">${formaterMontant(data.total)} GNF</strong></div>
        </div>
        <div class="coupon-etat"><span class="petit">Statut</span><span class="pastille ${ton}">${data.estSolde ? "SOLDÉ" : "PARTIEL"}</span></div>
      </div>
    </div>
  </div>`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Reçu de paiement ${echapperHtml(data.reference || "")}</title>
<style>${STYLES}
  .releve-a4 .titre-livre.espace { margin-top: 12px; }
  @media print { @page { margin: 8mm; size: A4; } }
</style>
</head>
<body>
<div class="page">
  <div class="actions no-print">
    <button class="primaire" onclick="window.print()">Imprimer</button>
    <button onclick="window.close()">Fermer</button>
  </div>
  ${corps}
</div>
<script>
  // Le recu doit toujours tenir sur UNE page A4 : juste avant l'impression, s'il depasse la zone
  // imprimable, on le reduit proportionnellement. Taille normale retablie apres l'impression.
  (function () {
    var HAUTEUR_MAX = 1030;
    var recu = document.querySelector(".page-recu");
    function ajuster() {
      recu.style.zoom = "";
      var hauteur = recu.getBoundingClientRect().height;
      if (hauteur > HAUTEUR_MAX) recu.style.zoom = String(Math.floor((HAUTEUR_MAX / hauteur) * 1000) / 1000);
    }
    window.addEventListener("beforeprint", ajuster);
    window.addEventListener("afterprint", function () { recu.style.zoom = ""; });
    if (window.matchMedia) {
      window.matchMedia("print").addEventListener("change", function (m) { if (m.matches) ajuster(); });
    }
  })();
</script>
</body>
</html>`;
}

// Minuscules et sans accents : reconnait "Inscription"/"Réinscription" quel que soit le cas.
function normaliserTexte(texte) {
  return (texte || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// ---------------------------------------------------------------------------
// Releve de situation comptable d'un eleve (A4, design "Prestige academique" de Lakoli 2)
// ---------------------------------------------------------------------------
// etablissement : { nom, ville, adresse, telephone, email } ;
// eleve : { nom, prenom, matricule, classe, session, date_naissance, lieu_naissance,
//           type_inscription, statut_paiement, responsable: { nom, telephone } } ;
// lignes : [{ rubrique, libelle, date_limite, montant, paye, statut (paye|partiel|a_echoir|
//            en_retard), reference, moyen, date_paiement }], deja dans l'ordre voulu.
// Uniquement des donnees reelles : aucun nom de signataire, cachet ou reference inventes.
const ETATS_ECHEANCE_RELEVE = {
  paye: { libelle: "Soldé", classe: "etat-paye" },
  partiel: { libelle: "Partiel", classe: "etat-partiel" },
  en_retard: { libelle: "Échu", classe: "etat-retard" },
  a_echoir: { libelle: "À échoir", classe: "etat-echoir" },
};

const REGIMES_INSCRIPTION = {
  nouvelle: "Nouvelle admission",
  inscription: "Nouvelle admission",
  reinscription: "Réinscription",
};

export function genererReleveHtml({ etablissement: etablissementFourni = {}, eleve, lignes }) {
  const etablissement = completerEtablissement(etablissementFourni);
  const tiret = "—";
  const e = (v) => echapperHtml(v || tiret);

  const totalDu = lignes.reduce((s, l) => s + l.montant, 0);
  const totalPaye = lignes.reduce((s, l) => s + l.paye, 0);
  const reste = Math.max(0, totalDu - totalPaye);
  const taux = totalDu > 0 ? Math.min(100, Math.round((totalPaye / totalDu) * 100)) : 0;

  const solde = totalDu > 0 && reste === 0;
  const enRetard = !solde && (eleve.statut_paiement === "en_retard" || lignes.some((l) => l.statut === "en_retard"));
  const ton = solde ? "vert" : enRetard ? "rouge" : "ambre";
  const situation = totalDu === 0 ? "Aucun frais" : solde ? "✓ Compte soldé" : enRetard ? "⚠ Échéance échue" : "⏳ Échéances en cours";
  const accesCoupon = totalDu === 0 ? tiret : solde ? "À JOUR" : enRetard ? "RÉGULARISATION REQUISE" : "EN COURS";

  const aujourdhui = new Date();
  const dateCourte = aujourdhui.toLocaleDateString("fr-FR");
  const dateLongue = aujourdhui.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const reference = `REL-${eleve.matricule || "ELEVE"}-${aujourdhui.getFullYear()}${String(aujourdhui.getMonth() + 1).padStart(2, "0")}${String(aujourdhui.getDate()).padStart(2, "0")}`;

  const qr = qrCodeSvg(
    [
      `LAKOLI - Relevé ${reference}`,
      etablissement.nom,
      `Élève : ${eleve.nom} ${eleve.prenom} (${eleve.matricule || "-"})`,
      eleve.classe && `Classe : ${eleve.classe}${eleve.session ? ` - ${eleve.session}` : ""}`,
      `Encaissé : ${montantTexte(totalPaye)} GNF / Dû : ${montantTexte(totalDu)} GNF`,
      `Édité le ${dateCourte}`,
    ].filter(Boolean).join("\n"),
    64
  );

  const coordonnees = coordonneesEcole(etablissement);

  const corpsTableau = lignes.length === 0
    ? `<tr><td colspan="10" class="vide">Aucun frais enregistré pour cet élève.</td></tr>`
    : lignes
        .map((l, i) => {
          const etat = ETATS_ECHEANCE_RELEVE[l.statut] || ETATS_ECHEANCE_RELEVE.a_echoir;
          return `<tr>
        <td class="num">${i + 1}</td>
        <td><strong>${echapperHtml(l.rubrique || "Frais")}</strong>${l.libelle && l.libelle !== l.rubrique ? `<span class="sous">${echapperHtml(l.libelle)}</span>` : ""}</td>
        <td>${l.date_limite ? formaterDate(l.date_limite) : tiret}</td>
        <td class="droite mono">${formaterMontant(l.montant)}</td>
        <td class="droite mono vert">${formaterMontant(l.paye)}</td>
        <td class="droite mono">${formaterMontant(Math.max(0, l.montant - l.paye))}</td>
        <td class="mono">${e(l.reference)}</td>
        <td>${e(l.moyen)}</td>
        <td>${l.date_paiement ? formaterDate(l.date_paiement) : tiret}</td>
        <td class="centre"><span class="etat ${etat.classe}">${etat.libelle}</span></td>
      </tr>`;
        })
        .join("");

  return `
  <div class="doc-releve releve-a4">
    <div class="cadre-a4"><span class="coin hg"></span><span class="coin hd"></span><span class="coin bg"></span><span class="coin bd"></span></div>

    <div class="entete-a4">
      <div class="republique">
        <div class="pays"><span class="drapeau"><i style="background:#CE1126"></i><i style="background:#FCD116"></i><i style="background:#009460"></i></span>RÉPUBLIQUE DE GUINÉE</div>
        <div class="devise">Travail — Justice — Solidarité</div>
        <div class="ministere">Ministère de l'Enseignement Pré-Universitaire et de l'Alphabétisation</div>
      </div>
      <div class="ecole">
        ${logoEcoleHtml(etablissement)}
        <div class="nom-ecole">${e(etablissement.nom)}</div>
        ${coordonnees.length ? `<div class="coord">${coordonnees.map(echapperHtml).join(" · ")}</div>` : ""}
        ${mentionsEcoleHtml(etablissement)}
      </div>
      <div class="reference">
        <div class="boite-ref">
          <span class="lib">Réf. relevé</span>
          <span class="val">${echapperHtml(reference)}</span>
          <span class="date">Émis le <strong>${echapperHtml(dateLongue)}</strong></span>
        </div>
        <div class="qr">${qr}</div>
      </div>
    </div>

    <div class="bandeau-titre">
      <h1>RELEVÉ DE SITUATION COMPTABLE &amp; HISTORIQUE DES RÈGLEMENTS</h1>
      <p>${eleve.session ? `Année scolaire ${echapperHtml(eleve.session)} · ` : ""}Établi à partir des encaissements enregistrés dans LAKOLI</p>
    </div>

    <div class="cartouche">
      <div class="col">
        <span class="titre-col">1. Identité de l'élève</span>
        <span class="lib">Nom &amp; prénoms</span><strong class="maj">${e(`${eleve.nom || ""} ${eleve.prenom || ""}`.trim())}</strong>
        <span class="lib">Matricule</span><span class="mono bleu">${e(eleve.matricule)}</span>
        <span class="lib">Né(e) le / à</span><span>${eleve.date_naissance ? formaterDate(eleve.date_naissance) : tiret}${eleve.lieu_naissance ? ` à ${echapperHtml(eleve.lieu_naissance)}` : ""}</span>
      </div>
      <div class="col">
        <span class="titre-col">2. Scolarité</span>
        <span class="lib">Classe</span><strong class="bleu">${e(eleve.classe)}</strong>
        <span class="lib">Année scolaire</span><span>${e(eleve.session)}</span>
        <span class="lib">Régime d'inscription</span><span>${e(REGIMES_INSCRIPTION[eleve.type_inscription])}</span>
      </div>
      <div class="col">
        <span class="titre-col">3. Responsable légal</span>
        <span class="lib">Nom</span><strong>${e(eleve.responsable?.nom)}</strong>
        <span class="lib">Téléphone</span><span>${e(eleve.responsable?.telephone)}</span>
        ${eleve.responsable?.lien ? `<span class="lib">Lien</span><span>${echapperHtml(eleve.responsable.lien)}</span>` : ""}
      </div>
    </div>

    <div class="paves">
      <div class="pave gris"><span class="lib">Total dû</span><span class="val">${formaterMontant(totalDu)} GNF</span></div>
      <div class="pave vert"><span class="lib">Total encaissé</span><span class="val">${formaterMontant(totalPaye)} GNF</span></div>
      <div class="pave ${ton}"><span class="lib">Reste à payer</span><span class="val">${formaterMontant(reste)} GNF</span></div>
      <div class="pave blanc"><span class="lib">Situation</span><span class="pastille ${ton}">${situation}</span></div>
    </div>

    <div class="titre-livre">
      <span>Échéancier &amp; historique des encaissements</span>
      <span class="devise-legale">Montants en francs guinéens (GNF)</span>
    </div>
    <table class="livre">
      <thead>
        <tr>
          <th class="num">N°</th>
          <th>Rubrique</th>
          <th>Échéance</th>
          <th class="droite">Exigible</th>
          <th class="droite">Encaissé</th>
          <th class="droite">Solde</th>
          <th>Réf. quittance</th>
          <th>Mode</th>
          <th>Payé le</th>
          <th class="centre">État</th>
        </tr>
      </thead>
      <tbody>${corpsTableau}</tbody>
      <tfoot>
        <tr>
          <td colspan="3">Totaux</td>
          <td class="droite mono">${formaterMontant(totalDu)}</td>
          <td class="droite mono">${formaterMontant(totalPaye)}</td>
          <td class="droite mono">${formaterMontant(reste)}</td>
          <td colspan="4" class="droite">Taux de recouvrement : <strong>${taux}%</strong></td>
        </tr>
      </tfoot>
    </table>
    <div class="arrete">
      <strong>Arrêté le présent relevé à la somme encaissée de :</strong>
      <em>${echapperHtml(montantEnLettres(totalPaye))}</em>
    </div>

    <div class="mention">
      Le présent relevé retrace l'ensemble des frais exigibles et des paiements enregistrés à la caisse de
      l'établissement pour l'élève désigné ci-dessus, à la date d'édition. Toute réclamation doit être
      présentée à la caisse, munie des reçus correspondants.
    </div>

    <div class="signatures-a4">
      <div class="sig">
        <span class="role">Le Comptable / Caissier</span>
        <span class="note">Vu et certifié conforme à la caisse</span>
        <span class="ligne-sig"></span>
      </div>
      <div class="sig centre">
        <span class="note">Document généré par LAKOLI</span>
      </div>
      <div class="sig droite">
        <span class="role">Le Chef d'Établissement</span>
        <span class="note">${etablissement.ville ? `${echapperHtml(etablissement.ville)}, le ` : "Le "}${echapperHtml(dateLongue)}</span>
        <span class="ligne-sig"></span>
      </div>
    </div>

    <div class="coupon">
      <div class="coupon-titre"><span>✂ Coupon détachable — talon de situation</span><span>À conserver par le parent</span></div>
      <div class="coupon-corps">
        <div>
          <div><strong class="maj">${e(`${eleve.nom || ""} ${eleve.prenom || ""}`.trim())}</strong>
            ${eleve.classe ? `<span class="pill">${echapperHtml(eleve.classe)}</span>` : ""}
            <span class="mono">${e(eleve.matricule)}</span></div>
          <div class="petit">Réf. : <strong class="mono">${echapperHtml(reference)}</strong> · Encaissé : <strong class="vert">${formaterMontant(totalPaye)} GNF</strong> (${taux}%) · Reste : <strong>${formaterMontant(reste)} GNF</strong></div>
        </div>
        <div class="coupon-etat"><span class="petit">Situation</span><span class="pastille ${ton}">${accesCoupon}</span></div>
      </div>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Liste des eleves par classe — une page par classe (saut de page entre deux classes), le nom
// de la classe en grand dans l'en-tete. `classes` : [{ nom, eleves: [{ nom, prenom, matricule,
// date_naissance, lieu_naissance, statut_paiement }] }], deja dans l'ordre voulu.
// `filtreStatut` (optionnel) : libelle du filtre de paiement applique (ex. "En retard") — affiche
// dans l'en-tete, et ajoute une colonne Statut. A passer a imprimerDocument().
// ---------------------------------------------------------------------------
const STATUTS_PAIEMENT_ELEVE = {
  a_jour: { libelle: "À jour", classe: "badge-paye" },
  partiel: { libelle: "Partiel", classe: "badge-partiel" },
  a_echoir: { libelle: "À échoir", classe: "badge-echoir" },
  en_retard: { libelle: "En retard", classe: "badge-retard" },
};

export function genererListeElevesHtml({ etablissement, session, classes, filtreStatut }) {
  const ecole = completerEtablissement(etablissement);
  const tiret = "—";
  const collator = new Intl.Collator("fr", { sensitivity: "base" });
  const celluleStatut = (statut) => {
    const s = STATUTS_PAIEMENT_ELEVE[statut];
    return s ? `<span class="badge-statut ${s.classe}">${s.libelle}</span>` : `<span class="badge-statut badge-echoir">Aucun frais</span>`;
  };

  return classes
    .map(({ nom, eleves }) => {
      const tries = [...eleves].sort(
        (a, b) => collator.compare(a.nom || "", b.nom || "") || collator.compare(a.prenom || "", b.prenom || "")
      );
      const lignes = tries
        .map(
          (e, i) => `<tr>
          <td class="num">${i + 1}</td>
          <td class="mono">${echapperHtml(e.matricule || tiret)}</td>
          <td><strong>${echapperHtml((e.nom || "").toUpperCase())}</strong></td>
          <td>${echapperHtml(e.prenom || tiret)}</td>
          <td>${e.date_naissance ? formaterDate(e.date_naissance) : tiret}</td>
          <td>${echapperHtml(e.lieu_naissance || tiret)}</td>
          ${filtreStatut ? `<td>${celluleStatut(e.statut_paiement)}</td>` : ""}
        </tr>`
        )
        .join("");

      return `
  <div class="doc-releve liste-classe">
    <div class="entete-premium">
      <div class="logo">
        ${logoEcoleHtml(ecole, "logo-premium")}
        <div>
          <div class="nom">LAKOLI</div>
          ${ecole.nom ? `<span class="badge-etablissement">${echapperHtml(ecole.nom)}</span>` : ""}
          ${ecole.agrement || ecole.slogan ? `<div class="mentions-premium">${[ecole.agrement && `Agrément n° ${echapperHtml(ecole.agrement)}`, ecole.slogan && `<span class="slogan">« ${echapperHtml(ecole.slogan)} »</span>`].filter(Boolean).join(" · ")}</div>` : ""}
        </div>
      </div>
      <div class="titre">
        <h1>LISTE DES ÉLÈVES</h1>
        <div class="classe">${echapperHtml(nom)}</div>
        ${filtreStatut ? `<div class="session">Paiement : ${echapperHtml(filtreStatut)}</div>` : ""}
        ${session ? `<div class="session">Année scolaire ${echapperHtml(session)}</div>` : ""}
      </div>
    </div>

    <div class="resume-classe">
      <span>Classe : <strong>${echapperHtml(nom)}</strong></span>
      ${filtreStatut ? `<span>Statut de paiement : <strong>${echapperHtml(filtreStatut)}</strong></span>` : ""}
      <span>Effectif : <strong>${tries.length}</strong> élève${tries.length > 1 ? "s" : ""}</span>
    </div>

    <table class="tableau-premium">
      <thead>
        <tr>
          <th>N°</th>
          <th>Matricule</th>
          <th>Nom</th>
          <th>Prénom(s)</th>
          <th>Date de naissance</th>
          <th>Lieu de naissance</th>
          ${filtreStatut ? "<th>Statut</th>" : ""}
        </tr>
      </thead>
      <tbody>${lignes}</tbody>
    </table>

    <div class="signature-zone">
      <div class="cadre">
        <div class="ligne"></div>
        <div class="libelle">Signature et cachet du directeur</div>
      </div>
    </div>

    <div class="pied-premium">
      Document officiel LAKOLI · Liste arrêtée à ${tries.length} élève${tries.length > 1 ? "s" : ""}${
        filtreStatut ? ` (paiement : ${echapperHtml(filtreStatut)})` : ""
      }<br>
      Imprimé le ${echapperHtml(dateImpression())}
    </div>
  </div>`;
    })
    .join("");
}

// ---------------------------------------------------------------------------
// Liste des enseignants — meme gabarit que la liste des eleves. `enseignants` : lignes de
// GET /enseignants (deja filtrees). `filtres` : libelles des filtres appliques (ex. ["CDI"]),
// affiches dans l'en-tete. A passer a imprimerDocument().
// ---------------------------------------------------------------------------
const CONTRATS_ENSEIGNANT = { cdi: "CDI", cdd: "CDD", vacataire: "Vacataire" };

export function genererListeEnseignantsHtml({ etablissement, session, enseignants, filtres = [] }) {
  const ecole = completerEtablissement(etablissement);
  const tiret = "—";
  const collator = new Intl.Collator("fr", { sensitivity: "base" });
  const tries = [...enseignants].sort(
    (a, b) => collator.compare(a.nom || "", b.nom || "") || collator.compare(a.prenom || "", b.prenom || "")
  );
  const totalHeures = tries.reduce((s, e) => s + (Number(e.volume_horaire) || 0), 0);
  const heures = (h) => `${Number(h || 0).toLocaleString("fr-FR")}&nbsp;h`;

  const lignes = tries
    .map(
      (e, i) => `<tr>
      <td class="num">${i + 1}</td>
      <td class="mono" style="white-space:nowrap">${echapperHtml(e.matricule || tiret)}</td>
      <td><strong>${echapperHtml((e.nom || "").toUpperCase())}</strong></td>
      <td>${echapperHtml(e.prenom || tiret)}</td>
      <td>${echapperHtml(e.matieres?.length ? e.matieres.join(", ") : tiret)}</td>
      <td>${echapperHtml(e.classes?.length ? e.classes.map((c) => c.nom).join(", ") : tiret)}</td>
      <td>${echapperHtml(CONTRATS_ENSEIGNANT[e.type_contrat] || "Sans contrat")}</td>
      <td class="droite">${heures(e.volume_horaire)}</td>
      <td class="mono" style="white-space:nowrap">${echapperHtml(e.telephone || tiret)}</td>
    </tr>`
    )
    .join("");

  return `
  <div class="doc-releve liste-classe">
    <div class="entete-premium">
      <div class="logo">
        ${logoEcoleHtml(ecole, "logo-premium")}
        <div>
          <div class="nom">LAKOLI</div>
          ${ecole.nom ? `<span class="badge-etablissement">${echapperHtml(ecole.nom)}</span>` : ""}
          ${ecole.agrement || ecole.slogan ? `<div class="mentions-premium">${[ecole.agrement && `Agrément n° ${echapperHtml(ecole.agrement)}`, ecole.slogan && `<span class="slogan">« ${echapperHtml(ecole.slogan)} »</span>`].filter(Boolean).join(" · ")}</div>` : ""}
        </div>
      </div>
      <div class="titre">
        <h1>LISTE DES ENSEIGNANTS</h1>
        <div class="classe">Corps enseignant</div>
        ${filtres.length ? `<div class="session">${echapperHtml(filtres.join(" · "))}</div>` : ""}
        ${session ? `<div class="session">Année scolaire ${echapperHtml(session)}</div>` : ""}
      </div>
    </div>

    <div class="resume-classe">
      <span>Effectif : <strong>${tries.length}</strong> enseignant${tries.length > 1 ? "s" : ""}</span>
      <span>Volume horaire : <strong>${heures(totalHeures)}</strong> / semaine</span>
      ${filtres.length ? `<span>Filtres : <strong>${echapperHtml(filtres.join(", "))}</strong></span>` : ""}
    </div>

    <table class="tableau-premium">
      <thead>
        <tr>
          <th>N°</th>
          <th>Matricule</th>
          <th>Nom</th>
          <th>Prénom(s)</th>
          <th>Matière(s)</th>
          <th>Classes</th>
          <th>Contrat</th>
          <th class="droite">Heures / sem.</th>
          <th>Téléphone</th>
        </tr>
      </thead>
      <tbody>
        ${lignes}
        <tr class="total">
          <td colspan="7">TOTAL</td>
          <td class="droite">${heures(totalHeures)}</td>
          <td></td>
        </tr>
      </tbody>
    </table>

    <div class="signature-zone">
      <div class="cadre">
        <div class="ligne"></div>
        <div class="libelle">Signature et cachet du directeur</div>
      </div>
    </div>

    <div class="pied-premium">
      Document officiel LAKOLI · Liste arrêtée à ${tries.length} enseignant${tries.length > 1 ? "s" : ""}<br>
      Imprimé le ${echapperHtml(dateImpression())}
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Journal de caisse imprimable — meme gabarit que les listes. `versements` : lignes deja
// filtrees et formatees ({ date, heure, reference, eleve, matricule, classe, detail, moyen,
// montant }). `parMoyen` / `parType` : [{ libelle, montant }]. A passer a imprimerDocument().
// ---------------------------------------------------------------------------
export function genererJournalCaisseHtml({ etablissement, filtres = [], versements, parMoyen = [], parType = [], caisse = null }) {
  const ecole = completerEtablissement(etablissement);
  const tiret = "—";
  const total = versements.reduce((s, v) => s + (Number(v.montant) || 0), 0);
  const repartition = (titre, lignes) =>
    lignes.length
      ? `<div class="tuile-repartition"><strong>${echapperHtml(titre)}</strong>${lignes
          .map((l) => `<div><span>${echapperHtml(l.libelle)}</span><span>${formaterMontant(l.montant)} GNF</span></div>`)
          .join("")}</div>`
      : "";

  const lignes = versements
    .map(
      (v, i) => `<tr>
      <td class="num">${i + 1}</td>
      <td style="white-space:nowrap">${echapperHtml(v.date || tiret)}<br><span style="color:#64748b;font-size:11px">${echapperHtml(v.heure || "")}</span></td>
      <td class="mono" style="word-break:break-all;font-size:9.5px">${echapperHtml(v.reference || tiret)}</td>
      <td><strong>${echapperHtml(v.eleve || tiret)}</strong><br><span class="mono" style="color:#64748b;font-size:11px">${echapperHtml(v.matricule || "")}</span></td>
      <td>${echapperHtml(v.classe || tiret)}</td>
      <td>${echapperHtml(v.detail || tiret)}</td>
      <td>${echapperHtml(v.moyen || tiret)}</td>
      <td class="droite" style="white-space:nowrap">${formaterMontant(v.montant)}</td>
    </tr>`
    )
    .join("");

  return `
  <div class="doc-releve liste-classe rapport">
    <div class="entete-premium">
      <div class="logo">
        ${logoEcoleHtml(ecole, "logo-premium")}
        <div>
          <div class="nom">LAKOLI</div>
          ${ecole.nom ? `<span class="badge-etablissement">${echapperHtml(ecole.nom)}</span>` : ""}
          ${ecole.agrement || ecole.slogan ? `<div class="mentions-premium">${[ecole.agrement && `Agrément n° ${echapperHtml(ecole.agrement)}`, ecole.slogan && `<span class="slogan">« ${echapperHtml(ecole.slogan)} »</span>`].filter(Boolean).join(" · ")}</div>` : ""}
        </div>
      </div>
      <div class="titre">
        <h1>JOURNAL DE CAISSE</h1>
        <div class="classe">${formaterMontant(total)} GNF</div>
        ${filtres.length ? `<div class="session">${echapperHtml(filtres.join(" · "))}</div>` : `<div class="session">Tous les encaissements</div>`}
      </div>
    </div>

    <div class="resume-classe">
      <span>Versements : <strong>${versements.length}</strong></span>
      <span>Total encaissé : <strong>${formaterMontant(total)} GNF</strong></span>
    </div>

    <table class="tableau-premium journal">
      <thead>
        <tr>
          <th>N°</th>
          <th>Date</th>
          <th>Référence</th>
          <th>Élève</th>
          <th>Classe</th>
          <th>Frais réglés</th>
          <th>Moyen</th>
          <th class="droite">Montant (GNF)</th>
        </tr>
      </thead>
      <tbody>
        ${lignes}
        <tr class="total">
          <td colspan="7">TOTAL</td>
          <td class="droite">${formaterMontant(total)}</td>
        </tr>
      </tbody>
    </table>

    <div class="repartitions">
      ${repartition("Par moyen de paiement", parMoyen)}
      ${repartition("Par type de frais", parType)}
    </div>

    ${caisse?.synthese ? sectionsCaisseHtml(caisse, { titreSituation: "Situation de caisse à ce jour", nbSorties: 10 }) : ""}

    <div class="signature-zone">
      <div class="cadre">
        <div class="ligne"></div>
        <div class="libelle">Signature du caissier / comptable</div>
      </div>
    </div>

    <div class="pied-premium">
      Document officiel LAKOLI · Journal arrêté à ${versements.length} versement${versements.length > 1 ? "s" : ""} pour ${formaterMontant(total)} GNF<br>
      Imprimé le ${echapperHtml(dateImpression())}
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Rapport financier (GET /caisse/evolution) : la session mois par mois, ou un mois en detail
// (moisDetail = cle "YYYY-MM"). A passer a imprimerDocument().
// ---------------------------------------------------------------------------
export function genererRapportFinancierHtml({ etablissement, donnees, moisDetail = null }) {
  const ecole = completerEtablissement(etablissement);
  const tiret = "—";
  const taux = (part, tout) => (tout > 0 ? `${Math.round((part / tout) * 100)} %` : tiret);
  const t = donnees.totaux;
  const entete = (titre, sousTitre) => `
    <div class="entete-premium">
      <div class="logo">
        ${logoEcoleHtml(ecole, "logo-premium")}
        <div>
          <div class="nom">LAKOLI</div>
          ${ecole.nom ? `<span class="badge-etablissement">${echapperHtml(ecole.nom)}</span>` : ""}
          ${ecole.agrement || ecole.slogan ? `<div class="mentions-premium">${[ecole.agrement && `Agrément n° ${echapperHtml(ecole.agrement)}`, ecole.slogan && `<span class="slogan">« ${echapperHtml(ecole.slogan)} »</span>`].filter(Boolean).join(" · ")}</div>` : ""}
        </div>
      </div>
      <div class="titre">
        <h1>${titre}</h1>
        <div class="session">${sousTitre}</div>
      </div>
    </div>`;
  const pied = `
    <div class="signature-zone double">
      <div class="cadre"><div class="ligne"></div><div class="libelle">Le comptable</div></div>
      <div class="cadre"><div class="ligne"></div><div class="libelle">Visa de la direction</div></div>
    </div>
    <div class="pied-premium">Document officiel LAKOLI · Rapport établi à partir des données enregistrées dans l'application<br>Imprimé le ${echapperHtml(dateImpression())}</div>`;

  if (moisDetail) {
    const m = donnees.mois.find((x) => x.mois === moisDetail);
    if (!m) return "";
    const types = [["Scolarité", m.entrees_par_type.scolarite], ["Inscriptions / réinscriptions", m.entrees_par_type.inscription], ["Autres frais", m.entrees_par_type.autres]].filter(([, v]) => v > 0);
    return `
  <div class="doc-releve rapport">
    ${entete("RAPPORT MENSUEL", `${echapperHtml(m.libelle)} · Année scolaire ${echapperHtml(donnees.session.libelle)}`)}
    <h2 class="section">Synthèse du mois</h2>
    <div class="tuiles">
      <div class="tuile"><div class="lib">Encaissé</div><div class="val">${formaterMontant(m.entrees)} GNF</div></div>
      <div class="tuile"><div class="lib">Salaires versés</div><div class="val">${formaterMontant(m.salaires)} GNF</div></div>
      <div class="tuile"><div class="lib">Autres dépenses</div><div class="val">${formaterMontant(m.depenses)} GNF</div></div>
      <div class="tuile"><div class="lib">Solde du mois</div><div class="val">${formaterMontant(m.solde)} GNF</div></div>
      <div class="tuile"><div class="lib">Solde cumulé fin de mois</div><div class="val">${formaterMontant(m.solde_cumule)} GNF</div></div>
      <div class="tuile"><div class="lib">Échéances du mois recouvrées</div><div class="val">${taux(m.recouvre, m.attendu)}</div></div>
    </div>
    <h2 class="section">Encaissements par type de frais</h2>
    ${types.length ? `<table class="tableau-premium compact"><thead><tr><th>Type</th><th class="droite">Montant (GNF)</th><th class="droite">Part</th></tr></thead><tbody>
      ${types.map(([lib, v]) => `<tr><td>${lib}</td><td class="droite">${formaterMontant(v)}</td><td class="droite">${taux(v, m.entrees)}</td></tr>`).join("")}
      <tr class="total"><td>TOTAL</td><td class="droite">${formaterMontant(m.entrees)}</td><td class="droite">100 %</td></tr></tbody></table>` : `<p class="vide">Aucun encaissement ce mois.</p>`}
    <h2 class="section">Échéancier du mois</h2>
    <table class="tableau-premium compact"><tbody>
      <tr><td>Montant attendu (échéances arrivant à terme ce mois)</td><td class="droite">${formaterMontant(m.attendu)} GNF</td></tr>
      <tr><td>Déjà recouvré sur ces échéances</td><td class="droite">${formaterMontant(m.recouvre)} GNF</td></tr>
      <tr class="total"><td>RESTE À RECOUVRER</td><td class="droite">${formaterMontant(Math.max(0, m.attendu - m.recouvre))} GNF</td></tr>
    </tbody></table>
    <h2 class="section">Sorties du mois</h2>
    ${m.salaires + m.depenses > 0 ? `<table class="tableau-premium compact"><thead><tr><th>Nature</th><th class="droite">Montant (GNF)</th></tr></thead><tbody>
      ${m.salaires > 0 ? `<tr><td>Salaires du personnel (${m.nombre_salaires})</td><td class="droite">${formaterMontant(m.salaires)}</td></tr>` : ""}
      ${m.depenses_par_categorie.map((c) => `<tr><td>${echapperHtml(c.libelle)}</td><td class="droite">${formaterMontant(c.total)}</td></tr>`).join("")}
      <tr class="total"><td>TOTAL DES SORTIES</td><td class="droite">${formaterMontant(m.salaires + m.depenses)}</td></tr></tbody></table>` : `<p class="vide">Aucune sortie ce mois.</p>`}
    ${pied}
  </div>`;
  }

  const lignes = donnees.mois
    .map((m) => `<tr${m.futur ? ' style="color:#94a3b8"' : ""}>
      <td><strong>${echapperHtml(m.libelle)}</strong></td>
      <td class="droite">${m.attendu ? formaterMontant(m.attendu) : tiret}</td>
      <td class="droite">${m.attendu ? taux(m.recouvre, m.attendu) : tiret}</td>
      <td class="droite">${formaterMontant(m.entrees)}</td>
      <td class="droite">${formaterMontant(m.salaires)}</td>
      <td class="droite">${formaterMontant(m.depenses)}</td>
      <td class="droite">${formaterMontant(m.solde)}</td>
      <td class="droite"><strong>${formaterMontant(m.solde_cumule)}</strong></td>
    </tr>`)
    .join("");
  return `
  <div class="doc-releve rapport">
    ${entete("RAPPORT FINANCIER", `Année scolaire ${echapperHtml(donnees.session.libelle)} · mois par mois`)}
    <h2 class="section">Synthèse de l'année</h2>
    <div class="tuiles">
      <div class="tuile"><div class="lib">Total encaissé</div><div class="val">${formaterMontant(t.entrees)} GNF</div></div>
      <div class="tuile"><div class="lib">Salaires versés</div><div class="val">${formaterMontant(t.salaires)} GNF</div></div>
      <div class="tuile"><div class="lib">Autres dépenses</div><div class="val">${formaterMontant(t.depenses)} GNF</div></div>
      <div class="tuile"><div class="lib">Solde</div><div class="val">${formaterMontant(t.solde)} GNF</div></div>
      <div class="tuile"><div class="lib">Attendu sur l'année</div><div class="val">${formaterMontant(t.attendu)} GNF</div></div>
      <div class="tuile"><div class="lib">Recouvrement des échéances échues</div><div class="val">${taux(t.recouvre_echu, t.attendu_echu)}</div></div>
    </div>
    <h2 class="section">Évolution mensuelle</h2>
    <table class="tableau-premium compact">
      <thead><tr><th>Mois</th><th class="droite">Attendu</th><th class="droite">Recouvré</th><th class="droite">Encaissé</th><th class="droite">Salaires</th><th class="droite">Dépenses</th><th class="droite">Solde du mois</th><th class="droite">Solde cumulé</th></tr></thead>
      <tbody>${lignes}
        <tr class="total"><td>TOTAL</td><td class="droite">${formaterMontant(t.attendu)}</td><td class="droite">${taux(t.recouvre, t.attendu)}</td><td class="droite">${formaterMontant(t.entrees)}</td><td class="droite">${formaterMontant(t.salaires)}</td><td class="droite">${formaterMontant(t.depenses)}</td><td class="droite">${formaterMontant(t.solde)}</td><td class="droite">${formaterMontant(t.solde)}</td></tr>
      </tbody>
    </table>
    <p class="note">Montants en GNF. Attendu = échéances dont la date limite tombe dans le mois ; Recouvré = part de ces échéances déjà payée. Les mois à venir sont en gris.</p>
    ${pied}
  </div>`;
}

// ---------------------------------------------------------------------------
// Lettres de relance aux familles (GET /frais/relances) : une page par eleve, rappel d'echeance
// proche ou retard de paiement, avec le montant du et la date limite. A passer a imprimerDocument().
// ---------------------------------------------------------------------------
export function genererLettresRelanceHtml({ etablissement, lignes }) {
  const ecole = completerEtablissement(etablissement);
  const coordonnees = [ecole.adresse, ecole.telephone && `Tél. ${ecole.telephone}`, ecole.email].filter(Boolean).map(echapperHtml).join(" · ");
  const aujourdhui = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  return lignes
    .map((l) => {
      const parent = l.contacts?.[0];
      const retard = l.motif === "retard";
      const eleve = `${echapperHtml(l.prenom)} ${echapperHtml((l.nom || "").toUpperCase())}`;
      const corps = retard
        ? `Sauf erreur de notre part, les frais de scolarité de votre enfant <strong>${eleve}</strong>, élève en <strong>${echapperHtml(l.classe || "—")}</strong>,
           présentent un montant de <strong>${formaterMontant(l.montant_du)} GNF</strong> resté impayé depuis le <strong>${formaterDate(l.date_limite)}</strong>
           (${echapperHtml(l.echeance || "échéance")}${l.nombre_echeances > 1 ? ` et ${l.nombre_echeances - 1} autre(s) échéance(s)` : ""}).`
        : `Nous vous rappelons que l'échéance <strong>${echapperHtml(l.echeance || "")}</strong> des frais de scolarité de votre enfant <strong>${eleve}</strong>,
           élève en <strong>${echapperHtml(l.classe || "—")}</strong>, arrive à son terme le <strong>${formaterDate(l.date_limite)}</strong>,
           pour un montant de <strong>${formaterMontant(l.montant_du)} GNF</strong>.`;
      const demande = retard
        ? "Nous vous prions de bien vouloir régulariser cette situation dans les meilleurs délais en vous présentant à la caisse de l'établissement. Si le paiement a déjà été effectué, merci de ne pas tenir compte de ce courrier et de nous présenter votre reçu."
        : "Nous vous remercions de bien vouloir effectuer ce paiement avant cette date à la caisse de l'établissement.";
      return `
  <div class="doc-releve liste-classe lettre-relance">
    <div class="entete-premium">
      <div class="logo">
        ${logoEcoleHtml(ecole, "logo-premium")}
        <div>
          <div class="nom">${echapperHtml(ecole.nom || "LAKOLI")}</div>
          ${coordonnees ? `<div class="mentions-premium">${coordonnees}</div>` : ""}
        </div>
      </div>
      <div class="titre">
        <h1>${retard ? "RELANCE DE PAIEMENT" : "RAPPEL D'ÉCHÉANCE"}</h1>
        <div class="session">Matricule ${echapperHtml(l.matricule || "—")}</div>
      </div>
    </div>
    <div class="corps-lettre">
      <p class="droite-lettre">${echapperHtml(ecole.ville || "")}${ecole.ville ? ", le " : "Le "}${aujourdhui}</p>
      <p class="destinataire">À l'attention de ${parent?.nom ? `<strong>${echapperHtml(parent.nom)}</strong>` : "<strong>Monsieur / Madame les parents</strong>"}<br>
        Parent de ${eleve} — ${echapperHtml(l.classe || "")}${parent?.telephone ? `<br>Tél. ${echapperHtml(parent.telephone)}` : ""}</p>
      <p><strong>Objet :</strong> ${retard ? "Relance — frais de scolarité impayés" : "Rappel — prochaine échéance de scolarité"}</p>
      <p>Madame, Monsieur,</p>
      <p>${corps}</p>
      <table class="tableau-premium compact">
        <thead><tr><th>Échéance</th><th>Date limite</th><th class="droite">Montant dû (GNF)</th><th class="droite">Reste sur l'année (GNF)</th></tr></thead>
        <tbody><tr><td>${echapperHtml(l.echeance || "—")}</td><td>${formaterDate(l.date_limite)}</td><td class="droite"><strong>${formaterMontant(l.montant_du)}</strong></td><td class="droite">${formaterMontant(l.reste_annee)}</td></tr></tbody>
      </table>
      <p>${demande}</p>
      <p>Veuillez agréer, Madame, Monsieur, l'expression de nos salutations distinguées.</p>
    </div>
    <div class="signature-zone">
      <div class="cadre"><div class="ligne"></div><div class="libelle">Le service de comptabilité</div></div>
    </div>
    <div class="pied-premium">Document LAKOLI · ${echapperHtml(ecole.nom || "")}</div>
  </div>`;
    })
    .join("");
}

// ---------------------------------------------------------------------------
// Fiche d'arrete de caisse journalier (GET /caisse/arretes/preparer + arrete enregistre) :
// mouvements du jour par moyen, calcul des especes attendues, billetage, ecart, operations.
// ---------------------------------------------------------------------------
export function genererArreteCaisseHtml({ etablissement, situation, arrete }) {
  const ecole = completerEtablissement(etablissement);
  const tiret = "—";
  const s = situation;
  const moyens = [["especes", "Espèces"], ["mobile_money", "Mobile Money"], ["virement", "Virement"], ["cheque", "Chèque"]];
  const lignesMoyens = moyens
    .map(([m, lib]) => {
      const entree = s.entrees?.[m] || 0;
      const sortie = (s.sorties?.[m]?.salaires || 0) + (s.sorties?.[m]?.depenses || 0);
      if (!entree && !sortie) return "";
      return `<tr><td>${lib}</td><td class="droite">${formaterMontant(entree)}</td><td class="droite">${formaterMontant(sortie)}</td><td class="droite"><strong>${formaterMontant(entree - sortie)}</strong></td></tr>`;
    })
    .join("");
  const totalEntrees = moyens.reduce((t, [m]) => t + (s.entrees?.[m] || 0), 0);
  const totalSorties = moyens.reduce((t, [m]) => t + (s.sorties?.[m]?.salaires || 0) + (s.sorties?.[m]?.depenses || 0), 0);
  const sortiesEspeces = (s.sorties?.especes?.salaires || 0) + (s.sorties?.especes?.depenses || 0);

  const billetage = Object.entries(arrete?.billetage || {})
    .filter(([, n]) => n > 0)
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([c, n]) => `<tr><td>Billet de ${formaterMontant(c)} GNF</td><td class="droite">${n}</td><td class="droite">${formaterMontant(Number(c) * n)}</td></tr>`)
    .join("");
  const ecart = arrete ? arrete.ecart : null;
  const etatEcart = ecart === null
    ? ""
    : Math.abs(ecart) < 1
      ? `<span class="badge-statut badge-paye">Caisse juste</span>`
      : `<span class="badge-statut badge-retard">${ecart > 0 ? "Excédent" : "Manquant"} de ${formaterMontant(Math.abs(ecart))} GNF</span>`;

  const operations = (s.operations || [])
    .map((o, i) => `<tr>
      <td class="num">${i + 1}</td>
      <td>${o.type === "entree" ? "Entrée" : "Sortie"}</td>
      <td><strong>${echapperHtml(o.libelle || tiret)}</strong>${o.detail ? `<br><span class="gris">${echapperHtml(o.detail)}</span>` : ""}</td>
      <td class="mono" style="font-size:10px">${echapperHtml(o.reference || tiret)}</td>
      <td>${echapperHtml(MOYENS_PAIEMENT[o.moyen_paiement] || o.moyen_paiement || tiret)}</td>
      <td class="droite" style="white-space:nowrap">${o.type === "entree" ? "+" : "−"}${formaterMontant(o.montant)}</td>
    </tr>`)
    .join("");

  return `
  <div class="doc-releve liste-classe rapport">
    <div class="entete-premium">
      <div class="logo">
        ${logoEcoleHtml(ecole, "logo-premium")}
        <div>
          <div class="nom">LAKOLI</div>
          ${ecole.nom ? `<span class="badge-etablissement">${echapperHtml(ecole.nom)}</span>` : ""}
          ${ecole.agrement || ecole.slogan ? `<div class="mentions-premium">${[ecole.agrement && `Agrément n° ${echapperHtml(ecole.agrement)}`, ecole.slogan && `<span class="slogan">« ${echapperHtml(ecole.slogan)} »</span>`].filter(Boolean).join(" · ")}</div>` : ""}
        </div>
      </div>
      <div class="titre">
        <h1>ARRÊTÉ DE CAISSE</h1>
        <div class="classe">${echapperHtml(formaterDate(s.date))}</div>
        <div class="session">${arrete ? `Arrêté par ${echapperHtml(arrete.arrete_par || tiret)}` : "Non encore arrêté"}</div>
      </div>
    </div>

    <h2 class="section">Mouvements de la journée</h2>
    <table class="tableau-premium compact">
      <thead><tr><th>Moyen</th><th class="droite">Entrées (GNF)</th><th class="droite">Sorties (GNF)</th><th class="droite">Net (GNF)</th></tr></thead>
      <tbody>${lignesMoyens || `<tr><td colspan="4" class="gris">Aucun mouvement ce jour.</td></tr>`}
        <tr class="total"><td>TOTAL</td><td class="droite">${formaterMontant(totalEntrees)}</td><td class="droite">${formaterMontant(totalSorties)}</td><td class="droite">${formaterMontant(totalEntrees - totalSorties)}</td></tr>
      </tbody>
    </table>
    <p class="note">${s.nombre_versements || 0} versement(s) de familles encaissé(s) ce jour.</p>

    <h2 class="section">Contrôle des espèces</h2>
    <table class="tableau-premium compact">
      <tbody>
        <tr><td>Espèces en caisse à l'ouverture (fin de la veille)</td><td class="droite">${formaterMontant(s.especes_veille)}</td></tr>
        <tr><td>+ Encaissements en espèces du jour</td><td class="droite">${formaterMontant(s.entrees?.especes || 0)}</td></tr>
        <tr><td>− Salaires et dépenses payés en espèces</td><td class="droite">${formaterMontant(sortiesEspeces)}</td></tr>
        <tr class="total"><td>ESPÈCES ATTENDUES</td><td class="droite">${formaterMontant(s.especes_theoriques)}</td></tr>
        ${arrete ? `<tr><td><strong>Espèces comptées</strong></td><td class="droite"><strong>${formaterMontant(arrete.especes_comptees)}</strong></td></tr>
        <tr><td><strong>Écart</strong></td><td class="droite">${etatEcart}</td></tr>` : ""}
      </tbody>
    </table>
    ${arrete?.observation ? `<p class="note"><strong>Observation :</strong> ${echapperHtml(arrete.observation)}</p>` : ""}

    ${billetage ? `<h2 class="section">Billetage</h2>
    <table class="tableau-premium compact">
      <thead><tr><th>Coupure</th><th class="droite">Nombre</th><th class="droite">Montant (GNF)</th></tr></thead>
      <tbody>${billetage}<tr class="total"><td colspan="2">TOTAL COMPTÉ</td><td class="droite">${formaterMontant(arrete.especes_comptees)}</td></tr></tbody>
    </table>` : ""}

    ${operations ? `<h2 class="section">Opérations du jour</h2>
    <table class="tableau-premium compact">
      <thead><tr><th>N°</th><th>Sens</th><th>Élève / objet</th><th>Référence</th><th>Moyen</th><th class="droite">Montant (GNF)</th></tr></thead>
      <tbody>${operations}</tbody>
    </table>` : ""}

    <div class="signature-zone double">
      <div class="cadre"><div class="ligne"></div><div class="libelle">Le caissier / comptable</div></div>
      <div class="cadre"><div class="ligne"></div><div class="libelle">Visa de la direction</div></div>
    </div>

    <div class="pied-premium">
      Document officiel LAKOLI · Arrêté de caisse du ${echapperHtml(formaterDate(s.date))}${arrete?.arrete_le ? ` enregistré le ${echapperHtml(formaterDate(arrete.arrete_le))}` : ""}<br>
      Imprimé le ${echapperHtml(dateImpression())}
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Caisse — sections communes au rapport comptable et au journal de caisse : solde par moyen de
// paiement (encaissements - salaires - depenses), sorties par categorie, depenses sans piece
// justificative et dernieres sorties.
//   caisse : { synthese: GET /caisse/synthese, sorties: GET /caisse/sorties | null }
// ---------------------------------------------------------------------------
const MOYENS_CAISSE = [
  ["especes", "Espèces en caisse"],
  ["mobile_money", "Mobile Money"],
  ["virement", "Banque (virement)"],
  ["cheque", "Chèque"],
];

function sectionsCaisseHtml({ synthese, sorties }, { titreSituation = "Situation de caisse", nbSorties = 15 } = {}) {
  const tiret = "—";
  const s = synthese;
  const pm = s.par_moyen || {};
  const lignesMoyens = MOYENS_CAISSE.filter(([m]) => {
    const d = pm[m];
    return d && (d.entrees || d.salaires || d.depenses);
  })
    .map(([m, lib]) => {
      const d = pm[m];
      return `<tr><td>${lib}</td><td class="droite">${formaterMontant(d.entrees)}</td><td class="droite">${formaterMontant(d.salaires)}</td><td class="droite">${formaterMontant(d.depenses)}</td><td class="droite"><strong>${formaterMontant(d.solde)}</strong></td></tr>`;
    })
    .join("");
  const situation = `<table class="tableau-premium compact">
      <thead><tr><th>Moyen</th><th class="droite">Encaissé (GNF)</th><th class="droite">Salaires (GNF)</th><th class="droite">Dépenses (GNF)</th><th class="droite">Solde (GNF)</th></tr></thead>
      <tbody>${lignesMoyens || `<tr><td colspan="5" class="gris">Aucun mouvement de caisse.</td></tr>`}
        <tr class="total"><td>TOTAL</td><td class="droite">${formaterMontant(s.total_entrees)}</td><td class="droite">${formaterMontant(s.total_salaires)}</td><td class="droite">${formaterMontant(s.total_depenses)}</td><td class="droite">${formaterMontant(s.solde)}</td></tr>
      </tbody>
    </table>
    ${s.solde < 0 ? `<div class="alerte-caisse">Solde négatif : les sorties dépassent les encaissements. Vérifiez les saisies.</div>` : ""}`;

  // Sorties par categorie (salaires compris) sur toute la periode.
  const nbSalaires = sorties ? sorties.filter((x) => x.source === "salaire").length : null;
  const categories = [
    ...(s.total_salaires > 0 ? [{ libelle: "Salaires du personnel", nombre: nbSalaires, total: s.total_salaires }] : []),
    ...(s.depenses_par_categorie || []),
  ];
  const totalSorties = s.total_salaires + s.total_depenses;
  const pctSortie = (m) => {
    if (!(totalSorties > 0)) return tiret;
    const v = (m / totalSorties) * 100;
    return `${v > 0 && v < 10 ? v.toFixed(1).replace(".", ",") : Math.round(v)} %`;
  };
  const parCategorie = categories.length === 0
    ? `<p class="vide">Aucune sortie de caisse enregistrée.</p>`
    : `<table class="tableau-premium compact">
        <thead><tr><th>Nature de la sortie</th><th class="droite">Nombre</th><th class="droite">Montant (GNF)</th><th class="droite">Part</th></tr></thead>
        <tbody>${categories
          .map((c) => `<tr><td>${echapperHtml(c.libelle)}</td><td class="droite">${c.nombre ?? tiret}</td><td class="droite">${formaterMontant(c.total)}</td><td class="droite">${pctSortie(c.total)}</td></tr>`)
          .join("")}
          <tr class="total"><td>TOTAL DES SORTIES</td><td class="droite"></td><td class="droite">${formaterMontant(totalSorties)}</td><td class="droite">${totalSorties > 0 ? "100 %" : tiret}</td></tr>
        </tbody>
      </table>`;

  // Depenses a justifier (sans piece jointe).
  const aJustifier = sorties ? sorties.filter((x) => x.source === "depense" && x.a_justifier) : null;
  let sectionAJustifier = "";
  if (aJustifier) {
    sectionAJustifier = aJustifier.length === 0
      ? `<p class="vide">Toutes les dépenses sont justifiées par une pièce.</p>`
      : `<table class="tableau-premium compact">
          <thead><tr><th>Date</th><th>Référence</th><th>Objet</th><th>Bénéficiaire</th><th>N° pièce</th><th class="droite">Montant (GNF)</th></tr></thead>
          <tbody>${aJustifier
            .map((d) => `<tr>
              <td>${d.date ? formaterDate(d.date) : tiret}</td>
              <td class="mono">${echapperHtml(d.reference || tiret)}</td>
              <td>${echapperHtml(d.libelle)}</td>
              <td>${echapperHtml(d.beneficiaire || tiret)}</td>
              <td>${echapperHtml(d.numero_piece || tiret)}</td>
              <td class="droite"><strong>${formaterMontant(d.montant)}</strong></td>
            </tr>`)
            .join("")}
            <tr class="total"><td colspan="5">TOTAL À JUSTIFIER</td><td class="droite">${formaterMontant(aJustifier.reduce((t, d) => t + d.montant, 0))}</td></tr>
          </tbody>
        </table>`;
  } else if (s.a_justifier) {
    sectionAJustifier = s.a_justifier.nombre === 0
      ? `<p class="vide">Toutes les dépenses sont justifiées par une pièce.</p>`
      : `<p class="note">${s.a_justifier.nombre} dépense(s) sans pièce justificative pour ${formaterMontant(s.a_justifier.montant)} GNF.</p>`;
  }

  // Dernieres sorties (hors annulees).
  let sectionDernieres = "";
  if (sorties) {
    const valides = sorties.filter((x) => !x.annule);
    const derniers = valides.slice(0, nbSorties);
    sectionDernieres = derniers.length === 0
      ? `<p class="vide">Aucune sortie de caisse enregistrée.</p>`
      : `<table class="tableau-premium compact">
          <thead><tr><th>Date</th><th>Nature</th><th>Objet</th><th>Bénéficiaire</th><th>Moyen</th><th class="droite">Montant (GNF)</th></tr></thead>
          <tbody>${derniers
            .map((x) => `<tr>
              <td>${x.date ? formaterDate(x.date) : tiret}</td>
              <td>${echapperHtml(x.source === "salaire" ? "Salaire" : (s.categories || {})[x.categorie] || x.categorie)}</td>
              <td>${echapperHtml(x.libelle)}${x.source === "depense" && x.a_justifier ? ` <span class="badge-statut badge-retard">À justifier</span>` : ""}</td>
              <td>${echapperHtml(x.beneficiaire || tiret)}</td>
              <td>${echapperHtml(MOYENS_PAIEMENT[x.moyen_paiement] || x.moyen_paiement || tiret)}</td>
              <td class="droite"><strong>${formaterMontant(x.montant)}</strong></td>
            </tr>`)
            .join("")}</tbody>
        </table>
        ${valides.length > derniers.length ? `<p class="note">${derniers.length} dernières sur ${valides.length} sorties enregistrées.</p>` : ""}`;
  }

  return `
    <h2 class="section">${echapperHtml(titreSituation)}</h2>
    ${situation}

    <h2 class="section">Sorties de caisse par nature</h2>
    ${parCategorie}

    ${sectionAJustifier ? `<h2 class="section">Dépenses à justifier${aJustifier ? ` (${aJustifier.length})` : ""}</h2>${sectionAJustifier}` : ""}

    ${sectionDernieres ? `<h2 class="section">Dernières sorties de caisse</h2>${sectionDernieres}` : ""}`;
}

// ---------------------------------------------------------------------------
// Etat des depenses — liste imprimable du module Depenses (filtres appliques), avec l'etat de la
// justification de chaque depense. A passer a imprimerDocument().
//   depenses : GET /caisse/depenses (depenses[]), categories : { cle: libelle }
// ---------------------------------------------------------------------------
export function genererEtatDepensesHtml({ etablissement, filtres = [], depenses, categories = {} }) {
  const ecole = completerEtablissement(etablissement);
  const tiret = "—";
  const valides = depenses.filter((d) => !d.annule);
  const total = valides.reduce((t, d) => t + d.montant, 0);
  const aJustifier = valides.filter((d) => d.a_justifier);
  const totalAJustifier = aJustifier.reduce((t, d) => t + d.montant, 0);

  const parCategorie = Object.values(
    valides.reduce((acc, d) => {
      const c = (acc[d.categorie] ||= { libelle: categories[d.categorie] || d.categorie, montant: 0 });
      c.montant += d.montant;
      return acc;
    }, {})
  ).sort((a, b) => b.montant - a.montant);
  const parMoyen = Object.values(
    valides.reduce((acc, d) => {
      const c = (acc[d.moyen_paiement] ||= { libelle: MOYENS_PAIEMENT[d.moyen_paiement] || d.moyen_paiement, montant: 0 });
      c.montant += d.montant;
      return acc;
    }, {})
  );
  const repartition = (titre, lignes) =>
    lignes.length
      ? `<div class="tuile-repartition"><strong>${echapperHtml(titre)}</strong>${lignes
          .map((l) => `<div><span>${echapperHtml(l.libelle)}</span><span>${formaterMontant(l.montant)} GNF</span></div>`)
          .join("")}</div>`
      : "";

  const lignes = depenses
    .map(
      (d, i) => `<tr${d.annule ? ' class="annulee"' : ""}>
      <td class="num">${i + 1}</td>
      <td style="white-space:nowrap">${d.date ? formaterDate(d.date) : tiret}</td>
      <td class="mono" style="font-size:10px">${echapperHtml(d.reference || tiret)}</td>
      <td>${echapperHtml(categories[d.categorie] || d.categorie)}</td>
      <td><strong>${echapperHtml(d.libelle)}</strong>${d.beneficiaire ? `<br><span class="gris">${echapperHtml(d.beneficiaire)}</span>` : ""}${d.annule ? `<br><span class="gris">Annulée : ${echapperHtml(d.motif_annulation || "")}</span>` : ""}</td>
      <td>${echapperHtml(MOYENS_PAIEMENT[d.moyen_paiement] || d.moyen_paiement)}</td>
      <td>${echapperHtml(d.numero_piece || tiret)}</td>
      <td>${d.annule ? `<span class="badge-statut badge-annule">Annulée</span>` : d.a_justifier ? `<span class="badge-statut badge-retard">À justifier</span>` : `<span class="badge-statut badge-paye">${d.nb_justificatifs} pièce${d.nb_justificatifs > 1 ? "s" : ""}</span>`}</td>
      <td class="droite" style="white-space:nowrap">${d.annule ? `<s>${formaterMontant(d.montant)}</s>` : formaterMontant(d.montant)}</td>
    </tr>`
    )
    .join("");

  return `
  <div class="doc-releve liste-classe rapport">
    <div class="entete-premium">
      <div class="logo">
        ${logoEcoleHtml(ecole, "logo-premium")}
        <div>
          <div class="nom">LAKOLI</div>
          ${ecole.nom ? `<span class="badge-etablissement">${echapperHtml(ecole.nom)}</span>` : ""}
          ${ecole.agrement || ecole.slogan ? `<div class="mentions-premium">${[ecole.agrement && `Agrément n° ${echapperHtml(ecole.agrement)}`, ecole.slogan && `<span class="slogan">« ${echapperHtml(ecole.slogan)} »</span>`].filter(Boolean).join(" · ")}</div>` : ""}
        </div>
      </div>
      <div class="titre">
        <h1>ÉTAT DES DÉPENSES</h1>
        <div class="classe">${formaterMontant(total)} GNF</div>
        <div class="session">${filtres.length ? echapperHtml(filtres.join(" · ")) : "Toutes les dépenses"}</div>
      </div>
    </div>

    <div class="resume-classe">
      <span>Dépenses : <strong>${valides.length}</strong></span>
      <span>Justifiées : <strong>${valides.length - aJustifier.length}</strong></span>
      <span>À justifier : <strong>${aJustifier.length}</strong> (${formaterMontant(totalAJustifier)} GNF)</span>
    </div>

    <table class="tableau-premium compact">
      <thead>
        <tr>
          <th>N°</th><th>Date</th><th>Référence</th><th>Catégorie</th><th>Objet / bénéficiaire</th><th>Moyen</th><th>N° pièce</th><th>Justificatif</th><th class="droite">Montant (GNF)</th>
        </tr>
      </thead>
      <tbody>
        ${lignes || `<tr><td colspan="9" class="gris">Aucune dépense.</td></tr>`}
        <tr class="total"><td colspan="8">TOTAL (hors annulées)</td><td class="droite">${formaterMontant(total)}</td></tr>
      </tbody>
    </table>

    <div class="repartitions">
      ${repartition("Par catégorie", parCategorie)}
      ${repartition("Par moyen de paiement", parMoyen)}
    </div>

    <div class="signature-zone double">
      <div class="cadre"><div class="ligne"></div><div class="libelle">Le comptable</div></div>
      <div class="cadre"><div class="ligne"></div><div class="libelle">Visa de la direction</div></div>
    </div>

    <div class="pied-premium">
      Document officiel LAKOLI · Les pièces justificatives sont conservées dans l'application (module Dépenses)<br>
      Imprimé le ${echapperHtml(dateImpression())}
    </div>
  </div>`;
}


// ---------------------------------------------------------------------------
// Rapport comptable — synthese imprimable (ou enregistrable en PDF) du tableau de bord comptable,
// avec les donnees reelles. Une section dont la source n'a pas pu etre chargee est signalee
// « indisponible » plutot que remplie de zeros. A passer a imprimerDocument().
//   indicateurs : { totalEleves, inscrits, paiementsAujourdhui, enRetard, totalEncaisse } (null = indisponible)
//   finances    : { inscriptions, reinscriptions, scolarite, autres } | null
//   classes     : [{ classe, niveau, nombre_eleves, montant_total, montant_encaisse, nombre_soldes, nombre_en_retard }] | null
//   inscriptions: { nouveaux, reinscrits, nonInscrits, total } | null (inscrit = frais d'inscription enregistres)
//   elevesEnRetard : [{ nom, prenom, matricule, classe }] | null
//   paiements   : versements (utils/versements.js) [{ date_paiement, heure, eleve: { nom_complet, classe }, objet, montant, moyen_paiement }] | null
// ---------------------------------------------------------------------------
const NB_DERNIERS_ENCAISSEMENTS = 20;

export function genererRapportComptableHtml({
  etablissement, session, dateDonnees, indicateurs, finances, classes, inscriptions, elevesEnRetard, paiements, caisse,
}) {
  const ecole = completerEtablissement(etablissement);
  const tiret = "—";
  const indisponible = (quoi) => `<p class="indisponible">Données ${quoi} indisponibles au moment de l'édition.</p>`;
  const nombre = (v) => (v === null || v === undefined ? tiret : echapperHtml(String(v)));
  // Une decimale sous 10 % : un taux reel de 0,4 % ne doit pas s'afficher "0 %".
  const pct = (part, tout) => {
    if (!(tout > 0)) return tiret;
    const v = (part / tout) * 100;
    return `${v > 0 && v < 10 ? v.toFixed(1).replace(".", ",") : Math.round(v)} %`;
  };

  const totalDu = classes ? classes.reduce((s, c) => s + Number(c.montant_total || 0), 0) : null;
  const totalEncaisseClasses = classes ? classes.reduce((s, c) => s + Number(c.montant_encaisse || 0), 0) : null;

  const tuiles = [
    ["Élèves inscrits", indicateurs.inscrits === null || indicateurs.inscrits === undefined
      ? tiret
      : `${nombre(indicateurs.inscrits)}/${nombre(indicateurs.totalEleves)}`],
    ["Paiements aujourd'hui", nombre(indicateurs.paiementsAujourdhui)],
    ["Élèves en retard", nombre(indicateurs.enRetard)],
    ["Total encaissé", indicateurs.totalEncaisse === null ? tiret : `${formaterMontant(indicateurs.totalEncaisse)} GNF`],
    ["Scolarité due", totalDu === null ? tiret : `${formaterMontant(totalDu)} GNF`],
    ["Taux de recouvrement", totalDu === null ? tiret : pct(totalEncaisseClasses, totalDu)],
    ["Salaires versés", caisse?.synthese ? `${formaterMontant(caisse.synthese.total_salaires)} GNF` : tiret],
    ["Autres dépenses", caisse?.synthese ? `${formaterMontant(caisse.synthese.total_depenses)} GNF` : tiret],
    ["Solde de caisse", caisse?.synthese ? `${formaterMontant(caisse.synthese.solde)} GNF` : tiret],
  ]
    .map(([libelle, valeur]) => `<div class="tuile"><div class="lib">${libelle}</div><div class="val">${valeur}</div></div>`)
    .join("");

  // Repartition des encaissements par type de frais
  let sectionFinances = indisponible("des encaissements");
  if (finances) {
    const totalFin = finances.inscriptions + finances.reinscriptions + finances.scolarite + finances.autres;
    const lignesFin = [
      ["Inscriptions", finances.inscriptions],
      ["Réinscriptions", finances.reinscriptions],
      ["Scolarité", finances.scolarite],
      ["Autres frais", finances.autres],
    ]
      .map(([lib, m]) => `<tr><td>${lib}</td><td class="droite">${formaterMontant(m)}</td><td class="droite">${pct(m, totalFin)}</td></tr>`)
      .join("");
    sectionFinances = `<table class="tableau-premium">
      <thead><tr><th>Type de frais</th><th class="droite">Encaissé (GNF)</th><th class="droite">Part</th></tr></thead>
      <tbody>${lignesFin}
        <tr class="total"><td>TOTAL</td><td class="droite">${formaterMontant(totalFin)}</td><td class="droite">${totalFin > 0 ? "100 %" : tiret}</td></tr>
      </tbody>
    </table>`;
  }

  // Scolarite par classe
  let sectionClasses = indisponible("de scolarité par classe");
  if (classes) {
    const lignesClasses = classes
      .map((c) => {
        const du = Number(c.montant_total || 0);
        const enc = Number(c.montant_encaisse || 0);
        return `<tr>
          <td><strong>${echapperHtml(c.classe)}</strong></td>
          <td class="droite">${nombre(c.nombre_eleves)}</td>
          <td class="droite">${formaterMontant(du)}</td>
          <td class="droite">${formaterMontant(enc)}</td>
          <td class="droite">${pct(enc, du)}</td>
          <td class="droite">${formaterMontant(Math.max(0, du - enc))}</td>
          <td class="droite">${nombre(c.nombre_soldes)}</td>
          <td class="droite">${c.nombre_en_retard > 0 ? `<span class="badge-statut badge-retard">${c.nombre_en_retard}</span>` : "0"}</td>
        </tr>`;
      })
      .join("");
    const totEleves = classes.reduce((s, c) => s + Number(c.nombre_eleves || 0), 0);
    const totSoldes = classes.reduce((s, c) => s + Number(c.nombre_soldes || 0), 0);
    const totRetard = classes.reduce((s, c) => s + Number(c.nombre_en_retard || 0), 0);
    sectionClasses = `<table class="tableau-premium compact">
      <thead><tr>
        <th>Classe</th><th class="droite">Élèves</th><th class="droite">Dû (GNF)</th><th class="droite">Encaissé (GNF)</th>
        <th class="droite">Taux</th><th class="droite">Reste (GNF)</th><th class="droite">Soldés</th><th class="droite">Retard</th>
      </tr></thead>
      <tbody>${lignesClasses}
        <tr class="total">
          <td>TOTAL</td><td class="droite">${totEleves}</td><td class="droite">${formaterMontant(totalDu)}</td>
          <td class="droite">${formaterMontant(totalEncaisseClasses)}</td><td class="droite">${pct(totalEncaisseClasses, totalDu)}</td>
          <td class="droite">${formaterMontant(Math.max(0, totalDu - totalEncaisseClasses))}</td>
          <td class="droite">${totSoldes}</td><td class="droite">${totRetard}</td>
        </tr>
      </tbody>
    </table>`;
  }

  // Situation des inscriptions
  let sectionInscriptions = indisponible("d'inscription");
  if (inscriptions) {
    const { nouveaux, reinscrits, nonInscrits, total } = inscriptions;
    sectionInscriptions = `<table class="tableau-premium">
      <thead><tr><th>Situation</th><th class="droite">Élèves</th><th class="droite">Part</th></tr></thead>
      <tbody>
        <tr><td>Nouveaux inscrits</td><td class="droite">${nouveaux}</td><td class="droite">${pct(nouveaux, total)}</td></tr>
        <tr><td>Réinscrits</td><td class="droite">${reinscrits}</td><td class="droite">${pct(reinscrits, total)}</td></tr>
        <tr><td>Pas encore inscrits (frais d'inscription non enregistrés)</td><td class="droite">${nonInscrits}</td><td class="droite">${pct(nonInscrits, total)}</td></tr>
        <tr class="total"><td>TOTAL</td><td class="droite">${total}</td><td class="droite">${total > 0 ? "100 %" : tiret}</td></tr>
      </tbody>
    </table>`;
  }

  // Eleves en retard de paiement
  let sectionRetards = indisponible("des élèves en retard");
  if (elevesEnRetard) {
    const collator = new Intl.Collator("fr", { sensitivity: "base" });
    const tries = [...elevesEnRetard].sort(
      (a, b) => collator.compare(a.classe || "", b.classe || "") || collator.compare(a.nom || "", b.nom || "")
    );
    sectionRetards = tries.length === 0
      ? `<p class="vide">Aucun élève en retard de paiement.</p>`
      : `<table class="tableau-premium compact">
          <thead><tr><th>N°</th><th>Matricule</th><th>Nom et prénom(s)</th><th>Classe</th></tr></thead>
          <tbody>${tries
            .map((e, i) => `<tr>
              <td class="num">${i + 1}</td>
              <td class="mono">${echapperHtml(e.matricule || tiret)}</td>
              <td><strong>${echapperHtml((e.nom || "").toUpperCase())}</strong> ${echapperHtml(e.prenom || "")}</td>
              <td>${echapperHtml(e.classe || tiret)}</td>
            </tr>`)
            .join("")}</tbody>
        </table>`;
  }

  // Derniers encaissements
  let sectionPaiements = indisponible("des paiements");
  if (paiements) {
    const derniers = paiements.slice(0, NB_DERNIERS_ENCAISSEMENTS);
    sectionPaiements = derniers.length === 0
      ? `<p class="vide">Aucun versement enregistré.</p>`
      : `<table class="tableau-premium compact">
          <thead><tr><th>Date</th><th>Élève</th><th>Classe</th><th>Objet</th><th>Moyen</th><th class="droite">Montant (GNF)</th></tr></thead>
          <tbody>${derniers
            .map((p) => `<tr>
              <td>${p.date_paiement ? formaterDate(p.date_paiement) : tiret}${p.heure ? ` <span class="gris">${echapperHtml(p.heure)}</span>` : ""}</td>
              <td>${echapperHtml(p.eleve?.nom_complet || tiret)}</td>
              <td>${echapperHtml(p.eleve?.classe || tiret)}</td>
              <td>${echapperHtml(p.objet || [p.type_frais, p.libelle].filter(Boolean).join(" · ") || tiret)}</td>
              <td>${echapperHtml(MOYENS_PAIEMENT[p.moyen_paiement] || p.moyen_paiement || tiret)}</td>
              <td class="droite"><strong>${formaterMontant(p.montant)}</strong></td>
            </tr>`)
            .join("")}</tbody>
        </table>
        ${paiements.length > derniers.length ? `<p class="note">${derniers.length} derniers sur ${paiements.length} versements enregistrés.</p>` : ""}`;
  }

  const dateTexte = dateDonnees
    ? `${dateDonnees.toLocaleDateString("fr-FR")} à ${dateDonnees.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
    : tiret;

  return `
  <div class="doc-releve rapport">
    <div class="entete-premium">
      <div class="logo">
        ${logoEcoleHtml(ecole, "logo-premium")}
        <div>
          <div class="nom">LAKOLI</div>
          ${ecole.nom ? `<span class="badge-etablissement">${echapperHtml(ecole.nom)}</span>` : ""}
          ${ecole.agrement || ecole.slogan ? `<div class="mentions-premium">${[ecole.agrement && `Agrément n° ${echapperHtml(ecole.agrement)}`, ecole.slogan && `<span class="slogan">« ${echapperHtml(ecole.slogan)} »</span>`].filter(Boolean).join(" · ")}</div>` : ""}
        </div>
      </div>
      <div class="titre">
        <h1>RAPPORT COMPTABLE</h1>
        ${session ? `<div class="session">Année scolaire ${echapperHtml(session)}</div>` : ""}
        <div class="session">Données du ${echapperHtml(dateTexte)}</div>
      </div>
    </div>

    <h2 class="section">Indicateurs clés</h2>
    <div class="tuiles">${tuiles}</div>

    <h2 class="section">Répartition des encaissements</h2>
    ${sectionFinances}

    <h2 class="section">Scolarité par classe</h2>
    ${sectionClasses}

    <h2 class="section">Situation des inscriptions</h2>
    ${sectionInscriptions}

    <h2 class="section">Élèves en retard de paiement${elevesEnRetard ? ` (${elevesEnRetard.length})` : ""}</h2>
    ${sectionRetards}

    <h2 class="section">Derniers encaissements</h2>
    ${sectionPaiements}

    ${caisse?.synthese ? sectionsCaisseHtml(caisse, { titreSituation: "Situation de caisse", nbSorties: 15 }) : `<h2 class="section">Situation de caisse</h2>${indisponible("de caisse (salaires et dépenses)")}`}

    <div class="signature-zone">
      <div class="cadre">
        <div class="ligne"></div>
        <div class="libelle">Signature et cachet du comptable</div>
      </div>
    </div>

    <div class="pied-premium">
      Document officiel LAKOLI · Rapport établi à partir des données enregistrées dans l'application<br>
      Imprimé le ${echapperHtml(dateImpression())}
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Fiche de paie enseignant — document HTML autonome, meme principe que le recu.
// ---------------------------------------------------------------------------
export const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const CONTRATS_FICHE = {
  cdi: { libelle: "CDI", fond: "#dbeafe", texte: "#1d4ed8", detail: "Rémunération forfaitaire convenue au contrat (CDI)" },
  cdd: { libelle: "CDD", fond: "#fef9c3", texte: "#a16207", detail: "Rémunération forfaitaire convenue au contrat (CDD)" },
  vacataire: { libelle: "Vacataire", fond: "#f3e8ff", texte: "#7c3aed", detail: "Rémunération de vacation" },
};
const MOYENS_FICHE = {
  especes: "💵 Espèces en caisse",
  mobile_money: "📱 Mobile Money",
  virement: "🏦 Virement bancaire",
  cheque: "📝 Chèque",
};

// Classes enseignees (une fois chacune) et matieres, deduites des affectations.
function classesEtMatieres(affectations) {
  const classes = new Set();
  const matieres = new Set();
  for (const a of affectations || []) {
    if (a.classe?.nom) classes.add(a.classe.nom);
    if (a.matiere?.nom) matieres.add(a.matiere.nom);
  }
  return { classes: [...classes], matieres: [...matieres] };
}

// `salaire` : reponse de GET /salaires/{id} (avec enseignant.contrat_actif, enseignant.affectations
// .classe/.matiere, etablissement et caissier). Design "Gestion des salaires" : en-tete bleu,
// paves enseignant / remuneration / reglement, double signature. Retourne false si la fenetre
// est bloquee.
export function genererEtImprimerFichePaie(salaire, fenetrePreouverte) {
  const fenetre = fenetrePreouverte || window.open("", "_blank");
  if (!fenetre) return false;

  const ens = salaire.enseignant || {};
  const ecole = completerEtablissement(salaire.etablissement);
  const { classes, matieres } = classesEtMatieres(ens.affectations);
  const contrat = CONTRATS_FICHE[ens.contrat_actif?.type];
  const poste = matieres.length ? `Professeur de ${matieres.join(", ")}` : "Enseignant";
  const periode = `${MOIS[salaire.mois - 1] || ""} ${salaire.annee}`;
  const nomComplet = `${ens.prenom ?? ""} ${ens.nom ?? ""}`.trim();
  const heuresSupp = Number(salaire.nb_heures_supp) || 0;
  const montantSupp = heuresSupp * (Number(salaire.taux_heure_supp) || 0);
  const estHoraire = salaire.type_remuneration === "horaire";
  const montantBase = estHoraire ? Number(salaire.nb_heures) * Number(salaire.taux_horaire) : Number(salaire.salaire_base);
  const estPaye = salaire.statut === "paye";

  const ligneBase = estHoraire
    ? `<div class="ligne"><div><div class="ligne-titre">Heures d'enseignement</div><div class="ligne-detail mono">${Number(salaire.nb_heures)} h × ${formaterMontant(salaire.taux_horaire)} GNF / heure</div></div><div class="mt">${formaterMontant(montantBase)} GNF</div></div>`
    : `<div class="ligne"><div><div class="ligne-titre">Salaire de base mensuel</div><div class="ligne-detail">${echapperHtml(contrat?.detail || "Rémunération mensuelle fixe")}</div></div><div class="mt">${formaterMontant(montantBase)} GNF</div></div>`;
  const ligneSupp = montantSupp > 0
    ? `<div class="pointille"></div><div class="ligne supp"><div><div class="ligne-titre">⚡ Heures supplémentaires</div><div class="ligne-detail mono">${heuresSupp} h × ${formaterMontant(salaire.taux_heure_supp)} GNF / heure</div></div><div class="mt">+ ${formaterMontant(montantSupp)} GNF</div></div>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Fiche de paie ${echapperHtml(nomComplet)} - ${echapperHtml(periode)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1e293b; background: #f1f5f9; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .doc { max-width: 760px; margin: 20px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.15); border: 1px solid #e2e8f0; }
    .mono { font-family: Consolas, 'Courier New', monospace; }
    .header { position: relative; background: #0C447C; color: white; padding: 24px 28px 22px; display: flex; justify-content: space-between; align-items: center; gap: 16px; }
    .header::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 4px; background: linear-gradient(to right, #0C447C, #10b981); }
    .marque { display: flex; align-items: center; gap: 12px; }
    .logo { width: 48px; height: 48px; border-radius: 12px; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 24px; overflow: hidden; }
    .logo.avec-image { background: #fff; padding: 3px; }
    .logo img { width: 100%; height: 100%; object-fit: contain; }
    .marque-mentions { font-size: 10px; color: rgba(255,255,255,0.7); margin-top: 2px; }
    .marque-nom { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; display: flex; align-items: center; gap: 8px; }
    .marque-tag { font-size: 10px; text-transform: uppercase; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: rgba(16,185,129,0.2); color: #6ee7b7; border: 1px solid rgba(52,211,153,0.3); }
    .marque-sous { font-size: 11px; color: rgba(255,255,255,0.75); margin-top: 2px; }
    .titre { text-align: right; }
    .titre-sur { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #bfdbfe; }
    .titre-doc { font-size: 22px; font-weight: 900; letter-spacing: -0.3px; }
    .titre-num { display: inline-block; margin-top: 4px; font-size: 11px; padding: 2px 10px; border-radius: 4px; background: rgba(255,255,255,0.2); font-weight: 600; }
    .corps { padding: 24px 28px; }
    .pave { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 22px; }
    .grille { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .etiquette { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; }
    .valeur { font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 2px; }
    .petit { font-size: 11px; color: #64748b; margin-top: 2px; }
    .badge { display: inline-block; font-size: 11px; font-weight: 600; padding: 2px 10px; border-radius: 999px; margin-left: 6px; vertical-align: middle; }
    .periode { display: inline-block; margin-top: 4px; padding: 4px 12px; border-radius: 8px; background: #0C447C; color: white; font-size: 13px; font-weight: 700; }
    .puces { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
    .puce { padding: 2px 8px; border-radius: 6px; background: white; border: 1px solid #e2e8f0; font-size: 11px; font-weight: 500; color: #334155; }
    .section-titre { display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; margin-bottom: 14px; }
    .section-titre h2 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #0C447C; }
    .section-titre span { font-size: 11px; color: #94a3b8; }
    .ligne { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 6px 12px; border-radius: 8px; }
    .ligne-titre { font-size: 13px; font-weight: 600; color: #1e293b; }
    .ligne-detail { font-size: 11px; color: #64748b; margin-top: 1px; }
    .mt { font-family: Consolas, 'Courier New', monospace; font-size: 14px; font-weight: 700; color: #0f172a; white-space: nowrap; }
    .pointille { border-top: 1px dashed #cbd5e1; margin: 8px 0; }
    .ligne.supp { background: #ecfdf5; border: 1px solid #d1fae5; padding: 8px 12px; }
    .ligne.supp .ligne-titre { color: #065f46; }
    .ligne.supp .ligne-detail { color: #047857; }
    .ligne.supp .mt { color: #047857; }
    .separateur { border-top: 2px solid #e2e8f0; margin: 12px 0; }
    .total { background: #ecfdf5; border: 2px solid #a7f3d0; border-radius: 12px; padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .total-libelle { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #065f46; }
    .total-montant { font-family: Consolas, 'Courier New', monospace; font-size: 28px; font-weight: 800; color: #047857; margin-top: 2px; }
    .statut { display: inline-block; padding: 6px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; white-space: nowrap; }
    .statut.paye { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
    .statut.attente { background: #fef9c3; color: #a16207; border: 1px solid #fcd34d; }
    .lettres { margin-top: 8px; font-size: 11px; color: #64748b; font-style: italic; }
    .reglement { margin-top: 22px; }
    .reglement h2 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #0C447C; margin-bottom: 12px; }
    .reglement .etiquette { text-transform: none; letter-spacing: 0; font-size: 11px; font-weight: 500; }
    .reglement .valeur { font-size: 13px; font-weight: 600; color: #1e293b; }
    .obs { grid-column: 1 / -1; padding-top: 8px; border-top: 1px solid #e2e8f0; }
    .obs p { font-style: italic; color: #334155; margin-top: 2px; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; text-align: center; }
    .signature { border: 1px dashed #cbd5e1; border-radius: 12px; padding: 14px; min-height: 120px; display: flex; flex-direction: column; justify-content: space-between; }
    .signature-titre { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #475569; }
    .signature-mention { font-size: 11px; color: #94a3b8; font-style: italic; }
    .signature-nom { font-size: 11px; font-weight: 600; color: #1e293b; border-top: 1px solid #cbd5e1; padding-top: 6px; }
    .pied { margin-top: 22px; padding-top: 14px; border-top: 1px solid #e2e8f0; display: flex; align-items: center; gap: 14px; }
    .qr-code { width: 76px; height: 76px; flex-shrink: 0; }
    .qr-code svg { display: block; }
    .pied-texte { flex: 1; display: flex; justify-content: space-between; gap: 12px; font-size: 10px; color: #94a3b8; }
    .btn-group { display: flex; gap: 10px; justify-content: center; padding: 12px; border-top: 1px solid #e2e8f0; background: #f8fafc; }
    .btn { padding: 7px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; }
    .btn-print { background: #0C447C; color: white; }
    .btn-close { background: #e2e8f0; color: #475569; }
    @media print {
      body { background: white; }
      .doc { box-shadow: none; margin: 0; max-width: none; border-radius: 0; border: none; }
      .btn-group { display: none !important; }
      @page { size: A4 portrait; margin: 10mm; }
    }
  </style>
</head>
<body>
<div class="doc">
  <div class="header">
    <div class="marque">
      ${ecole.logo_url ? `<div class="logo avec-image"><img src="${echapperHtml(ecole.logo_url)}" alt=""></div>` : `<div class="logo">🎓</div>`}
      <div>
        <div class="marque-nom">LAKOLI <span class="marque-tag">Scolaire</span></div>
        <div class="marque-sous">${echapperHtml(ecole.nom || "Gestion scolaire · République de Guinée")}</div>
        ${ecole.agrement || ecole.slogan ? `<div class="marque-mentions">${[ecole.agrement && `Agrément n° ${echapperHtml(ecole.agrement)}`, ecole.slogan && `« ${echapperHtml(ecole.slogan)} »`].filter(Boolean).join(" · ")}</div>` : ""}
      </div>
    </div>
    <div class="titre">
      <div class="titre-sur">Rémunération du personnel</div>
      <div class="titre-doc">FICHE DE PAIE</div>
      <div class="titre-num mono">N° ${echapperHtml(salaire.reference)}</div>
    </div>
  </div>

  <div class="corps">
    <div class="pave grille">
      <div>
        <div class="etiquette">Nom & prénom de l'enseignant</div>
        <div class="valeur">${echapperHtml(nomComplet)}</div>
        <div class="petit">Matricule : <span class="mono">${echapperHtml(ens.matricule || "—")}</span></div>
      </div>
      <div>
        <div class="etiquette">Poste & statut contractuel</div>
        <div class="valeur">${echapperHtml(poste)}${contrat ? `<span class="badge" style="background:${contrat.fond};color:${contrat.texte}">${contrat.libelle}</span>` : ""}</div>
      </div>
      <div>
        <div class="etiquette">Période concernée</div>
        <div><span class="periode">📅 ${echapperHtml(periode)}</span></div>
      </div>
      <div>
        <div class="etiquette">Classes assignées</div>
        <div class="puces">${classes.length ? classes.map((c) => `<span class="puce">${echapperHtml(c)}</span>`).join("") : `<span class="petit">—</span>`}</div>
      </div>
    </div>

    <div class="section-titre"><h2>Détail de la rémunération</h2><span class="mono">Devise : Franc guinéen (GNF)</span></div>
    ${ligneBase}
    ${ligneSupp}
    <div class="separateur"></div>
    <div class="total">
      <div>
        <div class="total-libelle">Total net à payer</div>
        <div class="total-montant">${formaterMontant(salaire.montant_net)} GNF</div>
      </div>
      <span class="statut ${estPaye ? "paye" : "attente"}">${estPaye ? "✓ PAYÉ EN INTÉGRALITÉ" : "⏳ EN ATTENTE DE PAIEMENT"}</span>
    </div>
    <div class="lettres">Arrêtée la présente fiche à la somme de ${echapperHtml(montantEnLettres(salaire.montant_net))}.</div>

    <div class="pave reglement">
      <h2>Modalités de règlement</h2>
      <div class="grille">
        <div><div class="etiquette">Moyen de paiement</div><div class="valeur">${echapperHtml(MOYENS_FICHE[salaire.moyen_paiement] || salaire.moyen_paiement)}</div></div>
        <div><div class="etiquette">Référence d'enregistrement</div><div class="valeur mono">${echapperHtml(salaire.reference)}</div></div>
        <div><div class="etiquette">Date effective de versement</div><div class="valeur">${estPaye ? formaterDate(salaire.date_paiement) : "En attente de décaissement"}</div></div>
        <div><div class="etiquette">Caissier / responsable</div><div class="valeur">${echapperHtml(salaire.caissier?.name || "—")}</div></div>
        ${salaire.observation ? `<div class="obs"><div class="etiquette">Observation</div><p>${echapperHtml(salaire.observation)}</p></div>` : ""}
      </div>
    </div>

    <div class="signatures">
      <div class="signature">
        <div class="signature-titre">Signature de l'enseignant</div>
        <div class="signature-mention">« Pour acquit »</div>
        <div class="signature-nom">${echapperHtml(nomComplet)}</div>
      </div>
      <div class="signature">
        <div class="signature-titre">Signature du directeur & cachet</div>
        <div class="signature-mention">&nbsp;</div>
        <div class="signature-nom">La Direction</div>
      </div>
    </div>

    <div class="pied">
      <div class="qr-code">${qrCodeSvg([
        "LAKOLI - Fiche de paie",
        `Réf : ${salaire.reference}`,
        `Enseignant : ${nomComplet}${ens.matricule ? ` (${ens.matricule})` : ""}`,
        `Période : ${periode}`,
        `Net à payer : ${montantTexte(salaire.montant_net)} GNF`,
        `Statut : ${estPaye ? `Payé le ${formaterDate(salaire.date_paiement)}` : "En attente"}`,
      ].join("\n"), 76)}</div>
      <div class="pied-texte">
        <span>Document officiel LAKOLI · Fiche de paie · République de Guinée</span>
        <span class="mono">Édité le ${echapperHtml(dateImpression())}</span>
      </div>
    </div>
  </div>

  <div class="btn-group">
    <button class="btn btn-print" onclick="window.print()">🖨️ Imprimer (A4)</button>
    <button class="btn btn-close" onclick="window.close()">✕ Fermer</button>
  </div>
</div>
</body>
</html>`;

  fenetre.document.open();
  fenetre.document.write(html);
  fenetre.document.close();
  fenetre.focus();
  return true;
}
