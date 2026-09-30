import { useState, useEffect, useMemo } from "react";
import api from "../../services/api";
import { FileSpreadsheet, FileText, Search, Printer, ChevronLeft, ChevronRight, X, Ban, AlertTriangle, Loader2 } from "lucide-react";
import { regrouperVersements } from "../../utils/versements";
import CarteSoldeCaisse from "../../components/caisse/CarteSoldeCaisse";
import SortiesCaisse from "../../components/caisse/SortiesCaisse";
import { situationGlobaleDepuisSuivi } from "../../utils/situationFrais";
import {
  imprimerDocument,
  genererJournalCaisseHtml,
  genererEtImprimerRecu,
  ouvrirFenetreVierge,
  referenceLocale,
  formaterDate,
} from "../../utils/impression";
import { STYLE_CARTE, MOYENS, configTypeFrais, formaterGNF, normaliser, telechargerCsv } from "../../components/frais/configFrais";

// Journal de caisse (design "Frais de scolarite & facturation") : tous les versements reels de
// GET /frais/paiements (un versement = un passage en caisse), filtres, synthese, export et
// reimpression du recu.

const PAR_PAGE = 10;
const MOIS_COURTS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

function dateLocale(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function initiales(nomComplet) {
  return (nomComplet || "?").trim().split(/\s+/).slice(0, 2).map((m) => m[0]).join("").toUpperCase();
}

// Reference affichee = celle du recu : reference serveur, sinon reference de secours du paiement.
function referenceVersement(v) {
  return v.reference || referenceLocale(Math.min(...v.details.map((d) => d.id)), v.date_paiement);
}

// "Scolarite - Trimestre 1" ; "Inscription" seul quand le libelle repete le type.
function libelleDetail(d) {
  if (!d.type_frais) return d.libelle || "Paiement";
  return normaliser(d.libelle) === normaliser(d.type_frais) || !d.libelle ? d.type_frais : `${d.type_frais} - ${d.libelle}`;
}

export default function PaiementsCaisse({ etablissement = null, permissions = [] }) {
  const peutAnnuler = permissions.includes("frais.paiement.enregistrer");
  const [versements, setVersements] = useState([]);
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState("");
  const [typeFiltre, setTypeFiltre] = useState("tous");
  const [moyenFiltre, setMoyenFiltre] = useState("tous");
  const [debut, setDebut] = useState("");
  const [fin, setFin] = useState("");
  const [page, setPage] = useState(1);
  const [impression, setImpression] = useState(null);
  const [aAnnuler, setAAnnuler] = useState(null); // versement a annuler
  const [motif, setMotif] = useState("");
  const [annulation, setAnnulation] = useState({ envoi: false, erreur: "" });
  const [succes, setSucces] = useState("");
  const [rechargement, setRechargement] = useState(0);
  const [onglet, setOnglet] = useState("encaissements");
  const [synthese, setSynthese] = useState(null);

  useEffect(() => {
    api
      .get("/frais/paiements")
      // Un versement = un passage en caisse (ex. inscription + scolarité payées ensemble).
      .then((res) => setVersements(regrouperVersements(res.data)))
      .catch(() => setErreur("Impossible de charger le journal de caisse."))
      .finally(() => setChargement(false));
  }, [rechargement]);

  // Solde de caisse : encaissements - salaires verses - depenses (rafraichi apres chaque changement).
  useEffect(() => {
    api.get("/caisse/synthese").then((res) => setSynthese(res.data)).catch(() => setSynthese(null));
  }, [rechargement]);

  // Annulation d'un versement (tous ses paiements), motif obligatoire ; il reste visible, barre.
  const annuler = async () => {
    setAnnulation({ envoi: true, erreur: "" });
    try {
      const res = await api.post("/frais/paiements/annuler", { paiement_ids: aAnnuler.details.map((d) => d.id), motif: motif.trim() });
      setAAnnuler(null);
      setMotif("");
      setAnnulation({ envoi: false, erreur: "" });
      setSucces(res.data.message);
      setRechargement((n) => n + 1);
    } catch (err) {
      const liste = err.response?.data?.errors;
      setAnnulation({ envoi: false, erreur: liste ? Object.values(liste).flat()[0] : err.response?.data?.message || "Annulation impossible." });
    }
  };

  // Types de frais regroupes par nom normalise ("Scolarite" et "Scolarité" = un seul type) ;
  // on affiche le libelle le plus frequent.
  const types = useMemo(() => {
    const comptes = new Map();
    versements.forEach((v) =>
      v.details.forEach((d) => {
        if (!d.type_frais) return;
        const cle = normaliser(d.type_frais);
        if (!comptes.has(cle)) comptes.set(cle, new Map());
        const libelles = comptes.get(cle);
        libelles.set(d.type_frais, (libelles.get(d.type_frais) || 0) + 1);
      })
    );
    return [...comptes].map(([cle, libelles]) => ({ cle, libelle: [...libelles].sort((a, b) => b[1] - a[1])[0][0] }));
  }, [versements]);
  const libelleType = (cle) => types.find((t) => t.cle === cle)?.libelle || cle;

  const termes = normaliser(recherche).split(/\s+/).filter(Boolean);
  const filtres = versements.filter((v) => {
    const date = String(v.date_paiement || "").slice(0, 10);
    const cible = normaliser(`${v.eleve?.nom_complet} ${v.eleve?.matricule} ${v.eleve?.classe} ${referenceVersement(v)}`);
    return (
      termes.every((t) => cible.includes(t)) &&
      (typeFiltre === "tous" || v.details.some((d) => normaliser(d.type_frais) === typeFiltre)) &&
      (moyenFiltre === "tous" || v.moyen_paiement === moyenFiltre) &&
      (!debut || date >= debut) &&
      (!fin || date <= fin)
    );
  });

  // Compteurs (sur tout le journal, independamment des filtres).
  const aujourdhui = dateLocale();
  const moisCourant = aujourdhui.slice(0, 7);
  // Les versements annules restent affiches mais ne comptent dans aucun total.
  const valides = versements.filter((v) => !v.annule);
  const filtresValides = filtres.filter((v) => !v.annule);
  const duJour = valides.filter((v) => String(v.date_paiement).slice(0, 10) === aujourdhui);
  const duMois = valides.filter((v) => String(v.date_paiement).slice(0, 7) === moisCourant);
  const somme = (liste) => liste.reduce((s, v) => s + v.montant, 0);
  const totalGeneral = somme(valides);

  // Synthese de la periode filtree.
  const totalFiltre = somme(filtresValides);
  const parMoyen = Object.keys(MOYENS).map((cle) => ({ cle, montant: somme(filtresValides.filter((v) => v.moyen_paiement === cle)) }));
  const parType = types
    .map((t) => ({ type: t.libelle, montant: filtresValides.reduce((s, v) => s + v.details.filter((d) => normaliser(d.type_frais) === t.cle).reduce((x, d) => x + d.montant, 0), 0) }))
    .sort((a, b) => b.montant - a.montant);

  const totalPages = Math.max(1, Math.ceil(filtres.length / PAR_PAGE));
  const pageCourante = Math.min(page, totalPages);
  const visibles = filtres.slice((pageCourante - 1) * PAR_PAGE, pageCourante * PAR_PAGE);
  const filtreActif = recherche || typeFiltre !== "tous" || moyenFiltre !== "tous" || debut || fin;
  const changer = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };
  const reinitialiser = () => {
    setRecherche("");
    setTypeFiltre("tous");
    setMoyenFiltre("tous");
    setDebut("");
    setFin("");
    setPage(1);
  };

  const libellesFiltres = [
    debut || fin ? `Période : ${debut ? formaterDate(debut) : "début"} → ${fin ? formaterDate(fin) : "aujourd'hui"}` : null,
    typeFiltre !== "tous" && `Type : ${libelleType(typeFiltre)}`,
    moyenFiltre !== "tous" && `Moyen : ${MOYENS[moyenFiltre]?.libelle}`,
    recherche.trim() && `Recherche : « ${recherche.trim()} »`,
  ].filter(Boolean);

  const exporterCsv = () => {
    telechargerCsv(
      `journal-de-caisse-${aujourdhui}.csv`,
      ["Date", "Heure", "Référence", "Élève", "Matricule", "Classe", "Détail", "Montant (GNF)", "Moyen", "Caissier", "Statut"],
      filtres.map((v) => [
        formaterDate(v.date_paiement),
        v.heure || "",
        referenceVersement(v),
        v.eleve?.nom_complet || "",
        v.eleve?.matricule || "",
        v.eleve?.classe || "",
        v.details.map((d) => `${libelleDetail(d)} (${d.montant})`).join(" + "),
        Math.round(v.montant),
        MOYENS[v.moyen_paiement]?.libelle || v.moyen_paiement,
        v.caissier || "",
        v.annule ? `Annulé${v.annule_par ? ` par ${v.annule_par}` : ""} : ${v.motif_annulation || ""}` : "Valide",
      ])
    );
  };

  const imprimerJournal = () => {
    const html = genererJournalCaisseHtml({
      etablissement: etablissement?.nom,
      filtres: libellesFiltres,
      // Document de caisse : seuls les versements valides (les annules ne sont pas de l'argent encaisse).
      versements: filtresValides.map((v) => ({
        date: formaterDate(v.date_paiement),
        heure: v.heure,
        reference: referenceVersement(v),
        eleve: v.eleve?.nom_complet,
        matricule: v.eleve?.matricule,
        classe: v.eleve?.classe,
        detail: v.details.map(libelleDetail).join(" + "),
        moyen: MOYENS[v.moyen_paiement]?.libelle || v.moyen_paiement,
        montant: v.montant,
      })),
      parMoyen: parMoyen.filter((m) => m.montant > 0).map((m) => ({ libelle: MOYENS[m.cle].libelle, montant: m.montant })),
      parType: parType.filter((t) => t.montant > 0).map((t) => ({ libelle: t.type, montant: t.montant })),
    });
    if (!imprimerDocument("Journal de caisse", html)) {
      setErreur("Le navigateur a bloqué la fenêtre d'impression. Autorisez les pop-ups pour ce site.");
    }
  };

  // Reimpression du recu d'un versement, avec la situation de l'eleve a ce jour.
  const reimprimerRecu = async (v) => {
    const fenetre = ouvrirFenetreVierge();
    if (!fenetre) {
      setErreur("Le navigateur a bloqué la fenêtre du reçu. Autorisez les pop-ups pour ce site.");
      return;
    }
    fenetre.document.write('<p style="font-family:Arial;padding:24px">Préparation du reçu...</p>');
    setImpression(v.id);
    try {
      const [eleve, suivi] = await Promise.allSettled([api.get(`/eleves/${v.eleve.id}`), api.get(`/frais/eleves/${v.eleve.id}`)]);
      const e = eleve.status === "fulfilled" ? eleve.value.data : null;
      const s = suivi.status === "fulfilled" ? suivi.value.data : null;
      const [nom, ...prenoms] = (v.eleve?.nom_complet || "").split(" ");
      const echeances = (s?.frais || []).flatMap((f) => f.echeances);
      const touchees = v.details.map((d) => echeances.find((x) => String(x.id) === String(d.echeance_eleve_id))).filter(Boolean);
      const resteAPayer = touchees.reduce((t, x) => t + Math.max(0, Number(x.solde)), 0);
      genererEtImprimerRecu(
        {
          reference: referenceVersement(v),
          eleve: {
            nom: e?.nom ?? nom,
            prenom: e?.prenom ?? prenoms.join(" "),
            matricule: v.eleve?.matricule,
            classe: v.eleve?.classe,
            date_naissance: e?.date_naissance,
            lieu_naissance: e?.lieu_naissance,
            inscription_active: e?.inscription_active,
          },
          session: e?.inscription_active?.session_scolaire?.libelle || "—",
          lignes: v.details.map((d) => ({ libelle: libelleDetail(d), montant: d.montant })),
          total: v.montant,
          estSolde: resteAPayer <= 0,
          resteAPayer,
          moyen: MOYENS[v.moyen_paiement]?.libelle || v.moyen_paiement,
          date: formaterDate(v.date_paiement),
          heure: v.heure || "",
          caissier: v.caissier || "",
          situationGlobale: situationGlobaleDepuisSuivi(s),
          etablissement,
        },
        fenetre
      );
    } catch {
      fenetre.close();
      setErreur("Impossible de préparer le reçu.");
    } finally {
      setImpression(null);
    }
  };

  const selectClasse = "w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-2.5 py-2 text-slate-700 focus:outline-none";
  const moisLibelle = MOIS_COURTS[new Date().getMonth()];

  return (
    <div className="space-y-6">
      {/* Banniere */}
      <div className="rounded-2xl p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs" style={{ background: "#0C447C" }}>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Journal de Caisse</h1>
          <p className="text-xs text-white/80 mt-0.5">Encaissements des familles · Salaires et dépenses payés avec · Solde disponible</p>
        </div>
        <div className={`flex items-center gap-2 self-start sm:self-auto ${onglet === "encaissements" ? "" : "invisible"}`}>
          <button
            onClick={exporterCsv}
            disabled={filtres.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-colors cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Exporter Excel
          </button>
          <button
            onClick={imprimerJournal}
            disabled={filtres.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-[#0C447C] hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            <FileText className="w-3.5 h-3.5" />
            Imprimer / PDF
          </button>
        </div>
      </div>

      {erreur && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5">{erreur}</p>}

      <CarteSoldeCaisse synthese={synthese} chargement={!synthese} />

      {/* Onglets : entrees / sorties de caisse */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-200/60 rounded-xl w-fit">
        {[
          ["encaissements", "Encaissements"],
          ["sorties", "Sorties de caisse (salaires & dépenses)"],
        ].map(([cle, libelle]) => (
          <button
            key={cle}
            type="button"
            onClick={() => setOnglet(cle)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${onglet === cle ? "bg-white text-[#0C447C] shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            {libelle}
          </button>
        ))}
      </div>

      {onglet === "sorties" && (
        <SortiesCaisse synthese={synthese} peutEnregistrer={peutAnnuler} onModifiee={() => setRechargement((n) => n + 1)} />
      )}

      {onglet === "encaissements" && (
      <>
      {/* 4 compteurs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {[
          { libelle: "Encaissé aujourd'hui", valeur: formaterGNF(somme(duJour)), detail: `${duJour.length} versement${duJour.length > 1 ? "s" : ""}`, pastille: String(new Date().getDate()), couleur: "text-emerald-600", titre: "text-emerald-700", fond: "bg-emerald-50", bord: "border-emerald-100" },
          { libelle: "Encaissé ce mois", valeur: formaterGNF(somme(duMois)), detail: `${duMois.length} versement${duMois.length > 1 ? "s" : ""}`, pastille: moisLibelle, couleur: "text-[#0C447C]", titre: "text-[#0C447C]", fond: "bg-blue-50", bord: "border-blue-100" },
          { libelle: "Versements", valeur: valides.length, detail: `Total : ${formaterGNF(totalGeneral)}`, pastille: "#", couleur: "text-purple-700", titre: "text-purple-700", fond: "bg-purple-50", bord: "border-purple-100" },
          { libelle: "Moyenne par versement", valeur: formaterGNF(valides.length ? totalGeneral / valides.length : 0), detail: "Par passage en caisse", pastille: "~", couleur: "text-amber-700", titre: "text-amber-700", fond: "bg-amber-50", bord: "border-amber-100" },
        ].map((c) => (
          <div key={c.libelle} className={`bg-white p-4 border ${c.bord}`} style={STYLE_CARTE}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${c.titre}`}>{c.libelle}</span>
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${c.fond} ${c.couleur}`}>{c.pastille}</span>
            </div>
            <div className={`text-lg sm:text-2xl font-extrabold tabular-nums tracking-tight truncate ${c.couleur}`}>{chargement ? "…" : c.valeur}</div>
            <div className="text-[11px] text-slate-400 mt-1 truncate">{c.detail}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 border border-slate-100/90" style={STYLE_CARTE}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          <div className="lg:col-span-4 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher par élève, matricule, classe, reçu..."
              value={recherche}
              onChange={changer(setRecherche)}
              className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl pl-8 pr-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0C447C]/20 focus:border-[#0C447C]"
            />
          </div>
          <div className="lg:col-span-2">
            <select value={typeFiltre} onChange={changer(setTypeFiltre)} className={selectClasse}>
              <option value="tous">Tous les types de frais</option>
              {types.map((t) => (
                <option key={t.cle} value={t.cle}>{t.libelle}</option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-2">
            <select value={moyenFiltre} onChange={changer(setMoyenFiltre)} className={selectClasse}>
              <option value="tous">Tous les moyens</option>
              {Object.entries(MOYENS).map(([cle, m]) => (
                <option key={cle} value={cle}>{m.libelle}</option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-4 flex items-center gap-2">
            <input type="date" value={debut} onChange={changer(setDebut)} className="flex-1 min-w-0 bg-slate-50 border border-slate-200 text-xs font-medium rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none" aria-label="Date de début" />
            <span className="text-slate-400 text-xs">à</span>
            <input type="date" value={fin} onChange={changer(setFin)} className="flex-1 min-w-0 bg-slate-50 border border-slate-200 text-xs font-medium rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none" aria-label="Date de fin" />
            {filtreActif && (
              <button onClick={reinitialiser} title="Effacer les filtres" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white border border-slate-100/90 overflow-hidden" style={STYLE_CARTE}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Date / heure</th>
                <th className="py-3 px-4">Élève</th>
                <th className="py-3 px-3">Classe</th>
                <th className="py-3 px-3">Frais réglés</th>
                <th className="py-3 px-4 text-right">Montant</th>
                <th className="py-3 px-3">Moyen</th>
                <th className="py-3 px-3">Référence</th>
                <th className="py-3 px-4 text-right">Reçu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {chargement ? (
                <tr><td colSpan={8} className="py-12 text-center text-slate-400">Chargement du journal...</td></tr>
              ) : visibles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    {versements.length === 0 ? "Aucun paiement enregistré pour l'instant." : "Aucun versement ne correspond aux filtres."}
                  </td>
                </tr>
              ) : (
                visibles.map((v) => {
                  const moyen = MOYENS[v.moyen_paiement];
                  return (
                    <tr key={v.id} className={`transition-colors align-top ${v.annule ? "bg-rose-50/40" : "hover:bg-slate-50/70"}`}>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-800">{formaterDate(v.date_paiement)}</div>
                        <div className="text-[11px] text-slate-400">{v.heure || "—"}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-full bg-[#0C447C]/10 text-[#0C447C] font-bold text-[10px] flex items-center justify-center shrink-0">{initiales(v.eleve?.nom_complet)}</span>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate max-w-44">{v.eleve?.nom_complet || "—"}</div>
                            <div className="text-[10px] text-slate-400 tabular-nums">{v.eleve?.matricule}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {v.eleve?.classe ? <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{v.eleve.classe}</span> : "—"}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {v.details.map((d) => (
                            <span key={d.id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap ${configTypeFrais(d.type_frais).classe}`}>
                              {libelleDetail(d)}
                              {v.details.length > 1 && <span className="opacity-80 tabular-nums">{d.montant.toLocaleString("fr-FR")}</span>}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className={`font-extrabold text-sm tabular-nums ${v.annule ? "text-slate-400 line-through" : "text-[#15803d]"}`}>{formaterGNF(v.montant)}</span>
                        {v.annule && (
                          <div className="mt-1 flex justify-end" title={`Annulé${v.annule_par ? ` par ${v.annule_par}` : ""} · ${v.motif_annulation || ""}`}>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                              <Ban className="w-3 h-3" /> Annulé
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold ${moyen?.classe || "bg-slate-100 text-slate-600"}`}>
                          {moyen?.emoji} {moyen?.libelle || v.moyen_paiement}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="text-[11px] text-slate-500 font-medium tabular-nums">{referenceVersement(v)}</span>
                        {v.caissier && <div className="text-[10px] text-slate-400">par {v.caissier}</div>}
                        {v.annule && (
                          <div className="text-[10px] text-rose-600 max-w-52 whitespace-normal mt-0.5">
                            Annulé{v.annule_par ? ` par ${v.annule_par}` : ""} : {v.motif_annulation}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => reimprimerRecu(v)}
                          disabled={impression === v.id || !v.eleve}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#0C447C] hover:bg-blue-50 transition-colors cursor-pointer disabled:opacity-40"
                          title="Réimprimer le reçu"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {peutAnnuler && !v.annule && (
                          <button
                            type="button"
                            onClick={() => {
                              setAAnnuler(v);
                              setMotif("");
                              setAnnulation({ envoi: false, erreur: "" });
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Annuler ce versement (erreur de saisie)"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            {filtres.length > 0 ? (
              <>
                Affichage <span className="font-semibold text-slate-800">{(pageCourante - 1) * PAR_PAGE + 1}</span>-
                <span className="font-semibold text-slate-800">{Math.min(pageCourante * PAR_PAGE, filtres.length)}</span> sur{" "}
                <span className="font-semibold text-slate-800">{filtres.length}</span> versement{filtres.length > 1 ? "s" : ""}
              </>
            ) : (
              "0 versement"
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(pageCourante - 1)} disabled={pageCourante === 1} className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white text-slate-700 cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold px-2">Page {pageCourante} sur {totalPages}</span>
            <button onClick={() => setPage(pageCourante + 1)} disabled={pageCourante === totalPages} className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white text-slate-700 cursor-pointer">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Synthese de la periode filtree */}
      <div className="bg-white p-5 border border-slate-100/90" style={STYLE_CARTE}>
        <h3 className="text-sm font-extrabold text-slate-900 mb-4 pb-2 border-b border-slate-100">
          Synthèse des encaissements {filtreActif ? "(filtres appliqués)" : "(tout le journal)"}
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 p-4 rounded-xl bg-blue-50/60 border border-blue-100 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-[#0C447C] uppercase tracking-wider block mb-1">Volume total perçu</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#0C447C] tabular-nums">{formaterGNF(totalFiltre)}</div>
            </div>
            <div className="text-xs text-slate-500 mt-4">
              {filtres.length} versement{filtres.length > 1 ? "s" : ""} enregistré{filtres.length > 1 ? "s" : ""} en caisse, chacun avec son reçu.
            </div>
          </div>

          <div className="lg:col-span-4 space-y-3">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Par moyen de paiement</div>
            {parMoyen.map(({ cle, montant }) => {
              const pct = totalFiltre > 0 ? Math.round((montant / totalFiltre) * 100) : 0;
              return (
                <div key={cle} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700">{MOYENS[cle].emoji} {MOYENS[cle].libelle}</span>
                    <span className="font-bold text-slate-800 tabular-nums">{formaterGNF(montant)} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${MOYENS[cle].barre}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-4 space-y-3">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Par type de frais</div>
            {parType.length === 0 && <p className="text-xs text-slate-400">Aucun encaissement.</p>}
            {parType.map(({ type, montant }) => {
              const pct = totalFiltre > 0 ? Math.round((montant / totalFiltre) * 100) : 0;
              return (
                <div key={type} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700">{type}</span>
                    <span className="font-bold text-slate-800 tabular-nums">{formaterGNF(montant)} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${configTypeFrais(type).barre}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      </>
      )}

      {succes && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm shadow-2xl">
          <span>{succes}</span>
          <button onClick={() => setSucces("")} className="text-white/60 hover:text-white cursor-pointer" aria-label="Fermer"><X className="w-4 h-4" /></button>
        </div>
      )}

      {aAnnuler && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-4" onClick={() => !annulation.envoi && setAAnnuler(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <span className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0"><AlertTriangle className="w-5 h-5" /></span>
              <div>
                <h3 className="text-base font-bold text-slate-900">Annuler ce versement ?</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {aAnnuler.eleve?.nom_complet} · {formaterGNF(aAnnuler.montant)} · {referenceVersement(aAnnuler)}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Le versement reste dans le journal, barré, avec votre nom et le motif. Il ne compte plus dans les totaux ni dans ce que l'élève a payé :
              ses échéances redeviennent dues. Cette action ne peut pas être défaite.
            </p>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Motif de l'annulation *</label>
              <input
                autoFocus
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder="Ex : montant saisi en double, mauvais élève…"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400"
              />
            </div>
            {annulation.erreur && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">{annulation.erreur}</div>}
            <div className="flex items-center justify-end gap-3 pt-1">
              <button type="button" onClick={() => setAAnnuler(null)} disabled={annulation.envoi} className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">Retour</button>
              <button
                type="button"
                onClick={annuler}
                disabled={annulation.envoi || motif.trim().length < 3}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {annulation.envoi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                Annuler le versement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
