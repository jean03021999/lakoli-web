import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { Plus, ChevronRight } from "lucide-react";
import { PageHeader, Card, Button, Badge, Select, Input } from "../../components/ui/LakoliDesignSystem";

function badgeStatut(statut) {
  switch (statut) {
    case "publie":
      return <Badge variant="blue">Publié</Badge>;
    case "soumis":
      return <Badge variant="outline">Soumis</Badge>;
    case "valide":
      return <Badge variant="blue">Validé</Badge>;
    case "rejete":
      return <Badge variant="neutral">Rejeté</Badge>;
    case "archive":
      return <Badge variant="neutral">Archivé</Badge>;
    default:
      return <Badge variant="neutral">Brouillon</Badge>;
  }
}

export default function Notes({ role }) {
  const [evaluations, setEvaluations] = useState([]);
  const [affectations, setAffectations] = useState([]);
  const [periodes, setPeriodes] = useState([]);
  const [erreur, setErreur] = useState("");
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [form, setForm] = useState({ affectation_id: "", periode_id: "", type: "devoir", libelle: "", date_evaluation: "", bareme: 20 });
  const navigate = useNavigate();

  const vue = role === "DIRECTEUR" ? "direction" : "enseignant";

  const charger = async () => {
    try {
      const res = await api.get("/evaluations", { params: { vue } });
      setEvaluations(res.data);
      if (vue === "enseignant") {
        const resAff = await api.get("/mes-affectations");
        setAffectations(resAff.data);
      }
      const resPer = await api.get("/periodes");
      setPeriodes(resPer.data);
    } catch (err) {
      setErreur(err.response?.data?.message || "Impossible de charger les évaluations.");
    }
  };

  useEffect(() => { charger(); }, [role]);

  const creerEvaluation = async (e) => {
    e.preventDefault();
    setErreur("");
    try {
      const res = await api.post("/evaluations", form);
      setFormulaireOuvert(false);
      navigate(`/notes/${res.data.id}/saisie`);
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur lors de la création.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={vue === "direction" ? "Validation des Évaluations" : "Gestion des Notes & Évaluations"}
        description={
          vue === "direction"
            ? "Consultez et validez les évaluations soumises par les enseignants."
            : "Créez et gérez les devoirs, compositions et interrogations de vos classes."
        }
      />

      {erreur && <p className="text-sm text-rose-600">{erreur}</p>}

      {vue === "enseignant" && (
        <Card className="space-y-4">
          <Button variant="primary" icon={Plus} onClick={() => setFormulaireOuvert(!formulaireOuvert)}>
            Nouvelle évaluation
          </Button>

          {formulaireOuvert && (
            <form onSubmit={creerEvaluation} className="flex flex-wrap items-end gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Classe / Matière</label>
                <Select value={form.affectation_id} onChange={(e) => setForm({ ...form, affectation_id: e.target.value })} required>
                  <option value="">Choisir...</option>
                  {affectations.map((a) => <option key={a.id} value={a.id}>{a.classe?.nom} — {a.matiere?.nom}</option>)}
                </Select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Période</label>
                <Select value={form.periode_id} onChange={(e) => setForm({ ...form, periode_id: e.target.value })} required>
                  <option value="">Choisir...</option>
                  {periodes.map((p) => <option key={p.id} value={p.id}>{p.libelle}</option>)}
                </Select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Type</label>
                <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="devoir">Devoir</option>
                  <option value="interrogation">Interrogation</option>
                  <option value="composition">Composition</option>
                  <option value="examen_blanc">Examen blanc</option>
                  <option value="oral">Oral</option>
                  <option value="projet">Projet</option>
                  <option value="tp">TP</option>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Libellé</label>
                <Input type="text" value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Date</label>
                <Input type="date" value={form.date_evaluation} onChange={(e) => setForm({ ...form, date_evaluation: e.target.value })} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Barème</label>
                <Input type="number" value={form.bareme} onChange={(e) => setForm({ ...form, bareme: e.target.value })} className="w-20" required />
              </div>
              <Button type="submit" variant="primary">Créer</Button>
            </form>
          )}
        </Card>
      )}

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-semibold uppercase tracking-wider bg-slate-50/20">
                <th className="py-3 px-5">Code</th>
                <th className="py-3 px-5">Libellé</th>
                <th className="py-3 px-5">Classe</th>
                <th className="py-3 px-5">Date</th>
                <th className="py-3 px-5">Statut</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {evaluations.map((ev) => (
                <tr
                  key={ev.id}
                  onClick={() => navigate(vue === "direction" ? `/notes/validation/${ev.id}` : `/notes/${ev.id}/saisie`)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-5 text-xs text-slate-400">{ev.code}</td>
                  <td className="py-3.5 px-5 font-semibold text-slate-900">{ev.libelle}</td>
                  <td className="py-3.5 px-5 text-slate-600">{ev.affectation?.classe?.nom}</td>
                  <td className="py-3.5 px-5 text-slate-600">{ev.date_evaluation}</td>
                  <td className="py-3.5 px-5">{badgeStatut(ev.statut)}</td>
                  <td className="py-3.5 px-5 text-right">
                    <div className="inline-flex items-center text-slate-400 group-hover:text-[#2563EB] transition-all transform group-hover:translate-x-1">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </td>
                </tr>
              ))}
              {evaluations.length === 0 && (
                <tr><td colSpan="6" className="py-8 text-center text-sm text-slate-400">Aucune évaluation.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
