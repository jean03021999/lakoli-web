import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { Users, CheckCircle2, Plus, ChevronRight } from "lucide-react";
import { PageHeader, Button } from "../../components/ui/LakoliDesignSystem";

function badgeContrat(type) {
  if (type === "cdi") {
    return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#2563EB]">CDI (Indéterminé)</span>;
  }
  if (type === "cdd") {
    return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600">CDD (Déterminé)</span>;
  }
  if (type === "vacataire") {
    return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">Vacataire</span>;
  }
  return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600">Aucun contrat</span>;
}

export default function Enseignants() {
  const [enseignants, setEnseignants] = useState([]);
  const [stats, setStats] = useState({ total: 0, actifs: 0 });
  const [recherche, setRecherche] = useState("");
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const navigate = useNavigate();

  const charger = async () => {
    setChargement(true);
    try {
      const params = recherche ? { recherche } : {};
      const response = await api.get("/enseignants", { params });
      setEnseignants(response.data.enseignants);
      setStats(response.data.stats);
    } catch (err) {
      setErreur(err.response?.data?.message || "Impossible de charger les enseignants.");
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    charger();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion du Corps Enseignant"
        description="Suivi des contrats, des matières enseignées et des affectations pédagogiques."
      />

      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex-1 w-full max-w-md flex gap-2">
          <input
            type="text"
            placeholder="Rechercher par nom, prénom ou matricule..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && charger()}
            className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-colors"
          />
          <Button variant="primary" onClick={charger}>Rechercher</Button>
        </div>
        <Button variant="secondary" icon={Plus} onClick={() => navigate("/enseignants-ajouter")}>
          Ajouter un enseignant
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <Users className="h-6 w-6 text-[#2563EB]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total enseignants</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{stats.total}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-lg">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contrats actifs</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{stats.actifs}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-sm font-bold text-slate-900">Répertoire des enseignants ({enseignants.length})</h2>
        </div>

        {erreur && <p className="px-5 py-3 text-sm text-rose-600">{erreur}</p>}
        {chargement && <p className="px-5 py-3 text-sm text-slate-500">Chargement...</p>}

        {!chargement && !erreur && (
          <div className="overflow-x-auto">
            {enseignants.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-semibold uppercase tracking-wider bg-slate-50/20">
                    <th className="py-3 px-5">Enseignant</th>
                    <th className="py-3 px-5">Matière(s)</th>
                    <th className="py-3 px-5">Type de Contrat</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {enseignants.map((e) => (
                    <tr
                      key={e.id}
                      onClick={() => navigate(`/enseignants/${e.id}`)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-[#2563EB] text-white text-xs font-extrabold flex items-center justify-center shadow-xs shrink-0">
                            {e.nom?.[0]}{e.prenom?.[0]}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-[#2563EB] transition-colors">
                              {e.nom} {e.prenom}
                            </div>
                            <div className="text-xs text-slate-400 font-mono mt-0.5">{e.matricule}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-slate-600 font-medium">{e.matieres?.join(", ") || "—"}</td>
                      <td className="py-3.5 px-5">{badgeContrat(e.type_contrat)}</td>
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
                <p className="text-slate-500 font-medium text-sm">Aucun enseignant trouvé.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
