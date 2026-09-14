import { useState, useEffect } from "react";
import api from "../../services/api";
import ChampMatiere from "../../components/ChampMatiere";
import { PageHeader, Card, Button, Input, Select } from "../../components/ui/LakoliDesignSystem";

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

export default function Affectations() {
  const [affectations, setAffectations] = useState([]);
  const [classes, setClasses] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  const [form, setForm] = useState({ enseignant_id: "", classe_id: "", matiere_id: "", volume_horaire_hebdomadaire: "", est_classe_examen: false });

  const charger = async () => {
    try {
      const [resAff, resClasses, resMat, resEns] = await Promise.all([
        api.get("/affectations"),
        api.get("/classes"),
        api.get("/matieres"),
        api.get("/enseignants"),
      ]);
      setAffectations(resAff.data);
      setClasses(resClasses.data);
      setMatieres(resMat.data.matieres);
      setEnseignants(resEns.data.enseignants);
    } catch (err) {
      setErreur("Impossible de charger les données.");
    }
  };

  useEffect(() => { charger(); }, []);

  const ajouter = async (e) => {
    e.preventDefault();
    setErreur(""); setSucces("");
    try {
      await api.post("/affectations", form);
      setSucces("Affectation créée avec succès.");
      setForm({ enseignant_id: "", classe_id: "", matiere_id: "", volume_horaire_hebdomadaire: "", est_classe_examen: false });
      charger();
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur lors de la création.");
    }
  };

  const supprimer = async (id) => {
    setErreur(""); setSucces("");
    try {
      await api.delete(`/affectations/${id}`);
      setSucces("Affectation supprimée.");
      charger();
    } catch (err) {
      setErreur(err.response?.data?.message || "Impossible de supprimer.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des Affectations"
        description="Lier un enseignant à une classe et une matière."
      />

      {erreur && <p className="text-sm text-rose-600">{erreur}</p>}
      {succes && <p className="text-sm text-emerald-600">{succes}</p>}

      <Card className="space-y-4">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nouvelle affectation</p>
        <form onSubmit={ajouter} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Enseignant</label>
            <Select value={form.enseignant_id} onChange={(e) => setForm({ ...form, enseignant_id: e.target.value })} required>
              <option value="">Choisir...</option>
              {enseignants.map((en) => <option key={en.id} value={en.id}>{en.nom} {en.prenom}</option>)}
            </Select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Classe</label>
            <Select value={form.classe_id} onChange={(e) => setForm({ ...form, classe_id: e.target.value })} required>
              <option value="">Choisir...</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </Select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Matière</label>
            <ChampMatiere
              value={form.nomMatiere || ""}
              onChange={(val) => {
                const mat = matieres.find((m) => m.nom.toLowerCase() === val.toLowerCase());
                setForm({ ...form, nomMatiere: val, matiere_id: mat?.id || "" });
              }}
              niveau={classes.find((c) => c.id === parseInt(form.classe_id))?.niveau}
              style={champMatiereStyle}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Volume horaire/semaine</label>
            <Input
              type="number"
              min="1"
              value={form.volume_horaire_hebdomadaire}
              onChange={(e) => setForm({ ...form, volume_horaire_hebdomadaire: e.target.value })}
              className="w-20"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Classe d'examen</label>
            <label className="flex items-center gap-2 text-sm text-slate-700 py-2.5">
              <input
                type="checkbox"
                checked={form.est_classe_examen}
                onChange={(e) => setForm({ ...form, est_classe_examen: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
              />
              Oui
            </label>
          </div>
          <Button type="submit" variant="primary">Affecter</Button>
        </form>
      </Card>

      <Card className="p-0 overflow-hidden">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider p-5 pb-0">Affectations existantes</p>
        <div className="overflow-x-auto p-5 pt-3">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-2 px-2">Enseignant</th>
                <th className="py-2 px-2">Classe</th>
                <th className="py-2 px-2">Matière</th>
                <th className="py-2 px-2">H/semaine</th>
                <th className="py-2 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {affectations.map((a) => (
                <tr key={a.id}>
                  <td className="py-2.5 px-2 text-sm text-slate-800">{a.enseignant}</td>
                  <td className="py-2.5 px-2 text-sm text-slate-800">{a.classe}</td>
                  <td className="py-2.5 px-2 text-sm text-slate-800">{a.matiere}</td>
                  <td className="py-2.5 px-2 text-sm text-slate-800">{a.volume_horaire_hebdomadaire}h</td>
                  <td className="py-2.5 px-2 text-right">
                    <button
                      onClick={() => supprimer(a.id)}
                      className="px-2.5 py-1 rounded-lg border border-rose-200 text-rose-600 text-xs font-semibold hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
              {affectations.length === 0 && (
                <tr><td colSpan="5" className="py-8 text-center text-sm text-slate-400">Aucune affectation créée.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
