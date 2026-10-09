import { useState, useEffect, useRef } from "react";
import useActualisation from "../../hooks/useActualisation";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  CreditCard,
  Download,
  History,
  ClipboardList,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Users,
  Clock,
  Calendar,
  GraduationCap,
  UserPlus,
  UserCheck,
  ChevronRight,
  Receipt,
  Search,
  Ban,
  Printer,
} from "lucide-react";
import { calculerStatutEcheance } from "../../constants/statutEcheance";
import { situationGlobaleDepuisSuivi } from "../../utils/situationFrais";
import GrillesTarifaires from "../../components/frais/GrillesTarifaires";
import {
  STYLE_CARTE,
  MOYENS,
  statut,
  configTypeFrais,
  couleurAvatar,
  formaterGNF,
  formaterDateCourte,
  normaliser,
  telechargerCsv,
} from "../../components/frais/configFrais";
import { formaterDate, formaterHeure, referenceLocale, genererEtImprimerRecu, ouvrirFenetreVierge, MOYENS_PAIEMENT } from "../../utils/impression";

function getInitiales(nom, prenom) {
  return `${nom?.[0] || ""}${prenom?.[0] || ""}`.toUpperCase();
}

// Reste a payer sur l'ensemble du frais (toutes tranches) auquel appartient l'echeance : c'est le
// plafond d'un versement, le surplus au-dela de l'echeance etant reporte sur les tranches suivantes.
// Dernier recu du compte connecte, garde dans le navigateur : reimprimable apres un changement
// d'eleve, un rechargement ou une reconnexion, jusqu'au paiement suivant qui le remplace.
function cleDernierRecu() {
  try {
    return `lakoli_dernier_recu_${JSON.parse(localStorage.getItem("lakoli_session") || "{}")?.user?.id ?? ""}`;
  } catch {
    return "lakoli_dernier_recu_";
  }
}
function lireDernierRecu() {
  try {
    return JSON.parse(localStorage.getItem(cleDernierRecu()) || "null");
  } catch {
    return null;
  }
}
function memoriserDernierRecu(recu) {
  try {
    localStorage.setItem(cleDernierRecu(), JSON.stringify(recu));
  } catch {
    // stockage indisponible : le recu reste reimprimable jusqu'au rechargement de la page
  }
}

function resteTotalDuFrais(suivi, echeanceId) {
  const frais = [...(suivi?.frais || []), ...(suivi?.arrieres || [])].find((f) => f.echeances.some((e) => String(e.id) === String(echeanceId)));
  return (frais?.echeances || []).reduce((s, e) => s + Math.max(0, Number(e.solde)), 0);
}

// Lignes du recu (une par tranche touchee) et reste a payer sur ces tranches, a partir du detail
// renvoye par POST /frais/paiements et de l'etat des echeances AVANT le paiement (suivi au clic).
function detailPaiementScolarite(resPaiement, suiviAvant) {
  const echeancesAvant = (suiviAvant?.frais || []).flatMap((f) => f.echeances);
  const typeDe = (echeanceId) =>
    (suiviAvant?.frais || []).find((f) => f.echeances.some((e) => String(e.id) === String(echeanceId)))?.type_frais || "Scolarité";
  const details = resPaiement.paiements || [];
  const lignes = details.map((p) => ({ libelle: `${typeDe(p.echeance_eleve_id)} - ${p.libelle}`, montant: Number(p.montant) }));
  const resteAPayer = details.reduce((s, p) => {
    const avant = echeancesAvant.find((e) => String(e.id) === String(p.echeance_eleve_id));
    return s + (avant ? Math.max(0, Number(avant.montant) - Number(avant.montant_paye) - Number(p.montant)) : 0);
  }, 0);
  return { lignes, resteAPayer, estSolde: resteAPayer <= 0 };
}

// Memorise la classe choisie pour la retrouver au retour sur la page.
const CLE_CLASSE_FILTRE = "frais_classe_filtre";

// Par defaut, toutes les classes : la page affiche tout de suite les compteurs et la liste.
function lireClasseFiltre() {
  try {
    return sessionStorage.getItem(CLE_CLASSE_FILTRE) || "tous";
  } catch {
    return "tous";
  }
}

// 5 compteurs du suivi (cliquables : filtrent la liste des eleves).
const COMPTEURS = [
  { id: "tous", libelle: "Total élèves", detail: "Effectif affiché", icone: Users, couleur: "text-[#0C447C]", fond: "bg-blue-50", anneau: "ring-2 ring-[#0C447C] border-transparent" },
  { id: "a_jour", libelle: "Paiements à jour", detail: "Scolarité réglée à date", icone: CheckCircle2, couleur: "text-emerald-600", fond: "bg-emerald-50", anneau: "ring-2 ring-emerald-600 border-transparent" },
  { id: "partiel", libelle: "Paiements partiels", detail: "Avances perçues", icone: Clock, couleur: "text-amber-600", fond: "bg-amber-50", anneau: "ring-2 ring-amber-600 border-transparent" },
  { id: "a_echoir", libelle: "À échoir", detail: "Prochaine échéance à venir", icone: Calendar, couleur: "text-slate-500", fond: "bg-slate-100", anneau: "ring-2 ring-slate-600 border-transparent" },
  { id: "en_retard", libelle: "En retard", detail: "Relances nécessaires", icone: AlertTriangle, couleur: "text-rose-600", fond: "bg-rose-50", anneau: "ring-2 ring-rose-600 border-transparent" },
];

const LABEL = "block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1";
const CHAMP = "w-full bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0C447C]/20 focus:border-[#0C447C]";

// Choix du moyen de paiement en boutons (Especes / Mobile Money / Virement / Cheque).
function SelecteurMoyen({ valeur, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {Object.entries(MOYENS).map(([cle, m]) => (
        <button
          key={cle}
          type="button"
          onClick={() => onChange(cle)}
          className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
            valeur === cle ? "border-[#0C447C] bg-white text-[#0C447C] ring-1 ring-[#0C447C]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          <span>{m.emoji}</span>
          {m.libelle}
        </button>
      ))}
    </div>
  );
}

// Statut d'un frais complet : paye si tout est regle, sinon le pire statut de ses echeances.
function statutFrais(frais) {
  const statuts = frais.echeances.map((e) => calculerStatutEcheance(e));
  if (statuts.length && statuts.every((s) => s === "paye")) return "paye";
  if (statuts.includes("en_retard")) return "en_retard";
  if (statuts.includes("partiel")) return "partiel";
  return statuts.length ? "a_echoir" : null;
}

const MESSAGE_POPUP_BLOQUE =
  "Le navigateur a bloqué la fenêtre du reçu. Autorisez les pop-ups pour ce site, puis cliquez sur « Réimprimer le reçu ».";

