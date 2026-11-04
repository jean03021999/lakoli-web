import { useEffect, useMemo, useState } from "react";
import { Eye, Search, Filter, Receipt, X, Printer, AlertTriangle, Loader2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import api from "../../../services/api";
import useActualisation from "../../../hooks/useActualisation";
import { regrouperVersements } from "../../../utils/versements";
import { situationGlobaleDepuisSuivi } from "../../../utils/situationFrais";
import { imprimerDocument, genererJournalCaisseHtml, genererEtImprimerRecu, ouvrirFenetreVierge, formaterDate } from "../../../utils/impression";
import { MOYENS, telechargerCsv } from "../../../components/frais/configFrais";
import TableauTriable from "../../../components/fondateur/TableauTriable";
import BoutonExport from "../../../components/fondateur/BoutonExport";
import BadgeStatut from "../../../components/fondateur/BadgeStatut";
import { dateLocale, debutMois, debutSemaine, formatDateFr, formatDateHeureFr, formatGNF, formatMillions, jourDe, natureVersement } from "../../../components/fondateur/outilsFondateur";

// Journal de caisse du Fondateur (design AI Studio), en lecture seule : la saisie, l'annulation et la
// correction restent reservees a la caisse.

const NATURES = ["Scolarité", "Inscription", "Réinscription", "Autres frais"];
const libelleMoyen = (m) => MOYENS[m]?.libelle || m;
const reference = (v) => v.reference || `#${v.id}`;

function ModaleRecu({ versement, etablissement, onClose, onErreur }) {
  const [envoi, setEnvoi] = useState(false);

  // Meme recu que la caisse, avec la situation de l'eleve a ce jour.
  const imprimer = async () => {
    const fenetre = ouvrirFenetreVierge();
    if (!fenetre) {
      onErreur("Le navigateur a bloqué la fenêtre du reçu. Autorisez les pop-ups pour ce site.");
      return;
    }
    fenetre.document.write('<p style="font-family:Arial;padding:24px">Préparation du reçu...</p>');
    setEnvoi(true);
    try {
      const v = versement;
      const [eleve, suivi] = await Promise.allSettled([api.get(`/eleves/${v.eleve.id}`), api.get(`/frais/eleves/${v.eleve.id}`)]);
      const e = eleve.status === "fulfilled" ? eleve.value.data : null;
      const s = suivi.status === "fulfilled" ? suivi.value.data : null;
      const [nom, ...prenoms] = (v.eleve?.nom_complet || "").split(" ");
      const echeances = (s?.frais || []).flatMap((f) => f.echeances);
      const touchees = v.details.map((d) => echeances.find((x) => String(x.id) === String(d.echeance_eleve_id))).filter(Boolean);
      const resteAPayer = touchees.reduce((t, x) => t + Math.max(0, Number(x.solde)), 0);
      genererEtImprimerRecu(
        {
          reference: reference(v),
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
          lignes: v.details.map((d) => ({ libelle: d.libelle || d.type_frais, montant: d.montant })),
          total: v.montant,
          estSolde: resteAPayer <= 0,
          resteAPayer,
          moyen: libelleMoyen(v.moyen_paiement),
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
      onErreur("Impression du reçu impossible.");
    } finally {
      setEnvoi(false);
    }
  };

  const v = versement;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 shrink-0">Reçu</span>
            <span className="text-xs font-semibold text-slate-700 bg-slate-200/85 px-2 py-0.5 rounded truncate">{reference(v)}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!v.annule && (
              <button onClick={imprimer} disabled={envoi} type="button" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0C447C] text-white text-xs font-semibold rounded-lg hover:bg-[#0a2d5a] disabled:opacity-50 cursor-pointer">
                {envoi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
                <span>Imprimer</span>
              </button>
            )}
            <button onClick={onClose} type="button" aria-label="Fermer" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg cursor-pointer"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="p-6 relative">
          {v.annule && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10">
              <div className="-rotate-12 border-4 border-rose-600/70 text-rose-600/70 font-extrabold text-2xl px-6 py-2 uppercase tracking-widest rounded-xl bg-white/70">Paiement annulé</div>
            </div>
          )}
          <div className="text-center pb-4 border-b border-dashed border-slate-300">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">{etablissement?.nom}</h2>
            {etablissement?.slogan && <p className="text-[11px] text-slate-500 italic">{etablissement.slogan}</p>}
            <p className="text-[11px] text-slate-600">{[etablissement?.adresse, etablissement?.quartier, etablissement?.ville].filter(Boolean).join(", ")}</p>
          </div>
          <div className="flex items-center justify-between my-4 py-2 border-b border-slate-100 gap-3">
            <p className="text-sm font-extrabold text-[#0C447C]">Reçu de caisse scolaire</p>
            <p className="text-xs font-medium text-slate-700">{formatDateFr(jourDe(v.date_paiement))}{v.heure ? ` à ${v.heure}` : ""}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 mb-4 space-y-2 text-xs">
            <div className="flex justify-between gap-3"><span className="text-slate-500 font-medium">Élève :</span><span className="font-bold text-slate-900 text-right">{v.eleve?.nom_complet}</span></div>
            <div className="flex justify-between gap-3"><span className="text-slate-500 font-medium">Matricule et classe :</span><span className="font-semibold text-slate-800 text-right">{v.eleve?.matricule} · <span className="text-[#0C447C] font-bold">{v.eleve?.classe}</span></span></div>
            <div className="flex justify-between gap-3 border-t border-slate-200/60 pt-2"><span className="text-slate-500 font-medium">Motif :</span><span className="font-semibold text-slate-800 text-right">{v.objet}</span></div>
            <div className="flex justify-between gap-3"><span className="text-slate-500 font-medium">Mode de paiement :</span><span className="font-semibold text-slate-800">{libelleMoyen(v.moyen_paiement)}</span></div>
            <div className="flex justify-between gap-3"><span className="text-slate-500 font-medium">Encaissé par :</span><span className="font-medium text-slate-700">{v.caissier || "—"}</span></div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between mb-4">
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Montant réglé</p>
            <p className={`text-xl font-bold tabular-nums ${v.annule ? "line-through text-rose-300" : "text-emerald-400"}`}>{formatGNF(v.montant)}</p>
          </div>
          {v.annule && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-rose-800"><AlertTriangle className="w-4 h-4 text-rose-600" /><span>Annulation</span></div>
              <p className="text-[11px]"><strong>Annulé par :</strong> {v.annule_par || "—"} le {formatDateHeureFr(v.annule_le)}</p>
              <p className="text-[11px]"><strong>Motif :</strong> {v.motif_annulation || "—"}</p>
            </div>
          )}
          {v.observation && <p className="mt-3 text-[11px] text-slate-500">{v.observation}</p>}
        </div>
      </div>
    </div>
  );
}

