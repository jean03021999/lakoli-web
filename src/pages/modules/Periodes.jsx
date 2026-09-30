import { useState, useEffect } from "react";
import api from "../../services/api";
import { PageHeader, Card, Button, Input, Badge } from "../../components/ui/LakoliDesignSystem";
import ActionsLigne from "../../components/ActionsLigne";
import { messageErreurApi } from "../../utils/erreurs";

const CHAMP_LIGNE = "w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#0C447C]";

function badgeStatut(statut) {
  if (statut === "cloturee") return <Badge variant="neutral">Clôturée</Badge>;
  return <Badge variant="blue">Ouverte</Badge>;
}

// Periodes scolaires : creation, modification sur place (libelle, dates, ouverte / cloturee) et
// suppression (refusee par le serveur si la periode a des evaluations ou des bulletins).
export default function Periodes({ permissions = [] }) {
  const peutGerer = permissions.includes("periodes.gerer");
  const [periodes, setPeriodes] = useState([]);
  const [libelle, setLibelle] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  const [edition, setEdition] = useState(null);
  const [enCours, setEnCours] = useState(null);

  const charger = async () => {
    try {
      const res = await api.get("/periodes");
      setPeriodes(res.data);
    } catch {
      setErreur("Impossible de charger les périodes.");
    }
  };

  useEffect(() => {
    charger();
  }, []);

  const informer = (type, texte) => {
    setErreur(type === "erreur" ? texte : "");
    setSucces(type === "succes" ? texte : "");
  };

  const ajouterPeriode = async (e) => {
    e.preventDefault();
    informer();
    try {
      await api.post("/periodes", { libelle, date_debut: dateDebut, date_fin: dateFin });
      setLibelle("");
      setDateDebut("");
      setDateFin("");
      informer("succes", "Période créée.");
      charger();
    } catch (err) {
      informer("erreur", messageErreurApi(err, "Erreur lors de la création de la période."));
    }
  };

  const enregistrer = async () => {
    setEnCours(edition.id);
    try {
      await api.put(`/periodes/${edition.id}`, edition);
      setEdition(null);
      informer("succes", "Période modifiée.");
      await charger();
    } catch (err) {
      informer("erreur", messageErreurApi(err, "Erreur lors de la modification."));
    } finally {
      setEnCours(null);
    }
  };

  const supprimer = async (p) => {
    if (!window.confirm(`Supprimer la période ${p.libelle} ?`)) return;
    setEnCours(p.id);
    try {
      const res = await api.delete(`/periodes/${p.id}`);
      informer("succes", res.data.message);
      await charger();
    } catch (err) {
      informer("erreur", messageErreurApi(err, "Suppression impossible."));
    } finally {
      setEnCours(null);
    }
  };

  const jour = (v) => String(v || "").slice(0, 10);

  return (
    <div className="space-y-6">
      <PageHeader title="Périodes Scolaires" description="Gérez les trimestres ou semestres utilisés pour les évaluations et les bulletins." />

      {erreur && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5">{erreur}</p>}
      {succes && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">{succes}</p>}

      {peutGerer && (
        <Card className="space-y-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nouvelle période</p>
          <form onSubmit={ajouterPeriode} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Libellé</label>
              <Input type="text" placeholder="ex: 1er Trimestre" value={libelle} onChange={(e) => setLibelle(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Date de début</label>
              <Input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Date de fin</label>
              <Input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} required />
            </div>
            <Button type="submit" variant="primary">Créer la période</Button>
          </form>
        </Card>
      )}

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-semibold uppercase tracking-wider bg-slate-50/20">
                <th className="py-3 px-5">Libellé</th>
                <th className="py-3 px-5">Début</th>
                <th className="py-3 px-5">Fin</th>
                <th className="py-3 px-5">Statut</th>
                {peutGerer && <th className="py-3 px-5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {periodes.map((p) => {
                const ed = edition?.id === p.id;
                return (
                  <tr key={p.id} className={ed ? "bg-blue-50/40" : ""}>
                    <td className="py-3 px-5 font-semibold text-slate-900">
                      {ed ? <input value={edition.libelle} onChange={(e) => setEdition({ ...edition, libelle: e.target.value })} className={CHAMP_LIGNE} /> : p.libelle}
                    </td>
                    <td className="py-3 px-5 text-slate-600">
                      {ed ? <input type="date" value={edition.date_debut} onChange={(e) => setEdition({ ...edition, date_debut: e.target.value })} className={CHAMP_LIGNE} /> : jour(p.date_debut)}
                    </td>
                    <td className="py-3 px-5 text-slate-600">
                      {ed ? <input type="date" value={edition.date_fin} onChange={(e) => setEdition({ ...edition, date_fin: e.target.value })} className={CHAMP_LIGNE} /> : jour(p.date_fin)}
                    </td>
                    <td className="py-3 px-5">
                      {ed ? (
                        <select value={edition.statut} onChange={(e) => setEdition({ ...edition, statut: e.target.value })} className={CHAMP_LIGNE}>
                          <option value="ouverte">Ouverte</option>
                          <option value="cloturee">Clôturée</option>
                        </select>
                      ) : (
                        badgeStatut(p.statut)
                      )}
                    </td>
                    {peutGerer && (
                      <td className="py-3 px-5">
                        <ActionsLigne
                          libelle={p.libelle}
                          enEdition={ed}
                          enCours={enCours === p.id}
                          onModifier={() => setEdition({ id: p.id, libelle: p.libelle, date_debut: jour(p.date_debut), date_fin: jour(p.date_fin), statut: p.statut })}
                          onSupprimer={() => supprimer(p)}
                          onEnregistrer={enregistrer}
                          onAnnuler={() => setEdition(null)}
                        />
                      </td>
                    )}
                  </tr>
                );
              })}
              {periodes.length === 0 && (
                <tr><td colSpan="5" className="py-8 text-center text-sm text-slate-400">Aucune période créée.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