export default function FraisScolarite({ permissions = [], etablissement = null }) {
  const peutInscrire = permissions.includes("frais.creer");
  const peutImprimer = permissions.includes("frais.voir");
  const peutPayer = permissions.includes("frais.paiement.enregistrer");

  const [onglet, setOnglet] = useState("suivi");

  // Colonne gauche : classe + recherche + liste des eleves.
  const [classes, setClasses] = useState([]);
  // Eleve a pre-selectionner, transmis par la navigation (ex. "Payer maintenant" du tableau de bord).
  const location = useLocation();
  const navigate = useNavigate();
  const [eleveAPreselectionner, setEleveAPreselectionner] = useState(location.state?.eleveId ?? null);
  const [classeId, setClasseId] = useState(() =>
    location.state?.classeId ? String(location.state.classeId) : lireClasseFiltre()
  );
  const [eleves, setEleves] = useState([]);
  const [recherche, setRecherche] = useState("");
  const [afficherSuggestions, setAfficherSuggestions] = useState(false);
  // Vrai des le depart si une classe est choisie : les grilles attendent la liste (voir plus bas).
  const [chargementEleves, setChargementEleves] = useState(() => Boolean(classeId));
  const [eleveSelectionne, setEleveSelectionne] = useState(null);
  const [filtreStatut, setFiltreStatut] = useState(null);

  // Colonne droite : detail de l'eleve selectionne.
  const [eleveInfos, setEleveInfos] = useState(null);
  const [suivi, setSuivi] = useState(null);
  const [typesFrais, setTypesFrais] = useState([]);
  const [inscriptionEnCours, setInscriptionEnCours] = useState(null);
  const [dernierRecu, setDernierRecuEtat] = useState(lireDernierRecu);
  const setDernierRecu = (recu) => {
    setDernierRecuEtat(recu);
    memoriserDernierRecu(recu);
  };

  // Formulaire d'inscription / reinscription (bouton d'en-tete).
  const [formInscription, setFormInscription] = useState(null);
  // Formulaire de paiement d'une echeance de scolarite prise isolement (bouton "Payer").
  const [paiement, setPaiement] = useState(null);
  // Annulation d'une inscription / reinscription faite par erreur : { frais, motif, envoi, erreur }.
  const [annulInscription, setAnnulInscription] = useState(null);

  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  const [grillesExistantes, setGrillesExistantes] = useState([]);
  const [grillesDemandees, setGrillesDemandees] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem(CLE_CLASSE_FILTRE, classeId);
    } catch {
      // stockage indisponible (navigation privee...) : le filtre reste simplement non memorise
    }
  }, [classeId]);

  // Une classe supprimee depuis la derniere visite ne doit pas rester selectionnee.
  useEffect(() => {
    if (classeId && classeId !== "tous" && classes.length > 0 && !classes.some((c) => String(c.id) === String(classeId))) {
      setClasseId("tous");
    }
  }, [classes, classeId]);

  // Les eleves ne sont charges que pour la classe choisie, ou pour toute l'ecole sur demande
  // ("Toutes les classes").
  const actualisation = useActualisation();
  const derniereActualisation = useRef(actualisation);
  useEffect(() => {
    // Actualisation automatique : liste rechargee en silence (sans sablier ni message efface).
    const silencieux = derniereActualisation.current !== actualisation;
    derniereActualisation.current = actualisation;
    if (!classeId) {
      setEleves([]);
      setChargementEleves(false);
      return;
    }

    let annule = false;
    if (!silencieux) {
      setChargementEleves(true);
      setErreur("");
    }
    api
      .get("/eleves", { params: classeId === "tous" ? {} : { classe_id: classeId } })
      .then((res) => {
        if (!annule) setEleves(res.data.eleves);
      })
      .catch(() => {
        if (!annule && !silencieux) {
          setEleves([]);
          setErreur("Impossible de charger les élèves de cette classe.");
        }
      })
      .finally(() => {
        if (!annule) setChargementEleves(false);
      });

    // Ignore la reponse d'une classe precedente si l'utilisateur en a change entre-temps.
    return () => {
      annule = true;
    };
  }, [classeId, actualisation]);

  // Fiche de l'eleve ouvert : ses frais et paiements suivent aussi (paiement saisi ailleurs).
  useEffect(() => {
    if (actualisation === 0 || !eleveSelectionne) return;
    api.get(`/frais/eleves/${eleveSelectionne}`).then((res) => setSuivi(res.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actualisation]);

  // Declare apres le chargement des eleves : la liste part en premier vers le serveur, qui traite
  // les requetes une par une (php artisan serve).
  useEffect(() => {
    api.get("/classes").then((res) => setClasses(res.data));
    chargerTypes();
  }, []);

  // Grilles tarifaires (lourdes) : apres la liste des eleves, ou des l'ouverture de leur onglet.
  // Elles ne servent qu'a cet onglet et au montant propose a l'inscription d'un eleve.
  useEffect(() => {
    if (grillesDemandees || (onglet !== "grilles" && chargementEleves)) return;
    setGrillesDemandees(true);
    chargerGrilles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onglet, chargementEleves, grillesDemandees]);

  const chargerTypes = async () => {
    try {
      const res = await api.get("/frais/types");
      setTypesFrais(res.data);
    } catch {
      setTypesFrais([]);
    }
  };

  const chargerGrilles = async () => {
    try {
      const res = await api.get("/frais/grilles");
      setGrillesExistantes(res.data);
    } catch (err) {
      setGrillesExistantes([]);
    }
  };

  const chargerSuivi = async (eleveId) => {
    setEleveSelectionne(eleveId);
    setErreur(""); setSucces("");
    try {
      const res = await api.get(`/frais/eleves/${eleveId}`);
      setSuivi(res.data);
      return res.data;
    } catch (err) {
      setErreur("Impossible de charger le suivi de cet élève.");
      return null;
    }
  };

  const dateDuJour = () => new Date().toISOString().slice(0, 10);

  // Clic sur "Inscrire" / "Réinscrire" : affiche le formulaire. Le montant d'inscription est
  // saisi manuellement (le montant affiche sur le bouton n'est qu'une reference issue de la
  // grille) ; l'echeance de scolarite est un ajout optionnel.
  const ouvrirFormulaireInscription = (reinscription) => {
    const type = reinscription ? typeReinscription : typeInscription;
    if (!type) {
      setErreur(`Le type de frais « ${reinscription ? "Réinscription" : "Inscription"} » est introuvable.`);
      return;
    }
    setErreur(""); setSucces("");
    setPaiement(null);
    setFormInscription({
      reinscription,
      montantInscription: "",
      echeanceId: "",
      montantEcheance: "",
      moyenPaiement: "especes",
    });
  };

  // Clic sur "Payer" sous une echeance de scolarite non soldee.
  const ouvrirFormulairePaiement = (ech) => {
    setErreur(""); setSucces("");
    setFormInscription(null);
    setPaiement({ echeanceId: ech.id, libelle: ech.libelle, montant: "", moyenPaiement: "especes" });
  };

  // Cree les frais d'inscription/reinscription et, si une echeance de scolarite a ete choisie,
  // enregistre aussi son paiement : deux appels API, un seul recu imprime. La fenetre du recu
  // est ouverte des le clic (synchrone) : un navigateur bloque toute fenetre ouverte apres un
  // appel reseau.
  const confirmerInscription = async (e) => {
    e.preventDefault();
    const { reinscription, montantInscription, echeanceId, montantEcheance, moyenPaiement } = formInscription;
    const type = reinscription ? typeReinscription : typeInscription;
    setErreur(""); setSucces("");
    setInscriptionEnCours(reinscription ? "reinscription" : "inscription");
    const fenetre = peutImprimer ? ouvrirFenetreVierge() : null;
    try {
      const resInscription = await api.post("/frais/appliquer-inscription", {
        eleve_id: eleveInfos.id,
        type_frais_id: type.id,
        montant: montantInscription,
        moyen_paiement: moyenPaiement,
      });

      // L'inscription est deja encaissee a ce stade : un echec du paiement de scolarite ne doit
      // pas empecher d'imprimer son recu (il est signale a part, apres rechargement du suivi).
      const suiviAvant = suivi;
      let resEcheance = null;
      let erreurEcheance = "";
      if (echeanceId) {
        try {
          resEcheance = await api.post("/frais/paiements", {
            echeance_eleve_id: echeanceId,
            montant: montantEcheance,
            moyen_paiement: moyenPaiement,
            date_paiement: dateDuJour(),
          });
        } catch (err) {
          erreurEcheance = err.response?.data?.message || "Erreur lors du paiement de la scolarité.";
        }
      }

      // Recharge le suivi pour rafraichir l'affichage (chargerSuivi efface aussi les messages,
      // d'ou l'ordre : succes affiche juste apres). Le reste a payer est calcule a partir de
      // l'etat des echeances AVANT ce paiement (suivi tel qu'il etait au moment du clic) — pas
      // du solde rechargé, pour ne jamais dependre d'un decalage avec le suivi recharge.
      const suiviMaj = await chargerSuivi(eleveInfos.id);
      setSucces(resInscription.data.message);
      if (erreurEcheance) {
        setErreur(`${reinscription ? "Réinscription" : "Inscription"} enregistrée, mais le paiement de scolarité a échoué : ${erreurEcheance}`);
      }
      setFormInscription(null);

      const lignes = [
        { libelle: reinscription ? "Réinscription" : "Inscription", montant: Number(resInscription.data.montant_paye) },
      ];
      let estSolde = true;
      let resteAPayer = 0;
      if (resEcheance) {
        const detail = detailPaiementScolarite(resEcheance.data, suiviAvant);
        lignes.push(...detail.lignes);
        resteAPayer = detail.resteAPayer;
        estSolde = detail.estSolde;
      }

      const recu = {
        reference: resInscription.data.reference,
        eleve: eleveInfos,
        session: eleveInfos.inscription_active?.session_scolaire?.libelle || "—",
        lignes,
        total: lignes.reduce((s, l) => s + l.montant, 0),
        estSolde,
        resteAPayer,
        moyen: MOYENS_PAIEMENT[resInscription.data.moyen_paiement] || resInscription.data.moyen_paiement,
        date: formaterDate(resInscription.data.date),
        heure: resInscription.data.heure,
        caissier: resInscription.data.caissier || localStorage.getItem("user_name") || "",
        situationGlobale: situationGlobaleDepuisSuivi(suiviMaj),
        etablissement,
      };
      setDernierRecu(recu);
      if (peutImprimer && !genererEtImprimerRecu(recu, fenetre)) {
        setErreur(erreurEcheance ? `${erreurEcheance} ${MESSAGE_POPUP_BLOQUE}` : MESSAGE_POPUP_BLOQUE);
      }
    } catch (err) {
      fenetre?.close();
      setErreur(
        err.response?.status === 409
          ? "Frais déjà appliqués"
          : err.response?.data?.message || "Erreur lors de l'application des frais."
      );
    } finally {
      setInscriptionEnCours(null);
    }
  };

  // Paiement d'une echeance de scolarite prise isolement (Trimestre 2, 3...), en dehors du
  // formulaire d'inscription. Un seul recu, meme gabarit, une seule ligne.
  const enregistrerPaiement = async (e) => {
    e.preventDefault();
    setErreur(""); setSucces("");
    const fenetre = peutImprimer ? ouvrirFenetreVierge() : null;
    // Etat des echeances AVANT ce paiement, capture depuis le suivi tel qu'il etait au moment
    // du clic (pas depuis un rechargement post-paiement).
    const suiviAvant = suivi;
    try {
      const res = await api.post("/frais/paiements", {
        echeance_eleve_id: paiement.echeanceId,
        montant: paiement.montant,
        moyen_paiement: paiement.moyenPaiement,
        date_paiement: dateDuJour(),
      });
      const suiviMaj = await chargerSuivi(eleveSelectionne);
      setSucces("Paiement enregistré avec succès.");
      setPaiement(null);

      const { lignes, resteAPayer, estSolde } = detailPaiementScolarite(res.data, suiviAvant);

      const recu = {
        reference: res.data.reference || referenceLocale(res.data.id, res.data.date_paiement),
        eleve: eleveInfos,
        session: eleveInfos.inscription_active?.session_scolaire?.libelle || "—",
        lignes,
        total: Number(res.data.montant),
        estSolde,
        resteAPayer,
        moyen: MOYENS_PAIEMENT[res.data.moyen_paiement] || res.data.moyen_paiement,
        date: formaterDate(res.data.date_paiement),
        heure: formaterHeure(res.data.created_at),
        caissier: localStorage.getItem("user_name") || "",
        situationGlobale: situationGlobaleDepuisSuivi(suiviMaj),
        etablissement,
      };
      setDernierRecu(recu);
      if (peutImprimer && !genererEtImprimerRecu(recu, fenetre)) {
        setErreur(MESSAGE_POPUP_BLOQUE);
      }
    } catch (err) {
      fenetre?.close();
      setErreur(err.response?.data?.message || "Erreur lors de l'enregistrement du paiement.");
    }
  };

  // Chaque mot saisi doit se retrouver dans nom ou prenom (ordre libre) ; les suggestions
  // apparaissent des la premiere lettre tapee.
  const termes = normaliser(recherche).split(/\s+/).filter(Boolean);
  const elevesFiltres = eleves.filter((e) => {
    const cible = normaliser(`${e.nom} ${e.prenom} ${e.matricule}`);
    return termes.every((t) => cible.includes(t)) && (!filtreStatut || e.statut_paiement === filtreStatut);
  });
  const suggestions = termes.length > 0 ? elevesFiltres.slice(0, 6) : [];

  const choisirSuggestion = (eleve) => {
    setRecherche(`${eleve.nom} ${eleve.prenom}`);
    setAfficherSuggestions(false);
  };

  const selectionnerEleve = (e) => {
    setEleveInfos({ ...e, classe_id: e.classe_id ?? classeId });
    setFormInscription(null);
    setPaiement(null);
    chargerSuivi(e.id);
  };

  // Des que les eleves de la classe sont charges, ouvre l'eleve transmis par la navigation, une seule
  // fois ; l'etat de navigation est ensuite efface (un rechargement ne le reselectionne pas).
  useEffect(() => {
    if (!eleveAPreselectionner || chargementEleves || eleves.length === 0) return;
    const eleve = eleves.find((e) => String(e.id) === String(eleveAPreselectionner));
    setEleveAPreselectionner(null);
    navigate(location.pathname, { replace: true, state: null });
    if (eleve) selectionnerEleve(eleve);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eleves, chargementEleves, eleveAPreselectionner]);

  // Types "Inscription" / "Réinscription" retrouves par leur nom (les ids different d'un etablissement a l'autre)
  // et montant de la grille de la classe de l'eleve.
  const typeInscription = typesFrais.find((t) => normaliser(t.nom) === "inscription");
  const typeReinscription = typesFrais.find((t) => normaliser(t.nom) === "reinscription");
  const montantGrille = (type) => {
    if (!type || !eleveInfos) return null;
    const g = grillesExistantes.find(
      (x) => x.type_frais_id === type.id && String(x.classe_id) === String(eleveInfos.classe_id)
    );
    return g ? Number(g.montant) : null;
  };
  const libelleMontant = (montant) => (montant != null ? ` (${formaterGNF(montant)})` : "");

  // Frais d'inscription/reinscription de l'eleve selectionne (au plus un, cree par
  // appliquer-inscription), pour la carte "Frais d'inscription" de la colonne droite.
  const fraisInscription = (suivi?.frais || []).find((f) => normaliser(f.type_frais).includes("inscription"));

  // Echeances de scolarite encore dues, proposees dans le formulaire d'inscription/reinscription.
  const echeancesScolariteDisponibles = (suivi?.frais || [])
    .filter((f) => normaliser(f.type_frais).startsWith("scolarit"))
    .flatMap((f) => f.echeances)
    .filter((ech) => ech.solde > 0);

  const totalEncaisser = formInscription
    ? Number(formInscription.montantInscription || 0) + (formInscription.echeanceId ? Number(formInscription.montantEcheance || 0) : 0)
    : 0;

  // Frais a echeances de l'eleve : scolarite d'abord, puis les autres (cantine, transport...), puis
  // les arrieres des annees passees (payables ici, hors totaux de l'annee).
  const fraisAEcheances = [
    ...(suivi?.frais || [])
      .filter((f) => !normaliser(f.type_frais).includes("inscription"))
      .sort((a, b) => Number(!normaliser(a.type_frais).startsWith("scolarit")) - Number(!normaliser(b.type_frais).startsWith("scolarit"))),
    ...(suivi?.arrieres || []).map((f) => ({ ...f, type_frais: `Arriéré ${f.session} — ${f.type_frais}`, arriere: true })),
  ];
  const inscriptionReglee = !!fraisInscription?.echeances?.length && fraisInscription.echeances.every((e) => Number(e.solde) <= 0);
  const estAncien = eleveInfos?.inscription_active?.type_inscription === "reinscription" || eleveInfos?.inscription_reglee === "reinscription";
  const totalDuGlobal = (suivi?.frais || []).reduce((s, f) => s + f.echeances.reduce((t, e) => t + Number(e.montant), 0), 0);
  const totalPayeGlobal = (suivi?.frais || []).reduce((s, f) => s + f.echeances.reduce((t, e) => t + Number(e.montant_paye), 0), 0);
  const resteGlobal = Math.max(0, totalDuGlobal - totalPayeGlobal);
  const pctGlobal = totalDuGlobal > 0 ? Math.round((totalPayeGlobal / totalDuGlobal) * 100) : 0;

  // Export de la liste affichee (classe choisie ou toutes les classes) pour Excel.
  const exporter = () => {
    const nomClasse = classeId === "tous" ? "toutes-classes" : classes.find((c) => String(c.id) === String(classeId))?.nom || "classe";
    telechargerCsv(
      `suivi-paiements-${normaliser(nomClasse).replace(/[^a-z0-9]+/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Matricule", "Nom", "Prénom", "Classe", "Statut de paiement", "Inscription réglée"],
      elevesFiltres.map((e) => [
        e.matricule,
        e.nom,
        e.prenom,
        e.classe || "",
        statut(e.statut_paiement).libelle,
        e.inscription_reglee === "reinscription" ? "Réinscription" : e.inscription_reglee === "inscription" ? "Inscription" : "Non",
      ])
    );
  };

  // Inscription ou reinscription deja payee (au moins un versement) : les boutons Inscrire /
  // Réinscrire n'ont plus lieu d'etre, tant qu'un paiement de scolarite se fait autrement.
  const dejaInscrit = (suivi?.frais || []).some(
    (f) => normaliser(f.type_frais).includes("inscription") && f.echeances.some((ech) => Number(ech.montant_paye) > 0)
  );
  // Frais d'inscription / reinscription (fraisInscription, plus haut), payes ou non : annulables en
  // cas d'erreur ; tant qu'ils existent, Inscrire / Reinscrire ne sont pas proposes (refuses).
  const montantPayeInscription = fraisInscription ? fraisInscription.echeances.reduce((t, ech) => t + Number(ech.montant_paye || 0), 0) : 0;

  const confirmerAnnulationInscription = async () => {
    setAnnulInscription((a) => ({ ...a, envoi: true, erreur: "" }));
    try {
      const res = await api.post("/frais/annuler-inscription", { frais_eleve_id: annulInscription.frais.id, motif: annulInscription.motif.trim() });
      setAnnulInscription(null);
      await chargerSuivi(eleveSelectionne);
      setSucces(res.data.message);
      // L'eleve n'est plus compte inscrit : la liste et l'en-tete se mettent a jour sans recharger.
      setEleves((liste) => liste.map((e) => (e.id === eleveSelectionne ? { ...e, inscription_reglee: null } : e)));
      setEleveInfos((e) => (e ? { ...e, inscription_reglee: null } : e));
    } catch (err) {
      setAnnulInscription((a) => ({ ...a, envoi: false, erreur: err.response?.data?.message || "Annulation impossible." }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Banniere */}
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-7 text-white shadow-md" style={{ background: "linear-gradient(90deg, #0C447C, #1a6bb5)" }}>
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0 border border-white/20">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Frais de Scolarité & Facturation</h1>
              <p className="text-xs sm:text-sm text-white/70 font-medium mt-0.5">Suivi des paiements · Inscriptions · Grilles tarifaires</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/paiements")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 border border-white/20 text-white hover:bg-white/25 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
            >
              <History className="w-4 h-4" />
              Journal de caisse
            </button>
            {onglet === "suivi" && (
              <button
                type="button"
                onClick={exporter}
                disabled={eleves.length === 0}
                title={eleves.length === 0 ? "Choisissez d'abord une classe" : "Exporter la liste affichée (CSV pour Excel)"}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white text-white hover:bg-white/10 text-xs font-bold transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Exporter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-200/60 rounded-xl w-fit">
        {[
          { id: "suivi", libelle: "Suivi des paiements", icone: ClipboardList },
          { id: "grilles", libelle: "Grilles tarifaires", icone: Layers },
        ].map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setOnglet(o.id)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              onglet === o.id ? "bg-white text-[#0C447C] shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <o.icone className="w-3.5 h-3.5" />
            {o.libelle}
          </button>
        ))}
      </div>

      {erreur && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-600 font-medium">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {erreur}
        </div>
      )}
      {succes && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-600 font-medium">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {succes}
        </div>
      )}

      {/* Dernier recu : toujours reimprimable, jusqu'au paiement suivant. */}
      {peutImprimer && dernierRecu && onglet === "suivi" && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm" style={STYLE_CARTE}>
          <Printer className="h-4 w-4 shrink-0 text-[#0C447C]" />
          <span className="text-slate-600">
            Dernier reçu : <strong className="text-slate-800">{dernierRecu.eleve?.prenom} {dernierRecu.eleve?.nom}</strong>
            {" · "}<span className="tabular-nums font-semibold">{formaterGNF(dernierRecu.total)}</span>
            {" · "}{dernierRecu.date}{dernierRecu.heure ? ` à ${String(dernierRecu.heure).slice(0, 5)}` : ""}
            {dernierRecu.reference ? <span className="text-slate-400"> · {dernierRecu.reference}</span> : null}
          </span>
          <button
            onClick={() => { if (!genererEtImprimerRecu(dernierRecu)) setErreur(MESSAGE_POPUP_BLOQUE); }}
            className="ml-auto px-3 py-1.5 rounded-lg bg-[#0C447C] hover:bg-[#093663] text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Réimprimer le dernier reçu
          </button>
        </div>
      )}

      {onglet === "suivi" && (
        <div className="space-y-6">
          {/* 5 compteurs (cliquables = filtre de la liste) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {COMPTEURS.map((c) => {
              const valeur = c.id === "tous" ? eleves.length : eleves.filter((e) => e.statut_paiement === c.id).length;
              const choisi = (filtreStatut ?? "tous") === c.id;
              const pct = eleves.length ? Math.round((valeur / eleves.length) * 100) : 0;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setFiltreStatut(c.id === "tous" ? null : c.id)}
                  disabled={!classeId}
                  className={`bg-white p-4 text-left transition-all border relative group cursor-pointer disabled:cursor-default ${choisi && classeId ? `${c.anneau} shadow-md` : "border-slate-100/90 hover:shadow-md"}`}
                  style={STYLE_CARTE}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <span className={`w-9 h-9 rounded-xl ${c.fond} flex items-center justify-center ${c.couleur} transition-transform group-hover:scale-105`}>
                      <c.icone className="w-5 h-5" />
                    </span>
                    <span className="text-xs text-slate-400 font-medium tabular-nums">{classeId && !chargementEleves ? `${pct}%` : ""}</span>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 tracking-tight tabular-nums mb-0.5">{classeId && !chargementEleves ? valeur : "—"}</div>
                  <div className="text-xs font-semibold text-slate-700 truncate">{c.libelle}</div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">{c.detail}</div>
                </button>
              );
            })}
          </div>

          {/* Liste plus large que dans la maquette (3/10) : ici la barre laterale prend deja 240 px. */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Liste des eleves */}
            <div className="lg:col-span-5 xl:col-span-4 bg-white p-4 flex flex-col lg:h-[78vh] border border-slate-100/80" style={STYLE_CARTE}>
              <div className="space-y-3 pb-3.5 border-b border-slate-100 shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <select
                    value={classeId}
                    onChange={(e) => {
                      setClasseId(e.target.value);
                      setRecherche("");
                      setFiltreStatut(null);
                    }}
                    aria-label="Filtrer par classe"
                    className="flex-1 min-w-0 bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0C447C]/20 focus:border-[#0C447C] cursor-pointer"
                  >
                    <option value="tous">Toutes les classes</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.nom}</option>
                    ))}
                  </select>
                  {classeId && (
                    <span className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-blue-50 text-[#0C447C] text-[11px] font-bold shrink-0 border border-blue-100">
                      {elevesFiltres.length} élève{elevesFiltres.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom, prénom ou matricule..."
                    value={recherche}
                    disabled={!classeId}
                    onChange={(e) => {
                      setRecherche(e.target.value);
                      setAfficherSuggestions(true);
                    }}
                    onFocus={() => setAfficherSuggestions(true)}
                    // Delai pour laisser le clic sur une suggestion se faire avant de fermer la liste
                    onBlur={() => setTimeout(() => setAfficherSuggestions(false), 200)}
                    autoComplete="off"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl pl-8 pr-7 py-2 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0C447C]/20 focus:border-[#0C447C] disabled:cursor-not-allowed"
                  />
                  {recherche && (
                    <button onClick={() => setRecherche("")} className="text-xs text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer">
                      ×
                    </button>
                  )}
                  {afficherSuggestions && suggestions.length > 0 && (
                    <ul className="absolute left-0 right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                      {suggestions.map((e) => (
                        <li key={e.id}>
                          <button type="button" onClick={() => choisirSuggestion(e)} className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-blue-50 transition-colors cursor-pointer">
                            {e.nom} {e.prenom}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {filtreStatut && (
                  <button onClick={() => setFiltreStatut(null)} className="text-[11px] font-semibold text-[#0C447C] hover:underline cursor-pointer">
                    Filtre : {statut(filtreStatut).libelle} · retirer
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 mt-1 pr-1 max-h-[60vh] lg:max-h-none">
                {!classeId && <p className="text-xs text-slate-400 text-center px-3 py-10">Choisissez une classe pour afficher ses élèves.</p>}
                {classeId && chargementEleves && <p className="text-xs text-slate-400 text-center px-3 py-10">Chargement...</p>}
                {classeId && !chargementEleves && elevesFiltres.length === 0 && (
                  <div className="py-10 text-center">
                    <p className="text-xs font-semibold text-slate-500">Aucun élève trouvé</p>
                    <p className="text-[11px] text-slate-400 mt-1">Modifiez la recherche ou le filtre</p>
                  </div>
                )}
                {classeId &&
                  !chargementEleves &&
                  elevesFiltres.map((e) => {
                    const choisi = eleveSelectionne === e.id;
                    const st = statut(e.statut_paiement);
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => selectionnerEleve(e)}
                        className={`w-full text-left p-3 rounded-xl flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                          choisi ? "bg-[#eff6ff] border-l-[3px] border-[#0C447C]" : "hover:bg-[#f8fafc]"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-[38px] h-[38px] rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${couleurAvatar(`${e.nom}${e.prenom}`)}`}>
                            {getInitiales(e.nom, e.prenom)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[13px] font-bold text-slate-900 truncate leading-snug">
                              {e.nom} {e.prenom}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                              <span className="text-[10px] text-slate-500 font-semibold whitespace-nowrap tabular-nums">{e.matricule}</span>
                              {classeId === "tous" && e.classe && (
                                <>
                                  <span className="text-[10px] text-slate-400">·</span>
                                  <span className="text-[10px] font-medium text-slate-500 truncate">{e.classe}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${st.badge}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {st.libelle}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Detail de l'eleve */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-6">
              {!eleveInfos && (
                <div className="bg-white p-12 flex flex-col items-center justify-center text-center lg:h-[78vh] border border-slate-100/80" style={STYLE_CARTE}>
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0C447C] mb-4">
                    <GraduationCap className="w-8 h-8 opacity-80" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 mb-1">Aucun élève sélectionné</h3>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Sélectionnez un élève dans la liste pour consulter son dossier financier, suivre ses échéances et enregistrer des encaissements.
                  </p>
                </div>
              )}

              {eleveInfos && (
                <>
                  {/* 1. En-tete de l'eleve */}
                  <div className="bg-white p-5 border border-slate-100/90" style={STYLE_CARTE}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-[52px] h-[52px] rounded-2xl flex items-center justify-center text-white text-base font-extrabold shadow-sm shrink-0 ${couleurAvatar(`${eleveInfos.nom}${eleveInfos.prenom}`)}`}>
                          {getInitiales(eleveInfos.nom, eleveInfos.prenom)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                              {eleveInfos.nom} {eleveInfos.prenom}
                            </h2>
                            {eleveInfos.classe && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0C447C]/10 text-[#0C447C] border border-[#0C447C]/20">{eleveInfos.classe}</span>
                            )}
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${statut(eleveInfos.statut_paiement).badge}`}>
                              {statut(eleveInfos.statut_paiement).libelle}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                            <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded tabular-nums">{eleveInfos.matricule}</span>
                            {eleveInfos.inscription_active?.session_scolaire?.libelle && <span>Session {eleveInfos.inscription_active.session_scolaire.libelle}</span>}
                            <span>{estAncien ? "Ancien élève" : "Nouvel élève"}</span>
                          </div>
                        </div>
                      </div>

                      {peutPayer && fraisInscription && (
                        <button
                          type="button"
                          onClick={() => setAnnulInscription({ frais: fraisInscription, motif: "", envoi: false, erreur: "" })}
                          className="px-4 py-2 text-xs font-bold rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          Annuler la {normaliser(fraisInscription.type_frais).startsWith("re") ? "réinscription" : "inscription"}
                        </button>
                      )}

                      {peutInscrire && !dejaInscrit && !fraisInscription && (
                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          <button
                            type="button"
                            disabled={inscriptionEnCours !== null}
                            onClick={() => ouvrirFormulaireInscription(false)}
                            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                              !estAncien ? "bg-[#0C447C] hover:bg-[#093663] text-white shadow-xs" : "border border-[#0C447C] text-[#0C447C] hover:bg-[#0C447C]/5"
                            }`}
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            Inscrire{libelleMontant(montantGrille(typeInscription))}
                          </button>
                          <button
                            type="button"
                            disabled={inscriptionEnCours !== null}
                            onClick={() => ouvrirFormulaireInscription(true)}
                            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                              estAncien ? "bg-[#0C447C] hover:bg-[#093663] text-white shadow-xs" : "border border-[#0C447C] text-[#0C447C] hover:bg-[#0C447C]/5"
                            }`}
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            Réinscrire{libelleMontant(montantGrille(typeReinscription))}
                          </button>
                        </div>
                      )}
                    </div>

                    {formInscription && (
                      <form onSubmit={confirmerInscription} className="mt-4 p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-extrabold text-[#0C447C] uppercase tracking-wider">
                            {formInscription.reinscription ? "Réinscription" : "Inscription"} · encaissement
                          </p>
                          <span className="text-[11px] text-slate-500">Reçu imprimé à l'enregistrement</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className={LABEL}>Montant {formInscription.reinscription ? "réinscription" : "inscription"} (GNF)</label>
                            <input
                              type="number"
                              min="1"
                              value={formInscription.montantInscription}
                              onChange={(e) => setFormInscription({ ...formInscription, montantInscription: e.target.value })}
                              placeholder={montantGrille(formInscription.reinscription ? typeReinscription : typeInscription)?.toString() || "Saisir le montant"}
                              className={CHAMP}
                              required
                            />
                          </div>
                          <div>
                            <label className={LABEL}>Moyen de paiement</label>
                            <SelecteurMoyen valeur={formInscription.moyenPaiement} onChange={(m) => setFormInscription({ ...formInscription, moyenPaiement: m })} />
                          </div>
                        </div>

                        <div className="pt-3 border-t border-blue-100">
                          <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">Paiement de scolarité en même temps (optionnel)</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className={LABEL}>Échéance</label>
                              <select
                                value={formInscription.echeanceId}
                                onChange={(e) => setFormInscription({ ...formInscription, echeanceId: e.target.value, montantEcheance: "" })}
                                className={CHAMP}
                              >
                                <option value="">Aucune</option>
                                {echeancesScolariteDisponibles.map((ech) => (
                                  <option key={ech.id} value={ech.id}>
                                    {ech.libelle} — reste {formaterGNF(ech.solde)}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className={LABEL}>Montant scolarité (GNF)</label>
                              <input
                                type="number"
                                min="1"
                                max={formInscription.echeanceId ? resteTotalDuFrais(suivi, formInscription.echeanceId) : undefined}
                                disabled={!formInscription.echeanceId}
                                required={!!formInscription.echeanceId}
                                value={formInscription.montantEcheance}
                                onChange={(e) => setFormInscription({ ...formInscription, montantEcheance: e.target.value })}
                                className={`${CHAMP} disabled:opacity-50`}
                              />
                            </div>
                          </div>
                          {formInscription.echeanceId && (
                            <p className="text-[11px] text-slate-400 mt-2">
                              Un montant supérieur à l'échéance est reporté sur les tranches suivantes (jusqu'à {formaterGNF(resteTotalDuFrais(suivi, formInscription.echeanceId))}).
                            </p>
                          )}
                          {echeancesScolariteDisponibles.length === 0 && <p className="text-[11px] text-slate-400 mt-2">Aucune échéance de scolarité en attente pour cet élève.</p>}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-blue-100">
                          <div>
                            <span className="text-[11px] font-bold text-slate-500 uppercase">Total à encaisser</span>
                            <p className="text-lg font-extrabold text-[#0C447C] tabular-nums">{formaterGNF(totalEncaisser)}</p>
                          </div>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => setFormInscription(null)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-white border border-slate-200 cursor-pointer">
                              Annuler
                            </button>
                            <button
                              type="submit"
                              disabled={inscriptionEnCours !== null}
                              className="px-4 py-2 bg-[#0C447C] hover:bg-[#093663] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              {inscriptionEnCours ? "Enregistrement..." : "Enregistrer et imprimer le reçu"}
                            </button>
                          </div>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* 2. Frais d'inscription */}
                  {fraisInscription ? (
                    <div className="bg-white p-4 border border-slate-100/90" style={STYLE_CARTE}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${inscriptionReglee ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                            {normaliser(fraisInscription.type_frais) === "reinscription" ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                          </span>
                          <div>
                            <span className="text-sm font-bold text-slate-900">Frais de {fraisInscription.type_frais}</span>
                            <div className="text-xs text-slate-500 mt-0.5">
                              Montant : <strong className="text-slate-800 tabular-nums">{formaterGNF(fraisInscription.montant_total)}</strong>
                            </div>
                          </div>
                        </div>
                        {fraisInscription.echeances[0] && (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${statut(calculerStatutEcheance(fraisInscription.echeances[0])).badge}`}>
                            {inscriptionReglee ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                            {inscriptionReglee
                              ? "Réglé"
                              : `${formaterGNF(fraisInscription.echeances[0].montant_paye)} / ${formaterGNF(fraisInscription.echeances[0].montant)}`}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    suivi && (
                      <div className="p-4 rounded-2xl border bg-[#eff6ff] border-[#bfdbfe]">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-blue-600 text-white">
                              {estAncien ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                            </span>
                            <div>
                              <span className="text-sm font-bold text-slate-900">{estAncien ? "Frais de réinscription" : "Frais d'inscription"}</span>
                              <div className="text-xs text-slate-500 mt-0.5">
                                {montantGrille(estAncien ? typeReinscription : typeInscription) != null
                                  ? <>Tarif de la classe : <strong className="text-slate-800 tabular-nums">{formaterGNF(montantGrille(estAncien ? typeReinscription : typeInscription))}</strong></>
                                  : "Aucun tarif défini pour cette classe"}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Non réglé
                            </span>
                            {peutInscrire && !formInscription && (
                              <button
                                type="button"
                                onClick={() => ouvrirFormulaireInscription(estAncien)}
                                className="px-3 py-1 bg-[#0C447C] text-white text-xs font-bold rounded-lg hover:bg-[#093663] transition-colors cursor-pointer"
                              >
                                Régler
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  )}

                  {/* 3. Frais a echeances (scolarite, puis autres) */}
                  {fraisAEcheances.map((f) => {
                    const cfg = configTypeFrais(f.type_frais);
                    return (
                      <div key={f.id} className="bg-white p-5 border border-slate-100/90" style={STYLE_CARTE}>
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4 gap-3">
                          <div className="flex items-center gap-3">
                            <span className="w-10 h-10 rounded-xl bg-blue-50 text-[#0C447C] flex items-center justify-center">
                              <GraduationCap className="w-5 h-5" />
                            </span>
                            <div>
                              <h3 className="text-sm font-extrabold text-slate-900">Frais de {f.type_frais}</h3>
                              <p className="text-xs text-slate-400">
                                Paiement échelonné en {f.echeances.length} échéance{f.echeances.length > 1 ? "s" : ""}
                              </p>
                            </div>
                          </div>
                          <span className={`inline-block px-3 py-1 rounded-xl text-xs tabular-nums font-bold ${cfg.classe}`}>{formaterGNF(f.montant_total)}</span>
                        </div>

                        <div className="space-y-3">
                          {f.echeances.map((ech) => {
                            const cle = calculerStatutEcheance(ech);
                            const st = statut(cle);
                            const progression = Number(ech.montant) > 0 ? Math.min(100, Math.round((Number(ech.montant_paye) / Number(ech.montant)) * 100)) : 0;
                            const ouvert = paiement?.echeanceId === ech.id;
                            return (
                              <div key={ech.id} className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                  <div className="sm:min-w-44">
                                    <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                                      {ech.libelle}
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${st.badge}`}>{st.libelle}</span>
                                    </div>
                                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                      <Calendar className="w-3 h-3" />
                                      Date limite : {formaterDateCourte(ech.date_limite)}
                                    </div>
                                  </div>
                                  <div className="flex-1 sm:max-w-md sm:px-2">
                                    <div className="flex items-center justify-between text-xs mb-1.5 tabular-nums">
                                      <span className="font-bold text-slate-800 tabular-nums">{formaterGNF(ech.montant_paye)}</span>
                                      <span className="text-slate-400 tabular-nums">sur {formaterGNF(ech.montant)}</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full transition-all duration-300 ${st.barre}`} style={{ width: `${cle === "en_retard" && progression === 0 ? 100 : progression}%`, opacity: cle === "en_retard" && progression === 0 ? 0.35 : 1 }} />
                                    </div>
                                  </div>
                                  <div className="shrink-0 text-right">
                                    {ech.solde > 0 ? (
                                      peutPayer && (
                                        <button
                                          type="button"
                                          onClick={() => (ouvert ? setPaiement(null) : ouvrirFormulairePaiement(ech))}
                                          className="px-3.5 py-1.5 bg-[#0C447C] hover:bg-[#093663] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                                        >
                                          {ouvert ? "Fermer" : "Payer"}
                                          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${ouvert ? "rotate-90" : ""}`} />
                                        </button>
                                      )
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        Soldé
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {ouvert && (
                                  <form onSubmit={enregistrerPaiement} className="mt-3 pt-3 border-t border-slate-200 space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div>
                                        <label className={LABEL}>Montant encaissé (GNF)</label>
                                        <input
                                          type="number"
                                          min="1"
                                          max={resteTotalDuFrais(suivi, paiement.echeanceId)}
                                          value={paiement.montant}
                                          onChange={(e) => setPaiement({ ...paiement, montant: e.target.value })}
                                          placeholder={`Reste : ${Number(ech.solde).toLocaleString("fr-FR")}`}
                                          className={CHAMP}
                                          required
                                        />
                                        <div className="flex gap-1.5 mt-1.5">
                                          <button type="button" onClick={() => setPaiement({ ...paiement, montant: String(ech.solde) })} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">
                                            Solde de l'échéance
                                          </button>
                                          <button type="button" onClick={() => setPaiement({ ...paiement, montant: String(resteTotalDuFrais(suivi, paiement.echeanceId)) })} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">
                                            Tout le reste
                                          </button>
                                        </div>
                                      </div>
                                      <div>
                                        <label className={LABEL}>Moyen de paiement</label>
                                        <SelecteurMoyen valeur={paiement.moyenPaiement} onChange={(m) => setPaiement({ ...paiement, moyenPaiement: m })} />
                                      </div>
                                    </div>
                                    <p className="text-[11px] text-slate-400">
                                      Un montant supérieur à l'échéance est reporté sur les tranches suivantes (jusqu'à {formaterGNF(resteTotalDuFrais(suivi, paiement.echeanceId))}).
                                    </p>
                                    <div className="flex justify-end gap-2">
                                      <button type="button" onClick={() => setPaiement(null)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-white border border-slate-200 cursor-pointer">
                                        Annuler
                                      </button>
                                      <button type="submit" className="px-4 py-2 bg-[#0C447C] hover:bg-[#093663] text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5">
                                        <Receipt className="w-3.5 h-3.5" />
                                        Enregistrer et imprimer le reçu
                                      </button>
                                    </div>
                                  </form>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {suivi && fraisAEcheances.length === 0 && (
                    <div className="bg-white p-8 text-center border border-slate-100/90" style={STYLE_CARTE}>
                      <p className="text-sm font-semibold text-slate-600">Aucun frais de scolarité appliqué à cet élève</p>
                      <p className="text-xs text-slate-400 mt-1">Créez ou synchronisez la grille tarifaire de sa classe dans l'onglet Grilles tarifaires.</p>
                    </div>
                  )}

                  {/* 4. Situation financiere globale */}
                  {suivi && suivi.frais.length > 0 && (
                    <div className="bg-white p-5 border border-slate-100/90" style={STYLE_CARTE}>
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 gap-3">
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Situation financière globale</h3>
                          <p className="text-xs text-slate-400">Synthèse de tous les frais de l'élève</p>
                        </div>
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg shrink-0 tabular-nums">Progression : {pctGlobal}%</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-5">
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Total dû</span>
                          <div className="text-xl font-extrabold text-slate-900 tabular-nums">{formaterGNF(totalDuGlobal)}</div>
                          <span className="text-[11px] text-slate-400">Tous frais confondus</span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-[#dcfce7]/60 border border-[#bbf7d0]">
                          <span className="text-[11px] font-bold text-[#15803d] uppercase tracking-wider block mb-1">Total encaissé</span>
                          <div className="text-xl font-extrabold text-[#15803d] tabular-nums">{formaterGNF(totalPayeGlobal)}</div>
                          <span className="text-[11px] text-[#15803d]/70 font-medium">Paiements enregistrés</span>
                        </div>
                        <div className={`p-3.5 rounded-xl border ${resteGlobal > 0 ? "bg-amber-50/70 border-amber-200" : "bg-emerald-50/50 border-emerald-200"}`}>
                          <span className={`text-[11px] font-bold uppercase tracking-wider block mb-1 ${resteGlobal > 0 ? "text-amber-800" : "text-emerald-800"}`}>Reste à percevoir</span>
                          <div className={`text-xl font-extrabold tabular-nums ${resteGlobal > 0 ? "text-amber-700" : "text-emerald-700"}`}>{formaterGNF(resteGlobal)}</div>
                          <span className="text-[11px] text-slate-400">{resteGlobal === 0 ? "Tout est réglé" : "Échéances en cours"}</span>
                        </div>
                      </div>

                      {suivi.montant_arrieres > 0 && (
                        <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900">
                          <strong>Arriéré des années passées : {formaterGNF(suivi.montant_arrieres)}</strong>
                          {" "}({suivi.arrieres.map((f) => `${f.type_frais} ${f.session}`).join(", ")}). Non compris dans les totaux de l'année ci-dessus ; payable dans les frais à échéances.
                        </div>
                      )}

                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <div className="bg-slate-50 px-4 py-2.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider grid grid-cols-12 gap-2 border-b border-slate-200">
                          <span className="col-span-4">Rubrique</span>
                          <span className="col-span-3 text-right">Montant dû</span>
                          <span className="col-span-3 text-right">Montant réglé</span>
                          <span className="col-span-2 text-right">Statut</span>
                        </div>
                        <div className="divide-y divide-slate-100 text-xs">
                          {suivi.frais.map((f, i) => {
                            const paye = f.echeances.reduce((s, e) => s + Number(e.montant_paye), 0);
                            const du = f.echeances.reduce((s, e) => s + Number(e.montant), 0);
                            const st = statut(statutFrais(f));
                            return (
                              <div key={f.id} className={`px-4 py-3 grid grid-cols-12 gap-2 items-center ${i % 2 ? "bg-slate-50/40" : ""}`}>
                                <div className="col-span-4 font-semibold text-slate-800">
                                  {f.type_frais}
                                  {f.echeances.length > 1 && <span className="text-slate-400 font-normal"> ({f.echeances.length} échéances)</span>}
                                </div>
                                <div className="col-span-3 text-right text-slate-700 tabular-nums">{formaterGNF(du)}</div>
                                <div className="col-span-3 text-right font-bold text-emerald-700 tabular-nums">{formaterGNF(paye)}</div>
                                <div className="col-span-2 text-right">
                                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${st.badge}`}>{st.libelle}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {onglet === "grilles" && (
        <GrillesTarifaires
          classes={classes}
          typesFrais={typesFrais}
          grilles={grillesExistantes}
          peutCreer={peutInscrire}
          onGrillesModifiees={chargerGrilles}
          onTypesModifies={chargerTypes}
          onMessage={(type, texte) => {
            setErreur(type === "erreur" ? texte : "");
            setSucces(type === "succes" ? texte : "");
          }}
        />
      )}
      {annulInscription && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-4" onClick={() => !annulInscription.envoi && setAnnulInscription(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <span className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0"><AlertTriangle className="w-5 h-5" /></span>
              <div>
                <h3 className="text-base font-bold text-slate-900">Annuler la {normaliser(annulInscription.frais.type_frais).startsWith("re") ? "réinscription" : "inscription"} ?</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {eleveInfos ? `${eleveInfos.nom} ${eleveInfos.prenom} · ` : ""}{annulInscription.frais.type_frais} · payé {montantPayeInscription.toLocaleString("fr-FR")} GNF
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Les paiements de ces frais sont annulés (ils restent visibles, barrés, dans le Journal de caisse) puis les frais sont retirés de l'élève.
              Vous pourrez ensuite l'inscrire ou le réinscrire correctement. L'opération est gardée dans l'historique de l'élève.
            </p>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Motif de l'annulation *</label>
              <input
                autoFocus
                value={annulInscription.motif}
                onChange={(e) => setAnnulInscription((a) => ({ ...a, motif: e.target.value }))}
                placeholder="Ex : inscrit au lieu de réinscrit, mauvais élève…"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400"
              />
            </div>
            {annulInscription.erreur && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">{annulInscription.erreur}</div>}
            <div className="flex items-center justify-end gap-3 pt-1">
              <button type="button" onClick={() => setAnnulInscription(null)} disabled={annulInscription.envoi} className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">Retour</button>
              <button
                type="button"
                onClick={confirmerAnnulationInscription}
                disabled={annulInscription.envoi || annulInscription.motif.trim().length < 3}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Ban className="w-4 h-4" />
                {annulInscription.envoi ? "Annulation…" : "Confirmer l'annulation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
