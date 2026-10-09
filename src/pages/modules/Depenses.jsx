import { useEffect, useMemo, useRef, useState } from "react";
import useActualisation from "../../hooks/useActualisation";
import { useSearchParams } from "react-router-dom";
import {
  Plus, Search, X, Loader2, Ban, AlertTriangle, Paperclip, FileText, Image as ImageIcon, Trash2, Pencil,
  ExternalLink, CheckCircle2, Receipt, Printer, Upload, Wallet,
} from "lucide-react";
import api from "../../services/api";
import { MOYENS, STYLE_CARTE, formaterGNF, formaterDateCourte, normaliser, telechargerCsv } from "../../components/frais/configFrais";
import { messageErreurApi } from "../../utils/erreurs";
import { imprimerDocument, genererEtatDepensesHtml, formaterDate } from "../../utils/impression";
import ModaleDepense from "../../components/caisse/ModaleDepense";
import { COULEURS_CATEGORIES, CHAMP, TYPES_PIECES, aujourdhui, tailleLisible, verifierPieces } from "../../components/caisse/configCaisse";

// Module Depenses : toutes les sorties d'argent hors salaires, avec leurs pieces justificatives
// (facture, recu, bon : photo ou PDF). Une depense sans piece est « a justifier » jusqu'a ce
// qu'on y joigne le document. Etat imprimable pour la direction.

const ETATS = [
  ["toutes", "Toutes"],
  ["a_justifier", "À justifier"],
  ["justifiees", "Justifiées"],
  ["annulees", "Annulées"],
];

function BadgeJustification({ depense }) {
  if (depense.annule) return <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500">Annulée</span>;
  if (depense.a_justifier) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">
        <AlertTriangle className="w-3 h-3" /> À justifier
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700">
      <Paperclip className="w-3 h-3" /> {depense.nb_justificatifs} pièce{depense.nb_justificatifs > 1 ? "s" : ""}
    </span>
  );
}

