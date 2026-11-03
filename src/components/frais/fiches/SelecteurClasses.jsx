import { useMemo } from "react";
import { Check, Info, AlertTriangle, Layers } from "lucide-react";
import { CYCLES, cycleDeClasse } from "./outilsFiche";

// Classes de l'ecole regroupees par cycle. Une classe deja dans une autre fiche est grisee :
// une seule fiche par classe et par session.
export default function SelecteurClasses({ classes, selection, onChange, fiches, ficheId }) {
  const occupation = useMemo(() => {
    const m = new Map();
    fiches.filter((f) => f.id !== ficheId).forEach((f) => f.classes_ids.forEach((id) => m.set(id, f.nom)));
    return m;
  }, [fiches, ficheId]);

  const cycles = CYCLES.map((c) => ({ ...c, classes: classes.filter((cl) => cycleDeClasse(cl) === c.id) })).filter((c) => c.classes.length > 0);

  const basculer = (id) => {
    if (occupation.has(id)) return;
    onChange(selection.includes(id) ? selection.filter((x) => x !== id) : [...selection, id]);
  };

  const basculerCycle = (cycle) => {
    const libres = cycle.classes.map((c) => c.id).filter((id) => !occupation.has(id));
    if (libres.length === 0) return;
    const toutes = libres.every((id) => selection.includes(id));
    onChange(toutes ? selection.filter((id) => !libres.includes(id)) : Array.from(new Set([...selection, ...libres])));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <p className="text-xs text-slate-600">Cochez les classes soumises à ce barème. Une classe ne peut appartenir qu'à une seule fiche.</p>
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="text-slate-500">Classes sélectionnées :</span>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-[#0C447C] font-bold tabular-nums">
            {selection.length} classe{selection.length > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cycles.map((cycle) => {
          const libres = cycle.classes.filter((c) => !occupation.has(c.id));
          const toutCoche = libres.length > 0 && libres.every((c) => selection.includes(c.id));
          const partiel = !toutCoche && cycle.classes.some((c) => selection.includes(c.id));
          return (
            <div key={cycle.id} className="rounded-xl border border-slate-200/90 bg-white p-4">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-blue-50 text-[#0C447C] flex items-center justify-center"><Layers className="w-3.5 h-3.5" /></span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{cycle.nom}</h4>
                    <p className="text-[11px] text-slate-500">{cycle.description}</p>
                  </div>
                </div>
                {libres.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => basculerCycle(cycle)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${
                      toutCoche ? "bg-[#0C447C] text-white" : partiel ? "bg-blue-50 text-[#0C447C] border border-blue-200" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded flex items-center justify-center border border-current">
                      {toutCoche && <Check className="w-3 h-3 stroke-[3]" />}
                      {partiel && <span className="w-1.5 h-1.5 rounded-sm bg-current" />}
                    </span>
                    Tout le cycle
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-500 italic">Toutes assignées</span>
                )}
              </div>

              <div className="space-y-1.5">
                {cycle.classes.map((classe) => {
                  const autreFiche = occupation.get(classe.id);
                  const coche = selection.includes(classe.id);
                  if (autreFiche) {
                    return (
                      <div key={classe.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50/80 border border-slate-200/50 opacity-70 cursor-not-allowed select-none">
                        <div className="flex items-center gap-2.5">
                          <span className="w-4 h-4 rounded border border-slate-300 bg-slate-200/60 flex items-center justify-center text-slate-400 text-[10px]">—</span>
                          <span className="text-xs font-medium text-slate-500 line-through">{classe.nom}</span>
                        </div>
                        <span className="flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 truncate">
                          <Info className="w-3 h-3 shrink-0" /> Déjà dans la fiche {autreFiche}
                        </span>
                      </div>
                    );
                  }
                  return (
                    <button
                      key={classe.id}
                      type="button"
                      onClick={() => basculer(classe.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg border text-left cursor-pointer ${
                        coche ? "bg-blue-50/70 border-blue-400 text-slate-900" : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span className={`w-4 h-4 rounded flex items-center justify-center ${coche ? "bg-[#0C447C] text-white" : "border border-slate-300 bg-white"}`}>
                          {coche && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                        <span className={`text-xs ${coche ? "font-semibold" : "font-medium"}`}>{classe.nom}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 tabular-nums">{classe.nombre_eleves ?? 0} élèves</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {selection.length === 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
          Cochez au moins une classe pour définir cette fiche tarifaire.
        </div>
      )}
    </div>
  );
}
