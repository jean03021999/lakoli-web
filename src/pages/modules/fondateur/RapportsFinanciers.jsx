import { useEffect, useMemo, useState } from "react";
import { FileText, FileSpreadsheet, Layers, AlertOctagon, Printer, Eye, Download, Loader2 } from "lucide-react";
import api from "../../../services/api";
import useActualisation from "../../../hooks/useActualisation";
import { regrouperVersements } from "../../../utils/versements";
import { imprimerDocument } from "../../../utils/impression";
import { MOYENS, telechargerCsv } from "../../../components/frais/configFrais";
import { dateLocale, debutAnnee, documentHtml, formatDateFr, formatDateHeureFr, formatDelai, formatGNF, formatNombre, jourDe, lignesAnnulations, lignesImpayes, lignesRecouvrement, natureVersement, totauxRecouvrement } from "../../../components/fondateur/outilsFondateur";

// Rapports du Fondateur (design AI Studio) : apercu a l'ecran, document imprimable (PDF via le
// navigateur) et export Excel, a partir des memes donnees.

const RAPPORTS = [
  { id: "situation_financiere", titre: "Situation financière", description: "Encaissements, reste à percevoir et taux de recouvrement par classe, avec signatures.", icone: FileText, couleur: "bg-blue-50 text-[#0C447C] border-blue-200", periode: false },
  { id: "recouvrement_classe", titre: "Recouvrement par classe", description: "Scolarité annuelle attendue, recouvrée et reste à percevoir de chaque classe.", icone: Layers, couleur: "bg-emerald-50 text-emerald-800 border-emerald-200", periode: false },
  { id: "liste_impayes", titre: "Liste des impayés", description: "Élèves en retard, avec les coordonnées des parents pour les relances.", icone: FileSpreadsheet, couleur: "bg-rose-50 text-rose-800 border-rose-200", periode: false },
  { id: "journal_caisse", titre: "Journal de caisse", description: "Tous les versements de la période : reçus, modes de paiement et caisse.", icone: FileText, couleur: "bg-amber-50 text-amber-800 border-amber-200", periode: true },
  { id: "annulations", titre: "Annulations", description: "Recettes annulées avec leur motif, leur délai et leur statut de vérification.", icone: AlertOctagon, couleur: "bg-purple-50 text-purple-800 border-purple-200", periode: true },
];

