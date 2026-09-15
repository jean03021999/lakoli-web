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
  Calendar,
  MoreVertical,
  Plus,
  Upload,
  ChevronDown,
  Search,
} from "lucide-react";
import api from "../../services/api";
import { StatCard, Card, Badge, Button, PageHeader } from "../../components/ui/LakoliDesignSystem";

function formaterRole(role) {
  if (!role) return "";
  return role.charAt(0) + role.slice(1).toLowerCase();
}

function formaterGNF(montant) {
  return `${Number(montant).toLocaleString("fr-FR")} GNF`;
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
    return <TableauDeBordComptable />;
  }
  return <TableauDeBordGenerique role={role} />;
}

function TableauDeBordComptable() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({ totalEleves: "—", enRetard: "—", aEchoir: "—" });
  const [elevesEnRetard, setElevesEnRetard] = useState([]);
  const [tousPaiements, setTousPaiements] = useState([]);
  const [totalEncaisse, setTotalEncaisse] = useState(null);
  const [paiementsDisponibles, setPaiementsDisponibles] = useState(true);
  const [versementsOuvert, setVersementsOuvert] = useState(true);
  const [rechercheVersements, setRechercheVersements] = useState("");
  const [suggestionsOuvertes, setSuggestionsOuvertes] = useState(false);
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
      const [eleves, paiements, parClasse] = await Promise.allSettled([
        api.get("/eleves"),
        api.get("/frais/paiements"),
        api.get("/frais/stats-par-classe"),
      ]);

      if (eleves.status === "fulfilled") {
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
        setTousPaiements(PAIEMENTS_EXEMPLE);
        setPaiementsDisponibles(true);
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
    }
    charger();
  }, []);

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

  const paiementsFiltres = tousPaiements.filter((p) => {
    if (!rechercheVersements.trim()) return true;
    const terme = normaliser(rechercheVersements.trim());
    return (
      normaliser(p.eleve?.nom_complet).includes(terme) ||
      normaliser(p.eleve?.classe).includes(terme) ||
      normaliser(p.periode || p.libelle).includes(terme)
    );
  });

  const suggestionsNoms = (() => {
    if (!rechercheVersements.trim()) return [];
    const terme = normaliser(rechercheVersements.trim());
    const noms = new Set();
    tousPaiements.forEach((p) => {
      const nom = p.eleve?.nom_complet;
      if (nom && normaliser(nom).includes(terme)) noms.add(nom);
    });
    return Array.from(noms).slice(0, 6);
  })();

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

  return (
    <div className="space-y-6" style={{ backgroundColor: "#f8fafc" }}>
      <div
        className="sticky top-0 z-10 rounded-2xl p-5 sm:p-6 flex flex-col items-center justify-center text-center shadow-md"
        style={{ background: "linear-gradient(135deg, #0C447C, #1a5a9e)" }}
      >
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Tableau de Bord Comptable
        </h1>
      </div>

      {/* 4 Cartes statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CarteStatistique
          titre="Élèves Inscrits"
          valeur={stats.totalEleves}
          icone={Users}
          degrade="linear-gradient(135deg, #1d4ed8, #3b82f6)"
          badge={nombreClasses > 0 ? `${nombreClasses} classe${nombreClasses > 1 ? "s" : ""}` : "—"}
          progression={pctCouvertureFrais}
        />
        <CarteStatistique
          titre="Paiements Aujourd'hui"
          valeur={paiementsDisponibles ? paiementsAujourdHui : "—"}
          icone={Calendar}
          degrade="linear-gradient(135deg, #059669, #10b981)"
          badge={`${tousPaiements.length} au total`}
          progression={tousPaiements.length > 0 ? Math.round((paiementsAujourdHui / tousPaiements.length) * 100) : 0}
        />
        <CarteStatistique
          titre="Paiements en Retard"
          valeur={stats.enRetard}
          icone={AlertTriangle}
          degrade="linear-gradient(135deg, #d97706, #f59e0b)"
          badge={enRetard > 0 ? `${enRetard} à relancer` : "Aucun retard"}
          progression={enRetard > 0 ? Math.max(15, 100 - enRetard * 10) : 100}
        />
        <CarteStatistique
          titre="Total Encaissé"
          valeur={totalEncaisse !== null ? formaterGNF(totalEncaisse) : "—"}
          icone={Wallet}
          degrade="linear-gradient(135deg, #7c3aed, #a78bfa)"
          badge={statsClasseDisponibles ? `${pctEncaisseGlobal}% du dû` : "—"}
          progression={pctEncaisseGlobal}
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

      {/* Situation des inscriptions */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
            </div>

            <div className="space-y-4">
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
          </div>
        )}
      </Card>

      {/* Derniers versements encaissés — liste déroulante avec recherche */}
      <Card className="p-0 overflow-hidden">
        <button
          onClick={() => setVersementsOuvert((v) => !v)}
          className="w-full flex justify-between items-center px-5 py-4 border-b border-slate-100 cursor-pointer"
        >
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="h-4 w-4 text-[#2563EB]" />
            Derniers Versements Encaissés
            <span className="text-[11px] font-semibold text-slate-400">({tousPaiements.length})</span>
          </h3>
          <div className="flex items-center gap-3">
            <span
              onClick={(e) => { e.stopPropagation(); navigate("/frais-scolarite"); }}
              className="text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition-colors"
            >
              Voir tout →
            </span>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${versementsOuvert ? "rotate-180" : ""}`} />
          </div>
        </button>

        {versementsOuvert && (
          <>
            {/* Barre de recherche */}
            <div className="px-5 py-3 border-b border-slate-100">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={rechercheVersements}
                  onChange={(e) => {
                    setRechercheVersements(e.target.value);
                    setSuggestionsOuvertes(true);
                  }}
                  onFocus={() => setSuggestionsOuvertes(true)}
                  onBlur={() => setTimeout(() => setSuggestionsOuvertes(false), 150)}
                  placeholder="Rechercher un élève, une classe, une période..."
                  className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#0C447C]/40 focus:bg-white transition-colors"
                />
                {rechercheVersements && (
                  <button
                    type="button"
                    onClick={() => {
                      setRechercheVersements("");
                      setSuggestionsOuvertes(false);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors cursor-pointer"
                    aria-label="Effacer la recherche"
                  >
                    ×
                  </button>
                )}

                {suggestionsOuvertes && suggestionsNoms.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
                    {suggestionsNoms.map((nom) => (
                      <button
                        key={nom}
                        type="button"
                        onClick={() => {
                          setRechercheVersements(nom);
                          setSuggestionsOuvertes(false);
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

            {!paiementsDisponibles ? (
              <div className="py-8 text-center text-slate-400 text-xs">Impossible de charger les paiements.</div>
            ) : paiementsFiltres.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                {rechercheVersements ? "Aucun versement ne correspond à votre recherche." : "Aucun versement récent."}
              </div>
            ) : (
              <div className="overflow-x-auto h-64 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                      <th className="py-3 px-5">Élève</th>
                      <th className="py-3 px-5">Classe</th>
                      <th className="py-3 px-5">Montant</th>
                      <th className="py-3 px-5">Date</th>
                      <th className="py-3 px-5">Statut</th>
                      <th className="py-3 px-5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paiementsFiltres.map((p, i) => (
                      <tr key={p.id ?? i} className="hover:bg-slate-50/60 transition-colors bg-white">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                              {(p.eleve?.nom_complet || "?").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate">{p.eleve?.nom_complet || "Élève"}</p>
                              <p className="text-[11px] text-slate-400">{p.periode || p.libelle || ""}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                            {p.eleve?.classe || "—"}
                          </span>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="font-bold text-emerald-600">+{formaterGNF(p.montant)}</span>
                        </td>
                        <td className="py-3.5 px-5 text-xs text-slate-500 leading-tight">
                          <p>{p.date_paiement || "—"}</p>
                          {p.heure && <p className="text-[10px] text-slate-400">{p.heure}</p>}
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-bold">
                            <CheckCircle2 className="h-3 w-3" />
                            Payé
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <button
                            onClick={() => p.eleve?.id && navigate(`/eleves/${p.eleve.id}`)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </Card>

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
            { texte: "Importer des élèves (Excel)", chemin: "/eleves-importer", icon: Upload },
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
        <StatCard
          title="Élèves Inscrits"
          value={stats.totalEleves}
          subtitle="Sessions scolaires actives : 2025-2026"
          icon={GraduationCap}
          onClick={() => navigate("/eleves")}
        />
        <StatCard
          title="Corps Enseignant"
          value={stats.enseignantsActifs}
          subtitle="Contrats actifs vérifiés"
          icon={Users}
          onClick={() => navigate("/enseignants")}
        />
        <StatCard
          title="Évaluations"
          value={stats.totalEvaluations}
          subtitle={`${stats.evaluationsAValider} en attente de validation`}
          icon={Award}
          onClick={() => navigate("/notes")}
        />
        <StatCard
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
