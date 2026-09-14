import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import {
  Search,
  Filter,
  Plus,
  Upload,
  ChevronRight,
  Users,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { PageHeader, Button } from "../../components/ui/LakoliDesignSystem";

function badgeStatut(statut) {
  if (statut === "a_jour") {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
        À jour
      </span>
    );
  }
  if (statut === "en_retard") {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5" />
        En retard
      </span>
    );
  }
  if (statut === "a_echoir") {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
        À échoir
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
      Aucun frais
    </span>
  );
}

function getInitials(nom, prenom) {
  return `${nom?.[0] || ""}${prenom?.[0] || ""}`.toUpperCase();
}

export default function Eleves() {
  const [searchParams] = useSearchParams();
  const [eleves, setEleves] = useState([]);
  const [stats, setStats] = useState({ total: 0, a_jour: 0, en_retard: 0, a_echoir: 0 });
  const [recherche, setRecherche] = useState(searchParams.get("recherche") || "");
  const [classeFiltre, setClasseFiltre] = useState("all");
  const [statutFiltre, setStatutFiltre] = useState(searchParams.get("statut") || "all");
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const navigate = useNavigate();

  const chargerEleves = async () => {
    setChargement(true);
    setErreur("");
    try {
      const params = recherche ? { recherche } : {};
      const response = await api.get("/eleves", { params });
      setEleves(response.data.eleves);
      setStats(response.data.stats);
    } catch (err) {
      setErreur(err.response?.data?.message || "Impossible de charger les élèves.");
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerEleves();
  }, []);

  const handleRecherche = (e) => {
    e.preventDefault();
    chargerEleves();
  };

  const classesDisponibles = useMemo(() => {
    const uniques = new Set(eleves.map((e) => e.classe).filter(Boolean));
    return Array.from(uniques).sort();
  }, [eleves]);

  const elevesFiltres = eleves.filter((e) => {
    const matchClasse = classeFiltre === "all" || e.classe === classeFiltre;
    const matchStatut = statutFiltre === "all" || e.statut_paiement === statutFiltre;
    return matchClasse && matchStatut;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion de la Scolarité & des Élèves"
        description="Suivi en temps réel des inscriptions et des paiements de l'établissement."
      />

      {/* Barre de recherche et filtres */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleRecherche} className="relative flex-1 max-w-md flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, prénom ou matricule..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-colors"
            />
          </div>
          <Button type="submit" variant="primary" size="md">
            Rechercher
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={classeFiltre}
              onChange={(e) => setClasseFiltre(e.target.value)}
              className="bg-white border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
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
            className="bg-white border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
          >
            <option value="all">Tous les statuts de paiement</option>
            <option value="a_jour">À jour</option>
            <option value="a_echoir">À échoir</option>
            <option value="en_retard">En retard</option>
          </select>

          <Button variant="secondary" icon={Upload} onClick={() => navigate("/eleves-importer")}>
            Importer Excel
          </Button>
          <Button variant="primary" icon={Plus} onClick={() => navigate("/eleves-ajouter")}>
            Ajouter un élève
          </Button>
        </div>
      </div>

      {/* 4 cartes statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <Users className="h-6 w-6 text-[#2563EB]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total élèves</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{stats.total}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-lg">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Paiements à jour</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{stats.a_jour}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Paiements à échoir</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{stats.a_echoir}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-rose-50 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-rose-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Paiements en retard</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{stats.en_retard}</h3>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-sm font-bold text-slate-900">Répertoire des élèves ({elevesFiltres.length})</h2>
          <span className="text-xs text-slate-500">Cliquez sur un élève pour voir sa fiche détaillée</span>
        </div>

        {erreur && <p className="px-5 py-3 text-sm text-rose-600">{erreur}</p>}
        {chargement && <p className="px-5 py-3 text-sm text-slate-500">Chargement...</p>}

        {!chargement && !erreur && (
          <div className="overflow-x-auto">
            {elevesFiltres.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-semibold uppercase tracking-wider bg-slate-50/20">
                    <th className="py-3 px-5">Élève</th>
                    <th className="py-3 px-5">Classe</th>
                    <th className="py-3 px-5">Statut Paiement</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {elevesFiltres.map((eleve) => (
                    <tr
                      key={eleve.id}
                      onClick={() => navigate(`/eleves/${eleve.id}`)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-50 text-[#2563EB] border border-blue-100 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {getInitials(eleve.nom, eleve.prenom)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-[#2563EB] transition-colors">
                              {eleve.nom} {eleve.prenom}
                            </div>
                            <div className="text-xs text-slate-400 font-mono mt-0.5">{eleve.matricule}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-slate-600 font-medium">{eleve.classe || "—"}</td>
                      <td className="py-3.5 px-5">{badgeStatut(eleve.statut_paiement)}</td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="inline-flex items-center text-slate-400 group-hover:text-[#2563EB] transition-all transform group-hover:translate-x-1">
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 px-4">
                <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium text-sm">Aucun élève ne correspond aux filtres appliqués</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
