// Outils partages du module Caisse / Depenses.

export const COULEURS_CATEGORIES = {
  salaire: "bg-[#dbeafe] text-[#1d4ed8]",
  fournitures: "bg-amber-50 text-amber-700",
  electricite_eau: "bg-sky-50 text-sky-700",
  entretien: "bg-orange-50 text-orange-700",
  transport: "bg-violet-50 text-violet-700",
  communication: "bg-cyan-50 text-cyan-700",
  loyer: "bg-rose-50 text-rose-700",
  evenement: "bg-pink-50 text-pink-700",
  administratif: "bg-slate-100 text-slate-700",
  autre: "bg-slate-100 text-slate-600",
};

export const CHAMP = "w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0C447C]/15 focus:border-[#0C447C]";
export const TYPES_PIECES = ".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf";
export const TAILLE_MAX_PIECE = 5 * 1024 * 1024;

export function aujourdhui() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function tailleLisible(octets) {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${(octets / 1024 / 1024).toFixed(1).replace(".", ",")} Mo`;
}

// Controle local des fichiers choisis (format, 5 Mo, 5 fichiers) avant l'envoi.
export function verifierPieces(fichiers) {
  if (fichiers.length > 5) return "5 fichiers au maximum par envoi.";
  for (const f of fichiers) {
    if (!/\.(jpe?g|png|webp|pdf)$/i.test(f.name)) return `« ${f.name} » : formats acceptés JPG, PNG, WebP ou PDF.`;
    if (f.size > TAILLE_MAX_PIECE) return `« ${f.name} » dépasse 5 Mo.`;
  }
  return "";
}
