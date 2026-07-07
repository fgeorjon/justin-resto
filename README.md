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

**Cas fréquent : la box a déjà nginx en frontal (ports 80/443 pris).** C'est le
cas de `65.109.55.242`. On **n'utilise pas Caddy** (il ne peut pas prendre les
ports) : on sert les sites statiques directement via nginx + certbot. Il suffit
que Node 20 soit présent pour builder (déjà installé si `server-setup.sh` a
tourné). Si Caddy avait été installé/activé, désactive-le pour éviter le bruit :
```bash
sudo systemctl disable --now caddy
```
Puis passe directement au déploiement avec **`deploy-site-nginx.sh`** (étape 3).

**Box vierge (rien sur 80/443) :** là on peut utiliser Caddy —
```bash
sudo bash scripts/server-setup.sh   # installe Node 20 + Caddy, idempotent, non destructif
```
et déployer avec `deploy-site.sh`. Pense à mettre ton email dans `/etc/caddy/Caddyfile`.

### 2. DNS wildcard (une fois) — Cloudflare, `veratrace.net`
Ajoute un wildcard **DNS only (nuage GRIS)** :

| Type | Name | Content | Proxy | TTL |
|---|---|---|---|---|
| A | `*.test` | `65.109.55.242` | **DNS only (gris)** | Auto |
| A | `test` | `65.109.55.242` | **DNS only (gris)** | Auto |

`justin.test.veratrace.net`, `luigi.test.veratrace.net`… résolvent alors sur la
box, et Caddy émet le certificat HTTPS au premier accès.

> **Pourquoi gris et pas orange (proxy) ?** Le proxy Cloudflare intercepte les
> ports 80/443 → le challenge Let's Encrypt de Caddy échoue. Et l'Universal SSL
> gratuit ne couvre qu'**un** niveau (`*.veratrace.net`), pas deux
> (`justin.test.veratrace.net`). En DNS-only, le trafic va direct à la box, Caddy
> gère le TLS, et toute profondeur de nom marche. Laisse l'apex `veratrace.net`
> en orange s'il sert à autre chose.

### 3. Déployer / mettre à jour un resto

**Box avec nginx en frontal (ex. `65.109.55.242`)** — sert via nginx + certbot :
```bash
sudo LE_EMAIL=toi@exemple.fr bash scripts/deploy-site-nginx.sh \
  justin.test.veratrace.net \
  https://github.com/fgeorjon/justin-resto main
```
Écrit un fichier isolé `/etc/nginx/conf.d/<host>.conf` (routé par `server_name`,
**n'altère aucun bloc existant**), obtient le certificat en mode `certonly`.
Pour retirer un site : `rm /etc/nginx/conf.d/<host>.conf && systemctl reload nginx`.

**Box vierge (Caddy)** :
```bash
sudo bash scripts/deploy-site.sh \
  luigi.test.veratrace.net \
  https://github.com/fgeorjon/justin-resto main
```

Les deux sont **idempotents** : la même commande déploie *et* redéploie après un
commit de Justin. Avec claude-code sur la box, il suffit de lui dire « redéploie
justin » — il relance le script.

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
