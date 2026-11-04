// Carte d'indicateur de l'Espace Fondateur (design AI Studio) : montants en Inter, comme le tableau
// de bord comptable.
import { TrendingUp, TrendingDown } from 'lucide-react';

// Degrades et ombres assorties de chaque theme.
const THEMES = {
  emeraude: { gradient: 'linear-gradient(135deg, #047857 0%, #10B981 100%)', shadow: 'shadow-lg shadow-emerald-900/25', hoverShadow: 'hover:shadow-xl hover:shadow-emerald-900/35' },
  ambre: { gradient: 'linear-gradient(135deg, #B45309 0%, #F59E0B 100%)', shadow: 'shadow-lg shadow-amber-900/25', hoverShadow: 'hover:shadow-xl hover:shadow-amber-900/35' },
  bleu: { gradient: 'linear-gradient(135deg, #0C447C 0%, #2563EB 100%)', shadow: 'shadow-lg shadow-blue-950/30', hoverShadow: 'hover:shadow-xl hover:shadow-blue-950/40' },
  violet: { gradient: 'linear-gradient(135deg, #5B21B6 0%, #8B5CF6 100%)', shadow: 'shadow-lg shadow-purple-950/25', hoverShadow: 'hover:shadow-xl hover:shadow-purple-950/35' },
  turquoise: { gradient: 'linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)', shadow: 'shadow-lg shadow-teal-950/25', hoverShadow: 'hover:shadow-xl hover:shadow-teal-950/35' },
  rose: { gradient: 'linear-gradient(135deg, #BE123C 0%, #F43F5E 100%)', shadow: 'shadow-lg shadow-rose-950/25', hoverShadow: 'hover:shadow-xl hover:shadow-rose-950/35' },
  blanc: { gradient: '#ffffff', shadow: 'shadow-xs', hoverShadow: 'hover:shadow-md' },
};

export const StatCard = ({
  titre,
  valeur,
  sousTitre,
  evolution,
  tendance = 'hausse',
  indication,
  icone: Icone,
  couleurIcone,
  progressionPourcentage,
  estCliquable = false,
  onClick,
  badgeTexte,
  theme = 'blanc',
}) => {
  const estCarteColoree = theme !== 'blanc';
  const conf = THEMES[theme];

  const CardWrapper = estCliquable ? 'button' : 'div';

  return (
    <CardWrapper
      type={estCliquable ? 'button' : undefined}
      onClick={estCliquable ? onClick : undefined}
      style={estCarteColoree ? { background: conf.gradient } : undefined}
      className={`rounded-2xl p-5 text-left w-full relative overflow-hidden flex flex-col justify-between transition-all duration-300 ease-out ${
        conf.shadow
      } ${
        estCarteColoree
          ? `text-white border-none hover:-translate-y-1 ${conf.hoverShadow}`
          : 'bg-white border border-slate-200/80 text-slate-900 hover:border-blue-300'
      } ${
        estCliquable
          ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/40'
          : 'cursor-default'
      }`}
    >
      {/* Motifs décoratifs d'arrière-plan pour les cartes colorées (cercle flou et anneau géométrique) */}
      {estCarteColoree && (
        <>
          {/* Grand cercle flou dans le coin inférieur droit */}
          <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/15 blur-xl pointer-events-none" />
          {/* Cercle géométrique fin dans le coin supérieur gauche */}
          <div className="absolute -left-8 -top-8 w-28 h-28 rounded-full border border-white/10 pointer-events-none" />
          {/* Halo radial discret d'accentuation lumineuse */}
          <div className="absolute right-0 top-0 w-36 h-36 bg-radial from-white/15 via-white/5 to-transparent pointer-events-none" />
        </>
      )}

      {/* Contenu principal */}
      <div className="relative z-10">
        {/* Ligne d'en-tête : Libellé plus petit au-dessus + Icône dans cercle blanc semi-transparent en haut à droite */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <span
            className={`text-xs font-semibold tracking-wide uppercase ${
              estCarteColoree ? 'text-white/85' : 'text-slate-500'
            }`}
          >
            {titre}
          </span>

          {Icone && (
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-inner ${
                estCarteColoree
                  ? 'bg-white/20 text-white backdrop-blur-xs border border-white/25'
                  : couleurIcone || 'text-blue-700 bg-blue-50'
              }`}
            >
              <Icone className="w-5 h-5" />
            </div>
          )}
        </div>

        {/* Chiffre principal bien grand et lisible */}
        <div className="flex items-baseline gap-2 mt-0.5">
          <span
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums leading-none ${
              estCarteColoree ? 'text-white' : 'text-slate-900'
            }`}
          >
            {valeur}
          </span>

          {badgeTexte && (
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs ${
                estCarteColoree
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {badgeTexte}
            </span>
          )}
        </div>

        {/* Sous-titre descriptif */}
        {sousTitre && (
          <p
            className={`text-xs mt-1.5 leading-relaxed ${
              estCarteColoree ? 'text-white/80' : 'text-slate-500'
            }`}
          >
            {sousTitre}
          </p>
        )}
      </div>

      {/* Barre de progression pour le Taux de recouvrement (en blanc semi-transparent) */}
      {progressionPourcentage !== undefined && (
        <div className="relative z-10 mt-4 pt-3 border-t border-white/20">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className={estCarteColoree ? 'text-white/85 font-medium' : 'text-slate-500'}>
              Progression
            </span>
            <span className="font-extrabold tabular-nums text-white">
              {progressionPourcentage}%
            </span>
          </div>
          {/* Barre de progression en blanc semi-transparent */}
          <div className="w-full h-2 bg-white/25 rounded-full overflow-hidden backdrop-blur-xs">
            <div
              className="h-full bg-white rounded-full shadow-sm transition-all duration-700 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progressionPourcentage))}%` }}
            />
          </div>
        </div>
      )}

      {/* Petite ligne d'évolution en dessous (ex. « +12 % par rapport au mois dernier ») */}
      {evolution && (
        <div
          className={`relative z-10 mt-3 pt-2 text-[11px] font-semibold flex items-center justify-between border-t ${
            estCarteColoree ? 'border-white/15 text-white/90' : 'border-slate-100 text-slate-500'
          }`}
        >
          <div className="flex items-center gap-1.5">
            {tendance === 'hausse' ? (
              <TrendingUp className="w-3.5 h-3.5 text-white" />
            ) : tendance === 'baisse' ? (
              <TrendingDown className="w-3.5 h-3.5 text-white" />
            ) : null}
            <span>{evolution}</span>
          </div>

          {estCliquable && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">
              Consulter →
            </span>
          )}
        </div>
      )}

      {/* Indication complémentaire si pas d'évolution */}
      {!evolution && indication && !progressionPourcentage && (
        <div
          className={`relative z-10 mt-3 pt-2 text-[11px] font-medium border-t flex items-center justify-between ${
            estCarteColoree ? 'border-white/15 text-white/80' : 'border-slate-100 text-slate-400'
          }`}
        >
          <span>{indication}</span>
          {estCliquable && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">
              Consulter →
            </span>
          )}
        </div>
      )}
    </CardWrapper>
  );
};

export default StatCard;
