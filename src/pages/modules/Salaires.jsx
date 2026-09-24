import { useState, useEffect } from "react";
import api from "../../services/api";
import { DollarSign, Plus, Users, CheckCircle2, Clock, Timer, Printer, Trash2, Banknote } from "lucide-react";
import { Card, Button, Input, Select, Badge, StatCard, Modal } from "../../components/ui/LakoliDesignSystem";
import { MOIS, MOYENS_PAIEMENT, ouvrirFenetreVierge, genererEtImprimerFichePaie } from "../../utils/impression";

function formaterGNF(montant) {
  return `${Number(montant || 0).toLocaleString("fr-FR")} GNF`;
}

const MESSAGE_POPUP_BLOQUE =
  "Le navigateur a bloqué la fenêtre de la fiche de paie. Autorisez les pop-ups pour ce site, puis cliquez sur l'icône d'impression.";

const aujourdHui = new Date();
const ANNEE_COURANTE = aujourdHui.getFullYear();
const ANNEES = [ANNEE_COURANTE - 2, ANNEE_COURANTE - 1, ANNEE_COURANTE, ANNEE_COURANTE + 1];

const FORMULAIRE_VIDE = {
  enseignant_id: "",
  mois: aujourdHui.getMonth() + 1,
  annee: ANNEE_COURANTE,
  type_remuneration: "fixe",
  salaire_base: "",
  nb_heures: "",
  taux_horaire: "",
  nb_heures_supp: "",
  taux_heure_supp: "",
  moyen_paiement: "especes",
  observation: "",
};

// Meme formule que Salaire::getMontantCalculeAttribute cote backend (qui fait foi).
function calculerMontant(f) {
  const n = (v) => Number(v) || 0;
  const supp = n(f.nb_heures_supp) * n(f.taux_heure_supp);
  return f.type_remuneration === "horaire" ? n(f.nb_heures) * n(f.taux_horaire) + supp : n(f.salaire_base) + supp;
}

function Champ({ label, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  );
}

