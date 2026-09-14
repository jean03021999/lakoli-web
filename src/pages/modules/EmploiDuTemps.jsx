import { useState, useEffect } from "react";
import api from "../../services/api";
import { Plus, Download, X } from "lucide-react";
import { PageHeader, Card, Button, Select, Input } from "../../components/ui/LakoliDesignSystem";

const JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const COULEURS_MATIERES = ["#DBEAFE", "#D1FAE5", "#FEF3C7", "#FEE2E2", "#EDE9FE", "#FCE7F3"];

export default function EmploiDuTemps() {
  const [classes, setClasses] = useState([]);
  const [classeId, setClasseId] = useState("");
  const [creneaux, setCreneaux] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [erreur, setErreur] = useState("");
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [form, setForm] = useState({ jour: "lundi", matiere_id: "", enseignant_id: "", heure_debut: "", heure_fin: "" });

  useEffect(() => {
    api.get("/classes").then((res) => setClasses(res.data));
    api.get("/matieres").then((res) => setMatieres(res.data.matieres));
    api.get("/enseignants").then((res) => setEnseignants(res.data.enseignants));
  }, []);

  const chargerCreneaux = async (id) => {
    setClasseId(id);
    if (!id) { setCreneaux([]); return; }
    try {
      const res = await api.get(`/emploi-du-temps/${id}`);
      setCreneaux(res.data);
    } catch (err) { setErreur("Impossible de charger l'emploi du temps."); }
  };

  const couleurMatiere = (nom) => {
    const index = matieres.findIndex((m) => m.nom === nom);
    return COULEURS_MATIERES[index % COULEURS_MATIERES.length] || "#F1F5F9";
  };

  const ajouterCreneau = async (e) => {
    e.preventDefault();
    setErreur("");
    try {
      await api.post("/emploi-du-temps", { classe_id: classeId, ...form });
      setFormulaireOuvert(false);
      setForm({ jour: "lundi", matiere_id: "", enseignant_id: "", heure_debut: "", heure_fin: "" });
      chargerCreneaux(classeId);
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur lors de l'ajout du créneau.");
    }
  };

  const supprimerCreneau = async (id) => {
    await api.delete(`/emploi-du-temps/${id}`);
    chargerCreneaux(classeId);
  };

  const telecharger = async () => {
    try {
      const response = await api.get(`/emploi-du-temps/${classeId}/export`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const lien = document.createElement("a");
      lien.href = url;
      const nomClasse = classes.find((c) => c.id === parseInt(classeId))?.nom || "classe";
      lien.download = `emploi_du_temps_${nomClasse}.xlsx`;
      lien.click();
    } catch (err) {
      setErreur("Impossible de télécharger le fichier.");
    }
  };

  const horaires = [...new Set(creneaux.map((c) => `${c.heure_debut}-${c.heure_fin}`))].sort();

  const trouverCreneau = (jour, horaire) => {
    const [debut, fin] = horaire.split("-");
    return creneaux.find((c) => c.jour === jour && c.heure_debut === debut && c.heure_fin === fin);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des Emplois du Temps"
        description="Planifiez les cours par classe, jour et créneau horaire."
      />

      <Card className="flex flex-wrap items-center justify-between gap-3">
        <Select value={classeId} onChange={(e) => chargerCreneaux(e.target.value)}>
          <option value="">Sélectionner une classe...</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </Select>

        {classeId && (
          <div className="flex gap-2">
            <Button variant="primary" icon={Plus} onClick={() => setFormulaireOuvert(!formulaireOuvert)}>
              Ajouter un cours
            </Button>
            <Button variant="secondary" icon={Download} onClick={telecharger}>
              Télécharger
            </Button>
          </div>
        )}
      </Card>

      {erreur && <p className="text-sm text-rose-600">{erreur}</p>}

      {formulaireOuvert && (
        <Card>
          <form onSubmit={ajouterCreneau} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Jour</label>
              <Select value={form.jour} onChange={(e) => setForm({ ...form, jour: e.target.value })}>
                {JOURS.map((j) => <option key={j} value={j}>{j.charAt(0).toUpperCase() + j.slice(1)}</option>)}
              </Select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Matière</label>
              <Select value={form.matiere_id} onChange={(e) => setForm({ ...form, matiere_id: e.target.value })} required>
                <option value="">Choisir...</option>
                {matieres.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}
              </Select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Enseignant</label>
              <Select value={form.enseignant_id} onChange={(e) => setForm({ ...form, enseignant_id: e.target.value })} required>
                <option value="">Choisir...</option>
                {enseignants.map((en) => <option key={en.id} value={en.id}>{en.nom} {en.prenom}</option>)}
              </Select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Début</label>
              <Input type="time" value={form.heure_debut} onChange={(e) => setForm({ ...form, heure_debut: e.target.value })} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Fin</label>
              <Input type="time" value={form.heure_fin} onChange={(e) => setForm({ ...form, heure_fin: e.target.value })} required />
            </div>
            <Button type="submit" variant="primary">Ajouter</Button>
          </form>
        </Card>
      )}

      {classeId && (
        <Card className="overflow-x-auto">
          {horaires.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">
              Aucun cours planifié. Cliquez sur "Ajouter un cours" pour commencer.
            </p>
          ) : (
            <table className="w-full border-collapse min-w-[700px]">
              <thead>
                <tr>
                  <th className="p-2.5 text-xs font-bold text-slate-700 capitalize bg-slate-50 border border-slate-200 text-center">Horaire</th>
                  {JOURS.map((j) => (
                    <th key={j} className="p-2.5 text-xs font-bold text-slate-700 capitalize bg-slate-50 border border-slate-200 text-center">{j}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {horaires.map((horaire) => (
                  <tr key={horaire}>
                    <td className="p-2 text-xs font-bold text-slate-700 border border-slate-200 bg-slate-50 text-center whitespace-nowrap">
                      {horaire.replace("-", " – ")}
                    </td>
                    {JOURS.map((jour) => {
                      const c = trouverCreneau(jour, horaire);
                      return (
                        <td
                          key={jour}
                          className="p-1.5 border border-slate-200 align-top"
                          style={{ backgroundColor: c ? couleurMatiere(c.matiere) : "#FFFFFF" }}
                        >
                          {c && (
                            <div className="relative">
                              <p className="text-[11px] font-bold text-slate-800 m-0">{c.matiere}</p>
                              <p className="text-[10px] text-slate-500 m-0">{c.enseignant}</p>
                              <button
                                onClick={() => supprimerCreneau(c.id)}
                                className="absolute -top-0.5 -right-0.5 text-rose-500 hover:text-rose-700 cursor-pointer"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </div>
  );
}
