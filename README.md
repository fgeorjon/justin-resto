# justin-resto — template de site de restaurant

Un site de restaurant clé en main : rapide, responsive, et qui se met à jour tout
seul quand on change **un seul fichier**. C'est l'actif de départ pour créer des
sites de restos.

Sous le capot, le contenu est **aligné sur les micro-sites VeraTrace** : quand un
resto veut la « couche preuve » (traçabilité des ingrédients), on le rebranche
vers la plateforme en une commande — sans rien réécrire.

---

## 👦 Pour Justin — créer / modifier un site

Tu n'as besoin de toucher **qu'un seul fichier** : [`content/site.yaml`](content/site.yaml).

### Modifier un resto existant
1. Ouvre `content/site.yaml` sur GitHub (clique sur le fichier, puis le crayon ✏️).
2. Change le texte entre guillemets `"..."` (nom, horaires, plats, prix…).
3. En bas, clique **Commit changes**. Le site se reconstruit tout seul en ~1 min.

**Règles d'or :**
- Garde toujours les guillemets `"  "` autour du texte.
- Ne casse pas les espaces en début de ligne (l'alignement compte en YAML).
- Une ligne qui commence par `#` est un commentaire : elle est ignorée.

### Ajouter les photos
Dépose les photos dans le dossier `public/photos/`, puis mets leur chemin dans
`galerie:` (ex. `"/photos/salle.jpg"`).

### Créer un site pour un NOUVEAU resto
En haut de la page GitHub du repo, bouton vert **« Use this template » → « Create a
new repository »**. Ça crée une copie (ex. `pizza-luigi`) que tu personnalises.
Préviens papa : il branche la copie sur l'hébergement en 2 minutes.

---

## 👨 Pour papa — hébergement & ops

### Stack
Astro (sortie 100 % statique) → servi par **Caddy** (reverse-proxy + HTTPS auto).
Un resto = un dossier `/srv/sites/<host>/dist` + un vhost Caddy = un sous-domaine
`*.sites.<domaine>` (ou un domaine propre au resto).

> **Option A — serveur réutilisé + Caddy (le setup actuel : `65.109.55.242`, avec
> claude-code sur la box).** Recommandé ici : léger, non intrusif, l'agent sur la
> machine pilote les déploiements. **Ne PAS lancer `bootstrap-coolify.sh` sur une
> box réutilisée** — il durcit SSH / active UFW / installe Coolify et peut couper
> ta session ou entrer en conflit avec l'existant. Utilise les scripts ci-dessous.
>
> **Option B — VPS neuf dédié + Coolify (UI web).** Voir `scripts/bootstrap-coolify.sh`
> (durcissement + Coolify) si tu préfères un PaaS avec interface graphique.

### 1. Préparer la box (une fois) — Option A
Depuis claude-code **sur `65.109.55.242`**, dans le repo cloné :
```bash
sudo bash scripts/server-setup.sh   # installe Node 20 + Caddy, idempotent, non destructif
```
Le script vérifie que les ports 80/443 sont libres et n'écrase pas une conf Caddy
existante (backup `.bak`). Pense à mettre ton email dans `/etc/caddy/Caddyfile`.

### 2. DNS wildcard (une fois)
```
A   *.sites   65.109.55.242
A   sites     65.109.55.242
```
N'importe quel `xxx.sites.<domaine>` pointe alors sur la box ; Caddy émet le
certificat HTTPS automatiquement au premier accès.

### 3. Déployer / mettre à jour un resto
```bash
sudo bash scripts/deploy-site.sh \
  luigi.sites.tondomaine.fr \
  https://github.com/fgeorjon/justin-resto main
```
Clone/pull + build + vhost Caddy + reload. **Idempotent** : la même commande sert
à déployer *et* à redéployer après un commit de Justin. Avec claude-code sur la
box, il suffit de lui dire « redéploie luigi » — il relance ce script.

### 4. Rebrancher un resto vers VeraTrace (le seam)
Quand un resto « gradue » (veut la traçabilité / devient client), on importe son
contenu comme **micro-site VeraTrace natif** :

```bash
cp .env.example .env         # puis renseigne VERATRACE_COOKIE
npm run import:veratrace
# -> POST/PATCH /api/microsites, publie /fr/site/<slug>
```

**Récupérer `VERATRACE_COOKIE`** : connecte-toi sur veratrace.xyz, ouvre les
DevTools (F12) → Application → Cookies → copie la ligne complète du cookie de
session (`__Secure-authjs.session-token=...` ou équivalent). Ne le commite jamais
(`.env` est gitignored).

Ce que l'import mappe automatiquement vers les modules micro-site :

| `site.yaml` | Module VeraTrace |
|---|---|
| `restaurant` (nom/slogan) | `hero` |
| `menu` (catégories/plats) | `text` (un par catégorie) |
| plats avec `passportSlug` | `links` → `/p/<slug>` (couche preuve ✓) |
| `horaires` | `hours` |
| `adresse` + `mapsUrl` | `map` |
| `telephone` / `email` | `vcard` |
| `reseaux` | `socials` |
| `reservation` | `form` (nom/email/message) |
| `galerie` | `gallery` *(URLs `media.veratrace.xyz` uniquement — les photos locales `/photos/*` sont ignorées à l'import)* |

Le `theme` (`creme` / `foret` / `noir`) est commun aux deux surfaces.

### Attribution
Chaque site porte `veratrace.ref` (défaut `justin-resto`) : les liens sortants
vers VeraTrace ajoutent `?ref=...`, pour tracer le canal si un restaurateur
s'inscrit.

---

## Développer en local (optionnel)
```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # génère dist/
```
