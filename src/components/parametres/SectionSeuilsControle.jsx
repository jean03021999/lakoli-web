import { useState } from "react";
import { Loader2, Save, ShieldAlert } from "lucide-react";
import api from "../../services/api";
import { Carte, Champ } from "./ui";
import { CHAMP, messageErreur } from "./outils";

// Seuils au-dela desquels une annulation est mise en evidence dans la page Controle du Fondateur.
export default function SectionSeuilsControle({ etablissement, onMaj, onToast }) {
  const [montant, setMontant] = useState(String(etablissement.seuil_annulation_montant ?? 500000));
  const [heures, setHeures] = useState(String(etablissement.seuil_annulation_delai_heures ?? 24));
  const [envoi, setEnvoi] = useState(false);

  const enregistrer = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    try {
      const res = await api.put("/parametres/seuils-controle", {
        seuil_annulation_montant: Number(montant),
        seuil_annulation_delai_heures: Number(heures),
      });
      onMaj(res.data);
      onToast("Seuils enregistrés", "La page Contrôle applique désormais ces règles.");
    } catch (err) {
      onToast("Enregistrement refusé", messageErreur(err, "Impossible d'enregistrer les seuils."), "warning");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <Carte icone={ShieldAlert} titre="Seuils d'alerte" description="Règles de mise en évidence des annulations dans la page Contrôle">
      <form onSubmit={enregistrer} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Champ libelle="Montant d'annulation (GNF)" requis aide="Une annulation de ce montant ou plus est signalée en rouge.">
            <input type="number" min="0" step="50000" required value={montant} onChange={(e) => setMontant(e.target.value)} className={CHAMP} />
          </Champ>
          <Champ libelle="Délai d'annulation (heures)" requis aide="Une annulation faite ce délai ou plus après l'encaissement est signalée en rouge.">
            <input type="number" min="1" max="8760" required value={heures} onChange={(e) => setHeures(e.target.value)} className={CHAMP} />
          </Champ>
        </div>
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button type="submit" disabled={envoi} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0C447C] hover:bg-[#0a2d5a] disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all cursor-pointer">
            {envoi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Enregistrer les seuils</span>
          </button>
        </div>
      </form>
    </Carte>
  );
}
