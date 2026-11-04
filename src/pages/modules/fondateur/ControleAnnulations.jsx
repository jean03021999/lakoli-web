import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertOctagon, AlertTriangle, ShieldCheck, ClipboardCheck, Loader2 } from "lucide-react";
import api from "../../../services/api";
import useActualisation from "../../../hooks/useActualisation";
import { messageErreurApi } from "../../../utils/erreurs";
import { regrouperVersements } from "../../../utils/versements";
import { imprimerDocument } from "../../../utils/impression";
import { telechargerCsv } from "../../../components/frais/configFrais";
import TableauTriable from "../../../components/fondateur/TableauTriable";
import BoutonExport from "../../../components/fondateur/BoutonExport";
import BadgeStatut from "../../../components/fondateur/BadgeStatut";
import { MAX_ANNULATIONS_PAR_PERSONNE, debutMois, documentHtml, formatDateFr, formatDateHeureFr, formatDelai, formatGNF, jourDe, lignesAnnulations } from "../../../components/fondateur/outilsFondateur";

// Controle du Fondateur (design AI Studio) : annulations de versements, alertes selon les seuils de
// l'etablissement (Parametres > Seuils d'alerte) et verification de chaque annulation.

export default function ControleAnnulations({ etablissement, permissions = [] }) {
  const navigate = useNavigate();
  const actualisation = useActualisation();
  const [paiements, setPaiements] = useState(null);
  const [erreur, setErreur] = useState("");
  const [filtre, setFiltre] = useState("tous");
  const [rechargement, setRechargement] = useState(0);
  const [envoi, setEnvoi] = useState(null);
  const peutControler = permissions.includes("frais.controle.gerer");

  useEffect(() => {
    let actif = true;
    api.get("/frais/paiements")
      .then((res) => actif && setPaiements(res.data))
      .catch(() => actif && setErreur("Impossible de charger les annulations."));
    return () => {
      actif = false;
    };
  }, [actualisation, rechargement]);

  const annulations = useMemo(() => lignesAnnulations(regrouperVersements(paiements || []), etablissement), [paiements, etablissement]);

  const filtrees = useMemo(() => annulations.filter((a) => {
    if (filtre === "critiques") return a.estCritique;
    if (filtre === "a_verifier") return a.statutAudit === "À vérifier";
    return true;
  }), [annulations, filtre]);

  const stats = useMemo(() => {
    const ceMois = debutMois();
    const maintenant = new Date();
    const moisPrecedent = debutMois(new Date(maintenant.getFullYear(), maintenant.getMonth() - 1, 1));
    const jour = (a) => jourDe(a.dateAnnulation);
    return {
      montant: annulations.reduce((s, a) => s + a.montant, 0),
      critiques: annulations.filter((a) => a.estCritique).length,
      aVerifier: annulations.filter((a) => a.statutAudit === "À vérifier").length,
      ceMois: annulations.filter((a) => jour(a) >= ceMois).length,
      moisPrecedent: annulations.filter((a) => jour(a) >= moisPrecedent && jour(a) < ceMois).length,
    };
  }, [annulations]);

  const seuilMontant = Number(etablissement?.seuil_annulation_montant ?? 500000);
  const seuilHeures = Number(etablissement?.seuil_annulation_delai_heures ?? 24);

  const justifier = async (a) => {
    setEnvoi(a.id);
    try {
      await api.post("/frais/annulations/justifier", { paiement_ids: a.paiementIds });
      setRechargement((n) => n + 1);
    } catch (err) {
      setErreur(messageErreurApi(err, "Impossible d'enregistrer cette vérification."));
    } finally {
      setEnvoi(null);
    }
  };

  const exporter = () =>
    telechargerCsv(
      `controle-annulations-${new Date().toISOString().slice(0, 10)}.csv`,
      ["N° reçu", "Date du paiement", "Date d'annulation", "Délai", "Élève", "Classe", "Nature", "Montant (GNF)", "Encaissé par", "Annulé par", "Motif", "Alertes", "Statut"],
      filtrees.map((a) => [a.reference, formatDateFr(a.datePaiement), formatDateHeureFr(a.dateAnnulation), formatDelai(a.delaiMinutes), a.eleveNom, a.classe, a.nature, a.montant, a.caissier, a.annulePar, a.motif, a.motifsCritiques.join(" ; "), a.statutAudit])
    );

  const imprimer = () => {
    const ok = imprimerDocument("Contrôle des annulations", documentHtml({
      titre: "Contrôle des annulations",
      sousTitre: `${filtrees.length} annulation${filtrees.length > 1 ? "s" : ""} · ${formatGNF(filtrees.reduce((s, a) => s + a.montant, 0))}`,
      colonnes: [{ titre: "Annulé le" }, { titre: "Reçu" }, { titre: "Élève" }, { titre: "Montant", droite: true }, { titre: "Délai" }, { titre: "Annulé par" }, { titre: "Motif" }, { titre: "Statut" }],
      lignes: filtrees.map((a) => [formatDateHeureFr(a.dateAnnulation), a.reference, `${a.eleveNom} (${a.classe})`, formatGNF(a.montant), formatDelai(a.delaiMinutes), a.annulePar, a.motif, a.statutAudit]),
    }));
    if (!ok) setErreur("Le navigateur a bloqué la fenêtre d'impression. Autorisez les pop-ups pour ce site.");
  };

  const colonnes = [
    {
      cle: "dateAnnulation", enTete: "Date & reçu",
      render: (a) => <div><span className="text-xs font-bold text-slate-800 block whitespace-nowrap">{formatDateHeureFr(a.dateAnnulation)}</span><span className="text-[10px] text-slate-400">{a.reference}</span></div>,
    },
    {
      cle: "eleveNom", enTete: "Élève & classe",
      render: (a) => <div><span className="font-bold text-slate-900 block text-xs">{a.eleveNom}</span><span className="text-[11px] text-[#0C447C] font-semibold">{a.classe}</span></div>,
    },
    {
      cle: "montant", enTete: "Montant annulé", alignement: "droite",
      render: (a) => {
        const depasse = a.montant >= seuilMontant;
        return (
          <div>
            <span className={`font-bold tabular-nums block whitespace-nowrap ${depasse ? "text-rose-700 text-sm" : "text-xs text-slate-900"}`}>{formatGNF(a.montant)}</span>
            {depasse && <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 rounded border border-rose-200">Seuil dépassé</span>}
          </div>
        );
      },
    },
    {
      cle: "delaiMinutes", enTete: "Délai d'annulation",
      render: (a) => {
        const tardif = a.delaiMinutes !== null && a.delaiMinutes >= seuilHeures * 60;
        return (
          <div>
            <span className={`text-xs font-semibold block whitespace-nowrap tabular-nums ${tardif ? "text-rose-700 font-bold" : "text-slate-700"}`}>{formatDelai(a.delaiMinutes)}</span>
            {tardif ? <span className="text-[10px] text-rose-600 font-bold">Alerte : plus de {seuilHeures} h</span> : <span className="text-[10px] text-slate-400">Normal</span>}
          </div>
        );
      },
    },
    {
      cle: "annulePar", enTete: "Annulé par",
      render: (a) => <div><span className="font-medium text-slate-800 text-xs block">{a.annulePar}</span><span className="text-[10px] text-slate-400">Encaissé par {a.caissier}</span></div>,
    },
    {
      cle: "motif", enTete: "Motif saisi", triable: false,
      render: (a) => (
        <div className="space-y-1 max-w-xs">
          <p className="text-xs text-slate-800 leading-snug">{a.motif}</p>
          {a.motifsCritiques.map((m) => (
            <span key={m} className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded mr-1">
              <AlertTriangle className="w-2.5 h-2.5" />
              <span>{m}</span>
            </span>
          ))}
        </div>
      ),
    },
    {
      cle: "statutAudit", enTete: "Statut",
      render: (a) => (
        <div className="space-y-1">
          <BadgeStatut statut={a.statutAudit === "Justifié" ? "solde" : "alerte"} texte={a.statutAudit} taille="sm" />
          {peutControler && a.statutAudit === "À vérifier" && (
            <button type="button" disabled={envoi === a.id} onClick={() => justifier(a)} className="text-[10px] text-blue-700 hover:text-blue-900 font-bold block cursor-pointer underline disabled:opacity-50">
              Marquer justifiée
            </button>
          )}
        </div>
      ),
    },
  ];

  if (erreur && !paiements) return <p className="p-6 text-sm font-semibold text-rose-700">{erreur}</p>;
  if (!paiements) return <div className="flex items-center justify-center gap-2 p-16 text-sm text-slate-500"><Loader2 className="w-5 h-5 animate-spin" /> Chargement du contrôle...</div>;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Contrôle des annulations</h1>
        <p className="text-xs text-slate-500">Chaque annulation retire une recette du journal de caisse : vérifiez celles qui sortent de vos règles.</p>
      </div>
      {erreur && <p className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">{erreur}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <span>Annulations de reçus</span>
              <span className="p-2 rounded-lg bg-rose-50 text-rose-700"><AlertOctagon className="w-4 h-4" /></span>
            </div>
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-2xl font-bold text-rose-700 tabular-nums">{annulations.length}</span>
              <span className="text-sm font-semibold text-slate-700 tabular-nums">({formatGNF(stats.montant)})</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{stats.critiques} alerte{stats.critiques > 1 ? "s" : ""} critique{stats.critiques > 1 ? "s" : ""}</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Ce mois / mois dernier :</span>
            <span className="font-semibold text-slate-700 tabular-nums">{stats.ceMois} / {stats.moisPrecedent}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <span>Restant à vérifier</span>
              <span className="p-2 rounded-lg bg-amber-50 text-amber-700"><ClipboardCheck className="w-4 h-4" /></span>
            </div>
            <span className="text-2xl font-bold text-amber-700 tabular-nums">{stats.aVerifier}</span>
            <p className="text-xs text-slate-500 mt-1">Sur {annulations.length} annulation{annulations.length > 1 ? "s" : ""} enregistrée{annulations.length > 1 ? "s" : ""}</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400">Une annulation vérifiée garde la trace de votre validation.</div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              <span>Règles de contrôle actives</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">Mise en évidence en rouge si :</p>
            <ul className="text-[11px] text-slate-200 mt-2 space-y-1 list-disc list-inside">
              <li>Montant annulé de {formatGNF(seuilMontant)} ou plus</li>
              <li>Annulation {seuilHeures} h ou plus après l'encaissement</li>
              <li>Plus de {MAX_ANNULATIONS_PAR_PERSONNE} annulations par la même personne</li>
            </ul>
          </div>
          <button type="button" onClick={() => navigate("/parametres?section=controle")} className="mt-3 pt-2 border-t border-slate-700 text-left text-[11px] text-emerald-300 font-medium hover:text-emerald-200 cursor-pointer">
            Modifier les seuils →
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <select value={filtre} onChange={(e) => setFiltre(e.target.value)} className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none">
            <option value="tous">Toutes les annulations</option>
            <option value="critiques">Alertes critiques uniquement</option>
            <option value="a_verifier">À vérifier uniquement</option>
          </select>
          <BoutonExport onExportExcel={exporter} onImprimer={imprimer} texteExcel="Exporter en Excel" texteImprimer="Imprimer le contrôle" />
        </div>
        <TableauTriable
          colonnes={colonnes}
          donnees={filtrees}
          cleId="id"
          triInitialCle="dateAnnulation"
          triInitialDirection="desc"
          classeLigne={(a) => (a.estCritique ? "bg-rose-50/70 hover:bg-rose-100/60 font-medium" : "")}
          messageVide="Aucune annulation trouvée"
          sousTitreVide="Aucune annulation ne correspond à ce filtre."
        />
      </div>
    </div>
  );
}
