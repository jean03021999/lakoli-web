import { useState, useEffect } from "react";
import api from "../../services/api";
import { PageHeader, Card, Button, Input, Select } from "../../components/ui/LakoliDesignSystem";
import ChampAutocomplete from "../../components/ChampAutocomplete";
import ActionsLigne from "../../components/ActionsLigne";
import { messageErreurApi } from "../../utils/erreurs";
import { TOUS_NIVEAUX } from "../../constants/niveaux";

const champNiveauClassName =
  "w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors duration-150";
const CHAMP_LIGNE = "w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#0C447C]";

// Classes de l'etablissement : creation, modification sur place et suppression (refusee par le
// serveur si la classe a des eleves, des affectations ou des grilles tarifaires).
export default function Classes({ permissions = [] }) {
  const peutGerer = permissions.includes("classes.gerer");
  const [classes, setClasses] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [nom, setNom] = useState("");
  const [niveau, setNiveau] = useState("");
  const [filiereId, setFiliereId] = useState("");
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  const [edition, setEdition] = useState(null); // { id, nom, niveau, filiere_id }
  const [enCours, setEnCours] = useState(null);

  const charger = async () => {
    try {
      const [resClasses, resMatieres] = await Promise.all([api.get("/classes"), api.get("/matieres")]);
      setClasses(resClasses.data);
      setFilieres(resMatieres.data.filieres);
    } catch {
      setErreur("Impossible de charger les classes.");
    }
  };

  useEffect(() => {
    charger();
  }, []);

  const informer = (type, texte) => {
    setErreur(type === "erreur" ? texte : "");
    setSucces(type === "succes" ? texte : "");
  };

  const ajouterClasse = async (e) => {
    e.preventDefault();
    informer();
    try {
      await api.post("/classes", { nom, niveau, filiere_id: filiereId || null });
      setNom("");
      setNiveau("");
      setFiliereId("");
      informer("succes", "Classe ajoutée.");
      charger();
    } catch (err) {
      informer("erreur", messageErreurApi(err, "Erreur lors de l'ajout de la classe."));
    }
  };

  const enregistrer = async () => {
    setEnCours(edition.id);
    try {
      await api.put(`/classes/${edition.id}`, { nom: edition.nom, niveau: edition.niveau, filiere_id: edition.filiere_id || null });
      setEdition(null);
      informer("succes", "Classe modifiée.");
      await charger();
    } catch (err) {
      informer("erreur", messageErreurApi(err, "Erreur lors de la modification."));
    } finally {
      setEnCours(null);
    }
  };

  const supprimer = async (c) => {
    if (!window.confirm(`Supprimer la classe ${c.nom} ?`)) return;
    setEnCours(c.id);
    try {
      const res = await api.delete(`/classes/${c.id}`);
      informer("succes", res.data.message);
      await charger();
    } catch (err) {
      informer("erreur", messageErreurApi(err, "Suppression impossible."));
    } finally {
      setEnCours(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Gestion des Classes" description="Créez, modifiez et supprimez les classes de l'établissement pour l'année scolaire en cours." />

      {erreur && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5">{erreur}</p>}
      {succes && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">{succes}</p>}

      {peutGerer && (
        <Card className="space-y-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ajouter une classe</p>
          <form onSubmit={ajouterClasse} className="flex flex-wrap gap-3">
            <Input type="text" placeholder="Nom (ex: 6ème Année A)" value={nom} onChange={(e) => setNom(e.target.value)} required />
            <ChampAutocomplete value={niveau} onChange={setNiveau} suggestions={TOUS_NIVEAUX} placeholder="Niveau (ex: 6ème Année)" className={champNiveauClassName} required />
            <Select value={filiereId} onChange={(e) => setFiliereId(e.target.value)}>
              <option value="">Sans filière</option>
              {filieres.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </Select>
            <Button type="submit" variant="primary">Ajouter la classe</Button>
          </form>
        </Card>
      )}

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-semibold uppercase tracking-wider bg-slate-50/20">
                <th className="py-3 px-5">Classe</th>
                <th className="py-3 px-5">Niveau</th>
                <th className="py-3 px-5">Filière</th>
                <th className="py-3 px-5">Élèves</th>
                {peutGerer && <th className="py-3 px-5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {classes.map((c) => {
                const ed = edition?.id === c.id;
                return (
                  <tr key={c.id} className={ed ? "bg-blue-50/40" : ""}>
                    <td className="py-3 px-5 font-semibold text-slate-900">
                      {ed ? <input value={edition.nom} onChange={(e) => setEdition({ ...edition, nom: e.target.value })} className={CHAMP_LIGNE} /> : c.nom}
                    </td>
                    <td className="py-3 px-5 text-slate-600">
                      {ed ? (
                        <select value={edition.niveau} onChange={(e) => setEdition({ ...edition, niveau: e.target.value })} className={CHAMP_LIGNE}>
                          {!TOUS_NIVEAUX.includes(edition.niveau) && <option value={edition.niveau}>{edition.niveau}</option>}
                          {TOUS_NIVEAUX.map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                      ) : (
                        c.niveau
                      )}
                    </td>
                    <td className="py-3 px-5 text-slate-600">
                      {ed ? (
                        <select value={edition.filiere_id || ""} onChange={(e) => setEdition({ ...edition, filiere_id: e.target.value })} className={CHAMP_LIGNE}>
                          <option value="">Sans filière</option>
                          {filieres.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
                        </select>
                      ) : (
                        c.filiere || "—"
                      )}
                    </td>
                    <td className="py-3 px-5 text-slate-600 tabular-nums">{c.nombre_eleves}</td>
                    {peutGerer && (
                      <td className="py-3 px-5">
                        <ActionsLigne
                          libelle={c.nom}
                          enEdition={ed}
                          enCours={enCours === c.id}
                          onModifier={() => setEdition({ id: c.id, nom: c.nom, niveau: c.niveau, filiere_id: c.filiere_id ?? "" })}
                          onSupprimer={() => supprimer(c)}
                          onEnregistrer={enregistrer}
                          onAnnuler={() => setEdition(null)}
                        />
                      </td>
                    )}
                  </tr>
                );
              })}
              {classes.length === 0 && (
                <tr><td colSpan="5" className="py-8 text-center text-sm text-slate-400">Aucune classe créée.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
