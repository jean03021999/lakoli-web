import { useState } from "react";
import { Check, Loader2, Lock } from "lucide-react";
import { BLEU } from "./outils";

// Composants communs du module Parametres.

export function Carte({ icone: Icone, titre, description, action, children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-100 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center bg-[#0C447C]/10 text-[#0C447C]">
            <Icone className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900">{titre}</h2>
            {description && <p className="text-xs text-slate-500">{description}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}

export function Champ({ libelle, requis, aide, children, className = "" }) {
  return (
    <div className={className}>
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
        {libelle} {requis && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {aide && <p className="text-[11px] text-slate-400 mt-1">{aide}</p>}
    </div>
  );
}

// Champ precede d'une icone (telephone, e-mail...).
export function AvecIcone({ icone: Icone, children }) {
  return (
    <div className="relative">
      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
        <Icone className="w-4 h-4" />
      </span>
      {children}
    </div>
  );
}

export function Interrupteur({ actif, onChange, libelle, description, desactive = false }) {
  return (
    <div
      className={`flex items-center justify-between gap-4 py-3 select-none ${desactive ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      onClick={() => !desactive && onChange(!actif)}
    >
      {(libelle || description) && (
        <div className="flex-1">
          {libelle && <p className="text-sm font-semibold text-slate-800 leading-tight">{libelle}</p>}
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={actif}
        disabled={desactive}
        onClick={(e) => {
          e.stopPropagation();
          if (!desactive) onChange(!actif);
        }}
        className="relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed"
        style={{ backgroundColor: actif ? BLEU : "#cbd5e1" }}
      >
        <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transition duration-200 ${actif ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

// Bouton d'enregistrement a trois etats. `onEnregistrer` rejette en cas d'echec (etat remis a zero).
export function BoutonEnregistrer({ libelle, libelleOk = "Modifications enregistrées", onEnregistrer, desactive = false }) {
  const [etat, setEtat] = useState("repos");
  const cliquer = async () => {
    if (etat === "envoi" || desactive) return;
    setEtat("envoi");
    try {
      await onEnregistrer();
      setEtat("ok");
      setTimeout(() => setEtat("repos"), 2500);
    } catch {
      setEtat("repos");
    }
  };
  return (
    <button
      type="button"
      onClick={cliquer}
      disabled={desactive || etat === "envoi"}
      style={{ backgroundColor: etat === "ok" ? "#10b981" : BLEU }}
      className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white rounded-xl shadow-md transition-all duration-300 hover:shadow-lg hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
    >
      {etat === "envoi" && <Loader2 className="w-4 h-4 animate-spin" />}
      {etat === "ok" && <Check className="w-4 h-4" />}
      {etat === "envoi" ? "Enregistrement en cours..." : etat === "ok" ? libelleOk : libelle}
    </button>
  );
}

export function BandeauLectureSeule({ children }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
      <Lock className="w-4 h-4 shrink-0 mt-0.5" />
      <p>{children}</p>
    </div>
  );
}
