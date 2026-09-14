import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Shield,
  BookOpen,
  Users,
  Building2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  X,
  Crown,
  Wallet,
  Check
} from 'lucide-react';
import api from '../services/api';

const MESSAGES_ROTATIFS = [
  "Gérez votre établissement scolaire de manière intelligente, collaborative et sécurisée.",
  "Suivez les paiements de scolarité en temps réel, sans papier.",
  "Notes, bulletins et emplois du temps centralisés en un seul endroit.",
  "Conçu pour les écoles guinéennes, pensé pour votre quotidien.",
];

export default function LoginPage() {
  const navigate = useNavigate();

  // Selected Role key - Default COMPTABLE as requested
  const [selectedRoleKey, setSelectedRoleKey] = useState('COMPTABLE');

  // Form states - Default to Comptable credentials
  const [identifier, setIdentifier] = useState('comptable@lakoli.edu');
  const [password, setPassword] = useState('Comptable2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // UX states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Modals
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const [showSecuritySpecsModal, setShowSecuritySpecsModal] = useState(false);

  // Statistiques réelles de l'établissement
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/stats-publiques')
      .then((res) => setStats(res.data))
      .catch(() => setStats(null));
  }, []);

  // Message d'accroche circulant sous "Bienvenue sur LAKOLI"
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const intervalle = setInterval(() => {
      setMessageIndex((i) => (i + 1) % MESSAGES_ROTATIFS.length);
    }, 4000);
    return () => clearInterval(intervalle);
  }, []);

  // 3x2 Profile Cards Definition with exact requested structure
  const profileCards = [
    {
      key: 'FONDATEUR',
      label: 'Fondateur',
      description: 'Vision stratégique & bilans',
      icon: Crown,
      iconColor: 'text-[#f59e0b]',
      mappedRole: 'FONDATEUR',
      defaultEmail: 'fondateur@lakoli.com'
    },
    {
      key: 'DIRECTEUR',
      label: 'Directeur',
      description: 'Direction administrative',
      icon: Building2,
      iconColor: 'text-[#38bdf8]',
      mappedRole: 'DIRECTEUR',
      defaultEmail: 'directeur.matoto@lakoli.edu'
    },
    {
      key: 'PROVISEUR',
      label: 'Proviseur',
      description: 'Direction pédagogique',
      icon: Shield,
      iconColor: 'text-[#10b981]',
      mappedRole: 'DIRECTEUR',
      defaultEmail: 'proviseur@lakoli.edu'
    },
    {
      key: 'CENSEUR',
      label: 'Censeur',
      description: 'Coordination études',
      icon: BookOpen,
      iconColor: 'text-[#60a5fa]',
      mappedRole: 'DIRECTEUR',
      defaultEmail: 'censeur@lakoli.com'
    },
    {
      key: 'COMPTABLE',
      label: 'Comptable',
      description: 'Recouvrement & paie',
      icon: Wallet,
      iconColor: 'text-[#10b981]',
      mappedRole: 'COMPTABLE',
      defaultEmail: 'comptable@lakoli.edu'
    }
  ];

  // Handle Role selection
  const handleSelectRole = (card) => {
    setError(null);
    setSelectedRoleKey(card.key);
    setIdentifier(card.defaultEmail);
    setPassword(`${card.label}2026!`);
  };

  // Validate form fields
  const validateForm = () => {
    const errors = {};
    if (!identifier.trim()) {
      errors.identifier = 'Veuillez saisir votre email ou numéro de téléphone.';
    } else if (identifier.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
      errors.identifier = 'Adresse email invalide.';
    }

    if (!password.trim()) {
      errors.password = 'Veuillez saisir votre mot de passe.';
    } else if (password.length < 6) {
      errors.password = 'Le mot de passe doit comporter au moins 6 caractères.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const response = await api.post("/auth/login", {
        identifiant: identifier,
        mot_de_passe: password
      });
      if (response.data.otp_requis) {
        navigate("/verification-otp", { state: { identifiant: identifier } });
      } else {
        localStorage.setItem("auth_token", response.data.token);
        navigate("/tableau-de-bord");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Identifiants incorrects. Vérifiez vos informations.");
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSuccess(true);
  };

  const activeCardConfig = profileCards.find(c => c.key === selectedRoleKey) || profileCards[4];

  return (
    <div className="h-screen w-full bg-[#0b1320] text-[#f1f5f9] flex items-center justify-center font-sans selection:bg-[#0C447C] selection:text-white overflow-hidden">

      <style>{`
        @keyframes lakoli-circule {
          0% { transform: translateX(-60px); opacity: 0; }
          18% { transform: translateX(0); opacity: 1; }
          82% { transform: translateX(0); opacity: 1; }
          100% { transform: translateX(60px); opacity: 0; }
        }
      `}</style>

      {/* Main Container */}
      <div className="w-full h-full overflow-y-auto lg:overflow-hidden grid grid-cols-1 lg:grid-cols-12">

        {/* ========================================================= */}
        {/* PARTIE GAUCHE (50% sur écran large)                       */}
        {/* Photo de salle de classe + voile bleu marine dégradé      */}
        {/* ========================================================= */}
        <div
          className="lg:col-span-6 text-[#f1f5f9] p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-[#334155] bg-cover bg-center"
          style={{ backgroundImage: "url('/images/login-bg.jpeg')" }}
        >

          {/* Voile dégradé pour la lisibilité du texte sur la photo */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0C447C]/70 to-[#0f172a]/80" />

          {/* Subtle Grid Backdrop Effect */}
          <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:28px_28px] opacity-10 pointer-events-none" />
          <div className="absolute -top-32 -left-32 w-80 h-80 bg-[#0C447C]/40 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-[#10b981]/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Header */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-[#0f172a]/80 border border-[#334155] flex items-center justify-center shadow-lg">
                <GraduationCap className="h-6 w-6 text-[#f1f5f9]" />
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight text-[#f1f5f9]">
                  LAKOLI
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#94a3b8] block -mt-1">
                  SaaS Éducation Pro
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowSecuritySpecsModal(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0f172a]/70 hover:bg-[#0f172a] backdrop-blur-md rounded-full text-[11px] font-bold text-[#f1f5f9] border border-[#334155] transition-all cursor-pointer shadow-sm"
            >
              <ShieldCheck className="h-4 w-4 text-[#10b981]" />
              <span>Chiffrement SSL & JWT</span>
            </button>
          </div>

          {/* Center: Titre & message circulant */}
          <div className="relative z-10 mt-0 mb-6 py-2 space-y-6">

            {/* Titre & Sous-titre */}
            <div className="space-y-3 text-center max-w-lg mx-auto">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#f1f5f9] tracking-tight drop-shadow-lg">
                Bienvenue sur LAKOLI
              </h2>
              <div className="overflow-hidden">
                <p
                  key={messageIndex}
                  className="text-sm sm:text-base text-[#94a3b8] leading-relaxed font-medium"
                  style={{ animation: 'lakoli-circule 4s ease-in-out' }}
                >
                  {MESSAGES_ROTATIFS[messageIndex]}
                </p>
              </div>
            </div>

            {/* Statistiques réelles de l'établissement */}
            <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto mt-10">
              <div className="group flex items-center gap-3.5 p-5 rounded-2xl bg-[#0f172a]/60 backdrop-blur-md border border-[#334155] hover:border-[#38bdf8]/50 transition-colors">
                <div className="h-14 w-14 shrink-0 rounded-xl bg-[#38bdf8]/15 flex items-center justify-center group-hover:bg-[#38bdf8]/25 transition-colors">
                  <GraduationCap className="h-6 w-6 text-[#38bdf8]" />
                </div>
                <div className="text-left leading-tight min-w-0">
                  <p className="text-3xl font-black text-[#f1f5f9]">{stats ? stats.eleves : "—"}</p>
                  <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-wide truncate">Élèves</p>
                </div>
              </div>
              <div className="group flex items-center gap-3.5 p-5 rounded-2xl bg-[#0f172a]/60 backdrop-blur-md border border-[#334155] hover:border-[#10b981]/50 transition-colors">
                <div className="h-14 w-14 shrink-0 rounded-xl bg-[#10b981]/15 flex items-center justify-center group-hover:bg-[#10b981]/25 transition-colors">
                  <Users className="h-6 w-6 text-[#10b981]" />
                </div>
                <div className="text-left leading-tight min-w-0">
                  <p className="text-3xl font-black text-[#f1f5f9]">{stats ? stats.enseignants : "—"}</p>
                  <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-wide truncate">Enseignants</p>
                </div>
              </div>
              <div className="group flex items-center gap-3.5 p-5 rounded-2xl bg-[#0f172a]/60 backdrop-blur-md border border-[#334155] hover:border-[#f59e0b]/50 transition-colors">
                <div className="h-14 w-14 shrink-0 rounded-xl bg-[#f59e0b]/15 flex items-center justify-center group-hover:bg-[#f59e0b]/25 transition-colors">
                  <ShieldCheck className="h-6 w-6 text-[#f59e0b]" />
                </div>
                <div className="text-left leading-tight min-w-0">
                  <p className="text-3xl font-black text-[#f1f5f9]">{stats ? stats.utilisateurs : "—"}</p>
                  <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-wide truncate">Utilisateurs</p>
                </div>
              </div>
            </div>

          </div>

          {/* Footer gauche : Copyright & Conakry */}
          <div className="relative z-10 pt-4 border-t border-[#334155] flex items-center justify-between text-[11px] text-[#94a3b8]">
            <span>© 2026 LAKOLI SaaS Inc.</span>
            <span className="font-semibold text-[#f1f5f9]">Conakry, République de Guinée</span>
          </div>

        </div>

        {/* ========================================================= */}
        {/* PARTIE DROITE (50%)                                       */}
        {/* Fond : #1e293b (gris bleu sombre)                         */}
        {/* ========================================================= */}
        <div className="lg:col-span-6 bg-[#1e293b] p-6 sm:p-8 lg:p-10 flex flex-col justify-between">

          <div className="space-y-4">

            {/* Header LAKOLI Branding */}
            <div className="flex items-center justify-between border-b border-[#334155] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-[#0C447C] text-[#f1f5f9] flex items-center justify-center font-black shadow-md shadow-[#0C447C]/30">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-lg font-black text-[#f1f5f9] tracking-tight leading-none">
                    LAKOLI
                  </h1>
                  <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">
                    SaaS Éducation
                  </span>
                </div>
              </div>

              <span className="px-2.5 py-1 bg-[#0f172a] text-[#94a3b8] text-[10px] font-bold rounded-full border border-[#334155]">
                v2.4.0 SaaS LAKOLI
              </span>
            </div>

            {/* SECTION "CHOIX DU PROFIL D'ACCÈS" AVEC ÉTIQUETTE DU PROFIL ACTIF EN BLEU À DROITE */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-[#f1f5f9]">
                <span>Choix du profil d'accès :</span>
                <span className="text-xs font-extrabold text-[#38bdf8] bg-[#0C447C]/40 px-2 py-0.5 rounded-md border border-[#0C447C]">
                  {activeCardConfig.label}
                </span>
              </div>

              {/* GRILLE DE CARTES PROFILS */}
              <div className="flex flex-wrap justify-center gap-2">
                {profileCards.map((card) => {
                  const isSelected = selectedRoleKey === card.key;
                  const Icon = card.icon;

                  return (
                    <button
                      key={card.key}
                      type="button"
                      onClick={() => handleSelectRole(card)}
                      title={card.description}
                      className={`relative flex-1 basis-[30%] p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[66px] ${
                        isSelected
                          ? 'border-[#0C447C] bg-[#1e3a5f] ring-2 ring-[#0C447C]/40 shadow-sm'
                          : 'border-[#334155] bg-[#0f172a]/80 hover:bg-[#0f172a] hover:border-[#475569]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className={`h-4.5 w-4.5 ${card.iconColor}`} />

                        {isSelected && (
                          <div className="h-4 w-4 rounded-full bg-[#0C447C] text-white flex items-center justify-center">
                            <Check className="h-2.5 w-2.5 text-[#f1f5f9]" />
                          </div>
                        )}
                      </div>

                      <div className="mt-1">
                        <p className="text-xs font-extrabold text-[#f1f5f9] truncate">
                          {card.label}
                        </p>
                        <p className="text-[9px] text-[#94a3b8] truncate">
                          {card.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3 bg-[#0f172a] border border-[#f59e0b] text-[#f59e0b] rounded-xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-[#f59e0b]" />
                <span className="leading-tight">{error}</span>
              </div>
            )}

            {/* LOGIN FORM */}
            <form onSubmit={handleSubmit} className="space-y-3">

              {/* Email ou numéro de téléphone */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#f1f5f9] block">
                  Email ou numéro de téléphone <span className="text-[#f59e0b]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94a3b8]">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (fieldErrors.identifier) setFieldErrors({ ...fieldErrors, identifier: undefined });
                    }}
                    placeholder="nom@lakoli.edu ou +224 620..."
                    className={`w-full pl-10 pr-4 py-2.5 bg-[#0f172a] border rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#0C447C] focus:border-[#0C447C] transition-all outline-none text-[#f1f5f9] placeholder:text-[#64748b] ${
                      fieldErrors.identifier
                        ? 'border-[#f59e0b] ring-1 ring-[#f59e0b]'
                        : 'border-[#334155]'
                    }`}
                  />
                </div>
                {fieldErrors.identifier && (
                  <p className="text-[10px] text-[#f59e0b] font-bold pl-1">{fieldErrors.identifier}</p>
                )}
              </div>

              {/* Mot de passe avec oeil et lien mot de passe oublié */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-[#f1f5f9] block">
                    Mot de passe <span className="text-[#f59e0b]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs font-bold text-[#38bdf8] hover:underline cursor-pointer"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94a3b8]">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined });
                    }}
                    placeholder="••••••••••••"
                    className={`w-full pl-10 pr-10 py-2.5 bg-[#0f172a] border rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#0C447C] focus:border-[#0C447C] transition-all outline-none text-[#f1f5f9] placeholder:text-[#64748b] ${
                      fieldErrors.password
                        ? 'border-[#f59e0b] ring-1 ring-[#f59e0b]'
                        : 'border-[#334155]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#94a3b8] hover:text-[#f1f5f9] cursor-pointer"
                    title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-[10px] text-[#f59e0b] font-bold pl-1">{fieldErrors.password}</p>
                )}
              </div>

              {/* Case à cocher "Se souvenir de moi pendant 30 jours" */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-[#334155] bg-[#0f172a] text-[#0C447C] focus:ring-[#0C447C] cursor-pointer"
                  />
                  <span className="text-xs font-medium text-[#94a3b8] group-hover:text-[#f1f5f9] transition-colors">
                    Se souvenir de moi pendant 30 jours
                  </span>
                </label>
              </div>

              {/* BOUTON CONNEXION : #0C447C avec hover #1a5a9e, pleine largeur */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-6 bg-[#0C447C] hover:bg-[#1a5a9e] text-[#f1f5f9] rounded-xl text-xs font-black shadow-lg shadow-[#0C447C]/30 transition-all cursor-pointer flex items-center justify-center gap-2 group disabled:opacity-75 mt-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Authentification LAKOLI...</span>
                  </>
                ) : (
                  <>
                    <span>Connexion</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

            </form>

          </div>

          {/* FOOTER DROIT : Icône SSL + Chiffrement SSL & Architecture JWT et v2.4.0 SaaS LAKOLI */}
          <div className="mt-4 pt-3 border-t border-[#334155] flex items-center justify-between text-[11px] text-[#94a3b8]">
            <button
              type="button"
              onClick={() => setShowSecuritySpecsModal(true)}
              className="flex items-center gap-1.5 hover:text-[#f1f5f9] transition-colors cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4 text-[#10b981]" />
              <span>Chiffrement SSL & Architecture JWT</span>
            </button>
            <span>v2.4.0 SaaS LAKOLI</span>
          </div>

        </div>

      </div>

      {/* ========================================================= */}
      {/* MODAL 1: MOT DE PASSE OUBLIÉ                             */}
      {/* ========================================================= */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-[#0b1320]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1e293b] w-full max-w-md rounded-2xl p-6 shadow-2xl border border-[#334155] space-y-5">

            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-[#0C447C]/30 text-[#38bdf8] rounded-xl border border-[#0C447C]">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#f1f5f9]">Réinitialisation du mot de passe</h3>
                  <p className="text-[11px] text-[#94a3b8]">Entrez votre adresse email de connexion.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotSuccess(false);
                }}
                className="p-1.5 text-[#94a3b8] hover:text-[#f1f5f9] rounded-lg hover:bg-[#0f172a] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {forgotSuccess ? (
              <div className="p-4 bg-[#0f172a] border border-[#10b981] rounded-xl text-xs space-y-2 text-[#10b981]">
                <div className="flex items-center gap-2 font-bold text-[#f1f5f9]">
                  <CheckCircle2 className="h-5 w-5 text-[#10b981]" />
                  <span>Lien de réinitialisation envoyé !</span>
                </div>
                <p className="text-[11px] leading-relaxed text-[#94a3b8]">
                  Un email d'instructions a été transmis à l'adresse <strong className="text-[#f1f5f9]">{forgotEmail}</strong>. Veuillez vérifier votre boîte de réception.
                </p>
                <button
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotSuccess(false);
                  }}
                  className="w-full mt-2 py-2 bg-[#0C447C] hover:bg-[#1a5a9e] text-[#f1f5f9] font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Retour à la connexion
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#f1f5f9] block">
                    Adresse email enregistrée
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="comptable@lakoli.edu"
                    className="w-full px-3.5 py-2.5 bg-[#0f172a] border border-[#334155] rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#0C447C] outline-none text-[#f1f5f9] placeholder:text-[#64748b]"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="w-1/2 py-2.5 bg-[#0f172a] text-[#94a3b8] font-bold rounded-xl text-xs hover:bg-[#334155] hover:text-[#f1f5f9] transition-colors cursor-pointer border border-[#334155]"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 bg-[#0C447C] hover:bg-[#1a5a9e] text-[#f1f5f9] font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Envoyer le lien
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: SPÉCIFICATIONS DE SÉCURITÉ SSL & JWT             */}
      {/* ========================================================= */}
      {showSecuritySpecsModal && (
        <div className="fixed inset-0 z-50 bg-[#0b1320]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1e293b] w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-[#334155] space-y-4">

            <div className="flex justify-between items-start border-b border-[#334155] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-[#10b981]/15 text-[#10b981] rounded-xl border border-[#10b981]/30">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#f1f5f9]">Sécurité Bancaire & Chiffrement</h3>
                  <p className="text-[11px] text-[#94a3b8]">Architecture de protection des données scolaires LAKOLI.</p>
                </div>
              </div>
              <button
                onClick={() => setShowSecuritySpecsModal(false)}
                className="p-1.5 text-[#94a3b8] hover:text-[#f1f5f9] rounded-lg hover:bg-[#0f172a] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#94a3b8]">
              <div className="p-3 bg-[#0f172a] rounded-xl border border-[#334155] space-y-1">
                <p className="font-bold text-[#f1f5f9]">1. Authentification Stateless JWT</p>
                <p className="text-[11px]">Tokens cryptographiques signés HMAC-SHA256 avec rotation des clés et déconnexion automatique en cas d'inactivité prolongée.</p>
              </div>

              <div className="p-3 bg-[#0f172a] rounded-xl border border-[#334155] space-y-1">
                <p className="font-bold text-[#f1f5f9]">2. Chiffrement de bout en bout TLS 1.3</p>
                <p className="text-[11px]">Toutes les transactions financières et notes des élèves sont acheminées via un tunnel chiffré HTTPS conforme aux standards internationaux.</p>
              </div>

              <div className="p-3 bg-[#0f172a] rounded-xl border border-[#334155] space-y-1">
                <p className="font-bold text-[#f1f5f9]">3. Contrôle d'accès basé sur les rôles (RBAC)</p>
                <p className="text-[11px]">Cloisonnement strict : un enseignant n'a jamais accès aux soldes comptables, et le comptable ne peut modifier les appréciations pédagogiques.</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSecuritySpecsModal(false)}
                className="px-5 py-2 bg-[#0C447C] hover:bg-[#1a5a9e] text-[#f1f5f9] font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Compris
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
