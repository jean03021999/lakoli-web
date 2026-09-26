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

  // Identifiants saisis par l'utilisateur (aucune valeur de demonstration preremplie)
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
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
      emoji: '👑',
      court: 'Vision & bilans',
      label: 'Fondateur',
      description: 'Vision stratégique & bilans',
      icon: Crown,
      iconColor: 'text-[#f59e0b]',
    },
    {
      key: 'DIRECTEUR',
      emoji: '🏢',
      court: 'Direction adm.',
      label: 'Directeur',
      description: 'Direction administrative',
      icon: Building2,
      iconColor: 'text-[#38bdf8]',
    },
    {
      key: 'PROVISEUR',
      emoji: '🛡️',
      court: 'Pédagogie',
      label: 'Proviseur',
      description: 'Direction pédagogique',
      icon: Shield,
      iconColor: 'text-[#10b981]',
    },
    {
      key: 'CENSEUR',
      emoji: '📚',
      court: 'Coordination',
      label: 'Censeur',
      description: 'Coordination études',
      icon: BookOpen,
      iconColor: 'text-[#60a5fa]',
    },
    {
      key: 'COMPTABLE',
      emoji: '💼',
      court: 'Recouvrement',
      label: 'Comptable',
      description: 'Recouvrement & paie',
      icon: Wallet,
      iconColor: 'text-[#10b981]',
    }
  ];

  // Profil Parent : affiche (design) mais pas encore disponible
  const PROFIL_PARENT = { key: 'PARENT', label: 'Parent', description: "Suivi de l'enfant", court: 'Suivi enfant', emoji: '👨‍👩‍👧', disabled: true, badge: 'Bientôt' };

  // Handle Role selection
  const handleSelectRole = (card) => {
    setError(null);
    setSelectedRoleKey(card.key);
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
        identifiant: identifier.trim(),
        mot_de_passe: password,
        // Le serveur refuse la connexion si le compte n'a pas ce profil.
        profil: selectedRoleKey.toLowerCase(),
      });
      if (response.data.otp_requis) {
        // "Se souvenir 30 jours" = faire confiance a cet appareil lors de la verification du code.
        navigate("/verification-otp", { state: { identifiant: identifier.trim(), confiance: rememberMe } });
      } else {
        localStorage.setItem("auth_token", response.data.token);
        navigate("/tableau-de-bord");
      }
    } catch (err) {
      const erreurs = err.response?.data?.errors;
      setError(
        erreurs?.profil?.[0] ||
        erreurs?.identifiant?.[0] ||
        err.response?.data?.message ||
        "Connexion impossible. Vérifiez votre connexion au serveur."
      );
      setIsLoading(false);
    }
  };

  // Envoie un code de reinitialisation (POST /auth/mot-de-passe-oublie) puis ouvre l'ecran de saisie
  // du code et du nouveau mot de passe.
  const [forgotChargement, setForgotChargement] = useState(false);
  const [forgotErreur, setForgotErreur] = useState('');
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    const valeur = forgotEmail.trim();
    if (!valeur) return;
    setForgotChargement(true);
    setForgotErreur('');
    try {
      await api.post('/auth/mot-de-passe-oublie', { identifiant: valeur });
      setForgotSuccess(true);
    } catch (err) {
      setForgotErreur(err.response?.data?.message || "Impossible d'envoyer le code. Réessayez.");
    } finally {
      setForgotChargement(false);
    }
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
        {/* PARTIE DROITE (50%) — formulaire (design Google AI Studio) */}
        {/* ========================================================= */}
        <div className="lg:col-span-6 bg-white flex items-center justify-center px-6 py-6 sm:px-10 lg:px-14 lg:overflow-y-auto">
          <div className="w-full max-w-[380px] space-y-3 text-[#1e293b]">
            {/* Logo LAKOLI + mini drapeau guinéen */}
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center text-white shrink-0"
                style={{
                  width: "38px",
                  height: "38px",
                  background: "linear-gradient(135deg, #0C447C 0%, #1a6bb5 100%)",
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(12, 68, 124, 0.25)",
                }}
              >
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="leading-none" style={{ color: "#0C447C", fontSize: "19px", fontWeight: 900, letterSpacing: "2px" }}>
                    LAKOLI
                  </span>
                  <span
                    className="flex rounded-[2px] overflow-hidden border border-slate-200 shrink-0"
                    style={{ width: "20px", height: "13px" }}
                    title="République de Guinée"
                  >
                    <span className="w-1/3 h-full bg-[#CE1126]" />
                    <span className="w-1/3 h-full bg-[#FCD116]" />
                    <span className="w-1/3 h-full bg-[#009460]" />
                  </span>
                </div>
                <p className="text-[11px] text-[#64748b] font-medium mt-0.5">Gestion Scolaire · Guinée</p>
              </div>
            </div>

            <div className="border-t border-[#e2e8f0]" />

            {/* Titre du formulaire, sur une bande bleue identique au bouton "Se connecter" */}
            <div
              className="px-4 py-2.5 text-white text-center"
              style={{
                borderRadius: "10px",
                background: "linear-gradient(135deg, #0C447C 0%, #1565c0 100%)",
                boxShadow: "0 4px 16px rgba(12, 68, 124, 0.3)",
              }}
            >
              <h2 className="font-extrabold tracking-tight leading-tight" style={{ fontSize: "17px" }}>
                Connexion à votre espace
              </h2>
              <p className="text-[12px] text-white/75">Accédez à votre tableau de bord sécurisé</p>
            </div>

            {/* Sélection du profil (grille 3 x 2) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#0C447C]/80">
                  Votre profil d'accès
                </span>
                <span className="text-[10px] font-semibold text-[#0C447C] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  {activeCardConfig.label} sélectionné
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {[...profileCards, PROFIL_PARENT].map((card) => {
                  const isSelected = selectedRoleKey === card.key;
                  const isDisabled = !!card.disabled;
                  return (
                    <button
                      key={card.key}
                      type="button"
                      onClick={() => !isDisabled && handleSelectRole(card)}
                      disabled={isDisabled}
                      title={card.description}
                      className={`relative text-left transition-all duration-200 select-none text-white ${
                        isDisabled
                          ? "opacity-60 cursor-not-allowed"
                          : isSelected
                          ? "scale-[1.02] cursor-pointer"
                          : "hover:brightness-110 cursor-pointer"
                      }`}
                      style={{
                        borderRadius: "9px",
                        padding: "7px 8px",
                        background: isSelected
                          ? "linear-gradient(135deg, #0C447C 0%, #1565c0 100%)"
                          : "linear-gradient(145deg, #0a2d5a 0%, #0C447C 100%)",
                        border: isSelected ? "2px solid #60a5fa" : "1px solid rgba(255, 255, 255, 0.15)",
                        boxShadow: isSelected ? "0 4px 14px rgba(12, 68, 124, 0.4)" : "0 2px 6px rgba(0, 0, 0, 0.08)",
                      }}
                    >
                      {isSelected && (
                        <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-[#10b981] text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                      {card.badge && (
                        <span className="absolute top-1.5 right-1.5 px-1 rounded text-[8px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                          {card.badge}
                        </span>
                      )}
                      <div className="w-5 h-5 rounded-md bg-white/15 flex items-center justify-center text-[12px] mb-1 border border-white/10">
                        {card.emoji}
                      </div>
                      <p className="text-[11px] font-bold leading-tight truncate text-white">{card.label}</p>
                      <p className="text-[9px] text-blue-100/80 leading-tight truncate mt-0.5">{card.court}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message d'erreur de connexion */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="leading-tight">{error}</span>
              </div>
            )}

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="space-y-2.5" noValidate>
              <div className="space-y-1">
                <label htmlFor="identifiant" className="block text-[11px] font-semibold text-[#0C447C]/90">
                  Email ou numéro
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#0C447C]/60 absolute left-3 top-3" />
                  <input
                    id="identifiant"
                    type="text"
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (fieldErrors.identifier) setFieldErrors({ ...fieldErrors, identifier: undefined });
                    }}
                    placeholder="Entrez votre email ou identifiant"
                    className="w-full pl-9 pr-3.5 border text-sm text-[#1e293b] placeholder:text-[#94a3b8] hover:border-[#0C447C]/50 focus:outline-none focus:border-[#0C447C] focus:shadow-[0_0_0_3px_rgba(12,68,124,0.15)] transition-all"
                    style={{
                      backgroundColor: "#f8fafc",
                      borderColor: fieldErrors.identifier ? "#f43f5e" : "rgba(12, 68, 124, 0.28)",
                      borderRadius: "10px",
                      height: "40px",
                    }}
                  />
                </div>
                {fieldErrors.identifier && <p className="text-[11px] text-rose-600 font-semibold pl-1">{fieldErrors.identifier}</p>}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="mot-de-passe" className="block text-[11px] font-semibold text-[#0C447C]/90">
                    Mot de passe
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-[11px] font-semibold text-[#0C447C] hover:underline cursor-pointer"
                  >
                    Oublié ?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#0C447C]/60 absolute left-3 top-3" />
                  <input
                    id="mot-de-passe"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined });
                    }}
                    placeholder="Entrez votre mot de passe"
                    className="w-full pl-9 pr-10 border text-sm text-[#1e293b] placeholder:text-[#94a3b8] hover:border-[#0C447C]/50 focus:outline-none focus:border-[#0C447C] focus:shadow-[0_0_0_3px_rgba(12,68,124,0.15)] transition-all"
                    style={{
                      backgroundColor: "#f8fafc",
                      borderColor: fieldErrors.password ? "#f43f5e" : "rgba(12, 68, 124, 0.28)",
                      borderRadius: "10px",
                      height: "40px",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-[#0C447C]/60 hover:text-[#0C447C] transition-colors p-0.5 cursor-pointer"
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.password && <p className="text-[11px] text-rose-600 font-semibold pl-1">{fieldErrors.password}</p>}
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <input
                  id="se-souvenir"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0C447C] focus:ring-0 cursor-pointer"
                  style={{ borderColor: "rgba(12, 68, 124, 0.35)" }}
                />
                <label htmlFor="se-souvenir" className="text-[12px] text-[#475569] cursor-pointer select-none">
                  Se souvenir 30 jours
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full text-white text-sm flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-[0_6px_20px_rgba(12,68,124,0.4)] hover:brightness-105 active:scale-[0.99] cursor-pointer disabled:opacity-75"
                style={{
                  height: "42px",
                  borderRadius: "10px",
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #0C447C 0%, #1565c0 100%)",
                  boxShadow: "0 4px 16px rgba(12, 68, 124, 0.3)",
                }}
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Connexion en cours...</span>
                  </>
                ) : (
                  <>
                    <span>Se connecter</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Pied du formulaire */}
            <div className="pt-1">
              <div className="border-t border-[#e2e8f0] pt-2.5 flex items-center justify-between text-[11px] text-[#64748b]">
                <button
                  type="button"
                  onClick={() => setShowSecuritySpecsModal(true)}
                  className="flex items-center gap-1.5 hover:text-[#0C447C] transition-colors cursor-pointer"
                >
                  <span>🔒</span>
                  <span>Chiffrement SSL & Architecture JWT</span>
                </button>
                <span className="font-mono text-[#94a3b8]">v2.4.0 SaaS LAKOLI</span>
              </div>
            </div>
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
                  <p className="text-[11px] text-[#94a3b8]">Entrez l'email ou le téléphone de votre compte.</p>
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
                  <span>Demande envoyée</span>
                </div>
                <p className="text-[11px] leading-relaxed text-[#94a3b8]">
                  Si un compte correspond à <strong className="text-[#f1f5f9]">{forgotEmail}</strong>, un code de réinitialisation vient de lui être envoyé.
                </p>
                <button
                  onClick={() => navigate('/reinitialiser-mot-de-passe', { state: { identifiant: forgotEmail.trim() } })}
                  className="w-full mt-2 py-2 bg-[#0C447C] hover:bg-[#1a5a9e] text-[#f1f5f9] font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Saisir le code et un nouveau mot de passe
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#f1f5f9] block">
                    Email ou téléphone du compte
                  </label>
                  <input
                    type="text"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="nom@ecole.com ou +224 6.."
                    className="w-full px-3.5 py-2.5 bg-[#0f172a] border border-[#334155] rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#0C447C] outline-none text-[#f1f5f9] placeholder:text-[#64748b]"
                  />
                </div>

                {forgotErreur && <p className="text-[11px] text-[#f59e0b] font-bold">{forgotErreur}</p>}

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
                    disabled={forgotChargement}
                    className="w-1/2 py-2.5 bg-[#0C447C] hover:bg-[#1a5a9e] text-[#f1f5f9] font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {forgotChargement ? 'Envoi…' : 'Envoyer le code'}
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
                <p className="font-bold text-[#f1f5f9]">1. Jetons d'accès sécurisés</p>
                <p className="text-[11px]">Chaque session utilise un jeton d'accès personnel (Laravel Sanctum) ; les mots de passe sont stockés hachés, jamais en clair.</p>
              </div>

              <div className="p-3 bg-[#0f172a] rounded-xl border border-[#334155] space-y-1">
                <p className="font-bold text-[#f1f5f9]">2. Vérification par code (OTP)</p>
                <p className="text-[11px]">À la connexion depuis un nouvel appareil, un code à usage unique est demandé ; un appareil peut être marqué « de confiance » pendant 30 jours.</p>
              </div>

              <div className="p-3 bg-[#0f172a] rounded-xl border border-[#334155] space-y-1">
                <p className="font-bold text-[#f1f5f9]">3. Profils et permissions (RBAC)</p>
                <p className="text-[11px]">Le profil choisi est vérifié à la connexion, puis chaque écran et chaque action de l'API contrôle les permissions du rôle, établissement par établissement.</p>
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
