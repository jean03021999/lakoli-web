import { useState } from "react";
import { Bell, Info } from "lucide-react";
import { Carte, Interrupteur } from "./ui";
import { lireAlertes, enregistrerAlertes } from "./outils";

// Alertes affichees dans la cloche de l'en-tete (preference propre a ce navigateur).
export default function SectionAlertes({ permissions, onToast }) {
  const [alertes, setAlertes] = useState(lireAlertes);

  const basculer = (cle, valeur) => {
    const suivantes = { ...alertes, [cle]: valeur };
    setAlertes(suivantes);
    if (enregistrerAlertes(suivantes)) {
      onToast(valeur ? "Alerte activée" : "Alerte masquée", "La cloche de l'en-tête est mise à jour.", "info");
    } else {
      onToast("Préférence non enregistrée", "Le navigateur bloque le stockage local.", "warning");
    }
  };

  const disponibles = [
    {
      cle: "retards",
      libelle: "⚠️ Élèves en retard de paiement",
      description: "Nombre d'élèves dont une échéance de scolarité est dépassée.",
      permission: "eleves.voir",
    },
    {
      cle: "evaluations",
      libelle: "🎓 Évaluations à valider",
      description: "Notes soumises par les enseignants et en attente de validation.",
      permission: "notes.voir",
    },
  ];

  return (
    <div className="space-y-6">
      <Carte icone={Bell} titre="Alertes de l'en-tête" description="Choisissez les alertes signalées par la cloche en haut de l'écran">
        <div className="divide-y divide-slate-100">
          {disponibles.map((a) => {
            const autorise = permissions.includes(a.permission);
            return (
              <Interrupteur
                key={a.cle}
                actif={autorise && alertes[a.cle]}
                desactive={!autorise}
                onChange={(v) => basculer(a.cle, v)}
                libelle={a.libelle}
                description={autorise ? a.description : `${a.description} Non disponible pour votre rôle.`}
              />
            );
          })}
        </div>
        <div className="mt-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-slate-600">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p>Ce réglage ne concerne que ce navigateur. Les envois automatiques aux parents (SMS, e-mail, WhatsApp) ne sont pas encore disponibles sur LAKOLI.</p>
        </div>
      </Carte>
    </div>
  );
}