export default function Salaires({ permissions = [] }) {
  const peutGerer = permissions.includes("enseignants.salaires.gerer");

  const [salaires, setSalaires] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [filtres, setFiltres] = useState({ mois: aujourdHui.getMonth() + 1, annee: ANNEE_COURANTE, enseignant_id: "", statut: "" });
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");

  const [modalOuvert, setModalOuvert] = useState(false);
  const [form, setForm] = useState(FORMULAIRE_VIDE);
  const [envoi, setEnvoi] = useState(false);
  const [erreurForm, setErreurForm] = useState("");

  useEffect(() => {
    api.get("/enseignants")
      .then((res) => setEnseignants(res.data.enseignants || []))
      .catch(() => setEnseignants([]));
  }, []);

  // Incrementer `rechargement` relance la requete avec les filtres courants (apres un ajout, paiement...).
  const [rechargement, setRechargement] = useState(0);
  const chargerSalaires = () => setRechargement((n) => n + 1);
  const { mois: filtreMois, annee: filtreAnnee, enseignant_id: filtreEnseignant } = filtres;

  useEffect(() => {
    let annule = false;
    setChargement(true);
    api.get("/salaires", { params: { mois: filtreMois || undefined, annee: filtreAnnee || undefined, enseignant_id: filtreEnseignant || undefined } })
      .then((res) => { if (!annule) setSalaires(res.data); })
      .catch(() => { if (!annule) setErreur("Impossible de charger les salaires."); })
      .finally(() => { if (!annule) setChargement(false); });
    return () => { annule = true; };
  }, [filtreMois, filtreAnnee, filtreEnseignant, rechargement]);

  // Le statut est filtre cote client pour que les cartes stats restent calculees sur toute la periode.
  const salairesAffiches = filtres.statut ? salaires.filter((s) => s.statut === filtres.statut) : salaires;
  const totalPaye = salaires.filter((s) => s.statut === "paye").reduce((t, s) => t + Number(s.montant_net), 0);
  const enAttente = salaires.filter((s) => s.statut === "en_attente");
  const totalEnAttente = enAttente.reduce((t, s) => t + Number(s.montant_net), 0);
  const totalHeuresSupp = salaires.reduce((t, s) => t + (Number(s.nb_heures_supp) || 0), 0);

  function majFiltre(champ, valeur) {
    setFiltres((f) => ({ ...f, [champ]: valeur }));
  }

  function majForm(champ, valeur) {
    setForm((f) => ({ ...f, [champ]: valeur }));
  }

  function ouvrirNouveau() {
    setForm({ ...FORMULAIRE_VIDE, mois: filtres.mois || FORMULAIRE_VIDE.mois, annee: filtres.annee || ANNEE_COURANTE });
    setErreurForm("");
    setModalOuvert(true);
  }

  // Ouvre la fenetre pendant le clic (sinon le navigateur la bloque apres l'appel reseau).
  async function imprimerFiche(id, fenetrePreouverte) {
    const fenetre = fenetrePreouverte || ouvrirFenetreVierge();
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

  async function enregistrer(payer) {
    setErreurForm("");
    if (!form.enseignant_id) {
      setErreurForm("Choisissez un enseignant.");
      return;
    }
    const fenetre = payer ? ouvrirFenetreVierge() : null;
    setEnvoi(true);
    try {
      const res = await api.post("/salaires", {
        ...form,
        salaire_base: form.salaire_base || null,
        nb_heures: form.nb_heures || null,
        taux_horaire: form.taux_horaire || null,
        nb_heures_supp: form.nb_heures_supp || 0,
        taux_heure_supp: form.taux_heure_supp || null,
        observation: form.observation || null,
        payer,
      });
      setModalOuvert(false);
      setSucces(payer ? `Salaire ${res.data.reference} enregistré et payé.` : `Salaire ${res.data.reference} enregistré.`);
      chargerSalaires();
      if (payer) {
        if (fenetre) await imprimerFiche(res.data.id, fenetre);
        else setErreur(MESSAGE_POPUP_BLOQUE);
      }
    } catch (err) {
      fenetre?.close();
      const erreurs = err.response?.data?.errors;
      setErreurForm(erreurs ? Object.values(erreurs).flat()[0] : err.response?.data?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setEnvoi(false);
    }
  }

  async function payer(salaire) {
    if (!window.confirm(`Marquer le salaire de ${salaire.enseignant?.nom} ${salaire.enseignant?.prenom} comme payé (${formaterGNF(salaire.montant_net)}) ?`)) return;
    const fenetre = ouvrirFenetreVierge();
    setErreur(""); setSucces("");
    try {
      await api.post(`/salaires/${salaire.id}/payer`);
      setSucces(`Salaire ${salaire.reference} payé.`);
      chargerSalaires();
      if (fenetre) await imprimerFiche(salaire.id, fenetre);
      else setErreur(MESSAGE_POPUP_BLOQUE);
    } catch (err) {
      fenetre?.close();
      setErreur(err.response?.data?.message || "Erreur lors du paiement.");
    }
  }

  async function supprimer(salaire) {
    if (!window.confirm(`Supprimer le salaire ${salaire.reference} ?`)) return;
    setErreur(""); setSucces("");
    try {
      await api.delete(`/salaires/${salaire.id}`);
      setSucces(`Salaire ${salaire.reference} supprimé.`);
      chargerSalaires();
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur lors de la suppression.");
    }
  }

  const montantCalcule = calculerMontant(form);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6 flex flex-wrap items-center gap-4" style={{ background: "linear-gradient(135deg, #0C447C, #1a5a9e)" }}>
        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full pointer-events-none" style={{ background: "rgba(255,255,255,0.08)" }} />
        <div className="absolute -bottom-10 right-16 h-20 w-20 rounded-full pointer-events-none" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div
          className="h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 relative z-10"
          style={{ background: "rgba(255,255,255,0.15)", boxShadow: "0 8px 20px rgba(0,0,0,0.15)" }}
        >
          <DollarSign className="h-7 w-7 text-white" />
        </div>
        <div className="relative z-10 min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Gestion des Salaires</h1>
          <p className="text-xs sm:text-sm text-white/70 mt-1 max-w-2xl">
            Calculez, payez et imprimez les fiches de paie des enseignants.
          </p>
        </div>
        {peutGerer && (
          <button
            onClick={ouvrirNouveau}
            className="relative z-10 inline-flex items-center gap-2 bg-white text-[#0C447C] font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm hover:bg-blue-50 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Nouveau salaire
          </button>
        )}
      </div>

      <Card className="!p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Select value={filtres.mois} onChange={(e) => majFiltre("mois", e.target.value)}>
            <option value="">Tous les mois</option>
            {MOIS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </Select>
          <Select value={filtres.annee} onChange={(e) => majFiltre("annee", e.target.value)}>
            <option value="">Toutes les années</option>
            {ANNEES.map((a) => <option key={a} value={a}>{a}</option>)}
          </Select>
          <Select value={filtres.enseignant_id} onChange={(e) => majFiltre("enseignant_id", e.target.value)}>
            <option value="">Tous les enseignants</option>
            {enseignants.map((e) => <option key={e.id} value={e.id}>{e.nom} {e.prenom}</option>)}
          </Select>
          <Select value={filtres.statut} onChange={(e) => majFiltre("statut", e.target.value)}>
            <option value="">Tous les statuts</option>
            <option value="paye">Payé</option>
            <option value="en_attente">En attente</option>
          </Select>
        </div>
      </Card>

      {erreur && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{erreur}</div>}
      {succes && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{succes}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total enseignants" value={enseignants.length} icon={Users} subtitle={`${salaires.length} salaire(s) sur la période`} />
        <StatCard title="Total payé" value={formaterGNF(totalPaye)} icon={CheckCircle2} subtitle="Sur la période filtrée" />
        <StatCard title="En attente" value={formaterGNF(totalEnAttente)} icon={Clock} subtitle={`${enAttente.length} salaire(s) à payer`} />
        <StatCard title="Heures supp" value={`${totalHeuresSupp.toLocaleString("fr-FR")} h`} icon={Timer} subtitle="Sur la période filtrée" />
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Enseignant</th>
                <th className="text-left font-semibold px-4 py-3">Mois / Année</th>
                <th className="text-left font-semibold px-4 py-3">Type</th>
                <th className="text-right font-semibold px-4 py-3">Montant net</th>
                <th className="text-left font-semibold px-4 py-3">Statut</th>
                <th className="text-right font-semibold px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {chargement ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">Chargement...</td></tr>
              ) : salairesAffiches.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">Aucun salaire pour cette période.</td></tr>
              ) : (
                salairesAffiches.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{s.enseignant?.nom} {s.enseignant?.prenom}</div>
                      <div className="text-xs text-slate-400 font-mono">{s.reference}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{MOIS[s.mois - 1]} {s.annee}</td>
                    <td className="px-4 py-3">
                      <Badge variant="neutral">{s.type_remuneration === "horaire" ? "Horaire" : "Fixe"}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800 whitespace-nowrap">{formaterGNF(s.montant_net)}</td>
                    <td className="px-4 py-3">
                      {s.statut === "paye" ? (
                        <Badge variant="neutral" className="!bg-emerald-50 !text-emerald-700 !border-emerald-200">✓ Payé</Badge>
                      ) : (
                        <Badge variant="neutral" className="!bg-amber-50 !text-amber-700 !border-amber-200">En attente</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {peutGerer && s.statut === "en_attente" && (
                          <Button size="sm" variant="secondary" icon={Banknote} onClick={() => payer(s)}>Payer</Button>
                        )}
                        <button
                          onClick={() => imprimerFiche(s.id)}
                          title="Imprimer la fiche de paie"
                          className="p-2 rounded-lg text-slate-500 hover:text-[#0C447C] hover:bg-blue-50 cursor-pointer"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        {peutGerer && s.statut === "en_attente" && (
                          <button
                            onClick={() => supprimer(s)}
                            title="Supprimer"
                            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={modalOuvert}
        onClose={() => !envoi && setModalOuvert(false)}
        title="Nouveau salaire"
        description="Le montant net est recalculé par le serveur à l'enregistrement."
        maxWidth="xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOuvert(false)} disabled={envoi}>Annuler</Button>
            <Button variant="secondary" onClick={() => enregistrer(false)} disabled={envoi}>Enregistrer</Button>
            <Button onClick={() => enregistrer(true)} disabled={envoi} icon={Banknote}>Enregistrer et payer</Button>
          </>
        }
      >
        {erreurForm && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erreurForm}</div>}

        <Champ label="Enseignant">
          <Select className="w-full" value={form.enseignant_id} onChange={(e) => majForm("enseignant_id", e.target.value)}>
            <option value="">— Choisir un enseignant —</option>
            {enseignants.map((e) => <option key={e.id} value={e.id}>{e.nom} {e.prenom}{e.matricule ? ` (${e.matricule})` : ""}</option>)}
          </Select>
        </Champ>

        <div className="grid grid-cols-2 gap-3">
          <Champ label="Mois">
            <Select className="w-full" value={form.mois} onChange={(e) => majForm("mois", Number(e.target.value))}>
              {MOIS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </Select>
          </Champ>
          <Champ label="Année">
            <Select className="w-full" value={form.annee} onChange={(e) => majForm("annee", Number(e.target.value))}>
              {ANNEES.map((a) => <option key={a} value={a}>{a}</option>)}
            </Select>
          </Champ>
        </div>

        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-slate-600">Type de rémunération</span>
          <div className="flex gap-2">
            {[["fixe", "Fixe"], ["horaire", "Horaire"]].map(([valeur, libelle]) => (
              <label
                key={valeur}
                className={`flex-1 flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                  form.type_remuneration === valeur ? "border-[#2563EB] bg-blue-50 text-[#2563EB] font-semibold" : "border-slate-200 text-slate-600"
                }`}
              >
                <input
                  type="radio"
                  name="type_remuneration"
                  value={valeur}
                  checked={form.type_remuneration === valeur}
                  onChange={() => majForm("type_remuneration", valeur)}
                  className="accent-[#2563EB]"
                />
                {libelle}
              </label>
            ))}
          </div>
        </div>

        {form.type_remuneration === "fixe" ? (
          <Champ label="Salaire de base (GNF)">
            <Input type="number" min="0" value={form.salaire_base} onChange={(e) => majForm("salaire_base", e.target.value)} placeholder="Ex. 2 500 000" />
          </Champ>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Champ label="Nombre d'heures">
              <Input type="number" min="0" step="0.5" value={form.nb_heures} onChange={(e) => majForm("nb_heures", e.target.value)} />
            </Champ>
            <Champ label="Taux horaire (GNF)">
              <Input type="number" min="0" value={form.taux_horaire} onChange={(e) => majForm("taux_horaire", e.target.value)} />
            </Champ>
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-2">
          <div className="text-xs font-semibold text-slate-600">Heures supplémentaires <span className="font-normal text-slate-400">(optionnel)</span></div>
          <div className="grid grid-cols-2 gap-3">
            <Champ label="Nb heures supp">
              <Input type="number" min="0" step="0.5" value={form.nb_heures_supp} onChange={(e) => majForm("nb_heures_supp", e.target.value)} />
            </Champ>
            <Champ label="Taux heure supp (GNF)">
              <Input type="number" min="0" value={form.taux_heure_supp} onChange={(e) => majForm("taux_heure_supp", e.target.value)} />
            </Champ>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Montant net</span>
          <span className="text-xl font-extrabold font-mono text-emerald-700">{formaterGNF(montantCalcule)}</span>
        </div>

        <Champ label="Moyen de paiement">
          <Select className="w-full" value={form.moyen_paiement} onChange={(e) => majForm("moyen_paiement", e.target.value)}>
            {Object.entries(MOYENS_PAIEMENT).map(([valeur, libelle]) => <option key={valeur} value={valeur}>{libelle}</option>)}
          </Select>
        </Champ>

        <Champ label="Observation (optionnel)">
          <textarea
            rows={2}
            value={form.observation}
            onChange={(e) => majForm("observation", e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
          />
        </Champ>
      </Modal>
    </div>
  );
}
