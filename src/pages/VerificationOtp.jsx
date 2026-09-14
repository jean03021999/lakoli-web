import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GraduationCap, ShieldCheck } from "lucide-react";
import api from "../services/api";

export default function VerificationOtp() {
  const [code, setCode] = useState("");
  const [confiance, setConfiance] = useState(true);
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const identifiant = location.state?.identifiant;

  useEffect(() => {
    if (!identifiant) {
      navigate("/");
    }
  }, [identifiant, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    setChargement(true);

    try {
      const response = await api.post("/auth/verifier-otp", {
        identifiant,
        code,
        faire_confiance_appareil: confiance,
      });

      localStorage.setItem("auth_token", response.data.token);
      if (response.data.device_token) {
        localStorage.setItem("device_token", response.data.device_token);
      }
      navigate("/tableau-de-bord");
    } catch (err) {
      setErreur(err.response?.data?.message || "Code invalide.");
    } finally {
      setChargement(false);
    }
  };

  const renvoyerCode = async () => {
    try {
      await api.post("/auth/renvoyer-otp", { identifiant });
      setErreur("");
    } catch (err) {
      setErreur("Erreur lors du renvoi du code.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0b1320] text-[#f1f5f9] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-[#1e293b] rounded-2xl border border-[#334155] shadow-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-11 w-11 rounded-2xl bg-[#0C447C] flex items-center justify-center shadow-lg">
            <ShieldCheck className="h-6 w-6 text-[#f1f5f9]" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-[#f1f5f9] block leading-none">
              Vérification de sécurité
            </span>
            <span className="text-xs text-[#94a3b8]">Un code a été envoyé à {identifiant}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Code à 6 chiffres"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
            className="w-full px-4 py-3 rounded-lg bg-[#0f172a] border border-[#334155] text-white text-center text-lg tracking-[0.3em] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0C447C] focus:border-transparent"
            required
          />

          <label className="flex items-center gap-2 text-sm text-[#94a3b8] cursor-pointer">
            <input
              type="checkbox"
              checked={confiance}
              onChange={(e) => setConfiance(e.target.checked)}
              className="h-4 w-4 rounded border-[#334155] bg-[#0f172a] text-[#0C447C] focus:ring-[#0C447C]"
            />
            Faire confiance à cet appareil pendant 30 jours
          </label>

          {erreur && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {erreur}
            </p>
          )}

          <button
            type="submit"
            disabled={chargement}
            className="w-full py-3 rounded-lg bg-[#0C447C] text-white font-semibold hover:bg-[#0a3663] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {chargement ? "Vérification..." : "Vérifier"}
          </button>
        </form>

        <p
          onClick={renvoyerCode}
          className="text-center mt-5 text-sm text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
        >
          Renvoyer le code
        </p>
      </div>
    </div>
  );
}
