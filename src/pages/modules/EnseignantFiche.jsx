import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  Clock,
  Printer,
  Edit3,
  CreditCard,
  Plus,
  GraduationCap,
  FileText,
  Check,
} from "lucide-react";
import BadgeContrat from "../../components/enseignants/BadgeContrat";
import { degradeEnseignant, initialesEnseignant, libelleAnciennete, formaterGNF, formaterDate } from "../../components/enseignants/theme";
import { MOIS, ouvrirFenetreVierge, genererEtImprimerFichePaie, imprimerDocument } from "../../utils/impression";
import { genererFicheEnseignantHtml } from "../../utils/ficheEnseignant";

// Fiche enseignant (design "Gestion des enseignants") : 3 colonnes — profil et contrat,
// affectations et emploi du temps, salaires et statistiques pedagogiques. Donnees reelles.

const STYLE_CARTE = { borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1px solid rgba(226,232,240,0.7)" };
const JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const LIBELLES_JOURS = { lundi: "Lundi", mardi: "Mardi", mercredi: "Mercredi", jeudi: "Jeudi", vendredi: "Vendredi", samedi: "Samedi" };
const LIBELLES_CONTRAT = { cdi: "Durée indéterminée", cdd: "Durée déterminée", vacataire: "Vacation" };

function heure(h) {
  return String(h || "").slice(0, 5).replace(":", "h");
}

function dureeHeures(debut, fin) {
  const [h1, m1] = String(debut).split(":").map(Number);
  const [h2, m2] = String(fin).split(":").map(Number);
  const d = (h2 * 60 + m2 - (h1 * 60 + m1)) / 60;
  return Number.isFinite(d) && d > 0 ? d : 0;
}

// 1.9667 -> "1h58", 2 -> "2h"
function formaterDuree(heures) {
  const minutes = Math.round(heures * 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

function Carte({ titre, sousTitre, action, children }) {
  return (
    <div className="bg-white p-5 space-y-4" style={STYLE_CARTE}>
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">{titre}</h2>
          {sousTitre && <p className="text-xs text-slate-500">{sousTitre}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function LigneContact({ icone: Icone, libelle, children }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <span className="text-slate-500 block text-[11px]">{libelle}</span>
        {children}
      </div>
    </div>
  );
}

const nonRenseigne = <span className="italic text-slate-400">Non renseigné</span>;

export default function EnseignantFiche({ permissions = [], etablissement = null }) {
  const peutModifier = permissions.includes("enseignants.creer");
  const peutVoirSalaires = permissions.includes("enseignants.salaires.voir");
  const peutGererAffectations = permissions.includes("affectations.gerer");
  const { id } = useParams();
  const navigate = useNavigate();
  const [enseignant, setEnseignant] = useState(null);
  const [salaires, setSalaires] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [jour, setJour] = useState("lundi");
  const [edition, setEdition] = useState(null);
  const [enregistrement, setEnregistrement] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api
      .get(`/enseignants/${id}`)
      .then((res) => {
        setEnseignant(res.data);
        // Premier jour qui a des cours, pour ne pas ouvrir sur une journee vide.
        const jours = new Set(res.data.affectations?.flatMap((a) => (a.creneaux || []).map((c) => c.jour)));
        const premier = JOURS.find((j) => jours.has(j));
        if (premier) setJour(premier);
      })
      .catch((err) => setErreur(err.response?.data?.message || "Impossible de charger la fiche."))
      .finally(() => setChargement(false));
    if (peutVoirSalaires) {
      api.get("/salaires", { params: { enseignant_id: id } }).then((res) => setSalaires(res.data)).catch(() => {});
    }
  }, [id, peutVoirSalaires]);

  if (chargement) return <p className="text-sm text-slate-500">Chargement...</p>;
  if (erreur) return <p className="text-sm text-rose-600">{erreur}</p>;
  if (!enseignant) return null;

  const contrat = enseignant.contrats?.find((c) => c.statut === "actif");
  const affectations = enseignant.affectations || [];
  const matieres = [...new Set(affectations.map((a) => a.matiere?.nom).filter(Boolean))];
  const totalHeures = affectations.reduce((s, a) => s + (Number(a.volume_horaire_hebdomadaire) || 0), 0);
  const creneaux = affectations
    .flatMap((a) => (a.creneaux || []).map((c) => ({ ...c, classe: a.classe?.nom, matiere: a.matiere?.nom })))
    .sort((a, b) => String(a.heure_debut).localeCompare(String(b.heure_debut)));
  const heuresParJour = Object.fromEntries(
    JOURS.map((j) => [j, creneaux.filter((c) => c.jour === j).reduce((s, c) => s + dureeHeures(c.heure_debut, c.heure_fin), 0)])
  );
  const joursAffiches = heuresParJour.samedi > 0 ? JOURS : JOURS.slice(0, 5);
  const stats = enseignant.statistiques || {};
  const tauxValidation = stats.evaluations > 0 ? Math.round((stats.evaluations_validees / stats.evaluations) * 100) : 0;
  const totalPercu = salaires.filter((s) => s.statut === "paye").reduce((t, s) => t + Number(s.montant_net), 0);
  const anc = libelleAnciennete(contrat?.date_debut);
  const degrade = degradeEnseignant(enseignant.matricule || enseignant.nom);

  const enregistrer = async () => {
    setEnregistrement(true);
    setMessage("");
    try {
      const res = await api.put(`/enseignants/${id}`, edition);
      setEnseignant({ ...enseignant, ...res.data });
      setEdition(null);
      setMessage("Coordonnées enregistrées.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Impossible d'enregistrer les modifications.");
    } finally {
      setEnregistrement(false);
    }
  };

  const voirFichePaie = async (salaire) => {
    const fenetre = ouvrirFenetreVierge();
    if (!fenetre) {
      setMessage("Le navigateur a bloqué la fenêtre. Autorisez les pop-ups pour ce site.");
      return;
    }
    try {
      const res = await api.get(`/salaires/${salaire.id}`);
      genererEtImprimerFichePaie(res.data, fenetre);
    } catch {
      fenetre.close();
      setMessage("Impossible de charger la fiche de paie.");
    }
  };

  const imprimer = () => {
    const html = genererFicheEnseignantHtml({ etablissement: etablissement || {}, enseignant, contrat, affectations, creneaux });
    if (!imprimerDocument(`Fiche enseignant - ${enseignant.prenom} ${enseignant.nom}`, html)) {
      setMessage("Le navigateur a bloqué la fenêtre d'impression. Autorisez les pop-ups pour ce site.");
    }
  };

  const champ = (nom, libelle, type = "text") => (
    <div>
      <label className="text-[11px] text-slate-500 font-semibold block mb-0.5">{libelle}</label>
      <input
        type={type}
        value={edition[nom] ?? ""}
        onChange={(e) => setEdition({ ...edition, [nom]: e.target.value })}
        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-[#0C447C]"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/enseignants")}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors shadow-xs cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 text-slate-500" />
        Retour à la liste des enseignants
      </button>

      {/* Banniere */}
      <div className="relative overflow-hidden rounded-[16px] p-6 sm:p-8 text-white shadow-lg" style={{ background: degrade }}>
        <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-white/10 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 min-w-0">
            <div className="w-20 h-20 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center font-black text-3xl shadow-xl shrink-0">
              {initialesEnseignant(enseignant)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-xs font-mono bg-white/20 px-2.5 py-0.5 rounded">{enseignant.matricule}</span>
                <BadgeContrat type={contrat?.type} taille="sm" />
                {anc && <span className="text-xs text-white/80">{anc}</span>}
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                {enseignant.prenom} {enseignant.nom}
              </h1>
              <p className="text-sm sm:text-base font-medium text-white/90 mt-1.5">
                {matieres.length ? `Professeur de ${matieres.join(", ")}` : "Aucune matière affectée"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {peutModifier && (
              <button
                onClick={() =>
                  setEdition(
                    edition
                      ? null
                      : { telephone: enseignant.telephone, email: enseignant.email, diplome: enseignant.diplome, lieu_naissance: enseignant.lieu_naissance }
                  )
                }
                className="px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors border border-white/25 flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                {edition ? "Fermer l'édition" : "Modifier"}
              </button>
            )}
            {peutVoirSalaires && (
              <button
                onClick={() => navigate(`/salaires?nouveau=${id}`)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                Payer le salaire
              </button>
            )}
            <button
              onClick={imprimer}
              className="px-3.5 py-2 bg-white text-[#0C447C] hover:bg-slate-100 text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Imprimer
            </button>
          </div>
        </div>
      </div>

      {message && <p className="text-xs font-semibold text-[#0C447C] bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">{message}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Colonne gauche : profil + contrat */}
        <div className="lg:col-span-3 space-y-6">
          <Carte
            titre="Profil"
            action={
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  contrat ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${contrat ? "bg-emerald-500" : "bg-slate-400"}`} />
                {contrat ? "Actif" : "Inactif"}
              </span>
            }
          >
            <div className="text-center">
              <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-white text-2xl font-bold shadow-md" style={{ background: degrade }}>
                {initialesEnseignant(enseignant)}
              </div>
              <p className="font-bold text-slate-800 text-sm mt-2">
                {enseignant.prenom} {enseignant.nom}
              </p>
              {enseignant.diplome && <p className="text-xs text-slate-500">{enseignant.diplome}</p>}
              {anc && <p className="text-[11px] font-semibold text-[#0C447C] mt-1 bg-blue-50 py-1 px-2 rounded-lg inline-block">{anc}</p>}
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-3 text-xs">
              {edition ? (
                <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {champ("telephone", "Téléphone")}
                  {champ("email", "E-mail", "email")}
                  {champ("diplome", "Diplôme")}
                  {champ("lieu_naissance", "Lieu de naissance")}
                  <button
                    onClick={enregistrer}
                    disabled={enregistrement}
                    className="w-full mt-2 py-1.5 bg-[#0C447C] text-white text-xs font-semibold rounded-lg hover:bg-[#1a6bb5] flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60"
                  >
                    <Check className="w-3.5 h-3.5" /> {enregistrement ? "Enregistrement..." : "Enregistrer"}
                  </button>
                </div>
              ) : (
                <>
                  <LigneContact icone={Phone} libelle="Téléphone">
                    {enseignant.telephone ? (
                      <a href={`tel:${enseignant.telephone}`} className="font-mono font-medium text-slate-800 hover:text-[#0C447C]">{enseignant.telephone}</a>
                    ) : nonRenseigne}
                  </LigneContact>
                  <LigneContact icone={Mail} libelle="E-mail">
                    {enseignant.email ? (
                      <a href={`mailto:${enseignant.email}`} className="font-medium text-slate-800 hover:text-[#0C447C] truncate block">{enseignant.email}</a>
                    ) : nonRenseigne}
                  </LigneContact>
                  <LigneContact icone={GraduationCap} libelle="Diplôme">
                    <span className="font-medium text-slate-800">{enseignant.diplome || nonRenseigne}</span>
                  </LigneContact>
                  <LigneContact icone={Calendar} libelle="Date & lieu de naissance">
                    <span className="font-medium text-slate-800">
                      {formaterDate(enseignant.date_naissance) || "—"}
                      {enseignant.lieu_naissance && ` à ${enseignant.lieu_naissance}`}
                    </span>
                  </LigneContact>
                </>
              )}
            </div>
          </Carte>

          <Carte titre="Contrat actuel">
            {contrat ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Régime</span>
                  <BadgeContrat type={contrat.type} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Nature</span>
                  <span className="font-medium text-slate-800">{LIBELLES_CONTRAT[contrat.type] || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Date de début</span>
                  <span className="font-mono font-medium text-slate-800">{formaterDate(contrat.date_debut) || "—"}</span>
                </div>
                {contrat.date_fin && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Date de fin prévue</span>
                    <span className="font-mono font-medium text-amber-700">{formaterDate(contrat.date_fin)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Salaire de base</span>
                  <span className="font-mono font-black text-slate-900 text-sm">{formaterGNF(contrat.salaire_base)}</span>
                </div>
                {Number(contrat.taux_horaire_heures_sup) > 0 && (
                  <div className="flex items-center justify-between text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200/60">
                    <span>Taux heure sup.</span>
                    <span className="font-mono font-bold">{formaterGNF(contrat.taux_horaire_heures_sup)} / h</span>
                  </div>
                )}
                {enseignant.contrats.length > 1 && (
                  <p className="text-[11px] text-slate-400">{enseignant.contrats.length - 1} contrat(s) précédent(s) dans l'historique</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Aucun contrat actif.</p>
            )}
          </Carte>
        </div>

        {/* Colonne centrale : affectations + emploi du temps */}
        <div className="lg:col-span-5 space-y-6">
          <Carte
            titre="Classes & Matières"
            sousTitre="Affectations pédagogiques de l'année en cours"
            action={
              peutGererAffectations && (
                <button
                  onClick={() => navigate("/affectations")}
                  className="px-3 py-1.5 bg-[#0C447C] hover:bg-[#1a6bb5] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shadow-xs cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Gérer les affectations
                </button>
              )
            }
          >
            {affectations.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">Aucune affectation pour le moment.</p>
            ) : (
              <div className="space-y-2.5">
                {affectations.map((a) => (
                  <div key={a.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-100/70 border border-blue-200 flex items-center justify-center text-[#0C447C] font-bold text-xs shrink-0">
                        {(a.classe?.nom || "?").slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-800 text-sm">{a.classe?.nom || "—"}</span>
                          {a.est_classe_examen && (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded" title="Classe d'examen national">🎯 Examen</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {a.matiere?.nom || "—"}
                          {a.classe?.niveau && a.classe.niveau !== a.classe.nom && ` · ${a.classe.niveau}`}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-slate-800 text-xs bg-white px-2.5 py-1 rounded-md border border-slate-200 shrink-0">
                      {Number(a.volume_horaire_hebdomadaire || 0).toLocaleString("fr-FR")}h / sem
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between text-xs bg-slate-50 p-3 rounded-xl">
              <span className="font-semibold text-slate-700">Charge hebdomadaire totale :</span>
              <span className="font-mono font-black text-[#0C447C] text-sm">{totalHeures.toLocaleString("fr-FR")} heures / semaine</span>
            </div>
          </Carte>

          <Carte
            titre="Emploi du temps"
            sousTitre="Séances hebdomadaires programmées"
            action={<span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg shrink-0">{creneaux.length} séance{creneaux.length > 1 ? "s" : ""}</span>}
          >
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
              {joursAffiches.map((j) => (
                <button
                  key={j}
                  onClick={() => setJour(j)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex-1 cursor-pointer ${
                    jour === j ? "bg-white text-[#0C447C] shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {LIBELLES_JOURS[j]}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {creneaux.filter((c) => c.jour === jour).length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Aucun cours programmé le {LIBELLES_JOURS[jour].toLowerCase()}.
                </div>
              ) : (
                creneaux
                  .filter((c) => c.jour === jour)
                  .map((c) => (
                    <div key={c.id} className="p-3 bg-blue-50/50 hover:bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between gap-3 text-xs transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-white rounded-lg border border-blue-200 text-[#0C447C] font-mono font-bold text-[11px] whitespace-nowrap">
                          <Clock className="w-3.5 h-3.5 inline mr-1" />
                          {heure(c.heure_debut)} - {heure(c.heure_fin)}
                        </div>
                        <p className="font-bold text-slate-800 truncate">
                          {c.classe} — {c.matiere}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded shrink-0">
                        {formaterDuree(dureeHeures(c.heure_debut, c.heure_fin))}
                      </span>
                    </div>
                  ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 block mb-2">Aperçu de la semaine :</span>
              <div className={`grid gap-1.5 text-center text-[11px] ${joursAffiches.length === 6 ? "grid-cols-6" : "grid-cols-5"}`}>
                {joursAffiches.map((j) => (
                  <button
                    key={j}
                    onClick={() => setJour(j)}
                    className={`p-2 rounded-lg cursor-pointer transition-all border ${
                      jour === j
                        ? "border-[#0C447C] bg-[#0C447C]/10 font-bold text-[#0C447C]"
                        : heuresParJour[j] > 0
                        ? "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                        : "border-slate-100 bg-white text-slate-300"
                    }`}
                  >
                    <p className="text-[10px] uppercase font-bold">{LIBELLES_JOURS[j].slice(0, 3)}</p>
                    <p className="font-mono mt-0.5 font-semibold">{heuresParJour[j] > 0 ? formaterDuree(heuresParJour[j]) : "—"}</p>
                  </button>
                ))}
              </div>
            </div>
          </Carte>
        </div>

        {/* Colonne droite : salaires + statistiques */}
        <div className="lg:col-span-4 space-y-6">
          {peutVoirSalaires && (
            <Carte titre="Historique des salaires" sousTitre="Fiches de paie les plus récentes">
              {salaires.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">Aucun salaire enregistré pour le moment.</p>
              ) : (
                <div className="space-y-2">
                  {salaires.slice(0, 6).map((s) => (
                    <div key={s.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 hover:bg-white transition-colors">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-xs">{MOIS[s.mois - 1]} {s.annee}</span>
                          <span className={`text-[10px] font-bold px-1.5 rounded ${s.statut === "paye" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                            {s.statut === "paye" ? "Payé" : "En attente"}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono font-bold text-[#0C447C] mt-0.5">{formaterGNF(s.montant_net)}</p>
                      </div>
                      <button onClick={() => voirFichePaie(s)} className="text-xs font-semibold text-[#0C447C] hover:underline flex items-center gap-1 shrink-0 cursor-pointer">
                        <FileText className="w-3.5 h-3.5" />
                        Voir la fiche
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between text-xs bg-slate-50 p-3 rounded-xl">
                <span className="text-slate-600 font-semibold">Total perçu :</span>
                <span className="font-mono font-black text-emerald-700 text-sm">{formaterGNF(totalPercu)}</span>
              </div>
            </Carte>
          )}

          <Carte titre="Statistiques pédagogiques">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1 p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                    <path className="text-slate-200" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    {tauxValidation > 0 && (
                    <path
                      className="text-[#0C447C]"
                      strokeDasharray={`${tauxValidation}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    )}
                  </svg>
                  <span className="absolute font-mono font-black text-sm text-slate-800">{stats.evaluations > 0 ? `${tauxValidation}%` : "—"}</span>
                </div>
                <p className="text-xs font-semibold text-slate-700 mt-2">Évaluations validées</p>
                <span className="text-[10px] text-slate-500">
                  {stats.evaluations > 0 ? `${stats.evaluations_validees} sur ${stats.evaluations}` : "Aucune évaluation"}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1 space-y-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-2xl font-black font-mono text-[#0C447C]">{stats.evaluations ?? 0}</span>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">Évaluations créées</p>
                  <span className="text-[10px] text-slate-500">Devoirs & compositions</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-2xl font-black font-mono text-emerald-600">
                    {stats.moyenne !== null && stats.moyenne !== undefined ? stats.moyenne.toLocaleString("fr-FR") : "—"}
                    <span className="text-xs text-slate-400 font-normal"> / 20</span>
                  </span>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">Moyenne des notes</p>
                  <span className="text-[10px] text-slate-500">{stats.notes ? `${stats.notes} note${stats.notes > 1 ? "s" : ""} saisie${stats.notes > 1 ? "s" : ""}` : "Aucune note saisie"}</span>
                </div>
              </div>
            </div>
          </Carte>
        </div>
      </div>
    </div>
  );
}
