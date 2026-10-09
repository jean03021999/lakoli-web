import { useEffect, useState } from "react";

// Actualisation automatique des donnees affichees, sans F5 : renvoie un compteur qui augmente
// toutes les 30 secondes tant que la page est visible, et au retour sur la fenetre ou l'onglet
// (paiement saisi sur un autre poste, dans un autre onglet...). Rien quand l'onglet est cache ou
// la connexion coupee. A ajouter aux dependances du chargement de la page, qui se refait alors en
// silence (sans sablier ni message efface).
const INTERVALLE = 30000;
const ECART_MINIMUM = 5000;

export default function useActualisation(intervalle = INTERVALLE) {
  const [compteur, setCompteur] = useState(0);

  useEffect(() => {
    let dernier = Date.now();
    const actualiser = () => {
      if (document.visibilityState !== "visible" || !navigator.onLine) return;
      // Retour sur la fenetre : « focus » et « visibilitychange » arrivent ensemble.
      if (Date.now() - dernier < ECART_MINIMUM) return;
      dernier = Date.now();
      setCompteur((c) => c + 1);
    };
    const minuterie = setInterval(actualiser, intervalle);
    window.addEventListener("focus", actualiser);
    document.addEventListener("visibilitychange", actualiser);
    return () => {
      clearInterval(minuterie);
      window.removeEventListener("focus", actualiser);
      document.removeEventListener("visibilitychange", actualiser);
    };
  }, [intervalle]);

  return compteur;
}
