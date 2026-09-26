// Releve A4 d'un eleve a partir de GET /eleves/{id} : echeances de tous ses frais (inscription /
// reinscription d'abord, puis scolarite...), avec le dernier paiement de chacune.
import { calculerStatutEcheance } from "../constants/statutEcheance";
import { genererReleveHtml, ecrireDocumentImpression, MOYENS_PAIEMENT, referenceLocale } from "./impression";

function normaliser(texte) {
  return (texte || "").normalize("NFD").replace(/\p{Mn}/gu, "").toLowerCase();
}

function rangRubrique(nom) {
  const n = normaliser(nom);
  if (n === "inscription") return 0;
  if (n === "reinscription") return 1;
  return 2;
}

// Echeances a plat, avec total paye et statut : sert au releve comme a la fiche.
export function echeancesEleve(eleve) {
  const frais = [...(eleve.frais_eleves || [])].sort(
    (a, b) => rangRubrique(a.type_frais?.nom) - rangRubrique(b.type_frais?.nom)
  );
  return frais.flatMap((f) =>
    (f.echeances || []).map((ech) => {
      const paiements = [...(ech.paiements || [])].sort((a, b) =>
        String(a.date_paiement).localeCompare(String(b.date_paiement))
      );
      const paye = paiements.reduce((s, p) => s + (parseFloat(p.montant) || 0), 0);
      const dernier = paiements[paiements.length - 1];
      return {
        id: ech.id,
        rubrique: f.type_frais?.nom || "Frais",
        libelle: ech.libelle,
        date_limite: ech.date_limite,
        montant: Number(ech.montant) || 0,
        paye,
        statut: calculerStatutEcheance({ ...ech, montant_paye: paye }),
        // Meme reference que sur le recu : celle du serveur, sinon la reference de secours.
        reference: dernier ? dernier.reference || referenceLocale(dernier.id, dernier.date_paiement) : null,
        moyen: dernier ? MOYENS_PAIEMENT[dernier.moyen_paiement] || dernier.moyen_paiement : null,
        date_paiement: dernier?.date_paiement || null,
      };
    })
  );
}

// Pere, sinon tuteur, sinon mere : la personne a contacter pour les paiements.
export function responsableEleve(eleve) {
  const f = (type) => eleve.filiations?.find((x) => x.type_lien === type);
  const r = f("pere") || f("tuteur") || f("mere");
  if (!r) return null;
  return {
    nom: r.nom_complet,
    telephone: r.telephone || f("pere")?.telephone || f("mere")?.telephone || f("tuteur")?.telephone,
    lien: r.type_lien === "tuteur" ? r.lien_avec_eleve || "Tuteur" : null,
  };
}

export function genererReleveEleveHtml(eleve) {
  return genererReleveHtml({
    etablissement: eleve.etablissement || {},
    eleve: {
      nom: eleve.nom,
      prenom: eleve.prenom,
      matricule: eleve.matricule,
      classe: eleve.inscription_active?.classe?.nom,
      session: eleve.inscription_active?.session_scolaire?.libelle,
      date_naissance: eleve.date_naissance,
      lieu_naissance: eleve.lieu_naissance,
      type_inscription: eleve.inscription_active?.type_inscription,
      statut_paiement: eleve.statut_paiement,
      responsable: responsableEleve(eleve),
    },
    lignes: echeancesEleve(eleve),
  });
}

export function titreReleve(eleve) {
  return `Relevé de situation - ${eleve.nom} ${eleve.prenom}`;
}

// Ecrit le releve dans une fenetre deja ouverte (ouverte pendant le clic, avant l'appel reseau,
// sinon le navigateur la bloque).
export function ecrireReleveEleve(fenetre, eleve) {
  ecrireDocumentImpression(fenetre, titreReleve(eleve), genererReleveEleveHtml(eleve));
}
