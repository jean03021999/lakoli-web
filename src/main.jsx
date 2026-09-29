import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Service worker (version de production uniquement : en developpement, il gênerait le
// rechargement a chaud de Vite) : l'application s'ouvre meme sans reseau.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

// Sans StrictMode : en developpement il execute chaque chargement de donnees deux fois, ce qui
// double l'attente avec `php artisan serve` (une requete a la fois). Aucun effet en production.
createRoot(document.getElementById('root')).render(<App />)
