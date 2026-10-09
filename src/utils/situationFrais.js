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

  const fraisScolarite = (suivi.frais || []).filter((f) => normaliser(f.type_frais).startsWith("scolarit"));
  const echeancesScolarite = fraisScolarite.flatMap((f) => f.echeances);
  // Remise accordee sur la scolarite (deja deduite des echeances) et son motif.
  const remise = fraisScolarite.filter((f) => f.remise_type).reduce((s, f) => s + Math.max(0, Number(f.montant_original) - Number(f.montant_total)), 0);
  const motifRemise = fraisScolarite.filter((f) => f.remise_type).map((f) => f.motif_remise).filter(Boolean).join(", ");
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
        // Dispense : frais ramenes a 0 par une remise de 100 %.
        statut:
          fraisInscription.remise_type && Number(fraisInscription.montant_total) === 0
            ? "Dispensé"
            : Number(echInscription?.montant_paye || 0) > 0 && Number(echInscription?.montant_paye || 0) >= Number(echInscription?.montant || 0)
              ? "Payé"
              : "Non payé",
      }
    : null;

  return {
    totalScolarite,
    totalPaye,
    resteGlobal: totalScolarite - totalPaye,
    remise,
    motifRemise,
    echeances,
    inscription,
  };
}
