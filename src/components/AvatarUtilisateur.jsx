import { useState } from "react";

function initiales(nom) {
  if (!nom) return "U";
  return nom.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() || "").join("");
}

// Photo de profil de l'utilisateur, ou ses initiales sur `fond` si pas de photo (ou lien expire).
// `className` fixe la taille, l'arrondi et la taille du texte.
export default function AvatarUtilisateur({ nom, photoUrl, className = "", fond = "linear-gradient(135deg, #0C447C 0%, #1a6bb5 100%)", classeFond = "" }) {
  const [enErreur, setEnErreur] = useState(null);
  if (photoUrl && enErreur !== photoUrl) {
    return <img src={photoUrl} alt={nom || "Photo de profil"} onError={() => setEnErreur(photoUrl)} className={`shrink-0 object-cover ${className}`} />;
  }
  return (
    <span style={classeFond ? undefined : { background: fond }} className={`shrink-0 flex items-center justify-center text-white font-bold ${classeFond} ${className}`}>
      {initiales(nom)}
    </span>
  );
}