export default function JournalCaisseFondateur({ etablissement }) {
  const actualisation = useActualisation();
  const [versements, setVersements] = useState(null);
  const [reprises, setReprises] = useState(0);
  const [erreur, setErreur] = useState("");
  const [recherche, setRecherche] = useState("");
  const [filtreType, setFiltreType] = useState("tous");
  const [filtreCaissier, setFiltreCaissier] = useState("tous");
  const [filtreMode, setFiltreMode] = useState("tous");
  const [filtreNature, setFiltreNature] = useState("tous");
  const [recu, setRecu] = useState(null);

  useEffect(() => {
    let actif = true;
    Promise.all([api.get("/frais/paiements"), api.get("/caisse/evolution").catch(() => null)])
      .then(([paiements, evolution]) => {
        if (!actif) return;
        setVersements(regrouperVersements(paiements.data).map((v) => ({
          ...v,
          nature: natureVersement(v),
          jour: jourDe(v.date_paiement),
          dateTri: `${jourDe(v.date_paiement)} ${v.heure || ""}`,
          eleveNom: v.eleve?.nom_complet || "",
          statut: v.annule ? "annule" : "valide",
        })));
        setReprises(evolution?.data?.totaux?.dont_reprises || 0);
      })
      .catch(() => actif && setErreur("Impossible de charger le journal de caisse."));
    return () => {
      actif = false;
    };
  }, [actualisation]);

  const liste = useMemo(() => versements || [], [versements]);
  const valides = useMemo(() => liste.filter((v) => !v.annule), [liste]);
  const caissiers = useMemo(() => [...new Set(liste.map((v) => v.caissier).filter(Boolean))], [liste]);

  const synthese = useMemo(() => {
    const aujourdhui = dateLocale();
    const somme = (l) => l.reduce((s, v) => s + v.montant, 0);
    const duJour = valides.filter((v) => v.jour === aujourdhui);
    const jours = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const cle = dateLocale(d);
      jours.push({
        jour: d.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "2-digit" }),
        montant: somme(valides.filter((v) => v.jour === cle)),
      });
    }
    return {
      jour: somme(duJour),
      nbJour: duJour.length,
      semaine: somme(valides.filter((v) => v.jour >= debutSemaine())),
      mois: somme(valides.filter((v) => v.jour >= debutMois())),
      jours,
      total7: jours.reduce((s, j) => s + j.montant, 0),
    };
  }, [valides]);

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return liste.filter((v) => {
      if (filtreType === "valides" && v.annule) return false;
      if (filtreType === "annules" && !v.annule) return false;
      if (filtreCaissier !== "tous" && v.caissier !== filtreCaissier) return false;
      if (filtreMode !== "tous" && v.moyen_paiement !== filtreMode) return false;
      if (filtreNature !== "tous" && !v.nature.includes(filtreNature)) return false;
      return !q || [v.eleveNom, v.reference, v.eleve?.matricule, v.objet].some((t) => String(t || "").toLowerCase().includes(q));
    });
  }, [liste, filtreType, filtreCaissier, filtreMode, filtreNature, recherche]);

  const exporter = () =>
    telechargerCsv(
      `journal-caisse-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Date", "Heure", "N° reçu", "Élève", "Matricule", "Classe", "Nature", "Détail", "Montant (GNF)", "Mode", "Encaissé par", "Statut", "Annulé par", "Motif d'annulation"],
      filtres.map((v) => [formatDateFr(v.jour), v.heure, reference(v), v.eleveNom, v.eleve?.matricule, v.eleve?.classe, v.nature, v.objet, v.montant, libelleMoyen(v.moyen_paiement), v.caissier, v.annule ? "ANNULÉ" : "VALIDE", v.annule_par || "", v.motif_annulation || ""])
    );

  const imprimer = () => {
    const encaisses = filtres.filter((v) => !v.annule);
    const cumul = (cle) => {
      const t = {};
      for (const v of encaisses) t[cle(v)] = (t[cle(v)] || 0) + v.montant;
      return Object.entries(t).map(([libelle, montant]) => ({ libelle, montant }));
    };
    const html = genererJournalCaisseHtml({
      etablissement: etablissement?.nom,
      filtres: [
        filtreCaissier !== "tous" && `Encaissé par : ${filtreCaissier}`,
        filtreMode !== "tous" && `Mode : ${libelleMoyen(filtreMode)}`,
        filtreNature !== "tous" && `Nature : ${filtreNature}`,
        recherche && `Recherche : ${recherche}`,
      ].filter(Boolean),
      versements: encaisses.map((v) => ({
        date: formaterDate(v.date_paiement),
        heure: v.heure,
        reference: reference(v),
        eleve: v.eleveNom,
        matricule: v.eleve?.matricule,
        classe: v.eleve?.classe,
        detail: v.objet,
        moyen: libelleMoyen(v.moyen_paiement),
        montant: v.montant,
      })),
      parMoyen: cumul((v) => libelleMoyen(v.moyen_paiement)),
      parType: cumul((v) => v.nature),
    });
    if (!imprimerDocument("Journal de caisse", html)) setErreur("Le navigateur a bloqué la fenêtre d'impression. Autorisez les pop-ups pour ce site.");
  };

  const colonnes = [
    {
      cle: "dateTri", enTete: "Date & heure",
      render: (v) => <div><span className="text-xs font-semibold text-slate-800 block whitespace-nowrap">{formatDateFr(v.jour)}{v.heure ? ` à ${v.heure}` : ""}</span><span className="text-[10px] text-slate-400">{reference(v)}</span></div>,
    },
    {
      cle: "eleveNom", enTete: "Élève & classe",
      render: (v) => (
        <div className={v.annule ? "opacity-85" : ""}>
          <span className={`font-bold block text-xs ${v.annule ? "line-through text-rose-700 font-normal" : "text-slate-900"}`}>{v.eleveNom}</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[11px] font-semibold text-[#0C447C]">{v.eleve?.classe}</span>
            <span className="text-[10px] text-slate-400">· {v.eleve?.matricule}</span>
          </div>
        </div>
      ),
    },
    {
      cle: "nature", enTete: "Nature de règlement",
      render: (v) => <div><span className="font-medium text-slate-800 block text-xs">{v.objet}</span><span className="text-[10px] text-slate-500 font-semibold">{v.nature}</span></div>,
    },
    {
      cle: "montant", enTete: "Montant", alignement: "droite",
      render: (v) => v.annule
        ? <div><span className="font-bold text-xs line-through text-rose-600 block tabular-nums whitespace-nowrap">{formatGNF(v.montant)}</span><span className="text-[10px] text-rose-700 font-semibold uppercase">Annulé</span></div>
        : <span className="font-bold text-xs text-emerald-700 tabular-nums whitespace-nowrap">{formatGNF(v.montant)}</span>,
    },
    {
      cle: "moyen_paiement", enTete: "Mode",
      render: (v) => <span className="font-semibold text-slate-800 text-xs whitespace-nowrap">{libelleMoyen(v.moyen_paiement)}</span>,
    },
    {
      cle: "caissier", enTete: "Encaissé par",
      render: (v) => (
        <div>
          <span className="text-slate-800 font-medium block text-xs">{v.caissier || "—"}</span>
          {v.annule && v.annule_par && <span className="text-[10px] text-rose-700 font-semibold">Annulé par : {v.annule_par}</span>}
        </div>
      ),
    },
    {
      cle: "statut", enTete: "Statut",
      render: (v) => v.annule
        ? <div className="space-y-0.5"><BadgeStatut statut="annule" texte="Annulé" taille="sm" />{v.motif_annulation && <p className="text-[10px] text-rose-700 italic max-w-[160px] truncate" title={v.motif_annulation}>{v.motif_annulation}</p>}</div>
        : <BadgeStatut statut="solde" texte="Encaissé" taille="sm" />,
    },
    {
      cle: "action", enTete: "Reçu", triable: false, alignement: "centre",
      render: (v) => (
        <button type="button" onClick={(e) => { e.stopPropagation(); setRecu(v); }} className="p-1.5 text-slate-500 hover:text-[#0C447C] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="Consulter le reçu" aria-label="Consulter le reçu">
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  if (erreur && !versements) return <p className="p-6 text-sm font-semibold text-rose-700">{erreur}</p>;
  if (!versements) return <div className="flex items-center justify-center gap-2 p-16 text-sm text-slate-500"><Loader2 className="w-5 h-5 animate-spin" /> Chargement du journal...</div>;

  const selecteur = "px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20";
  const carte = "bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs";
  const moisCourant = new Date().toLocaleDateString("fr-FR", { month: "long" });

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Journal de caisse</h1>
        <p className="text-xs text-slate-500">Tous les versements de l'école, en lecture seule.</p>
      </div>
      {erreur && <p className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">{erreur}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className={carte}>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total du jour</p>
          <p className="text-xl font-bold text-emerald-700 mt-1 tabular-nums">{formatGNF(synthese.jour)}</p>
          <p className="text-[11px] text-slate-400 mt-1">{synthese.nbJour} encaissement{synthese.nbJour > 1 ? "s" : ""} valide{synthese.nbJour > 1 ? "s" : ""}</p>
        </div>
        <div className={carte}>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Cette semaine</p>
          <p className="text-xl font-bold text-slate-900 mt-1 tabular-nums">{formatGNF(synthese.semaine)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Depuis le {formatDateFr(debutSemaine())}</p>
        </div>
        <div className={carte}>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Mois en cours</p>
          <p className="text-xl font-bold text-[#0C447C] mt-1 tabular-nums">{formatGNF(synthese.mois)}</p>
          <p className="text-[11px] text-slate-400 mt-1 capitalize">{moisCourant}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            <span>7 derniers jours</span>
            <span className="text-emerald-600 font-semibold tabular-nums">{formatMillions(synthese.total7)}</span>
          </div>
          <div className="h-14 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={synthese.jours}>
                <defs>
                  <linearGradient id="caisseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0C447C" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0C447C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="jour" hide />
                <YAxis hide />
                <Tooltip formatter={(val) => [formatGNF(val), "Encaissé"]} contentStyle={{ backgroundColor: "#0f172a", border: "none", borderRadius: "6px", color: "#fff", fontSize: "10px" }} />
                <Area type="monotone" dataKey="montant" stroke="#0C447C" strokeWidth={2} fillOpacity={1} fill="url(#caisseGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50/70 border border-blue-200/80 rounded-xl px-4 py-3 text-xs text-blue-900">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-[#0C447C] shrink-0" />
          <span><strong>Lecture seule :</strong> vous voyez tous les mouvements de caisse. La saisie, l'annulation et la correction sont réservées à la caisse.</span>
        </div>
        {reprises > 0 && (
          <span className="text-[11px] font-semibold text-purple-800 bg-purple-100/90 px-2 py-0.5 rounded border border-purple-200 shrink-0" title="Paiements antérieurs à LAKOLI, repris à l'import : hors de ce journal">
            Reprises antérieures, hors journal : {formatGNF(reprises)}
          </span>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input type="text" value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher par élève, n° reçu, matricule, motif..." className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white text-slate-800" />
          </div>
          <BoutonExport onExportExcel={exporter} onImprimer={imprimer} texteExcel="Exporter le journal (Excel)" texteImprimer="Imprimer" />
        </div>
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold"><Filter className="w-3.5 h-3.5" /><span>Filtrer par :</span></div>
          <select value={filtreType} onChange={(e) => setFiltreType(e.target.value)} className={selecteur}>
            <option value="tous">Tous les mouvements</option>
            <option value="valides">Paiements valides uniquement</option>
            <option value="annules">Paiements annulés</option>
          </select>
          <select value={filtreCaissier} onChange={(e) => setFiltreCaissier(e.target.value)} className={selecteur}>
            <option value="tous">Toute la caisse</option>
            {caissiers.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filtreMode} onChange={(e) => setFiltreMode(e.target.value)} className={selecteur}>
            <option value="tous">Tous les modes</option>
            {Object.entries(MOYENS).map(([cle, m]) => <option key={cle} value={cle}>{m.libelle}</option>)}
          </select>
          <select value={filtreNature} onChange={(e) => setFiltreNature(e.target.value)} className={selecteur}>
            <option value="tous">Toutes natures</option>
            {NATURES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          {(filtreType !== "tous" || filtreCaissier !== "tous" || filtreMode !== "tous" || filtreNature !== "tous" || recherche) && (
            <button type="button" onClick={() => { setFiltreType("tous"); setFiltreCaissier("tous"); setFiltreMode("tous"); setFiltreNature("tous"); setRecherche(""); }} className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline">Réinitialiser</button>
          )}
          <div className="ml-auto text-xs text-slate-400 tabular-nums">{filtres.length} versement{filtres.length > 1 ? "s" : ""}</div>
        </div>
      </div>

      <TableauTriable
        colonnes={colonnes}
        donnees={filtres}
        cleId="id"
        triInitialCle="dateTri"
        triInitialDirection="desc"
        surClicLigne={setRecu}
        classeLigne={(v) => (v.annule ? "bg-rose-50/50 hover:bg-rose-50" : "")}
        messageVide="Aucun mouvement de caisse trouvé"
        sousTitreVide="Aucun versement ne correspond aux filtres appliqués."
      />

      {recu && <ModaleRecu versement={recu} etablissement={etablissement} onClose={() => setRecu(null)} onErreur={setErreur} />}
    </div>
  );
}