export default function RapportsFinanciers({ etablissement, session }) {
  const actualisation = useActualisation();
  const [donnees, setDonnees] = useState(null);
  const [erreur, setErreur] = useState("");
  const [rapportActif, setRapportActif] = useState("situation_financiere");
  const [periode, setPeriode] = useState("annee");
  const [classe, setClasse] = useState("toutes");

  useEffect(() => {
    let actif = true;
    Promise.all([api.get("/frais/paiements"), api.get("/frais/stats-par-classe"), api.get("/frais/relances"), api.get("/caisse/evolution")])
      .then(([paiements, classes, relances, evolution]) => {
        if (actif) setDonnees({ paiements: paiements.data, classes: classes.data, relances: relances.data.lignes || relances.data, evolution: evolution.data });
      })
      .catch(() => actif && setErreur("Impossible de charger les rapports."));
    return () => {
      actif = false;
    };
  }, [actualisation]);

  const mois = useMemo(() => (donnees?.evolution.mois || []).filter((m) => !m.futur).reverse(), [donnees]);

  const rapport = useMemo(() => {
    if (!donnees) return null;
    const debut = debutAnnee(donnees.evolution);
    const dansPeriodeChoisie = (jour) => (periode === "annee" ? jour >= debut : jour.startsWith(periode));
    const libellePeriode = periode === "annee" ? "Année scolaire" : mois.find((m) => m.mois === periode)?.libelle || periode;
    const parClasse = (c) => classe === "toutes" || c === classe;

    if (rapportActif === "situation_financiere" || rapportActif === "recouvrement_classe") {
      const lignes = lignesRecouvrement(donnees.classes, donnees.paiements, debut).filter((c) => parClasse(c.nom));
      const t = totauxRecouvrement(lignes);
      const impayes = lignesImpayes(donnees.relances, donnees.paiements).filter((e) => parClasse(e.classe));
      const taux = (v) => `${v.toFixed(1).replace(".", ",")} %`;
      const situation = rapportActif === "situation_financiere";
      return {
        titre: situation ? "État récapitulatif : situation financière de la scolarité" : "Recouvrement de la scolarité par classe",
        sousTitre: `Situation au ${formatDateFr(dateLocale())}`,
        colonnes: [
          { titre: "Classe" }, { titre: "Effectif", droite: true },
          ...(situation ? [{ titre: "Inscriptions", droite: true }] : []),
          { titre: "Scolarité recouvrée", droite: true }, { titre: "Net attendu", droite: true }, { titre: "Reste dû", droite: true }, { titre: "Taux", droite: true },
        ],
        lignes: lignes.map((c) => [c.nom, c.effectif, ...(situation ? [formatNombre(c.inscriptions)] : []), formatNombre(c.scolarite), formatNombre(c.netAPayer), formatNombre(c.reste), taux(c.taux)]),
        pied: ["Total général", t.effectif, ...(situation ? [formatNombre(t.inscriptions)] : []), formatNombre(t.scolarite), formatNombre(t.netAPayer), formatNombre(t.reste), taux(t.taux)],
        observation: `Les encaissements de scolarité${situation ? " et d'inscription" : ""} s'élèvent à ${formatGNF(t.scolarite + (situation ? t.inscriptions : 0))}, pour un net de scolarité attendu de ${formatGNF(t.netAPayer)}. Le taux de recouvrement de la scolarité est de ${taux(t.taux)}, avec ${impayes.length} élève${impayes.length > 1 ? "s" : ""} en retard.`,
        signatures: situation,
      };
    }

    if (rapportActif === "liste_impayes") {
      const lignes = lignesImpayes(donnees.relances, donnees.paiements).filter((e) => parClasse(e.classe)).sort((a, b) => b.montantDu - a.montantDu);
      const total = lignes.reduce((s, e) => s + e.montantDu, 0);
      return {
        titre: "Liste des impayés",
        sousTitre: `${lignes.length} élève${lignes.length > 1 ? "s" : ""} · situation au ${formatDateFr(dateLocale())}`,
        colonnes: [{ titre: "Élève" }, { titre: "Classe" }, { titre: "Montant dû", droite: true }, { titre: "Échéances", droite: true }, { titre: "Parent" }, { titre: "Téléphone" }],
        lignes: lignes.map((e) => [e.nomComplet, e.classe, formatNombre(e.montantDu), e.retard, e.nomParent, e.telephone]),
        pied: ["Total", "", formatNombre(total), "", "", ""],
      };
    }

    const versements = regrouperVersements(donnees.paiements).filter((v) => dansPeriodeChoisie(jourDe(v.date_paiement)) && parClasse(v.eleve?.classe));

    if (rapportActif === "journal_caisse") {
      const total = versements.filter((v) => !v.annule).reduce((s, v) => s + v.montant, 0);
      return {
        titre: "Journal de caisse",
        sousTitre: libellePeriode,
        colonnes: [{ titre: "Date" }, { titre: "N° reçu" }, { titre: "Élève" }, { titre: "Classe" }, { titre: "Nature" }, { titre: "Montant", droite: true }, { titre: "Mode" }, { titre: "Encaissé par" }, { titre: "Statut" }],
        lignes: versements.map((v) => [formatDateFr(jourDe(v.date_paiement)), v.reference || `#${v.id}`, v.eleve?.nom_complet, v.eleve?.classe, natureVersement(v), formatNombre(v.montant), MOYENS[v.moyen_paiement]?.libelle || v.moyen_paiement, v.caissier, v.annule ? "Annulé" : "Valide"]),
        pied: ["Total encaissé (hors annulations)", "", "", "", "", formatNombre(total), "", "", ""],
      };
    }

    const annulations = lignesAnnulations(versements, etablissement);
    const total = annulations.reduce((s, a) => s + a.montant, 0);
    return {
      titre: "Rapport des annulations",
      sousTitre: libellePeriode,
      colonnes: [{ titre: "Annulé le" }, { titre: "N° reçu" }, { titre: "Élève" }, { titre: "Classe" }, { titre: "Montant", droite: true }, { titre: "Délai" }, { titre: "Annulé par" }, { titre: "Motif" }, { titre: "Statut" }],
      lignes: annulations.map((a) => [formatDateHeureFr(a.dateAnnulation), a.reference, a.eleveNom, a.classe, formatNombre(a.montant), formatDelai(a.delaiMinutes), a.annulePar, a.motif, a.statutAudit]),
      pied: ["Total annulé", "", "", "", formatNombre(total), "", "", "", ""],
    };
  }, [donnees, rapportActif, periode, classe, mois, etablissement]);

  const definition = RAPPORTS.find((r) => r.id === rapportActif);

  const imprimer = () => {
    if (!imprimerDocument(rapport.titre, documentHtml({ ...rapport, sessionLibelle: session }))) {
      setErreur("Le navigateur a bloqué la fenêtre d'impression. Autorisez les pop-ups pour ce site.");
    }
  };

  const exporter = () => {
    const lignes = rapport.pied ? [...rapport.lignes, rapport.pied] : rapport.lignes;
    // Montants sans espaces dans le fichier : Excel les lit comme des nombres.
    const nombres = lignes.map((l) => l.map((v, i) => (rapport.colonnes[i].droite && typeof v === "string" && /^[\d ]+$/.test(v) ? v.replace(/ /g, "") : v)));
    telechargerCsv(`${rapportActif}-${new Date().toISOString().slice(0, 10)}.csv`, rapport.colonnes.map((c) => c.titre), nombres);
  };

  if (erreur && !donnees) return <p className="p-6 text-sm font-semibold text-rose-700">{erreur}</p>;
  if (!rapport) return <div className="flex items-center justify-center gap-2 p-16 text-sm text-slate-500"><Loader2 className="w-5 h-5 animate-spin" /> Chargement des rapports...</div>;

  const selecteur = "w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-slate-700 text-[11px] focus:outline-none";

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Rapports financiers</h1>
        <p className="text-xs text-slate-500">Choisissez un état pour le prévisualiser, l'imprimer en PDF ou l'exporter vers Excel.</p>
      </div>
      {erreur && <p className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">{erreur}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {RAPPORTS.map((r) => {
          const Icone = r.icone;
          const estActif = rapportActif === r.id;
          return (
            <div key={r.id} className={`bg-white rounded-xl border p-4 shadow-2xs flex flex-col justify-between transition-all ${estActif ? "border-[#0C447C] ring-2 ring-blue-500/10 shadow-sm" : "border-slate-200/90 hover:border-slate-300"}`}>
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className={`p-2 rounded-lg border text-xs font-bold ${r.couleur}`}><Icone className="w-4 h-4" /></span>
                  {estActif && <span className="text-[10px] font-bold text-[#0C447C] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">En aperçu ci-dessous</span>}
                </div>
                <h3 className="text-xs font-bold text-slate-900 tracking-tight">{r.titre}</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{r.description}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5">
                <button type="button" onClick={() => setRapportActif(r.id)} className={`flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${estActif ? "bg-[#0C447C] text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Aperçu</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
        <div className="bg-slate-100/90 px-6 py-3 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Aperçu :</span>
            <span className="text-xs font-bold text-[#0C447C] bg-white px-2.5 py-0.5 rounded border border-slate-200">{definition.titre}</span>
            {definition.periode && (
              <label className="text-[11px] text-slate-500 flex items-center gap-1">
                Période :
                <select value={periode} onChange={(e) => setPeriode(e.target.value)} className={selecteur}>
                  <option value="annee">Année scolaire</option>
                  {mois.map((m) => <option key={m.mois} value={m.mois}>{m.libelle}</option>)}
                </select>
              </label>
            )}
            <label className="text-[11px] text-slate-500 flex items-center gap-1">
              Classe :
              <select value={classe} onChange={(e) => setClasse(e.target.value)} className={selecteur}>
                <option value="toutes">Toutes</option>
                {donnees.classes.map((c) => <option key={c.classe_id} value={c.classe}>{c.classe}</option>)}
              </select>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={imprimer} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0C447C] hover:bg-[#0a2d5a] text-white rounded-lg text-xs font-bold transition-all cursor-pointer">
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer (PDF)</span>
            </button>
            <button type="button" onClick={exporter} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer">
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Exporter en Excel</span>
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-10 bg-white space-y-6 text-slate-800">
          <div className="border-b-2 border-slate-800 pb-4">
            <div className="grid grid-cols-3 items-start text-center gap-2">
              <div className="text-left space-y-0.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-700">République de Guinée</p>
                <p className="text-[9px] italic text-slate-500">Travail - Justice - Solidarité</p>
                {etablissement?.agrement && <p className="text-[9px] font-medium text-slate-600 pt-1">Agrément : {etablissement.agrement}</p>}
              </div>
              <div>
                <h2 className="text-sm font-black uppercase text-slate-900 tracking-tight">{etablissement?.nom}</h2>
                {etablissement?.slogan && <p className="text-[10px] text-slate-500 italic">{etablissement.slogan}</p>}
              </div>
              <div className="text-right space-y-0.5">
                {session && <p className="text-[10px] font-bold text-slate-700">Session : {session}</p>}
                <p className="text-[9px] text-slate-500">Édité le {formatDateFr(dateLocale())}</p>
              </div>
            </div>
            <div className="text-center mt-5 py-2 bg-slate-100 rounded-lg">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#0C447C]">{rapport.titre}</h3>
              <p className="text-[11px] text-slate-600 font-medium">{rapport.sousTitre}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  {rapport.colonnes.map((c) => <th key={c.titre} className={`border border-slate-300 px-3 py-2 ${c.droite ? "text-right" : "text-left"}`}>{c.titre}</th>)}
                </tr>
              </thead>
              <tbody>
                {rapport.lignes.slice(0, 200).map((l, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    {l.map((v, j) => <td key={j} className={`border border-slate-300 px-3 py-2 ${rapport.colonnes[j].droite ? "text-right tabular-nums whitespace-nowrap" : ""} ${j === 0 ? "font-semibold text-slate-900" : ""}`}>{v}</td>)}
                  </tr>
                ))}
                {rapport.lignes.length === 0 && <tr><td colSpan={rapport.colonnes.length} className="py-8 text-center text-slate-400">Aucune donnée pour ce choix.</td></tr>}
              </tbody>
              {rapport.pied && (
                <tfoot>
                  <tr className="bg-slate-200/90 text-slate-900 font-extrabold">
                    {rapport.pied.map((v, j) => <td key={j} className={`border border-slate-400 px-3 py-2.5 ${rapport.colonnes[j].droite ? "text-right tabular-nums whitespace-nowrap" : ""}`}>{v}</td>)}
                  </tr>
                </tfoot>
              )}
            </table>
            {rapport.lignes.length > 200 && <p className="text-[11px] text-slate-500 mt-2">Aperçu limité aux 200 premières lignes ; le document imprimé et l'export contiennent les {rapport.lignes.length} lignes.</p>}
          </div>

          {rapport.observation && <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 leading-relaxed">{rapport.observation}</div>}

          {rapport.signatures && (
            <div className="pt-6 grid grid-cols-3 gap-6 text-center text-xs">
              {[["La Comptabilité", "Établi et vérifié"], ["La Direction", "Conformité des effectifs"], ["Le Fondateur", "Vu et approuvé"]].map(([t, d]) => (
                <div key={t}>
                  <p className="font-bold text-slate-800">{t}</p>
                  <p className="text-[10px] text-slate-400">{d}</p>
                  <div className="h-16 border-b border-slate-300" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
