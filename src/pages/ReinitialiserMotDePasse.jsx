import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Lock } from "lucide-react";
import api from "../services/api";

export default function ReinitialiserMotDePasse() {
  const [code, setCode] = useState("");
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const identifiant = location.state?.identifiant;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    setChargement(true);

    try {
      await api.post("/auth/reinitialiser-mot-de-passe", {
        identifiant,
        code,
        nouveau_mot_de_passe: nouveauMotDePasse,
        nouveau_mot_de_passe_confirmation: confirmation,
      });
      navigate("/");
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur de réinitialisation.");
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0b1320] text-[#f1f5f9] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-[#1e293b] rounded-2xl border border-[#334155] shadow-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-11 w-11 rounded-2xl bg-[#0C447C] flex items-center justify-center shadow-lg">
            <Lock className="h-6 w-6 text-[#f1f5f9]" />
          </div>
          <span className="text-lg font-black tracking-tight text-[#f1f5f9]">Nouveau mot de passe</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Code reçu"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[#0f172a] border border-[#334155] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0C447C] focus:border-transparent"
            required
          />
          <input
            type="password"
            placeholder="Nouveau mot de passe"
            value={nouveauMotDePasse}
            onChange={(e) => setNouveauMotDePasse(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[#0f172a] border border-[#334155] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0C447C] focus:border-transparent"
            required
          />
          <input
            type="password"
            placeholder="Confirmer le mot de passe"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[#0f172a] border border-[#334155] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0C447C] focus:border-transparent"
            required
          />

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
            {chargement ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
          </button>
        </form>
      </div>
    </div>
  );
}
