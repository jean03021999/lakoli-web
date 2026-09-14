import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { ArrowLeft } from "lucide-react";
import { Card, Button, Input, Select } from "../../components/ui/LakoliDesignSystem";

export default function AjouterEnseignant() {
  const navigate = useNavigate();
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);
  const [form, setForm] = useState({
    nom: "", prenom: "", date_naissance: "", lieu_naissance: "", diplome: "", telephone: "", email: "",
    type_contrat: "cdi", salaire_base: "", taux_horaire_heures_sup: "", date_debut_contrat: "",
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    setChargement(true);
    try {
      await api.post("/enseignants", form);
      navigate("/enseignants");
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur lors de la création.");
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/enseignants")}
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-semibold transition-colors group cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
        Retour à la liste
      </button>
      <h2 className="text-xl font-bold text-slate-900">Ajouter un enseignant</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="space-y-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Identité</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-xs font-semibold text-slate-600 mb-1">Nom *</label><Input name="nom" value={form.nom} onChange={handleChange} required /></div>
            <div><label className="block text-xs font-semibold text-slate-600 mb-1">Prénom *</label><Input name="prenom" value={form.prenom} onChange={handleChange} required /></div>
            <div><label className="block text-xs font-semibold text-slate-600 mb-1">Date de naissance *</label><Input type="date" name="date_naissance" value={form.date_naissance} onChange={handleChange} required /></div>
            <div><label className="block text-xs font-semibold text-slate-600 mb-1">Lieu de naissance</label><Input name="lieu_naissance" value={form.lieu_naissance} onChange={handleChange} /></div>
            <div><label className="block text-xs font-semibold text-slate-600 mb-1">Diplôme</label><Input name="diplome" value={form.diplome} onChange={handleChange} /></div>
            <div><label className="block text-xs font-semibold text-slate-600 mb-1">Téléphone</label><Input name="telephone" value={form.telephone} onChange={handleChange} /></div>
            <div className="md:col-span-2"><label className="block text-xs font-semibold text-slate-600 mb-1">Email</label><Input type="email" name="email" value={form.email} onChange={handleChange} /></div>
          </div>
        </Card>

        <Card className="space-y-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contrat</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Type de contrat *</label>
              <Select name="type_contrat" value={form.type_contrat} onChange={handleChange} className="w-full">
                <option value="cdi">CDI</option>
                <option value="cdd">CDD</option>
                <option value="vacataire">Vacataire</option>
              </Select>
            </div>
            <div><label className="block text-xs font-semibold text-slate-600 mb-1">Date de début *</label><Input type="date" name="date_debut_contrat" value={form.date_debut_contrat} onChange={handleChange} required /></div>
            <div><label className="block text-xs font-semibold text-slate-600 mb-1">Salaire de base (GNF) *</label><Input type="number" name="salaire_base" value={form.salaire_base} onChange={handleChange} required /></div>
            <div><label className="block text-xs font-semibold text-slate-600 mb-1">Taux horaire heures sup. (GNF)</label><Input type="number" name="taux_horaire_heures_sup" value={form.taux_horaire_heures_sup} onChange={handleChange} /></div>
          </div>
        </Card>

        {erreur && <p className="text-sm text-rose-600">{erreur}</p>}

        <Button type="submit" variant="primary" size="lg" disabled={chargement}>
          {chargement ? "Enregistrement..." : "Enregistrer l'enseignant"}
        </Button>
      </form>
    </div>
  );
}
