import { useEffect, useMemo, useState } from "react";
import { Search, Filter, Send, AlertCircle, Clock, Phone, MessageSquare, X, Copy, Check, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import api from "../../../services/api";
import useActualisation from "../../../hooks/useActualisation";
import { messageErreurApi } from "../../../utils/erreurs";
import { imprimerDocument } from "../../../utils/impression";
import { copierTexte } from "../../../utils/pressePapiers";
import { telechargerCsv } from "../../../components/frais/configFrais";
import TableauTriable from "../../../components/fondateur/TableauTriable";
import BoutonExport from "../../../components/fondateur/BoutonExport";
import BadgeStatut from "../../../components/fondateur/BadgeStatut";
import { documentHtml, formatDateFr, formatGNF, lignesImpayes } from "../../../components/fondateur/outilsFondateur";
import { messageRelance, numeroInternational } from "../Relances";

// Recouvrement et impayes du Fondateur (design AI Studio), sur GET /frais/relances. Il pilote et
// relance les parents ; il n'encaisse pas.

const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? "s" : ""}`;

function ModaleRelance({ eleves, etablissement, onClose, onEnregistrer }) {
  const [index, setIndex] = useState(0);
  const [copie, setCopie] = useState(false);
  const [faites, setFaites] = useState([]);
  const eleve = eleves[index];
  const numero = numeroInternational(eleve.telephone);
  const message = messageRelance(eleve, eleve.contact, etablissement?.nom);

  const copier = async () => {
    if (!(await copierTexte(message))) return;
    setCopie(true);
    setTimeout(() => setCopie(false), 2500);
  };

  // Chaque relance n'est enregistree qu'une fois dans l'historique.
  const noter = async (liste) => {
    const nouvelles = liste.filter((e) => !faites.includes(e.id));
    if (nouvelles.length === 0) return true;
    const ok = await onEnregistrer(nouvelles);
    if (ok) setFaites((f) => [...f, ...nouvelles.map((e) => e.id)]);
    return ok;
  };

  const ouvrirWhatsApp = () => {
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
    noter([eleve]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-emerald-50/70">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-600 text-white"><MessageSquare className="w-4 h-4" /></div>
            <div>
              <h3 className="text-sm font-bold text-emerald-950">Relance WhatsApp {eleves.length > 1 ? `(${index + 1}/${eleves.length})` : ""}</h3>
              <p className="text-[11px] text-emerald-800">Rappel de scolarité adressé au parent</p>
            </div>
          </div>
          <button onClick={onClose} type="button" aria-label="Fermer" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          {eleves.length > 1 && (
            <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200/80 text-xs">
              <button type="button" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} className="px-2.5 py-1 text-slate-700 bg-white border border-slate-200 rounded font-medium hover:bg-slate-100 disabled:opacity-40 cursor-pointer">Précédent</button>
              <span className="font-semibold text-slate-700">Élève {index + 1} sur {eleves.length}</span>
              <button type="button" onClick={() => setIndex((i) => Math.min(eleves.length - 1, i + 1))} disabled={index === eleves.length - 1} className="px-2.5 py-1 text-slate-700 bg-white border border-slate-200 rounded font-medium hover:bg-slate-100 disabled:opacity-40 cursor-pointer">Suivant</button>
            </div>
          )}

          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between gap-3"><span className="text-slate-500 font-medium">Élève :</span><span className="font-bold text-slate-900 text-right">{eleve.nomComplet}</span></div>
            <div className="flex justify-between gap-3"><span className="text-slate-500 font-medium">Classe :</span><span className="font-semibold text-[#0C447C]">{eleve.classe}</span></div>
            <div className="flex justify-between gap-3"><span className="text-slate-500 font-medium">Parent destinataire :</span><span className="font-semibold text-slate-800 text-right">{eleve.nomParent}</span></div>
            <div className="flex justify-between gap-3"><span className="text-slate-500 font-medium">Numéro :</span><span className="font-semibold text-emerald-700 tabular-nums">{eleve.telephone || "Non renseigné"}</span></div>
            <div className="flex justify-between gap-3 pt-1 border-t border-slate-200"><span className="text-slate-500 font-medium">Montant dû :</span><span className="font-bold text-rose-700 text-sm tabular-nums">{formatGNF(eleve.montantDu)}</span></div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">Message pré-rédigé</label>
              <button type="button" onClick={copier} className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-emerald-700 cursor-pointer">
                {copie ? <><Check className="w-3.5 h-3.5 text-emerald-600" /><span className="text-emerald-600">Copié !</span></> : <><Copy className="w-3.5 h-3.5" /><span>Copier le texte</span></>}
              </button>
            </div>
            <div className="p-3 bg-emerald-50/40 border border-emerald-200/80 rounded-xl text-xs text-slate-800 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">{message}</div>
          </div>

          {!numero && (
            <div className="flex items-center gap-2 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Numéro du parent manquant ou invalide : complétez sa fiche pour pouvoir envoyer ce message.</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer">Fermer</button>
          <div className="flex items-center gap-2">
            {eleves.length > 1 && (
              <button type="button" onClick={async () => { if (await noter(eleves)) onClose(); }} className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer">Marquer tous envoyés</button>
            )}
            <button type="button" onClick={ouvrirWhatsApp} disabled={!numero} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-all cursor-pointer">
              <Send className="w-3.5 h-3.5" />
              <span>Ouvrir dans WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RecouvrementImpayes({ etablissement, permissions = [] }) {
  const actualisation = useActualisation();
  const [eleves, setEleves] = useState(null);
  const [erreur, setErreur] = useState("");
  const [recherche, setRecherche] = useState("");
  const [classeFiltre, setClasseFiltre] = useState("toutes");
  const [ancienneteFiltre, setAncienneteFiltre] = useState("tous");
  const [montantMin, setMontantMin] = useState(0);
  const [selections, setSelections] = useState([]);
  const [aRelancer, setARelancer] = useState(null);
  const [rechargement, setRechargement] = useState(0);
  const peutRelancer = permissions.includes("frais.relances.enregistrer");

  useEffect(() => {
    let actif = true;
    Promise.all([api.get("/frais/relances"), api.get("/frais/paiements")])
      .then(([relances, paiements]) => {
        if (actif) setEleves(lignesImpayes(relances.data.lignes || relances.data, paiements.data));
      })
      .catch(() => actif && setErreur("Impossible de charger les impayés."));
    return () => {
      actif = false;
    };
  }, [actualisation, rechargement]);

  const liste = useMemo(() => eleves || [], [eleves]);
  const classes = useMemo(() => [...new Set(liste.map((e) => e.classe).filter(Boolean))], [liste]);

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return liste.filter((e) => {
      if (q && ![e.nomComplet, e.nomParent, e.matricule].some((t) => String(t || "").toLowerCase().includes(q))) return false;
      if (classeFiltre !== "toutes" && e.classe !== classeFiltre) return false;
      if (ancienneteFiltre === "1" && e.retard !== 1) return false;
      if (ancienneteFiltre === "2" && e.retard !== 2) return false;
      if (ancienneteFiltre === "3_plus" && e.retard < 3) return false;
      return e.montantDu >= montantMin;
    });
  }, [liste, recherche, classeFiltre, ancienneteFiltre, montantMin]);

  const total = filtres.reduce((s, e) => s + e.montantDu, 0);
  const critiques = filtres.filter((e) => e.retard >= 3).length;

  const graphique = useMemo(() => {
    const parClasse = new Map(classes.map((c) => [c, { classe: c, nbEleves: 0, montant: 0 }]));
    for (const e of filtres) {
      const c = parClasse.get(e.classe);
      if (c) {
        c.nbEleves += 1;
        c.montant += e.montantDu;
      }
    }
    return [...parClasse.values()];
  }, [classes, filtres]);

  const enregistrerRelances = async (cibles) => {
    if (!peutRelancer) return false;
    try {
      await api.post("/frais/relances", {
        canal: "whatsapp",
        relances: cibles.map((l) => ({ eleve_id: l.eleve_id, montant_du: l.montant_du, motif: l.motif })),
      });
      setSelections([]);
      setRechargement((n) => n + 1);
      return true;
    } catch (err) {
      setErreur(messageErreurApi(err, "Enregistrement de la relance impossible."));
      return false;
    }
  };

  const entetesExport = ["Matricule", "Élève", "Classe", "Montant dû (GNF)", "Échéances en retard", "Première échéance due", "Dernier paiement", "Parent", "Téléphone", "Dernière relance", "Relances"];
  const ligneExport = (e) => [
    e.matricule, e.nomComplet, e.classe, e.montantDu, e.retard, e.echeance,
    e.dernierPaiementDate ? formatDateFr(e.dernierPaiementDate) : "Aucun",
    e.nomParent, e.telephone, e.derniereRelanceDate ? formatDateFr(e.derniereRelanceDate) : "Jamais", e.nombreRelances,
  ];
  const exporter = () => telechargerCsv(`impayes-${new Date().toISOString().slice(0, 10)}.csv`, entetesExport, filtres.map(ligneExport));

  const imprimer = () => {
    const ok = imprimerDocument("Élèves en retard de paiement", documentHtml({
      titre: "Liste des impayés",
      sousTitre: `${pluriel(filtres.length, "élève")} · ${formatGNF(total)}`,
      colonnes: [{ titre: "Élève" }, { titre: "Classe" }, { titre: "Montant dû", droite: true }, { titre: "Échéances", droite: true }, { titre: "Parent" }, { titre: "Téléphone" }],
      lignes: filtres.map((e) => [e.nomComplet, e.classe, formatGNF(e.montantDu), e.retard, e.nomParent, e.telephone]),
      pied: ["Total", "", formatGNF(total), "", "", ""],
    }));
    if (!ok) setErreur("Le navigateur a bloqué la fenêtre d'impression. Autorisez les pop-ups pour ce site.");
  };

  const colonnes = [
    {
      cle: "nomComplet", enTete: "Élève",
      render: (e) => <div><span className="font-bold text-slate-900 block">{e.nomComplet}</span><span className="text-[11px] text-slate-400">{e.matricule}</span></div>,
    },
    {
      cle: "classe", enTete: "Classe",
      render: (e) => <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-[#0C447C] border border-slate-200 inline-block">{e.classe}</span>,
    },
    {
      cle: "montantDu", enTete: "Montant dû", alignement: "droite",
      render: (e) => <span className="font-bold text-rose-700 text-xs tabular-nums whitespace-nowrap">{formatGNF(e.montantDu)}</span>,
    },
    {
      cle: "dernierPaiementDate", enTete: "Dernier paiement",
      render: (e) => e.dernierPaiementDate
        ? <div><span className="text-slate-700 font-medium block whitespace-nowrap">{formatDateFr(e.dernierPaiementDate)}</span><span className="text-[10px] text-slate-400 tabular-nums">{formatGNF(e.dernierPaiementMontant)}</span></div>
        : <span className="text-slate-400 italic text-[11px]">Aucun</span>,
    },
    {
      cle: "retard", enTete: "Retard",
      render: (e) => (
        <div className="space-y-0.5">
          <BadgeStatut statut="en_retard" texte={pluriel(e.retard, "échéance")} taille="sm" />
          <p className="text-[10px] text-slate-400 truncate max-w-[130px]" title={e.echeance}>{e.echeance}</p>
        </div>
      ),
    },
    {
      cle: "nomParent", enTete: "Contact parent",
      render: (e) => (
        <div>
          <span className="font-semibold text-slate-800 block text-xs">{e.nomParent}</span>
          {e.telephone && <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 tabular-nums"><Phone className="w-3 h-3 text-slate-400" /><span>{e.telephone}</span></span>}
        </div>
      ),
    },
    {
      cle: "derniereRelanceDate", enTete: "Dernière relance",
      render: (e) => e.derniereRelanceDate
        ? <div><span className="text-slate-700 font-medium block text-xs whitespace-nowrap">{formatDateFr(e.derniereRelanceDate)}</span><span className="text-[10px] text-blue-700 font-semibold">{pluriel(e.nombreRelances, "relance")}</span></div>
        : <span className="text-slate-400 italic text-[11px]">Aucune relance</span>,
    },
    ...(peutRelancer ? [{
      cle: "actions", enTete: "Action", triable: false, alignement: "centre",
      render: (e) => (
        <button type="button" onClick={() => setARelancer([e])} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-600 hover:text-white border border-emerald-200 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap">
          <MessageSquare className="w-3 h-3" />
          <span>Relancer</span>
        </button>
      ),
    }] : []),
  ];

  if (erreur && !eleves) return <p className="p-6 text-sm font-semibold text-rose-700">{erreur}</p>;
  if (!eleves) return <div className="flex items-center justify-center gap-2 p-16 text-sm text-slate-500"><Loader2 className="w-5 h-5 animate-spin" /> Chargement des impayés...</div>;

  const selecteur = "px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Recouvrement & impayés</h1>
        <p className="text-xs text-slate-500">Élèves en retard, contacts des parents et relances WhatsApp.</p>
      </div>
      {erreur && <p className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">{erreur}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <span>Total des impayés en cours</span>
              <span className="p-2 rounded-lg bg-rose-50 text-rose-700"><AlertCircle className="w-4 h-4" /></span>
            </div>
            <p className="text-2xl font-bold text-rose-700 tabular-nums">{formatGNF(total)}</p>
            <p className="text-xs text-slate-500 mt-1">Sur {pluriel(filtres.length, "élève")} (dont {critiques} avec 3 échéances et plus)</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Moyenne par élève :</span>
            <span className="font-bold text-slate-900 tabular-nums">{formatGNF(filtres.length ? total / filtres.length : 0)}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>Gravité des retards</span>
            <span className="p-2 rounded-lg bg-amber-50 text-amber-700"><Clock className="w-4 h-4" /></span>
          </div>
          <div className="space-y-2 mt-1 text-xs">
            {[
              ["bg-amber-400", "1 échéance en retard :", liste.filter((e) => e.retard === 1).length, "text-slate-800"],
              ["bg-orange-500", "2 échéances en retard :", liste.filter((e) => e.retard === 2).length, "text-slate-800"],
              ["bg-rose-600", "3 et plus (critique) :", liste.filter((e) => e.retard >= 3).length, "text-rose-700"],
            ].map(([puce, libelle, n, couleur]) => (
              <div key={libelle} className="flex justify-between items-center">
                <span className="text-slate-600 flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${puce}`} /> {libelle}</span>
                <span className={`font-bold tabular-nums ${couleur}`}>{pluriel(n, "élève")}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-400">Le fondateur pilote le recouvrement sans encaisser directement.</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            <span>Élèves impayés par classe</span>
            <span className="text-[10px] text-slate-400 tabular-nums">Total : {filtres.length}</span>
          </div>
          <div className="h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graphique} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <XAxis dataKey="classe" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 9 }} interval={graphique.length > 12 ? "preserveStartEnd" : 0} tickFormatter={(v) => String(v).split(" ")[0]} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 9 }} allowDecimals={false} />
                <Tooltip
                  formatter={(valeur, _nom, props) => [`${valeur} élève(s) (${formatGNF(props.payload.montant)})`, "Impayés"]}
                  labelFormatter={(l) => `Classe : ${l}`}
                  contentStyle={{ backgroundColor: "#0f172a", border: "none", borderRadius: "8px", color: "#fff", fontSize: "11px" }}
                />
                <Bar dataKey="nbEleves" radius={[3, 3, 0, 0]}>
                  {graphique.map((g) => <Cell key={g.classe} fill={g.nbEleves >= 4 ? "#e11d48" : g.nbEleves >= 3 ? "#ea580c" : "#0C447C"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input type="text" value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher par élève, matricule, parent..." className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white text-slate-800" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {peutRelancer && selections.length > 0 && (
              <button type="button" onClick={() => setARelancer(liste.filter((e) => selections.includes(e.id)))} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer">
                <Send className="w-3.5 h-3.5" />
                <span>Relancer la sélection ({selections.length})</span>
              </button>
            )}
            <BoutonExport onExportExcel={exporter} onImprimer={imprimer} texteExcel="Exporter en Excel" texteImprimer="Imprimer la liste" />
          </div>
        </div>
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold"><Filter className="w-3.5 h-3.5" /><span>Filtres :</span></div>
          <select value={classeFiltre} onChange={(e) => setClasseFiltre(e.target.value)} className={selecteur}>
            <option value="toutes">Toutes les classes</option>
            {classes.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={ancienneteFiltre} onChange={(e) => setAncienneteFiltre(e.target.value)} className={selecteur}>
            <option value="tous">Toutes anciennetés</option>
            <option value="1">1 échéance en retard</option>
            <option value="2">2 échéances en retard</option>
            <option value="3_plus">3 échéances et plus</option>
          </select>
          <select value={montantMin} onChange={(e) => setMontantMin(Number(e.target.value))} className={selecteur}>
            <option value={0}>Tous montants</option>
            <option value={350000}>≥ 350 000 GNF</option>
            <option value={700000}>≥ 700 000 GNF</option>
            <option value={1000000}>≥ 1 000 000 GNF</option>
          </select>
          {(classeFiltre !== "toutes" || ancienneteFiltre !== "tous" || montantMin > 0 || recherche) && (
            <button type="button" onClick={() => { setClasseFiltre("toutes"); setAncienneteFiltre("tous"); setMontantMin(0); setRecherche(""); }} className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline">Réinitialiser les filtres</button>
          )}
          <div className="ml-auto text-xs text-slate-400 tabular-nums">{pluriel(filtres.length, "résultat")}</div>
        </div>
      </div>

      <TableauTriable
        colonnes={colonnes}
        donnees={filtres}
        cleId="id"
        triInitialCle="montantDu"
        triInitialDirection="desc"
        selectionnable={peutRelancer}
        selectionsIds={selections}
        onChangementSelection={setSelections}
        messageVide="Aucun élève en retard selon ces critères"
        sousTitreVide="Toutes les scolarités de ce groupe sont à jour ou vos filtres sont trop restrictifs."
      />

      {aRelancer && <ModaleRelance eleves={aRelancer} etablissement={etablissement} onClose={() => setARelancer(null)} onEnregistrer={enregistrerRelances} />}
    </div>
  );
}
