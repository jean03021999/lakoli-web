import { useState } from "react";
import { User, Shield, Mail, Phone, CalendarDays } from "lucide-react";
import api from "../../services/api";
import { Carte, Champ, AvecIcone, BoutonEnregistrer } from "./ui";
import { CHAMP, LIBELLES_ROLES, dateLongue, initiales, messageErreur } from "./outils";

export default function SectionProfil({ profil, onMaj, onToast }) {
  const [form, setForm] = useState({ name: profil.name || "", email: profil.email || "", telephone: profil.telephone || "" });
  const maj = (champ, valeur) => setForm((f) => ({ ...f, [champ]: valeur }));
  const role = LIBELLES_ROLES[String(profil.role || "").toUpperCase()] || profil.role || "Aucun rôle";

  const enregistrer = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      onToast("Champs requis", "Le nom et l'adresse e-mail sont obligatoires.", "warning");
      throw new Error();
    }
    try {
      const res = await api.put("/parametres/profil", { ...form, telephone: form.telephone.trim() || null });
      onMaj(res.data);
      onToast("Profil mis à jour", "Vos informations personnelles sont enregistrées.");
    } catch (err) {
      onToast("Enregistrement impossible", messageErreur(err, "Erreur lors de l'enregistrement."), "warning");
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      <Carte icone={User} titre="Identité du compte" description="Tel que vous apparaissez auprès du personnel de l'établissement">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div
            style={{ background: "linear-gradient(135deg, #0C447C 0%, #1a6bb5 100%)" }}
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold tracking-wider shadow-md shrink-0"
          >
            {initiales(form.name)}
          </div>
          <div className="flex-1 text-center sm:text-left space-y-2">
            <p className="text-xl font-bold text-slate-900">{form.name || "—"}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">{role}</span>
              {profil.membre_depuis && (
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <CalendarDays className="w-3.5 h-3.5" />
                  Membre depuis le {dateLongue(profil.membre_depuis)}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">L'avatar reprend automatiquement les initiales de votre nom.</p>
          </div>
        </div>
      </Carte>

      <Carte icone={Shield} titre="Informations personnelles" description="Coordonnées de connexion et de contact">
        <div className="space-y-5">
          <Champ libelle="Nom complet" requis>
            <input type="text" value={form.name} onChange={(e) => maj("name", e.target.value)} className={`${CHAMP} font-medium`} />
          </Champ>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Champ libelle="Adresse e-mail" requis aide="Sert à la connexion et à la réception des codes de vérification.">
              <AvecIcone icone={Mail}>
                <input type="email" value={form.email} onChange={(e) => maj("email", e.target.value)} className={`${CHAMP} pl-10`} />
              </AvecIcone>
            </Champ>
            <Champ libelle="Téléphone mobile (+224)">
              <AvecIcone icone={Phone}>
                <input type="tel" value={form.telephone} onChange={(e) => maj("telephone", e.target.value)} placeholder="+224 620 00 00 00" className={`${CHAMP} pl-10`} />
              </AvecIcone>
            </Champ>
          </div>

          <Champ libelle="Rôle dans l'établissement" aide="Attribué par la direction de l'établissement.">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100/80 border border-slate-200 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
              <span className="text-xs font-bold text-slate-800">{role}</span>
              <span className="ml-auto text-[10px] text-slate-400 uppercase font-semibold">Non modifiable</span>
            </div>
          </Champ>
        </div>
      </Carte>

      <div className="flex justify-end pt-2">
        <BoutonEnregistrer libelle="Mettre à jour le profil" libelleOk="Profil mis à jour" onEnregistrer={enregistrer} />
      </div>
    </div>
  );
}
