import { CalendarDays, CalendarRange, Sliders, Check, Info, Plus, Trash2, AlertCircle, RefreshCw } from "lucide-react";
import { formaterGNF } from "../configFrais";
import { MOIS_SCOLAIRES, MOIS_OCT_JUIN, parseGNF, afficherMontant, lignesPourMode, appliquerMontants, nouvelleCle, total } from "./outilsFiche";

// Scolarite : cadence (trimestre, mois au choix, personnalise), montant par echeance ou annuel,
// puis echeancier modifiable ligne par ligne. `etat` : { mode, mois, modeSaisie, montantSaisi, echeances }.

const MODES = [
  { id: "trimestre", titre: "Par trimestre", desc: "3 échéances calquées sur les trimestres", icone: CalendarRange },
  { id: "mois", titre: "Par mois", desc: "Choix précis des mois facturés (1 à 12)", icone: CalendarDays },
  { id: "personnalise", titre: "Personnalisé", desc: "Nombre et découpage libres", icone: Sliders },
];

const PRESETS_MOIS = [
  { libelle: "9 mois (oct.–juin)", mois: MOIS_OCT_JUIN },
  { libelle: "10 mois (sept.–juin)", mois: ["septembre", ...MOIS_OCT_JUIN] },
  { libelle: "12 mois", mois: MOIS_SCOLAIRES.map((m) => m.id) },
];

