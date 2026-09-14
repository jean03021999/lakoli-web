import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound } from "lucide-react";
import api from "../services/api";

export default function MotDePasseOublie() {
  const [identifiant, setIdentifiant] = useState("");
  const [message, setMessage] = useState("");
  const [chargement, setChargement] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);

    try {
      await api.post("/auth/mot-de-passe-oublie", { identifiant });
      navigate("/reinitialiser-mot-de-passe", { state: { identifiant } });
    } catch (err) {
      setMessage(err.response?.data?.message || "Une erreur est survenue.");
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0b1320] text-[#f1f5f9] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-[#1e293b] rounded-2xl border border-[#334155] shadow-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-11 w-11 rounded-2xl bg-[#0C447C] flex items-center justify-center shadow-lg">
            <KeyRound className="h-6 w-6 text-[#f1f5f9]" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-[#f1f5f9] block leading-none">
              Mot de passe oublié ?
            </span>
            <span className="text-xs text-[#94a3b8]">
              Entrez votre email ou téléphone, nous vous enverrons un code.
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Adresse e-mail ou numéro de téléphone"
            value={identifiant}
            onChange={(e) => setIdentifiant(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[#0f172a] border border-[#334155] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0C447C] focus:border-transparent"
            required
          />

          {message && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={chargement}
            className="w-full py-3 rounded-lg bg-[#0C447C] text-white font-semibold hover:bg-[#0a3663] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {chargement ? "Envoi..." : "Envoyer le code de réinitialisation"}
          </button>
        </form>

        <p
          onClick={() => navigate("/")}
          className="text-center mt-5 text-sm text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
        >
          Retour à la connexion
        </p>
      </div>
    </div>
  );
}
