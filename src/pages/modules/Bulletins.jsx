import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { TrendingUp, Trophy, AlertTriangle, CheckCircle2, RefreshCw, FileText } from "lucide-react";
import { PageHeader, Card, StatCard, Button, Select, Input, Badge } from "../../components/ui/LakoliDesignSystem";

function mention(moyenne) {
  if (moyenne >= 16) return { texte: "Très Bien", variant: "blue" };
  if (moyenne >= 14) return { texte: "Bien", variant: "blue" };
  if (moyenne >= 12) return { texte: "Assez Bien", variant: "outline" };
  if (moyenne >= 10) return { texte: "Passage", variant: "outline" };
  return { texte: "Échec", variant: "neutral" };
}

export default function Bulletins({ role }) {
  const [classes, setClasses] = useState([]);
  const [periodes, setPeriodes] = useState([]);
  const [classeId, setClasseId] = useState("");
  const [periodeId, setPeriodeId] = useState("");
  const [recherche, setRecherche] = useState("");
  const [bulletins, setBulletins] = useState([]);
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  const [generation, setGeneration] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/classes").then((res) => setClasses(res.data));
    api.get("/periodes").then((res) => setPeriodes(res.data));
  }, []);

  const charger = async () => {
    if (!classeId || !periodeId) return;
    setErreur("");
    try {
      const res = await api.get("/bulletins/par-classe", { params: { classe_id: classeId, periode_id: periodeId } });
      setBulletins(res.data);
    } catch (err) {
      setErreur("Impossible de charger les bulletins.");
    }
  };

  useEffect(() => { charger(); }, [classeId, periodeId]);

  const genererBulletins = async () => {
    setGeneration(true);
    setErreur(""); setSucces("");
    try {
      const res = await api.post("/bulletins/generer", { classe_id: classeId, periode_id: periodeId });
      setSucces(res.data.message);
      setTimeout(() => charger(), 500);
    } catch (err) {
      const manquantes = err.response?.data?.matieres_manquantes;
      if (manquantes?.length > 0) {
        setErreur(`Génération impossible. Matières sans note publiée : ${manquantes.join(", ")}.`);
      } else {
        setErreur(err.response?.data?.message || "Erreur lors de la génération.");
      }
    } finally {
      setGeneration(false);
    }
  };

  const bulletinsFiltres = bulletins.filter((b) => {
    if (!recherche) return true;
    const r = recherche.toLowerCase();
    return (b.eleve?.nom + " " + b.eleve?.prenom).toLowerCase().includes(r);
  });

  const moyenneClasse = bulletins.length > 0 ? (bulletins.reduce((s, b) => s + parseFloat(b.moyenne), 0) / bulletins.length).toFixed(2) : null;
  const meilleureNote = bulletins.length > 0 ? Math.max(...bulletins.map((b) => parseFloat(b.moyenne))).toFixed(2) : null;
  const plusFaible = bulletins.length > 0 ? Math.min(...bulletins.map((b) => parseFloat(b.moyenne))).toFixed(2) : null;
  const admis = bulletins.filter((b) => parseFloat(b.moyenne) >= 10).length;
  const tauxAdmissibilite = bulletins.length > 0 ? Math.round((admis / bulletins.length) * 100) : null;
  const periodeNom = periodes.find((p) => p.id === parseInt(periodeId))?.libelle || "";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Production des Bulletins de Notes"
        description="Calcul des moyennes trimestrielles, classements et génération des relevés de notes officiels."
        badge={`Espace de Travail ${role || ""}`}
      />

      <Card className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Sélectionner la classe</label>
          <Select value={classeId} onChange={(e) => setClasseId(e.target.value)} className="w-full">
            <option value="">Choisir une classe...</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </Select>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Période scolaire</label>
          <Select value={periodeId} onChange={(e) => setPeriodeId(e.target.value)} className="w-full">
            <option value="">Choisir une période...</option>
            {periodes.map((p) => <option key={p.id} value={p.id}>{p.libelle}</option>)}
          </Select>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Rechercher un élève</label>
          <Input type="text" placeholder="Nom, matricule..." value={recherche} onChange={(e) => setRecherche(e.target.value)} />
        </div>
        {classeId && periodeId && (
          <Button variant="primary" icon={RefreshCw} disabled={generation} onClick={genererBulletins}>
            {generation ? "Génération..." : "Régénérer la classe"}
          </Button>
        )}
      </Card>

      {erreur && <p className="text-sm text-rose-600">{erreur}</p>}
      {succes && <p className="text-sm text-emerald-600">{succes}</p>}

      {bulletins.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Moyenne de classe" value={`${moyenneClasse} / 20`} icon={TrendingUp} />
          <StatCard title="Meilleure moyenne" value={`${meilleureNote} / 20`} icon={Trophy} />
          <StatCard title="Plus faible moyenne" value={`${plusFaible} / 20`} icon={AlertTriangle} />
          <StatCard title="Taux d'admissibilité" value={`${tauxAdmissibilite}%`} subtitle={`${admis} / ${bulletins.length} admis`} icon={CheckCircle2} />
        </div>
      )}

      {classeId && periodeId && (
        <Card className="p-0 overflow-hidden">
          {bulletinsFiltres.length > 0 && (
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs text-slate-500">Période : {periodeNom} • {bulletins.length} bulletin(s) généré(s)</span>
              <Badge variant="blue">v{bulletinsFiltres[0]?.version || 1}</Badge>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-semibold uppercase tracking-wider bg-slate-50/20">
                  <th className="py-3 px-5">Rang</th>
                  <th className="py-3 px-5">Nom de l'élève</th>
                  <th className="py-3 px-5">Matricule</th>
                  <th className="py-3 px-5">Moyenne générale</th>
                  <th className="py-3 px-5">Mention / Décision</th>
                  <th className="py-3 px-5">Bulletin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {bulletinsFiltres.map((b) => {
                  const m = mention(parseFloat(b.moyenne));
                  const admis = parseFloat(b.moyenne) >= 10;
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-900">{b.rang}{b.rang === 1 ? "er" : "e"}</td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-[#2563EB] text-white text-xs font-extrabold flex items-center justify-center shrink-0">
                            {b.eleve?.nom?.[0]}{b.eleve?.prenom?.[0]}
                          </div>
                          <span className="font-bold text-slate-900">{b.eleve?.nom} {b.eleve?.prenom}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-xs text-slate-400">{b.eleve?.matricule || "—"}</td>
                      <td className="py-3.5 px-5">
                        <span className={`px-3 py-1 rounded-lg text-sm font-bold ${admis ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                          {b.moyenne} / 20
                        </span>
                      </td>
                      <td className="py-3.5 px-5"><Badge variant={m.variant}>{m.texte}</Badge></td>
                      <td className="py-3.5 px-5">
                        <Button variant="ghost" size="sm" icon={FileText} onClick={() => navigate(`/bulletins/${b.id}`)}>
                          Consulter
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {bulletinsFiltres.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-sm text-slate-400">
                      {classeId && periodeId ? "Aucun bulletin généré. Cliquez sur \"Régénérer la classe\"." : "Sélectionnez une classe et une période."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {bulletinsFiltres.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-400 italic">
                Impression sécurisée LAKOLI • Certifié conforme aux normes scolaires de la République de Guinée.
              </p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
