import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Info, 
  DollarSign, 
  Calendar, 
  Layers, 
  HelpCircle,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { AVAILABLE_CLASSES, CLASSES_BY_LEVEL } from '../../mockData';

export type FeeType = 'Scolarité' | 'Cantine' | 'Transport' | 'Tenues & Assurance';

export interface FeeInstallment {
  id: string;
  libelle: string;
  montant: number; // in GNF
  dateLimite: string; // YYYY-MM-DD
}

export interface ClassFeeGrid {
  classe: string;
  typeFrais: FeeType;
  montantTotal: number;
  installments: FeeInstallment[];
}

// Default tariff grids for the entire school
export const DEFAULT_FEE_GRIDS: ClassFeeGrid[] = [];

// Populate default grids
AVAILABLE_CLASSES.forEach(classe => {
  const isLycee = classe.includes('11ème') || classe.includes('12ème') || classe.includes('Tle');
  
  // 1. Scolarité
  const scolariteTotal = isLycee ? 2500000 : 2000000;
  DEFAULT_FEE_GRIDS.push({
    classe,
    typeFrais: 'Scolarité',
    montantTotal: scolariteTotal,
    installments: [
      {
        id: `${classe}-scol-1`,
        libelle: "Frais d'inscription Scolarité",
        montant: isLycee ? 500000 : 400000,
        dateLimite: '2025-09-15'
      },
      {
        id: `${classe}-scol-2`,
        libelle: '1ère Échéance Scolarité',
        montant: isLycee ? 1000000 : 800000,
        dateLimite: '2025-11-15'
      },
      {
        id: `${classe}-scol-3`,
        libelle: '2ème Échéance Scolarité',
        montant: isLycee ? 1000000 : 800000,
        dateLimite: '2026-02-15'
      }
    ]
  });

  // 2. Cantine
  const cantineTotal = isLycee ? 1200000 : 900000;
  DEFAULT_FEE_GRIDS.push({
    classe,
    typeFrais: 'Cantine',
    montantTotal: cantineTotal,
    installments: [
      {
        id: `${classe}-cant-1`,
        libelle: '1er Trimestre Cantine',
        montant: isLycee ? 400000 : 300000,
        dateLimite: '2025-10-01'
      },
      {
        id: `${classe}-cant-2`,
        libelle: '2ème Trimestre Cantine',
        montant: isLycee ? 400000 : 300000,
        dateLimite: '2026-01-01'
      },
      {
        id: `${classe}-cant-3`,
        libelle: '3ème Trimestre Cantine',
        montant: isLycee ? 400000 : 300000,
        dateLimite: '2026-04-01'
      }
    ]
  });

  // 3. Transport
  const transportTotal = isLycee ? 1500000 : 1200000;
  DEFAULT_FEE_GRIDS.push({
    classe,
    typeFrais: 'Transport',
    montantTotal: transportTotal,
    installments: [
      {
        id: `${classe}-trans-1`,
        libelle: '1ère Échéance Transport',
        montant: isLycee ? 500000 : 400000,
        dateLimite: '2025-10-05'
      },
      {
        id: `${classe}-trans-2`,
        libelle: '2ème Échéance Transport',
        montant: isLycee ? 500000 : 400000,
        dateLimite: '2026-01-05'
      },
      {
        id: `${classe}-trans-3`,
        libelle: '3ème Échéance Transport',
        montant: isLycee ? 500000 : 400000,
        dateLimite: '2026-04-05'
      }
    ]
  });

  // 4. Tenues & Assurance
  DEFAULT_FEE_GRIDS.push({
    classe,
    typeFrais: 'Tenues & Assurance',
    montantTotal: 350000,
    installments: [
      {
        id: `${classe}-tenue-1`,
        libelle: 'Pack Uniformes & Assurance Annuelle',
        montant: 350000,
        dateLimite: '2025-09-30'
      }
    ]
  });
});

const STORAGE_KEY_GRIDS = 'lakoli_frais_grilles_v1';

interface GrillesTarifairesProps {
  role: 'COMPTABLE' | 'DIRECTEUR';
}

