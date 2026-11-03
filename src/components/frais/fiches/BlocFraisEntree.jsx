import { UserPlus, UserCheck } from "lucide-react";
import { formaterGNF } from "../configFrais";
import { parseGNF, afficherMontant } from "./outilsFiche";

// Frais d'entree : inscription (nouvel eleve) et reinscription (ancien eleve), payes une fois.
const CHAMP = "w-full pl-3.5 pr-16 py-2.5 text-base font-bold text-slate-900 rounded-lg border border-slate-300 focus:border-[#0C447C] focus:ring-2 focus:ring-blue-100 outline-none tabular-nums";

function CarteFrais({ id, titre, sousTitre, icone: Icone, teinte, montant, onChange, exemples }) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
      <div className="flex items-center gap-2">
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${teinte.icone}`}><Icone className="w-4 h-4" /></span>
        <div>
          <label htmlFor={id} className="text-sm font-bold text-slate-900 block cursor-pointer">{titre}</label>
          <span className="text-[11px] text-slate-500">{sousTitre}</span>
        </div>
      </div>
      <div className="mt-3 relative">
        <input id={id} type="text" inputMode="numeric" value={afficherMontant(montant)} onChange={(e) => onChange(parseGNF(e.target.value))} placeholder="0" className={CHAMP} />
        <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-bold text-slate-500">GNF</span>
      </div>
      <div className="mt-1.5 flex items-center justify-between text-xs">
        <span className="text-slate-600">Montant :</span>
        <span className={`font-bold tabular-nums ${teinte.texte}`}>{formaterGNF(montant)}</span>
      </div>
      <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] text-slate-600 uppercase font-semibold">Exemples :</span>
        {exemples.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={`text-[11px] px-2 py-0.5 rounded border cursor-pointer ${montant === p ? teinte.exemple : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}
          >
            {formaterGNF(p)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function BlocFraisEntree({ inscription, reinscription, onInscription, onReinscription }) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-600 pb-2 border-b border-slate-100">
        Payés une seule fois, à l'inscription ou à la réinscription de l'élève (encaissés en caisse le jour même).
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <CarteFrais
          id="frais-inscription"
          titre="Inscription (nouvel élève)"
          sousTitre="Première admission dans l'établissement"
          icone={UserPlus}
          teinte={{ icone: "bg-emerald-50 text-emerald-700", texte: "text-emerald-700", exemple: "bg-emerald-50 text-emerald-700 border-emerald-300 font-bold" }}
          montant={inscription}
          onChange={onInscription}
          exemples={[100000, 120000, 150000, 200000]}
        />
        <CarteFrais
          id="frais-reinscription"
          titre="Réinscription (ancien élève)"
          sousTitre="Élève déjà inscrit l'an dernier"
          icone={UserCheck}
          teinte={{ icone: "bg-blue-50 text-[#0C447C]", texte: "text-[#0C447C]", exemple: "bg-blue-50 text-[#0C447C] border-blue-300 font-bold" }}
          montant={reinscription}
          onChange={onReinscription}
          exemples={[80000, 100000, 120000, 150000]}
        />
      </div>
    </div>
  );
}
