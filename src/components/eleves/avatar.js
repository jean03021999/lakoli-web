// Couleur d'avatar stable, deduite du nom.
const COULEURS_AVATAR = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-indigo-100 text-indigo-700",
];

export function couleurAvatar(nom) {
  let h = 0;
  for (const c of nom || "") h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return COULEURS_AVATAR[h % COULEURS_AVATAR.length];
}

export function initiales(nom, prenom) {
  return `${nom?.[0] || ""}${prenom?.[0] || ""}`.toUpperCase();
}