// Panneau de detail : informations, pieces jointes (apercu, ouverture, retrait) et ajout.
function PanneauDepense({ depense, categories, peutGerer, onFermer, onMaj, onModifier, onAnnuler }) {
  const [pieces, setPieces] = useState([]);
  const [numero, setNumero] = useState(depense.numero_piece || "");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [aRetirer, setARetirer] = useState(null);
  const selecteur = useRef(null);
  const moyen = MOYENS[depense.moyen_paiement];
  const modifiable = peutGerer && !depense.annule;

  const choisir = (e) => {
    const liste = Array.from(e.target.files || []);
    e.target.value = "";
    const probleme = verifierPieces(liste);
    setErreur(probleme);
    if (!probleme) setPieces(liste);
  };

  const envoyer = async () => {
    setEnvoi(true);
    setErreur("");
    try {
      const donnees = new FormData();
      pieces.forEach((f) => donnees.append("justificatifs[]", f));
      if (numero.trim() && numero.trim() !== (depense.numero_piece || "")) donnees.append("numero_piece", numero.trim());
      const res = await api.post(`/caisse/depenses/${depense.id}/justificatifs`, donnees);
      setPieces([]);
      onMaj(res.data.message, res.data.depense);
    } catch (err) {
      setErreur(messageErreurApi(err, "Envoi impossible."));
    } finally {
      setEnvoi(false);
    }
  };

  const retirer = async (piece) => {
    setARetirer(piece.id);
    setErreur("");
    try {
      const res = await api.delete(`/caisse/justificatifs/${piece.id}`);
      onMaj(res.data.message, res.data.depense);
    } catch (err) {
      setErreur(messageErreurApi(err, "Retrait impossible."));
    } finally {
      setARetirer(null);
    }
  };

  const ligne = (libelle, valeur) => (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-slate-100 last:border-0 text-xs">
      <span className="text-slate-500 shrink-0">{libelle}</span>
      <span className="text-slate-800 font-semibold text-right">{valeur || "—"}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[1px] flex justify-end" onClick={onFermer}>
      <aside className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 px-6 py-5 border-b border-slate-100">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 tabular-nums">{depense.reference}</p>
            <h3 className={`text-base font-extrabold text-slate-900 mt-0.5 ${depense.annule ? "line-through text-slate-400" : ""}`}>{depense.libelle}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${COULEURS_CATEGORIES[depense.categorie] || COULEURS_CATEGORIES.autre}`}>{categories[depense.categorie] || depense.categorie}</span>
              <BadgeJustification depense={depense} />
            </div>
          </div>
          <button onClick={onFermer} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer" aria-label="Fermer"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-6 flex-1">
          <div className="rounded-xl bg-rose-50 border border-rose-100 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Montant sorti de la caisse</p>
            <p className={`text-2xl font-extrabold tabular-nums mt-1 ${depense.annule ? "text-slate-400 line-through" : "text-rose-600"}`}>−{formaterGNF(depense.montant)}</p>
          </div>

          <div>
            {ligne("Date", formaterDate(depense.date))}
            {ligne("Bénéficiaire", depense.beneficiaire)}
            {ligne("Payé par", moyen ? `${moyen.emoji} ${moyen.libelle}` : depense.moyen_paiement)}
            {ligne("N° de facture / reçu", depense.numero_piece)}
            {ligne("Enregistrée par", depense.par)}
            {depense.observation && ligne("Observation", depense.observation)}
            {depense.annule && ligne("Annulée", `${depense.annule_par ? `par ${depense.annule_par} · ` : ""}${depense.motif_annulation || ""}`)}
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">Pièces justificatives ({depense.justificatifs?.length || 0})</p>
            {depense.justificatifs?.length ? (
              <ul className="space-y-2">
                {depense.justificatifs.map((j) => {
                  const image = j.type_mime?.startsWith("image/");
                  return (
                    <li key={j.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200">
                      <a href={j.url} target="_blank" rel="noreferrer" className="w-14 h-14 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                        {image ? <img src={j.url} alt={j.nom} className="w-full h-full object-cover" /> : <FileText className="w-6 h-6 text-rose-500" />}
                      </a>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-800 truncate">{j.nom}</p>
                        <p className="text-[10px] text-slate-500">{tailleLisible(j.taille)}{j.ajoute_par ? ` · ${j.ajoute_par}` : ""}</p>
                      </div>
                      <a href={j.url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg text-slate-400 hover:text-[#0C447C] hover:bg-blue-50" title="Ouvrir"><ExternalLink className="w-4 h-4" /></a>
                      {modifiable && (
                        <button onClick={() => retirer(j)} disabled={aRetirer === j.id} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer disabled:opacity-50" title="Retirer cette pièce">
                          {aRetirer === j.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-xs text-slate-500 italic">Aucune pièce jointe pour l'instant.</p>
            )}
          </div>

          {modifiable && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Joindre un justificatif</p>
              <input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="N° de facture / reçu (facultatif)" className={CHAMP} />
              <input ref={selecteur} type="file" multiple accept={TYPES_PIECES} onChange={choisir} className="hidden" />
              <button type="button" onClick={() => selecteur.current?.click()} className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl border-2 border-dashed border-slate-300 text-xs font-semibold text-slate-600 hover:border-[#0C447C] hover:text-[#0C447C] bg-white cursor-pointer">
                <Paperclip className="w-4 h-4" /> Choisir la photo ou le PDF (5 Mo max)
              </button>
              {pieces.length > 0 && (
                <ul className="space-y-1.5">
                  {pieces.map((f, i) => (
                    <li key={`${f.name}-${i}`} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs">
                      {/\.pdf$/i.test(f.name) ? <FileText className="w-4 h-4 text-rose-500 shrink-0" /> : <ImageIcon className="w-4 h-4 text-sky-500 shrink-0" />}
                      <span className="truncate flex-1">{f.name}</span>
                      <span className="text-slate-400">{tailleLisible(f.size)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <button onClick={envoyer} disabled={envoi || pieces.length === 0} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0C447C] hover:bg-[#093663] text-white text-xs font-bold disabled:opacity-40 cursor-pointer">
                {envoi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Envoyer {pieces.length > 1 ? `les ${pieces.length} pièces` : "la pièce"}
              </button>
            </div>
          )}
          {erreur && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">{erreur}</div>}
        </div>

        {modifiable && (
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100">
            <button onClick={onAnnuler} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"><Ban className="w-4 h-4" /> Annuler la dépense</button>
            <button onClick={onModifier} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"><Pencil className="w-4 h-4" /> Modifier</button>
          </div>
        )}
      </aside>
    </div>
  );
}

export default function Depenses({ etablissement = null, permissions = [] }) {
  const peutGerer = permissions.includes("frais.paiement.enregistrer");
  const [params, setParams] = useSearchParams();
  const [depenses, setDepenses] = useState([]);
  const [categories, setCategories] = useState({});
  const [synthese, setSynthese] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");
  const [recherche, setRecherche] = useState("");
  const [etat, setEtat] = useState(params.get("etat") || "toutes");
  const [categorie, setCategorie] = useState("toutes");
  const [debut, setDebut] = useState("");
  const [fin, setFin] = useState("");
  const [rechargement, setRechargement] = useState(0);
  const [saisie, setSaisie] = useState(null); // { depense } : null = fermee, depense null = nouvelle
  const [aAnnuler, setAAnnuler] = useState(null);
  const [motif, setMotif] = useState("");
  const [annulation, setAnnulation] = useState({ envoi: false, erreur: "" });

  const actualisation = useActualisation();
  const idOuvert = Number(params.get("depense")) || null;
  const ouverte = depenses.find((d) => d.id === idOuvert) || null;
  const ouvrir = (id) => setParams((p) => { const n = new URLSearchParams(p); if (id) n.set("depense", id); else n.delete("depense"); return n; }, { replace: true });

  useEffect(() => {
    let annule = false;
    Promise.allSettled([api.get("/caisse/depenses"), api.get("/caisse/synthese")]).then(([liste, synth]) => {
      if (annule) return;
      if (liste.status === "fulfilled") {
        setDepenses(liste.value.data.depenses);
        setCategories(liste.value.data.categories);
        setErreur("");
      } else {
        setErreur("Impossible de charger les dépenses.");
      }
      setSynthese(synth.status === "fulfilled" ? synth.value.data : null);
      setChargement(false);
    });
    return () => { annule = true; };
  }, [rechargement, actualisation]);

  const termes = normaliser(recherche).split(/\s+/).filter(Boolean);
  const affichees = useMemo(
    () =>
      depenses.filter((d) => {
        if (etat === "a_justifier" && !d.a_justifier) return false;
        if (etat === "justifiees" && (d.annule || d.a_justifier)) return false;
        if (etat === "annulees" && !d.annule) return false;
        if (categorie !== "toutes" && d.categorie !== categorie) return false;
        if (debut && d.date < debut) return false;
        if (fin && d.date > fin) return false;
        const cible = normaliser(`${d.libelle} ${d.beneficiaire || ""} ${d.reference || ""} ${d.numero_piece || ""} ${categories[d.categorie] || ""}`);
        return termes.every((t) => cible.includes(t));
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [depenses, etat, categorie, debut, fin, recherche, categories]
  );

  const valides = affichees.filter((d) => !d.annule);
  const somme = (l) => l.reduce((t, d) => t + d.montant, 0);
  const aJustifier = valides.filter((d) => d.a_justifier);
  const justifiees = valides.filter((d) => !d.a_justifier);
  const nbAJustifierTotal = depenses.filter((d) => d.a_justifier).length;

  const apresMaj = (texte, depenseMaj) => {
    setMessage(texte);
    if (depenseMaj) setDepenses((liste) => liste.map((d) => (d.id === depenseMaj.id ? depenseMaj : d)));
    setRechargement((n) => n + 1);
  };

  const annuler = async () => {
    setAnnulation({ envoi: true, erreur: "" });
    try {
      const res = await api.post(`/caisse/depenses/${aAnnuler.id}/annuler`, { motif: motif.trim() });
      setAAnnuler(null);
      setMotif("");
      setAnnulation({ envoi: false, erreur: "" });
      apresMaj(res.data.message);
    } catch (err) {
      setAnnulation({ envoi: false, erreur: messageErreurApi(err, "Annulation impossible.") });
    }
  };

  const libellesFiltres = [
    debut || fin ? `Période : ${debut ? formaterDate(debut) : "début"} → ${fin ? formaterDate(fin) : "aujourd'hui"}` : null,
    categorie !== "toutes" && `Catégorie : ${categories[categorie]}`,
    etat !== "toutes" && `État : ${ETATS.find(([c]) => c === etat)?.[1]}`,
    recherche.trim() && `Recherche : « ${recherche.trim()} »`,
  ].filter(Boolean);

  const imprimer = () => {
    const html = genererEtatDepensesHtml({ etablissement: etablissement?.nom, filtres: libellesFiltres, depenses: affichees, categories });
    if (!imprimerDocument("État des dépenses", html)) {
      setErreur("Le navigateur a bloqué la fenêtre d'impression. Autorisez les pop-ups pour ce site.");
    }
  };

  const exporter = () =>
    telechargerCsv(
      `depenses-${aujourdhui()}.csv`,
      ["Date", "Référence", "N° pièce", "Catégorie", "Objet", "Bénéficiaire", "Montant (GNF)", "Moyen", "Justificatif", "Enregistré par", "Statut"],
      affichees.map((d) => [
        formaterDateCourte(d.date),
        d.reference || "",
        d.numero_piece || "",
        categories[d.categorie] || d.categorie,
        d.libelle,
        d.beneficiaire || "",
        Math.round(d.montant),
        MOYENS[d.moyen_paiement]?.libelle || d.moyen_paiement,
        d.annule ? "" : d.a_justifier ? "À justifier" : `${d.nb_justificatifs} pièce(s)`,
        d.par || "",
        d.annule ? `Annulée : ${d.motif_annulation || ""}` : "Valide",
      ])
    );

  const cartes = [
    { libelle: "Dépenses", valeur: formaterGNF(somme(valides)), detail: `${valides.length} dépense${valides.length > 1 ? "s" : ""}${libellesFiltres.length ? " (filtre)" : ""}`, icone: Receipt, couleur: "text-rose-600", fond: "bg-rose-50", bord: "border-rose-100" },
    { libelle: "Justifiées", valeur: formaterGNF(somme(justifiees)), detail: `${justifiees.length} avec pièce`, icone: CheckCircle2, couleur: "text-emerald-600", fond: "bg-emerald-50", bord: "border-emerald-100" },
    { libelle: "À justifier", valeur: formaterGNF(somme(aJustifier)), detail: `${aJustifier.length} sans pièce`, icone: AlertTriangle, couleur: "text-amber-700", fond: "bg-amber-50", bord: "border-amber-200", action: () => setEtat("a_justifier") },
    { libelle: "Solde de caisse", valeur: synthese ? formaterGNF(synthese.solde) : "…", detail: "Encaissé − salaires − dépenses", icone: Wallet, couleur: "text-[#0C447C]", fond: "bg-blue-50", bord: "border-blue-100" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs" style={{ background: "#0C447C" }}>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Dépenses & justificatifs</h1>
          <p className="text-xs text-white/80 mt-0.5">Chaque sortie d'argent avec sa facture ou son reçu · Les salaires sont gérés dans Gestion des salaires</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button onClick={exporter} disabled={affichees.length === 0} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 cursor-pointer disabled:opacity-50">
            Exporter Excel
          </button>
          <button onClick={imprimer} disabled={affichees.length === 0} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 cursor-pointer disabled:opacity-50">
            <Printer className="w-3.5 h-3.5" /> Imprimer l'état
          </button>
          {peutGerer && (
            <button onClick={() => setSaisie({ depense: null })} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-[#0C447C] hover:bg-slate-100 text-xs font-bold cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> Nouvelle dépense
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
          {message}
          <button onClick={() => setMessage("")} className="text-emerald-500 cursor-pointer" aria-label="Fermer"><X className="w-4 h-4" /></button>
        </div>
      )}
      {erreur && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5">{erreur}</p>}

      {nbAJustifierTotal > 0 && etat !== "a_justifier" && (
        <button onClick={() => setEtat("a_justifier")} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-left text-sm text-amber-800 hover:bg-amber-100 cursor-pointer">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span><strong>{nbAJustifierTotal} dépense{nbAJustifierTotal > 1 ? "s" : ""}</strong> sans pièce justificative. Joignez la facture ou le reçu pour chacune.</span>
        </button>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {cartes.map((c) => {
          const Icone = c.icone;
          const Conteneur = c.action ? "button" : "div";
          return (
            <Conteneur key={c.libelle} onClick={c.action} className={`bg-white p-4 border text-left ${c.bord} ${c.action ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`} style={STYLE_CARTE}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${c.couleur}`}>{c.libelle}</span>
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.fond} ${c.couleur}`}><Icone className="w-4 h-4" /></span>
              </div>
              <p className="text-lg sm:text-xl font-extrabold text-slate-900 tabular-nums">{chargement ? "…" : c.valeur}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{c.detail}</p>
            </Conteneur>
          );
        })}
      </div>

      <div className="bg-white p-4 flex flex-wrap items-end gap-3 border border-slate-100" style={STYLE_CARTE}>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Objet, bénéficiaire, n° de pièce…" className="w-64 bg-slate-50 border border-slate-200 text-xs rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:border-[#0C447C]" />
        </div>
        <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-semibold">
          {ETATS.map(([cle, lib]) => (
            <button key={cle} onClick={() => setEtat(cle)} className={`px-3 py-1.5 rounded-lg cursor-pointer ${etat === cle ? "bg-white text-[#0C447C] shadow-sm" : "text-slate-600"}`}>{lib}</button>
          ))}
        </div>
        <select value={categorie} onChange={(e) => setCategorie(e.target.value)} className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-2.5 py-2 text-slate-700 focus:outline-none">
          <option value="toutes">Toutes catégories</option>
          {Object.entries(categories).map(([cle, lib]) => <option key={cle} value={cle}>{lib}</option>)}
        </select>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          Du <input type="date" value={debut} onChange={(e) => setDebut(e.target.value)} aria-label="Du" className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-2 py-1.5" />
          au <input type="date" value={fin} onChange={(e) => setFin(e.target.value)} aria-label="Au" className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-2 py-1.5" />
        </div>
        {libellesFiltres.length > 0 && (
          <button onClick={() => { setRecherche(""); setEtat("toutes"); setCategorie("toutes"); setDebut(""); setFin(""); }} className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer">Effacer les filtres</button>
        )}
      </div>

      <div className="bg-white overflow-hidden border border-slate-100" style={STYLE_CARTE}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-3">Catégorie</th>
                <th className="py-3 px-3">Objet</th>
                <th className="py-3 px-3">Pièce</th>
                <th className="py-3 px-3">Justificatif</th>
                <th className="py-3 px-3">Moyen</th>
                <th className="py-3 px-4 text-right">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {chargement ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400">Chargement…</td></tr>
              ) : affichees.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400">{depenses.length === 0 ? "Aucune dépense enregistrée." : "Aucune dépense ne correspond."}</td></tr>
              ) : (
                affichees.map((d) => {
                  const moyen = MOYENS[d.moyen_paiement];
                  return (
                    <tr key={d.id} onClick={() => ouvrir(d.id)} className={`cursor-pointer ${d.annule ? "bg-slate-50/60 text-slate-400" : d.a_justifier ? "hover:bg-amber-50/50" : "hover:bg-slate-50/70"}`}>
                      <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap">{formaterDateCourte(d.date)}</td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${COULEURS_CATEGORIES[d.categorie] || COULEURS_CATEGORIES.autre}`}>{categories[d.categorie] || d.categorie}</span>
                      </td>
                      <td className="py-3 px-3">
                        <p className={`font-semibold ${d.annule ? "line-through" : "text-slate-800"}`}>{d.libelle}</p>
                        <p className="text-[10px] text-slate-400">{[d.beneficiaire, d.reference].filter(Boolean).join(" · ")}</p>
                      </td>
                      <td className="py-3 px-3 text-slate-600 tabular-nums">{d.numero_piece || "—"}</td>
                      <td className="py-3 px-3"><BadgeJustification depense={d} /></td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${moyen?.classe || "bg-slate-100"}`}>{moyen?.emoji} {moyen?.libelle}</span>
                      </td>
                      <td className={`py-3 px-4 text-right font-extrabold tabular-nums whitespace-nowrap ${d.annule ? "line-through" : "text-rose-600"}`}>−{formaterGNF(d.montant)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-100 text-xs">
          <span className="text-slate-500">{affichees.length} dépense{affichees.length > 1 ? "s" : ""} · cliquez sur une ligne pour voir ou joindre les pièces</span>
          <span className="font-extrabold text-rose-600 tabular-nums">Total : −{formaterGNF(somme(valides))}</span>
        </div>
      </div>

      {ouverte && (
        <PanneauDepense
          key={ouverte.id}
          depense={ouverte}
          categories={categories}
          peutGerer={peutGerer}
          onFermer={() => ouvrir(null)}
          onMaj={apresMaj}
          onModifier={() => setSaisie({ depense: ouverte })}
          onAnnuler={() => { setAAnnuler(ouverte); setMotif(""); setAnnulation({ envoi: false, erreur: "" }); }}
        />
      )}

      {saisie && (
        <ModaleDepense
          categories={categories}
          soldeParMoyen={synthese?.par_moyen}
          depense={saisie.depense}
          onFermer={() => setSaisie(null)}
          onEnregistree={(texte, depense) => {
            setSaisie(null);
            apresMaj(texte, depense);
            if (depense?.a_justifier && !saisie.depense) ouvrir(depense.id);
          }}
        />
      )}

      {aAnnuler && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-4" onClick={() => !annulation.envoi && setAAnnuler(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <span className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0"><AlertTriangle className="w-5 h-5" /></span>
              <div>
                <h3 className="text-base font-bold text-slate-900">Annuler cette dépense ?</h3>
                <p className="text-xs text-slate-500 mt-0.5">{aAnnuler.libelle} · {formaterGNF(aAnnuler.montant)} · {aAnnuler.reference}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600">Elle reste visible, barrée, avec votre nom et le motif ; ses pièces sont conservées et l'argent revient dans le solde de caisse.</p>
            <input autoFocus value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Motif : montant erroné, saisie en double…" className={CHAMP} />
            {annulation.erreur && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">{annulation.erreur}</div>}
            <div className="flex justify-end gap-3">
              <button onClick={() => setAAnnuler(null)} disabled={annulation.envoi} className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">Retour</button>
              <button onClick={annuler} disabled={annulation.envoi || motif.trim().length < 3} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50 cursor-pointer">
                {annulation.envoi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                Annuler la dépense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
