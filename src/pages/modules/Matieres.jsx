import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import ChampMatiere from "../../components/ChampMatiere";
import { School } from "lucide-react";
import { PageHeader, Card, Button, Input, Select } from "../../components/ui/LakoliDesignSystem";

const NIVEAUX_COLLEGE_LYCEE = ["7eme", "8eme", "9eme", "10eme", "11eme", "12eme", "Terminale"];

const champMatiereStyle = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid #E2E8F0",
  fontSize: "13px",
  color: "#1e293b",
  backgroundColor: "#FFFFFF",
  boxSizing: "border-box",
};

export default function Matieres() {
  const navigate = useNavigate();
  const [matieres, setMatieres] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [nomMatiere, setNomMatiere] = useState("");
  const [coefficient, setCoefficient] = useState("");
  const [compteDansMoyenne, setCompteDansMoyenne] = useState(true);
  const [filiereId, setFiliereId] = useState("");
  const [niveau, setNiveau] = useState("");
  const [nomFiliere, setNomFiliere] = useState("");
  const [erreur, setErreur] = useState("");

  const charger = async () => {
    try {
      const response = await api.get("/matieres");
      setMatieres(response.data.matieres);
      setFilieres(response.data.filieres);
    } catch (err) {
      setErreur("Impossible de charger les données.");
    }
  };

  useEffect(() => { charger(); }, []);

  const ajouterMatiere = async (e) => {
    e.preventDefault();
    try {
      await api.post("/matieres", {
        nom: nomMatiere,
        coefficient: coefficient || null,
        filiere_id: filiereId || null,
        niveau: niveau || null,
        compte_dans_moyenne: compteDansMoyenne,
      });
      setNomMatiere(""); setCoefficient(""); setFiliereId(""); setNiveau(""); setCompteDansMoyenne(true);
      charger();
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur lors de l'ajout.");
    }
  };

  const ajouterFiliere = async (e) => {
    e.preventDefault();
    try {
      await api.post("/filieres", { nom: nomFiliere, niveau_a_partir_de: "11eme" });
      setNomFiliere("");
      charger();
    } catch (err) {
      setErreur("Erreur lors de l'ajout de la filière.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des Matières & Coefficients"
        description="Créez les matières et les filières de l'établissement."
        actions={
          <Button variant="secondary" icon={School} onClick={() => navigate("/classes")}>
            Gérer les classes
          </Button>
        }
      />

      {erreur && <p className="text-sm text-rose-600">{erreur}</p>}

      <Card className="space-y-4">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ajouter une matière</p>
        <form onSubmit={ajouterMatiere} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Matière</label>
            <ChampMatiere value={nomMatiere} onChange={setNomMatiere} niveau={niveau} style={champMatiereStyle} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Coefficient</label>
            <Input type="number" value={coefficient} onChange={(e) => setCoefficient(e.target.value)} className="w-20" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Niveau</label>
            <Select value={niveau} onChange={(e) => setNiveau(e.target.value)}>
              <option value="">Tous niveaux</option>
              {NIVEAUX_COLLEGE_LYCEE.map((n) => <option key={n} value={n}>{n}</option>)}
            </Select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Filière (si Lycée)</label>
            <Select value={filiereId} onChange={(e) => setFiliereId(e.target.value)}>
              <option value="">Aucune</option>
              {filieres.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </Select>
          </div>
          <Button type="submit" variant="primary">Ajouter</Button>
        </form>
      </Card>

      <Card className="space-y-4">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ajouter une filière (Lycée)</p>
        <form onSubmit={ajouterFiliere} className="flex gap-3">
          <Input
            type="text"
            placeholder="ex: Scientifique, Littéraire..."
            value={nomFiliere}
            onChange={(e) => setNomFiliere(e.target.value)}
            className="flex-1"
            required
          />
          <Button type="submit" variant="secondary">Ajouter la filière</Button>
        </form>
      </Card>

      <Card className="p-0 overflow-hidden">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider p-5 pb-0">Matières existantes</p>
        <div className="overflow-x-auto p-5 pt-3">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-2 px-2">Matière</th>
                <th className="py-2 px-2">Coefficients définis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matieres.map((m) => (
                <tr key={m.id}>
                  <td className="py-2.5 px-2 text-sm font-semibold text-slate-900">{m.nom}</td>
                  <td className="py-2.5 px-2 text-xs text-slate-500">
                    {m.coefficients?.length > 0
                      ? m.coefficients.map((c) => `${c.filiere?.nom || c.niveau || "Général"}: ${c.coefficient}`).join(" · ")
                      : "Non défini"}
                  </td>
                </tr>
              ))}
              {matieres.length === 0 && (
                <tr><td colSpan="2" className="py-8 text-center text-sm text-slate-400">Aucune matière ajoutée.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
