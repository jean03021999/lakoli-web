// Outils partages du module Salaires (design "Gestion des salaires").
import { MOIS } from "../../utils/impression";

export { MOIS };
export const MOIS_COURTS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

export const STYLE_CARTE = { borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1px solid rgba(226,232,240,0.7)" };

export const MESSAGE_POPUP_BLOQUE =
  "Le navigateur a bloqué la fenêtre de la fiche de paie. Autorisez les pop-ups pour ce site, puis cliquez sur « Fiche ».";

const n = (v) => Number(v) || 0;

// Part "base" d'un salaire : salaire fixe, ou heures x taux pour l'horaire.
export function montantBase(s) {
  return s.type_remuneration === "horaire" ? n(s.nb_heures) * n(s.taux_horaire) : n(s.salaire_base);
}

export function montantHeuresSupp(s) {
  return n(s.nb_heures_supp) * n(s.taux_heure_supp);
}

// Meme formule que Salaire::getMontantCalculeAttribute cote backend (qui fait foi).
export function montantNet(s) {
  return montantBase(s) + montantHeuresSupp(s);
}

// Rang chronologique d'une periode (annee * 12 + mois - 1), pour trier et comparer.
export function rangPeriode(annee, mois) {
  return Number(annee) * 12 + Number(mois) - 1;
}

export function libellePeriode(s) {
  return `${MOIS[s.mois - 1] || ""} ${s.annee}`;
}

export function messageErreur(err, defaut) {
  const erreurs = err.response?.data?.errors;
  return erreurs ? Object.values(erreurs).flat()[0] : err.response?.data?.message || defaut;
}
