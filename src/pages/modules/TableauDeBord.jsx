import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Users,
  Award,
  Wallet,
  Activity,
  FileText,
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Plus,
  Search,
  Banknote,
  ClipboardList,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  FileDown,
  PlusCircle,
  ArrowRight,
} from "lucide-react";
import api from "../../services/api";
import { imprimerDocument, genererRapportComptableHtml } from "../../utils/impression";
import { StatCard as StatCardSysteme, Card, Badge, Button, PageHeader } from "../../components/ui/LakoliDesignSystem";

function formaterRole(role) {
  if (!role) return "";
  return role.charAt(0) + role.slice(1).toLowerCase();
}

function formaterGNF(montant) {
  return `${formaterNombre(montant)} GNF`;
}

function formaterNombre(montant) {
  return Number(montant).toLocaleString("fr-FR");
}

const LIBELLES_ROLES = {
  COMPTABLE: "Comptable",
  DIRECTEUR: "Directeur",
  FONDATEUR: "Fondateur",
  PROVISEUR: "Proviseur",
  CENSEUR: "Censeur",
};

// Couleur d'avatar stable, deduite du nom (le meme eleve garde toujours la meme couleur).
const COULEURS_AVATAR = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-indigo-100 text-indigo-700",
];

function couleurAvatar(nom) {
  let h = 0;
  for (const c of nom || "") h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return COULEURS_AVATAR[h % COULEURS_AVATAR.length];
}

function initialesNomComplet(nomComplet) {
  return (nomComplet || "?").trim().split(/\s+/).slice(0, 2).map((s) => s[0]).join("").toUpperCase();
}

function getInitialesEleve(nom, prenom) {
  return `${nom?.[0] || ""}${prenom?.[0] || ""}`.toUpperCase();
}

// Normalise pour une recherche insensible à la casse ET aux accents
// (ex: "konate", "KONATE" ou "Konaté" doivent tous matcher "Konaté")
function normaliser(texte) {
  return (texte || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "");
}

const PAIEMENTS_EXEMPLE = [
  { id: "ex1", eleve: { nom_complet: "Aminata Konaté", classe: "6e A" }, periode: "Trimestre 1", montant: 300000, date_paiement: "2026-01-10", heure: "09:15" },
  { id: "ex2", eleve: { nom_complet: "Ibrahima Diallo", classe: "5e B" }, periode: "Trimestre 1", montant: 150000, date_paiement: "2026-01-08", heure: "14:32" },
  { id: "ex3", eleve: { nom_complet: "Fatoumata Bah", classe: "4e A" }, periode: "Trimestre 2", montant: 200000, date_paiement: "2026-01-05", heure: "11:47" },
];

function CarteStatistique({ titre, valeur, icone: Icon, degrade, badge, progression = 70 }) {
  return (
    <div
      className="relative isolate overflow-hidden rounded-2xl shadow-sm p-5 text-white"
      style={{ background: degrade }}
    >
      {/* Cercles décoratifs flous, pour la profondeur */}
      <div className="absolute -top-8 -right-8 h-28 w-28 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex items-start justify-between mb-4">
        <div
          className="rounded-xl flex items-center justify-center"
          style={{ width: "46px", height: "46px", backgroundColor: "rgba(255,255,255,0.2)" }}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
        {badge && (
          <span
            className="px-2 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap"
            style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
          >
            {badge}
          </span>
        )}
      </div>

      <p className="relative z-10 text-[11px] font-bold uppercase tracking-wider text-white/80 mb-1">{titre}</p>
      <p className="relative z-10 font-extrabold mb-3.5 leading-none" style={{ fontSize: "30px" }}>
        {valeur}
      </p>

      <div className="relative z-10 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(100, Math.max(0, progression))}%`, backgroundColor: "rgba(255,255,255,0.8)" }}
        />
      </div>
    </div>
  );
}

// Carte statistique (design Google AI Studio) : fond degrade, icone dans un cercle blanc
// translucide, badge de tendance en haut a droite, grande valeur et barre de progression.
// `tendance` : { sens: "hausse" | "baisse", texte } — le texte decrit la donnee reelle
// (aucun historique n'existe pour calculer une variation).
function StatCard({ label, valeur, unite, icone: Icon, gradient, tendance, progression = 0 }) {
  const IconeTendance = tendance?.sens === "baisse" ? TrendingDown : TrendingUp;
  return (
    <div
      className="relative isolate overflow-hidden p-5 text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
      style={{ background: gradient, borderRadius: "18px" }}
    >
      {/* Cercles decoratifs flous, pour la profondeur */}
      <div className="absolute -top-8 -right-8 h-28 w-28 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex items-start justify-between gap-3 mb-5">
        <div
          className="rounded-full flex items-center justify-center shrink-0"
          style={{ width: "48px", height: "48px", backgroundColor: "rgba(255,255,255,0.2)" }}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
        {tendance && (
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap"
            style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
          >
            <IconeTendance className="h-3.5 w-3.5" />
            {tendance.texte}
          </span>
        )}
      </div>

      <p className="relative z-10 text-[11px] font-semibold uppercase tracking-widest text-white/80 mb-1.5">{label}</p>
      <p className="relative z-10 font-extrabold leading-none mb-5 tabular-nums break-words" style={{ fontSize: "37px" }}>
        {valeur}
        {unite && valeur !== "—" && <span className="ml-1.5 text-base font-bold text-white/80">{unite}</span>}
      </p>

      <div className="relative z-10 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, progression))}%`, backgroundColor: "rgba(255,255,255,0.85)" }}
        />
      </div>
    </div>
  );
}

