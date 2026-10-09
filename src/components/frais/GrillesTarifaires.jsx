import { useState } from "react";
import api from "../../services/api";
import { Plus, RefreshCw, Layers, SlidersHorizontal, Trash2, Tag, Pencil, Settings2 } from "lucide-react";
import { STYLE_CARTE, configTypeFrais, formaterGNF, formaterDateCourte, normaliser } from "./configFrais";
import ModaleGrille from "./ModaleGrille";
import ModaleTypesFrais from "./ModaleTypesFrais";

// Onglet "Grilles tarifaires" (design "Frais de scolarite & facturation") : creation a gauche,
// grilles existantes regroupees par classe a droite. Donnees reelles de /frais/grilles.
// Chaque grille se modifie (montant, echeances) ou se supprime ; les types de frais se renomment
// ou se suppriment (le serveur refuse ce qui a deja servi).

const PUBLICS = [
  { id: "tous", libelle: "Tous", desc: "Tout l'effectif" },
  { id: "nouveau", libelle: "Nouveaux", desc: "1re inscription" },
  { id: "ancien", libelle: "Anciens", desc: "Réinscrits" },
];
const LIBELLES_PUBLIC = { tous: "Tous les élèves", nouveau: "Nouveaux élèves", ancien: "Anciens élèves" };

const CHAMP = "w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0C447C]/20 focus:border-[#0C447C]";

function estParEleve(nomType) {
  return ["inscription", "reinscription"].includes(normaliser(nomType));
}

const ECHEANCES_DEFAUT = [
  { libelle: "Trimestre 1", pourcentage: 40, date_limite: "" },
  { libelle: "Trimestre 2", pourcentage: 35, date_limite: "" },
  { libelle: "Trimestre 3", pourcentage: 25, date_limite: "" },
];

// Montant de chaque echeance d'apres son pourcentage ; la derniere prend l'arrondi pour que la
// somme soit exactement le montant annuel.
function repartir(montant, echeances) {
  let cumul = 0;
  return echeances.map((e, i) => {
    const m = i === echeances.length - 1 ? montant - cumul : Math.round((montant * (Number(e.pourcentage) || 0)) / 100);
    cumul += m;
    return m;
  });
}