export default function GrillesTarifaires({ role }: GrillesTarifairesProps) {
  const [selectedClass, setSelectedClass] = useState<string>('10ème Année');
  const [selectedFeeType, setSelectedFeeType] = useState<FeeType>('Scolarité');

  // Load grids from localStorage or fallback
  const [grids, setGrids] = useState<ClassFeeGrid[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_GRIDS);
    return saved ? JSON.parse(saved) : DEFAULT_FEE_GRIDS;
  });

  // Save to localStorage when changed
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_GRIDS, JSON.stringify(grids));
  }, [grids]);

  // Find active grid
  const activeGrid = grids.find(
    g => g.classe === selectedClass && g.typeFrais === selectedFeeType
  ) || {
    classe: selectedClass,
    typeFrais: selectedFeeType,
    montantTotal: 0,
    installments: []
  };

  // State for creating/editing installments
  const [isAddingInstallment, setIsAddingInstallment] = useState<boolean>(false);
  const [newLabel, setNewLabel] = useState<string>('');
  const [newAmount, setNewAmount] = useState<number>(0);
  const [newDueDate, setNewDueDate] = useState<string>('2025-10-15');

  // Helper formatting GNF
  const formatGNF = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'GNF', maximumFractionDigits: 0 })
      .format(amount)
      .replace('GNF', 'FG');
  };

  // Add a new installment
  const handleAddInstallment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel || newAmount <= 0) return;

    const newInst: FeeInstallment = {
      id: `inst-${Date.now()}`,
      libelle: newLabel,
      montant: newAmount,
      dateLimite: newDueDate
    };

    const updatedGrids = grids.map(g => {
      if (g.classe === selectedClass && g.typeFrais === selectedFeeType) {
        const updatedInsts = [...g.installments, newInst];
        const newTotal = updatedInsts.reduce((sum, inst) => sum + inst.montant, 0);
        return {
          ...g,
          installments: updatedInsts,
          montantTotal: newTotal
        };
      }
      return g;
    });

    setGrids(updatedGrids);
    setNewLabel('');
    setNewAmount(0);
    setIsAddingInstallment(false);
  };

  // Delete an installment
  const handleDeleteInstallment = (instId: string) => {
    if (role !== 'COMPTABLE' && role !== 'DIRECTEUR') return;
    
    const updatedGrids = grids.map(g => {
      if (g.classe === selectedClass && g.typeFrais === selectedFeeType) {
        const updatedInsts = g.installments.filter(inst => inst.id !== instId);
        const newTotal = updatedInsts.reduce((sum, inst) => sum + inst.montant, 0);
        return {
          ...g,
          installments: updatedInsts,
          montantTotal: newTotal
        };
      }
      return g;
    });
    setGrids(updatedGrids);
  };

  // Helper to change total amount directly (applies proportion to installments)
  const handleUpdateTotalAmount = (amountStr: string) => {
    const nextAmount = parseInt(amountStr.replace(/\D/g, '')) || 0;
    if (nextAmount <= 0) return;

    const updatedGrids = grids.map(g => {
      if (g.classe === selectedClass && g.typeFrais === selectedFeeType) {
        const currentTotal = g.montantTotal || 1;
        const ratio = nextAmount / currentTotal;

        // Scale each installment proportionally
        const scaledInsts = g.installments.map(inst => ({
          ...inst,
          montant: Math.round((inst.montant * ratio) / 5000) * 5000 // Round to nearest 5,000 FG for convenience
        }));

        const finalTotal = scaledInsts.reduce((sum, i) => sum + i.montant, 0);

        return {
          ...g,
          montantTotal: finalTotal,
          installments: scaledInsts
        };
      }
      return g;
    });
    setGrids(updatedGrids);
  };

  // Reset to default configuration
  const handleResetDefaults = () => {
    if (window.confirm('Voulez-vous réinitialiser toutes les grilles tarifaires aux valeurs par défaut ?')) {
      setGrids(DEFAULT_FEE_GRIDS);
    }
  };

  const installmentsSum = activeGrid.installments.reduce((s, i) => s + i.montant, 0);
  const isOutOfSync = installmentsSum !== activeGrid.montantTotal;

  return (
    <div className="space-y-6">
      
      {/* Overview & Information Card */}
      <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0f172a] text-[#f8fafc]">
            Comptabilité & Grilles
          </span>
          <h2 className="text-xl font-bold text-slate-800">Paramétrage des Grilles Tarifaires</h2>
          <p className="text-xs text-slate-500 max-w-xl">
            Définissez le montant total par classe et le calendrier précis des échéances de paiement pour chaque type de frais.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          {role === 'COMPTABLE' || role === 'DIRECTEUR' ? (
            <button
              onClick={handleResetDefaults}
              className="px-3.5 py-2 text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-xl transition-all cursor-pointer shadow-3xs"
            >
              Réinitialiser les grilles
            </button>
          ) : null}
        </div>
      </div>

      {/* Grid Selection Filters */}
      <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1">
            <Layers className="h-3.5 w-3.5 text-lakoli-navy" />
            Sélectionner la classe d'étude
          </label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-1 focus:ring-lakoli-navy outline-none font-bold text-slate-700"
          >
            {CLASSES_BY_LEVEL.map(group => (
              <optgroup key={group.level} label={group.label}>
                {group.classes.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5 text-lakoli-navy" />
            Type de frais scolaire
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['Scolarité', 'Cantine', 'Transport', 'Tenues & Assurance'] as FeeType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedFeeType(type)}
                className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition-all truncate cursor-pointer ${
                  selectedFeeType === type
                    ? 'bg-lakoli-navy text-white border-lakoli-navy shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Tariff Grid Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Summary Card */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-150 p-6 shadow-xs space-y-6">
          <div className="space-y-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-lakoli-navy" />
              Récapitulatif Tarifaire
            </h3>
            <div className="border border-slate-100 p-4 rounded-xl bg-slate-50/50 space-y-3">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Classe</span>
                <span className="font-extrabold text-sm text-slate-800">{selectedClass}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Frais</span>
                <span className="font-extrabold text-sm text-lakoli-navy">{selectedFeeType}</span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Montant Total Exigible</span>
                {role === 'COMPTABLE' || role === 'DIRECTEUR' ? (
                  <div className="flex items-center gap-1.5 mt-1">
                    <input
                      type="text"
                      value={activeGrid.montantTotal}
                      onChange={(e) => handleUpdateTotalAmount(e.target.value)}
                      className="font-mono font-black text-lg text-emerald-700 bg-white border border-slate-200 rounded-lg px-2 py-1 w-full"
                    />
                    <span className="font-extrabold text-xs text-slate-500">FG</span>
                  </div>
                ) : (
                  <span className="font-mono font-black text-lg text-emerald-700">
                    {formatGNF(activeGrid.montantTotal)}
                  </span>
                )}
                <span className="block text-[9px] text-slate-400 font-semibold mt-1">
                  (Modifiable par le service de comptabilité)
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50/70 border border-blue-150 p-4 rounded-xl space-y-2">
            <div className="flex gap-2 items-start text-blue-800">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <span className="font-bold">Info Échéances : </span>
                La somme de toutes les échéances doit correspondre au montant total défini ci-dessus.
              </div>
            </div>
            {isOutOfSync && (
              <div className="flex gap-2 items-start text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-100">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-amber-500" />
                <div className="text-[10px] leading-tight">
                  <span className="font-bold">Alerte : </span>
                  Somme échéances ({formatGNF(installmentsSum)}) différente du montant total exigible ({formatGNF(activeGrid.montantTotal)}).
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Installments (Échéances) List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-150 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">
                Échéancier de Facturation
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold">
                {activeGrid.installments.length} échéance(s) configurée(s) pour cette grille.
              </p>
            </div>
            {(role === 'COMPTABLE' || role === 'DIRECTEUR') && !isAddingInstallment && (
              <button
                onClick={() => setIsAddingInstallment(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-lakoli-navy hover:bg-[#062f59] rounded-lg cursor-pointer transition-colors shadow-3xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Ajouter une échéance
              </button>
            )}
          </div>

          {/* Add Installment Form */}
          {isAddingInstallment && (
            <form onSubmit={handleAddInstallment} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 animate-fadeIn">
              <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                <h4 className="text-[10px] font-extrabold text-slate-600 uppercase">Nouvelle Échéance</h4>
                <button 
                  type="button" 
                  onClick={() => setIsAddingInstallment(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Libellé</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: 1ère Échéance"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-lakoli-navy outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Montant (FG)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Montant en GNF"
                    value={newAmount || ''}
                    onChange={(e) => setNewAmount(parseInt(e.target.value) || 0)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Date limite de paiement</label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingInstallment(false)}
                  className="px-3 py-1.5 text-[11px] font-bold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-[11px] font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 cursor-pointer inline-flex items-center gap-1"
                >
                  <Check className="h-3.5 w-3.5" />
                  Valider l'échéance
                </button>
              </div>
            </form>
          )}

          {/* Installments Table */}
          {activeGrid.installments.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 border border-slate-100 rounded-xl">
              <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Aucune échéance de facturation configurée pour ce type de frais.</p>
            </div>
          ) : (
            <div className="border border-slate-150 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-bold text-slate-400 uppercase">
                    <th className="py-3 px-4">Échéance / Libellé</th>
                    <th className="py-3 px-4">Date Limite de Paiement</th>
                    <th className="py-3 px-4 text-right">Montant</th>
                    {role === 'COMPTABLE' || role === 'DIRECTEUR' ? (
                      <th className="py-3 px-4 text-center w-16">Actions</th>
                    ) : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {activeGrid.installments.map((inst, index) => (
                    <tr key={inst.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="h-5 w-5 bg-slate-100 text-[10px] font-black text-slate-500 rounded-md flex items-center justify-center font-mono shrink-0">
                            {index + 1}
                          </span>
                          <span className="font-bold text-slate-800">{inst.libelle}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono">
                        {new Date(inst.dateLimite).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-slate-700 bg-slate-50/20">
                        {formatGNF(inst.montant)}
                      </td>
                      {role === 'COMPTABLE' || role === 'DIRECTEUR' ? (
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteInstallment(inst.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Supprimer cette échéance"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                  <tr className="bg-slate-100/50 font-black text-slate-800">
                    <td className="py-3.5 px-4 uppercase text-[10px] text-slate-400 tracking-wider">
                      Somme des Échéances
                    </td>
                    <td className="py-3.5 px-4"></td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-800 text-xs">
                      {formatGNF(installmentsSum)}
                    </td>
                    {role === 'COMPTABLE' || role === 'DIRECTEUR' ? (
                      <td className="py-3.5 px-4"></td>
                    ) : null}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
