import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';



export function TableauTriable({
  colonnes,
  donnees,
  cleId,
  triInitialCle,
  triInitialDirection = 'asc',
  selectionnable = false,
  selectionsIds = [],
  onChangementSelection,
  surClicLigne,
  messageVide = 'Aucune donnée disponible',
  sousTitreVide = 'Modifiez vos filtres de recherche pour afficher des résultats.',
  lignePiedDePage,
  classeLigne,
  // Longues listes (journal de caisse) : affichage par tranches.
  parTranche = 50,
}) {
  const [cleTri, setCleTri] = useState(triInitialCle);
  const [directionTri, setDirectionTri] = useState(triInitialDirection)
  const [nombreAffiche, setNombreAffiche] = useState(parTranche);

  const obtenirId = (ligne, index) => {
    if (typeof cleId === 'function') return cleId(ligne);
    if (cleId && ligne[cleId] !== undefined) return String(ligne[cleId]);
    return String(ligne.id || ligne.matricule || index);
  };

  const gererClicEnTete = (colonne) => {
    if (colonne.triable === false) return;
    if (cleTri === colonne.cle) {
      setDirectionTri(directionTri === 'asc' ? 'desc' : 'asc');
    } else {
      setCleTri(colonne.cle);
      setDirectionTri('asc');
    }
  };

  const donneesTriees = useMemo(() => {
    if (!cleTri) return donnees;

    return [...donnees].sort((a, b) => {
      const valA = a[cleTri];
      const valB = b[cleTri];

      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return directionTri === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return directionTri === 'asc' ? strA.localeCompare(strB, 'fr') : strB.localeCompare(strA, 'fr');
    });
  }, [donnees, cleTri, directionTri]);

  // Gestion de la sélection globale
  const tousSelectionnes =
    donnees.length > 0 &&
    donnees.every((ligne, idx) => selectionsIds.includes(obtenirId(ligne, idx)));

  const basculerTous = () => {
    if (!onChangementSelection) return;
    if (tousSelectionnes) {
      onChangementSelection([]);
    } else {
      onChangementSelection(donnees.map((l, i) => obtenirId(l, i)));
    }
  };

  const basculerLigne = (id, e) => {
    e.stopPropagation();
    if (!onChangementSelection) return;
    if (selectionsIds.includes(id)) {
      onChangementSelection(selectionsIds.filter((item) => item !== id));
    } else {
      onChangementSelection([...selectionsIds, id]);
    }
  };

  const getAlignClass = (align) => {
    if (align === 'droite') return 'text-right justify-end';
    if (align === 'centre') return 'text-center justify-center';
    return 'text-left justify-start';
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
            {selectionnable && (
              <th className="w-10 px-4 py-3.5 text-center">
                <input
                  type="checkbox"
                  aria-label="Sélectionner tous les éléments"
                  checked={tousSelectionnes}
                  onChange={basculerTous}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500/30 border-slate-300 cursor-pointer"
                />
              </th>
            )}
            {colonnes.map((col) => {
              const estTrie = cleTri === col.cle;
              const estTriable = col.triable !== false;

              return (
                <th
                  key={col.cle}
                  style={col.largeur ? { width: col.largeur } : undefined}
                  className={`px-4 py-3.5 select-none ${
                    estTriable ? 'cursor-pointer hover:bg-slate-100 transition-colors' : ''
                  }`}
                  onClick={() => estTriable && gererClicEnTete(col)}
                >
                  <div className={`flex items-center gap-1.5 ${getAlignClass(col.alignement)}`}>
                    <span>{col.enTete}</span>
                    {estTriable && (
                      <span className="shrink-0 text-slate-400">
                        {estTrie ? (
                          directionTri === 'asc' ? (
                            <ChevronUp className="w-3.5 h-3.5 text-blue-600" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {donneesTriees.length === 0 ? (
            <tr>
              <td
                colSpan={colonnes.length + (selectionnable ? 1 : 0)}
                className="py-12 text-center text-slate-500 bg-slate-50/30"
              >
                <p className="font-semibold text-slate-700 text-sm">{messageVide}</p>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">{sousTitreVide}</p>
              </td>
            </tr>
          ) : (
            donneesTriees.slice(0, nombreAffiche).map((ligne, index) => {
              const id = obtenirId(ligne, index);
              const estSelectionne = selectionsIds.includes(id);
              const classeAdditionnelle = classeLigne ? classeLigne(ligne) : '';

              return (
                <tr
                  key={id}
                  onClick={() => surClicLigne && surClicLigne(ligne)}
                  className={`transition-colors ${
                    surClicLigne ? 'cursor-pointer hover:bg-slate-50/90' : 'hover:bg-slate-50/50'
                  } ${estSelectionne ? 'bg-blue-50/40' : ''} ${classeAdditionnelle}`}
                >
                  {selectionnable && (
                    <td className="w-10 px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={estSelectionne}
                        onChange={(e) => basculerLigne(id, e)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500/30 border-slate-300 cursor-pointer"
                      />
                    </td>
                  )}
                  {colonnes.map((col) => {
                    const contenu = col.render
                      ? col.render(ligne, index)
                      : ligne[col.cle] !== undefined
                      ? String(ligne[col.cle])
                      : '-';

                    return (
                      <td
                        key={col.cle}
                        className={`px-4 py-3 ${
                          col.alignement === 'droite'
                            ? 'text-right'
                            : col.alignement === 'centre'
                            ? 'text-center'
                            : 'text-left'
                        }`}
                      >
                        {contenu}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
        {lignePiedDePage && (
          <tfoot>
            {lignePiedDePage}
          </tfoot>
        )}
      </table>
      {donneesTriees.length > nombreAffiche && (
        <div className="p-3 text-center border-t border-slate-100">
          <button
            type="button"
            onClick={() => setNombreAffiche((n) => n + parTranche)}
            className="px-4 py-1.5 text-xs font-semibold text-[#0C447C] bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer"
          >
            Afficher plus ({donneesTriees.length - nombreAffiche} restants)
          </button>
        </div>
      )}
    </div>
  );
}

export default TableauTriable;
