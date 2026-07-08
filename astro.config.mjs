import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Sortie 100% statique : rapide, pas de serveur Node, deploiement simple
// (Caddy/Nginx sert directement le dossier dist/).
export default defineConfig({
  site: 'https://mollyjeffersonpizza-sannois.fr',
  vite: {
    plugins: [tailwindcss()],
  },
});
