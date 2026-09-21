import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { ArrowLeft } from "lucide-react";
import { Card, Button, Input, Select } from "../../components/ui/LakoliDesignSystem";

export default function AjouterEleve() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    date_naissance: "",
    lieu_naissance: "",
    classe_id: "",
    pere_nom: "",
    pere_telephone: "",
    mere_nom: "",
    mere_telephone: "",
    tuteur_nom: "",
    tuteur_telephone: "",
    tuteur_lien: "",
  });

  useEffect(() => {
    api.get("/classes").then((res) => setClasses(res.data)).catch(() => {});
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    setChargement(true);
    try {
      await api.post("/eleves", form);
      navigate("/eleves");
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur lors de la création de l'élève.");
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/eleves")}
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-semibold transition-colors group cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
        Retour à la liste
      </button>

      <h2 className="text-xl font-bold text-slate-900">Ajouter un élève</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="space-y-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Identité</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nom *</label>
              <Input name="nom" value={form.nom} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Prénom *</label>
              <Input name="prenom" value={form.prenom} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Date de naissance *</label>
              <Input type="date" name="date_naissance" value={form.date_naissance} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Lieu de naissance</label>
              <Input name="lieu_naissance" value={form.lieu_naissance} onChange={handleChange} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Classe *</label>
              <Select name="classe_id" value={form.classe_id} onChange={handleChange} className="w-full" required>
                <option value="">Sélectionner une classe</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </Select>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filiation</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nom du père</label>
              <Input name="pere_nom" value={form.pere_nom} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Téléphone du père</label>
              <Input name="pere_telephone" value={form.pere_telephone} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nom de la mère</label>
              <Input name="mere_nom" value={form.mere_nom} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Téléphone de la mère</label>
              <Input name="mere_telephone" value={form.mere_telephone} onChange={handleChange} />
            </div>
          </div>

          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider pt-2">Tuteur (optionnel, si différent des parents)</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nom du tuteur</label>
              <Input name="tuteur_nom" value={form.tuteur_nom} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Téléphone du tuteur</label>
              <Input name="tuteur_telephone" value={form.tuteur_telephone} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Lien avec l'élève</label>
              <Input name="tuteur_lien" value={form.tuteur_lien} onChange={handleChange} placeholder="ex: Oncle, Grand-mère..." />
            </div>
          </div>
        </Card>

        {erreur && <p className="text-sm text-rose-600">{erreur}</p>}

        <Button type="submit" variant="primary" size="lg" disabled={chargement}>
          {chargement ? "Enregistrement..." : "Enregistrer l'élève"}
        </Button>
      </form>
    </div>
  );
}
