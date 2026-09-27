import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { Users, FileCheck, Clock, Wallet, Search, Plus, Phone, Eye, CreditCard, BookOpen, Filter, UserCheck, Printer } from "lucide-react";
import { imprimerDocument, genererListeEnseignantsHtml } from "../../utils/impression";
import BadgeContrat from "../../components/enseignants/BadgeContrat";
import { degradeEnseignant, initialesEnseignant, libelleAnciennete, formaterGNF, normaliser } from "../../components/enseignants/theme";

// Gestion des enseignants (design "Gestion des enseignants") : banniere, 4 compteurs, filtres et
// grille de cartes, sur les donnees reelles de GET /enseignants.

const STYLE_CARTE = { borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1px solid rgba(226,232,240,0.7)" };

function Compteur({ libelle, valeur, detail, icone: Icone, couleur, fond, detailCouleur = "text-slate-600" }) {
  return (
    <div className="bg-white p-5" style={STYLE_CARTE}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{libelle}</p>
          <p className="text-2xl font-black text-slate-900 mt-1 font-mono tracking-tight truncate">{valeur}</p>
          <p className={`text-xs font-medium mt-2 ${detailCouleur}`}>{detail}</p>
        </div>
        <span className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${fond}`}>
          <Icone className={`w-6 h-6 ${couleur}`} />
        </span>
      </div>
    </div>
  );
}

export default function Enseignants({ permissions = [], etablissement = null, session = null }) {
  const peutCreer = permissions.includes("enseignants.creer");
  const peutVoirSalaires = permissions.includes("enseignants.salaires.voir");
  const [enseignants, setEnseignants] = useState([]);
  const [stats, setStats] = useState({ total: 0, actifs: 0, heures_hebdo: 0, masse_salariale: 0 });
  const [recherche, setRecherche] = useState("");
  const [matiere, setMatiere] = useState("tous");
  const [contrat, setContrat] = useState("tous");
  const [statut, setStatut] = useState("tous");
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/enseignants")
      .then((res) => {
        setEnseignants(res.data.enseignants);
        setStats(res.data.stats);
      })
      .catch((err) => setErreur(err.response?.data?.message || "Impossible de charger les enseignants."))
      .finally(() => setChargement(false));
  }, []);

  const matieres = useMemo(
    () => [...new Set(enseignants.flatMap((e) => e.matieres || []))].sort((a, b) => a.localeCompare(b, "fr")),
    [enseignants]
  );

  // Recherche sur nom, prenom, matricule, matiere et telephone (chaque mot, ordre libre).
  const termes = normaliser(recherche).split(/\s+/).filter(Boolean);
  const filtres = enseignants.filter((e) => {
    const cible = normaliser(`${e.nom} ${e.prenom} ${e.matricule} ${(e.matieres || []).join(" ")} ${e.telephone || ""}`);
    return (
      termes.every((t) => cible.includes(t)) &&
      (matiere === "tous" || e.matieres?.includes(matiere)) &&
      (contrat === "tous" || e.type_contrat === contrat) &&
      (statut === "tous" || (statut === "actif" ? e.statut_contrat === "actif" : e.statut_contrat !== "actif"))
    );
  });
  const filtreActif = recherche || matiere !== "tous" || contrat !== "tous" || statut !== "tous";
  const reinitialiser = () => {
    setRecherche("");
    setMatiere("tous");
    setContrat("tous");
    setStatut("tous");
  };

  const avecCompte = enseignants.filter((e) => e.a_un_compte).length;

  // Liste imprimable : les enseignants affiches, avec les filtres appliques dans l'en-tete.
  const imprimerListe = () => {
    const libellesFiltres = [
      matiere !== "tous" && `Matière : ${matiere}`,
      contrat !== "tous" && `Contrat : ${{ cdi: "CDI", cdd: "CDD", vacataire: "Vacataire" }[contrat]}`,
      statut !== "tous" && (statut === "actif" ? "Contrat actif" : "Sans contrat actif"),
      recherche.trim() && `Recherche : « ${recherche.trim()} »`,
    ].filter(Boolean);
    const html = genererListeEnseignantsHtml({ etablissement: etablissement?.nom, session, enseignants: filtres, filtres: libellesFiltres });
    if (!imprimerDocument("Liste des enseignants", html)) {
      setErreur("Le navigateur a bloqué la fenêtre d'impression. Autorisez les pop-ups pour ce site.");
    }
  };
  const selectClasse = "bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer";

  return (
    <div className="space-y-6">
      {/* Banniere */}
      <div className="relative overflow-hidden rounded-[16px] p-6 sm:p-8 text-white shadow-lg" style={{ background: "linear-gradient(90deg, #0C447C, #1a6bb5)" }}>
        <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute right-40 top-0 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            <div className="w-16 h-16 rounded-2xl bg-white/20 border border-white/25 flex items-center justify-center shrink-0">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold tracking-widest uppercase bg-white/15 px-2 py-0.5 rounded text-white/90">LAKOLI · Corps enseignant</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">Gestion des Enseignants</h1>
              <p className="text-sm text-white/75 mt-0.5">Corps enseignant · Affectations · Salaires</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {peutVoirSalaires && (
              <button
                onClick={() => navigate("/salaires")}
                className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white font-semibold text-xs sm:text-sm rounded-xl transition-colors border border-white/20 flex items-center gap-2 cursor-pointer"
              >
                <Wallet className="w-4 h-4 text-purple-200" />
                Consulter les salaires
              </button>
            )}
            {peutCreer && (
              <button
                onClick={() => navigate("/enseignants-ajouter")}
                className="px-5 py-2.5 bg-white hover:bg-slate-100 text-[#0C447C] font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                Ajouter un enseignant
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4 compteurs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Compteur
          libelle="Total enseignants"
          valeur={stats.total}
          detail={`${avecCompte} avec un compte LAKOLI`}
          icone={Users}
          couleur="text-[#0C447C]"
          fond="bg-[#0C447C]/10"
        />
        <Compteur
          libelle="Contrats actifs"
          valeur={stats.actifs}
          detail={stats.total > 0 ? `${Math.round((stats.actifs / stats.total) * 100)}% du corps enseignant` : "—"}
          icone={FileCheck}
          couleur="text-[#10b981]"
          fond="bg-emerald-50"
          detailCouleur="text-emerald-600"
        />
        <Compteur
          libelle="Heures par semaine"
          valeur={`${stats.heures_hebdo.toLocaleString("fr-FR")} h`}
          detail={`Moyenne : ${(stats.total ? stats.heures_hebdo / stats.total : 0).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} h / enseignant`}
          icone={Clock}
          couleur="text-[#f59e0b]"
          fond="bg-amber-50"
        />
        <Compteur
          libelle="Masse salariale de base"
          valeur={formaterGNF(stats.masse_salariale)}
          detail="Salaires de base des contrats actifs"
          icone={Wallet}
          couleur="text-[#7c3aed]"
          fond="bg-purple-50"
          detailCouleur="text-purple-700"
        />
      </div>

      {/* Filtres */}
      <div className="bg-white p-4" style={STYLE_CARTE}>
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par nom, matière, téléphone ou matricule..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="w-full pl-10 pr-16 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0C447C] focus:bg-white transition-all"
            />
            {recherche && (
              <button onClick={() => setRecherche("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer">
                Effacer
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select value={matiere} onChange={(e) => setMatiere(e.target.value)} className={selectClasse}>
                <option value="tous">Toutes les matières</option>
                {matieres.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <select value={contrat} onChange={(e) => setContrat(e.target.value)} className={selectClasse}>
                <option value="tous">Tous les contrats</option>
                <option value="cdi">CDI</option>
                <option value="cdd">CDD</option>
                <option value="vacataire">Vacataire</option>
              </select>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <select value={statut} onChange={(e) => setStatut(e.target.value)} className={selectClasse}>
                <option value="tous">Tous les statuts</option>
                <option value="actif">Contrat actif</option>
                <option value="inactif">Sans contrat actif</option>
              </select>
            </div>
            {filtreActif && (
              <button onClick={reinitialiser} className="text-xs text-[#0C447C] hover:underline font-semibold px-2 py-1 cursor-pointer">
                Réinitialiser
              </button>
            )}
            <button
              onClick={imprimerListe}
              disabled={chargement || filtres.length === 0}
              title={filtreActif ? "Imprime les enseignants affichés (filtres appliqués)" : "Imprime la liste de tous les enseignants"}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[#0C447C] bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <Printer className="w-4 h-4" />
              Imprimer la liste
            </button>
          </div>
        </div>
      </div>

      {/* Grille des enseignants */}
      {erreur ? (
        <p className="text-sm text-rose-600">{erreur}</p>
      ) : chargement ? (
        <p className="text-sm text-slate-400 text-center py-10">Chargement des enseignants...</p>
      ) : filtres.length === 0 ? (
        <div className="bg-white p-12 text-center" style={STYLE_CARTE}>
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Aucun enseignant trouvé</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {enseignants.length === 0 ? "Aucun enseignant n'est encore enregistré." : "Aucun enseignant ne correspond aux critères de recherche."}
          </p>
          {filtreActif && (
            <button onClick={reinitialiser} className="mt-4 px-4 py-2 bg-[#0C447C] text-white text-xs font-semibold rounded-lg hover:bg-[#1a6bb5] transition-colors cursor-pointer">
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtres.map((e) => {
            const anc = libelleAnciennete(e.date_debut_contrat);
            return (
              <div
                key={e.id}
                className="bg-white overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(12,68,124,0.09)]"
                style={STYLE_CARTE}
              >
                {/* En-tete degrade */}
                <div className="pt-6 pb-4 px-5 text-center" style={{ background: degradeEnseignant(e.matricule || e.nom) }}>
                  <div className="w-16 h-16 rounded-full mx-auto bg-white/20 border-2 border-white/40 flex items-center justify-center text-white font-extrabold text-xl shadow-lg mb-3">
                    {initialesEnseignant(e)}
                  </div>
                  <h3 className="text-lg font-extrabold text-white tracking-tight truncate px-2">
                    {e.prenom} {e.nom}
                  </h3>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold text-white border border-white/25 max-w-full">
                    <BookOpen className="w-3 h-3 shrink-0" />
                    <span className="truncate">{e.matieres?.length ? e.matieres.join(", ") : e.diplome || "Aucune matière affectée"}</span>
                  </div>
                  <p className="text-[10px] text-white/70 font-mono mt-1">{e.matricule}</p>
                </div>

                {/* Corps */}
                <div className="p-5 space-y-4 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">Contrat :</span>
                      <BadgeContrat type={e.type_contrat} taille="sm" />
                    </div>
                    {anc && <span className="text-xs font-mono text-slate-500">{anc}</span>}
                  </div>

                  <div>
                    <span className="text-xs text-slate-500 block mb-1.5 font-medium">Classes assignées ({e.classes?.length || 0}) :</span>
                    {e.classes?.length ? (
                      <div className="flex flex-wrap gap-1.5">
                        {e.classes.map((c) => (
                          <span key={c.nom} className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-700 rounded-md border border-slate-200/80">
                            {c.nom}
                            {c.examen && " 🎯"}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] italic text-slate-400">Aucune affectation</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-500 block">Volume horaire</span>
                      <span className="font-bold text-slate-800 font-mono text-sm">
                        {e.volume_horaire.toLocaleString("fr-FR")}h <span className="text-[11px] font-normal text-slate-500">/ sem</span>
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-slate-500 block">Contact</span>
                      {e.telephone ? (
                        <a href={`tel:${e.telephone}`} className="font-medium text-[#0C447C] hover:underline flex items-center gap-1 font-mono text-[11px]">
                          <Phone className="w-3 h-3 shrink-0" />
                          <span className="truncate">{e.telephone}</span>
                        </a>
                      ) : (
                        <span className="text-[11px] italic text-slate-400">Non renseigné</span>
                      )}
                    </div>
                  </div>

                  {e.salaire_base !== null && (
                    <div className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                      <span className="text-slate-500">Salaire de base</span>
                      <span className="font-mono font-bold text-slate-800">{formaterGNF(e.salaire_base)}</span>
                    </div>
                  )}
                </div>

                {/* Pied */}
                <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/enseignants/${e.id}`)}
                      className="px-3 py-1.5 text-xs font-semibold text-[#0C447C] border border-[#0C447C] rounded-lg hover:bg-[#0C447C] hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Voir la fiche
                    </button>
                    {peutVoirSalaires && (
                      <button
                        onClick={() => navigate("/salaires")}
                        className="px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        Salaire
                      </button>
                    )}
                  </div>
                  <span className="flex items-center gap-1.5 shrink-0" title={e.a_un_compte ? "L'enseignant peut se connecter à LAKOLI" : "Aucun compte de connexion"}>
                    {e.a_un_compte ? <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> : <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />}
                    <span className={`text-[11px] font-medium ${e.a_un_compte ? "text-emerald-700" : "text-slate-500"}`}>
                      {e.a_un_compte ? "Compte actif" : "Sans compte"}
                    </span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
