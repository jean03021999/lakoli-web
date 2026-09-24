// Documents imprimables (recu de paiement, releve) : HTML complet injecte dans une fenetre
// ouverte avec window.open(), style noir et blanc optimise pour @media print.

export function echapperHtml(valeur) {
  return String(valeur ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
      <div class="section-title">Situation globale de l'élève</div>
      ${ligneInscription}
      <div class="situation-header">Scolarité annuelle : ${Number(situation.totalScolarite).toLocaleString("fr-FR")} GNF</div>
      ${lignesEcheances}
      <div class="reste-box">
        <span>RESTE À PAYER</span>
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
    body { font-family: Arial, sans-serif; color: #1e293b; }

    .header { background: #0C447C; color: white; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; }
    .header-left { display: flex; align-items: center; gap: 12px; }
    .header-icon { width: 44px; height: 44px; background: rgba(255,255,255,0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 22px; }
    .header-title { font-size: 22px; font-weight: 700; }
    .header-sub { font-size: 11px; opacity: 0.75; margin-top: 2px; }
    .header-right { text-align: right; }
    .recu-titre { font-size: 20px; font-weight: 700; letter-spacing: 1px; }
    .recu-num { font-size: 12px; opacity: 0.85; margin-top: 4px; }

    .body { padding: 24px; }

    .section { margin-bottom: 20px; }
    .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }

    .eleve-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f8fafc; padding: 14px; border-radius: 8px; }
    .eleve-item label { font-size: 10px; color: #94a3b8; display: block; margin-bottom: 2px; }
    .eleve-item span { font-size: 13px; font-weight: 600; color: #1e293b; }

    .ligne-paiement { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px dashed #e2e8f0; }
    .ligne-paiement:last-child { border-bottom: none; }
    .ligne-libelle { font-size: 13px; color: #334155; }
    .ligne-montant { font-size: 14px; font-weight: 600; color: #1e293b; }

    .total-box { background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; margin: 16px 0; }
    .total-label { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #15803d; }
    .total-montant { font-size: 24px; font-weight: 700; color: #15803d; }

    .statut-box { text-align: center; padding: 10px; border-radius: 8px; margin-bottom: 16px; font-weight: 700; font-size: 14px; }
    .statut-paye { background: #dcfce7; color: #15803d; }
    .statut-partiel { background: #fef9c3; color: #a16207; }

    .reglement-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #f8fafc; padding: 14px; border-radius: 8px; }
    .reg-item label { font-size: 10px; color: #94a3b8; display: block; margin-bottom: 2px; }
    .reg-item span { font-size: 13px; font-weight: 600; }

    .ligne-situation { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
    .situation-header { background: #f8fafc; padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; color: #475569; margin: 8px 0; }
    .badge-paye { background: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
    .badge-partiel { background: #fef9c3; color: #a16207; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
    .badge-echoir { background: #f1f5f9; color: #64748b; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
    .badge-retard { background: #fee2e2; color: #dc2626; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
    .reste-box { display: flex; justify-content: space-between; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 12px 14px; margin-top: 10px; }
    .reste-montant { font-size: 18px; font-weight: 700; color: #ea580c; }

    .signature-box { margin-top: 30px; text-align: right; }
    .signature-line { border-top: 1px dashed #94a3b8; width: 220px; margin-left: auto; padding-top: 6px; }
    .signature-label { font-size: 11px; color: #64748b; }

    .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; text-align: center; }
    .footer p { font-size: 10px; color: #94a3b8; line-height: 1.6; }

    .btn-group { display: flex; gap: 10px; justify-content: center; padding: 16px; background: #f8fafc; border-top: 1px solid #e2e8f0; }
    .btn { padding: 8px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; }
    .btn-print { background: #0C447C; color: white; }
    .btn-close { background: #e2e8f0; color: #475569; }

    @media print {
      .btn-group { display: none !important; }
      body { margin: 0; }
      @page { margin: 15mm; }
    }
  </style>
</head>
<body>
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
      <div class="section-title">Élève</div>
      <div class="eleve-grid">
        <div class="eleve-item"><label>Nom complet</label><span>${echapperHtml(data.eleve?.nom)} ${echapperHtml(data.eleve?.prenom)}</span></div>
        <div class="eleve-item"><label>Matricule</label><span>${echapperHtml(data.eleve?.matricule)}</span></div>
        <div class="eleve-item"><label>Classe</label><span>${echapperHtml(data.eleve?.classe)}</span></div>
        <div class="eleve-item"><label>Session scolaire</label><span>${echapperHtml(data.session)}</span></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Détail du paiement</div>
      ${data.lignes.map((l) => `
        <div class="ligne-paiement">
          <span class="ligne-libelle">${echapperHtml(l.libelle)}</span>
          <span class="ligne-montant">${Number(l.montant).toLocaleString("fr-FR")} GNF</span>
        </div>
      `).join("")}
    </div>

    <div class="total-box">
      <span class="total-label">Total encaissé</span>
      <span class="total-montant">${Number(data.total).toLocaleString("fr-FR")} GNF</span>
    </div>

    <div class="statut-box ${data.estSolde ? "statut-paye" : "statut-partiel"}">
      ${data.estSolde ? "✓ PAYÉ EN INTÉGRALITÉ" : `PAIEMENT PARTIEL · Reste à payer : ${Number(data.resteAPayer).toLocaleString("fr-FR")} GNF`}
    </div>

    <div class="section">
      <div class="section-title">Règlement</div>
      <div class="reglement-grid">
        <div class="reg-item"><label>Moyen de paiement</label><span>${echapperHtml(data.moyen)}</span></div>
        <div class="reg-item"><label>Référence</label><span>${echapperHtml(data.reference)}</span></div>
        <div class="reg-item"><label>Date et heure</label><span>${echapperHtml(data.date)} à ${echapperHtml(data.heure)}</span></div>
        <div class="reg-item"><label>Caissier</label><span>${echapperHtml(data.caissier)}</span></div>
      </div>
    </div>

    ${situationGlobaleHtml(data.situationGlobale)}

    <div class="signature-box">
      <div class="signature-line">
        <div class="signature-label">Signature et cachet du caissier</div>
      </div>
    </div>

    <div class="footer">
      <p>Document officiel LAKOLI · Certifié conforme aux normes scolaires de la République de Guinée</p>
      <p>Imprimé le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
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
