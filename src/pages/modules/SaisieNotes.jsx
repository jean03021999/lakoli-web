import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Card, Button, Badge } from "../../components/ui/LakoliDesignSystem";

export default function SaisieNotes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState(null);
  const [notes, setNotes] = useState({});
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");

  const charger = async () => {
    try {
      const res = await api.get(`/evaluations/${id}`);
      setEvaluation(res.data);
      const init = {};
      res.data.notes.forEach((n) => { init[n.eleve_id] = { valeur: n.valeur || "", statut_presence: n.statut_presence }; });
      setNotes(init);
    } catch (err) { setErreur("Impossible de charger l'évaluation."); }
  };

  useEffect(() => { charger(); }, [id]);

  const modifierNote = (eleveId, champ, valeur) => {
    setNotes({ ...notes, [eleveId]: { ...notes[eleveId], [champ]: valeur } });
  };

  const enregistrer = async () => {
    setErreur(""); setSucces("");
    try {
      const payload = Object.entries(notes).map(([eleve_id, n]) => ({ eleve_id: parseInt(eleve_id), ...n }));
      await api.put(`/evaluations/${id}/notes`, { notes: payload });
      setSucces("Notes enregistrées.");
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur lors de l'enregistrement.");
    }
  };

  const soumettre = async () => {
    setErreur("");
    try {
      await enregistrer();
      await api.post(`/evaluations/${id}/soumettre`);
      navigate("/notes");
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur lors de la soumission.");
    }
  };

  if (!evaluation) return <p className="text-sm text-slate-500">Chargement...</p>;

  const estBrouillon = evaluation.statut === "brouillon";

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/notes")}
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-semibold transition-colors group cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
        Retour à la liste
      </button>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs text-slate-400">{evaluation.code}</p>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">{evaluation.libelle}</h2>
          <p className="text-xs text-slate-500 mt-1">
            {evaluation.affectation?.classe?.nom} — {evaluation.affectation?.matiere?.nom} — Barème : {evaluation.bareme}
          </p>
        </div>
        <Badge variant={estBrouillon ? "outline" : "blue"}>{evaluation.statut}</Badge>
      </div>

      {!estBrouillon && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-2.5 text-sm text-amber-700 font-medium">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Cette évaluation est au statut "{evaluation.statut}" — les notes ne peuvent plus être modifiées.
        </div>
      )}

      {erreur && <p className="text-sm text-rose-600">{erreur}</p>}
      {succes && <p className="text-sm text-emerald-600">{succes}</p>}

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
                <tr key={n.eleve_id}>
                  <td className="py-3 px-5 text-slate-800 font-medium">{n.eleve?.nom} {n.eleve?.prenom}</td>
                  <td className="py-3 px-5">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max={evaluation.bareme}
                      disabled={!estBrouillon || notes[n.eleve_id]?.statut_presence !== "present"}
                      value={notes[n.eleve_id]?.valeur ?? ""}
                      onChange={(e) => modifierNote(n.eleve_id, "valeur", e.target.value)}
                      className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-[#2563EB] disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </td>
                  <td className="py-3 px-5">
                    <select
                      disabled={!estBrouillon}
                      value={notes[n.eleve_id]?.statut_presence || "present"}
                      onChange={(e) => modifierNote(n.eleve_id, "statut_presence", e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#2563EB] disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="present">Présent</option>
                      <option value="absent_justifie">Absent justifié</option>
                      <option value="absent_non_justifie">Absent non justifié</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {estBrouillon && (
          <div className="p-5 border-t border-slate-100 flex gap-3">
            <Button variant="secondary" onClick={enregistrer}>Enregistrer brouillon</Button>
            <Button variant="primary" onClick={soumettre}>Soumettre à la direction</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
