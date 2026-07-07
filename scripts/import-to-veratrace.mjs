#!/usr/bin/env node
/**
 * import-to-veratrace.mjs — "rebranche" un site resto vers la plateforme
 * VeraTrace, en creant/mettant a jour le MICRO-SITE equivalent.
 *
 * C'est le seam d'integration : le contenu edite dans content/site.yaml est
 * calque sur les modules micro-site VeraTrace, donc l'import est une simple
 * traduction — aucun contenu n'est reecrit a la main.
 *
 * >>> A LANCER PAR PAPA (operateur VeraTrace), pas par Justin. <<<
 *
 * Prerequis (variables d'environnement, cf .env.example) :
 *   VERATRACE_BASE_URL   URL de la plateforme (defaut https://veratrace.xyz)
 *   VERATRACE_COOKIE     Cookie de session d'un compte connecte (voir README)
 *   MICROSITE_SLUG       (optionnel) slug cible ; sinon derive du nom du resto
 *
 * Usage :
 *   VERATRACE_COOKIE="..." node scripts/import-to-veratrace.mjs
 *   npm run import:veratrace
 *
 * Le script :
 *   1. lit content/site.yaml
 *   2. le traduit en modules micro-site (hero/hours/map/socials/form/text...)
 *   3. POST /api/microsites   -> cree le site (idempotent : ignore SLUG_TAKEN)
 *   4. PATCH /api/microsites  -> pousse les modules + publie
 *   5. affiche l'URL publique  /site/<slug>
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

const BASE = (process.env.VERATRACE_BASE_URL ?? 'https://veratrace.xyz').replace(/\/+$/, '');
const COOKIE = process.env.VERATRACE_COOKIE ?? '';

if (!COOKIE) {
  console.error('X  VERATRACE_COOKIE manquant. Vois le README (§ Rebrancher vers VeraTrace).');
  process.exit(1);
}

// --- 1. Lecture du contenu --------------------------------------------------
const file = path.resolve(process.cwd(), 'content/site.yaml');
const site = parse(fs.readFileSync(file, 'utf8'));
const r = site.restaurant ?? {};
if (!r.nom) {
  console.error('X  content/site.yaml : "restaurant.nom" est requis.');
  process.exit(1);
}

const THEMES = ['foret', 'creme', 'noir'];
const theme = THEMES.includes(r.theme) ? r.theme : 'creme';
const SOCIAL_PLATFORMS = ['instagram', 'facebook', 'x', 'tiktok', 'linkedin', 'youtube', 'website'];

function slugify(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}
const slug = slugify(process.env.MICROSITE_SLUG || site.veratrace?.micrositeSlug || r.nom);

// --- 2. Traduction contenu -> modules micro-site ---------------------------
const modules = [];
let n = 0;
const mid = (p) => `${p}${n++}`;

modules.push({ type: 'hero', id: mid('hero'), title: r.nom, subtitle: r.slogan || undefined });

// La carte : un module "text" par categorie (le micro-site n'a pas de module
// "menu" dedie ; text est le rendu le plus fidele et lisible).
for (const cat of site.menu ?? []) {
  const lines = (cat.plats ?? []).map((p) => {
    const prix = p.prix ? `  —  ${p.prix}` : '';
    const desc = p.description ? `\n   ${p.description}` : '';
    return `${p.nom}${prix}${desc}`;
  });
  if (lines.length) modules.push({ type: 'text', id: mid('cat'), heading: cat.categorie, body: lines.join('\n\n') });
}

// Couche PREUVE : les plats traces deviennent un module "links" vers /p/<slug>.
const proofLinks = [];
for (const cat of site.menu ?? []) {
  for (const p of cat.plats ?? []) {
    if (p.passportSlug) proofLinks.push({ label: `${p.nom} — tracabilite`, url: `/p/${p.passportSlug}` });
  }
}
if (proofLinks.length) modules.push({ type: 'links', id: mid('proof'), items: proofLinks.slice(0, 20) });

// Horaires
const rows = (site.horaires ?? [])
  .filter((h) => h.jours && h.heures)
  .map((h) => ({ days: String(h.jours), time: String(h.heures) }));
if (rows.length) modules.push({ type: 'hours', id: mid('hours'), heading: 'Horaires', rows: rows.slice(0, 7) });

// Adresse / carte
if (r.adresse) modules.push({ type: 'map', id: mid('map'), label: 'Nous trouver', address: r.adresse, url: r.mapsUrl || undefined });

// Contact (vcard)
if (r.telephone || r.email) {
  modules.push({ type: 'vcard', id: mid('card'), label: 'Contact', org: r.nom, phone: r.telephone || undefined, email: r.email || undefined });
}

// Reseaux sociaux
const socials = Object.entries(site.reseaux ?? {})
  .filter(([platform, url]) => SOCIAL_PLATFORMS.includes(platform) && typeof url === 'string' && url.trim())
  .map(([platform, url]) => ({ platform, url }));
if (socials.length) modules.push({ type: 'socials', id: mid('soc'), items: socials.slice(0, 8) });

// Galerie : SEULEMENT les URLs absolues media.veratrace.xyz (contrainte CSP du
// rendu micro-site). Les photos locales /photos/* du site Astro sont ignorees ici.
const galleryImgs = (site.galerie ?? [])
  .filter((u) => typeof u === 'string' && /^https:\/\/media\.veratrace\.xyz\//.test(u))
  .map((url) => ({ url }));
const skippedImgs = (site.galerie ?? []).length - galleryImgs.length;
if (galleryImgs.length) modules.push({ type: 'gallery', id: mid('gal'), images: galleryImgs.slice(0, 12) });

// Reservation -> formulaire
if (site.reservation?.active) {
  modules.push({
    type: 'form', id: mid('resa'),
    heading: site.reservation.titre || 'Reserver une table',
    fields: [
      { id: 'nom', label: 'Nom', type: 'text', required: true },
      { id: 'email', label: 'Email', type: 'email', required: true },
      { id: 'message', label: 'Votre message (date, nombre de convives...)', type: 'textarea' },
    ],
    submitLabel: 'Envoyer',
    successMessage: 'Merci ! Nous vous recontactons rapidement.',
  });
}

// --- 3/4. Appels API --------------------------------------------------------
const headers = { 'content-type': 'application/json', cookie: COOKIE };

async function api(method, body) {
  const res = await fetch(`${BASE}/api/microsites`, { method, headers, body: JSON.stringify(body) });
  let json = {};
  try { json = await res.json(); } catch { /* corps vide */ }
  return { status: res.status, json };
}

