import { useState, useEffect } from "react";
import api from "../../services/api";
import { Sparkles, ShieldCheck, Calendar } from "lucide-react";
import { PageHeader, Card, Badge } from "../../components/ui/LakoliDesignSystem";

function badgeStatut(statut) {
  if (statut === "essai") return <Badge variant="outline">Essai</Badge>;
  if (statut === "suspendu") return <Badge variant="neutral">Suspendu</Badge>;
  return <Badge variant="blue">Actif</Badge>;
}

export default function Abonnement() {
  const [etablissement, setEtablissement] = useState(null);
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    api.get("/abonnement")
      .then((res) => setEtablissement(res.data))
      .catch(() => setErreur("Impossible de charger les informations d'abonnement."))
      .finally(() => setChargement(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Abonnement LAKOLI"
        description="Statut de la licence de votre établissement sur la plateforme."
      />

      {erreur && <p className="text-sm text-rose-600">{erreur}</p>}
      {chargement && <p className="text-sm text-slate-500">Chargement...</p>}

      {!chargement && !erreur && etablissement && (
        <Card className="space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="h-11 w-11 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">{etablissement.nom}</p>
              <p className="text-xs text-slate-400 font-mono">{etablissement.code}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" /> Statut de la licence
              </p>
              {badgeStatut(etablissement.statut)}
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Fin de la période d'essai
              </p>
              <p className="text-sm font-semibold text-slate-800">{etablissement.date_fin_essai || "Non applicable"}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
