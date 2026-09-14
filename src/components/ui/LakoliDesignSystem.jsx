import { forwardRef } from 'react';

/* ==========================================================================
   LAKOLI DESIGN SYSTEM (Bleu #2563EB + Blanc #FFFFFF + Neutrals)
   ========================================================================== */

export const LAKOLI_COLORS = {
  blue: '#2563EB',
  blueHover: '#1D4ED8',
  blueLight: '#EFF6FF',
  blueBorder: '#BFDBFE',
  white: '#FFFFFF',
  bgCanvas: '#F8FAFC',
};

// --------------------------------------------------------------------------
// 1. CARTE STATISTIQUE UNIFIÉE
// --------------------------------------------------------------------------
export function StatCard({ title, value, subtitle, icon: Icon, badge, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs transition-all ${
        onClick ? 'cursor-pointer hover:border-blue-300 hover:shadow-sm' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {value}
          </p>
        </div>
        <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0 border border-blue-100">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || badge) && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          {subtitle && <span>{subtitle}</span>}
          {badge && (
            <span className="font-semibold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 text-[11px]">
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// 2. CARTE STANDARD
// --------------------------------------------------------------------------
export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// --------------------------------------------------------------------------
// 3. BOUTONS UNIFIÉS
// --------------------------------------------------------------------------
export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  children,
  className = '',
  disabled,
  ...props
}) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-xs sm:text-sm',
    lg: 'px-5 py-3 text-sm sm:text-base font-semibold',
  }[size];

  const variantClasses = {
    primary:
      'bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl shadow-xs active:bg-blue-800',
    secondary:
      'bg-white hover:bg-blue-50/50 text-[#2563EB] border border-blue-200 rounded-xl shadow-2xs active:bg-blue-100/50',
    ghost:
      'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-xl',
  }[variant];

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none select-none ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled}
      {...props}
    >
      {Icon && <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
      <span>{children}</span>
    </button>
  );
}

// --------------------------------------------------------------------------
// 4. BADGES UNIFIÉS
// --------------------------------------------------------------------------
export function Badge({ variant = 'blue', children, className = '', icon: Icon }) {
  const variantClasses = {
    blue: 'bg-blue-50 text-[#2563EB] border border-blue-100',
    outline: 'bg-white text-[#2563EB] border border-blue-200 shadow-2xs',
    neutral: 'bg-slate-100 text-slate-600 border border-slate-200',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold select-none ${variantClasses} ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      <span>{children}</span>
    </span>
  );
}

// --------------------------------------------------------------------------
// 5. INPUT & SÉLECTEURS UNIFIÉS
// --------------------------------------------------------------------------
export const Input = forwardRef(({ className = '', ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={`w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors duration-150 ${className}`}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export const Select = forwardRef(({ className = '', children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={`bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors duration-150 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
});
Select.displayName = 'Select';

// --------------------------------------------------------------------------
// 6. EN-TÊTE DE PAGE UNIFIÉ
// --------------------------------------------------------------------------
export function PageHeader({ title, description, badge, actions }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/80">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {title}
          </h1>
          {badge && <Badge variant="blue">{badge}</Badge>}
        </div>
        {description && (
          <p className="text-xs sm:text-sm text-slate-500 max-w-3xl">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2.5 flex-wrap">{actions}</div>}
    </div>
  );
}

// --------------------------------------------------------------------------
// 7. MODALE UNIFIÉE
// --------------------------------------------------------------------------
export function Modal({ isOpen, onClose, title, description, children, footer, maxWidth = 'lg' }) {
  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div
        className={`relative bg-white rounded-2xl border border-slate-200 shadow-xl w-full ${maxWidthClasses} overflow-hidden z-10 animate-in zoom-in-95 duration-150`}
      >
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-start justify-between">
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            {description && <p className="text-xs text-slate-500">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4">{children}</div>

        {footer && (
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
