import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { ArrowLeft, Calendar, MapPin, Users, Phone, CreditCard, Clock } from "lucide-react";

export default function EleveFiche() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [eleve, setEleve] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    const charger = async () => {
      try {
        const response = await api.get(`/eleves/${id}`);
        setEleve(response.data);
      } catch (err) {
        setErreur(err.response?.data?.message || "Impossible de charger la fiche.");
      } finally {
        setChargement(false);
      }
    };
    charger();
  }, [id]);

  if (chargement) return <p className="text-sm text-slate-500">Chargement...</p>;
  if (erreur) return <p className="text-sm text-rose-600">{erreur}</p>;
  if (!eleve) return null;

  const filiationParType = (type) => eleve.filiations?.find((f) => f.type_lien === type);
  const pere = filiationParType("pere");
  const mere = filiationParType("mere");
  const tuteur = filiationParType("tuteur");

  const getInitials = (nom, prenom) => `${nom?.[0] || ""}${prenom?.[0] || ""}`.toUpperCase();

  const blocFiliation = (titre, data) => (
    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100/80">
      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{titre}</span>
      {data ? (
        <div className="space-y-1">
          <span className="block text-sm font-semibold text-slate-800">{data.nom_complet}</span>
          <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-mono">
            <Phone className="h-3 w-3 text-slate-400" />
            {data.telephone || "Aucun numéro renseigné"}
          </span>
        </div>
      ) : (
        <span className="text-xs italic text-slate-400">Non renseigné</span>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/eleves")}
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-semibold transition-colors group cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
        Retour au répertoire
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Colonne gauche : identité + filiation */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6 space-y-5">
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 rounded-xl bg-blue-50 text-[#2563EB] border border-blue-100 flex items-center justify-center font-bold text-2xl uppercase shrink-0">
                {getInitials(eleve.nom, eleve.prenom)}
              </div>
              <div className="space-y-1.5 flex-1">
                <h2 className="text-xl font-bold text-slate-900 uppercase leading-none">{eleve.nom}</h2>
                <p className="text-base font-semibold text-slate-600">{eleve.prenom}</p>
                <div className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 inline-block">
                  {eleve.matricule}
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Classe</span>
                <span className="font-semibold text-slate-800">{eleve.inscription_active?.classe?.nom || "—"}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Né(e) le</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  {eleve.date_naissance || "Non renseigné"}
                </span>
              </div>
              <div className="col-span-2">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Lieu de naissance</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  {eleve.lieu_naissance || "Non renseigné"}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Type d'inscription</span>
                <span className="font-semibold text-slate-800">{eleve.inscription_active?.type_inscription || "—"}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Statut inscription</span>
                <span className="font-semibold text-slate-800">{eleve.inscription_active?.statut || "—"}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-slate-400" />
              Filiation de l'élève
            </h3>
            <div className="space-y-3">
              {blocFiliation("Père", pere)}
              {blocFiliation("Mère", mere)}
              {blocFiliation("Tuteur / Tutrice", tuteur)}
            </div>
          </div>
        </div>

        {/* Colonne droite : historique paiement */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden h-full flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="h-4.5 w-4.5 text-[#2563EB]" />
                Historique des paiements de scolarité
              </h3>
            </div>

            <div className="flex-1 overflow-x-auto">
              {eleve.frais_eleves?.some((f) => f.echeances?.length > 0) ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50/10">
                      <th className="py-3 px-5">Échéance</th>
                      <th className="py-3 px-5 text-right">Payé / Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {eleve.frais_eleves.map((frais) =>
                      frais.echeances?.map((ech) => {
                        const paye = ech.paiements?.reduce((s, p) => s + parseFloat(p.montant), 0) || 0;
                        const complet = ech.paiements?.length > 0 && paye >= ech.montant;
                        return (
                          <tr key={ech.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 px-5 font-semibold text-slate-800">{ech.libelle}</td>
                            <td
                              className={`py-3 px-5 text-right font-bold font-mono ${
                                complet ? "text-emerald-600" : "text-rose-600"
                              }`}
                            >
                              {paye} / {ech.montant} GNF
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-16 px-4">
                  <div className="h-12 w-12 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center mb-3">
                    <Clock className="h-6 w-6 text-slate-400" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-700">Aucun frais enregistré</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Aucun paiement n'a encore été enregistré pour cet élève.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
