import { useState } from "react";
import { Calendar, PlusCircle, History, AlertTriangle, Play } from "lucide-react";
import api from "../../services/api";
import { Carte, Champ, Interrupteur, BandeauLectureSeule } from "./ui";
import { CHAMP, BLEU, dateLongue, messageErreur } from "./outils";

const STATUTS = {
  preparation: { libelle: "En préparation", classe: "bg-blue-50 text-blue-700 border-blue-200" },
  en_cours: { libelle: "En cours", classe: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cloturee: { libelle: "Clôturée", classe: "bg-slate-100 text-slate-600 border-slate-200" },
  archivee: { libelle: "Archivée", classe: "bg-slate-100 text-slate-500 border-slate-200" },
};

// Part de l'annee scolaire ecoulee, bornee a 0-100 %.
function progression(session) {
  const debut = new Date(`${session.date_debut}T00:00:00`).getTime();
  const fin = new Date(`${session.date_fin}T23:59:59`).getTime();
  if (!(fin > debut)) return 0;
  return Math.min(100, Math.max(0, Math.round(((Date.now() - debut) / (fin - debut)) * 100)));
}

export default function SectionSessions({ sessions, peutAdministrer, onMaj, onToast }) {
  const active = sessions.find((s) => s.est_active);
  const autres = sessions.filter((s) => !s.est_active);
  const derniere = sessions.reduce((max, s) => Math.max(max, Number(String(s.libelle).slice(0, 4)) || 0), 0);
  const anneeProposee = derniere ? derniere + 1 : new Date().getFullYear();

  const [anneeDebut, setAnneeDebut] = useState(anneeProposee);
  const [dateDebut, setDateDebut] = useState(`${anneeProposee}-10-01`);
  const [dateFin, setDateFin] = useState(`${anneeProposee + 1}-07-31`);
  const [activer, setActiver] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [aActiver, setAActiver] = useState(null);

  const changerAnnee = (valeur) => {
    const a = Number(valeur);
    setAnneeDebut(valeur);
    if (a > 1999) {
      setDateDebut(`${a}-10-01`);
      setDateFin(`${a + 1}-07-31`);
    }
  };

  const creer = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    try {
      const res = await api.post("/parametres/sessions", { annee_debut: Number(anneeDebut), date_debut: dateDebut, date_fin: dateFin, activer });
      onMaj(res.data, activer ? `${anneeDebut}-${Number(anneeDebut) + 1}` : null);
      onToast("Session créée", `L'année scolaire ${anneeDebut}-${Number(anneeDebut) + 1} est ${activer ? "désormais active" : "en préparation"}.`);
      setActiver(false);
    } catch (err) {
      onToast("Création impossible", messageErreur(err, "Erreur lors de la création."), "warning");
    } finally {
      setEnvoi(false);
    }
  };

  const confirmerActivation = async () => {
    const session = aActiver;
    setAActiver(null);
    try {
      const res = await api.post(`/parametres/sessions/${session.id}/activer`);
      onMaj(res.data, session.libelle);
      onToast("Session activée", `Toute l'application travaille désormais sur l'année ${session.libelle}.`);
    } catch (err) {
      onToast("Activation impossible", messageErreur(err, "Erreur lors de l'activation."), "warning");
    }
  };

  const pct = active ? progression(active) : 0;

  return (
    <div className="space-y-6">
      {!peutAdministrer && <BandeauLectureSeule>Consultation seule : seule la direction peut créer ou activer une session scolaire.</BandeauLectureSeule>}

      <Carte
        icone={Calendar}
        titre="Session scolaire active"
        description="Année de référence pour les inscriptions, les notes et la scolarité"
        action={
          active && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Active
            </span>
          )
        }
      >
        {!active ? (
          <p className="text-sm text-slate-500">Aucune session active. {peutAdministrer ? "Créez-en une ci-dessous et activez-la." : "Demandez à la direction d'en activer une."}</p>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Année scolaire en cours</p>
                <h3 className="text-4xl sm:text-5xl font-black tracking-tight mt-1 text-[#0C447C]">{active.libelle}</h3>
              </div>
              <div className="text-left md:text-right">
                <p className="text-xs text-slate-400 font-semibold uppercase">Période officielle</p>
                <p className="text-sm font-bold text-slate-800 mt-1">{dateLongue(active.date_debut)} — {dateLongue(active.date_fin)}</p>
                <p className="text-xs text-slate-500 mt-0.5">Élèves inscrits : <strong>{active.eleves.toLocaleString("fr-FR")}</strong></p>
              </div>
            </div>
            <div className="space-y-2 p-5 rounded-2xl bg-slate-50 border border-slate-200/70">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Progression de l'année scolaire</span>
                <span className="font-extrabold text-blue-800">{pct} % écoulé</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div style={{ width: `${pct}%`, backgroundColor: BLEU }} className="h-full rounded-full transition-all duration-500" />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Rentrée · {dateLongue(active.date_debut)}</span>
                <span>Fin d'année · {dateLongue(active.date_fin)}</span>
              </div>
            </div>
          </div>
        )}
      </Carte>

      {peutAdministrer && (
        <Carte icone={PlusCircle} titre="Créer une nouvelle session scolaire" description="Préparez à l'avance la prochaine rentrée ou basculez d'année">
          <form onSubmit={creer} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Champ libelle="Année de début" requis>
                <input type="number" min="2000" max="2100" value={anneeDebut} onChange={(e) => changerAnnee(e.target.value)} className={`${CHAMP} font-bold`} />
              </Champ>
              <Champ libelle="Année de fin">
                <input type="number" value={Number(anneeDebut) + 1 || ""} disabled className={`${CHAMP} font-bold`} />
              </Champ>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Champ libelle="Date de rentrée des classes" requis>
                <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className={CHAMP} />
              </Champ>
              <Champ libelle="Date de fin d'année" requis>
                <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className={CHAMP} />
              </Champ>
            </div>
            <div className="px-4 rounded-xl bg-slate-50 border border-slate-200">
              <Interrupteur
                actif={activer}
                onChange={setActiver}
                libelle="Activer immédiatement cette session"
                description={active ? `La session ${active.libelle} sera clôturée et toute l'application basculera sur la nouvelle année.` : "Elle deviendra l'année de référence de l'application."}
              />
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={envoi}
                style={{ backgroundColor: BLEU }}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-xs font-bold shadow-md hover:brightness-110 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                {envoi ? "Création..." : `Créer la session ${anneeDebut}-${Number(anneeDebut) + 1 || ""}`}
              </button>
            </div>
          </form>
        </Carte>
      )}

      <Carte icone={History} titre="Autres sessions" description="Sessions en préparation et années passées">
        {autres.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Aucune autre session enregistrée.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {autres.map((s) => {
              const statut = STATUTS[s.statut] || STATUTS.cloturee;
              return (
                <div key={s.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">📁</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-base font-bold text-slate-800">Session {s.libelle}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statut.classe}`}>{statut.libelle}</span>
                      </div>
                      <p className="text-slate-500 mt-0.5">{dateLongue(s.date_debut)} — {dateLongue(s.date_fin)} · {s.eleves.toLocaleString("fr-FR")} élève{s.eleves > 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  {peutAdministrer && (
                    <button
                      type="button"
                      onClick={() => setAActiver(s)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#0C447C]/30 text-[#0C447C] hover:bg-blue-50 text-xs font-bold self-start sm:self-auto cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Activer
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Carte>

      {aActiver && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setAActiver(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">Activer la session {aActiver.libelle} ?</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {active ? `La session ${active.libelle} sera clôturée. ` : ""}Les inscriptions, classes, notes et frais affichés dans toute l'application porteront désormais sur l'année {aActiver.libelle}.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button type="button" onClick={() => setAActiver(null)} className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">Annuler</button>
              <button type="button" onClick={confirmerActivation} className="px-5 py-2.5 rounded-xl bg-[#0C447C] hover:brightness-110 text-white text-xs font-bold shadow-md cursor-pointer">Confirmer l'activation</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
