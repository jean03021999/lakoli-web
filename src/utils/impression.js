// Documents imprimables (recu de paiement, releve) : HTML complet injecte dans une fenetre
// ouverte avec window.open(), style noir et blanc optimise pour @media print.

import QRCode from "qrcode";

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
const LOGO_SVG_BLANC = LOGO_SVG.split('stroke="#000"').join('stroke="#fff"');

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

  .doc-releve .pied-premium {
    margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0;
    text-align: center; font-size: 11px; color: #475569;
  }

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

function ligneInfo(libelle, valeurHtml) {
  return `<tr><td class="lib">${echapperHtml(libelle)}</td><td>${valeurHtml}</td></tr>`;
}

export const MOYENS_PAIEMENT = {
  especes: "Espèces",
  mobile_money: "Mobile Money",
  virement: "Virement",
  cheque: "Chèque",
};

// "Payé" -> "✓ Payé" ; les autres statuts (Partiel, À échoir, En retard) restent tels quels.
function texteBadgeStatut(statut) {
  return normaliserTexte(statut) === "paye" ? `✓ ${statut}` : statut;
}

// Section "Situation globale de l'élève" du recu : inscription (si presente) + chaque echeance
// de scolarite + total restant du sur l'annee. Retourne une chaine vide si `situation` est
// absent (le champ est optionnel sur `data`).
function situationGlobaleHtml(situation) {
  if (!situation) return "";

  const ligneInscription = situation.inscription
    ? `
      <div class="ligne-situation">
        <span>${echapperHtml(situation.inscription.libelle)}</span>
        <span class="${classeBadgeStatut(situation.inscription.statut)}">${echapperHtml(texteBadgeStatut(situation.inscription.statut))}</span>
        <span>${Number(situation.inscription.montant_paye).toLocaleString("fr-FR")} GNF</span>
      </div>`
    : "";

  const lignesEcheances = (situation.echeances || [])
    .map(
      (ech) => `
      <div class="ligne-situation">
        <span>${echapperHtml(ech.libelle)}</span>
        <span class="${classeBadgeStatut(ech.statut)}">${echapperHtml(texteBadgeStatut(ech.statut))}</span>
        <span>${Number(ech.montant_paye).toLocaleString("fr-FR")} GNF / ${Number(ech.montant).toLocaleString("fr-FR")} GNF</span>
      </div>`
    )
    .join("");

  return `
    <div class="section">
      <div class="section-title">📊 Situation globale de l'élève</div>
      ${ligneInscription}
      <div class="situation-header">Scolarité annuelle : ${Number(situation.totalScolarite).toLocaleString("fr-FR")} GNF</div>
      ${lignesEcheances}
      <div class="reste-box">
        <span>⚠️ RESTE À PAYER</span>
        <span class="reste-montant">${Number(situation.resteGlobal).toLocaleString("fr-FR")} GNF</span>
      </div>
    </div>`;
}

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

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Reçu de Paiement LAKOLI</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; background: #f8fafc; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .recu { max-width: 680px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.12); }
    .bande-top { height: 4px; background: linear-gradient(90deg, #0C447C 0%, #10b981 100%); }

    /* EN-TÊTE */
    .header { background: linear-gradient(135deg, #0C447C 0%, #1a6bb5 100%); color: white; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; position: relative; overflow: hidden; }
    .header::before { content: ''; position: absolute; top: -30px; right: -30px; width: 120px; height: 120px; background: rgba(255,255,255,0.06); border-radius: 50%; }
    .header::after { content: ''; position: absolute; bottom: -40px; right: 80px; width: 90px; height: 90px; background: rgba(255,255,255,0.04); border-radius: 50%; }
    .header-left { display: flex; align-items: center; gap: 10px; position: relative; z-index: 1; }
    .logo-box, .header-icon { width: 48px; height: 48px; background: linear-gradient(135deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.08) 100%); border-radius: 12px; border: 1px solid rgba(255,255,255,0.25); box-shadow: inset 0 1px 2px rgba(255,255,255,0.40), inset 0 -3px 8px rgba(0,0,0,0.18); display: flex; align-items: center; justify-content: center; font-size: 24px; }
    .logo-name, .header-title { font-size: 22px; font-weight: 800; letter-spacing: 2px; }
    .logo-sub, .header-sub { font-size: 11px; opacity: 0.7; margin-top: 2px; }
    .header-right { text-align: right; position: relative; z-index: 1; }
    .recu-titre { font-size: 18px; font-weight: 700; letter-spacing: 1.5px; }
    .recu-num { display: inline-block; font-size: 12px; margin-top: 6px; font-family: monospace; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); padding: 2px 10px; border-radius: 12px; }

    /* CORPS */
    .body { padding: 0; background: white; }

    /* SECTIONS */
    .section { padding: 14px 20px; border-bottom: 1px solid #f1f5f9; }
    .section:last-child { border-bottom: none; }
    .section-label, .section-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; margin-bottom: 8px; }

    /* ÉLÈVE */
    .eleve-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .eleve-item label { font-size: 10px; color: #94a3b8; display: block; margin-bottom: 2px; font-weight: 500; }
    .eleve-item span { font-size: 13px; font-weight: 600; color: #1e293b; }

    /* PAIEMENT DU JOUR */
    .ligne-paiement { display: flex; justify-content: space-between; align-items: center; padding: 7px 0; border-bottom: 1px dashed #e2e8f0; }
    .ligne-paiement:last-child { border-bottom: none; }
    .ligne-libelle { font-size: 13px; color: #334155; }
    .ligne-montant { font-size: 14px; font-weight: 700; color: #1e293b; font-family: monospace; }

    /* TOTAL */
    .total-box { margin: 0 20px 0; background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 1px solid #86efac; border-radius: 10px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; }
    .total-label { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #15803d; }
    .total-check { width: 20px; height: 20px; border-radius: 50%; background: #16a34a; color: white; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; box-shadow: 0 0 0 3px rgba(22,163,74,0.18); animation: check-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
    @keyframes check-pop { 0% { transform: scale(0) rotate(-45deg); opacity: 0; } 100% { transform: scale(1) rotate(0); opacity: 1; } }
    .total-montant { font-size: 20px; font-weight: 800; color: #15803d; font-family: monospace; }

    /* STATUT */
    .statut-box { margin: 11px 20px; text-align: center; padding: 8px; border-radius: 8px; font-weight: 700; font-size: 12px; letter-spacing: 0.5px; }
    .statut-paye { background: #f0fdf4; color: #15803d; border: 1px solid #86efac; }
    .statut-partiel { background: #fffbeb; color: #d97706; border: 1px solid #fcd34d; }

    /* SITUATION GLOBALE */
    .situation-header { background: #f8fafc; padding: 7px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 8px; display: flex; justify-content: space-between; }
    .ligne-situation { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
    .ligne-situation:last-child { border-bottom: none; }
    .ligne-sit-libelle, .ligne-situation > span:first-child { color: #475569; flex: 1; }
    .ligne-sit-montant, .ligne-situation > span:last-child { color: #334155; font-weight: 600; font-family: monospace; font-size: 12px; margin-left: 12px; }
    .badge, .badge-paye, .badge-partiel, .badge-echoir, .badge-retard { padding: 1px 6px; border-radius: 10px; font-size: 10px; font-weight: 700; margin: 0 8px; white-space: nowrap; }
    .badge-paye { background: #dcfce7; color: #15803d; }
    .badge-partiel { background: #fef9c3; color: #a16207; }
    .badge-echoir { background: #f1f5f9; color: #64748b; }
    .badge-retard { background: #fee2e2; color: #dc2626; }
    .reste-global, .reste-box { display: flex; justify-content: space-between; align-items: center; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 10px 14px; margin-top: 10px; }
    .reste-global-label, .reste-box > span:first-child { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #ea580c; }
    .reste-global-montant, .reste-montant { font-size: 16px; font-weight: 800; color: #ea580c; font-family: monospace; }

    /* RÈGLEMENT */
    .reglement-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .reg-item label { font-size: 10px; color: #94a3b8; display: block; margin-bottom: 2px; font-weight: 500; }
    .reg-item span { font-size: 13px; font-weight: 600; color: #1e293b; }

    /* SIGNATURES */
    .signature-zone { display: flex; justify-content: space-between; gap: 20px; padding: 12px 20px 0; }
    .signature-box { text-align: center; padding-top: 28px; }
    .signature-line { border-top: 1.5px dashed #94a3b8; width: 200px; padding-top: 4px; }
    .signature-label { font-size: 10px; color: #64748b; }

    /* PIED DE PAGE */
    .footer { background: #f8fafc; padding: 10px 20px; display: flex; align-items: center; gap: 12px; border-top: 1px solid #e2e8f0; margin-top: 14px; }
    .qr-code { width: 80px; height: 80px; flex-shrink: 0; }
    .qr-code svg { display: block; }
    .footer-texte { flex: 1; text-align: center; padding-right: 92px; }
    .footer p { font-size: 10px; color: #94a3b8; line-height: 1.6; }

    /* BOUTONS */
    .btn-group { display: flex; gap: 10px; justify-content: center; padding: 11px; background: white; border-top: 1px solid #e2e8f0; }
    .btn { padding: 6px 15px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: opacity 0.15s; }
    .btn:hover { opacity: 0.85; }
    .btn-print { background: #0C447C; color: white; }
    .btn-close { background: #e2e8f0; color: #475569; }

    @media print {
      body { background: white; }
      .recu { box-shadow: none; margin: 0; border-radius: 0; }
      .total-check { animation: none; }
      .btn-group { display: none !important; }
      @page { margin: 8mm; size: A4; }
    }
  </style>
</head>
<body>
  <div class="bande-top"></div>
  <div class="header">
    <div class="header-left">
      <div class="header-icon">🎓</div>
      <div>
        <div class="header-title">LAKOLI</div>
        <div class="header-sub">Gestion Scolaire · Guinée</div>
      </div>
    </div>
    <div class="header-right">
      <div class="recu-titre">REÇU DE PAIEMENT</div>
      <div class="recu-num">N° ${echapperHtml(data.reference)}</div>
    </div>
  </div>

  <div class="body">
    <div class="section">
      <div class="section-title">👤 Élève</div>
      <div class="eleve-grid">
        <div class="eleve-item"><label>Nom complet</label><span>${echapperHtml(data.eleve?.nom)} ${echapperHtml(data.eleve?.prenom)}</span></div>
        <div class="eleve-item"><label>Matricule</label><span>${echapperHtml(data.eleve?.matricule)}</span></div>
        <div class="eleve-item"><label>Classe</label><span>${echapperHtml(data.eleve?.classe)}</span></div>
        <div class="eleve-item"><label>Session scolaire</label><span>${echapperHtml(data.session)}</span></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">💳 Détail du paiement</div>
      ${data.lignes.map((l) => `
        <div class="ligne-paiement">
          <span class="ligne-libelle">${echapperHtml(l.libelle)}</span>
          <span class="ligne-montant">${Number(l.montant).toLocaleString("fr-FR")} GNF</span>
        </div>
      `).join("")}
    </div>

    <div class="total-box">
      <span class="total-label"><span class="total-check">✓</span>Total encaissé</span>
      <span class="total-montant">${Number(data.total).toLocaleString("fr-FR")} GNF</span>
    </div>

    <div class="statut-box ${data.estSolde ? "statut-paye" : "statut-partiel"}">
      ${data.estSolde ? "✓ PAYÉ EN INTÉGRALITÉ" : `PAIEMENT PARTIEL · Reste à payer : ${Number(data.resteAPayer).toLocaleString("fr-FR")} GNF`}
    </div>

    <div class="section">
      <div class="section-title">🧾 Règlement</div>
      <div class="reglement-grid">
        <div class="reg-item"><label>Moyen de paiement</label><span>${echapperHtml(data.moyen)}</span></div>
        <div class="reg-item"><label>Référence</label><span>${echapperHtml(data.reference)}</span></div>
        <div class="reg-item"><label>Date et heure</label><span>${echapperHtml(data.date)} à ${echapperHtml(data.heure)}</span></div>
        <div class="reg-item"><label>Caissier</label><span>${echapperHtml(data.caissier)}</span></div>
      </div>
    </div>

    ${situationGlobaleHtml(data.situationGlobale)}

    <div class="signature-zone">
      <div class="signature-box">
        <div class="signature-line">
          <div class="signature-label">Signature et cachet du caissier</div>
        </div>
      </div>
      <div class="signature-box">
        <div class="signature-line">
          <div class="signature-label">Signature et cachet du directeur</div>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="qr-code">${qrCodeSvg([
        "LAKOLI - Reçu de paiement",
        `Réf : ${data.reference}`,
        `Élève : ${data.eleve?.nom ?? ""} ${data.eleve?.prenom ?? ""}${data.eleve?.matricule ? ` (${data.eleve.matricule})` : ""}`,
        `Montant : ${montantTexte(data.total)} GNF`,
        `Date : ${data.date} ${data.heure}`,
        `Statut : ${data.estSolde ? "Soldé" : `Partiel, reste ${montantTexte(data.resteAPayer)} GNF`}`,
      ].join("\n"), 80)}</div>
      <div class="footer-texte">
        <p>Document officiel LAKOLI · Certifié conforme aux normes scolaires de la République de Guinée</p>
        <p>Imprimé le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
      </div>
    </div>
  </div>

  <div class="btn-group">
    <button class="btn btn-print" onclick="window.print()">🖨️ Imprimer</button>
    <button class="btn btn-close" onclick="window.close()">✕ Fermer</button>
  </div>
</body>
</html>`;

  fenetre.document.open();
  fenetre.document.write(html);
  fenetre.document.close();
  fenetre.focus();
  return true;
}

// Minuscules et sans accents : reconnait "Inscription"/"Réinscription" quel que soit le cas.
function normaliserTexte(texte) {
  return (texte || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// "Payé" -> badge-paye, "En retard" -> badge-retard, etc. ; "À échoir" (et tout statut
// inconnu) retombe sur le badge neutre par defaut.
function classeBadgeStatut(statut) {
  const s = normaliserTexte(statut);
  if (s === "paye") return "badge-paye";
  if (s === "partiel") return "badge-partiel";
  if (s === "en retard") return "badge-retard";
  return "badge-echoir";
}

// ---------------------------------------------------------------------------
// Releve de paiements
// ---------------------------------------------------------------------------
// eleve : { nom, prenom, matricule, classe, session } ;
// lignes : [{ libelle, montant, paye, statut, dernierPaiement }] ; etablissement : nom.
export function genererReleveHtml({ etablissement, eleve, lignes }) {
  const tiret = "—";

  // Inscription puis Reinscription en tete, le reste (Trimestre 1, 2, 3...) dans l'ordre recu.
  // Array#sort est stable (garanti depuis ES2019) : les egalites (toutes les lignes de
  // scolarite, rang 2) conservent donc leur ordre d'origine.
  const ORDRE_TETE = { inscription: 0, reinscription: 1 };
  const lignesTriees = [...lignes].sort(
    (a, b) => (ORDRE_TETE[normaliserTexte(a.libelle)] ?? 2) - (ORDRE_TETE[normaliserTexte(b.libelle)] ?? 2)
  );

  const total = lignesTriees.reduce((s, l) => s + l.montant, 0);
  const paye = lignesTriees.reduce((s, l) => s + l.paye, 0);

  const corpsTableau = lignesTriees
    .map(
      (l) => `<tr>
        <td>${echapperHtml(l.libelle)}</td>
        <td class="droite">${formaterMontant(l.montant)}</td>
        <td class="droite">${formaterMontant(l.paye)}</td>
        <td class="droite">${formaterMontant(Math.max(0, l.montant - l.paye))}</td>
        <td><span class="badge-statut ${classeBadgeStatut(l.statut)}">${echapperHtml(l.statut)}</span></td>
        <td>${l.dernierPaiement ? formaterDate(l.dernierPaiement) : tiret}</td>
      </tr>`
    )
    .join("");

  return `
  <div class="doc-releve">
    <div class="entete-premium">
      <div class="logo">
        ${LOGO_SVG_BLANC}
        <div>
          <div class="nom">LAKOLI</div>
          ${etablissement ? `<span class="badge-etablissement">${echapperHtml(etablissement)}</span>` : ""}
        </div>
      </div>
      <div class="titre">
        <h1>RELEVÉ DE PAIEMENTS</h1>
      </div>
    </div>

    <div class="bloc-eleve">
      <h2>Élève</h2>
      <table class="infos">
        ${ligneInfo("Nom", echapperHtml(eleve.nom || tiret))}
        ${ligneInfo("Prénom", echapperHtml(eleve.prenom || tiret))}
        ${ligneInfo("Matricule", echapperHtml(eleve.matricule || tiret))}
        ${ligneInfo("Classe", echapperHtml(eleve.classe || tiret))}
        ${ligneInfo("Session scolaire", echapperHtml(eleve.session || tiret))}
      </table>
    </div>

    <table class="tableau-premium">
      <thead>
        <tr>
          <th>Échéance</th>
          <th class="droite">Montant dû (GNF)</th>
          <th class="droite">Payé (GNF)</th>
          <th class="droite">Reste (GNF)</th>
          <th>Statut</th>
          <th>Dernier paiement</th>
        </tr>
      </thead>
      <tbody>
        ${corpsTableau}
        <tr class="total">
          <td>TOTAL GÉNÉRAL</td>
          <td class="droite">${formaterMontant(total)}</td>
          <td class="droite">${formaterMontant(paye)}</td>
          <td class="droite">${formaterMontant(Math.max(0, total - paye))}</td>
          <td colspan="2"></td>
        </tr>
      </tbody>
    </table>

    <div class="signature-zone">
      <div class="cadre">
        <div class="ligne"></div>
        <div class="libelle">Signature et cachet du caissier</div>
      </div>
    </div>

    <div class="pied-premium">
      Document officiel LAKOLI · Certifié conforme aux normes scolaires de la République de Guinée<br>
      Imprimé le ${echapperHtml(dateImpression())}
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
        ${LOGO_SVG_BLANC}
        <div>
          <div class="nom">LAKOLI</div>
          ${etablissement ? `<span class="badge-etablissement">${echapperHtml(etablissement)}</span>` : ""}
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
// Rapport comptable — synthese imprimable (ou enregistrable en PDF) du tableau de bord comptable,
// avec les donnees reelles. Une section dont la source n'a pas pu etre chargee est signalee
// « indisponible » plutot que remplie de zeros. A passer a imprimerDocument().
//   indicateurs : { totalEleves, paiementsAujourdhui, enRetard, totalEncaisse } (null = indisponible)
//   finances    : { inscriptions, reinscriptions, scolarite, autres } | null
//   classes     : [{ classe, niveau, nombre_eleves, montant_total, montant_encaisse, nombre_soldes, nombre_en_retard }] | null
//   inscriptions: { nouveaux, reinscrits, aReinscrire, total } | null
//   elevesEnRetard : [{ nom, prenom, matricule, classe }] | null
//   paiements   : [{ date_paiement, heure, eleve: { nom_complet, classe }, type_frais, libelle, montant, moyen_paiement }] | null
// ---------------------------------------------------------------------------
const NB_DERNIERS_ENCAISSEMENTS = 20;

export function genererRapportComptableHtml({
  etablissement, session, dateDonnees, indicateurs, finances, classes, inscriptions, elevesEnRetard, paiements,
}) {
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
    ["Élèves inscrits", nombre(indicateurs.totalEleves)],
    ["Paiements aujourd'hui", nombre(indicateurs.paiementsAujourdhui)],
    ["Élèves en retard", nombre(indicateurs.enRetard)],
    ["Total encaissé", indicateurs.totalEncaisse === null ? tiret : `${formaterMontant(indicateurs.totalEncaisse)} GNF`],
    ["Scolarité due", totalDu === null ? tiret : `${formaterMontant(totalDu)} GNF`],
    ["Taux de recouvrement", totalDu === null ? tiret : pct(totalEncaisseClasses, totalDu)],
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
    const { nouveaux, reinscrits, aReinscrire, total } = inscriptions;
    sectionInscriptions = `<table class="tableau-premium">
      <thead><tr><th>Situation</th><th class="droite">Élèves</th><th class="droite">Part</th></tr></thead>
      <tbody>
        <tr><td>Nouveaux inscrits</td><td class="droite">${nouveaux}</td><td class="droite">${pct(nouveaux, total)}</td></tr>
        <tr><td>Réinscrits</td><td class="droite">${reinscrits}</td><td class="droite">${pct(reinscrits, total)}</td></tr>
        <tr><td>À réinscrire</td><td class="droite">${aReinscrire}</td><td class="droite">${pct(aReinscrire, total)}</td></tr>
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
      ? `<p class="vide">Aucun paiement enregistré.</p>`
      : `<table class="tableau-premium compact">
          <thead><tr><th>Date</th><th>Élève</th><th>Classe</th><th>Objet</th><th>Moyen</th><th class="droite">Montant (GNF)</th></tr></thead>
          <tbody>${derniers
            .map((p) => `<tr>
              <td>${p.date_paiement ? formaterDate(p.date_paiement) : tiret}${p.heure ? ` <span class="gris">${echapperHtml(p.heure)}</span>` : ""}</td>
              <td>${echapperHtml(p.eleve?.nom_complet || tiret)}</td>
              <td>${echapperHtml(p.eleve?.classe || tiret)}</td>
              <td>${echapperHtml([p.type_frais, p.libelle].filter(Boolean).join(" · ") || tiret)}</td>
              <td>${echapperHtml(MOYENS_PAIEMENT[p.moyen_paiement] || p.moyen_paiement || tiret)}</td>
              <td class="droite"><strong>${formaterMontant(p.montant)}</strong></td>
            </tr>`)
            .join("")}</tbody>
        </table>
        ${paiements.length > derniers.length ? `<p class="note">${derniers.length} derniers sur ${paiements.length} paiements enregistrés.</p>` : ""}`;
  }

  const dateTexte = dateDonnees
    ? `${dateDonnees.toLocaleDateString("fr-FR")} à ${dateDonnees.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
    : tiret;

  return `
  <div class="doc-releve rapport">
    <div class="entete-premium">
      <div class="logo">
        ${LOGO_SVG_BLANC}
        <div>
          <div class="nom">LAKOLI</div>
          ${etablissement ? `<span class="badge-etablissement">${echapperHtml(etablissement)}</span>` : ""}
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

const POSTES_CONTRAT = { cdi: "Enseignant (CDI)", cdd: "Enseignant (CDD)", vacataire: "Enseignant vacataire" };

// "6ème A (Maths, Physique)" — une entree par classe, avec les matieres enseignees.
function classesEnseignees(affectations) {
  const parClasse = new Map();
  for (const a of affectations || []) {
    const classe = a.classe?.nom;
    if (!classe) continue;
    if (!parClasse.has(classe)) parClasse.set(classe, new Set());
    if (a.matiere?.nom) parClasse.get(classe).add(a.matiere.nom);
  }
  return [...parClasse].map(([classe, matieres]) => (matieres.size ? `${classe} (${[...matieres].join(", ")})` : classe));
}

// `salaire` : reponse de GET /salaires/{id} (avec enseignant.contrat_actif, enseignant.affectations
// .classe/.matiere et etablissement). Retourne false si la fenetre est bloquee.
export function genererEtImprimerFichePaie(salaire, fenetrePreouverte) {
  const fenetre = fenetrePreouverte || window.open("", "_blank");
  if (!fenetre) return false;

  const ens = salaire.enseignant || {};
  const classes = classesEnseignees(ens.affectations);
  const poste = POSTES_CONTRAT[ens.contrat_actif?.type] || "Enseignant";
  const periode = `${MOIS[salaire.mois - 1] || ""} ${salaire.annee}`;
  const heuresSupp = Number(salaire.nb_heures_supp) || 0;
  const estPaye = salaire.statut === "paye";

  const ligneBase = salaire.type_remuneration === "horaire"
    ? `<div class="ligne"><span>Heures effectuées : ${Number(salaire.nb_heures)} h × ${formaterMontant(salaire.taux_horaire)} GNF</span><span class="mt">${formaterMontant(Number(salaire.nb_heures) * Number(salaire.taux_horaire))} GNF</span></div>`
    : `<div class="ligne"><span>Salaire de base</span><span class="mt">${formaterMontant(salaire.salaire_base)} GNF</span></div>`;
  const ligneSupp = heuresSupp > 0
    ? `<div class="ligne"><span>Heures supplémentaires : ${heuresSupp} h × ${formaterMontant(salaire.taux_heure_supp)} GNF</span><span class="mt">${formaterMontant(heuresSupp * Number(salaire.taux_heure_supp))} GNF</span></div>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Fiche de paie ${echapperHtml(ens.nom)} ${echapperHtml(ens.prenom)} - ${echapperHtml(periode)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1e293b; background: #f8fafc; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .doc { max-width: 680px; margin: 20px auto; background: white; box-shadow: 0 4px 24px rgba(0,0,0,0.12); }
    .bande-top { height: 4px; background: linear-gradient(90deg, #0C447C 0%, #10b981 100%); }
    .header { background: linear-gradient(135deg, #0C447C 0%, #1a6bb5 100%); color: white; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; }
    .header-left { display: flex; align-items: center; gap: 10px; }
    .header-icon { width: 48px; height: 48px; background: linear-gradient(135deg, rgba(255,255,255,0.30), rgba(255,255,255,0.08)); border: 1px solid rgba(255,255,255,0.25); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
    .header-title { font-size: 22px; font-weight: 800; letter-spacing: 2px; }
    .header-sub { font-size: 11px; opacity: 0.7; margin-top: 2px; }
    .header-right { text-align: right; }
    .doc-titre { font-size: 18px; font-weight: 700; letter-spacing: 1.5px; }
    .doc-num { display: inline-block; margin-top: 6px; font-family: monospace; font-size: 12px; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); padding: 2px 10px; border-radius: 12px; }
    .section { padding: 14px 20px; border-bottom: 1px solid #f1f5f9; }
    .section-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; margin-bottom: 8px; }
    .grille { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .grille.simple { background: none; border: none; padding: 0; }
    .item label { font-size: 10px; color: #94a3b8; display: block; margin-bottom: 2px; font-weight: 500; }
    .item span { font-size: 13px; font-weight: 600; }
    .item.large { grid-column: 1 / -1; }
    .ligne { display: flex; justify-content: space-between; align-items: center; padding: 7px 0; border-bottom: 1px dashed #e2e8f0; font-size: 13px; color: #334155; }
    .mt { font-family: monospace; font-weight: 700; font-size: 14px; color: #1e293b; white-space: nowrap; margin-left: 12px; }
    .separateur { border-top: 2px solid #1e293b; margin-top: 4px; }
    .total { margin-top: 12px; background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 1px solid #86efac; border-radius: 10px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; }
    .total-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #15803d; }
    .total-montant { font-size: 24px; font-weight: 800; color: #15803d; font-family: monospace; }
    .statut { display: inline-block; padding: 2px 10px; border-radius: 10px; font-size: 11px; font-weight: 700; }
    .statut.paye { background: #dcfce7; color: #15803d; }
    .statut.attente { background: #fef9c3; color: #a16207; }
    .obs { margin-top: 8px; font-size: 11px; color: #64748b; font-style: italic; }
    .signature-zone { display: flex; justify-content: space-between; gap: 20px; padding: 12px 20px 0; }
    .signature-box { text-align: center; padding-top: 36px; }
    .signature-line { border-top: 1.5px dashed #94a3b8; width: 200px; padding-top: 4px; font-size: 10px; color: #64748b; }
    .footer { background: #f8fafc; padding: 10px 20px; display: flex; align-items: center; gap: 12px; border-top: 1px solid #e2e8f0; margin-top: 16px; }
    .qr-code { width: 80px; height: 80px; flex-shrink: 0; }
    .qr-code svg { display: block; }
    .footer-texte { flex: 1; text-align: center; padding-right: 92px; }
    .footer p { font-size: 10px; color: #94a3b8; line-height: 1.6; }
    .btn-group { display: flex; gap: 10px; justify-content: center; padding: 11px; border-top: 1px solid #e2e8f0; }
    .btn { padding: 6px 15px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; }
    .btn-print { background: #0C447C; color: white; }
    .btn-close { background: #e2e8f0; color: #475569; }
    @media print {
      body { background: white; }
      .doc { box-shadow: none; margin: 0; max-width: none; }
      .btn-group { display: none !important; }
      @page { margin: 8mm; size: A4; }
    }
  </style>
</head>
<body>
<div class="doc">
  <div class="bande-top"></div>
  <div class="header">
    <div class="header-left">
      <div class="header-icon">🎓</div>
      <div>
        <div class="header-title">LAKOLI</div>
        <div class="header-sub">${echapperHtml(salaire.etablissement?.nom || "Gestion Scolaire · Guinée")}</div>
      </div>
    </div>
    <div class="header-right">
      <div class="doc-titre">FICHE DE PAIE</div>
      <div class="doc-num">N° ${echapperHtml(salaire.reference)}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">👤 Enseignant</div>
    <div class="grille">
      <div class="item"><label>Nom complet</label><span>${echapperHtml(ens.nom)} ${echapperHtml(ens.prenom)}</span></div>
      <div class="item"><label>Matricule</label><span>${echapperHtml(ens.matricule || "—")}</span></div>
      <div class="item"><label>Poste</label><span>${echapperHtml(poste)}</span></div>
      <div class="item"><label>Période</label><span>${echapperHtml(periode)}</span></div>
      <div class="item large"><label>Classes enseignées</label><span>${classes.length ? classes.map(echapperHtml).join(" · ") : "—"}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">💰 Rémunération</div>
    ${ligneBase}
    ${ligneSupp}
    <div class="separateur"></div>
    <div class="total">
      <span class="total-label">Total net à payer</span>
      <span class="total-montant">${formaterMontant(salaire.montant_net)} GNF</span>
    </div>
    <div class="obs">Arrêtée la présente fiche à la somme de ${echapperHtml(montantEnLettres(salaire.montant_net))}.</div>
  </div>

  <div class="section">
    <div class="section-title">🧾 Règlement</div>
    <div class="grille simple">
      <div class="item"><label>Moyen de paiement</label><span>${echapperHtml(MOYENS_PAIEMENT[salaire.moyen_paiement] || salaire.moyen_paiement)}</span></div>
      <div class="item"><label>Référence</label><span>${echapperHtml(salaire.reference)}</span></div>
      <div class="item"><label>Date de paiement</label><span>${estPaye ? formaterDate(salaire.date_paiement) : "—"}</span></div>
      <div class="item"><label>Mois concerné</label><span>${echapperHtml(periode)}</span></div>
      <div class="item"><label>Statut</label><span><span class="statut ${estPaye ? "paye" : "attente"}">${estPaye ? "✓ Payé" : "En attente"}</span></span></div>
    </div>
    ${salaire.observation ? `<div class="obs">Observation : ${echapperHtml(salaire.observation)}</div>` : ""}
  </div>

  <div class="signature-zone">
    <div class="signature-box"><div class="signature-line">Signature de l'enseignant</div></div>
    <div class="signature-box"><div class="signature-line">Signature et cachet du directeur</div></div>
  </div>

  <div class="footer">
    <div class="qr-code">${qrCodeSvg([
      "LAKOLI - Fiche de paie",
      `Réf : ${salaire.reference}`,
      `Enseignant : ${ens.nom ?? ""} ${ens.prenom ?? ""}${ens.matricule ? ` (${ens.matricule})` : ""}`,
      `Période : ${periode}`,
      `Net à payer : ${montantTexte(salaire.montant_net)} GNF`,
      `Statut : ${estPaye ? `Payé le ${formaterDate(salaire.date_paiement)}` : "En attente"}`,
    ].join("\n"), 80)}</div>
    <div class="footer-texte">
      <p>Document officiel LAKOLI · Certifié conforme aux normes scolaires de la République de Guinée</p>
      <p>Imprimé le ${echapperHtml(dateImpression())}</p>
    </div>
  </div>

  <div class="btn-group">
    <button class="btn btn-print" onclick="window.print()">🖨️ Imprimer</button>
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
