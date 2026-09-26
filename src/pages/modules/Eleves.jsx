import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import {
  Search,
  Filter,
  Upload,
  UserPlus,
  ChevronRight,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  Printer,
  GraduationCap,
} from "lucide-react";
import { imprimerDocument, genererListeElevesHtml, ouvrirFenetreVierge } from "../../utils/impression";
import { ecrireReleveEleve } from "../../utils/releveEleve";
import { BadgeStatutPaiement, BadgeInscription } from "../../components/eleves/BadgesEleve";
import { couleurAvatar, initiales } from "../../components/eleves/avatar";

// Gestion des eleves (design Lakoli 2) : banniere, 5 compteurs, filtres, repertoire.

const STYLE_CARTE = { borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" };
const STYLE_CHAMP = { backgroundColor: "#f8fafc", borderColor: "rgba(12, 68, 124, 0.22)", borderRadius: "12px" };

// Filtre de statut de paiement : un statut precis, ou "non_a_jour" qui regroupe tous les eleves
// qui ne sont pas a jour (partiel, en retard, a echoir, et aussi ceux sans aucun frais).
const LIBELLES_FILTRE_STATUT = {
  a_jour: "À jour",
  non_a_jour: "Pas encore à jour",
  partiel: "Partiel",
  a_echoir: "À échoir",
  en_retard: "En retard",
};

function correspondStatut(statutEleve, filtre) {
  if (filtre === "all") return true;
  if (filtre === "non_a_jour") return statutEleve !== "a_jour";
  return statutEleve === filtre;
}

// Minuscules et sans accents, pour que "aminata" trouve "Aminata" et "hélène" trouve "Helene".
function normaliser(texte) {
  return (texte || "").normalize("NFD").replace(/\p{Mn}/gu, "").toLowerCase();
}

// Memorise la classe choisie pour la retrouver au retour depuis EleveFiche
// (le composant est demonte a la navigation, donc le state seul est perdu).
const CLE_CLASSE_FILTRE = "eleves_classe_filtre";

function lireClasseFiltre() {
  try {
    return sessionStorage.getItem(CLE_CLASSE_FILTRE) || "all";
  } catch {
    return "all";
  }
}

function Compteur({ libelle, valeur, detail, icone: Icone, couleur, fond, detailCouleur }) {
  return (
    <div className="bg-white p-4 border border-slate-100/80 flex flex-col justify-between" style={{ borderRadius: "14px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold text-slate-500">{libelle}</span>
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${fond}`}>
          <Icone className={`w-4 h-4 ${couleur}`} />
        </span>
      </div>
      <div>
        <div className={`text-2xl font-black tracking-tight tabular-nums ${couleur}`}>{valeur}</div>
        <span className={`text-[10px] font-medium ${detailCouleur}`}>{detail}</span>
      </div>
    </div>
  );
}

export default function Eleves({ permissions = [] }) {
  const peutCreer = permissions.includes("eleves.creer");
  const peutImporter = permissions.includes("eleves.importer");
  const peutImprimerReleve = permissions.includes("frais.voir");
  const [searchParams] = useSearchParams();
  const [eleves, setEleves] = useState([]);
  const [stats, setStats] = useState({ total: 0, a_jour: 0, en_retard: 0, partiel: 0, a_echoir: 0 });
  const [ordreClasses, setOrdreClasses] = useState([]);
  const [recherche, setRecherche] = useState(searchParams.get("recherche") || "");
  const [classeFiltre, setClasseFiltre] = useState(lireClasseFiltre);
  const [statutFiltre, setStatutFiltre] = useState(searchParams.get("statut") || "all");
  const [afficherSuggestions, setAfficherSuggestions] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [etablissement, setEtablissement] = useState("");
  const [impressionEnCours, setImpressionEnCours] = useState(null);
  const navigate = useNavigate();

  const chargerEleves = async () => {
    setChargement(true);
    setErreur("");
    try {
      // Liste complete : la recherche, la classe et le statut filtrent ensuite cote client.
      const response = await api.get("/eleves");
      setEleves(response.data.eleves);
      setStats(response.data.stats);
      setEtablissement(response.data.etablissement || "");
    } catch (err) {
      setErreur(err.response?.data?.message || "Impossible de charger les élèves.");
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerEleves();
    api.get("/classes").then((res) => setOrdreClasses(res.data.map((c) => c.nom))).catch(() => {});
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(CLE_CLASSE_FILTRE, classeFiltre);
    } catch {
      // stockage indisponible (navigation privee...) : le filtre reste simplement non memorise
    }
  }, [classeFiltre]);

  const choisirSuggestion = (eleve) => {
    setRecherche(`${eleve.nom} ${eleve.prenom}`);
    setAfficherSuggestions(false);
  };

  // Suit l'ordre pedagogique renvoye par /classes (Maternelle -> Primaire -> College -> Lycee)
  // plutot qu'un tri alphabetique, qui melangeait les niveaux (ex: "CE1" avant "CP").
  const classesDisponibles = useMemo(() => {
    const presentes = new Set(eleves.map((e) => e.classe).filter(Boolean));
    return ordreClasses.filter((nom) => presentes.has(nom));
  }, [eleves, ordreClasses]);

  const session = eleves.find((e) => e.inscription_active?.session_scolaire?.libelle)?.inscription_active.session_scolaire.libelle;

  // Chaque mot saisi doit se retrouver dans nom, prenom ou matricule (ordre libre).
  const termes = normaliser(recherche).split(/\s+/).filter(Boolean);
  const elevesFiltres = eleves.filter((e) => {
    const matchClasse = classeFiltre === "all" || e.classe === classeFiltre;
    const matchStatut = correspondStatut(e.statut_paiement, statutFiltre);
    const cible = normaliser(`${e.nom} ${e.prenom} ${e.matricule}`);
    const matchRecherche = termes.every((t) => cible.includes(t));
    return matchClasse && matchStatut && matchRecherche;
  });

  // Propose seulement des eleves qui donneront un resultat avec la classe et le statut choisis.
  const suggestions = termes.length > 0 ? elevesFiltres.slice(0, 6) : [];

  // Liste imprimable : la classe choisie, ou toutes les classes (une page chacune) si aucun filtre.
  // Les filtres de classe et de statut de paiement s'appliquent ; la recherche par nom, non.
  const imprimerListe = () => {
    const nomsClasses = classeFiltre === "all" ? classesDisponibles : [classeFiltre];
    const classes = nomsClasses
      .map((nom) => ({
        nom,
        eleves: eleves.filter((e) => e.classe === nom && correspondStatut(e.statut_paiement, statutFiltre)),
      }))
      .filter((c) => c.eleves.length > 0);
    if (classes.length === 0) {
      setErreur(
        statutFiltre === "all"
          ? "Aucun élève à imprimer pour cette classe."
          : `Aucun élève « ${LIBELLES_FILTRE_STATUT[statutFiltre]} » à imprimer pour cette sélection.`
      );
      return;
    }
    setErreur("");
    const filtreStatut = statutFiltre === "all" ? null : LIBELLES_FILTRE_STATUT[statutFiltre];
    const titre = ["Liste des élèves", classes.length === 1 ? classes[0].nom : "par classe", filtreStatut]
      .filter(Boolean)
      .join(" - ");
    if (!imprimerDocument(titre, genererListeElevesHtml({ etablissement, session, classes, filtreStatut }))) {
      setErreur("Le navigateur a bloqué la fenêtre d'impression. Autorisez les pop-ups pour ce site.");
    }
  };

  // Releve A4 d'un eleve : la fenetre est ouverte pendant le clic, puis remplie une fois la
  // fiche chargee (sinon le navigateur bloque la fenetre ouverte apres l'appel reseau).
  const imprimerReleve = async (eleve) => {
    const fenetre = ouvrirFenetreVierge();
    if (!fenetre) {
      setErreur("Le navigateur a bloqué la fenêtre d'impression. Autorisez les pop-ups pour ce site.");
      return;
    }
    fenetre.document.write("<p style=\"font-family:Arial;padding:24px\">Préparation du relevé...</p>");
    setImpressionEnCours(eleve.id);
    try {
      const res = await api.get(`/eleves/${eleve.id}`);
      ecrireReleveEleve(fenetre, res.data);
    } catch {
      fenetre.close();
      setErreur(`Impossible de préparer le relevé de ${eleve.nom} ${eleve.prenom}.`);
    } finally {
      setImpressionEnCours(null);
    }
  };

  const pct = (n) => (stats.total > 0 ? `${Math.round((n / stats.total) * 100)}% de l'effectif` : "—");

  return (
    <div className="space-y-6">
      {/* Banniere */}
      <div
        className="p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-6"
        style={{ background: "linear-gradient(135deg, #0C447C 0%, #1a6bb5 100%)", borderRadius: "16px", boxShadow: "0 4px 24px rgba(12,68,124,0.18)" }}
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-tight">Gestion des Élèves</h1>
            <p className="text-sm text-white/70 mt-1">
              Répertoire complet · Inscriptions · Suivi des paiements
              {etablissement && <span className="hidden sm:inline"> · {etablissement}</span>}
            </p>
          </div>
        </div>

        {(peutImporter || peutCreer) && (
          <div className="flex flex-wrap items-center gap-3">
            {peutImporter && (
              <button
                type="button"
                onClick={() => navigate("/eleves-importer")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white border border-white/60 hover:bg-white/10 hover:border-white transition-all cursor-pointer active:scale-95"
              >
                <Upload className="w-4 h-4" />
                Importer Excel
              </button>
            )}
            {peutCreer && (
              <button
                type="button"
                onClick={() => navigate("/eleves-ajouter")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-[#0C447C] bg-white hover:bg-slate-50 transition-all cursor-pointer shadow-md active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                Ajouter un élève
              </button>
            )}
          </div>
        )}
      </div>

      {/* 5 compteurs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <Compteur libelle="Total élèves" valeur={stats.total} detail={session ? `Effectif ${session}` : "Effectif global"} icone={Users} couleur="text-[#0C447C]" fond="bg-blue-50" detailCouleur="text-slate-500" />
        <Compteur libelle="À jour" valeur={stats.a_jour} detail={pct(stats.a_jour)} icone={CheckCircle2} couleur="text-[#10b981]" fond="bg-emerald-50" detailCouleur="text-emerald-700" />
        <Compteur libelle="Partiel" valeur={stats.partiel} detail="Solde en cours" icone={Clock} couleur="text-[#f59e0b]" fond="bg-amber-50" detailCouleur="text-amber-700" />
        <Compteur libelle="À échoir" valeur={stats.a_echoir} detail="Échéances à venir" icone={Calendar} couleur="text-slate-500" fond="bg-slate-100" detailCouleur="text-slate-500" />
        <Compteur libelle="En retard" valeur={stats.en_retard} detail="Relances à émettre" icone={AlertTriangle} couleur="text-[#ef4444]" fond="bg-rose-50" detailCouleur="text-rose-700" />
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 border border-slate-100/80 flex flex-col lg:flex-row lg:items-center gap-3.5" style={STYLE_CARTE}>
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={recherche}
            onChange={(e) => {
              setRecherche(e.target.value);
              setAfficherSuggestions(true);
            }}
            onFocus={() => setAfficherSuggestions(true)}
            // Delai pour laisser le clic sur une suggestion se faire avant de fermer la liste
            onBlur={() => setTimeout(() => setAfficherSuggestions(false), 200)}
            autoComplete="off"
            placeholder="Rechercher par nom, prénom, matricule..."
            style={STYLE_CHAMP}
            className="w-full pl-10 pr-4 py-2.5 border text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0C447C] transition-all"
          />
          {afficherSuggestions && suggestions.length > 0 && (
            <ul className="absolute left-0 right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
              {suggestions.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => choisirSuggestion(e)}
                    className="w-full flex items-center justify-between gap-3 text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    <span className="font-semibold">{e.nom} {e.prenom}</span>
                    <span className="text-[11px] text-slate-400">{e.classe || "—"}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="relative w-full lg:w-52 shrink-0">
          <Filter className="w-3.5 h-3.5 text-[#0C447C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={classeFiltre}
            onChange={(e) => setClasseFiltre(e.target.value)}
            style={STYLE_CHAMP}
            className="w-full pl-9 pr-3 py-2.5 border text-xs font-semibold text-[#0C447C] focus:outline-none cursor-pointer"
          >
            <option value="all">Toutes les classes</option>
            {classesDisponibles.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <select
          value={statutFiltre}
          onChange={(e) => setStatutFiltre(e.target.value)}
          style={STYLE_CHAMP}
          className="w-full lg:w-52 shrink-0 px-3.5 py-2.5 border text-xs font-semibold text-[#0C447C] focus:outline-none cursor-pointer"
        >
          <option value="all">Tous les statuts</option>
          <option value="a_jour">À jour</option>
          <option value="non_a_jour">Pas encore à jour</option>
          <option value="partiel">Partiel</option>
          <option value="a_echoir">À échoir</option>
          <option value="en_retard">En retard</option>
        </select>

        <button
          type="button"
          onClick={imprimerListe}
          disabled={chargement || classesDisponibles.length === 0}
          title={`${classeFiltre === "all" ? "Imprime une page par classe" : `Imprime la liste de la classe ${classeFiltre}`}${
            statutFiltre === "all" ? "" : ` (élèves « ${LIBELLES_FILTRE_STATUT[statutFiltre]} » uniquement)`
          }`}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-[#0C447C] bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
        >
          <Printer className="w-4 h-4" />
          {classeFiltre === "all" ? "Imprimer les listes" : "Imprimer la liste"}
        </button>
      </div>

      {/* Repertoire */}
      <div className="bg-white border border-slate-100/80 overflow-hidden" style={STYLE_CARTE}>
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold text-[#0C447C] tracking-tight">Répertoire des élèves ({stats.total})</h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#0C447C] border border-blue-200">
              {elevesFiltres.length} affiché{elevesFiltres.length > 1 ? "s" : ""}
            </span>
          </div>
          <span className="text-xs text-slate-500">Cliquez sur un élève pour voir sa fiche et ses règlements</span>
        </div>

        {erreur && <p className="px-6 py-3 text-sm text-rose-600 border-b border-slate-100">{erreur}</p>}

        {chargement ? (
          <p className="px-6 py-10 text-center text-sm text-slate-400">Chargement des élèves...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-[#f8fafc] text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Élève</th>
                  <th className="py-3.5 px-4">Classe</th>
                  <th className="py-3.5 px-4">Inscription</th>
                  <th className="py-3.5 px-4">Statut paiement</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {elevesFiltres.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500 font-medium">Aucun élève ne correspond aux filtres appliqués.</p>
                    </td>
                  </tr>
                ) : (
                  elevesFiltres.map((eleve) => (
                    <tr
                      key={eleve.id}
                      onClick={() => navigate(`/eleves/${eleve.id}`)}
                      className="hover:bg-[#eff6ff] transition-colors duration-150 cursor-pointer group"
                    >
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border border-white shadow-2xs ${couleurAvatar(eleve.nom)}`}>
                            {initiales(eleve.nom, eleve.prenom)}
                          </div>
                          <div className="min-w-0">
                            <div className="leading-snug">
                              <span className="font-extrabold text-[#0C447C] tracking-tight">{eleve.nom} </span>
                              <span className="font-medium text-slate-700">{eleve.prenom}</span>
                            </div>
                            <span className="text-[11px] font-mono text-slate-400 block">{eleve.matricule}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {eleve.classe ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#f1f5f9] text-slate-600 border border-slate-200/60 whitespace-nowrap">
                            {eleve.classe}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <BadgeInscription type={eleve.inscription_reglee} />
                      </td>
                      <td className="py-3.5 px-4">
                        <BadgeStatutPaiement statut={eleve.statut_paiement} />
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {peutImprimerReleve && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                imprimerReleve(eleve);
                              }}
                              disabled={impressionEnCours === eleve.id}
                              title="Imprimer le relevé de situation (A4)"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#0C447C] hover:bg-blue-100/70 transition-colors cursor-pointer disabled:opacity-40"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          )}
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 group-hover:text-[#0C447C] group-hover:bg-blue-100/60 transition-all">
                            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-6 py-3.5 bg-slate-50/60 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            {elevesFiltres.length} élève{elevesFiltres.length > 1 ? "s" : ""} affiché{elevesFiltres.length > 1 ? "s" : ""} sur {stats.total}
          </span>
          {session && <span className="font-semibold text-[#0C447C]">Année scolaire {session}</span>}
        </div>
      </div>
    </div>
  );
}
