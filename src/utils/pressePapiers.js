// Copie un texte. navigator.clipboard n'existe qu'en HTTPS ou sur 127.0.0.1 : par une adresse en
// HTTP (accès distant par Tailscale), on passe par une zone de texte temporaire.
export async function copierTexte(texte) {
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(texte);
      return true;
    } catch {
      // Refus du navigateur : on tente l'autre méthode.
    }
  }
  const zone = document.createElement("textarea");
  zone.value = texte;
  zone.setAttribute("readonly", "");
  zone.style.cssText = "position:fixed;top:0;left:0;opacity:0";
  document.body.appendChild(zone);
  zone.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    zone.remove();
  }
}
