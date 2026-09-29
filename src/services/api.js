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

export default api;
