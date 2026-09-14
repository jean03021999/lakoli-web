import { useState, useEffect } from "react";
import api from "../../services/api";
import { Users, Mail, Phone } from "lucide-react";
import { PageHeader, Card, Badge } from "../../components/ui/LakoliDesignSystem";

function badgeStatut(statut) {
  if (statut === "inactif" || statut === "suspendu") {
    return <Badge variant="neutral">{statut}</Badge>;
  }
  return <Badge variant="blue">Actif</Badge>;
}

export default function Utilisateurs() {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    api.get("/utilisateurs")
      .then((res) => setUtilisateurs(res.data))
      .catch(() => setErreur("Impossible de charger les utilisateurs."))
      .finally(() => setChargement(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utilisateurs de l'établissement"
        description="Liste des comptes ayant accès à la plateforme LAKOLI et leurs rôles."
      />

      {erreur && <p className="text-sm text-rose-600">{erreur}</p>}
      {chargement && <p className="text-sm text-slate-500">Chargement...</p>}

      {!chargement && !erreur && (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            {utilisateurs.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-semibold uppercase tracking-wider bg-slate-50/20">
                    <th className="py-3 px-5">Utilisateur</th>
                    <th className="py-3 px-5">Contact</th>
                    <th className="py-3 px-5">Rôle(s)</th>
                    <th className="py-3 px-5">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {utilisateurs.map((u) => (
                    <tr key={u.id}>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-[#2563EB] text-white text-xs font-extrabold flex items-center justify-center shrink-0">
                            {u.name?.[0]?.toUpperCase() || "?"}
                          </div>
                          <span className="font-bold text-slate-900">{u.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-slate-600 text-xs space-y-0.5">
                        <div className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-slate-400" /> {u.email}</div>
                        {u.telephone && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-slate-400" /> {u.telephone}</div>}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex flex-wrap gap-1.5">
                          {u.roles.length > 0
                            ? u.roles.map((r) => <Badge key={r} variant="outline">{r}</Badge>)
                            : <span className="text-xs text-slate-400 italic">Aucun rôle</span>}
                        </div>
                      </td>
                      <td className="py-3.5 px-5">{badgeStatut(u.statut)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 px-4">
                <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium text-sm">Aucun utilisateur trouvé.</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
