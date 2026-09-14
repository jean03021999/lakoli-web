import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { ArrowLeft, Phone, Mail, GraduationCap, Award } from "lucide-react";

export default function EnseignantFiche() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [enseignant, setEnseignant] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    api
      .get(`/enseignants/${id}`)
      .then((res) => setEnseignant(res.data))
      .catch((err) => setErreur(err.response?.data?.message || "Impossible de charger la fiche."))
      .finally(() => setChargement(false));
  }, [id]);

  if (chargement) return <p className="text-sm text-slate-500">Chargement...</p>;
  if (erreur) return <p className="text-sm text-rose-600">{erreur}</p>;
  if (!enseignant) return null;

  const contratActif = enseignant.contrats?.find((c) => c.statut === "actif");

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/enseignants")}
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-semibold transition-colors group cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
        Retour à la liste
      </button>

      {/* Identité */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6">
        <div className="flex items-start gap-5">
          <div className="h-20 w-20 rounded-xl bg-blue-50 text-[#2563EB] border border-blue-100 flex items-center justify-center font-bold text-2xl uppercase shrink-0">
            {enseignant.nom?.[0]}{enseignant.prenom?.[0]}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">{enseignant.nom} {enseignant.prenom}</h2>
            <p className="text-sm text-slate-400 font-mono mt-1 mb-4">{enseignant.matricule}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5" /> Diplôme
                </span>
                <span className="font-semibold text-slate-800">{enseignant.diplome || "—"}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> Téléphone
                </span>
                <span className="font-semibold text-slate-800">{enseignant.telephone || "—"}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> Email
                </span>
                <span className="font-semibold text-slate-800">{enseignant.email || "—"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contrat actif */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Contrat actif</h3>
        {contratActif ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Type</span>
              <span className="font-semibold text-slate-800">{contratActif.type?.toUpperCase()}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Date de début</span>
              <span className="font-semibold text-slate-800">{contratActif.date_debut}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Salaire de base</span>
              <span className="font-semibold text-slate-800">{contratActif.salaire_base} GNF</span>
            </div>
            {contratActif.taux_horaire_heures_sup && (
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Taux heures sup.</span>
                <span className="font-semibold text-slate-800">{contratActif.taux_horaire_heures_sup} GNF/h</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic">Aucun contrat actif.</p>
        )}
      </div>

      {/* Affectations */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
          <Award className="h-4 w-4 text-slate-400" /> Affectations
        </h3>
        {enseignant.affectations?.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {enseignant.affectations.map((aff) => (
              <div key={aff.id} className="py-3 flex items-center justify-between text-sm">
                <span className="text-slate-800 font-medium">
                  {aff.classe?.nom} — {aff.matiere?.nom}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{aff.volume_horaire_hebdomadaire}h/semaine</span>
                  {aff.est_classe_examen && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold">
                      Classe d'examen
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic">Aucune affectation.</p>
        )}
      </div>
    </div>
  );
}
