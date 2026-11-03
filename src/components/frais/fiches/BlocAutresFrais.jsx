import { Plus, Trash2, Tag, Sparkles, Info } from "lucide-react";
import { formaterGNF } from "../configFrais";
import { parseGNF, afficherMontant, nouvelleCle } from "./outilsFiche";

// Autres frais de la fiche : un type de frais chacun (Tenue, Cantine...). Obligatoire = facture a
// tous les eleves de la classe ; facultatif = tarif enregistre mais non facture d'office.

const SUGGESTIONS = [
  { libelle: "Tenue scolaire", montant: 150000, obligatoire: true, periodicite: "unique" },
  { libelle: "Cantine", montant: 200000, obligatoire: false, periodicite: "echeance" },
  { libelle: "Transport", montant: 250000, obligatoire: false, periodicite: "echeance" },
  { libelle: "Frais de dossier", montant: 30000, obligatoire: true, periodicite: "unique" },
  { libelle: "Assurance scolaire", montant: 50000, obligatoire: true, periodicite: "unique" },
  { libelle: "Examens blancs", montant: 80000, obligatoire: true, periodicite: "unique" },
];

export default function BlocAutresFrais({ autresFrais, onChange }) {
  const ajouter = (modele = { libelle: "", montant: 0, obligatoire: true, periodicite: "unique" }) => onChange([...autresFrais, { ...modele, cle: nouvelleCle() }]);
  const maj = (i, champ, valeur) => onChange(autresFrais.map((f, j) => (j === i ? { ...f, [champ]: valeur } : f)));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <p className="text-xs text-slate-600">Uniformes, cantine, transport, examens, assurance…</p>
        <button type="button" onClick={() => ajouter()} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0C447C] hover:bg-[#0a3866] text-white text-xs font-semibold cursor-pointer">
          <Plus className="w-3.5 h-3.5" /> Ajouter un frais
        </button>
      </div>

      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Suggestions courantes (cliquez pour ajouter) :
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {SUGGESTIONS.map((s) => {
            const present = autresFrais.some((f) => f.libelle.trim().toLowerCase() === s.libelle.toLowerCase());
            return (
              <button
                key={s.libelle}
                type="button"
                disabled={present}
                onClick={() => ajouter(s)}
                className={`text-[11px] px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${
                  present ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed" : "bg-white border-blue-200 text-[#0C447C] hover:bg-blue-50 font-medium cursor-pointer"
                }`}
              >
                + {s.libelle} <span className="text-slate-500 font-bold">({formaterGNF(s.montant)})</span>
              </button>
            );
          })}
        </div>
      </div>

      {autresFrais.length === 0 ? (
        <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-200 bg-white">
          <Tag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h5 className="text-xs font-bold text-slate-700">Aucun autre frais</h5>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1">Facultatif : la fiche peut s'enregistrer sans.</p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 w-10 text-center">N°</th>
                  <th className="py-3 px-4 min-w-[170px]">Libellé du frais</th>
                  <th className="py-3 px-4 min-w-[150px]">Caractère</th>
                  <th className="py-3 px-4 min-w-[170px]">Périodicité</th>
                  <th className="py-3 px-4 min-w-[150px] text-right">Montant (GNF)</th>
                  <th className="py-3 px-3 w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {autresFrais.map((f, i) => (
                  <tr key={f.cle} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 text-center font-semibold text-slate-400">{i + 1}</td>
                    <td className="py-2.5 px-4">
                      <input
                        value={f.libelle}
                        onChange={(e) => maj(i, "libelle", e.target.value)}
                        placeholder="Ex : Tenue, Cantine…"
                        aria-label={`Libellé de l'autre frais ${i + 1}`}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-200 hover:border-slate-300 focus:border-[#0C447C] text-xs font-semibold text-slate-800 outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-4">
                      <select
                        value={f.obligatoire ? "obligatoire" : "facultatif"}
                        onChange={(e) => maj(i, "obligatoire", e.target.value === "obligatoire")}
                        className={`w-full px-2.5 py-1.5 rounded border text-xs font-semibold outline-none cursor-pointer ${f.obligatoire ? "bg-amber-50/80 border-amber-300 text-amber-900" : "bg-slate-50 border-slate-200 text-slate-700"}`}
                      >
                        <option value="obligatoire">Obligatoire (tous les élèves)</option>
                        <option value="facultatif">Facultatif (sur option)</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-4">
                      <select value={f.periodicite} onChange={(e) => maj(i, "periodicite", e.target.value)} className="w-full px-2.5 py-1.5 rounded border border-slate-200 bg-white text-xs font-medium text-slate-700 outline-none cursor-pointer">
                        <option value="unique">Une seule fois</option>
                        <option value="echeance">À chaque échéance</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="relative inline-flex items-center w-full max-w-[170px]">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={afficherMontant(f.montant)}
                          onChange={(e) => maj(i, "montant", parseGNF(e.target.value))}
                          placeholder="0"
                          aria-label={`Montant de l'autre frais ${i + 1}`}
                          className="w-full text-right pr-12 pl-2.5 py-1.5 rounded border border-slate-200 hover:border-slate-300 focus:border-[#0C447C] text-xs font-bold text-slate-900 outline-none bg-white tabular-nums"
                        />
                        <span className="absolute right-2.5 text-[11px] font-bold text-slate-400 pointer-events-none">GNF</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button type="button" onClick={() => onChange(autresFrais.filter((_, j) => j !== i))} title="Retirer ce frais" className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {autresFrais.some((f) => !f.obligatoire) && (
        <p className="flex items-start gap-2 text-[11px] text-slate-500">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          Un frais facultatif est enregistré avec son tarif mais n'est facturé à aucun élève d'office.
        </p>
      )}
    </div>
  );
}
