// Regroupe les paiements de GET /frais/paiements en versements (un passage en caisse) grace a
// `versement_id`, calcule cote serveur : ex. inscription + scolarite payees ensemble, ou un montant
// reparti sur plusieurs tranches. L'ordre de la liste (du plus recent au plus ancien) est conserve.

function estInscription(typeFrais) {
  const nom = (typeFrais || "").normalize("NFD").replace(/\p{Mn}/gu, "").toLowerCase();
  return nom === "inscription" || nom === "reinscription";
}

export function regrouperVersements(paiements) {
  const parId = new Map();
  for (const p of paiements) {
    const cle = p.versement_id ?? p.id;
    if (!parId.has(cle)) {
      parId.set(cle, {
        id: cle,
        eleve: p.eleve,
        reference: p.reference,
        moyen_paiement: p.moyen_paiement,
        date_paiement: p.date_paiement,
        heure: p.heure,
        montant: 0,
        details: [],
      });
    }
    const v = parId.get(cle);
    v.montant += parseFloat(p.montant) || 0;
    v.reference = v.reference || p.reference;
    v.details.push({ id: p.id, type_frais: p.type_frais, libelle: p.libelle, montant: parseFloat(p.montant) || 0 });
  }

  return [...parId.values()].map((v) => {
    // Inscription / reinscription d'abord, puis la scolarite par tranche.
    const details = [...v.details].sort(
      (a, b) => (estInscription(b.type_frais) - estInscription(a.type_frais)) || a.id - b.id
    );
    return {
      ...v,
      details,
      type_frais: [...new Set(details.map((d) => d.type_frais).filter(Boolean))].join(" + "),
      // Objet lisible : "Inscription + Trimestre 1", ou "Scolarité · Trimestre 1" pour un seul frais.
      objet: details.length > 1
        ? details.map((d) => d.libelle || d.type_frais).join(" + ")
        : [details[0].type_frais, details[0].libelle].filter((x, i, t) => x && t.indexOf(x) === i).join(" · "),
    };
  });
}
