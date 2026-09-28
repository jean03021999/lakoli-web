import { useState } from "react";
import { X, Search, AlertTriangle, Check, Sparkles, Banknote } from "lucide-react";
import BadgeContrat from "../enseignants/BadgeContrat";
import { degradeEnseignant, initialesEnseignant, formaterGNF, normaliser } from "../enseignants/theme";
import { MOYENS } from "../frais/configFrais";
import { MOIS, libellePeriode, montantNet, rangPeriode } from "./configSalaires";

// Panneau lateral "Nouveau salaire" : monte uniquement quand il est ouvert (etat initial frais a
// chaque ouverture). Les montants sont pre-remplis depuis le dernier salaire de l'enseignant, ou a
// defaut depuis son contrat actif ; le serveur recalcule le net a l'enregistrement.

const CHAMP_NOMBRE = "w-full text-sm font-semibold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none font-mono tabular-nums";
const LIBELLE = "text-xs font-bold uppercase tracking-wider text-slate-500";

function valeur(v) {
  return v === null || v === undefined ? "" : String(Number(v));
}

// Valeurs proposees pour un enseignant, avec la source affichee sous le selecteur.
function preremplissage(enseignant, salaires) {
  const dernier = salaires
    .filter((s) => s.enseignant_id === enseignant?.id)
    .sort((a, b) => rangPeriode(b.annee, b.mois) - rangPeriode(a.annee, a.mois))[0];
  if (dernier) {
    return {
      source: `Montants repris du salaire de ${libellePeriode(dernier)}`,
      champs: {
        type_remuneration: dernier.type_remuneration,
        salaire_base: valeur(dernier.salaire_base),
        nb_heures: valeur(dernier.nb_heures),
        taux_horaire: valeur(dernier.taux_horaire),
        taux_heure_supp: valeur(dernier.taux_heure_supp ?? enseignant?.taux_horaire_heures_sup),
        moyen_paiement: dernier.moyen_paiement,
      },
    };
  }
  const vacataire = enseignant?.type_contrat === "vacataire";
  return {
    source: enseignant?.statut_contrat === "actif" ? "Montants repris du contrat actif" : "Aucun contrat actif : saisissez les montants",
    champs: {
      type_remuneration: vacataire ? "horaire" : "fixe",
      salaire_base: vacataire ? "" : valeur(enseignant?.salaire_base),
      nb_heures: "",
      taux_horaire: "",
      taux_heure_supp: valeur(enseignant?.taux_horaire_heures_sup),
      moyen_paiement: "especes",
    },
  };
}

