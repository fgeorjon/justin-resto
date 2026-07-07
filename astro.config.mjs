import { defineConfig } from 'astro/config';

// Sortie 100% statique (defaut Astro) -> un dossier `dist/` que Coolify sert
// derriere son CDN/Nginx. Pas de serveur Node a faire tourner : rapide, robuste,
// quasi zero surface d'attaque (pas de base de donnees, pas d'admin).
export default defineConfig({
  // Remplace par l'URL finale du resto (sous-domaine ou domaine propre).
  // Sert au SEO (balises canonical, sitemap).
  site: 'https://justin.test.veratrace.net',
});