console.log(`->  Import "${r.nom}" vers ${BASE}  (slug: ${slug}, theme: ${theme})`);
console.log(`    ${modules.length} module(s)${skippedImgs > 0 ? `, ${skippedImgs} photo(s) locale(s) ignoree(s) (voir README)` : ''}`);

const create = await api('POST', { title: r.nom, slug, theme });
if (create.status === 401) fail('Cookie invalide/expire (401). Reconnecte-toi et recopie VERATRACE_COOKIE.');
else if (create.status === 409 && create.json.code === 'QUOTA_REACHED') fail(create.json.error);
else if (create.status === 409 && create.json.code === 'SLUG_TAKEN') console.log('i   Le site existe deja, mise a jour...');
else if (create.status !== 201) fail(`Creation echouee (${create.status}): ${create.json.error ?? ''}`);

const patch = await api('PATCH', { slug, modules, theme, published: true });
if (patch.status !== 200) fail(`Publication echouee (${patch.status}): ${patch.json.error ?? ''}`);

console.log('');
console.log('OK  Micro-site publie :');
console.log(`    ${BASE}/fr/site/${slug}`);
console.log('');
console.log(`i   Pense a renseigner  veratrace.micrositeSlug: "${slug}"  dans content/site.yaml.`);

function fail(msg) { console.error(`X  ${msg}`); process.exit(1); }
