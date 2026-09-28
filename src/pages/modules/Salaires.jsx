import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../services/api";
import { Plus, FileText, History, CheckCircle2, X, Banknote } from "lucide-react";
import { ouvrirFenetreVierge, genererEtImprimerFichePaie } from "../../utils/impression";
import { formaterGNF } from "../../components/enseignants/theme";
import { MOYENS } from "../../components/frais/configFrais";
import ListeSalaires from "../../components/salaires/ListeSalaires";
import HistoriqueSalaires from "../../components/salaires/HistoriqueSalaires";
import PanneauNouveauSalaire from "../../components/salaires/PanneauNouveauSalaire";
import { MESSAGE_POPUP_BLOQUE, libellePeriode, messageErreur } from "../../components/salaires/configSalaires";

// Gestion des salaires (design "Gestion des salaires") : liste filtrable, historique par
// enseignant, panneau "Nouveau salaire" et fiche de paie imprimable, sur GET /salaires et
// GET /enseignants. Tous les salaires sont charges une fois (volume d'un etablissement) :
// filtres, compteurs et graphiques sont calcules cote client.
//
// Parametres d'URL : ?enseignant=ID ouvre l'historique de cet enseignant, ?nouveau=ID ouvre le
// panneau "Nouveau salaire" pour lui (liens depuis le module Enseignants).

const aujourdHui = new Date();
const ANNEE_COURANTE = aujourdHui.getFullYear();

