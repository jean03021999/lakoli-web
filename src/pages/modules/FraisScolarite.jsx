import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  Plus,
  RefreshCw,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  Users,
  Tag,
  FileSpreadsheet,
  School,
  Receipt,
  Search,
} from "lucide-react";
import { Card, Button, Input, Select, Badge } from "../../components/ui/LakoliDesignSystem";
import { calculerStatutEcheance, STATUTS_ECHEANCE } from "../../constants/statutEcheance";
import { formaterDate, formaterHeure, referenceLocale, genererEtImprimerRecu, ouvrirFenetreVierge, MOYENS_PAIEMENT } from "../../utils/impression";

function getInitiales(nom, prenom) {
  return `${nom?.[0] || ""}${prenom?.[0] || ""}`.toUpperCase();
}

function badgeStatutEcheance(ech) {
  const statut = STATUTS_ECHEANCE[calculerStatutEcheance(ech)];
  return <Badge variant="neutral" className={statut.badge}>{statut.libelle}</Badge>;
}

function formaterGNF(montant) {
  return `${Number(montant).toLocaleString("fr-FR")} GNF`;
}

// Minuscules et sans accents, pour que "aminata" trouve "Aminata" et "helene" trouve "Hélène".
function normaliser(texte) {
  return (texte || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// Situation globale de l'eleve (inscription + toutes les echeances de scolarite), envoyee au
// recu pour que le caissier voie d'un coup d'oeil ce qui reste du sur l'annee. `suivi` doit
// etre le suivi rechargé APRES le paiement (chargerSuivi renvoie les donnees a jour).
function situationGlobaleDepuisSuivi(suivi) {
  if (!suivi) return null;

  const echeancesScolarite = (suivi.frais || [])
    .filter((f) => normaliser(f.type_frais).startsWith("scolarit"))
    .flatMap((f) => f.echeances);
  const totalScolarite = echeancesScolarite.reduce((s, e) => s + Number(e.montant), 0);
  const totalPaye = echeancesScolarite.reduce((s, e) => s + Number(e.montant_paye), 0);
  const echeances = echeancesScolarite.map((e) => ({
    libelle: e.libelle,
    montant: Number(e.montant),
    montant_paye: Number(e.montant_paye),
    reste: Math.max(0, Number(e.montant) - Number(e.montant_paye)),
    statut: STATUTS_ECHEANCE[calculerStatutEcheance(e)].libelle,
  }));

  const fraisInscription = (suivi.frais || []).find((f) => normaliser(f.type_frais).includes("inscription"));
  const echInscription = fraisInscription?.echeances?.[0];
  const inscription = fraisInscription
    ? {
        libelle: fraisInscription.type_frais,
        montant: Number(echInscription?.montant || 0),
        montant_paye: Number(echInscription?.montant_paye || 0),
        statut:
          Number(echInscription?.montant_paye || 0) > 0 && Number(echInscription?.montant_paye || 0) >= Number(echInscription?.montant || 0)
            ? "Payé"
            : "Non payé",
      }
    : null;

  return {
    totalScolarite,
    totalPaye,
    resteGlobal: totalScolarite - totalPaye,
    echeances,
    inscription,
  };
}

// Reste a payer sur l'ensemble du frais (toutes tranches) auquel appartient l'echeance : c'est le
// plafond d'un versement, le surplus au-dela de l'echeance etant reporte sur les tranches suivantes.
function resteTotalDuFrais(suivi, echeanceId) {
  const frais = (suivi?.frais || []).find((f) => f.echeances.some((e) => String(e.id) === String(echeanceId)));
  return (frais?.echeances || []).reduce((s, e) => s + Math.max(0, Number(e.solde)), 0);
}

// Lignes du recu (une par tranche touchee) et reste a payer sur ces tranches, a partir du detail
// renvoye par POST /frais/paiements et de l'etat des echeances AVANT le paiement (suivi au clic).
function detailPaiementScolarite(resPaiement, suiviAvant) {
  const echeancesAvant = (suiviAvant?.frais || []).flatMap((f) => f.echeances);
  const details = resPaiement.paiements || [];
  const lignes = details.map((p) => ({ libelle: `Scolarité - ${p.libelle}`, montant: Number(p.montant) }));
  const resteAPayer = details.reduce((s, p) => {
    const avant = echeancesAvant.find((e) => String(e.id) === String(p.echeance_eleve_id));
    return s + (avant ? Math.max(0, Number(avant.montant) - Number(avant.montant_paye) - Number(p.montant)) : 0);
  }, 0);
  return { lignes, resteAPayer, estSolde: resteAPayer <= 0 };
}

// Statut de paiement global de l'eleve (Eleve::statut_paiement cote backend), affiche en pastille
// coloree dans la liste — memes couleurs que le badge d'echeance pour rester coherent.
const STATUTS_PAIEMENT_ELEVE = {
  a_jour: { libelle: "À jour", dot: "bg-emerald-500", texte: "text-emerald-600" },
  partiel: { libelle: "Partiel", dot: "bg-orange-500", texte: "text-orange-600" },
  a_echoir: { libelle: "À échoir", dot: "bg-slate-400", texte: "text-slate-500" },
  en_retard: { libelle: "En retard", dot: "bg-rose-500", texte: "text-rose-600" },
};

// Memorise la classe choisie pour la retrouver au retour sur la page.
const CLE_CLASSE_FILTRE = "frais_classe_filtre";

function lireClasseFiltre() {
  try {
    return sessionStorage.getItem(CLE_CLASSE_FILTRE) || "";
  } catch {
    return "";
  }
}

const MESSAGE_POPUP_BLOQUE =
  "Le navigateur a bloqué la fenêtre du reçu. Autorisez les pop-ups pour ce site, puis cliquez sur « Réimprimer le reçu ».";

export default function FraisScolarite({ permissions = [] }) {
  const peutInscrire = permissions.includes("frais.creer");
  const peutImprimer = permissions.includes("frais.voir");

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
  const [chargementEleves, setChargementEleves] = useState(false);
  const [eleveSelectionne, setEleveSelectionne] = useState(null);

  // Colonne droite : detail de l'eleve selectionne.
  const [eleveInfos, setEleveInfos] = useState(null);
  const [suivi, setSuivi] = useState(null);
  const [typesFrais, setTypesFrais] = useState([]);
  const [inscriptionEnCours, setInscriptionEnCours] = useState(null);
  const [dernierRecu, setDernierRecu] = useState(null);

  // Formulaire d'inscription / reinscription (bouton d'en-tete).
  const [formInscription, setFormInscription] = useState(null);
  // Formulaire de paiement d'une echeance de scolarite prise isolement (bouton "Payer").
  const [paiement, setPaiement] = useState(null);

  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");

  // Onglet Grilles tarifaires : etat et logique conserves a l'identique.
  const [nouveauType, setNouveauType] = useState("");
  const [grille, setGrille] = useState({ classe_id: "", type_frais_id: "", montant: "" });
  const [echeances, setEcheances] = useState([{ libelle: "Trimestre 1", montant: "", date_limite: "" }]);
  const [grillesExistantes, setGrillesExistantes] = useState([]);
  const [synchronisationEnCours, setSynchronisationEnCours] = useState(null);

  useEffect(() => {
    api.get("/classes").then((res) => setClasses(res.data));
    api.get("/frais/types").then((res) => setTypesFrais(res.data));
    chargerGrilles();
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(CLE_CLASSE_FILTRE, classeId);
    } catch {
      // stockage indisponible (navigation privee...) : le filtre reste simplement non memorise
    }
  }, [classeId]);

  // Une classe supprimee depuis la derniere visite ne doit pas rester selectionnee.
  useEffect(() => {
    if (classeId && classes.length > 0 && !classes.some((c) => String(c.id) === String(classeId))) {
      setClasseId("");
    }
  }, [classes, classeId]);

  // Les eleves ne sont charges que pour la classe choisie (pas toute l'ecole d'un coup).
  useEffect(() => {
    if (!classeId) {
      setEleves([]);
      setChargementEleves(false);
      return;
    }

    let annule = false;
    setChargementEleves(true);
    setErreur("");
    api
      .get("/eleves", { params: { classe_id: classeId } })
      .then((res) => {
        if (!annule) setEleves(res.data.eleves);
      })
      .catch(() => {
        if (!annule) {
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
  }, [classeId]);

  const chargerGrilles = async () => {
    try {
      const res = await api.get("/frais/grilles");
      setGrillesExistantes(res.data);
    } catch (err) {
      setGrillesExistantes([]);
    }
  };

  const synchroniserGrille = async (id) => {
    setSynchronisationEnCours(id);
    setErreur(""); setSucces("");
    try {
      const res = await api.post(`/frais/grilles/${id}/synchroniser`);
      setSucces(res.data.message);
      chargerGrilles();
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur lors de la synchronisation.");
    } finally {
      setSynchronisationEnCours(null);
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

  const ajouterTypeFrais = async (e) => {
    e.preventDefault();
    try {
      await api.post("/frais/types", { nom: nouveauType });
      setNouveauType("");
      const res = await api.get("/frais/types");
      setTypesFrais(res.data);
    } catch (err) { setErreur("Erreur lors de l'ajout du type de frais."); }
  };

  const ajouterEcheance = () => setEcheances([...echeances, { libelle: "", montant: "", date_limite: "" }]);
  const modifierEcheance = (i, champ, valeur) => {
    const copie = [...echeances];
    copie[i][champ] = valeur;
    setEcheances(copie);
  };

  const creerGrille = async (e) => {
    e.preventDefault();
    setErreur(""); setSucces("");
    try {
      await api.post("/frais/grilles", { ...grille, echeances });
      setSucces("Grille tarifaire créée et appliquée aux élèves de la classe.");
      setGrille({ classe_id: "", type_frais_id: "", montant: "" });
      setEcheances([{ libelle: "Trimestre 1", montant: "", date_limite: "" }]);
      chargerGrilles();
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur lors de la création de la grille.");
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
    const cible = normaliser(`${e.nom} ${e.prenom}`);
    return termes.every((t) => cible.includes(t));
  });
  const suggestions = termes.length > 0 ? elevesFiltres.slice(0, 6) : [];

  const choisirSuggestion = (eleve) => {
    setRecherche(`${eleve.nom} ${eleve.prenom}`);
    setAfficherSuggestions(false);
  };

  const selectionnerEleve = (e) => {
    setEleveInfos({ ...e, classe_id: classeId });
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

  // Inscription ou reinscription deja payee (au moins un versement) : les boutons Inscrire /
  // Réinscrire n'ont plus lieu d'etre, tant qu'un paiement de scolarite se fait autrement.
  const dejaInscrit = (suivi?.frais || []).some(
    (f) => normaliser(f.type_frais).includes("inscription") && f.echeances.some((ech) => Number(ech.montant_paye) > 0)
  );

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6 flex items-center justify-center gap-4" style={{ background: "linear-gradient(135deg, #0C447C, #1a5a9e)" }}>
        <div
          className="absolute -top-8 -right-8 h-32 w-32 rounded-full pointer-events-none"
          style={{ background: "rgba(255,255,255,0.08)" }}
        />
        <div
          className="absolute -bottom-10 right-16 h-20 w-20 rounded-full pointer-events-none"
          style={{ background: "rgba(255,255,255,0.06)" }}
        />
        <div
          className="h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 relative z-10"
          style={{ background: "rgba(255,255,255,0.15)", boxShadow: "0 8px 20px rgba(0,0,0,0.15)" }}
        >
          <Wallet className="h-7 w-7 text-white" />
        </div>
        <div className="relative z-10 min-w-0 text-center">
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Frais de Scolarité & Facturation</h1>
          <p className="text-xs sm:text-sm text-white/70 mt-1 max-w-2xl mx-auto">
            Suivez les paiements des élèves et gérez les grilles tarifaires de l'établissement.
          </p>
        </div>
      </div>

      <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setOnglet("suivi")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            onglet === "suivi" ? "bg-white text-[#0C447C] shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Wallet className="h-3.5 w-3.5" />
          Suivi des paiements
        </button>
        <button
          onClick={() => setOnglet("grilles")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            onglet === "grilles" ? "bg-white text-[#0C447C] shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          Grilles tarifaires
        </button>
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
          {peutImprimer && dernierRecu && (
            <button
              onClick={() => genererEtImprimerRecu(dernierRecu)}
              className="ml-auto px-3 py-1 rounded-lg border border-emerald-200 bg-white text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              Réimprimer le reçu
            </button>
          )}
        </div>
      )}

      {onglet === "suivi" && (
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Colonne gauche (~30%) */}
          <div className="lg:w-[30%] shrink-0 space-y-3">
            <Select
              value={classeId}
              onChange={(e) => {
                setClasseId(e.target.value);
                setRecherche("");
              }}
              aria-label="Filtrer par classe"
              className="w-full"
            >
              <option value="">Filtrer par classe...</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </Select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Rechercher un élève par nom ou prénom..."
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
                className="pl-9 disabled:bg-slate-50 disabled:cursor-not-allowed"
              />
              {afficherSuggestions && suggestions.length > 0 && (
                <ul className="absolute left-0 right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                  {suggestions.map((e) => (
                    <li key={e.id}>
                      <button
                        type="button"
                        onClick={() => choisirSuggestion(e)}
                        className="w-full text-left px-3.5 py-2 text-sm text-slate-700 hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        {e.nom} {e.prenom}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Card className="p-0 overflow-hidden max-h-[520px] overflow-y-auto">
              <div className="flex items-center gap-2 px-4 py-3.5 border-b border-slate-100 bg-slate-50/60">
                <div className="h-7 w-7 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
                  <Users className="h-3.5 w-3.5" />
                </div>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider m-0">
                  Élèves{classeId ? ` (${elevesFiltres.length})` : ""}
                </p>
              </div>
              <div className="p-2">
                {!classeId && (
                  <p className="text-sm text-slate-400 text-center px-3 py-8 m-0">Sélectionnez une classe pour voir les élèves</p>
                )}
                {classeId && chargementEleves && (
                  <p className="text-sm text-slate-400 text-center px-3 py-8 m-0">Chargement...</p>
                )}
                {classeId && !chargementEleves && elevesFiltres.length === 0 && (
                  <p className="text-sm text-slate-400 text-center px-3 py-8 m-0">Aucun élève trouvé</p>
                )}
                {classeId && !chargementEleves && elevesFiltres.map((e) => {
                  const statut = STATUTS_PAIEMENT_ELEVE[e.statut_paiement] || STATUTS_PAIEMENT_ELEVE.a_echoir;
                  return (
                    <div
                      key={e.id}
                      onClick={() => selectionnerEleve(e)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer mb-1 transition-colors ${
                        eleveSelectionne === e.id ? "bg-blue-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-[11px] ${
                            eleveSelectionne === e.id ? "bg-[#2563EB] text-white" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {getInitiales(e.nom, e.prenom)}
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${statut.dot}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 m-0 truncate">{e.nom} {e.prenom}</p>
                        <p className={`text-[10px] font-bold uppercase tracking-wide m-0 ${statut.texte}`}>{statut.libelle}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Colonne droite (~70%) */}
          <div className="flex-1 space-y-4">
            {!eleveInfos && (
              <Card className="flex flex-col items-center justify-center text-center py-14 gap-3">
                <div className="h-12 w-12 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
                  <Receipt className="h-6 w-6" />
                </div>
                <p className="text-sm text-slate-400 m-0">Sélectionnez un élève pour voir son suivi de paiement.</p>
              </Card>
            )}

            {eleveInfos && (
              <>
                {/* Section 1 — En-tete eleve */}
                <Card className="p-0 overflow-hidden border-blue-100">
                  <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-14 w-14 rounded-2xl bg-[#2563EB] text-white flex items-center justify-center font-bold text-lg shrink-0">
                        {getInitiales(eleveInfos.nom, eleveInfos.prenom)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-bold text-slate-900 m-0 truncate">{eleveInfos.nom} {eleveInfos.prenom}</p>
                        <p className="text-xs text-slate-500 m-0 mt-0.5">
                          <span className="font-mono">{eleveInfos.matricule}</span> · {eleveInfos.classe || "—"}
                        </p>
                      </div>
                    </div>
                    {peutInscrire && !dejaInscrit && (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          disabled={inscriptionEnCours !== null}
                          onClick={() => ouvrirFormulaireInscription(false)}
                        >
                          📋 Inscrire{libelleMontant(montantGrille(typeInscription))}
                        </Button>
                        <Button
                          variant="secondary"
                          disabled={inscriptionEnCours !== null}
                          onClick={() => ouvrirFormulaireInscription(true)}
                        >
                          🔄 Réinscrire{libelleMontant(montantGrille(typeReinscription))}
                        </Button>
                      </div>
                    )}
                  </div>

                  {formInscription && (
                    <form
                      onSubmit={confirmerInscription}
                      className="flex flex-col gap-4 px-5 py-4 border-t border-blue-100 bg-blue-50/40"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider m-0 mb-2">
                          {formInscription.reinscription ? "Réinscription" : "Inscription"}
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Type</label>
                            <Input type="text" value={formInscription.reinscription ? "Réinscription" : "Inscription"} disabled />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Montant inscription (GNF)</label>
                            <Input
                              type="number"
                              min="1"
                              value={formInscription.montantInscription}
                              onChange={(e) => setFormInscription({ ...formInscription, montantInscription: e.target.value })}
                              placeholder="Saisir le montant"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-blue-100 pt-3">
                        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider m-0 mb-2">
                          Paiement scolarité (optionnel)
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Échéance</label>
                            <Select
                              value={formInscription.echeanceId}
                              onChange={(e) => setFormInscription({ ...formInscription, echeanceId: e.target.value, montantEcheance: "" })}
                            >
                              <option value="">Aucune</option>
                              {echeancesScolariteDisponibles.map((ech) => (
                                <option key={ech.id} value={ech.id}>{ech.libelle}</option>
                              ))}
                            </Select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Montant scolarité (GNF)</label>
                            <Input
                              type="number"
                              min="1"
                              max={formInscription.echeanceId ? resteTotalDuFrais(suivi, formInscription.echeanceId) : undefined}
                              disabled={!formInscription.echeanceId}
                              required={!!formInscription.echeanceId}
                              value={formInscription.montantEcheance}
                              onChange={(e) => setFormInscription({ ...formInscription, montantEcheance: e.target.value })}
                            />
                          </div>
                        </div>
                        {formInscription.echeanceId && (
                          <p className="text-xs text-slate-400 m-0 mt-2">
                            Un montant supérieur à l'échéance est reporté sur les tranches suivantes (jusqu'à {formaterGNF(resteTotalDuFrais(suivi, formInscription.echeanceId))}).
                          </p>
                        )}
                        {echeancesScolariteDisponibles.length === 0 && (
                          <p className="text-xs text-slate-400 m-0 mt-2">Aucune échéance de scolarité en attente pour cet élève.</p>
                        )}
                      </div>

                      <div className="border-t border-blue-100 pt-3">
                        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider m-0 mb-2">Règlement</p>
                        <div className="grid grid-cols-2 gap-3 items-end">
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Montant total à encaisser</label>
                            <p className="m-0 text-lg font-bold text-[#0C447C]">{formaterGNF(totalEncaisser)}</p>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Moyen de paiement</label>
                            <Select
                              value={formInscription.moyenPaiement}
                              onChange={(e) => setFormInscription({ ...formInscription, moyenPaiement: e.target.value })}
                            >
                              <option value="especes">Espèces</option>
                              <option value="mobile_money">Mobile Money</option>
                              <option value="virement">Virement</option>
                              <option value="cheque">Chèque</option>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button type="submit" variant="primary" disabled={inscriptionEnCours !== null}>
                          Enregistrer et imprimer le reçu
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => setFormInscription(null)}>
                          Annuler
                        </Button>
                      </div>
                    </form>
                  )}
                </Card>

                {/* Section 2 — Frais d'inscription */}
                {fraisInscription && (
                  <Card className="p-0 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-[#0C447C]/10 text-[#0C447C] flex items-center justify-center shrink-0">
                          <School className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 m-0">{fraisInscription.type_frais}</p>
                          <p className="text-xs text-slate-500 m-0 mt-0.5">{formaterGNF(fraisInscription.montant_total)}</p>
                        </div>
                      </div>
                      {fraisInscription.echeances[0] && badgeStatutEcheance(fraisInscription.echeances[0])}
                    </div>
                  </Card>
                )}

                {/* Section 3 — Scolarite */}
                {suivi && suivi.frais
                  .filter((f) => normaliser(f.type_frais).startsWith("scolarit"))
                  .map((f) => (
                    <Card key={f.id} className="p-0 overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/60">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-[#0C447C]/10 text-[#0C447C] flex items-center justify-center shrink-0">
                            <Wallet className="h-4 w-4" />
                          </div>
                          <p className="text-sm font-bold text-slate-900 m-0">{f.type_frais}</p>
                        </div>
                        <span className="text-xs font-bold text-[#0C447C] bg-blue-50 px-3 py-1.5 rounded-full">
                          {formaterGNF(f.montant_total)}
                        </span>
                      </div>
                      <div className="divide-y divide-slate-100 px-5">
                        {f.echeances.map((ech) => (
                          <div key={ech.id} className="flex items-center justify-between py-3.5">
                            <div>
                              <p className="text-sm font-semibold text-slate-800 m-0">{ech.libelle}</p>
                              <p className="text-xs text-slate-400 m-0 mt-0.5">Échéance : {ech.date_limite}</p>
                            </div>
                            <div className="text-right space-y-1.5">
                              {badgeStatutEcheance(ech)}
                              <p className="text-xs text-slate-500 m-0 font-medium">{formaterGNF(ech.montant_paye)} / {formaterGNF(ech.montant)}</p>
                              {peutInscrire && ech.solde > 0 && (
                                <button
                                  onClick={() => ouvrirFormulairePaiement(ech)}
                                  className="px-2.5 py-1 rounded-lg border border-blue-200 text-[#2563EB] text-xs font-semibold hover:bg-blue-50 transition-colors cursor-pointer"
                                >
                                  Payer
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="h-2" />
                    </Card>
                  ))}

                {/* Formulaire "Payer" une echeance de scolarite */}
                {paiement && (
                  <Card className="p-0 overflow-hidden border-blue-100">
                    <div className="flex items-center gap-2.5 px-5 py-4 border-b border-blue-100 bg-blue-50/60">
                      <div className="h-8 w-8 rounded-lg bg-[#2563EB] text-white flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-bold text-slate-900 m-0">Enregistrer un paiement</p>
                    </div>
                    <form onSubmit={enregistrerPaiement} className="flex flex-wrap items-end gap-3 p-5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Échéance</label>
                        <Input type="text" value={paiement.libelle} disabled />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Montant (GNF)</label>
                        <Input
                          type="number"
                          min="1"
                          max={resteTotalDuFrais(suivi, paiement.echeanceId)}
                          value={paiement.montant}
                          onChange={(e) => setPaiement({ ...paiement, montant: e.target.value })}
                          required
                        />
                      </div>
                      <p className="basis-full order-last text-xs text-slate-400 m-0">
                        Un montant supérieur à l'échéance est reporté sur les tranches suivantes (jusqu'à {formaterGNF(resteTotalDuFrais(suivi, paiement.echeanceId))}, soit toute la scolarité restante).
                      </p>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Moyen de paiement</label>
                        <Select value={paiement.moyenPaiement} onChange={(e) => setPaiement({ ...paiement, moyenPaiement: e.target.value })}>
                          <option value="especes">Espèces</option>
                          <option value="mobile_money">Mobile Money</option>
                          <option value="virement">Virement</option>
                          <option value="cheque">Chèque</option>
                        </Select>
                      </div>
                      <Button type="submit" variant="primary">Enregistrer et imprimer le reçu</Button>
                      <Button type="button" variant="ghost" onClick={() => setPaiement(null)}>
                        Annuler
                      </Button>
                    </form>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {onglet === "grilles" && (
        <>
          <Card className="p-0 overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
              <div className="h-8 w-8 rounded-lg bg-[#0C447C]/10 text-[#0C447C] flex items-center justify-center shrink-0">
                <Layers className="h-4 w-4" />
              </div>
              <p className="text-sm font-bold text-slate-900 m-0">
                Grilles tarifaires existantes <span className="text-slate-400 font-semibold">({grillesExistantes.length})</span>
              </p>
            </div>

            {grillesExistantes.length === 0 ? (
              <p className="text-sm text-slate-400 px-5 py-8 text-center">Aucune grille tarifaire n'a encore été créée.</p>
            ) : (
              <div className="divide-y divide-slate-100 px-5">
                {grillesExistantes.map((g) => {
                  const couverture = g.nombre_eleves_classe > 0
                    ? Math.round((g.nombre_eleves_couverts / g.nombre_eleves_classe) * 100)
                    : 100;
                  const complet = g.nombre_eleves_couverts >= g.nombre_eleves_classe;
                  const fraisParEleve = ["inscription", "reinscription"].includes(normaliser(g.type_frais?.nom));

                  return (
                    <div key={g.id} className="py-3.5 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
                          <School className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 m-0">
                            {g.classe?.nom || '—'} · {g.type_frais?.nom || "—"}
                          </p>
                          <p className="text-xs text-slate-400 m-0 mt-0.5">
                            {formaterGNF(g.montant)} · {g.echeances?.length || 0} échéance{(g.echeances?.length || 0) > 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {complet ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {g.nombre_eleves_couverts}/{g.nombre_eleves_classe} élèves à jour
                          </span>
                        ) : (
                          <>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              {g.nombre_eleves_couverts}/{g.nombre_eleves_classe} élèves ({couverture}%)
                            </span>
                            {/* title sur le <span> : un bouton desactive n'affiche pas toujours son infobulle */}
                            <span title={fraisParEleve ? "Les frais d'inscription se gèrent élève par élève" : undefined}>
                              <button
                                onClick={() => synchroniserGrille(g.id)}
                                disabled={synchronisationEnCours === g.id || fraisParEleve}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-blue-200 text-[#2563EB] text-xs font-semibold hover:bg-blue-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <RefreshCw className={`h-3.5 w-3.5 ${synchronisationEnCours === g.id ? "animate-spin" : ""}`} />
                                Synchroniser
                              </button>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="h-1" />
          </Card>

          <Card className="p-0 overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
              <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Tag className="h-4 w-4" />
              </div>
              <p className="text-sm font-bold text-slate-900 m-0">Nouveau type de frais</p>
            </div>
            <form onSubmit={ajouterTypeFrais} className="flex gap-3 p-5">
              <Input
                type="text"
                placeholder="ex: Scolarité, Cantine, Transport..."
                value={nouveauType}
                onChange={(e) => setNouveauType(e.target.value)}
                className="flex-1"
                required
              />
              <Button type="submit" variant="secondary">Ajouter</Button>
            </form>
          </Card>

          <Card className="p-0 overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="h-4 w-4" />
              </div>
              <p className="text-sm font-bold text-slate-900 m-0">Créer une grille tarifaire</p>
            </div>
            <form onSubmit={creerGrille} className="space-y-4 p-5">
              <div className="flex flex-wrap gap-3">
                <Select value={grille.classe_id} onChange={(e) => setGrille({ ...grille, classe_id: e.target.value })} required>
                  <option value="">Classe...</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </Select>
                <Select value={grille.type_frais_id} onChange={(e) => setGrille({ ...grille, type_frais_id: e.target.value })} required>
                  <option value="">Type de frais...</option>
                  {typesFrais.map((t) => <option key={t.id} value={t.id}>{t.nom}</option>)}
                </Select>
                <Input
                  type="number"
                  placeholder="Montant total (GNF)"
                  value={grille.montant}
                  onChange={(e) => setGrille({ ...grille, montant: e.target.value })}
                  required
                />
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider m-0">Échéances</p>
                <div className="space-y-2">
                  {echeances.map((ech, i) => (
                    <div key={i} className="flex flex-wrap gap-3">
                      <Input type="text" placeholder="Libellé" value={ech.libelle} onChange={(e) => modifierEcheance(i, "libelle", e.target.value)} required />
                      <Input type="number" placeholder="Montant" value={ech.montant} onChange={(e) => modifierEcheance(i, "montant", e.target.value)} required />
                      <Input type="date" value={ech.date_limite} onChange={(e) => modifierEcheance(i, "date_limite", e.target.value)} required />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={ajouterEcheance}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-slate-300 bg-white text-xs text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Ajouter une échéance
                </button>
              </div>

              <div>
                <Button type="submit" variant="primary" size="lg">Créer la grille</Button>
              </div>
            </form>
          </Card>
        </>
      )}
    </div>
  );
}
