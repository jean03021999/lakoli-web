import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
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
