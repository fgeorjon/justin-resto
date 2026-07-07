import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

/**
 * Charge et type le contenu edite dans `content/site.yaml`.
 *
 * Le schema est volontairement calque sur les modules micro-site VeraTrace
 * (hero / hours / map / gallery / socials / form / text+links pour la carte),
 * pour que `scripts/import-to-veratrace.mjs` puisse "rebrancher" un site vers
 * la plateforme en une commande, sans reecrire le contenu.
 */

export type Theme = 'foret' | 'creme' | 'noir';

export interface Plat {
  nom: string;
  prix?: string;
  description?: string;
  /** Slug du passeport VeraTrace de l'ingredient (couche preuve, optionnel). */
  passportSlug?: string;
}
export interface Categorie {
  categorie: string;
  plats: Plat[];
}
export interface Horaire {
  jours: string;
  heures: string;
}
export interface SiteContent {
  restaurant: {
    nom: string;
    slogan?: string;
    theme?: Theme;
    telephone?: string;
    email?: string;
    adresse?: string;
    mapsUrl?: string;
  };
  horaires?: Horaire[];
  menu?: Categorie[];
  galerie?: string[];
  reseaux?: Record<string, string>;
  reservation?: { active?: boolean; titre?: string; message?: string };
  veratrace?: { ref?: string; micrositeSlug?: string };
}

const THEMES: Theme[] = ['foret', 'creme', 'noir'];

const file = path.resolve(process.cwd(), 'content/site.yaml');
const raw = parse(fs.readFileSync(file, 'utf8')) as SiteContent;

// Garde-fou : un theme inconnu retombe sur "creme" plutot que de casser le rendu.
if (!raw.restaurant?.theme || !THEMES.includes(raw.restaurant.theme)) {
  raw.restaurant.theme = 'creme';
}

export const site: SiteContent = raw;

/** Liste des reseaux non vides, pour l'affichage. */
export function activeSocials(s: SiteContent): Array<{ platform: string; url: string }> {
  return Object.entries(s.reseaux ?? {})
    .filter(([, url]) => typeof url === 'string' && url.trim() !== '')
    .map(([platform, url]) => ({ platform, url }));
}
