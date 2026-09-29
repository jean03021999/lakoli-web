// Service worker LAKOLI : l'application (pages, scripts, styles, icones, polices, logo de
// l'etablissement) s'ouvre meme sans reseau. Les donnees de l'API ne sont jamais mises en cache
// ici : elles restent toujours lues sur le serveur.
//
// Changer VERSION a chaque evolution de ce fichier : les anciens caches sont alors supprimes.

const VERSION = "lakoli-v1";
const CACHE_APP = `${VERSION}-app`;
const CACHE_RESSOURCES = `${VERSION}-ressources`;

// Coquille minimale disponible des l'installation (les scripts et styles, dont les noms changent
// a chaque version, sont ajoutes au premier chargement).
const COQUILLE = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icones/icone-64.png",
  "/icones/icone-192.png",
  "/icones/icone-512.png",
  "/icones/apple-touch-icon.png",
  "/images/login-bg.jpeg",
];

self.addEventListener("install", (evenement) => {
  evenement.waitUntil(
    caches.open(CACHE_APP).then((cache) => cache.addAll(COQUILLE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (evenement) => {
  evenement.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.filter((c) => !c.startsWith(VERSION)).map((c) => caches.delete(c))))
      .then(() => self.clients.claim())
  );
});

// Reseau d'abord, copie en cache en secours (pages : on veut toujours la derniere version).
async function reseauPuisCache(requete, cleSecours) {
  const cache = await caches.open(CACHE_APP);
  try {
    const reponse = await fetch(requete);
    if (reponse.ok) cache.put(cleSecours || requete, reponse.clone());
    return reponse;
  } catch {
    return (await cache.match(cleSecours || requete)) || (await cache.match("/index.html")) || Response.error();
  }
}

// Cache d'abord (fichiers dont le nom change a chaque version, polices, logo) ; mise a jour en
// arriere-plan pour les ressources non versionnees.
async function cachePuisReseau(requete, rafraichir) {
  const cache = await caches.open(CACHE_RESSOURCES);
  const enCache = await cache.match(requete);
  const telecharger = () =>
    fetch(requete)
      .then((reponse) => {
        if (reponse.ok || reponse.type === "opaque") cache.put(requete, reponse.clone());
        return reponse;
      })
      .catch(() => null);
  if (enCache) {
    if (rafraichir) telecharger();
    return enCache;
  }
  return (await telecharger()) || Response.error();
}

self.addEventListener("fetch", (evenement) => {
  const requete = evenement.request;
  if (requete.method !== "GET") return;
  const url = new URL(requete.url);

  // Navigation dans l'application (toutes les routes renvoient index.html).
  if (requete.mode === "navigate" && url.origin === self.location.origin) {
    evenement.respondWith(reseauPuisCache(requete, "/index.html"));
    return;
  }

  // Scripts et styles de l'application : noms uniques par version, jamais modifies.
  if (url.origin === self.location.origin && url.pathname.startsWith("/assets/")) {
    evenement.respondWith(cachePuisReseau(requete, false));
    return;
  }

  // Autres fichiers de l'application (icones, images, manifeste).
  if (url.origin === self.location.origin) {
    evenement.respondWith(cachePuisReseau(requete, true));
    return;
  }

  // Polices Google (Parametres > Apparence).
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    evenement.respondWith(cachePuisReseau(requete, url.hostname === "fonts.googleapis.com"));
    return;
  }

  // Logo de l'etablissement (route publique de l'API) : affiche meme hors ligne.
  if (/\/api\/etablissements\/\d+\/logo$/.test(url.pathname)) {
    evenement.respondWith(cachePuisReseau(requete, false));
  }
  // Tout le reste (API, photos signees...) : reseau uniquement, sans intervention.
});
