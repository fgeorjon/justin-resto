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
Astro (sortie 100 % statique) → hébergé sur **Coolify** (PaaS auto-hébergé) sur un
**VPS Hetzner dédié**, séparé du cluster RKE2. Un resto = un repo = une app Coolify
= un sous-domaine `*.sites.veratrace.xyz` (ou un domaine propre au resto).

### 1. Monter le VPS (une fois)
```bash
# VPS Hetzner CX22, Ubuntu 24.04, clé SSH ajoutée à la création
ssh root@<IP>
bash scripts/bootstrap-coolify.sh ton-email@exemple.fr
# -> durcit SSH + UFW + fail2ban, installe Coolify. UI sur http://<IP>:8000
```

### 2. DNS wildcard (une fois)
```
A   *.sites   <IP_DU_VPS>
A   sites     <IP_DU_VPS>
```
N'importe quel `xxx.sites.veratrace.xyz` pointe alors sur le VPS ; Coolify gère
le HTTPS (Let's Encrypt) automatiquement.

### 3. Ajouter un resto (2 min par client)
Dans Coolify : **New Resource → Public/Private Repository →** ce repo (ou la copie).
- Build pack : **Static** (Astro). Install : `npm ci`. Build : `npm run build`.
  Dossier de sortie : `dist`.
- Domaine : `pizza-luigi.sites.veratrace.xyz` (ou le domaine du resto).
- Chaque `git push` redéploie automatiquement.

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