// Situation des inscriptions (design Google AI Studio) : 3 barres epaisses rapportees a l'effectif
// total, badge du taux global d'inscription (nouveaux + reinscrits) et total en pied de carte.
function SectionInscriptions({ situation, disponible }) {
  const { nouveaux, reinscrits, aReinscrire, total } = situation;
  const pct = (n) => (total > 0 ? Math.round((n / total) * 100) : 0);
  const lignes = [
    {
      libelle: "Nouveaux inscrits",
      valeur: nouveaux,
      couleur: "#3b82f6",
      fond: "bg-blue-50 text-blue-600",
      icone: CheckCircle2,
      detail: `${pct(nouveaux)} % de l'effectif · première inscription`,
    },
    {
      libelle: "Réinscrits",
      valeur: reinscrits,
      couleur: "#10b981",
      fond: "bg-emerald-50 text-emerald-600",
      icone: TrendingUp,
      detail: `${pct(reinscrits)} % de l'effectif · anciens élèves reconduits`,
    },
    {
      libelle: "À réinscrire",
      valeur: aReinscrire,
      couleur: "#f59e0b",
      fond: "bg-amber-50 text-amber-600",
      icone: Clock,
      detail: aReinscrire > 0 ? "Sans inscription active sur la session en cours" : "Tous les élèves sont inscrits",
    },
  ];

  return (
    <div
      className="bg-white overflow-hidden border border-slate-100 h-full flex flex-col"
      style={{ borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
    >
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3 min-w-0">
          <span className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900">Situation des inscriptions</h3>
            <p className="text-xs text-slate-400">Session scolaire en cours</p>
          </div>
        </div>
        {disponible && (
          <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold whitespace-nowrap shrink-0">
            {pct(nouveaux + reinscrits)}% Global
          </span>
        )}
      </div>

      {!disponible ? (
        <div className="flex-1 py-10 text-center text-slate-400 text-xs">Impossible de charger la situation des inscriptions.</div>
      ) : (
        <div className="flex-1 px-5 py-5 space-y-5">
          {lignes.map((l) => (
            <div key={l.libelle}>
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <span className={`h-7 w-7 rounded-lg flex items-center justify-center ${l.fond}`}>
                    <l.icone className="h-4 w-4" />
                  </span>
                  {l.libelle}
                </span>
                <span className="text-sm font-extrabold text-slate-900 tabular-nums">{l.valeur}</span>
              </div>
              <div className="rounded-full bg-slate-100 overflow-hidden" style={{ height: "10px" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct(l.valeur)}%`, backgroundColor: l.couleur }}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400">{l.detail}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between px-5 py-3 bg-slate-50/70 border-t border-slate-100 text-xs">
        <span className="font-semibold text-slate-500">Total élèves</span>
        <span className="font-extrabold text-slate-900 tabular-nums">{disponible ? total : "—"}</span>
      </div>
    </div>
  );
}

function badgeStatut(statut) {
  switch (statut) {
    case "publie":
    case "valide":
      return <Badge variant="blue">{statut === "publie" ? "Publié" : "Validé"}</Badge>;
    case "soumis":
      return <Badge variant="outline">Soumis</Badge>;
    case "rejete":
      return <Badge variant="neutral">Rejeté</Badge>;
    case "archive":
      return <Badge variant="neutral">Archivé</Badge>;
    default:
      return <Badge variant="neutral">Brouillon</Badge>;
  }
}

export default function TableauDeBord({ role }) {
  if (role === "COMPTABLE") {
    return <TableauDeBordComptable role={role} />;
  }
  return <TableauDeBordGenerique role={role} />;
}

function TableauDeBordComptable({ role }) {
  const navigate = useNavigate();

  const [stats, setStats] = useState({ totalEleves: "—", enRetard: "—", aEchoir: "—" });
  const [elevesEnRetard, setElevesEnRetard] = useState([]);
  const [tousPaiements, setTousPaiements] = useState([]);
  const [totalEncaisse, setTotalEncaisse] = useState(null);
  const [paiementsDisponibles, setPaiementsDisponibles] = useState(true);
  const [versementsRecents, setVersementsRecents] = useState([]);
  const [versementsDemo, setVersementsDemo] = useState(false);
  const [dateMaj, setDateMaj] = useState(null);
  const [rafraichissement, setRafraichissement] = useState(0);
  const [enChargement, setEnChargement] = useState(true);
  const [etablissement, setEtablissement] = useState("");
  const [elevesSession, setElevesSession] = useState("");
  const [erreurRapport, setErreurRapport] = useState("");
  const [rechercheRetard, setRechercheRetard] = useState("");
  const [suggestionsRetardOuvertes, setSuggestionsRetardOuvertes] = useState(false);
  const [statsParClasse, setStatsParClasse] = useState([]);
  const [statsClasseDisponibles, setStatsClasseDisponibles] = useState(true);
  const [finances, setFinances] = useState({ inscriptions: 0, reinscriptions: 0, scolarite: 0, autres: 0 });
  const [financesDisponibles, setFinancesDisponibles] = useState(true);
  const [situationInscriptions, setSituationInscriptions] = useState({ nouveaux: 0, reinscrits: 0, aReinscrire: 0, total: 0 });
  const [inscriptionsDisponibles, setInscriptionsDisponibles] = useState(true);

  useEffect(() => {
    async function charger() {
      setEnChargement(true);
      const [eleves, paiements, parClasse, recents] = await Promise.allSettled([
        api.get("/eleves"),
        api.get("/frais/paiements"),
        api.get("/frais/stats-par-classe"),
        api.get("/frais/paiements/recent"),
      ]);

      // Versements recents : donnees de demonstration (signalees) si l'API ne repond pas.
      if (recents.status === "fulfilled" && Array.isArray(recents.value.data)) {
        setVersementsRecents(recents.value.data);
        setVersementsDemo(false);
      } else {
        setVersementsRecents(PAIEMENTS_EXEMPLE);
        setVersementsDemo(true);
      }

      if (eleves.status === "fulfilled") {
        setEtablissement(eleves.value.data.etablissement || "");
        setElevesSession(
          eleves.value.data.eleves.find((e) => e.inscription_active?.session_scolaire?.libelle)
            ?.inscription_active.session_scolaire.libelle || ""
        );
        setStats({
          totalEleves: eleves.value.data.stats.total,
          enRetard: eleves.value.data.stats.en_retard,
          aEchoir: eleves.value.data.stats.a_echoir,
        });
        setElevesEnRetard(
          eleves.value.data.eleves.filter((e) => e.statut_paiement === "en_retard")
        );
      }

      if (paiements.status === "fulfilled") {
        const liste = paiements.value.data;
        setTotalEncaisse(liste.reduce((s, p) => s + parseFloat(p.montant), 0));
        setTousPaiements(liste);
        setPaiementsDisponibles(true);
      } else {
        setTousPaiements([]);
        setTotalEncaisse(null);
        setPaiementsDisponibles(false);
      }

      if (parClasse.status === "fulfilled") {
        setStatsParClasse(parClasse.value.data);
        setStatsClasseDisponibles(true);
      } else {
        setStatsClasseDisponibles(false);
      }

      if (eleves.status === "fulfilled") {
        const listeEleves = eleves.value.data.eleves;
        const nouveaux = listeEleves.filter((e) => e.inscription_active?.type_inscription === "nouvelle").length;
        const reinscrits = listeEleves.filter((e) => e.inscription_active?.type_inscription === "reinscription").length;
        const aReinscrire = listeEleves.filter((e) => !e.inscription_active).length;
        setSituationInscriptions({ nouveaux, reinscrits, aReinscrire, total: listeEleves.length });
        setInscriptionsDisponibles(true);
      } else {
        setInscriptionsDisponibles(false);
      }

      if (paiements.status === "fulfilled") {
        const totaux = { inscriptions: 0, reinscriptions: 0, scolarite: 0, autres: 0 };
        paiements.value.data.forEach((p) => {
          const nom = normaliser(p.type_frais);
          const montant = parseFloat(p.montant) || 0;
          if (nom.includes("reinscription")) totaux.reinscriptions += montant;
          else if (nom.includes("inscription")) totaux.inscriptions += montant;
          else if (nom.includes("scolarite")) totaux.scolarite += montant;
          else totaux.autres += montant;
        });
        setFinances(totaux);
        setFinancesDisponibles(true);
      } else {
        setFinancesDisponibles(false);
      }
      setDateMaj(new Date());
      setEnChargement(false);
    }
    charger();
  }, [rafraichissement]);

  const enRetard = typeof stats.enRetard === "number" ? stats.enRetard : 0;
  const totalEleves = typeof stats.totalEleves === "number" ? stats.totalEleves : 0;

  // Nombre de classes réellement suivies (issu du calcul par classe)
  const nombreClasses = statsParClasse.length;

  // Part réelle des élèves pour qui une grille tarifaire a été appliquée
  const nombreSansFrais = statsParClasse.reduce((s, c) => s + (c.nombre_sans_frais || 0), 0);
  const pctCouvertureFrais = totalEleves > 0
    ? Math.round(((totalEleves - nombreSansFrais) / totalEleves) * 100)
    : 0;

  // Paiements réellement encaissés aujourd'hui
  const aujourdHui = new Date().toISOString().slice(0, 10);
  const paiementsAujourdHui = tousPaiements.filter(
    (p) => (p.date_paiement || "").slice(0, 10) === aujourdHui
  ).length;

  // Taux d'encaissement réel = montant encaissé / montant total dû sur l'ensemble des classes
  const montantTotalGlobal = statsParClasse.reduce((s, c) => s + (c.montant_total || 0), 0);
  const pctEncaisseGlobal = montantTotalGlobal > 0 && totalEncaisse !== null
    ? Math.round((totalEncaisse / montantTotalGlobal) * 100)
    : 0;

  const elevesRetardFiltres = elevesEnRetard.filter((e) => {
    if (!rechercheRetard.trim()) return true;
    const terme = normaliser(rechercheRetard.trim());
    return (
      normaliser(`${e.nom || ""} ${e.prenom || ""}`).includes(terme) ||
      normaliser(e.classe).includes(terme)
    );
  });

  const suggestionsNomsRetard = (() => {
    if (!rechercheRetard.trim()) return [];
    const terme = normaliser(rechercheRetard.trim());
    const noms = new Set();
    elevesEnRetard.forEach((e) => {
      const nom = `${e.nom || ""} ${e.prenom || ""}`.trim();
      if (nom && normaliser(nom).includes(terme)) noms.add(nom);
    });
    return Array.from(noms).slice(0, 6);
  })();

  // Poids de chaque catégorie de frais dans le total, pour les barres de progression
  const totalFinances = finances.inscriptions + finances.reinscriptions + finances.scolarite + finances.autres;
  const pctFinance = (valeur) => (totalFinances > 0 ? Math.round((valeur / totalFinances) * 100) : 0);

  // Rapport imprimable (ou PDF via "Enregistrer au format PDF") avec les donnees reelles chargees ;
  // une source en echec apparait "indisponible" dans le rapport, jamais remplacee par des exemples.
  const exporterRapport = () => {
    setErreurRapport("");
    const html = genererRapportComptableHtml({
      etablissement,
      session: elevesSession,
      dateDonnees: dateMaj,
      indicateurs: {
        totalEleves: typeof stats.totalEleves === "number" ? stats.totalEleves : null,
        paiementsAujourdhui: paiementsDisponibles ? paiementsAujourdHui : null,
        enRetard: typeof stats.enRetard === "number" ? stats.enRetard : null,
        totalEncaisse: paiementsDisponibles ? totalEncaisse : null,
      },
      finances: financesDisponibles ? finances : null,
      classes: statsClasseDisponibles ? statsParClasse : null,
      inscriptions: inscriptionsDisponibles ? situationInscriptions : null,
      elevesEnRetard: typeof stats.enRetard === "number" ? elevesEnRetard : null,
      paiements: paiementsDisponibles ? tousPaiements : null,
    });
    if (!imprimerDocument(`Rapport comptable - ${new Date().toLocaleDateString("fr-FR")}`, html)) {
      setErreurRapport("Le navigateur a bloqué la fenêtre du rapport. Autorisez les pop-ups pour ce site.");
    }
  };

  return (
    <div className="space-y-6" style={{ backgroundColor: "#f8fafc" }}>
      {/* Bannière */}
      <div
        className="relative isolate overflow-hidden p-6 sm:p-8 text-white"
        style={{
          background: "linear-gradient(135deg, #0C447C 0%, #1a6bb5 100%)",
          borderRadius: "20px",
          boxShadow: "0 12px 32px rgba(12,68,124,0.28)",
        }}
      >
        {/* Cercles décoratifs */}
        <div className="absolute -top-16 -right-10 h-56 w-56 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute top-10 right-40 h-24 w-24 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/10 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 min-w-0">
            <span className="inline-flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Espace de travail {LIBELLES_ROLES[role] || role}
              <span className="text-white/60">·</span>
              <span className="text-white/80">Session Ouverte</span>
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">Tableau de bord LAKOLI</h1>
            <p className="text-sm sm:text-base text-white/70 max-w-xl">
              Suivi des encaissements, des retards de paiement et des inscriptions de l'établissement.
            </p>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 text-xs font-medium">
                <Clock className="h-3.5 w-3.5" />
                {dateMaj
                  ? `Mis à jour le ${dateMaj.toLocaleDateString("fr-FR")} à ${dateMaj.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
                  : "Chargement…"}
              </span>
              <button
                onClick={() => setRafraichissement((n) => n + 1)}
                disabled={enChargement}
                className="h-8 w-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer disabled:cursor-wait"
                title="Actualiser"
                aria-label="Actualiser les données"
              >
                <RefreshCw className={`h-4 w-4 ${enChargement ? "animate-spin" : ""}`} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={exporterRapport}
                disabled={enChargement}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/40 text-sm font-semibold text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-60"
              >
                <FileDown className="h-4 w-4" />
                Imprimer le rapport
              </button>
              <button
                onClick={() => navigate("/frais-scolarite")}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-sm font-bold text-[#0C447C] hover:bg-blue-50 shadow-sm transition-colors cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                Enregistrer un paiement
              </button>
            </div>
          </div>
        </div>
      </div>

      {erreurRapport && (
        <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">{erreurRapport}</div>
      )}

      {/* 6 cartes statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        <StatCard
          label="Élèves inscrits"
          valeur={stats.totalEleves}
          icone={Users}
          gradient="linear-gradient(135deg, #1d4ed8, #3b82f6)"
          tendance={nombreClasses > 0 ? { sens: "hausse", texte: `${nombreClasses} classe${nombreClasses > 1 ? "s" : ""}` } : null}
          progression={pctCouvertureFrais}
        />
        <StatCard
          label="Paiements aujourd'hui"
          valeur={paiementsDisponibles ? paiementsAujourdHui : "—"}
          icone={CheckCircle2}
          gradient="linear-gradient(135deg, #059669, #10b981)"
          tendance={{ sens: "hausse", texte: `${tousPaiements.length} au total` }}
          progression={tousPaiements.length > 0 ? Math.round((paiementsAujourdHui / tousPaiements.length) * 100) : 0}
        />
        <StatCard
          label="Paiements en retard"
          valeur={stats.enRetard}
          icone={AlertTriangle}
          gradient="linear-gradient(135deg, #dc2626, #ef4444)"
          tendance={enRetard > 0 ? { sens: "baisse", texte: `${enRetard} à relancer` } : { sens: "hausse", texte: "Aucun retard" }}
          progression={totalEleves > 0 ? Math.round((enRetard / totalEleves) * 100) : 0}
        />
        <StatCard
          label="Total encaissé"
          valeur={totalEncaisse !== null ? formaterNombre(totalEncaisse) : "—"}
          unite="GNF"
          icone={Banknote}
          gradient="linear-gradient(135deg, #7c3aed, #a78bfa)"
          tendance={statsClasseDisponibles ? { sens: "hausse", texte: `${pctEncaisseGlobal}% du dû` } : null}
          progression={pctEncaisseGlobal}
        />
        <StatCard
          label="Inscriptions"
          valeur={financesDisponibles ? formaterNombre(finances.inscriptions) : "—"}
          unite="GNF"
          icone={ClipboardList}
          gradient="linear-gradient(135deg, #d97706, #f59e0b)"
          tendance={financesDisponibles ? { sens: "hausse", texte: `${pctFinance(finances.inscriptions)}% du total` } : null}
          progression={financesDisponibles ? pctFinance(finances.inscriptions) : 0}
        />
        <StatCard
          label="Réinscriptions"
          valeur={financesDisponibles ? formaterNombre(finances.reinscriptions) : "—"}
          unite="GNF"
          icone={RefreshCw}
          gradient="linear-gradient(135deg, #4f46e5, #818cf8)"
          tendance={financesDisponibles ? { sens: "hausse", texte: `${pctFinance(finances.reinscriptions)}% du total` } : null}
          progression={financesDisponibles ? pctFinance(finances.reinscriptions) : 0}
        />
      </div>

      {/* Versements (3/5) et situation des inscriptions (2/5) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-stretch">
        {/* Derniers versements encaissés */}
        <div
          className="lg:col-span-3 bg-white overflow-hidden border border-slate-100"
          style={{ borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
        >
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3 min-w-0">
              <span className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <CreditCard className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  Derniers versements encaissés
                  {versementsDemo && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold">Démo</span>
                  )}
                </h3>
                <p className="text-xs text-slate-400">Journal des encaissements en temps réel</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/paiements")}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition-colors cursor-pointer shrink-0"
            >
              Voir tout <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {versementsRecents.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">Aucun versement encaissé pour l'instant.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {versementsRecents.map((p, i) => {
                const nom = p.eleve?.nom_complet || "Élève";
                const partiel = p.statut === "partiel";
                return (
                  <li
                    key={p.id ?? i}
                    onClick={() => p.eleve?.id && navigate(`/eleves/${p.eleve.id}`)}
                    className={`flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-[#eff6ff] ${p.eleve?.id ? "cursor-pointer" : ""}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${couleurAvatar(nom)}`}>
                        {initialesNomComplet(nom)}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{nom}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                          {p.eleve?.classe && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold whitespace-nowrap">
                              {p.eleve.classe}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400 truncate">
                            {p.details?.length > 1
                              ? p.type_frais || "Paiement"
                              : [p.type_frais, p.periode].filter(Boolean).join(" · ") || "Paiement"}
                          </span>
                        </div>
                        {/* Versement regroupant plusieurs frais (ex. inscription + scolarité) : détail par frais */}
                        {p.details?.length > 1 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {p.details.map((d) => (
                              <span
                                key={d.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-semibold whitespace-nowrap"
                              >
                                {d.libelle || d.type_frais}
                                <span className="text-blue-500 font-bold tabular-nums">{formaterNombre(d.montant)}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-extrabold text-emerald-600 tabular-nums">+{formaterGNF(p.montant)}</p>
                      <div className="flex items-center justify-end gap-1.5 mt-0.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            partiel ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {partiel ? "Partiel" : "Payé"}
                        </span>
                        {p.heure && <span className="text-[11px] text-slate-400 tabular-nums">{p.heure}</span>}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex items-center justify-between gap-3 px-5 py-3 bg-slate-50/70 border-t border-slate-100 text-[11px] text-slate-400">
            <span>Tous les reçus sont générés avec référence fiscale interne</span>
            <span className="font-semibold text-slate-500 whitespace-nowrap">
              {versementsRecents.length} affiché{versementsRecents.length > 1 ? "s" : ""}
              {!versementsDemo && tousPaiements.length > 0 ? ` sur ${tousPaiements.length}` : ""}
            </span>
          </div>
        </div>

        <div className="lg:col-span-2">
          <SectionInscriptions situation={situationInscriptions} disponible={inscriptionsDisponibles} />
        </div>
      </div>

      {/* Élèves en retard de paiement */}
      <Card className="p-0 overflow-hidden">
        <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Élèves en Retard de Paiement
          </h3>
          <button
            onClick={() => navigate("/eleves?statut=en_retard")}
            className="text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition-colors cursor-pointer"
          >
            Voir tout →
          </button>
        </div>

        {elevesEnRetard.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">Aucun élève en retard. 🎉</div>
        ) : (
          <>
            {/* Barre de recherche */}
            <div className="px-5 py-3 border-b border-slate-100">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={rechercheRetard}
                  onChange={(e) => {
                    setRechercheRetard(e.target.value);
                    setSuggestionsRetardOuvertes(true);
                  }}
                  onFocus={() => setSuggestionsRetardOuvertes(true)}
                  onBlur={() => setTimeout(() => setSuggestionsRetardOuvertes(false), 150)}
                  placeholder="Rechercher un élève, une classe..."
                  className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#0C447C]/40 focus:bg-white transition-colors"
                />
                {rechercheRetard && (
                  <button
                    type="button"
                    onClick={() => {
                      setRechercheRetard("");
                      setSuggestionsRetardOuvertes(false);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors cursor-pointer"
                    aria-label="Effacer la recherche"
                  >
                    ×
                  </button>
                )}

                {suggestionsRetardOuvertes && suggestionsNomsRetard.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
                    {suggestionsNomsRetard.map((nom) => (
                      <button
                        key={nom}
                        type="button"
                        onClick={() => {
                          setRechercheRetard(nom);
                          setSuggestionsRetardOuvertes(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        {nom}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {elevesRetardFiltres.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Aucun élève ne correspond à votre recherche.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 h-64 overflow-y-auto">
                {elevesRetardFiltres.map((e) => (
                  <div
                    key={e.id}
                    onClick={() => navigate(`/eleves/${e.id}`)}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 cursor-pointer hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0">
                        {getInitialesEleve(e.nom, e.prenom)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{e.nom} {e.prenom}</p>
                        <p className="text-[11px] text-slate-400">{e.classe || "—"}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 text-[11px] font-bold shrink-0">
                      En retard
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Card>

      {/* Scolarité par classe (calcul réel : grilles tarifaires + paiements) */}
      <Card className="p-0 overflow-hidden">
        <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-[#2563EB]" />
            Scolarité par Classe
          </h3>
          <button
            onClick={() => navigate("/frais-scolarite")}
            className="text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition-colors cursor-pointer"
          >
            Gérer les frais →
          </button>
        </div>

        {!statsClasseDisponibles ? (
          <div className="py-8 text-center text-slate-400 text-xs">Impossible de calculer la scolarité par classe.</div>
        ) : statsParClasse.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">Aucune classe créée pour l'instant.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-5">Classe</th>
                  <th className="py-3 px-5">Élèves</th>
                  <th className="py-3 px-5">Montant Total</th>
                  <th className="py-3 px-5">Encaissé</th>
                  <th className="py-3 px-5">Soldés</th>
                  <th className="py-3 px-5">En Retard</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {statsParClasse.map((c) => {
                  const tauxEncaissement = c.montant_total > 0 ? Math.round((c.montant_encaisse / c.montant_total) * 100) : 0;
                  return (
                    <tr key={c.classe_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-5">
                        <p className="font-bold text-slate-900">{c.classe}</p>
                        <p className="text-[11px] text-slate-400">{c.niveau}</p>
                      </td>
                      <td className="py-3.5 px-5 text-slate-600 font-medium">{c.nombre_eleves}</td>
                      <td className="py-3.5 px-5 font-semibold text-slate-900">{formaterGNF(c.montant_total)}</td>
                      <td className="py-3.5 px-5">
                        <span className="font-bold text-emerald-600">{formaterGNF(c.montant_encaisse)}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5">({tauxEncaissement}%)</span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-bold">
                          {c.nombre_soldes}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          c.nombre_en_retard > 0 ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-500"
                        }`}>
                          {c.nombre_en_retard}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Raccourcis rapides */}
      <Card className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Raccourcis rapides</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => navigate("/eleves-ajouter")}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white shadow-xs transition-colors duration-200 cursor-pointer"
            style={{ backgroundColor: "#0C447C" }}
          >
            <Plus className="h-4 w-4" />
            Enregistrer un élève
          </button>
          {[
            { texte: "Enregistrer un paiement", chemin: "/frais-scolarite", icon: Wallet },
            { texte: "Journal de caisse", chemin: "/paiements", icon: CreditCard },
          ].map((raccourci) => (
            <button
              key={raccourci.chemin}
              onClick={() => navigate(raccourci.chemin)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white text-slate-500 border border-slate-200 shadow-xs hover:bg-[#0C447C] hover:text-white hover:border-[#0C447C] cursor-pointer transition-colors duration-200"
            >
              <raccourci.icon className="h-4 w-4" />
              {raccourci.texte}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

function TableauDeBordGenerique({ role }) {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalEleves: "—",
    enseignantsActifs: "—",
    totalEvaluations: "—",
    evaluationsAValider: "—",
    tauxRecouvrement: "—",
    totalRecouvre: "—",
    dernieresEvaluations: [],
  });

  const [derniersPaiements, setDerniersPaiements] = useState([]);
  const [paiementsDisponibles, setPaiementsDisponibles] = useState(true);
  const [finances, setFinances] = useState({ inscriptions: 0, reinscriptions: 0, scolarite: 0, autres: 0 });
  const [financesDisponibles, setFinancesDisponibles] = useState(true);
  const [situationInscriptions, setSituationInscriptions] = useState({ nouveaux: 0, reinscrits: 0, aReinscrire: 0, total: 0 });
  const [inscriptionsDisponibles, setInscriptionsDisponibles] = useState(true);

  useEffect(() => {
    async function charger() {
      const [eleves, enseignants, evaluations, paiements, tousPaiements] = await Promise.allSettled([
        api.get("/eleves"),
        api.get("/enseignants"),
        api.get("/evaluations", { params: { vue: "direction" } }),
        api.get("/frais/paiements/recent"),
        api.get("/frais/paiements"),
      ]);

      const listeEvaluations = evaluations.status === "fulfilled" ? evaluations.value.data : [];

      setStats({
        totalEleves: eleves.status === "fulfilled" ? eleves.value.data.stats.total : "—",
        enseignantsActifs: enseignants.status === "fulfilled" ? enseignants.value.data.stats.actifs : "—",
        totalEvaluations: evaluations.status === "fulfilled" ? listeEvaluations.length : "—",
        evaluationsAValider:
          evaluations.status === "fulfilled" ? listeEvaluations.filter((ev) => ev.statut === "soumis").length : "—",
        tauxRecouvrement: "—",
        totalRecouvre: "—",
        dernieresEvaluations: listeEvaluations.slice(0, 5),
      });

      if (paiements.status === "fulfilled") {
        setDerniersPaiements(Array.isArray(paiements.value.data) ? paiements.value.data.slice(0, 5) : []);
        setPaiementsDisponibles(true);
      } else {
        setPaiementsDisponibles(false);
      }

      if (eleves.status === "fulfilled") {
        const listeEleves = eleves.value.data.eleves;
        const nouveaux = listeEleves.filter((e) => e.inscription_active?.type_inscription === "nouvelle").length;
        const reinscrits = listeEleves.filter((e) => e.inscription_active?.type_inscription === "reinscription").length;
        const aReinscrire = listeEleves.filter((e) => !e.inscription_active).length;
        setSituationInscriptions({ nouveaux, reinscrits, aReinscrire, total: listeEleves.length });
        setInscriptionsDisponibles(true);
      } else {
        setInscriptionsDisponibles(false);
      }

      if (tousPaiements.status === "fulfilled") {
        const totaux = { inscriptions: 0, reinscriptions: 0, scolarite: 0, autres: 0 };
        tousPaiements.value.data.forEach((p) => {
          const nom = normaliser(p.type_frais);
          const montant = parseFloat(p.montant) || 0;
          if (nom.includes("reinscription")) totaux.reinscriptions += montant;
          else if (nom.includes("inscription")) totaux.inscriptions += montant;
          else if (nom.includes("scolarite")) totaux.scolarite += montant;
          else totaux.autres += montant;
        });
        setFinances(totaux);
        setFinancesDisponibles(true);
      } else {
        setFinancesDisponibles(false);
      }
    }
    charger();
  }, []);

  // Poids de chaque catégorie de frais dans le total, pour les barres de progression
  const totalFinances = finances.inscriptions + finances.reinscriptions + finances.scolarite + finances.autres;
  const pctFinance = (valeur) => (totalFinances > 0 ? Math.round((valeur / totalFinances) * 100) : 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tableau de Bord LAKOLI"
        description="Aperçu global en temps réel des indicateurs financiers et des activités pédagogiques de l'établissement."
        badge={`Espace de Travail ${formaterRole(role)}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon={FileText} onClick={() => navigate("/bulletins")}>
              Bulletins
            </Button>
            <Button variant="primary" icon={GraduationCap} onClick={() => navigate("/eleves")}>
              Gestion des Élèves
            </Button>
          </div>
        }
      />

      {/* 4 Cartes statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardSysteme
          title="Élèves Inscrits"
          value={stats.totalEleves}
          subtitle="Sessions scolaires actives : 2025-2026"
          icon={GraduationCap}
          onClick={() => navigate("/eleves")}
        />
        <StatCardSysteme
          title="Corps Enseignant"
          value={stats.enseignantsActifs}
          subtitle="Contrats actifs vérifiés"
          icon={Users}
          onClick={() => navigate("/enseignants")}
        />
        <StatCardSysteme
          title="Évaluations"
          value={stats.totalEvaluations}
          subtitle={`${stats.evaluationsAValider} en attente de validation`}
          icon={Award}
          onClick={() => navigate("/notes")}
        />
        <StatCardSysteme
          title="Recouvrement"
          value={stats.tauxRecouvrement !== "—" ? `${stats.tauxRecouvrement}%` : "—"}
          subtitle={`Total recouvré : ${stats.totalRecouvre} GNF`}
          icon={Wallet}
          onClick={() => navigate("/frais-scolarite")}
        />
      </div>

      {/* Répartition financière */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Répartition financière</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CarteStatistique
            titre="Inscriptions"
            valeur={financesDisponibles ? formaterGNF(finances.inscriptions) : "—"}
            icone={FileText}
            degrade="linear-gradient(135deg, #1d4ed8, #3b82f6)"
            badge={financesDisponibles ? `${pctFinance(finances.inscriptions)}% du total` : "—"}
            progression={financesDisponibles ? pctFinance(finances.inscriptions) : 0}
          />
          <CarteStatistique
            titre="Réinscriptions"
            valeur={financesDisponibles ? formaterGNF(finances.reinscriptions) : "—"}
            icone={Activity}
            degrade="linear-gradient(135deg, #059669, #10b981)"
            badge={financesDisponibles ? `${pctFinance(finances.reinscriptions)}% du total` : "—"}
            progression={financesDisponibles ? pctFinance(finances.reinscriptions) : 0}
          />
          <CarteStatistique
            titre="Scolarité"
            valeur={financesDisponibles ? formaterGNF(finances.scolarite) : "—"}
            icone={GraduationCap}
            degrade="linear-gradient(135deg, #d97706, #f59e0b)"
            badge={financesDisponibles ? `${pctFinance(finances.scolarite)}% du total` : "—"}
            progression={financesDisponibles ? pctFinance(finances.scolarite) : 0}
          />
          <CarteStatistique
            titre="Autres frais"
            valeur={financesDisponibles ? formaterGNF(finances.autres) : "—"}
            icone={Wallet}
            degrade="linear-gradient(135deg, #7c3aed, #a78bfa)"
            badge={financesDisponibles ? `${pctFinance(finances.autres)}% du total` : "—"}
            progression={financesDisponibles ? pctFinance(finances.autres) : 0}
          />
        </div>
      </div>

      {/* Deux colonnes : versements & évaluations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-[#2563EB]" />
              Derniers Versements Encaissés
            </h3>
            <Button variant="ghost" size="sm" onClick={() => navigate("/frais-scolarite")}>
              Voir tout
            </Button>
          </div>

          {!paiementsDisponibles && (
            <div className="py-8 text-center text-slate-400 text-xs">
              Connectez l'API des paiements récents.
            </div>
          )}
          {paiementsDisponibles && derniersPaiements.length === 0 && (
            <div className="py-8 text-center text-slate-400 text-xs">Aucun versement récent.</div>
          )}
          {paiementsDisponibles && derniersPaiements.length > 0 && (
            <div className="divide-y divide-slate-100">
              {derniersPaiements.map((p, i) => (
                <div key={p.id ?? i} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-slate-900">
                      {p.eleve?.nom_complet || p.eleve_nom || p.nom || "Élève"}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {p.echeance || p.date_echeance || p.periode || ""}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-[#2563EB]">+{p.montant} GNF</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#2563EB]" />
                Suivi des Évaluations
              </h3>
              <Button variant="ghost" size="sm" onClick={() => navigate("/notes")}>
                Gérer les notes
              </Button>
            </div>

            {stats.dernieresEvaluations.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">Aucune évaluation récente.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {stats.dernieresEvaluations.map((ev, i) => (
                  <div key={ev.id ?? i} className="py-3 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{ev.libelle}</p>
                      <p className="text-[10px] text-slate-400">
                        {ev.affectation?.classe?.nom} — {ev.affectation?.matiere?.nom}
                      </p>
                    </div>
                    <div>{badgeStatut(ev.statut)}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-[#2563EB]" />
                Situation des Inscriptions
              </h3>
            </div>

            {!inscriptionsDisponibles ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Impossible de charger la situation des inscriptions.
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="font-semibold text-slate-600">Nouveaux élèves</span>
                    <span className="font-bold text-slate-900">{situationInscriptions.nouveaux}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{
                        width: `${situationInscriptions.total > 0 ? Math.round((situationInscriptions.nouveaux / situationInscriptions.total) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="font-semibold text-slate-600">Réinscrits</span>
                    <span className="font-bold text-slate-900">{situationInscriptions.reinscrits}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{
                        width: `${situationInscriptions.total > 0 ? Math.round((situationInscriptions.reinscrits / situationInscriptions.total) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-600">À réinscrire</span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-[11px] font-bold">
                    {situationInscriptions.aReinscrire}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-500">Total</span>
                  <span className="font-bold text-slate-900">{situationInscriptions.total}</span>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Raccourcis rapides */}
      <Card className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Raccourcis d'administration rapides</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { texte: "Saisir un Devoir/Composition", chemin: "/notes" },
            { texte: "Enregistrer un Élève", chemin: "/eleves-ajouter" },
            { texte: "Calculer les Bulletins", chemin: "/bulletins" },
            { texte: "Consulter l'Emploi du Temps", chemin: "/emploi-du-temps" },
          ].map((raccourci) => (
            <Button
              key={raccourci.chemin}
              variant="secondary"
              className="justify-start"
              onClick={() => navigate(raccourci.chemin)}
            >
              {raccourci.texte}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}
