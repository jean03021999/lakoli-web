import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { ArrowLeft, Check, X, Send } from "lucide-react";
import { Card, Button, Badge } from "../../components/ui/LakoliDesignSystem";

export default function ValidationNotes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState(null);
  const [commentaire, setCommentaire] = useState("");
  const [erreur, setErreur] = useState("");
  const [afficherRejet, setAfficherRejet] = useState(false);

  const charger = async () => {
    try {
      const res = await api.get(`/evaluations/${id}`);
      setEvaluation(res.data);
    } catch (err) { setErreur("Impossible de charger l'évaluation."); }
  };

  useEffect(() => { charger(); }, [id]);

  const valider = async () => {
    setErreur("");
    try {
      await api.post(`/evaluations/${id}/valider`);
      navigate("/notes");
    } catch (err) { setErreur(err.response?.data?.message || "Erreur lors de la validation."); }
  };

  const rejeter = async () => {
    setErreur("");
    try {
      await api.post(`/evaluations/${id}/rejeter`, { commentaire });
      navigate("/notes");
    } catch (err) { setErreur(err.response?.data?.message || "Erreur lors du rejet."); }
  };

  const publier = async () => {
    setErreur("");
    try {
      await api.post(`/evaluations/${id}/publier`);
      navigate("/notes");
    } catch (err) { setErreur(err.response?.data?.message || "Erreur lors de la publication."); }
  };

  if (!evaluation) return <p className="text-sm text-slate-500">Chargement...</p>;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/notes")}
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-semibold transition-colors group cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
        Retour
      </button>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs text-slate-400">{evaluation.code}</p>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">{evaluation.libelle}</h2>
          <p className="text-xs text-slate-500 mt-1">
            {evaluation.affectation?.classe?.nom} — {evaluation.affectation?.matiere?.nom}
          </p>
        </div>
        <Badge variant={evaluation.statut === "valide" ? "blue" : "outline"}>{evaluation.statut}</Badge>
      </div>

      {erreur && <p className="text-sm text-rose-600">{erreur}</p>}

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-semibold uppercase tracking-wider bg-slate-50/20">
                <th className="py-3 px-5">Élève</th>
                <th className="py-3 px-5">Note / {evaluation.bareme}</th>
                <th className="py-3 px-5">Présence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {evaluation.notes?.map((n) => (
                <tr key={n.id}>
                  <td className="py-3 px-5 text-slate-800 font-medium">{n.eleve?.nom} {n.eleve?.prenom}</td>
                  <td className="py-3 px-5 text-slate-800">{n.valeur ?? "—"}</td>
                  <td className="py-3 px-5 text-xs text-slate-500">{n.statut_presence.replace("_", " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-5 border-t border-slate-100 space-y-4">
          {evaluation.statut === "soumis" && (
            <div className="flex gap-3">
              <Button variant="primary" icon={Check} onClick={valider}>Valider</Button>
              <Button
                variant="secondary"
                icon={X}
                className="!text-rose-600 !border-rose-200 hover:!bg-rose-50"
                onClick={() => setAfficherRejet(!afficherRejet)}
              >
                Rejeter
              </Button>
            </div>
          )}

          {evaluation.statut === "valide" && (
            <Button variant="primary" icon={Send} onClick={publier}>Publier</Button>
          )}

          {afficherRejet && (
            <div className="space-y-2">
              <textarea
                placeholder="Motif du rejet (obligatoire)..."
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm min-h-[80px] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
              <button
                onClick={rejeter}
                disabled={!commentaire}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Confirmer le rejet
              </button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
