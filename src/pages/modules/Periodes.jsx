import { useState, useEffect } from "react";
import api from "../../services/api";
import { PageHeader, Card, Button, Input, Badge } from "../../components/ui/LakoliDesignSystem";

function badgeStatut(statut) {
  if (statut === "cloturee") return <Badge variant="neutral">Clôturée</Badge>;
  return <Badge variant="blue">Ouverte</Badge>;
}

export default function Periodes() {
  const [periodes, setPeriodes] = useState([]);
  const [libelle, setLibelle] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [erreur, setErreur] = useState("");

  const charger = async () => {
    try {
      const res = await api.get("/periodes");
      setPeriodes(res.data);
    } catch (err) {
      setErreur("Impossible de charger les périodes.");
    }
  };

  useEffect(() => { charger(); }, []);

  const ajouterPeriode = async (e) => {
    e.preventDefault();
    setErreur("");
    try {
      await api.post("/periodes", { libelle, date_debut: dateDebut, date_fin: dateFin });
      setLibelle(""); setDateDebut(""); setDateFin("");
      charger();
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur lors de la création de la période.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Périodes Scolaires"
        description="Gérez les trimestres ou semestres utilisés pour les évaluations et les bulletins."
      />

      {erreur && <p className="text-sm text-rose-600">{erreur}</p>}

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

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-semibold uppercase tracking-wider bg-slate-50/20">
                <th className="py-3 px-5">Libellé</th>
                <th className="py-3 px-5">Début</th>
                <th className="py-3 px-5">Fin</th>
                <th className="py-3 px-5">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {periodes.map((p) => (
                <tr key={p.id}>
                  <td className="py-3 px-5 font-semibold text-slate-900">{p.libelle}</td>
                  <td className="py-3 px-5 text-slate-600">{p.date_debut}</td>
                  <td className="py-3 px-5 text-slate-600">{p.date_fin}</td>
                  <td className="py-3 px-5">{badgeStatut(p.statut)}</td>
                </tr>
              ))}
              {periodes.length === 0 && (
                <tr><td colSpan="4" className="py-8 text-center text-sm text-slate-400">Aucune période créée.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
