// Fiche enseignant imprimable (A4), meme habillage que le releve et le recu (.releve-a4).
import { echapperHtml, formaterDate, formaterMontant, LOGO_SVG_BLANC } from "./impression";

const CONTRATS = { cdi: "CDI (durée indéterminée)", cdd: "CDD (durée déterminée)", vacataire: "Vacataire" };
const JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

export function genererFicheEnseignantHtml({ etablissement = {}, enseignant, contrat, affectations, creneaux }) {
  const tiret = "—";
  const e = (v) => echapperHtml(v || tiret);
  const totalHeures = affectations.reduce((s, a) => s + (Number(a.volume_horaire_hebdomadaire) || 0), 0);
  const dateLongue = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const coordonnees = [
    [etablissement.adresse, etablissement.ville].filter(Boolean).join(", "),
    etablissement.telephone && `Tél : ${etablissement.telephone}`,
    etablissement.email,
  ].filter(Boolean);

  const lignesAffectations = affectations.length
    ? affectations
        .map(
          (a, i) => `<tr>
        <td class="num">${i + 1}</td>
        <td><strong>${e(a.classe?.nom)}</strong>${a.est_classe_examen ? ' <span class="etat etat-partiel">Examen</span>' : ""}</td>
        <td>${e(a.matiere?.nom)}</td>
        <td class="droite mono">${Number(a.volume_horaire_hebdomadaire || 0).toLocaleString("fr-FR")} h</td>
      </tr>`
        )
        .join("")
    : `<tr><td colspan="4" class="vide">Aucune affectation.</td></tr>`;

  const lignesCreneaux = creneaux.length
    ? [...creneaux]
        .sort((a, b) => JOURS.indexOf(a.jour) - JOURS.indexOf(b.jour) || String(a.heure_debut).localeCompare(String(b.heure_debut)))
        .map(
          (c) => `<tr>
        <td style="text-transform:capitalize">${e(c.jour)}</td>
        <td class="mono">${e(String(c.heure_debut).slice(0, 5))} - ${e(String(c.heure_fin).slice(0, 5))}</td>
        <td>${e(c.classe)}</td>
        <td>${e(c.matiere)}</td>
      </tr>`
        )
        .join("")
    : `<tr><td colspan="4" class="vide">Aucune séance programmée.</td></tr>`;

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
        <div class="logo-ecole">${LOGO_SVG_BLANC}</div>
        <div class="nom-ecole">${echapperHtml(etablissement.nom || "LAKOLI")}</div>
        ${coordonnees.length ? `<div class="coord">${coordonnees.map(echapperHtml).join(" · ")}</div>` : ""}
      </div>
      <div class="reference">
        <div class="boite-ref">
          <span class="lib">Matricule</span>
          <span class="val">${e(enseignant.matricule)}</span>
          <span class="date">Édité le <strong>${echapperHtml(dateLongue)}</strong></span>
        </div>
      </div>
    </div>

    <div class="bandeau-titre">
      <h1>FICHE DE L'ENSEIGNANT</h1>
      <p>Identité, contrat, affectations et emploi du temps</p>
    </div>

    <div class="cartouche">
      <div class="col">
        <span class="titre-col">1. Identité</span>
        <span class="lib">Nom &amp; prénoms</span><strong class="maj">${e(`${enseignant.nom || ""} ${enseignant.prenom || ""}`.trim())}</strong>
        <span class="lib">Né(e) le / à</span><span>${formaterDate(enseignant.date_naissance)}${enseignant.lieu_naissance ? ` à ${echapperHtml(enseignant.lieu_naissance)}` : ""}</span>
        <span class="lib">Diplôme</span><span>${e(enseignant.diplome)}</span>
      </div>
      <div class="col">
        <span class="titre-col">2. Contact</span>
        <span class="lib">Téléphone</span><strong>${e(enseignant.telephone)}</strong>
        <span class="lib">E-mail</span><span>${e(enseignant.email)}</span>
      </div>
      <div class="col">
        <span class="titre-col">3. Contrat</span>
        <span class="lib">Régime</span><strong class="bleu">${e(CONTRATS[contrat?.type])}</strong>
        <span class="lib">Début / fin</span><span>${contrat ? `${formaterDate(contrat.date_debut)}${contrat.date_fin ? ` → ${formaterDate(contrat.date_fin)}` : ""}` : tiret}</span>
        <span class="lib">Salaire de base</span><span>${contrat ? `${formaterMontant(contrat.salaire_base)} GNF` : tiret}</span>
      </div>
    </div>

    <div class="titre-livre espace" style="margin-top:14px">
      <span>Affectations pédagogiques</span>
      <span class="devise-legale">Charge totale : ${totalHeures.toLocaleString("fr-FR")} h / semaine</span>
    </div>
    <table class="livre">
      <thead><tr><th class="num">N°</th><th>Classe</th><th>Matière</th><th class="droite">Volume hebdo</th></tr></thead>
      <tbody>${lignesAffectations}</tbody>
    </table>

    <div class="titre-livre" style="margin-top:14px">
      <span>Emploi du temps</span>
      <span class="devise-legale">${creneaux.length} séance(s) par semaine</span>
    </div>
    <table class="livre">
      <thead><tr><th>Jour</th><th>Horaire</th><th>Classe</th><th>Matière</th></tr></thead>
      <tbody>${lignesCreneaux}</tbody>
    </table>

    <div class="signatures-a4">
      <div class="sig">
        <span class="role">L'Enseignant</span>
        <span class="note">Lu et approuvé</span>
        <span class="ligne-sig"></span>
      </div>
      <div class="sig centre"><span class="note">Document généré par LAKOLI</span></div>
      <div class="sig droite">
        <span class="role">Le Chef d'Établissement</span>
        <span class="note">${etablissement.ville ? `${echapperHtml(etablissement.ville)}, le ` : "Le "}${echapperHtml(dateLongue)}</span>
        <span class="ligne-sig"></span>
      </div>
    </div>
  </div>`;
}