export default function PanneauNouveauSalaire({ enseignants, salaires, enseignantInitial, moisInitial, anneeInitiale, annees, onFermer, onEnregistrer }) {
  const premier = enseignants.find((e) => e.id === enseignantInitial) || null;
  const initial = preremplissage(premier, salaires);

  const [enseignantId, setEnseignantId] = useState(premier?.id ?? "");
  const [source, setSource] = useState(premier ? initial.source : "");
  const [form, setForm] = useState({ mois: moisInitial, annee: anneeInitiale, nb_heures_supp: "", observation: "", ...initial.champs });
  const [avecHeuresSupp, setAvecHeuresSupp] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [listeOuverte, setListeOuverte] = useState(!premier);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  const enseignant = enseignants.find((e) => e.id === enseignantId) || null;
  const maj = (champ, v) => setForm((f) => ({ ...f, [champ]: v }));

  const choisir = (e) => {
    const p = preremplissage(e, salaires);
    setEnseignantId(e.id);
    setSource(p.source);
    setForm((f) => ({ ...f, ...p.champs }));
    setListeOuverte(false);
    setRecherche("");
    setErreur("");
  };

  const termes = normaliser(recherche).split(/\s+/).filter(Boolean);
  const proposes = enseignants.filter((e) => {
    const cible = normaliser(`${e.nom} ${e.prenom} ${e.matricule} ${(e.matieres || []).join(" ")} ${e.type_contrat || ""}`);
    return termes.every((t) => cible.includes(t));
  });

  const doublon = salaires.some((s) => s.enseignant_id === enseignantId && s.mois === Number(form.mois) && s.annee === Number(form.annee));
  const estFixe = form.type_remuneration === "fixe";
  const calcul = {
    type_remuneration: form.type_remuneration,
    salaire_base: form.salaire_base,
    nb_heures: form.nb_heures,
    taux_horaire: form.taux_horaire,
    nb_heures_supp: avecHeuresSupp ? form.nb_heures_supp : 0,
    taux_heure_supp: avecHeuresSupp ? form.taux_heure_supp : 0,
  };
  const net = montantNet(calcul);
  const supp = avecHeuresSupp ? (Number(form.nb_heures_supp) || 0) * (Number(form.taux_heure_supp) || 0) : 0;

  const enregistrer = async (payer) => {
    setErreur("");
    if (!enseignant) return setErreur("Choisissez un enseignant.");
    if (doublon) return setErreur(`Un salaire existe déjà pour cet enseignant en ${MOIS[form.mois - 1]} ${form.annee}.`);
    if (estFixe && form.salaire_base === "") return setErreur("Indiquez le salaire de base.");
    if (!estFixe && (form.nb_heures === "" || form.taux_horaire === "")) return setErreur("Indiquez le nombre d'heures et le taux horaire.");
    if (avecHeuresSupp && (!Number(form.nb_heures_supp) || form.taux_heure_supp === "")) {
      return setErreur("Indiquez le nombre d'heures supplémentaires et leur taux.");
    }
    setEnvoi(true);
    try {
      await onEnregistrer(
        {
          enseignant_id: enseignant.id,
          mois: Number(form.mois),
          annee: Number(form.annee),
          type_remuneration: form.type_remuneration,
          salaire_base: estFixe ? form.salaire_base : null,
          nb_heures: estFixe ? null : form.nb_heures,
          taux_horaire: estFixe ? null : form.taux_horaire,
          nb_heures_supp: avecHeuresSupp ? form.nb_heures_supp : 0,
          taux_heure_supp: avecHeuresSupp ? form.taux_heure_supp : null,
          moyen_paiement: form.moyen_paiement,
          observation: form.observation.trim() || null,
        },
        payer
      );
    } catch (err) {
      setErreur(err.message);
      setEnvoi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-[2px]" onClick={() => !envoi && onFermer()}>
      <div className="w-full max-w-[480px] h-full bg-white shadow-[-8px_0_32px_rgba(0,0,0,0.12)] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* En-tete */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0C447C]/10 text-[#0C447C] flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">Nouveau salaire</h2>
              <p className="text-xs text-slate-500">Le montant net est recalculé par le serveur</p>
            </div>
          </div>
          <button onClick={onFermer} disabled={envoi} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer" aria-label="Fermer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto space-y-6 flex-1 text-slate-700">
          {/* Enseignant */}
          <div className="space-y-1.5 relative">
            <label className={LIBELLE}>Enseignant bénéficiaire</label>
            <button
              type="button"
              onClick={() => setListeOuverte((o) => !o)}
              className="w-full text-left p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between gap-3 cursor-pointer"
            >
              {enseignant ? (
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: degradeEnseignant(enseignant.matricule || enseignant.nom) }}>
                    {initialesEnseignant(enseignant)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 truncate">{enseignant.prenom} {enseignant.nom}</div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 min-w-0">
                      <span className="truncate">{enseignant.matieres?.join(", ") || "Aucune matière"}</span>
                      <BadgeContrat type={enseignant.type_contrat} taille="sm" />
                    </div>
                  </div>
                </div>
              ) : (
                <span className="text-sm text-slate-400">— Choisir un enseignant —</span>
              )}
              <span className="text-xs font-semibold text-slate-400 shrink-0">Modifier ▾</span>
            </button>
            {source && !listeOuverte && <p className="text-[11px] text-slate-400">{source}</p>}

            {listeOuverte && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-2 space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom, matricule, matière..."
                    value={recherche}
                    onChange={(e) => setRecherche(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0C447C]"
                    autoFocus
                  />
                </div>
                <div className="max-h-56 overflow-y-auto space-y-1">
                  {proposes.length === 0 && <p className="text-xs text-slate-400 text-center py-3">Aucun enseignant trouvé.</p>}
                  {proposes.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => choisir(e)}
                      className={`w-full text-left p-2 rounded-lg flex items-center justify-between text-xs cursor-pointer ${
                        e.id === enseignantId ? "bg-[#eff6ff] text-[#0C447C] font-semibold" : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-6 h-6 rounded-full text-[10px] text-white font-bold flex items-center justify-center shrink-0" style={{ background: degradeEnseignant(e.matricule || e.nom) }}>
                          {initialesEnseignant(e)}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate">{e.prenom} {e.nom}</div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {e.matricule}{e.matieres?.length ? ` · ${e.matieres.join(", ")}` : ""}
                          </div>
                        </div>
                      </div>
                      {e.id === enseignantId && <Check className="w-4 h-4 text-[#0C447C] shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Periode */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className={LIBELLE}>Période de paie</label>
              {doublon && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  Déjà saisi ce mois
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.mois}
                onChange={(e) => maj("mois", Number(e.target.value))}
                className="w-full text-sm font-medium px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0C447C] cursor-pointer"
              >
                {MOIS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
              <select
                value={form.annee}
                onChange={(e) => maj("annee", Number(e.target.value))}
                className="w-full text-sm font-medium px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0C447C] cursor-pointer"
              >
                {annees.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          {/* Type de remuneration */}
          <div className="space-y-1.5">
            <label className={LIBELLE}>Type de rémunération</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { type: "fixe", titre: "💼 Fixe", texte: "Salaire mensuel fixe", actif: "border-[#0C447C] bg-[#eff6ff] ring-1 ring-[#0C447C]", point: "bg-[#0C447C]" },
                { type: "horaire", titre: "⏱ Horaire", texte: "Basé sur les heures", actif: "border-[#7c3aed] bg-[#f5f3ff] ring-1 ring-[#7c3aed]", point: "bg-[#7c3aed]" },
              ].map((t) => (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => maj("type_remuneration", t.type)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${form.type_remuneration === t.type ? t.actif : "border-slate-200 bg-white hover:border-slate-300"}`}
                >
                  <div className="text-sm font-bold text-slate-900 flex items-center justify-between">
                    <span>{t.titre}</span>
                    {form.type_remuneration === t.type && <span className={`w-2 h-2 rounded-full ${t.point}`} />}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{t.texte}</div>
                </button>
              ))}
            </div>
          </div>

          {estFixe ? (
            <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <label className={`${LIBELLE} flex justify-between`}>
                <span>Salaire de base (GNF)</span>
                <span className="text-[#0C447C] font-mono">{formaterGNF(form.salaire_base)}</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="50000"
                  value={form.salaire_base}
                  onChange={(e) => maj("salaire_base", e.target.value)}
                  placeholder="ex : 1 400 000"
                  className={`${CHAMP_NOMBRE} text-base focus:border-[#0C447C]`}
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold">GNF</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3 p-3.5 bg-purple-50/60 rounded-xl border border-purple-100">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Nombre d'heures</label>
                  <input type="number" min="0" step="0.5" value={form.nb_heures} onChange={(e) => maj("nb_heures", e.target.value)} placeholder="ex : 40" className={`${CHAMP_NOMBRE} focus:border-[#7c3aed]`} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Taux horaire (GNF)</label>
                  <input type="number" min="0" step="1000" value={form.taux_horaire} onChange={(e) => maj("taux_horaire", e.target.value)} placeholder="ex : 20 000" className={`${CHAMP_NOMBRE} focus:border-[#7c3aed]`} />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-purple-200/60">
                <span className="text-purple-700 font-medium">Calcul base horaire :</span>
                <span className="font-mono font-bold text-sm text-[#0C447C]">= {formaterGNF(net - supp)}</span>
              </div>
            </div>
          )}

          {/* Heures supplementaires */}
          <div className="space-y-3 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <div className="text-sm font-bold text-slate-800">⚡ Heures supplémentaires</div>
                <p className="text-xs text-slate-400">Cours de révision, examens blancs, rattrapages</p>
              </div>
              <span className="relative inline-flex items-center shrink-0">
                <input type="checkbox" checked={avecHeuresSupp} onChange={(e) => setAvecHeuresSupp(e.target.checked)} className="sr-only peer" />
                <span className="w-11 h-6 bg-slate-200 rounded-full peer-checked:bg-emerald-600 transition-colors" />
                <span className="absolute left-[2px] top-[2px] w-5 h-5 bg-white rounded-full border border-slate-300 transition-transform peer-checked:translate-x-5 peer-checked:border-white" />
              </span>
            </label>

            {avecHeuresSupp && (
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Nb heures supp</label>
                    <input type="number" min="0" step="0.5" value={form.nb_heures_supp} onChange={(e) => maj("nb_heures_supp", e.target.value)} placeholder="ex : 6" className={`${CHAMP_NOMBRE} focus:border-emerald-500`} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Taux heure supp (GNF)</label>
                    <input type="number" min="0" step="1000" value={form.taux_heure_supp} onChange={(e) => maj("taux_heure_supp", e.target.value)} placeholder="ex : 25 000" className={`${CHAMP_NOMBRE} focus:border-emerald-500`} />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-emerald-100">
                  <span className="text-emerald-700 font-medium">Supplément calculé :</span>
                  <span className="font-mono font-bold text-sm text-emerald-600">= {formaterGNF(supp)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Total en temps reel */}
          <div className="p-4 rounded-xl text-white shadow-md" style={{ background: "linear-gradient(135deg, #0C447C 0%, #1a6bb5 100%)" }}>
            <div className="flex items-center justify-between text-xs font-bold text-white/70 uppercase tracking-wider">
              <span>Montant net à payer</span>
              <Sparkles className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="text-[30px] font-black tracking-tight leading-tight mt-1 font-mono tabular-nums">{formaterGNF(net)}</div>
            <div className="text-xs text-white/80 mt-1.5 pt-2 border-t border-white/15 font-mono">
              Base {formaterGNF(net - supp)}{supp > 0 ? ` + H.Supp ${formaterGNF(supp)}` : ""}
            </div>
          </div>

          {/* Moyen de paiement */}
          <div className="space-y-1.5">
            <label className={LIBELLE}>Moyen de paiement</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(MOYENS).map(([cle, m]) => (
                <button
                  key={cle}
                  type="button"
                  onClick={() => maj("moyen_paiement", cle)}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 font-medium transition-all cursor-pointer ${
                    form.moyen_paiement === cle ? "border-[#0C447C] bg-blue-50/70 text-[#0C447C] font-bold ring-1 ring-[#0C447C]" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-base">{m.emoji}</span>
                  <span className="truncate">{m.libelle}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Observation */}
          <div className="space-y-1.5">
            <label className={LIBELLE}>Observation (optionnel)</label>
            <textarea
              rows={2}
              value={form.observation}
              onChange={(e) => maj("observation", e.target.value)}
              placeholder="Ex : prime de correction des examens incluse, référence Orange Money..."
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0C447C] focus:bg-white resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-slate-200 bg-white shrink-0 space-y-2">
          {erreur && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{erreur}</div>}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => enregistrer(false)}
              disabled={envoi}
              className="px-4 py-2.5 border-2 border-[#0C447C] text-[#0C447C] hover:bg-blue-50/60 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              Enregistrer
            </button>
            <button
              type="button"
              onClick={() => enregistrer(true)}
              disabled={envoi}
              className="px-4 py-2.5 bg-[#0C447C] hover:bg-[#093560] text-white rounded-xl text-xs sm:text-sm font-bold transition-colors shadow-md shadow-[#0C447C]/20 cursor-pointer disabled:opacity-50"
            >
              {envoi ? "Enregistrement..." : "Enregistrer et payer"}
            </button>
          </div>
          <p className="text-[11px] text-center text-slate-400">« Enregistrer et payer » marque le salaire comme payé et ouvre la fiche.</p>
        </div>
      </div>
    </div>
  );
}
