import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Poste de dev : http://127.0.0.1:8080 (Caddy) renvoie l'écran ici et /api à Laravel, comme à
  // l'école (voir lakoli\deploiement\poste-developpement.ps1). Adresse et port fixes pour Caddy.
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
})