export default function BlocScolarite({ etat, onChange, session }) {
  const { mode, mois, modeSaisie, montantSaisi, echeances } = etat;

  // Regenere les echeances apres un changement de mode, de mois ou de montant.
  const regenerer = (modif) => {
    const e = { ...etat, ...modif };
    const lignes = lignesPourMode(e.mode, e.mois, session, e.mode === "personnalise" ? echeances : []);
    onChange({ ...modif, echeances: appliquerMontants(lignes, e.modeSaisie, e.montantSaisi) });
  };

  const choisirMode = (nouveau) => regenerer({ mode: nouveau, mois: nouveau === "mois" && mois.length === 0 ? MOIS_OCT_JUIN : mois });

  const basculerMois = (id) => regenerer({ mois: mois.includes(id) ? mois.filter((m) => m !== id) : [...mois, id] });

  const changerSaisie = (nouvelle) => {
    if (nouvelle === modeSaisie) return;
    const n = echeances.length || 1;
    regenerer({ modeSaisie: nouvelle, montantSaisi: nouvelle === "annuel" ? montantSaisi * n : Math.round(montantSaisi / n) });
  };

  const majLigne = (i, champ, valeur) => onChange({ echeances: echeances.map((e, j) => (j === i ? { ...e, [champ]: valeur } : e)) });

  const supprimerLigne = (i) => {
    const retiree = echeances[i];
    onChange({
      echeances: echeances.filter((_, j) => j !== i),
      ...(mode === "mois" && retiree.mois ? { mois: mois.filter((m) => m !== retiree.mois) } : {}),
    });
  };

  const ajouterLigne = () =>
    onChange({
      echeances: [...echeances, { cle: nouvelleCle(), libelle: `Échéance ${echeances.length + 1}`, montant: modeSaisie === "echeance" ? montantSaisi : 0, date_limite: "" }],
    });

  const reequilibrer = () => onChange({ echeances: appliquerMontants(echeances, "annuel", montantSaisi) });

  const totalActuel = total(echeances);
  const ecart = modeSaisie === "annuel" && montantSaisi > 0 && totalActuel !== montantSaisi ? montantSaisi - totalActuel : 0;

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Cadence de paiement</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {MODES.map(({ id, titre, desc, icone: Icone }) => {
            const actif = mode === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => choisirMode(id)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  actif ? "bg-blue-50/90 border-[#0C447C] ring-2 ring-blue-100 shadow-sm" : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`w-9 h-9 rounded-lg flex items-center justify-center ${actif ? "bg-[#0C447C] text-white" : "bg-slate-100 text-slate-600"}`}><Icone className="w-5 h-5" /></span>
                  {actif && <span className="w-5 h-5 rounded-full bg-[#0C447C] text-white flex items-center justify-center"><Check className="w-3.5 h-3.5 stroke-[3]" /></span>}
                </div>
                <div className="font-bold text-sm text-slate-900">{titre}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {mode === "mois" && (
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-slate-900">Mois facturés dans l'année</span>
              <p className="text-[11px] text-slate-500">Cochez les mois concernés ({mois.length} mois sélectionné{mois.length > 1 ? "s" : ""})</p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {PRESETS_MOIS.map((p) => (
                <button key={p.libelle} type="button" onClick={() => regenerer({ mois: p.mois })} className="px-2 py-0.5 rounded bg-white border border-slate-200 hover:bg-slate-100 text-[11px] font-medium text-slate-700 cursor-pointer">
                  {p.libelle}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {MOIS_SCOLAIRES.map((m) => {
              const coche = mois.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => basculerMois(m.id)}
                  aria-pressed={coche}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between border cursor-pointer ${
                    coche ? "bg-[#0C447C] text-white border-[#0C447C]" : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100"
                  }`}
                >
                  {m.nomCourt}
                  <span className={`w-4 h-4 rounded flex items-center justify-center ${coche ? "bg-white/20" : "border border-slate-300"}`}>{coche && <Check className="w-3 h-3 stroke-[3]" />}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-slate-800 block">Mode de saisie du montant</span>
            <p className="text-[11px] text-slate-500">Choisissez comment renseigner le tarif</p>
          </div>
          <div className="flex items-center p-1 rounded-lg bg-slate-100 border border-slate-200">
            {[
              ["echeance", "Montant par échéance"],
              ["annuel", "Montant annuel total"],
            ].map(([id, libelle]) => (
              <button
                key={id}
                type="button"
                onClick={() => changerSaisie(id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${modeSaisie === id ? "bg-white text-[#0C447C] shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
              >
                {libelle}
              </button>
            ))}
          </div>
        </div>
        <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                aria-label={modeSaisie === "annuel" ? "Montant annuel de la scolarité" : "Montant par échéance"}
                value={afficherMontant(montantSaisi)}
                onChange={(e) => regenerer({ montantSaisi: parseGNF(e.target.value) })}
                placeholder="0"
                className="w-full pl-3.5 pr-16 py-2.5 text-base font-bold text-slate-900 rounded-lg border border-slate-300 focus:border-[#0C447C] focus:ring-2 focus:ring-blue-100 outline-none tabular-nums"
              />
              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-bold text-slate-500">GNF</span>
            </div>
            <div className="mt-1 text-xs text-slate-500 flex items-center justify-between">
              <span>Aperçu : <strong className="text-[#0C447C]">{formaterGNF(montantSaisi)}</strong></span>
              {modeSaisie === "annuel" && echeances.length > 0 && <span className="text-[11px]">≈ {formaterGNF(Math.round(montantSaisi / echeances.length))} / échéance</span>}
            </div>
          </div>
          <div className="text-xs text-slate-600 bg-blue-50/60 p-3 rounded-lg border border-blue-100 flex items-start gap-2">
            <Info className="w-4 h-4 text-[#0C447C] shrink-0 mt-0.5" />
            <p className="leading-snug">
              {modeSaisie === "annuel"
                ? `Le montant annuel est réparti sur les ${echeances.length} échéances ; l'arrondi va sur la dernière.`
                : `Chaque échéance vaut ${formaterGNF(montantSaisi)}. Chaque ligne reste ajustable ci-dessous.`}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
          Échéancier détaillé ({echeances.length} échéance{echeances.length > 1 ? "s" : ""})
        </label>

        {ecart !== 0 && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 text-xs">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                Le total des échéances ({formaterGNF(totalActuel)}) ne correspond pas au montant annuel saisi ({formaterGNF(montantSaisi)}).
                <div className="mt-0.5 font-semibold">{ecart > 0 ? `${formaterGNF(ecart)} restant à répartir` : `${formaterGNF(-ecart)} en trop`}</div>
              </div>
            </div>
            <button type="button" onClick={reequilibrer} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs whitespace-nowrap cursor-pointer">
              <RefreshCw className="w-3.5 h-3.5" /> Rééquilibrer
            </button>
          </div>
        )}

        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 w-10 text-center">N°</th>
                  <th className="py-3 px-4 min-w-[180px]">Libellé de l'échéance</th>
                  <th className="py-3 px-4 min-w-[150px]">Date limite</th>
                  <th className="py-3 px-4 min-w-[160px] text-right">Montant (GNF)</th>
                  <th className="py-3 px-3 w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {echeances.map((e, i) => (
                  <tr key={e.cle} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 text-center font-semibold text-slate-400 tabular-nums">{i + 1}</td>
                    <td className="py-2.5 px-4">
                      <input
                        value={e.libelle}
                        onChange={(ev) => majLigne(i, "libelle", ev.target.value)}
                        placeholder={`Échéance ${i + 1}`}
                        aria-label={`Libellé de l'échéance ${i + 1}`}
                        className="w-full px-2.5 py-1.5 rounded border border-transparent hover:border-slate-300 focus:border-[#0C447C] text-xs font-semibold text-slate-800 outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-4">
                      <input
                        type="date"
                        value={e.date_limite}
                        onChange={(ev) => majLigne(i, "date_limite", ev.target.value)}
                        aria-label={`Date limite de l'échéance ${i + 1}`}
                        className={`w-full px-2 py-1.5 rounded border text-xs font-medium text-slate-700 outline-none bg-white ${e.date_limite ? "border-slate-200" : "border-rose-300"}`}
                      />
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="relative inline-flex items-center w-full max-w-[180px]">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={afficherMontant(e.montant)}
                          onChange={(ev) => majLigne(i, "montant", parseGNF(ev.target.value))}
                          placeholder="0"
                          aria-label={`Montant de l'échéance ${i + 1}`}
                          className="w-full text-right pr-12 pl-2.5 py-1.5 rounded border border-slate-200 hover:border-slate-300 focus:border-[#0C447C] text-xs font-bold text-slate-900 outline-none bg-white tabular-nums"
                        />
                        <span className="absolute right-2.5 text-[11px] font-bold text-slate-400 pointer-events-none">GNF</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {echeances.length > 1 && (
                        <button type="button" onClick={() => supprimerLigne(i)} title="Supprimer cette échéance" className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100/80 border-t-2 border-slate-200 font-bold text-slate-900">
                  <td colSpan={3} className="py-3 px-4 text-xs">Total annuel de la scolarité ({echeances.length} échéance{echeances.length > 1 ? "s" : ""})</td>
                  <td className="py-3 px-4 text-right text-sm text-[#0C447C] font-extrabold tabular-nums">{formaterGNF(totalActuel)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="p-2.5 bg-slate-50/50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <button type="button" onClick={ajouterLigne} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer">
              <Plus className="w-3.5 h-3.5 text-[#0C447C]" /> Ajouter une échéance libre
            </button>
            <span className="text-[11px] text-slate-400">Dates et montants ajustables ligne par ligne.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
