// Situation globale d'un eleve pour le recu de paiement, calculee depuis GET /frais/eleves/{id}.
// Partagee par Frais de scolarite (recu a l'encaissement) et Journal de caisse (reimpression).
import { calculerStatutEcheance, STATUTS_ECHEANCE } from "../constants/statutEcheance";

function normaliser(texte) {
  return (texte || "").normalize("NFD").replace(/\p{Mn}/gu, "").toLowerCase();
}

// Situation globale de l'eleve (inscription + toutes les echeances de scolarite), envoyee au
// recu pour que le caissier voie d'un coup d'oeil ce qui reste du sur l'annee. `suivi` doit
// etre le suivi rechargé APRES le paiement (chargerSuivi renvoie les donnees a jour).
export function situationGlobaleDepuisSuivi(suivi) {
  if (!suivi) return null;

  const echeancesScolarite = (suivi.frais || [])
    .filter((f) => normaliser(f.type_frais).startsWith("scolarit"))
    .flatMap((f) => f.echeances);
  const totalScolarite = echeancesScolarite.reduce((s, e) => s + Number(e.montant), 0);
  const totalPaye = echeancesScolarite.reduce((s, e) => s + Number(e.montant_paye), 0);
  const echeances = echeancesScolarite.map((e) => ({
    libelle: e.libelle,
    montant: Number(e.montant),
    montant_paye: Number(e.montant_paye),
    reste: Math.max(0, Number(e.montant) - Number(e.montant_paye)),
    date_limite: e.date_limite,
    statut: STATUTS_ECHEANCE[calculerStatutEcheance(e)].libelle,
  }));

  const fraisInscription = (suivi.frais || []).find((f) => normaliser(f.type_frais).includes("inscription"));
  const echInscription = fraisInscription?.echeances?.[0];
  const inscription = fraisInscription
    ? {
        libelle: fraisInscription.type_frais,
        montant: Number(echInscription?.montant || 0),
        montant_paye: Number(echInscription?.montant_paye || 0),
        statut:
          Number(echInscription?.montant_paye || 0) > 0 && Number(echInscription?.montant_paye || 0) >= Number(echInscription?.montant || 0)
            ? "Payé"
            : "Non payé",
      }
    : null;

  return {
    totalScolarite,
    totalPaye,
    resteGlobal: totalScolarite - totalPaye,
    echeances,
    inscription,
  };
}
