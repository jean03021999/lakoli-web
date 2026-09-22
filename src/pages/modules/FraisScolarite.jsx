import { useState, useEffect } from "react";
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
import {
  ouvrirFenetreVierge,
  ecrireDocumentImpression,
  genererRecuHtml,
  referenceLocale,
  formaterHeure,
  formaterDate,
} from "../../utils/impression";

const LIBELLES_MOYEN_PAIEMENT = {
  especes: "Espèces",
  mobile_money: "Mobile Money",
  virement: "Virement",
  cheque: "Chèque",
};

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

// Total annuel / total paye / reste de la SCOLARITE de l'eleve : les frais d'inscription et de
// reinscription sont exclus (meme regle que le statut global cote backend : nom en "scolarit%").
function totauxDepuisSuivi(suivi) {
  if (!suivi) return null;
  const echeances = suivi.frais
    .filter((f) => normaliser(f.type_frais).startsWith("scolarit"))
    .flatMap((f) => f.echeances);
  return {
    total: echeances.reduce((s, e) => s + Number(e.montant), 0),
    paye: echeances.reduce((s, e) => s + Number(e.montant_paye), 0),
  };
}

// Minuscules et sans accents, pour que "aminata" trouve "Aminata" et "helene" trouve "Hélène".
function normaliser(texte) {
  return (texte || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// Retrouve, dans le suivi rechargé après un paiement, l'echeance payee et le type de frais de
// son parent (Scolarité, Inscription, Réinscription...) : le POST /frais/paiements ne renvoie
// que la ligne "paiements", pas ce contexte.
function trouverEcheance(suivi, echeanceId) {
  for (const f of suivi?.frais || []) {
    const echeance = f.echeances.find((e) => e.id === echeanceId);
    if (echeance) return { echeance, typeFrais: f.type_frais };
  }
  return null;
}

// "Scolarité - Trimestre 1" pour une echeance de scolarite ; le type seul (Inscription,
// Réinscription) pour les autres, qui n'ont qu'une echeance unique sans decoupage par periode.
function libelleTypePaiement(typeFrais, libelleEcheance) {
  return normaliser(typeFrais).startsWith("scolarit") ? `${typeFrais} - ${libelleEcheance}` : typeFrais;
}

// Memorise la classe choisie pour la retrouver au retour sur la page.
const CLE_CLASSE_FILTRE = "frais_classe_filtre";

function lireClasseFiltre() {
  try {
    return sessionStorage.getItem(CLE_CLASSE_FILTRE) || "";
  } catch {
    return "";
  }
}

export default function FraisScolarite({ permissions = [] }) {
  const peutImprimer = permissions.includes("frais.voir");
  const peutInscrire = permissions.includes("frais.voir");
  const [onglet, setOnglet] = useState("suivi");
  const [eleves, setEleves] = useState([]);
  const [classeId, setClasseId] = useState(lireClasseFiltre);
  const [recherche, setRecherche] = useState("");
  const [afficherSuggestions, setAfficherSuggestions] = useState(false);
  const [chargementEleves, setChargementEleves] = useState(false);
  const [eleveSelectionne, setEleveSelectionne] = useState(null);
  const [eleveInfos, setEleveInfos] = useState(null);
  const [dernierRecu, setDernierRecu] = useState(null);
  const [recuVisible, setRecuVisible] = useState(false);
  const [inscriptionEnCours, setInscriptionEnCours] = useState(null);
  const [formInscription, setFormInscription] = useState(null);
  const [suivi, setSuivi] = useState(null);
  const [classes, setClasses] = useState([]);
  const [typesFrais, setTypesFrais] = useState([]);
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");

  const [nouveauType, setNouveauType] = useState("");
  const [grille, setGrille] = useState({ classe_id: "", type_frais_id: "", montant: "" });
  const [echeances, setEcheances] = useState([{ libelle: "Trimestre 1", montant: "", date_limite: "" }]);
  const [grillesExistantes, setGrillesExistantes] = useState([]);
  const [synchronisationEnCours, setSynchronisationEnCours] = useState(null);

  const [paiement, setPaiement] = useState({ echeance_eleve_id: "", montant: "", moyen_paiement: "especes", date_paiement: "" });

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

  const MESSAGE_POPUP_BLOQUE =
    "Le navigateur a bloqué la fenêtre du reçu. Autorisez les pop-ups pour ce site, puis cliquez sur « Réimprimer le reçu ».";

  // Fonction unique, reutilisee pour tous les types de paiement (scolarite, inscription,
  // reinscription) : un seul gabarit de reçu (genererRecuHtml) pour les trois.
  const imprimerRecu = (fenetre, recu) => {
    if (fenetre) {
      ecrireDocumentImpression(fenetre, "Reçu de paiement", genererRecuHtml(recu));
    } else {
      setErreur(MESSAGE_POPUP_BLOQUE);
    }
  };

  const dateDuJour = () => new Date().toISOString().slice(0, 10);

  // Clic sur "Inscrire" / "Réinscrire" : affiche le formulaire. Le montant d'inscription vient
  // de la grille et n'est pas modifiable ; l'echeance de scolarite est un ajout optionnel.
  const ouvrirFormulaireInscription = (reinscription) => {
    const type = reinscription ? typeReinscription : typeInscription;
    if (!type) {
      setErreur(`Le type de frais « ${reinscription ? "Réinscription" : "Inscription"} » est introuvable.`);
      return;
    }
    const montantInscription = montantGrille(type);
    if (montantInscription == null) {
      setErreur(`Aucune grille tarifaire « ${reinscription ? "Réinscription" : "Inscription"} » n'est configurée pour cette classe.`);
      return;
    }
    setErreur(""); setSucces("");
    setFormInscription({
      reinscription,
      montantInscription,
      echeanceId: "",
      montantEcheance: "",
      moyen_paiement: "especes",
    });
  };

  // Selection d'une echeance de scolarite dans le formulaire d'inscription : pre-remplit son
  // montant avec le solde restant du (modifiable ensuite).
  const choisirEcheance = (echeanceId) => {
    const ech = echeancesScolariteDisponibles.find((e) => String(e.id) === String(echeanceId));
    setFormInscription({
      ...formInscription,
      echeanceId,
      montantEcheance: ech ? String(ech.solde) : "",
    });
  };

  // Cree les frais d'inscription/reinscription et, si une echeance de scolarite a ete choisie,
  // enregistre aussi son paiement : deux appels API, un seul recu imprimable a l'ecran.
  const confirmerInscription = async (e) => {
    e.preventDefault();
    const { reinscription, montantInscription, echeanceId, montantEcheance, moyen_paiement } = formInscription;
    const type = reinscription ? typeReinscription : typeInscription;
    setErreur(""); setSucces("");
    setInscriptionEnCours(reinscription ? "reinscription" : "inscription");
    try {
      const resInscription = await api.post("/frais/appliquer-inscription", {
        eleve_id: eleveInfos.id,
        type_frais_id: type.id,
        montant: montantInscription,
        moyen_paiement,
      });

      let resEcheance = null;
      if (echeanceId) {
        resEcheance = await api.post("/frais/paiements", {
          echeance_eleve_id: echeanceId,
          montant: montantEcheance,
          moyen_paiement,
          date_paiement: dateDuJour(),
        });
      }

      await chargerSuivi(eleveInfos.id);
      setSucces(resInscription.data.message);
      setFormInscription(null);

      const lignes = [
        { libelle: reinscription ? "Réinscription" : "Inscription", montant: Number(resInscription.data.montant_paye) },
      ];
      if (resEcheance) {
        const libelleEcheance = echeancesScolariteDisponibles.find((ec) => String(ec.id) === String(echeanceId))?.libelle || "Scolarité";
        lignes.push({ libelle: `Scolarité - ${libelleEcheance}`, montant: Number(resEcheance.data.montant) });
      }

      setDernierRecu({
        eleve: eleveInfos,
        lignes,
        total: lignes.reduce((s, l) => s + l.montant, 0),
        moyenPaiement: resInscription.data.moyen_paiement,
        date: resInscription.data.date,
        heure: resInscription.data.heure,
        reference: resInscription.data.reference,
        caissier: resInscription.data.caissier || localStorage.getItem("user_name") || "",
      });
      setRecuVisible(true);
    } catch (err) {
      setErreur(
        err.response?.status === 409
          ? "Frais déjà appliqués"
          : err.response?.data?.message || "Erreur lors de l'application des frais."
      );
    } finally {
      setInscriptionEnCours(null);
    }
  };

  const enregistrerPaiement = async (e) => {
    e.preventDefault();
    setErreur(""); setSucces("");
    // Ouverte tout de suite, pendant le clic : les navigateurs bloquent une fenetre ouverte apres l'appel reseau.
    const fenetreRecu = peutImprimer ? ouvrirFenetreVierge() : null;
    try {
      const res = await api.post("/frais/paiements", paiement);
      // Recharge le suivi avant d'afficher le succes (chargerSuivi efface les messages) et
      // pour que le recu contienne le total paye a jour, paiement inclus.
      const suiviMaj = await chargerSuivi(eleveSelectionne);
      setSucces("Paiement enregistré avec succès.");
      setPaiement({ echeance_eleve_id: "", montant: "", moyen_paiement: "especes", date_paiement: "" });

      if (peutImprimer) {
        // Le POST ne renvoie que la ligne "paiements" : on retrouve l'echeance (montant du,
        // cumul deja paye dessus) et son type dans le suivi qu'on vient de recharger.
        const info = trouverEcheance(suiviMaj, res.data.echeance_eleve_id);
        const montantDu = info ? Number(info.echeance.montant) : null;
        const cumule = info ? Number(info.echeance.montant_paye) : Number(res.data.montant);
        const recu = {
          eleve: eleveInfos,
          type: info ? libelleTypePaiement(info.typeFrais, info.echeance.libelle) : `Scolarité - ${res.data.libelle || ""}`.trim(),
          montantPaye: Number(res.data.montant),
          complet: montantDu === null || cumule >= montantDu,
          reste: montantDu === null ? 0 : Math.max(0, montantDu - cumule),
          moyenPaiement: res.data.moyen_paiement,
          date: res.data.date_paiement,
          heure: formaterHeure(res.data.created_at),
          reference: referenceLocale(res.data.id, res.data.date_paiement),
          caissier: localStorage.getItem("user_name") || "",
          totaux: totauxDepuisSuivi(suiviMaj),
        };
        setDernierRecu(recu);
        imprimerRecu(fenetreRecu, recu);
      }
    } catch (err) {
      fenetreRecu?.close();
      setErreur(err.response?.data?.message || "Erreur lors de l'enregistrement du paiement.");
    }
  };

  // Chaque mot saisi doit se retrouver dans nom ou prenom (ordre libre).
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
  const typeInscriptionEleve = eleveInfos?.inscription_active?.type_inscription;

  // Echeances de scolarite encore dues, proposees dans le formulaire d'inscription/reinscription.
  const echeancesScolariteDisponibles = (suivi?.frais || [])
    .filter((f) => normaliser(f.type_frais).startsWith("scolarit"))
    .flatMap((f) => f.echeances)
    .filter((ech) => ech.solde > 0);

  const totalEncaisser = formInscription
    ? Number(formInscription.montantInscription || 0) + (formInscription.echeanceId ? Number(formInscription.montantEcheance || 0) : 0)
    : 0;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6 flex items-center gap-4" style={{ background: "linear-gradient(135deg, #0C447C, #1a5a9e)" }}>
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
        <div className="relative z-10 min-w-0">
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Frais de Scolarité & Facturation</h1>
          <p className="text-xs sm:text-sm text-white/70 mt-1 max-w-2xl">
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
          {peutImprimer && dernierRecu?.type && (
            <button
              onClick={() => imprimerRecu(ouvrirFenetreVierge(), dernierRecu)}
              className="ml-auto px-3 py-1 rounded-lg border border-emerald-200 bg-white text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              Réimprimer le reçu
            </button>
          )}
        </div>
      )}

      {onglet === "suivi" && recuVisible && dernierRecu && (
        <div className="space-y-4">
          <style>{`
            @media print {
              body * { visibility: hidden; }
              .recu-impression, .recu-impression * { visibility: visible; }
              .recu-impression { position: absolute; left: 0; top: 0; width: 100%; }
              .no-print { display: none !important; }
            }
          `}</style>

          <div className="flex justify-end gap-2 no-print">
            <Button variant="primary" onClick={() => window.print()}>🖨️ Imprimer</Button>
            <Button variant="secondary" onClick={() => setRecuVisible(false)}>Fermer</Button>
          </div>

          <div className="recu-impression bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 max-w-xl mx-auto">
            <div className="px-6 py-5 text-white" style={{ background: "#0C447C" }}>
              <p className="text-lg font-extrabold tracking-[0.2em] m-0">LAKOLI</p>
              <p className="text-xs text-white/70 m-0 mt-0.5">Reçu de paiement</p>
            </div>

            <div className="p-6 space-y-5 text-sm text-slate-700">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider m-0 mb-1">Élève</p>
                <p className="m-0 font-semibold text-slate-900">{dernierRecu.eleve?.nom} {dernierRecu.eleve?.prenom}</p>
                <p className="m-0 text-xs text-slate-500 mt-0.5">
                  <span className="font-mono">{dernierRecu.eleve?.matricule || "—"}</span> · {dernierRecu.eleve?.classe || "—"}
                </p>
              </div>

              <table className="w-full text-sm border-collapse">
                <tbody>
                  {dernierRecu.lignes.map((l, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-1.5">{l.libelle}</td>
                      <td className="py-1.5 text-right font-semibold">{formaterGNF(l.montant)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="py-2 font-bold text-slate-900">TOTAL ENCAISSÉ</td>
                    <td className="py-2 text-right font-bold text-[#0C447C]">{formaterGNF(dernierRecu.total)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider m-0 mb-1">Moyen de paiement</p>
                  <p className="m-0 font-semibold">
                    {LIBELLES_MOYEN_PAIEMENT[dernierRecu.moyenPaiement] || dernierRecu.moyenPaiement || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider m-0 mb-1">Référence</p>
                  <p className="m-0 font-mono text-xs">{dernierRecu.reference || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider m-0 mb-1">Date et heure</p>
                  <p className="m-0 font-semibold">
                    {formaterDate(dernierRecu.date)}{dernierRecu.heure ? ` à ${dernierRecu.heure}` : ""}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider m-0 mb-1">Caissier</p>
                  <p className="m-0 font-semibold">{dernierRecu.caissier || "—"}</p>
                </div>
              </div>

              <div className="flex justify-end pt-8">
                <div className="text-center w-52 border-t border-slate-300 pt-1.5">
                  <p className="m-0 text-xs text-slate-500">Signature du caissier</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {onglet === "suivi" && !recuVisible && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Select
            value={classeId}
            onChange={(e) => {
              setClasseId(e.target.value);
              setRecherche("");
            }}
            aria-label="Filtrer par classe"
          >
            <option value="">Filtrer par classe...</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </Select>

          <div className="relative flex-1 min-w-[300px]">
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
        </div>
      )}

      {onglet === "suivi" && !recuVisible && (
        <div className="flex flex-col lg:flex-row gap-4">
          <Card className="lg:w-72 shrink-0 max-h-[560px] overflow-y-auto p-0 overflow-hidden">
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
              {classeId && !chargementEleves && elevesFiltres.map((e) => (
                <div
                  key={e.id}
                  onClick={() => { setEleveInfos({ ...e, classe_id: classeId }); setFormInscription(null); chargerSuivi(e.id); }}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer mb-1 transition-colors ${
                    eleveSelectionne === e.id ? "bg-blue-50" : "hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                      eleveSelectionne === e.id ? "bg-[#2563EB] text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {getInitiales(e.nom, e.prenom)}
                  </div>
                  <p className="text-sm font-semibold text-slate-800 m-0 truncate">{e.nom} {e.prenom}</p>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex-1 space-y-4">
            {peutInscrire && eleveInfos && (
              <Card className="p-0 overflow-hidden border-blue-100">
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 m-0 truncate">{eleveInfos.nom} {eleveInfos.prenom}</p>
                    <p className="text-xs text-slate-500 m-0 mt-0.5">
                      <span className="font-mono">{eleveInfos.matricule}</span> · {eleveInfos.classe || "—"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={typeInscriptionEleve === "nouvelle" ? "primary" : "secondary"}
                      disabled={inscriptionEnCours !== null}
                      onClick={() => ouvrirFormulaireInscription(false)}
                    >
                      📋 Inscrire{libelleMontant(montantGrille(typeInscription))}
                    </Button>
                    <Button
                      variant={typeInscriptionEleve === "reinscription" ? "primary" : "secondary"}
                      disabled={inscriptionEnCours !== null}
                      onClick={() => ouvrirFormulaireInscription(true)}
                    >
                      🔄 Réinscrire{libelleMontant(montantGrille(typeReinscription))}
                    </Button>
                  </div>
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
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Montant (GNF)</label>
                          <Input type="text" value={formaterGNF(formInscription.montantInscription)} disabled />
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
                            onChange={(e) => choisirEcheance(e.target.value)}
                          >
                            <option value="">Aucune</option>
                            {echeancesScolariteDisponibles.map((ech) => (
                              <option key={ech.id} value={ech.id}>{ech.libelle}</option>
                            ))}
                          </Select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Montant à payer (GNF)</label>
                          <Input
                            type="number"
                            min="1"
                            disabled={!formInscription.echeanceId}
                            required={!!formInscription.echeanceId}
                            value={formInscription.montantEcheance}
                            onChange={(e) => setFormInscription({ ...formInscription, montantEcheance: e.target.value })}
                          />
                        </div>
                      </div>
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
                            value={formInscription.moyen_paiement}
                            onChange={(e) => setFormInscription({ ...formInscription, moyen_paiement: e.target.value })}
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
            )}
            {!suivi && (
              <Card className="flex flex-col items-center justify-center text-center py-14 gap-3">
                <div className="h-12 w-12 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
                  <Receipt className="h-6 w-6" />
                </div>
                <p className="text-sm text-slate-400 m-0">Sélectionnez un élève pour voir son suivi de paiement.</p>
              </Card>
            )}
            {suivi && suivi.frais.map((f) => (
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
                        {ech.solde > 0 && (
                          <button
                            onClick={() => setPaiement({ ...paiement, echeance_eleve_id: ech.id })}
                            className="px-2.5 py-1 rounded-lg border border-blue-200 text-[#2563EB] text-xs font-semibold hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            Enregistrer un paiement
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="h-2" />
              </Card>
            ))}

            {paiement.echeance_eleve_id && (
              <Card className="p-0 overflow-hidden border-blue-100">
                <div className="flex items-center gap-2.5 px-5 py-4 border-b border-blue-100 bg-blue-50/60">
                  <div className="h-8 w-8 rounded-lg bg-[#2563EB] text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-bold text-slate-900 m-0">Enregistrer un paiement</p>
                </div>
                <form onSubmit={enregistrerPaiement} className="flex flex-wrap items-end gap-3 p-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Montant (GNF)</label>
                    <Input type="number" value={paiement.montant} onChange={(e) => setPaiement({ ...paiement, montant: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Moyen</label>
                    <Select value={paiement.moyen_paiement} onChange={(e) => setPaiement({ ...paiement, moyen_paiement: e.target.value })}>
                      <option value="especes">Espèces</option>
                      <option value="mobile_money">Mobile Money</option>
                      <option value="virement">Virement</option>
                      <option value="cheque">Chèque</option>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Date</label>
                    <Input type="date" value={paiement.date_paiement} onChange={(e) => setPaiement({ ...paiement, date_paiement: e.target.value })} required />
                  </div>
                  <Button type="submit" variant="primary">Confirmer</Button>
                </form>
              </Card>
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
