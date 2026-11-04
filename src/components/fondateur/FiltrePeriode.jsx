import { Calendar } from 'lucide-react';



export const FiltrePeriode = ({
  valeur,
  onChange,
  variante = 'pilules',
  className = '',
}) => {
  const options = [
    { id: 'aujourdhui', label: "Aujourd'hui" },
    { id: 'cette_semaine', label: 'Cette semaine' },
    { id: 'ce_mois', label: 'Ce mois' },
    { id: 'toute_annee', label: "Toute l'année" },
  ];

  if (variante === 'select') {
    return (
      <div className={`relative inline-block ${className}`}>
        <select
          value={valeur}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none bg-white border border-slate-300 text-slate-800 text-xs font-medium rounded-lg pl-8 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-xs"
        >
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
        <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center p-0.5 bg-slate-100/90 rounded-lg border border-slate-200/80 shadow-xs ${className}`}
    >
      {options.map((opt) => {
        const estActif = valeur === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
              estActif
                ? 'bg-white text-[#0C447C] shadow-xs border border-slate-200/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

export default FiltrePeriode;
