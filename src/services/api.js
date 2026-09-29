import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  // Envoi de fichier : sans cela, l'en-tete JSON par defaut fait convertir le FormData en JSON par
  // axios et le fichier est perdu. Le navigateur pose lui-meme multipart/form-data avec sa limite.
  if (config.data instanceof FormData) {
    config.headers.delete("Content-Type");
  }
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const deviceToken = localStorage.getItem("device_token");
  if (deviceToken) {
    config.headers["X-Device-Token"] = deviceToken;
  }
  return config;
});

// Lectures identiques simultanees (meme adresse, memes parametres, meme compte) : une seule
// requete part, les demandeurs partagent sa reponse. `php artisan serve` traite les requetes une
// par une, un doublon doublerait l'attente.
const adaptateurNavigateur = axios.getAdapter(axios.defaults.adapter);
const lecturesEnCours = new Map();
api.defaults.adapter = (config) => {
  if (config.method !== "get") return adaptateurNavigateur(config);
  const cle = `${config.url}|${JSON.stringify(config.params || {})}|${config.headers?.Authorization || ""}`;
  if (!lecturesEnCours.has(cle)) {
    lecturesEnCours.set(cle, adaptateurNavigateur(config).finally(() => lecturesEnCours.delete(cle)));
  }
  return lecturesEnCours.get(cle);
};

// Compteurs de la liste complete des eleves (retards, effectif) : repris par la cloche de
// l'en-tete a chaque chargement de /eleves par une page, sans nouvel appel.
export const CLE_STATS_ELEVES = "lakoli_stats_eleves";
export const EVENEMENT_STATS_ELEVES = "lakoli:stats-eleves";

api.interceptors.response.use((reponse) => {
  const { method, url, params } = reponse.config;
  if (method === "get" && url === "/eleves" && !Object.keys(params || {}).length && reponse.data?.stats) {
    try {
      sessionStorage.setItem(CLE_STATS_ELEVES, JSON.stringify({ stats: reponse.data.stats, le: Date.now() }));
    } catch {
      // stockage indisponible : la cloche fera son propre appel
    }
    window.dispatchEvent(new CustomEvent(EVENEMENT_STATS_ELEVES, { detail: reponse.data.stats }));
  }
  return reponse;
});

export default api;
