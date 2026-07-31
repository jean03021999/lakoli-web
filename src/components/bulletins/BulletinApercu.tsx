import React from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Award, 
  Bookmark, 
  CheckCircle, 
  FileText, 
  User, 
  Building, 
  Calendar,
  Sparkles
} from 'lucide-react';
import { StudentBulletin } from '../../types';

interface BulletinApercuProps {
  bulletin: StudentBulletin;
  classe: string;
  periode: string;
  onClose: () => void;
}

export default function BulletinApercu({
  bulletin,
  classe,
  periode,
  onClose
}: BulletinApercuProps) {
  // Handlers for mock PDF download and print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-150 shadow-xs">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
          Fermer l'aperçu
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            Imprimer le bulletin
          </button>
        </div>
      </div>

      {/* Actual Guinean style Bulletin Canvas */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg p-8 max-w-4xl mx-auto space-y-8 relative overflow-hidden" id="print-area">
        
        {/* Guinean Watermark Decorative Lines */}
        <div className="absolute top-0 left-0 right-0 h-2 flex">
          <div className="flex-1 bg-red-600"></div>
          <div className="flex-1 bg-yellow-500"></div>
          <div className="flex-1 bg-emerald-600"></div>
        </div>

        {/* TOP HEADER: REPUBLIC OF GUINEA & MINISTRY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-150 pb-6 items-start">
          
          {/* Left Wing: Guinea Official Motto & Ministry */}
          <div className="text-center md:text-left space-y-1">
            <span className="block text-[11px] font-extrabold text-slate-800 uppercase tracking-wider">
              République de Guinée
            </span>
            <span className="block text-[9px] font-bold text-slate-400 uppercase italic tracking-widest">
              Travail - Justice - Solidarité
            </span>
            <span className="block text-[9px] font-bold text-slate-500 leading-tight pt-1">
              Ministère de l'Enseignement Pré-Universitaire et de l'Alphabétisation
            </span>
          </div>

          {/* Center: School Crest / Identity */}
          <div className="text-center space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="h-9 w-9 rounded-full bg-lakoli-navy text-white flex items-center justify-center mx-auto shadow-sm">
              <Building className="h-5 w-5" />
            </div>
            <span className="block text-sm font-black text-lakoli-navy tracking-tight">
              COMPLEXE SCOLAIRE LAKOLI
            </span>
            <span className="block text-[8px] font-bold text-slate-400 uppercase">
              Conakry, République de Guinée
            </span>
          </div>

          {/* Right Wing: Report Card title */}
          <div className="text-center md:text-right space-y-0.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
              Document Officiel
            </span>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
              BULLETIN DE NOTES
            </h3>
            <span className="block text-xs font-bold text-lakoli-navy">
              {periode.toUpperCase()}
            </span>
            <span className="block text-[10px] text-slate-400 font-mono">
              Année Scolaire : 2025-2026
            </span>
          </div>
        </div>

        {/* STUDENT METADATA PANEL */}
        <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <span className="block text-[9px] font-extrabold text-slate-400 uppercase">Élève</span>
            <span className="block text-sm font-black text-slate-800 uppercase leading-tight">
              {bulletin.studentNom}
            </span>
            <span className="block text-xs font-semibold text-slate-600">
              {bulletin.studentPrenom}
            </span>
          </div>

          <div className="space-y-1 border-l border-slate-200 pl-4 sm:border-l-0 sm:pl-0 md:border-l md:pl-4">
            <span className="block text-[9px] font-extrabold text-slate-400 uppercase">Matricule</span>
            <span className="block text-xs font-mono font-black text-slate-700">
              {bulletin.matricule}
            </span>
            <span className="block text-[9px] font-bold text-slate-500 uppercase bg-slate-200/50 px-1.5 py-0.5 rounded inline-block">
              Statut : Inscrit
            </span>
          </div>

          <div className="space-y-1 border-l border-slate-200 pl-4">
            <span className="block text-[9px] font-extrabold text-slate-400 uppercase">Classe</span>
            <span className="block text-xs font-black text-slate-800 bg-lakoli-navy/5 border border-lakoli-navy/10 px-2 py-0.5 rounded inline-block">
              {classe}
            </span>
            <span className="block text-[9px] font-medium text-slate-400">
              Effectif de la classe
            </span>
          </div>

          <div className="space-y-1 border-l border-slate-200 pl-4">
            <span className="block text-[9px] font-extrabold text-slate-400 uppercase">Évaluation</span>
            <span className="block text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded inline-block">
              Moyennes Périodiques
            </span>
            <span className="block text-[9px] font-medium text-slate-400">
              {new Date().toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>

        {/* SUBJECTS & GRADES TABLE */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-250 text-[10px] uppercase font-bold text-slate-500">
                <th className="py-3 px-5">Matières Enseignées</th>
                <th className="py-3 px-4 text-center w-28">Coefficient</th>
                <th className="py-3 px-4 text-center w-36">Moyenne (sur 20)</th>
                <th className="py-3 px-4 text-center w-40">Note Pondérée</th>
                <th className="py-3 px-5 text-right">Appréciations & Observations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {bulletin.grades.map((grade) => {
                const weightedNote = (grade.note * grade.coefficient).toFixed(2);
                const isPassing = grade.note >= 10;
                
                return (
                  <tr key={grade.subjectId} className="hover:bg-slate-50/50 transition-colors">
                    {/* Subject Name */}
                    <td className="py-3.5 px-5 font-bold text-slate-800">
                      {grade.subjectNom}
                    </td>

                    {/* Coefficient */}
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-600">
                      {grade.coefficient}
                    </td>

                    {/* Grade on 20 */}
                    <td className="py-3.5 px-4 text-center font-mono">
                      <span className={`font-black text-xs px-2 py-0.5 rounded ${
                        isPassing 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : 'bg-rose-50 text-rose-700'
                      }`}>
                        {grade.note.toFixed(2)}
                      </span>
                    </td>

                    {/* Weighted Note */}
                    <td className="py-3.5 px-4 text-center font-mono font-black text-slate-700 bg-slate-50/50">
                      {weightedNote}
                    </td>

                    {/* Appreciation */}
                    <td className="py-3.5 px-5 text-right font-medium text-slate-500 italic">
                      {grade.appreciation}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* BOTTOM METRICS & CALCULATIONS BOX */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          {/* Summary calculations */}
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-5 space-y-3.5">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-lakoli-navy" />
              Récapitulatif Périodique de l'élève
            </h4>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">Total des coefficients :</span>
                <span className="font-mono font-black text-slate-700 bg-slate-200/50 px-2.5 py-0.5 rounded">
                  {bulletin.totalCoefficients}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">Total des points obtenus :</span>
                <span className="font-mono font-black text-slate-700 bg-slate-200/50 px-2.5 py-0.5 rounded">
                  {bulletin.totalPoints.toFixed(2)}
                </span>
              </div>

              <div className="border-t border-slate-250 my-2 pt-2 flex justify-between items-center">
                <span className="text-xs font-black text-slate-700">MOYENNE GÉNÉRALE :</span>
                <span className={`font-mono font-black text-sm px-3 py-1 rounded-lg ${
                  bulletin.moyenneGenerale >= 10 
                    ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/10' 
                    : 'bg-rose-600 text-white shadow-xs shadow-rose-600/10'
                }`}>
                  {bulletin.moyenneGenerale.toFixed(2)} / 20
                </span>
              </div>

              <div className="flex justify-between items-center text-xs pt-1">
                <span className="text-slate-500 font-semibold">Rang général de la classe :</span>
                <span className="font-sans font-black text-lakoli-navy bg-lakoli-navy/10 border border-lakoli-navy/20 px-3 py-1 rounded-md">
                  {bulletin.rang === '1er' ? '🏆 1er' : bulletin.rang}
                </span>
              </div>
            </div>
          </div>

          {/* Academic Decisions & Standing */}
          <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
              <Award className="h-4 w-4 text-emerald-600" />
              Décision & Mentions de la Direction
            </h4>

            <div className="space-y-3">
              <div className="space-y-1">
                <span className="block text-[9px] font-extrabold text-slate-400 uppercase">Décision du conseil de classe</span>
                <span className={`inline-block text-xs font-black px-3 py-1 rounded-lg ${
                  bulletin.moyenneGenerale >= 14 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : bulletin.moyenneGenerale >= 12 
                      ? 'bg-blue-50 text-blue-800 border border-blue-200' 
                      : bulletin.moyenneGenerale >= 10 
                        ? 'bg-slate-100 text-slate-800 border border-slate-200' 
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {bulletin.decision}
                </span>
              </div>

              <div className="space-y-1">
                <span className="block text-[9px] font-extrabold text-slate-400 uppercase">Observation Générale</span>
                <p className="text-xs text-slate-600 italic">
                  {bulletin.moyenneGenerale >= 16 
                    ? "Excellent trimestre ! Félicitations du conseil de classe pour ce travail exceptionnel."
                    : bulletin.moyenneGenerale >= 14
                      ? "Très bon trimestre. Poursuivez dans cette voie de réussite."
                      : bulletin.moyenneGenerale >= 12
                        ? "Bon travail d'ensemble. Élève sérieux et appliqué."
                        : bulletin.moyenneGenerale >= 10
                          ? "Trimestre satisfaisant, mais l'élève peut encore s'améliorer en redoublant d'efforts."
                          : "Résultats insuffisants. Un redoublement d'efforts et un suivi rigoureux sont indispensables."}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* SIGNATURES SECTION */}
        <div className="pt-10 grid grid-cols-3 gap-4 text-center text-[10px] text-slate-500 font-bold border-t border-slate-150">
          <div className="space-y-12">
            <span className="uppercase block tracking-wider text-slate-400">Le Directeur des Études</span>
            <div className="font-mono text-[9px] italic text-slate-300">Signature & Cachet</div>
          </div>
          <div className="space-y-12 border-x border-slate-100">
            <span className="uppercase block tracking-wider text-slate-400">Le Titulaire de Classe</span>
            <div className="font-mono text-[9px] italic text-slate-300">Signature</div>
          </div>
          <div className="space-y-12">
            <span className="uppercase block tracking-wider text-slate-400">Le Fondateur de l'École</span>
            <div className="font-serif text-slate-600 font-black italic">S. Kouyaté</div>
          </div>
        </div>

      </div>
    </div>
  );
}