export default function GrillesTarifaires({ classes, typesFrais, grilles, peutCreer, onGrillesModifiees, onTypesModifies, onMessage }) {
  const [typeId, setTypeId] = useState("");
  const [classeId, setClasseId] = useState("");
  const [montant, setMontant] = useState("");
  const [publicVise, setPublicVise] = useState("tous");
  const [actif, setActif] = useState(true);
  const [echeances, setEcheances] = useState(ECHEANCES_DEFAUT);
  const [nouveauType, setNouveauType] = useState("");
  const [ajoutType, setAjoutType] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [filtreClasse, setFiltreClasse] = useState("tous");
  const [filtreType, setFiltreType] = useState("tous");
  const [actionEnCours, setActionEnCours] = useState(null);
  const [grilleEnEdition, setGrilleEnEdition] = useState(null);
  const [typesOuverts, setTypesOuverts] = useState(false);

  const type = typesFrais.find((t) => String(t.id) === String(typeId));
  const parEleve = type && estParEleve(type.nom);
  const montantNum = Number(montant) || 0;
  const lignes = parEleve ? [{ libelle: type.nom, pourcentage: 100, date_limite: echeances[0]?.date_limite || "" }] : echeances;
  // Arrondi : 33.4 + 33.3 + 33.3 vaut 99.99999999999999 en virgule flottante.
  const totalPct = Math.round(lignes.reduce((s, e) => s + (Number(e.pourcentage) || 0), 0) * 100) / 100;
  const montants = repartir(montantNum, lignes);
  const classeChoisie = classes.find((c) => String(c.id) === String(classeId));
  // Ce qui empeche la creation, affiche sous le bouton tant qu'il est grise.
  const manquants = [
    !type && "le type de frais",
    !classeId && "la classe",
    montantNum <= 0 && "le montant annuel",
    totalPct !== 100 && "des pourcentages totalisant 100 %",
    lignes.some((e) => !e.libelle) && "le libellé de chaque échéance",
    lignes.some((e) => !e.date_limite) && "la date limite de chaque échéance",
  ].filter(Boolean);
  const valide = manquants.length === 0;

  const choisirType = (t) => {
    setTypeId(String(t.id));
    if (estParEleve(t.nom)) setPublicVise("tous");
  };

  const modifierEcheance = (i, champ, valeur) =>
    setEcheances(parEleve ? [{ ...lignes[0], [champ]: valeur }] : echeances.map((e, j) => (j === i ? { ...e, [champ]: valeur } : e)));

  const ajouterType = async (e) => {
    e.preventDefault();
    if (!nouveauType.trim()) return;
    try {
      const res = await api.post("/frais/types", { nom: nouveauType.trim() });
      await onTypesModifies();
      if (res.data?.id) setTypeId(String(res.data.id));
      setNouveauType("");
      setAjoutType(false);
      onMessage("succes", "Type de frais ajouté.");
    } catch (err) {
      onMessage("erreur", err.response?.data?.message || "Erreur lors de l'ajout du type de frais.");
    }
  };

  const creer = async (e) => {
    e.preventDefault();
    if (!valide) return;
    setEnvoi(true);
    try {
      await api.post("/frais/grilles", {
        classe_id: classeId,
        type_frais_id: typeId,
        montant: montantNum,
        applicable_a: publicVise,
        actif,
        echeances: lignes.map((l, i) => ({ libelle: l.libelle, montant: montants[i], date_limite: l.date_limite })),
      });
      onMessage(
        "succes",
        actif && !parEleve
          ? `Grille ${type.nom} créée pour ${classeChoisie?.nom} et appliquée aux élèves concernés.`
          : `Grille ${type.nom} créée pour ${classeChoisie?.nom}.`
      );
      setMontant("");
      setEcheances(ECHEANCES_DEFAUT);
      await onGrillesModifiees();
    } catch (err) {
      onMessage("erreur", err.response?.data?.message || "Erreur lors de la création de la grille.");
    } finally {
      setEnvoi(false);
    }
  };

  const action = async (grille, quoi) => {
    setActionEnCours(`${quoi}-${grille.id}`);
    try {
      const res = await api.post(`/frais/grilles/${grille.id}/${quoi}`);
      onMessage("succes", res.data.message);
      await onGrillesModifiees();
    } catch (err) {
      onMessage("erreur", err.response?.data?.message || "L'opération a échoué.");
    } finally {
      setActionEnCours(null);
    }
  };

  const supprimerGrille = async (grille) => {
    if (!window.confirm(`Supprimer la grille « ${grille.type_frais?.nom} » de ${grille.classe?.nom} ?\n\nLes frais qu'elle a créés pour les élèves seront retirés. Refusé si un élève a déjà payé dessus.`)) return;
    setActionEnCours(`supprimer-${grille.id}`);
    try {
      const res = await api.delete(`/frais/grilles/${grille.id}`);
      onMessage("succes", res.data.message);
      await onGrillesModifiees();
    } catch (err) {
      onMessage("erreur", err.response?.data?.message || "Suppression impossible.");
    } finally {
      setActionEnCours(null);
    }
  };

  // Grilles filtrees, regroupees par classe dans l'ordre pedagogique de /classes.
  const filtrees = grilles.filter(
    (g) => (filtreClasse === "tous" || String(g.classe_id) === filtreClasse) && (filtreType === "tous" || String(g.type_frais_id) === filtreType)
  );
  const groupes = classes
    .map((c) => ({ classe: c, grilles: filtrees.filter((g) => g.classe_id === c.id) }))
    .filter((g) => g.grilles.length > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Creation */}
      {peutCreer && (
        <div className="lg:col-span-5 bg-white p-5 border border-slate-100/90" style={STYLE_CARTE}>
          <div className="flex items-center gap-3 pb-3 mb-4 border-b border-slate-100">
            <span className="w-9 h-9 rounded-xl bg-blue-50 text-[#0C447C] flex items-center justify-center"><Layers className="w-5 h-5" /></span>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Nouvelle grille tarifaire</h3>
              <p className="text-xs text-slate-400">Définissez le tarif d'une classe et ses échéances</p>
            </div>
          </div>

          <form onSubmit={creer} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Type de frais</label>
              <div className="flex flex-wrap gap-1.5">
                {typesFrais.map((t) => {
                  const cfg = configTypeFrais(t.nom);
                  const choisi = String(t.id) === String(typeId);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => choisirType(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        choisi ? `${cfg.classe} ring-2 ring-current font-bold` : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                      }`}
                    >
                      {t.nom}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setAjoutType(!ajoutType)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 cursor-pointer inline-flex items-center gap-1"
                >
                  <Tag className="w-3 h-3" /> Nouveau type
                </button>
                <button
                  type="button"
                  onClick={() => setTypesOuverts(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer inline-flex items-center gap-1"
                  title="Renommer ou supprimer des types de frais"
                >
                  <Settings2 className="w-3 h-3" /> Gérer
                </button>
              </div>
              {ajoutType && (
                <div className="flex gap-2 mt-2">
                  <input value={nouveauType} onChange={(e) => setNouveauType(e.target.value)} placeholder="ex : Cantine, Transport..." className={CHAMP} />
                  <button type="button" onClick={ajouterType} className="px-3 py-2 bg-[#0C447C] text-white text-xs font-bold rounded-xl cursor-pointer whitespace-nowrap">
                    Ajouter
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Classe</label>
                <select value={classeId} onChange={(e) => setClasseId(e.target.value)} className={CHAMP} required>
                  <option value="">Choisir...</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Niveau / effectif</label>
                <div className="bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2 truncate">
                  {classeChoisie ? `${classeChoisie.filiere || classeChoisie.niveau} · ${classeChoisie.nombre_eleves ?? 0} élèves` : "—"}
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Montant annuel (GNF)</label>
                <span className="text-xs font-bold text-[#0C447C] tabular-nums">{formaterGNF(montantNum)}</span>
              </div>
              <input
                type="number"
                min="1"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                placeholder="ex : 3000000"
                className={`${CHAMP} tabular-nums text-sm`}
                required
              />
            </div>

            {!parEleve && (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Applicable à</label>
                <div className="grid grid-cols-3 gap-2">
                  {PUBLICS.map((p) => {
                    const choisi = publicVise === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPublicVise(p.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          choisi ? "border-[#0C447C] bg-blue-50/60 ring-1 ring-[#0C447C]" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={`text-xs font-bold ${choisi ? "text-[#0C447C]" : "text-slate-800"}`}>{p.libelle}</span>
                          <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${choisi ? "border-[#0C447C] bg-[#0C447C]" : "border-slate-300"}`}>
                            {choisi && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">{p.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Statut du tarif</span>
                <span className="text-[11px] text-slate-400">{actif ? "Appliqué aux élèves dès la création" : "Créé désactivé (non appliqué)"}</span>
              </div>
              <button
                type="button"
                onClick={() => setActif(!actif)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${actif ? "bg-[#0C447C]" : "bg-slate-300"}`}
                aria-label="Activer ou désactiver le tarif"
              >
                <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition ${actif ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>

            <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">{parEleve ? "Échéance unique" : "Ventilation des échéances"}</span>
                <span className={`text-[11px] tabular-nums font-bold px-2 py-0.5 rounded ${totalPct === 100 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                  Total : {totalPct}% {totalPct === 100 ? "✓" : "(doit faire 100 %)"}
                </span>
              </div>
              {lignes.map((e, i) => (
                <div key={i} className="grid grid-cols-12 gap-1.5 items-center text-xs">
                  <input
                    value={e.libelle}
                    onChange={(ev) => modifierEcheance(i, "libelle", ev.target.value)}
                    disabled={parEleve}
                    placeholder="Libellé"
                    className="col-span-4 bg-white border border-slate-300 rounded-lg px-2 py-1 font-semibold disabled:bg-slate-100"
                  />
                  <div className="col-span-2 flex items-center gap-0.5">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={e.pourcentage}
                      disabled={parEleve}
                      onChange={(ev) => modifierEcheance(i, "pourcentage", ev.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-1 py-1 text-center font-bold disabled:bg-slate-100 tabular-nums"
                    />
                    <span className="text-slate-400">%</span>
                  </div>
                  <input
                    type="date"
                    value={e.date_limite}
                    onChange={(ev) => modifierEcheance(i, "date_limite", ev.target.value)}
                    className="col-span-3 bg-white border border-slate-300 rounded-lg px-1 py-1 text-[11px]"
                    required
                  />
                  <span className="col-span-2 text-right font-semibold text-slate-800 text-[11px] tabular-nums">{montants[i].toLocaleString("fr-FR")}</span>
                  {!parEleve && echeances.length > 1 ? (
                    <button type="button" onClick={() => setEcheances(echeances.filter((_, j) => j !== i))} className="col-span-1 text-slate-400 hover:text-rose-600 cursor-pointer justify-self-end" title="Retirer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="col-span-1" />
                  )}
                </div>
              ))}
              {!parEleve && (
                <button
                  type="button"
                  onClick={() => setEcheances([...echeances, { libelle: `Tranche ${echeances.length + 1}`, pourcentage: 0, date_limite: "" }])}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-slate-300 bg-white text-xs text-slate-500 hover:bg-slate-50 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Ajouter une échéance
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={!valide || envoi}
              className="w-full py-2.5 px-4 bg-[#0C447C] hover:bg-[#093663] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {envoi ? "Création..." : "Créer la grille tarifaire"}
            </button>
            {!valide && <p className="text-[11px] text-slate-500 text-center">À compléter : {manquants.join(", ")}.</p>}
          </form>
        </div>
      )}

      {/* Grilles existantes */}
      <div className={`${peutCreer ? "lg:col-span-7" : "lg:col-span-12"} space-y-4`}>
        <div className="bg-white p-4 border border-slate-100/90 flex flex-wrap items-center justify-between gap-3" style={STYLE_CARTE}>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#0C447C]" />
            <span className="text-xs font-bold text-slate-800">Grilles existantes ({grilles.length})</span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <select value={filtreClasse} onChange={(e) => setFiltreClasse(e.target.value)} className="bg-slate-50 border border-slate-200 text-xs font-medium rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none">
              <option value="tous">Toutes les classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
            <select value={filtreType} onChange={(e) => setFiltreType(e.target.value)} className="bg-slate-50 border border-slate-200 text-xs font-medium rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none">
              <option value="tous">Tous les types</option>
              {typesFrais.map((t) => (
                <option key={t.id} value={t.id}>{t.nom}</option>
              ))}
            </select>
          </div>
        </div>

        {groupes.length === 0 ? (
          <div className="bg-white p-12 text-center border border-slate-100/90" style={STYLE_CARTE}>
            <p className="text-sm font-bold text-slate-700">{grilles.length === 0 ? "Aucune grille tarifaire n'a encore été créée" : "Aucune grille correspondante"}</p>
            {peutCreer && <p className="text-xs text-slate-400 mt-1">Créez une grille avec le formulaire.</p>}
          </div>
        ) : (
          groupes.map(({ classe, grilles: gs }) => (
            <div key={classe.id} className="bg-white p-5 border border-slate-100/90 space-y-4" style={STYLE_CARTE}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="px-3 py-1 bg-[#0C447C] text-white text-xs font-extrabold rounded-lg tracking-wide">{classe.nom}</span>
                  <span className="text-xs font-semibold text-slate-500">{classe.nombre_eleves ?? 0} élèves</span>
                </div>
                <span className="text-[11px] font-medium text-slate-400">{gs.length} tarif{gs.length > 1 ? "s" : ""} configuré{gs.length > 1 ? "s" : ""}</span>
              </div>

              <div className="divide-y divide-slate-100">
                {gs.map((g) => {
                  const cfg = configTypeFrais(g.type_frais?.nom);
                  const parEleveG = estParEleve(g.type_frais?.nom);
                  const couverture = g.nombre_eleves_classe > 0 ? Math.round((g.nombre_eleves_couverts / g.nombre_eleves_classe) * 100) : 0;
                  const total = Number(g.montant) || 0;
                  return (
                    <div key={g.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${cfg.classe}`}>{g.type_frais?.nom || "—"}</span>
                          <span className="text-lg font-extrabold text-slate-900 tracking-tight tabular-nums">{formaterGNF(total)}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{LIBELLES_PUBLIC[g.applicable_a] || "Tous les élèves"}</span>
                          <button
                            type="button"
                            disabled={!peutCreer || actionEnCours === `basculer-${g.id}`}
                            onClick={() => action(g, "basculer")}
                            title={peutCreer ? (g.actif ? "Désactiver ce tarif" : "Activer ce tarif") : undefined}
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded ${peutCreer ? "cursor-pointer" : "cursor-default"} ${
                              g.actif ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${g.actif ? "bg-emerald-600" : "bg-slate-400"}`} />
                            {g.actif ? "Actif" : "Inactif"}
                          </button>
                          {peutCreer && (
                            <button
                              type="button"
                              disabled={parEleveG || !g.actif || actionEnCours === `synchroniser-${g.id}`}
                              onClick={() => action(g, "synchroniser")}
                              title={parEleveG ? "Les frais d'inscription se gèrent élève par élève" : !g.actif ? "Activez la grille pour la synchroniser" : "Appliquer aux élèves qui ne l'ont pas encore"}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                                parEleveG || !g.actif ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-blue-50 text-[#0C447C] hover:bg-blue-100 cursor-pointer"
                              }`}
                            >
                              <RefreshCw className={`w-3 h-3 ${actionEnCours === `synchroniser-${g.id}` ? "animate-spin" : ""}`} />
                              Synchroniser
                            </button>
                          )}
                          {peutCreer && (
                            <>
                              <button
                                type="button"
                                onClick={() => setGrilleEnEdition(g)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-[#0C447C] hover:bg-blue-50 cursor-pointer"
                                title="Modifier le montant et les échéances"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={actionEnCours === `supprimer-${g.id}`}
                                onClick={() => supprimerGrille(g)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer disabled:opacity-40"
                                title="Supprimer cette grille"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {!parEleveG && (
                        <div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                            <span>Couverture de la grille</span>
                            <span className="font-bold text-slate-700 tabular-nums">
                              {g.nombre_eleves_couverts} élève{g.nombre_eleves_couverts > 1 ? "s" : ""} couvert{g.nombre_eleves_couverts > 1 ? "s" : ""} / {g.nombre_eleves_classe}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${couverture >= 100 ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${Math.min(100, couverture)}%` }} />
                          </div>
                        </div>
                      )}

                      {g.echeances?.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                          {g.echeances.map((e) => (
                            <span key={e.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs tabular-nums" title={`Date limite : ${formaterDateCourte(e.date_limite)}`}>
                              <span className="font-bold text-slate-600">
                                {e.libelle}
                                {total > 0 && ` (${Math.round((Number(e.montant) / total) * 100)}%)`} :
                              </span>
                              <span className="font-extrabold text-slate-900 tabular-nums">{formaterGNF(e.montant)}</span>
                              <span className="text-[10px] text-slate-400">· {formaterDateCourte(e.date_limite)}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {grilleEnEdition && (
        <ModaleGrille
          grille={grilleEnEdition}
          onFermer={() => setGrilleEnEdition(null)}
          onEnregistree={async (message) => {
            setGrilleEnEdition(null);
            onMessage("succes", message);
            await onGrillesModifiees();
          }}
        />
      )}
      {typesOuverts && (
        <ModaleTypesFrais typesFrais={typesFrais} onFermer={() => setTypesOuverts(false)} onModifies={onTypesModifies} onMessage={onMessage} />
      )}
    </div>
  );
}
