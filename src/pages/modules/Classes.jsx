import { useState, useEffect } from "react";
import api from "../../services/api";
import { PageHeader, Card, Button, Input, Select } from "../../components/ui/LakoliDesignSystem";

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [nom, setNom] = useState("");
  const [niveau, setNiveau] = useState("");
  const [filiereId, setFiliereId] = useState("");
  const [erreur, setErreur] = useState("");

  const charger = async () => {
    try {
      const [resClasses, resMatieres] = await Promise.all([
        api.get("/classes"),
        api.get("/matieres"),
      ]);
      setClasses(resClasses.data);
      setFilieres(resMatieres.data.filieres);
    } catch (err) {
      setErreur("Impossible de charger les classes.");
    }
  };

  useEffect(() => { charger(); }, []);

  const ajouterClasse = async (e) => {
    e.preventDefault();
    setErreur("");
    try {
      await api.post("/classes", { nom, niveau, filiere_id: filiereId || null });
      setNom(""); setNiveau(""); setFiliereId("");
      charger();
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur lors de l'ajout de la classe.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des Classes"
        description="Créez et consultez les classes de l'établissement pour l'année scolaire en cours."
      />

      {erreur && <p className="text-sm text-rose-600">{erreur}</p>}

      <Card className="space-y-4">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ajouter une classe</p>
        <form onSubmit={ajouterClasse} className="flex flex-wrap gap-3">
          <Input type="text" placeholder="Nom (ex: 6ème A)" value={nom} onChange={(e) => setNom(e.target.value)} required />
          <Input type="text" placeholder="Niveau (ex: 6eme annee)" value={niveau} onChange={(e) => setNiveau(e.target.value)} required />
          <Select value={filiereId} onChange={(e) => setFiliereId(e.target.value)}>
            <option value="">Sans filière</option>
            {filieres.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
          </Select>
          <Button type="submit" variant="primary">Ajouter la classe</Button>
        </form>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-semibold uppercase tracking-wider bg-slate-50/20">
                <th className="py-3 px-5">Classe</th>
                <th className="py-3 px-5">Niveau</th>
                <th className="py-3 px-5">Filière</th>
                <th className="py-3 px-5">Élèves</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {classes.map((c) => (
                <tr key={c.id}>
                  <td className="py-3 px-5 font-semibold text-slate-900">{c.nom}</td>
                  <td className="py-3 px-5 text-slate-600">{c.niveau}</td>
                  <td className="py-3 px-5 text-slate-600">{c.filiere || "—"}</td>
                  <td className="py-3 px-5 text-slate-600">{c.nombre_eleves}</td>
                </tr>
              ))}
              {classes.length === 0 && (
                <tr><td colSpan="4" className="py-8 text-center text-sm text-slate-400">Aucune classe créée.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
