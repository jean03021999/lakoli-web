import { CheckCircle2, Clock, AlertCircle, AlertTriangle, RotateCcw } from 'lucide-react';



export const BadgeStatut = ({
  statut,
  texte,
  taille = 'md',
  avecIcone = true,
  className = '',
}) => {
  // Détermination de la configuration visuelle
  let config = {
    label: texte || 'Inconnu',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    Icone: Clock,
  };

  switch (statut) {
    case 'solde':
    case 'a_jour':
      config = {
        label: texte || (statut === 'solde' ? 'Soldé' : 'À jour'),
        bg: 'bg-emerald-50',
        text: 'text-emerald-800',
        border: 'border-emerald-200/80',
        dot: 'bg-emerald-500',
        Icone: CheckCircle2,
      };
      break;

    case 'partiel':
      config = {
        label: texte || 'Paiement partiel',
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200/80',
        dot: 'bg-amber-500',
        Icone: Clock,
      };
      break;

    case 'en_retard':
    case 'retard':
      config = {
        label: texte || 'En retard',
        bg: 'bg-rose-50',
        text: 'text-rose-800',
        border: 'border-rose-200/80',
        dot: 'bg-rose-500',
        Icone: AlertCircle,
      };
      break;

    case 'annule':
      config = {
        label: texte || 'Annulé',
        bg: 'bg-rose-100/70',
        text: 'text-rose-900',
        border: 'border-rose-300',
        dot: 'bg-rose-600',
        Icone: AlertCircle,
      };
      break;

    case 'a_echoir':
      config = {
        label: texte || 'À échoir',
        bg: 'bg-slate-100',
        text: 'text-slate-600',
        border: 'border-slate-200',
        dot: 'bg-slate-400',
        Icone: Clock,
      };
      break;

    case 'reprise':
      config = {
        label: texte || 'Reprise (antérieur)',
        bg: 'bg-purple-50',
        text: 'text-purple-800',
        border: 'border-purple-200',
        dot: 'bg-purple-600',
        Icone: RotateCcw,
      };
      break;

    case 'alerte':
      config = {
        label: texte || 'Alerte Audit',
        bg: 'bg-rose-50',
        text: 'text-rose-800 font-bold',
        border: 'border-rose-400',
        dot: 'bg-rose-600',
        Icone: AlertTriangle,
      };
      break;

    default:
      config = {
        label: texte || statut,
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-200',
        dot: 'bg-slate-400',
        Icone: Clock,
      };
  }

  const { Icone } = config;
  const sizeClasses =
    taille === 'sm'
      ? 'px-2 py-0.5 text-[11px] gap-1'
      : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border whitespace-nowrap shrink-0 ${config.bg} ${config.text} ${config.border} ${sizeClasses} ${className}`}
    >
      {avecIcone && <Icone className={taille === 'sm' ? 'w-3 h-3 shrink-0' : 'w-3.5 h-3.5 shrink-0'} />}
      <span>{config.label}</span>
    </span>
  );
};

export default BadgeStatut;
