import { useRef, useState } from "react";
import { User, Shield, Mail, Phone, CalendarDays, Upload, Trash2, Loader2 } from "lucide-react";
import api from "../../services/api";
import AvatarUtilisateur from "../AvatarUtilisateur";
import { Carte, Champ, AvecIcone, BoutonEnregistrer } from "./ui";
import { CHAMP, LIBELLES_ROLES, dateLongue, messageErreur } from "./outils";

// Photo de telephone (souvent 3 a 6 Mo) : reduite dans le navigateur avant l'envoi, le serveur
// n'accepte que 2 Mo. Un avatar n'a pas besoin de plus de 512 px.
const COTE_MAX_PHOTO = 512;
const TAILLE_MAX_SOURCE = 25 * 1024 * 1024;

async function reduirePhoto(fichier) {
  let image;
  try {
    image = await createImageBitmap(fichier, { imageOrientation: "from-image" });
  } catch {
    const heic = /\.(heic|heif)$/i.test(fichier.name) || /hei[cf]/i.test(fichier.type);
    throw new Error(
      heic
        ? "Format HEIC (iPhone) non pris en charge : envoyez la photo en JPG (sur l'iPhone, Réglages > Appareil photo > Formats > « Le plus compatible »)."
        : "Ce fichier n'est pas une image lisible. Formats acceptés : JPG, PNG ou WebP."
    );
  }
  const echelle = Math.min(1, COTE_MAX_PHOTO / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * echelle);
  canvas.height = Math.round(image.height * echelle);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff"; // fond blanc sous une image PNG transparente
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  image.close();
  const blob = await new Promise((ok) => canvas.toBlob(ok, "image/jpeg", 0.85));
  if (!blob) throw new Error("Impossible de préparer cette photo.");
  return new File([blob], "photo.jpg", { type: "image/jpeg" });
}

// Profil du compte connecte (tous les roles) : photo, nom, e-mail et telephone.
export default function SectionProfil({ profil, onMaj, onToast }) {
  const [form, setForm] = useState({ name: profil.name || "", email: profil.email || "", telephone: profil.telephone || "" });
  const [envoiPhoto, setEnvoiPhoto] = useState(false);
  const refFichier = useRef(null);
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

  const envoyerPhoto = async (e) => {
    const fichier = e.target.files?.[0];
    e.target.value = "";
    if (!fichier) return;
    if (fichier.size > TAILLE_MAX_SOURCE) {
      onToast("Photo trop lourde", "La photo ne doit pas dépasser 25 Mo.", "warning");
      return;
    }
    setEnvoiPhoto(true);
    let photo;
    try {
      photo = await reduirePhoto(fichier);
    } catch (err) {
      onToast("Photo refusée", err.message, "warning");
      setEnvoiPhoto(false);
      return;
    }
    const donnees = new FormData();
    donnees.append("photo", photo);
    try {
      const res = await api.post("/parametres/profil/photo", donnees);
      onMaj(res.data);
      onToast("Photo enregistrée", "Votre photo apparaît désormais dans l'en-tête et auprès du personnel.");
    } catch (err) {
      onToast("Photo refusée", messageErreur(err, "Impossible d'enregistrer cette photo."), "warning");
    } finally {
      setEnvoiPhoto(false);
    }
  };

  const supprimerPhoto = async () => {
    if (!window.confirm("Supprimer votre photo de profil ?")) return;
    try {
      const res = await api.delete("/parametres/profil/photo");
      onMaj(res.data);
      onToast("Photo supprimée", "Vos initiales remplacent la photo.", "info");
    } catch (err) {
      onToast("Suppression impossible", messageErreur(err, "Erreur lors de la suppression."), "warning");
    }
  };

  return (
    <div className="space-y-6">
      <Carte icone={User} titre="Photo de profil" description="Visible dans l'en-tête et par le personnel de l'établissement">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <input ref={refFichier} type="file" accept="image/*" onChange={envoyerPhoto} className="hidden" />
          <div className="relative">
            <AvatarUtilisateur nom={form.name} photoUrl={profil.photo_url} className="w-20 h-20 rounded-2xl text-2xl tracking-wider shadow-md border-2 border-slate-200" />
            {envoiPhoto && (
              <span className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </span>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left space-y-2">
            <p className="text-xl font-bold text-slate-900">{form.name || "—"}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">{role}</span>
              {profil.membre_depuis && (
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <CalendarDays className="w-3.5 h-3.5" />
                  Membre depuis le {dateLongue(profil.membre_depuis)}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1">
              <button
                type="button"
                disabled={envoiPhoto}
                onClick={() => refFichier.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition disabled:opacity-50 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                {envoiPhoto ? "Envoi en cours..." : profil.photo_url ? "Changer la photo" : "Ajouter une photo"}
              </button>
              {profil.photo_url && (
                <button
                  type="button"
                  disabled={envoiPhoto}
                  onClick={supprimerPhoto}
                  className="inline-flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-xl transition border border-rose-200 disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Supprimer
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400">Image carrée de préférence (JPG, PNG ou WebP). Les photos de téléphone sont réduites automatiquement.</p>
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
