import { FileSpreadsheet, Printer } from 'lucide-react';


export const BoutonExport = ({
  onExportExcel,
  onImprimer,
  texteExcel = 'Exporter en Excel',
  texteImprimer = 'Imprimer',
  variante = 'groupe',
  taille = 'sm',
  disabled = false,
}) => {
  const padding = taille === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';

  const declencherImpression = () => {
    if (onImprimer) {
      onImprimer();
    } else {
      window.print();
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      {(variante === 'groupe' || variante === 'excel_seul') && onExportExcel && (
        <button
          type="button"
          onClick={onExportExcel}
          disabled={disabled}
          className={`inline-flex items-center gap-1.5 font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-emerald-700 hover:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${padding}`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
          <span>{texteExcel}</span>
        </button>
      )}

      {(variante === 'groupe' || variante === 'imprimer_seul') && (
        <button
          type="button"
          onClick={declencherImpression}
          disabled={disabled}
          className={`inline-flex items-center gap-1.5 font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-blue-700 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${padding}`}
        >
          <Printer className="w-3.5 h-3.5 text-slate-500" />
          <span>{texteImprimer}</span>
        </button>
      )}
    </div>
  );
};

export default BoutonExport;