export default function Salaires({ permissions = [] }) {
  const peutGerer = permissions.includes("enseignants.salaires.gerer");
  const [parametres, setParametres] = useSearchParams();
  const idUrl = (cle) => (parametres.get(cle) ? Number(parametres.get(cle)) : null);

  const [salaires, setSalaires] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [toast, setToast] = useState("");

  const [onglet, setOnglet] = useState(idUrl("enseignant") ? "historique" : "liste");
  const [filtres, setFiltres] = useState({ mois: aujourdHui.getMonth() + 1, annee: ANNEE_COURANTE, enseignant: "tous", statut: "tous" });
  const [historique, setHistorique] = useState({ enseignant: idUrl("enseignant"), annee: ANNEE_COURANTE });
  const [panneau, setPanneau] = useState(null); // { enseignant } quand le panneau est ouvert
  const [aPayer, setAPayer] = useState(null); // { salaire, moyen }
  const [paiementEnCours, setPaiementEnCours] = useState(false);

  // Incrementer `rechargement` relance le chargement des salaires (apres ajout, paiement...).
  const [rechargement, setRechargement] = useState(0);
  const recharger = () => setRechargement((n) => n + 1);

  useEffect(() => {
    api.get("/enseignants")
      .then((res) => setEnseignants(res.data.enseignants || []))
      .catch(() => setErreur("Impossible de charger les enseignants."));
  }, []);

  useEffect(() => {
    let annule = false;
    api.get("/salaires")
      .then((res) => { if (!annule) setSalaires(res.data); })
      .catch(() => { if (!annule) setErreur("Impossible de charger les salaires."); })
      .finally(() => { if (!annule) setChargement(false); });
    return () => { annule = true; };
  }, [rechargement]);

  // ?nouveau=ID : ouvre le panneau une fois les enseignants et salaires charges (pre-remplissage).
  const nouveauUrl = idUrl("nouveau");
  useEffect(() => {
    if (!nouveauUrl || chargement || enseignants.length === 0) return;
    if (peutGerer) setPanneau({ enseignant: nouveauUrl });
    setParametres((p) => { p.delete("nouveau"); return p; }, { replace: true });
  }, [nouveauUrl, chargement, enseignants.length, peutGerer, setParametres]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // Annees proposees : celles des salaires enregistres, plus l'annee precedente, courante et suivante.
  const annees = useMemo(
    () => [...new Set([ANNEE_COURANTE - 1, ANNEE_COURANTE, ANNEE_COURANTE + 1, ...salaires.map((s) => s.annee)])].sort((a, b) => a - b),
    [salaires]
  );

  // Enseignant affiche dans l'historique : celui choisi, sinon le premier qui a des salaires.
  const enseignantHistorique =
    historique.enseignant ?? salaires.find((s) => enseignants.some((e) => e.id === s.enseignant_id))?.enseignant_id ?? enseignants[0]?.id ?? null;

  const ouvrirHistorique = (id) => {
    setHistorique((h) => ({ ...h, enseignant: id, annee: filtres.annee }));
    setOnglet("historique");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // `fenetre` doit etre ouverte pendant le clic (sinon le navigateur la bloque apres l'appel reseau).
  async function imprimerFiche(id, fenetre) {
    if (!fenetre) {
      setErreur(MESSAGE_POPUP_BLOQUE);
      return;
    }
    try {
      const res = await api.get(`/salaires/${id}`);
      genererEtImprimerFichePaie(res.data, fenetre);
    } catch {
      fenetre.close();
      setErreur("Impossible de charger la fiche de paie.");
    }
  }

  // Appelee par le panneau ; rejette avec un message affichable en cas d'erreur.
  async function enregistrer(donnees, payer) {
    const fenetre = payer ? ouvrirFenetreVierge() : null;
    setErreur("");
    try {
      const res = await api.post("/salaires", { ...donnees, payer });
      setPanneau(null);
      const nom = `${res.data.enseignant?.prenom ?? ""} ${res.data.enseignant?.nom ?? ""}`.trim();
      setToast(`Salaire ${payer ? "enregistré et payé" : "enregistré"} pour ${nom} (${libellePeriode(res.data)}).`);
      recharger();
      if (payer) await imprimerFiche(res.data.id, fenetre);
    } catch (err) {
      fenetre?.close();
      throw new Error(messageErreur(err, "Erreur lors de l'enregistrement."));
    }
  }

  async function confirmerPaiement() {
    const { salaire, moyen } = aPayer;
    const fenetre = ouvrirFenetreVierge();
    setPaiementEnCours(true);
    setErreur("");
    try {
      await api.post(`/salaires/${salaire.id}/payer`, { moyen_paiement: moyen });
      setAPayer(null);
      setToast(`Salaire ${salaire.reference} réglé : ${formaterGNF(salaire.montant_net)}.`);
      recharger();
      await imprimerFiche(salaire.id, fenetre);
    } catch (err) {
      fenetre?.close();
      setAPayer(null);
      setErreur(messageErreur(err, "Erreur lors du paiement."));
    } finally {
      setPaiementEnCours(false);
    }
  }

  async function supprimer(salaire) {
    if (!window.confirm(`Supprimer le salaire ${salaire.reference} (${libellePeriode(salaire)}) ?`)) return;
    setErreur("");
    try {
      await api.delete(`/salaires/${salaire.id}`);
      setToast(`Salaire ${salaire.reference} supprimé.`);
      recharger();
    } catch (err) {
      setErreur(messageErreur(err, "Erreur lors de la suppression."));
    }
  }

  const ouvrirNouveau = (enseignantId = null) => setPanneau({ enseignant: enseignantId ?? (filtres.enseignant === "tous" ? null : filtres.enseignant) });
  const imprimer = (s) => imprimerFiche(s.id, ouvrirFenetreVierge());

  return (
    <div className="space-y-6">
      {/* Banniere */}
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white shadow-xl bg-cover bg-center" style={{ backgroundImage: "url('/images/login-bg.jpeg')" }}>
        {/* Voile degrade pour la lisibilite du texte sur la photo */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(12,68,124,0.92) 0%, rgba(26,107,181,0.72) 100%)" }} />
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute right-36 -bottom-16 w-64 h-64 bg-white/5 rounded-full pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center text-3xl border border-white/20 shrink-0">💰</div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Gestion des Salaires</h1>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/20 border border-white/25">LAKOLI · Guinée</span>
              </div>
              <p className="text-sm text-white/70 mt-1">Rémunérations · Fiches de paie · Historique du corps enseignant</p>
            </div>
          </div>
          {peutGerer && (
            <button
              onClick={() => ouvrirNouveau()}
              className="w-full sm:w-auto px-5 py-3 bg-white text-[#0C447C] hover:bg-slate-50 font-bold rounded-xl text-sm transition-all shadow-lg hover:-translate-y-px flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Nouveau salaire
            </button>
          )}
        </div>
      </div>

      {/* Onglets */}
      <nav className="inline-flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold shadow-sm">
        {[
          ["liste", "Liste des salaires", FileText],
          ["historique", "Historique par enseignant", History],
        ].map(([cle, libelle, Icone]) => (
          <button
            key={cle}
            onClick={() => setOnglet(cle)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
              onglet === cle ? "bg-[#0C447C] text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Icone className="w-4 h-4" />
            {libelle}
          </button>
        ))}
      </nav>

      {erreur && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start justify-between gap-3">
          <span>{erreur}</span>
          <button onClick={() => setErreur("")} className="text-red-400 hover:text-red-700 cursor-pointer" aria-label="Fermer"><X className="w-4 h-4" /></button>
        </div>
      )}

      {onglet === "liste" ? (
        <ListeSalaires
          salaires={salaires}
          enseignants={enseignants}
          chargement={chargement}
          peutGerer={peutGerer}
          annees={annees}
          filtres={filtres}
          setFiltres={setFiltres}
          onNouveau={ouvrirNouveau}
          onFiche={imprimer}
          onPayer={(s) => setAPayer({ salaire: s, moyen: s.moyen_paiement })}
          onSupprimer={supprimer}
          onHistorique={ouvrirHistorique}
        />
      ) : (
        <HistoriqueSalaires
          salaires={salaires}
          enseignants={enseignants}
          enseignantId={enseignantHistorique}
          setEnseignantId={(id) => setHistorique((h) => ({ ...h, enseignant: id }))}
          annee={historique.annee}
          setAnnee={(a) => setHistorique((h) => ({ ...h, annee: a }))}
          annees={annees}
          peutGerer={peutGerer}
          onNouveau={ouvrirNouveau}
          onFiche={imprimer}
        />
      )}

      {panneau && (
        <PanneauNouveauSalaire
          enseignants={enseignants}
          salaires={salaires}
          enseignantInitial={panneau.enseignant}
          moisInitial={filtres.mois === "tous" ? aujourdHui.getMonth() + 1 : filtres.mois}
          anneeInitiale={filtres.annee}
          annees={annees}
          onFermer={() => setPanneau(null)}
          onEnregistrer={enregistrer}
        />
      )}

      {/* Confirmation de paiement */}
      {aPayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4" onClick={() => !paiementEnCours && setAPayer(null)}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><Banknote className="w-5 h-5" /></div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Régler ce salaire</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {aPayer.salaire.enseignant?.prenom} {aPayer.salaire.enseignant?.nom} · {libellePeriode(aPayer.salaire)} · {aPayer.salaire.reference}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[#eff6ff] border border-[#0C447C]/20 px-4 py-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0C447C]">Net à payer</span>
              <span className="text-xl font-black font-mono text-[#0C447C]">{formaterGNF(aPayer.salaire.montant_net)}</span>
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Moyen de paiement</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(MOYENS).map(([cle, m]) => (
                  <button
                    key={cle}
                    type="button"
                    onClick={() => setAPayer((p) => ({ ...p, moyen: cle }))}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 font-medium transition-all cursor-pointer ${
                      aPayer.moyen === cle ? "border-[#0C447C] bg-blue-50/70 text-[#0C447C] font-bold ring-1 ring-[#0C447C]" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-base">{m.emoji}</span>
                    {m.libelle}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setAPayer(null)} disabled={paiementEnCours} className="px-4 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50">
                Annuler
              </button>
              <button onClick={confirmerPaiement} disabled={paiementEnCours} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold cursor-pointer disabled:opacity-50">
                {paiementEnCours ? "Paiement..." : "Payer et imprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
