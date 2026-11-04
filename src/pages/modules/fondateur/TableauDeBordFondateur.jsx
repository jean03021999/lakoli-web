import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, PiggyBank, TrendingUp, Users, UserCheck, UserX, ArrowRight, ShieldAlert, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import api from "../../../services/api";
import useActualisation from "../../../hooks/useActualisation";
import { regrouperVersements } from "../../../utils/versements";
import StatCard from "../../../components/fondateur/StatCard";
import FiltrePeriode from "../../../components/fondateur/FiltrePeriode";
import {
  dansPeriode, dateLocale, debutAnnee, debutMois, formatGNF, formatMillions, formatNombre, jourDe,
  lignesAnnulations, lignesImpayes, lignesRecouvrement, totauxRecouvrement,
} from "../../../components/fondateur/outilsFondateur";

// Tableau de bord du Fondateur (design AI Studio), calcule sur les vraies donnees de l'etablissement.

const LIBELLES_PERIODE = {
  aujourdhui: "Aujourd'hui",
  cette_semaine: "Cette semaine",
  ce_mois: "Ce mois-ci",
  toute_annee: "Sur l'année scolaire",
};

function InfobulleGraphique({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
      <p className="font-bold text-blue-300 text-sm">{label}</p>
      <p className="flex justify-between gap-4 text-slate-300"><span>Attendu :</span><span className="font-semibold text-white tabular-nums">{formatGNF(d.attendu)}</span></p>
      <p className="flex justify-between gap-4 text-emerald-400"><span>Encaissé :</span><span className="font-semibold text-emerald-300 tabular-nums">{formatGNF(d.encaisse)}</span></p>
    </div>
  );
}

