import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Check, 
  KeyRound,
  Sparkles
} from 'lucide-react';
import { UserRole } from '../../types';

interface ParametresCompteProps {
  role: UserRole;
}

export default function ParametresCompte({ role }: ParametresCompteProps) {
  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Visibility toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Status message
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'Aucun', color: 'bg-slate-200' };
    
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    switch (score) {
      case 1:
        return { score: 1, label: 'Faible', color: 'bg-rose-500' };
      case 2:
        return { score: 2, label: 'Moyen', color: 'bg-amber-500' };
      case 3:
        return { score: 3, label: 'Fort', color: 'bg-blue-500' };
      case 4:
        return { score: 4, label: 'Très fort', color: 'bg-emerald-500' };
      default:
        return { score: 0, label: 'Très faible', color: 'bg-rose-400' };
    }
  };

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (!currentPassword) {
      setStatus({ type: 'error', text: 'Veuillez saisir votre mot de passe actuel.' });
      return;
    }

    if (newPassword.length < 8) {
      setStatus({ type: 'error', text: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', text: 'Le nouveau mot de passe et la confirmation ne correspondent pas.' });
      return;
    }

    // Success simulation
    setStatus({ 
      type: 'success', 
      text: 'Votre mot de passe a été mis à jour avec succès. Vos modifications sont enregistrées.' 
    });

    // Reset inputs
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const getRoleLabel = (r: UserRole) => {
    switch (r) {
      case 'COMPTABLE': return 'Comptable Principal';
      case 'DIRECTEUR': return 'Directeur d\'Établissement';
      case 'FONDATEUR': return 'Fondateur & Promoteur Général';
      default: return r;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-slate-150 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-lakoli-navy dark:text-blue-400" />
            Paramètres du Compte
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Gérez vos informations personnelles et la sécurité de votre compte LAKOLI.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
          <Shield className="h-3.5 w-3.5 text-emerald-500" />
          Compte Sécurisé SSL
        </div>
      </div>

      {/* Section 1: Account Information */}
      <div className="bg-white dark:bg-[#1F2937] rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 bg-lakoli-navy/10 text-lakoli-navy dark:text-blue-400 rounded-xl">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white">Informations du compte</h3>
            <p className="text-[11px] text-slate-400">Coordonnées associées à votre profil utilisateur LAKOLI.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Nom complet */}
          <div className="space-y-1">
            <label className="font-bold text-slate-500 dark:text-slate-400 block flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-slate-400" /> Nom & Prénom
            </label>
            <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-xl font-extrabold text-slate-800 dark:text-slate-200">
              Jean Guilavogui
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="font-bold text-slate-500 dark:text-slate-400 block flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-slate-400" /> Adresse Email
            </label>
            <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-xl font-extrabold text-slate-800 dark:text-slate-200">
              guilavoguijean525@gmail.com
            </div>
          </div>

          {/* Téléphone */}
          <div className="space-y-1">
            <label className="font-bold text-slate-500 dark:text-slate-400 block flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-slate-400" /> Numéro de Téléphone
            </label>
            <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-xl font-extrabold text-slate-800 dark:text-slate-200">
              +224 620 12 34 56
            </div>
          </div>

          {/* Rôle Actif */}
          <div className="space-y-1">
            <label className="font-bold text-slate-500 dark:text-slate-400 block flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-slate-400" /> Rôle Utilisateur Actif
            </label>
            <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-xl font-extrabold text-lakoli-navy dark:text-blue-400 flex items-center justify-between">
              <span>{getRoleLabel(role)}</span>
              <span className="text-[9px] uppercase px-2 py-0.5 bg-lakoli-navy/10 text-lakoli-navy dark:bg-blue-500/20 dark:text-blue-300 rounded-full font-bold">
                {role}
              </span>
            </div>
          </div>

          {/* Établissement Rattaché */}
          <div className="md:col-span-2 space-y-1">
            <label className="font-bold text-slate-500 dark:text-slate-400 block flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-slate-400" /> Établissement Principale
            </label>
            <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-xl font-extrabold text-slate-800 dark:text-slate-200">
              Complexe Scolaire LAKOLI Matoto • Conakry, République de Guinée
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Change Password */}
      <div className="bg-white dark:bg-[#1F2937] rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white">Changer le mot de passe</h3>
            <p className="text-[11px] text-slate-400">Renforcez la sécurité d'accès à votre portail LAKOLI.</p>
          </div>
        </div>

        {/* Status notification banner */}
        {status && (
          <div className={`p-4 rounded-xl text-xs font-bold flex items-start gap-3 transition-all ${
            status.type === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
              : 'bg-rose-50 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
          }`}>
            {status.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <div className="flex-1">{status.text}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
          
          {/* Mot de passe actuel */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Mot de passe actuel <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-lakoli-navy outline-none text-slate-800 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Nouveau mot de passe */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Nouveau mot de passe <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ex: Lakoli2026@Secure"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-lakoli-navy outline-none text-slate-800 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Password strength bar indicator */}
            {newPassword && (
              <div className="pt-2 space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-slate-400">Force du mot de passe :</span>
                  <span className={
                    strength.score <= 1 ? 'text-rose-500' :
                    strength.score === 2 ? 'text-amber-500' :
                    strength.score === 3 ? 'text-blue-500' : 'text-emerald-500'
                  }>
                    {strength.label}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full ${strength.score >= 1 ? strength.color : 'bg-slate-200 dark:bg-slate-700'} transition-all duration-300`} />
                  <div className={`h-full ${strength.score >= 2 ? strength.color : 'bg-slate-200 dark:bg-slate-700'} transition-all duration-300`} />
                  <div className={`h-full ${strength.score >= 3 ? strength.color : 'bg-slate-200 dark:bg-slate-700'} transition-all duration-300`} />
                  <div className={`h-full ${strength.score >= 4 ? strength.color : 'bg-slate-200 dark:bg-slate-700'} transition-all duration-300`} />
                </div>

                {/* Password requirements helper */}
                <div className="grid grid-cols-2 gap-1 pt-1 text-[10px] text-slate-400">
                  <div className={`flex items-center gap-1 ${newPassword.length >= 8 ? 'text-emerald-600 font-bold' : ''}`}>
                    <Check className="h-3 w-3" /> Au moins 8 caractères
                  </div>
                  <div className={`flex items-center gap-1 ${/[A-Z]/.test(newPassword) ? 'text-emerald-600 font-bold' : ''}`}>
                    <Check className="h-3 w-3" /> Une lettre majuscule
                  </div>
                  <div className={`flex items-center gap-1 ${/[0-9]/.test(newPassword) ? 'text-emerald-600 font-bold' : ''}`}>
                    <Check className="h-3 w-3" /> Un chiffre
                  </div>
                  <div className={`flex items-center gap-1 ${/[^A-Za-z0-9]/.test(newPassword) ? 'text-emerald-600 font-bold' : ''}`}>
                    <Check className="h-3 w-3" /> Un caractère spécial
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirmer le nouveau mot de passe */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Confirmer le nouveau mot de passe <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Répétez le nouveau mot de passe"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-lakoli-navy outline-none text-slate-800 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-[10px] font-bold text-rose-500">Les mots de passe ne correspondent pas.</p>
            )}
          </div>

          {/* Submit button */}
          <div className="pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-lakoli-navy hover:bg-lakoli-navy/90 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer flex items-center gap-2"
            >
              <Lock className="h-3.5 w-3.5" />
              Mettre à jour le mot de passe
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
