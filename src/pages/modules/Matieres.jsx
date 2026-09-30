import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import ChampMatiere from "../../components/ChampMatiere";
import ActionsLigne from "../../components/ActionsLigne";
import { messageErreurApi } from "../../utils/erreurs";
import { School, X, Pencil, Check } from "lucide-react";
import { PageHeader, Card, Button, Input, Select } from "../../components/ui/LakoliDesignSystem";
import { TOUS_NIVEAUX } from "../../constants/niveaux";

const MATIERES_NON_COEFFICIENTEES = ["EPS", "Chant et Récitation", "Arts Plastiques", "Langage", "Éveil"];
const CHAMP_LIGNE = "w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#0C447C]";

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

// Coefficient d'une matiere : pastille modifiable sur place (valeur, compte dans la moyenne) ou
// supprimable.
function PastilleCoefficient({ coef, peutGerer, onModifie, onErreur }) {
  const [edition, setEdition] = useState(null);
  const [enCours, setEnCours] = useState(false);
  const cible = coef.filiere?.nom || coef.niveau || "Général";

  const enregistrer = async () => {
    setEnCours(true);
    try {
      await api.put(`/coefficients/${coef.id}`, { coefficient: edition.coefficient, compte_dans_moyenne: edition.compte });
      setEdition(null);
      await onModifie("Coefficient modifié.");
    } catch (err) {
      onErreur(messageErreurApi(err, "Erreur lors de la modification du coefficient."));
    } finally {
      setEnCours(false);
    }
  };

  const supprimer = async () => {
    if (!window.confirm(`Supprimer le coefficient « ${cible} » ?`)) return;
    setEnCours(true);
    try {
      await api.delete(`/coefficients/${coef.id}`);
      await onModifie("Coefficient supprimé.");
    } catch (err) {
      onErreur(messageErreurApi(err, "Suppression impossible."));
      setEnCours(false);
    }
  };

  if (edition) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-50 border border-blue-200 text-xs">
        <span className="font-semibold text-slate-600">{cible} :</span>
        <input type="number" min="0" step="0.5" value={edition.coefficient} onChange={(e) => setEdition({ ...edition, coefficient: e.target.value })} className="w-14 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs" />
        <label className="inline-flex items-center gap-1 text-[11px] text-slate-600">
          <input type="checkbox" checked={edition.compte} onChange={(e) => setEdition({ ...edition, compte: e.target.checked })} />
          compte
        </label>
        <button onClick={enregistrer} disabled={enCours} className="text-emerald-600 cursor-pointer" title="Enregistrer"><Check className="w-3.5 h-3.5" /></button>
        <button onClick={() => setEdition(null)} className="text-slate-400 cursor-pointer" title="Annuler"><X className="w-3.5 h-3.5" /></button>
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs ${coef.compte_dans_moyenne === false ? "bg-slate-50 border-dashed border-slate-300 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"}`} title={coef.compte_dans_moyenne === false ? "Ne compte pas dans la moyenne générale" : undefined}>
      {cible} : <strong className="text-slate-800">{Number(coef.coefficient)}</strong>
      {peutGerer && (
        <>
          <button onClick={() => setEdition({ coefficient: String(Number(coef.coefficient)), compte: coef.compte_dans_moyenne !== false })} className="text-slate-400 hover:text-[#0C447C] cursor-pointer" title="Modifier"><Pencil className="w-3 h-3" /></button>
          <button onClick={supprimer} disabled={enCours} className="text-slate-400 hover:text-rose-600 cursor-pointer" title="Supprimer"><X className="w-3 h-3" /></button>
        </>
      )}
    </span>
  );
}

// Matieres, coefficients et filieres : creation, modification sur place et suppression (refusee
// par le serveur pour une matiere enseignee ou notee, ou une filiere utilisee).
export default function Matieres({ permissions = [] }) {
  const peutGerer = permissions.includes("matieres.gerer");
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
  const [succes, setSucces] = useState("");
  const [edition, setEdition] = useState(null); // { type: "matiere" | "filiere", id, nom }
  const [enCours, setEnCours] = useState(null);

  const charger = async () => {
    try {
      const response = await api.get("/matieres");
      setMatieres(response.data.matieres);
      setFilieres(response.data.filieres);
    } catch {
      setErreur("Impossible de charger les données.");
    }
  };

  useEffect(() => {
    charger();
  }, []);

  const informer = (type, texte) => {
    setErreur(type === "erreur" ? texte : "");
    setSucces(type === "succes" ? texte : "");
  };

  const changerNomMatiere = (val) => {
    setNomMatiere(val);
    setCompteDansMoyenne(!MATIERES_NON_COEFFICIENTEES.includes(val));
  };

  const ajouterMatiere = async (e) => {
    e.preventDefault();
    informer();
    try {
      await api.post("/matieres", {
        nom: nomMatiere,
        coefficient: coefficient || null,
        filiere_id: filiereId || null,
        niveau: niveau || null,
        compte_dans_moyenne: compteDansMoyenne,
      });
      setNomMatiere("");
      setCoefficient("");
      setFiliereId("");
      setNiveau("");
      setCompteDansMoyenne(true);
      informer("succes", "Matière ajoutée.");
      charger();
    } catch (err) {
      informer("erreur", messageErreurApi(err, "Erreur lors de l'ajout."));
    }
  };

  const ajouterFiliere = async (e) => {
    e.preventDefault();
    informer();
    try {
      await api.post("/filieres", { nom: nomFiliere, niveau_a_partir_de: "11ème Année" });
      setNomFiliere("");
      informer("succes", "Filière ajoutée.");
      charger();
    } catch (err) {
      informer("erreur", messageErreurApi(err, "Erreur lors de l'ajout de la filière."));
    }
  };

  const chemin = (type) => (type === "matiere" ? "/matieres" : "/filieres");

  const enregistrer = async () => {
    setEnCours(`${edition.type}-${edition.id}`);
    try {
      await api.put(`${chemin(edition.type)}/${edition.id}`, { nom: edition.nom });
      setEdition(null);
      informer("succes", edition.type === "matiere" ? "Matière renommée." : "Filière renommée.");
      await charger();
    } catch (err) {
      informer("erreur", messageErreurApi(err, "Erreur lors de la modification."));
    } finally {
      setEnCours(null);
    }
  };

  const supprimer = async (type, element) => {
    if (!window.confirm(`Supprimer ${type === "matiere" ? "la matière" : "la filière"} ${element.nom} ?`)) return;
    setEnCours(`${type}-${element.id}`);
    try {
      const res = await api.delete(`${chemin(type)}/${element.id}`);
      informer("succes", res.data.message);
      await charger();
    } catch (err) {
      informer("erreur", messageErreurApi(err, "Suppression impossible."));
    } finally {
      setEnCours(null);
    }
  };

  const ligneNom = (type, element) =>
    edition?.type === type && edition.id === element.id ? (
      <input value={edition.nom} onChange={(e) => setEdition({ ...edition, nom: e.target.value })} className={CHAMP_LIGNE} />
    ) : (
      element.nom
    );

  const actions = (type, element) => (
    <ActionsLigne
      libelle={element.nom}
      enEdition={edition?.type === type && edition.id === element.id}
      enCours={enCours === `${type}-${element.id}`}
      onModifier={() => setEdition({ type, id: element.id, nom: element.nom })}
      onSupprimer={() => supprimer(type, element)}
      onEnregistrer={enregistrer}
      onAnnuler={() => setEdition(null)}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des Matières & Coefficients"
        description="Créez, modifiez et supprimez les matières, leurs coefficients et les filières de l'établissement."
        actions={
          <Button variant="secondary" icon={School} onClick={() => navigate("/classes")}>
            Gérer les classes
          </Button>
        }
      />

      {erreur && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5">{erreur}</p>}
      {succes && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">{succes}</p>}

      {peutGerer && (
        <>
          <Card className="space-y-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ajouter une matière</p>
            <form onSubmit={ajouterMatiere} className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Matière</label>
                <ChampMatiere value={nomMatiere} onChange={changerNomMatiere} niveau={niveau} style={champMatiereStyle} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Coefficient</label>
                <Input type="number" value={coefficient} onChange={(e) => setCoefficient(e.target.value)} className="w-20" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Niveau</label>
                <Select value={niveau} onChange={(e) => setNiveau(e.target.value)}>
                  <option value="">Tous niveaux</option>
                  {TOUS_NIVEAUX.map((n) => <option key={n} value={n}>{n}</option>)}
                </Select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Filière (si Lycée)</label>
                <Select value={filiereId} onChange={(e) => setFiliereId(e.target.value)}>
                  <option value="">Aucune</option>
                  {filieres.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
                </Select>
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 pb-2.5">
                <input type="checkbox" checked={compteDansMoyenne} onChange={(e) => setCompteDansMoyenne(e.target.checked)} />
                Cette matière est coefficientée (compte dans la moyenne générale)
              </label>
              <Button type="submit" variant="primary">Ajouter</Button>
            </form>
          </Card>

          <Card className="space-y-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ajouter une filière (Lycée)</p>
            <form onSubmit={ajouterFiliere} className="flex gap-3">
              <Input type="text" placeholder="ex: Scientifique, Littéraire..." value={nomFiliere} onChange={(e) => setNomFiliere(e.target.value)} className="flex-1" required />
              <Button type="submit" variant="secondary">Ajouter la filière</Button>
            </form>
          </Card>
        </>
      )}

      <Card className="p-0 overflow-hidden">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider p-5 pb-0">Matières existantes</p>
        <div className="overflow-x-auto p-5 pt-3">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-2 px-2">Matière</th>
                <th className="py-2 px-2">Coefficients définis</th>
                {peutGerer && <th className="py-2 px-2 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matieres.map((m) => (
                <tr key={m.id}>
                  <td className="py-2.5 px-2 text-sm font-semibold text-slate-900">{ligneNom("matiere", m)}</td>
                  <td className="py-2.5 px-2 text-xs text-slate-500">
                    {m.coefficients?.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {m.coefficients.map((c) => (
                          <PastilleCoefficient key={c.id} coef={c} peutGerer={peutGerer} onModifie={async (t) => { informer("succes", t); await charger(); }} onErreur={(t) => informer("erreur", t)} />
                        ))}
                      </div>
                    ) : (
                      "Non défini"
                    )}
                  </td>
                  {peutGerer && <td className="py-2.5 px-2">{actions("matiere", m)}</td>}
                </tr>
              ))}
              {matieres.length === 0 && (
                <tr><td colSpan="3" className="py-8 text-center text-sm text-slate-400">Aucune matière ajoutée.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider p-5 pb-0">Filières existantes</p>
        <div className="overflow-x-auto p-5 pt-3">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-2 px-2">Filière</th>
                <th className="py-2 px-2">À partir de</th>
                {peutGerer && <th className="py-2 px-2 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filieres.map((f) => (
                <tr key={f.id}>
                  <td className="py-2.5 px-2 text-sm font-semibold text-slate-900">{ligneNom("filiere", f)}</td>
                  <td className="py-2.5 px-2 text-xs text-slate-500">{f.niveau_a_partir_de}</td>
                  {peutGerer && <td className="py-2.5 px-2">{actions("filiere", f)}</td>}
                </tr>
              ))}
              {filieres.length === 0 && (
                <tr><td colSpan="3" className="py-8 text-center text-sm text-slate-400">Aucune filière ajoutée.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