export default function TableauDeBordFondateur({ utilisateur, session, etablissement }) {
  const navigate = useNavigate();
  const actualisation = useActualisation();
  const [periode, setPeriode] = useState("toute_annee");
  const [donnees, setDonnees] = useState(null);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    let actif = true;
    Promise.all([
      api.get("/frais/paiements"),
      api.get("/frais/stats-par-classe"),
      api.get("/frais/relances"),
      api.get("/caisse/evolution"),
    ])
      .then(([paiements, classes, relances, evolution]) => {
        if (!actif) return;
        setDonnees({
          paiements: paiements.data,
          classes: classes.data,
          relances: relances.data.lignes || relances.data,
          evolution: evolution.data,
        });
        setErreur("");
      })
      .catch(() => actif && setErreur("Impossible de charger le tableau de bord."));
    return () => {
      actif = false;
    };
  }, [actualisation]);

  const calcul = useMemo(() => {
    if (!donnees) return null;
    const debut = debutAnnee(donnees.evolution);
    const valides = donnees.paiements.filter((p) => !p.annule);
    const totalPeriode = valides
      .filter((p) => dansPeriode(jourDe(p.date_paiement), periode, debut))
      .reduce((s, p) => s + (parseFloat(p.montant) || 0), 0);

    // Encaissements du mois en cours et du mois precedent (montants : un pourcentage sur un mois a
    // peine commence serait trompeur).
    const maintenant = new Date();
    const moisPrecedent = dateLocale(new Date(maintenant.getFullYear(), maintenant.getMonth() - 1, 1));
    const ceMois = debutMois();
    let totalMois = 0;
    let totalPrecedent = 0;
    for (const p of valides) {
      const jour = jourDe(p.date_paiement);
      const montant = parseFloat(p.montant) || 0;
      if (jour >= ceMois) totalMois += montant;
      else if (jour >= moisPrecedent) totalPrecedent += montant;
    }

    const classes = lignesRecouvrement(donnees.classes, donnees.paiements, debut);
    const totaux = totauxRecouvrement(classes);
    const impayes = lignesImpayes(donnees.relances, donnees.paiements);
    const annulations = lignesAnnulations(regrouperVersements(donnees.paiements), etablissement);
    return {
      totalPeriode,
      totalMois,
      totalPrecedent,
      classes,
      totaux,
      nonAJour: impayes.length,
      critiques: impayes.filter((e) => e.retard >= 3).length,
      aJour: Math.max(0, totaux.effectif - totaux.sansFrais - impayes.length),
      annulationsJour: annulations.filter((a) => jourDe(a.dateAnnulation) === dateLocale()),
      aVerifier: annulations.filter((a) => a.statutAudit === "À vérifier"),
      graphique: donnees.evolution.mois
        .filter((m) => m.attendu > 0 || m.recouvre > 0)
        .map((m) => ({
          nom: m.libelle.split(" ")[0].slice(0, 4),
          moisComplet: m.libelle,
          Attendu: Math.round(m.attendu / 100000) / 10,
          Encaissé: Math.round(m.recouvre / 100000) / 10,
          attendu: m.attendu,
          encaisse: m.recouvre,
        })),
      attenduTotal: donnees.evolution.totaux.attendu,
    };
  }, [donnees, periode, etablissement]);

  if (erreur) return <p className="p-6 text-sm font-semibold text-rose-700">{erreur}</p>;
  if (!calcul) {
    return (
      <div className="flex items-center justify-center gap-2 p-16 text-sm text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin" /> Chargement du tableau de bord...
      </div>
    );
  }

  const dateAujourdhui = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const { totaux } = calcul;
  const critiquesAVerifier = calcul.aVerifier.filter((a) => a.estCritique);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <div className="flex justify-end">
        <div className="overflow-x-auto max-w-full"><FiltrePeriode valeur={periode} onChange={setPeriode} /></div>
      </div>

      {/* Banniere de bienvenue */}
      <div className="bg-gradient-to-r from-[#0C447C] via-[#0E5296] to-[#0a2d5a] rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <p className="text-xs uppercase font-bold tracking-wider text-blue-200">Espace Fondateur · {dateAujourdhui}</p>
            <h2 className="text-2xl font-bold tracking-tight mt-0.5">Bonjour, {utilisateur?.name || "Fondateur"}</h2>
          </div>
          {session && (
            <div className="inline-flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/15 text-xs">
              <span className="text-blue-100 font-medium">Session scolaire :</span>
              <span className="font-bold text-white">{session}</span>
            </div>
          )}
        </div>
        <p className="mt-2.5 text-sm text-blue-100 font-medium max-w-3xl leading-relaxed">
          {LIBELLES_PERIODE[periode]} : {formatGNF(calcul.totalPeriode)} encaissés. Recouvrement de la scolarité à {String(totaux.taux).replace(".", ",")} %.{" "}
          {calcul.nonAJour} élève{calcul.nonAJour > 1 ? "s" : ""} à régulariser.
        </p>
      </div>

      {/* Point de vigilance : seulement s'il y a des annulations a examiner */}
      {calcul.aVerifier.length > 0 && (
        <div className="bg-rose-50/90 border border-rose-200/90 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-600 text-white shrink-0"><ShieldAlert className="w-5 h-5" /></div>
            <div>
              <h3 className="text-sm font-bold text-rose-950">
                Point de vigilance : {calcul.aVerifier.length} annulation{calcul.aVerifier.length > 1 ? "s" : ""} à vérifier
              </h3>
              <p className="text-xs text-rose-800 mt-0.5">
                {critiquesAVerifier.length} dépasse{critiquesAVerifier.length > 1 ? "nt" : ""} vos seuils d'alerte · {calcul.annulationsJour.length} enregistrée{calcul.annulationsJour.length > 1 ? "s" : ""} aujourd'hui.
              </p>
            </div>
          </div>
          <button type="button" onClick={() => navigate("/controle")} className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0">
            <span>Examiner les annulations</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Six cartes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard
          theme="emeraude"
          titre="Total encaissé"
          valeur={formatGNF(calcul.totalPeriode)}
          sousTitre={LIBELLES_PERIODE[periode]}
          icone={Wallet}
          evolution={`Ce mois : ${formatMillions(calcul.totalMois)} · mois dernier : ${formatMillions(calcul.totalPrecedent)}`}
          tendance="neutre"
          estCliquable
          onClick={() => navigate("/paiements")}
        />
        <StatCard
          theme="ambre"
          titre="Reste à recouvrer"
          valeur={formatGNF(totaux.reste)}
          sousTitre="Scolarité de l'année restant à percevoir"
          icone={PiggyBank}
          evolution={`${calcul.nonAJour} élève${calcul.nonAJour > 1 ? "s" : ""} en retard`}
          tendance="neutre"
          estCliquable
          onClick={() => navigate("/relances")}
        />
        <StatCard
          theme="bleu"
          titre="Taux de recouvrement"
          valeur={`${String(totaux.taux).replace(".", ",")} %`}
          sousTitre="Scolarité encaissée sur le net annuel à payer"
          icone={TrendingUp}
          progressionPourcentage={totaux.taux}
        />
        <StatCard theme="violet" titre="Effectif total" valeur={`${formatNombre(totaux.effectif)} élèves`} sousTitre={`Répartis sur ${calcul.classes.length} classe${calcul.classes.length > 1 ? "s" : ""}`} icone={Users} />
        <StatCard
          theme="turquoise"
          titre="Élèves à jour"
          valeur={`${formatNombre(calcul.aJour)} élèves`}
          sousTitre={totaux.sansFrais > 0 ? `Hors ${totaux.sansFrais} élève${totaux.sansFrais > 1 ? "s" : ""} sans frais de scolarité` : "Aucune échéance en retard"}
          icone={UserCheck}
        />
        <StatCard
          theme="rose"
          titre="Élèves non à jour"
          valeur={`${formatNombre(calcul.nonAJour)} élèves`}
          sousTitre="Au moins une échéance en retard"
          icone={UserX}
          evolution={`Dont ${calcul.critiques} cas critique${calcul.critiques > 1 ? "s" : ""} (3 échéances et plus)`}
          tendance="neutre"
        />
      </div>

      {/* Encaissements par mois */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Encaissements par mois</h3>
            <p className="text-xs text-slate-500">Montant attendu selon l'échéancier et part réellement encaissée (en millions de GNF)</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-xs bg-slate-300" /><span className="text-slate-600">Attendu ({formatMillions(calcul.attenduTotal)})</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-xs bg-[#0C447C]" /><span className="text-slate-800 font-semibold">Encaissé</span></div>
          </div>
        </div>
        {calcul.graphique.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-400">Aucune échéance enregistrée sur cette année scolaire.</p>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={calcul.graphique} margin={{ top: 10, right: 10, left: -15, bottom: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="moisComplet" tickFormatter={(v) => v.split(" ")[0].slice(0, 4)} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} unit=" M" />
                <Tooltip content={<InfobulleGraphique />} />
                <Bar dataKey="Attendu" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="Encaissé" fill="#0C447C" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recouvrement par classe */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Recouvrement par classe</h3>
            <p className="text-xs text-slate-500">Inscriptions encaissées, scolarité recouvrée et reste à percevoir, dans l'ordre pédagogique</p>
          </div>
          <button type="button" onClick={() => navigate("/relances")} className="text-xs font-bold text-[#0C447C] hover:text-[#0a2d5a] inline-flex items-center gap-1 cursor-pointer">
            <span>Voir les élèves en retard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="px-4 py-3">Classe</th>
                <th className="px-3 py-3 text-center">Effectif</th>
                <th className="px-4 py-3 text-right">Inscriptions</th>
                <th className="px-4 py-3 text-right">Scolarité recouvrée</th>
                <th className="px-4 py-3 text-right">Net à payer</th>
                <th className="px-4 py-3 text-right">Reste</th>
                <th className="px-4 py-3 text-right min-w-[140px]">Taux (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {calcul.classes.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900"><span className="inline-block w-1.5 h-1.5 rounded-full bg-[#0C447C] mr-2 align-middle" />{c.nom}</td>
                  <td className="px-3 py-3 text-center font-medium text-slate-700 tabular-nums">{c.effectif}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">{formatNombre(c.inscriptions)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-emerald-700">{formatNombre(c.scolarite)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">{formatNombre(c.netAPayer)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-rose-700">{formatNombre(c.reste)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${c.taux >= 75 ? "bg-emerald-600" : c.taux >= 50 ? "bg-blue-600" : "bg-amber-500"}`} style={{ width: `${Math.min(100, c.taux)}%` }} />
                      </div>
                      <span className="font-bold text-slate-800 tabular-nums">{c.taux.toFixed(1).replace(".", ",")} %</span>
                    </div>
                  </td>
                </tr>
              ))}
              {calcul.classes.length === 0 && (
                <tr><td colSpan={7} className="py-10 text-center text-slate-400">Aucune classe sur l'année active.</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-300 bg-slate-100 text-slate-900 font-extrabold text-xs">
                <td className="px-4 py-3.5 uppercase tracking-wider">Total général</td>
                <td className="px-3 py-3.5 text-center tabular-nums">{formatNombre(totaux.effectif)}</td>
                <td className="px-4 py-3.5 text-right tabular-nums">{formatGNF(totaux.inscriptions)}</td>
                <td className="px-4 py-3.5 text-right tabular-nums text-emerald-800">{formatGNF(totaux.scolarite)}</td>
                <td className="px-4 py-3.5 text-right tabular-nums">{formatGNF(totaux.netAPayer)}</td>
                <td className="px-4 py-3.5 text-right tabular-nums text-rose-800">{formatGNF(totaux.reste)}</td>
                <td className="px-4 py-3.5 text-right text-sm text-[#0C447C] font-black tabular-nums">{totaux.taux.toFixed(1).replace(".", ",")} %</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
