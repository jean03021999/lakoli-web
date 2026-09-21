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

function formaterHeure(valeur) {
  const d = new Date(valeur);
  const date = Number.isNaN(d.getTime()) ? new Date() : d;
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function dateImpression() {
  return new Date().toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" });
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
  table.tableau { width: 100%; border-collapse: collapse; }
  table.tableau th, table.tableau td { border: 1px solid #000; padding: 6px 8px; text-align: left; }
  table.tableau th { background: #eee; font-size: 11px; text-transform: uppercase; }
  table.tableau .droite { text-align: right; }
  table.tableau tr.total td { font-weight: bold; background: #eee; }
  .signatures { display: flex; justify-content: flex-end; margin-top: 40px; }
  .signature { width: 240px; text-align: center; border-top: 1px solid #000; padding-top: 6px; font-size: 11px; }
  .tampon { text-align: center; margin: 4px 0 18px; }
  .tampon span { display: inline-block; font-weight: bold; letter-spacing: 6px; padding: 4px 30px; border: 4px solid; border-radius: 6px; transform: rotate(-3deg); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .tampon.paye span { font-size: 44px; color: #15803d; border-color: #15803d; }
  .tampon.partiel span { font-size: 26px; letter-spacing: 3px; color: #b45309; border-color: #b45309; }
  .pied { margin-top: 28px; border-top: 1px solid #000; padding-top: 8px; font-size: 11px; text-align: center; }
  .bloc h2, table.tableau th, table.tableau tr.total td { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  @media print {
    body { padding: 0; }
    .no-print { display: none !important; }
    .bloc, table.tableau tr { break-inside: avoid; }
    @page { margin: 14mm; }
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

function enteteHtml({ titre, detail, sousLogo }) {
  return `
  <div class="entete">
    <div class="logo">
      ${LOGO_SVG}
      <div>
        <div class="nom">LAKOLI</div>
        <div class="sous">${echapperHtml(sousLogo)}</div>
      </div>
    </div>
    <div class="titre">
      <h1>${echapperHtml(titre)}</h1>
      ${detail ? `<div class="detail">${echapperHtml(detail)}</div>` : ""}
    </div>
  </div>`;
}

function ligneInfo(libelle, valeurHtml) {
  return `<tr><td class="lib">${echapperHtml(libelle)}</td><td>${valeurHtml}</td></tr>`;
}

const MOYENS_PAIEMENT = {
  especes: "Espèces",
  mobile_money: "Mobile Money",
  virement: "Virement",
  cheque: "Chèque",
};

// ---------------------------------------------------------------------------
// Recu de paiement
// ---------------------------------------------------------------------------
// paiement : reponse de POST /frais/paiements ; eleve : { nom, prenom, matricule, classe } ;
// totaux : { total, paye, reste } (ou null si indisponible) ; caissier : nom de l'utilisateur.
export function genererRecuHtml({ paiement, eleve, totaux, caissier }) {
  const dateCompacte = String(paiement.date_paiement ?? "").replace(/\D/g, "").slice(0, 8);
  const numero = `REF-${paiement.id}-${dateCompacte}`;
  const tiret = "—";

  return `
  ${enteteHtml({ titre: "REÇU DE PAIEMENT", detail: numero, sousLogo: "Gestion Scolaire · Guinée" })}

  <div class="bloc">
    <h2>Élève</h2>
    <div class="contenu"><table class="infos">
      ${ligneInfo("Nom complet", echapperHtml(`${eleve?.nom ?? ""} ${eleve?.prenom ?? ""}`.trim() || tiret))}
      ${ligneInfo("Matricule", echapperHtml(eleve?.matricule || tiret))}
      ${ligneInfo("Classe", echapperHtml(eleve?.classe || tiret))}
    </table></div>
  </div>

  <div class="bloc">
    <h2>Paiement</h2>
    <div class="contenu"><table class="infos">
      ${ligneInfo("Échéance", echapperHtml(paiement.libelle || tiret))}
      ${ligneInfo("Montant payé", `<span class="montant">${formaterMontant(paiement.montant)} GNF</span>`)}
      ${ligneInfo("En lettres", `<span class="lettres">${echapperHtml(montantEnLettres(paiement.montant))}</span>`)}
      ${ligneInfo("Moyen de paiement", echapperHtml(MOYENS_PAIEMENT[paiement.moyen_paiement] || paiement.moyen_paiement || tiret))}
      ${ligneInfo("Date et heure", `${formaterDate(paiement.date_paiement)} à ${formaterHeure(paiement.created_at)}`)}
      ${ligneInfo("Caissier", echapperHtml(caissier || tiret))}
    </table></div>
  </div>

  <div class="bloc">
    <h2>Résumé de la scolarité</h2>
    <div class="contenu"><table class="infos">
      ${ligneInfo("Total annuel", totaux ? `${formaterMontant(totaux.total)} GNF` : tiret)}
      ${ligneInfo("Total payé à ce jour", totaux ? `${formaterMontant(totaux.paye)} GNF` : tiret)}
      ${ligneInfo("Reste à payer", totaux ? `<strong>${formaterMontant(Math.max(0, totaux.total - totaux.paye))} GNF</strong>` : tiret)}
    </table></div>
  </div>

  <div class="pied">
    Document officiel LAKOLI - Certifié conforme<br>
    Imprimé le ${echapperHtml(dateImpression())}
  </div>`;
}

// ---------------------------------------------------------------------------
// Recu d'inscription / de reinscription
// ---------------------------------------------------------------------------
// eleve : { nom, prenom, matricule } ; reponse : reponse de POST /frais/appliquer-inscription
// ({ reference, type_frais, montant, montant_paye, reste, complet, moyen_paiement, classe,
//    etablissement, caissier, date, heure }) ; reinscription : booleen.
// La reference vient du serveur (stockee avec le paiement) : un recu reimprime la garde.
export function genererRecuInscriptionHtml({ eleve, reponse, reinscription }) {
  const tiret = "—";
  const nomComplet = `${eleve?.nom ?? ""} ${eleve?.prenom ?? ""}`.trim();
  const complet = Boolean(reponse.complet);
  const tampon = complet
    ? `<div class="tampon paye"><span>PAYÉ</span></div>`
    : `<div class="tampon partiel"><span>PAIEMENT PARTIEL</span></div>`;

  return `
  ${enteteHtml({
    titre: reinscription ? "REÇU DE RÉINSCRIPTION" : "REÇU D'INSCRIPTION",
    sousLogo: "Gestion Scolaire · Guinée",
  })}

  ${tampon}

  <div class="bloc">
    <div class="contenu"><table class="infos">
      ${ligneInfo("Établissement", echapperHtml(reponse.etablissement || tiret))}
      ${ligneInfo("Élève", echapperHtml(`${nomComplet || tiret} - ${eleve?.matricule || tiret}`))}
      ${ligneInfo("Classe", echapperHtml(reponse.classe || tiret))}
      ${ligneInfo("Type", reinscription ? "Réinscription" : "Inscription")}
      ${ligneInfo("Montant des frais", `${formaterMontant(reponse.montant)} GNF`)}
      ${ligneInfo("Montant payé", `<span class="montant">${formaterMontant(reponse.montant_paye)} GNF</span>`)}
      ${complet ? "" : ligneInfo("Reste à payer", `<strong>${formaterMontant(reponse.reste)} GNF</strong>`)}
      ${ligneInfo("Moyen de paiement", echapperHtml(MOYENS_PAIEMENT[reponse.moyen_paiement] || reponse.moyen_paiement || tiret))}
      ${ligneInfo("Date et heure", `${formaterDate(reponse.date)}${reponse.heure ? ` à ${echapperHtml(reponse.heure)}` : ""}`)}
      ${ligneInfo("Caissier", echapperHtml(reponse.caissier || tiret))}
      ${ligneInfo("Référence", `<span style="font-family: 'Courier New', monospace">${echapperHtml(reponse.reference || tiret)}</span>`)}
    </table></div>
  </div>

  <div class="pied">
    Document officiel LAKOLI · Certifié conforme aux normes guinéennes
  </div>`;
}

// ---------------------------------------------------------------------------
// Releve de paiements
// ---------------------------------------------------------------------------
// eleve : { nom, prenom, matricule, classe, session } ;
// lignes : [{ libelle, montant, paye, statut, dernierPaiement }] ; etablissement : nom.
export function genererReleveHtml({ etablissement, eleve, lignes }) {
  const tiret = "—";
  const total = lignes.reduce((s, l) => s + l.montant, 0);
  const paye = lignes.reduce((s, l) => s + l.paye, 0);

  const corpsTableau = lignes
    .map(
      (l) => `<tr>
        <td>${echapperHtml(l.libelle)}</td>
        <td class="droite">${formaterMontant(l.montant)}</td>
        <td class="droite">${formaterMontant(l.paye)}</td>
        <td class="droite">${formaterMontant(Math.max(0, l.montant - l.paye))}</td>
        <td>${echapperHtml(l.statut)}</td>
        <td>${l.dernierPaiement ? formaterDate(l.dernierPaiement) : tiret}</td>
      </tr>`
    )
    .join("");

  return `
  ${enteteHtml({ titre: "RELEVÉ DE PAIEMENTS", sousLogo: etablissement || "Gestion Scolaire · Guinée" })}

  <div class="bloc">
    <h2>Élève</h2>
    <div class="contenu"><table class="infos">
      ${ligneInfo("Nom", echapperHtml(eleve.nom || tiret))}
      ${ligneInfo("Prénom", echapperHtml(eleve.prenom || tiret))}
      ${ligneInfo("Matricule", echapperHtml(eleve.matricule || tiret))}
      ${ligneInfo("Classe", echapperHtml(eleve.classe || tiret))}
      ${ligneInfo("Session scolaire", echapperHtml(eleve.session || tiret))}
    </table></div>
  </div>

  <table class="tableau">
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

  <div class="signatures">
    <div class="signature">Signature du caissier</div>
  </div>

  <div class="pied">
    Document officiel LAKOLI<br>
    Imprimé le ${echapperHtml(dateImpression())}
  </div>`;
}
