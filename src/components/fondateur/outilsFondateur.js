import { echapperHtml, logoEcoleHtml, coordonneesEcole } from "../../utils/impression";
import { completerEtablissement } from "../../utils/etablissementCourant";

// Outils communs de l'Espace Fondateur : formats, periodes, calculs a partir des vraies donnees
// (GET /frais/paiements, /frais/stats-par-classe, /frais/relances, /caisse/evolution).

export function formatNombre(valeur) {
  const n = Number(valeur);
  if (valeur === null || valeur === undefined || Number.isNaN(n)) return "0";
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function formatGNF(valeur) {
  return `${formatNombre(valeur)} GNF`;
}

export function formatMillions(valeur) {
  return `${(Number(valeur || 0) / 1000000).toFixed(1).replace(".", ",")} M`;
}

export function pourcentage(part, total) {
  return total > 0 ? Math.round((part / total) * 1000) / 10 : 0;
}

export function formatDateFr(valeur) {
  if (!valeur) return "—";
  const d = new Date(String(valeur).length === 10 ? `${valeur}T00:00:00` : valeur);
  if (Number.isNaN(d.getTime())) return String(valeur);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateHeureFr(valeur) {
  if (!valeur) return "—";
  const d = new Date(valeur);
  if (Number.isNaN(d.getTime())) return String(valeur);
  return `${formatDateFr(valeur)} à ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
}

// Date locale AAAA-MM-JJ (toISOString decalerait la journee selon le fuseau).
export function dateLocale(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function jourDe(valeur) {
  return String(valeur || "").slice(0, 10);
}

export function debutSemaine(d = new Date()) {
  const lundi = new Date(d);
  lundi.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return dateLocale(lundi);
}

export function debutMois(d = new Date()) {
  return dateLocale(new Date(d.getFullYear(), d.getMonth(), 1));
}

// Premier jour couvert par l'annee scolaire : le rapport d'evolution commence au premier mois de la
// session, ou plus tot si des inscriptions ont ete encaissees avant la rentree.
export function debutAnnee(evolution) {
  const premier = evolution?.mois?.[0]?.mois;
  return premier ? `${premier}-01` : "";
}

export function dansPeriode(jour, periode, debutAnneeScolaire) {
  if (periode === "aujourdhui") return jour === dateLocale();
  if (periode === "cette_semaine") return jour >= debutSemaine();
  if (periode === "ce_mois") return jour >= debutMois();
  return jour >= debutAnneeScolaire;
}

function sansAccent(texte) {
  return String(texte || "").normalize("NFD").replace(/\p{Mn}/gu, "").toLowerCase();
}

export function naturePaiement(typeFrais) {
  const nom = sansAccent(typeFrais);
  if (nom.startsWith("reinscription")) return "Réinscription";
  if (nom.startsWith("inscription")) return "Inscription";
  if (nom.startsWith("scolarit")) return "Scolarité";
  return "Autres frais";
}

export function natureVersement(versement) {
  const natures = [...new Set(versement.details.map((d) => naturePaiement(d.type_frais)))];
  return natures.join(" + ");
}

// Lignes du recouvrement par classe : scolarite de l'annee (stats-par-classe) et frais d'inscription
// encaisses (paiements valides de l'annee).
export function lignesRecouvrement(statsParClasse, paiements, debut) {
  const inscriptions = {};
  for (const p of paiements) {
    if (p.annule || jourDe(p.date_paiement) < debut) continue;
    const nature = naturePaiement(p.type_frais);
    if (nature !== "Inscription" && nature !== "Réinscription") continue;
    const classe = p.eleve?.classe;
    if (classe) inscriptions[classe] = (inscriptions[classe] || 0) + (parseFloat(p.montant) || 0);
  }
  return statsParClasse.map((c) => {
    const netAPayer = Number(c.montant_total) || 0;
    const scolarite = Number(c.montant_encaisse) || 0;
    return {
      id: c.classe_id,
      nom: c.classe,
      effectif: Number(c.nombre_eleves) || 0,
      inscriptions: inscriptions[c.classe] || 0,
      scolarite,
      netAPayer,
      reste: Math.max(0, netAPayer - scolarite),
      taux: pourcentage(scolarite, netAPayer),
      enRetard: Number(c.nombre_en_retard) || 0,
      sansFrais: Number(c.nombre_sans_frais) || 0,
    };
  });
}

export function totauxRecouvrement(lignes) {
  const t = lignes.reduce(
    (a, c) => ({
      effectif: a.effectif + c.effectif,
      inscriptions: a.inscriptions + c.inscriptions,
      scolarite: a.scolarite + c.scolarite,
      netAPayer: a.netAPayer + c.netAPayer,
      reste: a.reste + c.reste,
      sansFrais: a.sansFrais + c.sansFrais,
    }),
    { effectif: 0, inscriptions: 0, scolarite: 0, netAPayer: 0, reste: 0, sansFrais: 0 }
  );
  return { ...t, taux: pourcentage(t.scolarite, t.netAPayer) };
}

// Impayes : eleves reellement en retard (GET /frais/relances), avec leur dernier paiement.
export function lignesImpayes(relances, paiements) {
  const dernier = {};
  for (const p of paiements) {
    if (p.annule || !p.eleve?.id) continue;
    const jour = jourDe(p.date_paiement);
    const d = dernier[p.eleve.id];
    if (!d || jour > d.date) dernier[p.eleve.id] = { date: jour, montant: parseFloat(p.montant) || 0 };
  }
  return relances
    .filter((l) => l.motif === "retard")
    .map((l) => {
      const contact = l.contacts?.[0] || null;
      return {
        ...l,
        id: String(l.eleve_id),
        nomComplet: `${l.nom} ${l.prenom}`,
        montantDu: Number(l.montant_du) || 0,
        retard: Number(l.nombre_echeances) || 1,
        contact,
        nomParent: contact?.nom || "—",
        telephone: contact?.telephone || "",
        dernierPaiementDate: dernier[l.eleve_id]?.date || "",
        dernierPaiementMontant: dernier[l.eleve_id]?.montant || 0,
        derniereRelanceDate: l.derniere_relance?.date || "",
        nombreRelances: Number(l.nombre_relances) || 0,
      };
    });
}

export function formatDelai(minutes) {
  if (minutes === null) return "—";
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")}`;
  return `${Math.floor(minutes / 1440)} j ${Math.floor((minutes % 1440) / 60)} h`;
}

// Regle fixe du controle, en plus des deux seuils reglables.
export const MAX_ANNULATIONS_PAR_PERSONNE = 3;

// Annulations a controler : un versement annule d'un bloc = une ligne. Une ligne est critique si le
// montant ou le delai depasse les seuils de l'etablissement, ou si son auteur a trop d'annulations.
export function lignesAnnulations(versements, etablissement) {
  const seuilMontant = Number(etablissement?.seuil_annulation_montant ?? 500000);
  const seuilHeures = Number(etablissement?.seuil_annulation_delai_heures ?? 24);
  const annules = versements.filter((v) => v.annule);
  const parAuteur = {};
  for (const v of annules) parAuteur[v.annule_par || "—"] = (parAuteur[v.annule_par || "—"] || 0) + 1;

  return annules.map((v) => {
    const debut = v.cree_le ? new Date(v.cree_le).getTime() : null;
    const fin = v.annule_le ? new Date(v.annule_le).getTime() : null;
    const delaiMinutes = debut && fin ? Math.max(0, Math.round((fin - debut) / 60000)) : null;
    const auteur = v.annule_par || "—";
    const motifsCritiques = [];
    if (v.montant >= seuilMontant) motifsCritiques.push(`Montant ≥ ${formatGNF(seuilMontant)}`);
    if (delaiMinutes !== null && delaiMinutes >= seuilHeures * 60) motifsCritiques.push(`Délai ≥ ${seuilHeures} h`);
    if (parAuteur[auteur] > MAX_ANNULATIONS_PAR_PERSONNE) motifsCritiques.push(`${parAuteur[auteur]} annulations par cette personne`);
    return {
      id: String(v.id),
      paiementIds: v.details.map((d) => d.id),
      reference: v.reference || "—",
      eleveNom: v.eleve?.nom_complet || "—",
      classe: v.eleve?.classe || "—",
      nature: natureVersement(v),
      montant: v.montant,
      datePaiement: jourDe(v.date_paiement),
      dateAnnulation: v.annule_le || "",
      delaiMinutes,
      caissier: v.caissier || "—",
      annulePar: auteur,
      motif: v.motif_annulation || "—",
      motifsCritiques,
      estCritique: motifsCritiques.length > 0,
      statutAudit: v.annulation_justifiee_le ? "Justifié" : "À vérifier",
    };
  });
}

// Document imprimable commun (listes et rapports) : en-tete de l'ecole, tableau, observation,
// signatures. Polices systeme, comme tous les documents imprimes de LAKOLI.
export function documentHtml({ titre, sousTitre, colonnes, lignes, pied, observation, signatures = false, sessionLibelle }) {
  const ecole = completerEtablissement();
  const cellule = (valeur, c, balise = "td") =>
    `<${balise} style="border:1px solid #94a3b8;padding:5px 7px;text-align:${c.droite ? "right" : "left"};${c.droite ? "white-space:nowrap;font-variant-numeric:tabular-nums;" : ""}">${echapperHtml(valeur ?? "")}</${balise}>`;
  const signature = (titreBloc, detail) =>
    `<div style="flex:1;text-align:center"><strong>${echapperHtml(titreBloc)}</strong><div style="color:#64748b;font-size:11px">${echapperHtml(detail)}</div><div style="height:64px"></div><div style="border-top:1px solid #94a3b8"></div></div>`;
  return `
  <div style="display:flex;align-items:center;gap:12px;border-bottom:2px solid #0f172a;padding-bottom:10px">
    <div style="flex:1;font-size:10px"><strong>RÉPUBLIQUE DE GUINÉE</strong><br><em>Travail - Justice - Solidarité</em>${ecole.agrement ? `<br>Agrément : ${echapperHtml(ecole.agrement)}` : ""}</div>
    <div style="text-align:center;flex:2"><div style="width:44px;height:44px;margin:0 auto 4px;background:#0C447C;border-radius:10px;padding:6px;box-sizing:border-box">${logoEcoleHtml(ecole).replace(/<img /, '<img style="width:100%;height:100%;object-fit:contain" ')}</div><strong style="text-transform:uppercase">${echapperHtml(ecole.nom || "")}</strong><div style="font-size:10px">${echapperHtml(coordonneesEcole(ecole).join(" · "))}</div></div>
    <div style="flex:1;font-size:10px;text-align:right">${sessionLibelle ? `Session : <strong>${echapperHtml(sessionLibelle)}</strong><br>` : ""}Édité le ${echapperHtml(formatDateFr(dateLocale()))}</div>
  </div>
  <div style="text-align:center;margin:12px 0;background:#f1f5f9;padding:8px;border-radius:6px"><strong style="color:#0C447C;text-transform:uppercase">${echapperHtml(titre)}</strong>${sousTitre ? `<div style="font-size:11px">${echapperHtml(sousTitre)}</div>` : ""}</div>
  <table style="width:100%;border-collapse:collapse;font-size:11px">
    <thead><tr style="background:#f1f5f9">${colonnes.map((c) => cellule(c.titre, c, "th")).join("")}</tr></thead>
    <tbody>${lignes.map((l) => `<tr>${l.map((v, i) => cellule(v, colonnes[i])).join("")}</tr>`).join("")}</tbody>
    ${pied ? `<tfoot><tr style="background:#e2e8f0;font-weight:800">${pied.map((v, i) => cellule(v, colonnes[i])).join("")}</tr></tfoot>` : ""}
  </table>
  ${observation ? `<p style="font-size:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px;margin-top:12px">${echapperHtml(observation)}</p>` : ""}
  ${signatures ? `<div style="display:flex;gap:24px;margin-top:32px;font-size:12px">${signature("La Comptabilité", "Établi et vérifié")}${signature("La Direction", "Conformité des effectifs")}${signature("Le Fondateur", "Vu et approuvé")}</div>` : ""}`;
}
