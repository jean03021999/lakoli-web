import { useState, useEffect } from "react";
import api from "../../services/api";
import { Wallet, Search } from "lucide-react";
import { PageHeader, Card, StatCard, Input } from "../../components/ui/LakoliDesignSystem";
import { regrouperVersements } from "../../utils/versements";

const LIBELLES_MOYEN = {
  especes: "Espèces",
  mobile_money: "Mobile Money",
  virement: "Virement",
  cheque: "Chèque",
};

export default function PaiementsCaisse() {
  const [versements, setVersements] = useState([]);
  const [recherche, setRecherche] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    api.get("/frais/paiements")
      // Un versement = un passage en caisse (ex. inscription + scolarité payées ensemble).
      .then((res) => setVersements(regrouperVersements(res.data)))
      .catch(() => setErreur("Impossible de charger le journal de caisse."))
      .finally(() => setChargement(false));
  }, []);

  const versementsFiltres = versements.filter((v) => {
    if (!recherche) return true;
    const r = recherche.toLowerCase();
    return (v.eleve?.nom_complet || "").toLowerCase().includes(r) || (v.eleve?.matricule || "").toLowerCase().includes(r);
  });

  const total = versementsFiltres.reduce((s, v) => s + v.montant, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journal de Caisse"
        description="Historique de tous les versements encaissés pour l'établissement."
      />

      {erreur && <p className="text-sm text-rose-600">{erreur}</p>}

      {!erreur && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard title="Versements enregistrés" value={versementsFiltres.length} icon={Wallet} />
          <StatCard title="Total encaissé" value={`${total.toLocaleString()} GNF`} icon={Wallet} />
        </div>
      )}

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Rechercher un élève..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {chargement && <p className="px-5 py-3 text-sm text-slate-500">Chargement...</p>}

        {!chargement && !erreur && (
          <div className="overflow-x-auto">
            {versementsFiltres.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-semibold uppercase tracking-wider bg-slate-50/20">
                    <th className="py-3 px-5">Élève</th>
                    <th className="py-3 px-5">Libellé</th>
                    <th className="py-3 px-5">Moyen</th>
                    <th className="py-3 px-5">Date</th>
                    <th className="py-3 px-5 text-right">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {versementsFiltres.map((v) => (
                    <tr key={v.id} className="align-top">
                      <td className="py-3 px-5">
                        <p className="font-semibold text-slate-900">{v.eleve?.nom_complet || "—"}</p>
                        <p className="text-xs text-slate-400 font-mono">{v.eleve?.matricule}</p>
                      </td>
                      <td className="py-3 px-5 text-slate-600">
                        {v.details.length > 1 ? (
                          <div className="space-y-1">
                            <p className="font-semibold text-slate-700">{v.type_frais}</p>
                            <div className="flex flex-wrap gap-1">
                              {v.details.map((d) => (
                                <span
                                  key={d.id}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-semibold whitespace-nowrap"
                                >
                                  {d.libelle || d.type_frais}
                                  <span className="text-blue-500 font-bold">{d.montant.toLocaleString()}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          v.details[0].libelle
                        )}
                      </td>
                      <td className="py-3 px-5 text-slate-600">{LIBELLES_MOYEN[v.moyen_paiement] || v.moyen_paiement}</td>
                      <td className="py-3 px-5 text-slate-600">
                        {v.date_paiement}
                        {v.heure && <span className="block text-xs text-slate-400">{v.heure}</span>}
                      </td>
                      <td className="py-3 px-5 text-right font-bold text-emerald-600 font-mono">+{v.montant.toLocaleString()} GNF</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 px-4">
                <Wallet className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium text-sm">Aucun paiement enregistré.</p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
