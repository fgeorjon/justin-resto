#!/usr/bin/env bash
#
# deploy-site-nginx.sh <hostname> <git-url> [branche]
#
# Pour une box qui a DEJA nginx en frontal (ports 80/443 pris — ex. un serveur
# de prod). Sert le site resto STATIQUE directement via nginx, HTTPS par certbot
# (Let's Encrypt, mode certonly : on ne laisse PAS certbot editer ta conf nginx).
#
# ADDITIF et reversible : ecrit UN fichier isole /etc/nginx/conf.d/<host>.conf,
# route par server_name — ne touche a aucun bloc existant. Pour annuler un site :
#   rm /etc/nginx/conf.d/<host>.conf && systemctl reload nginx
#
# Prerequis : DNS de <host> en GRIS (DNS only) qui resout vers cette box, sinon
# le challenge Let's Encrypt echoue. Email LE recommande : export LE_EMAIL=...
#
#   sudo LE_EMAIL=toi@exemple.fr bash scripts/deploy-site-nginx.sh \
#        justin.test.veratrace.net https://github.com/fgeorjon/justin-resto main
#
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "X  Lance en root (ou: sudo ... bash $0 ...)"; exit 1; }

HOST="${1:-}"; GIT="${2:-}"; BRANCH="${3:-main}"
if [[ -z "$HOST" || -z "$GIT" ]]; then
  echo "Usage: [LE_EMAIL=...] deploy-site-nginx.sh <hostname> <git-url> [branche]"
  exit 1
fi
LE_EMAIL="${LE_EMAIL:-}"
DIR="/srv/sites/$HOST"
WEBROOT="/var/www/certbot"
CONF="/etc/nginx/conf.d/$HOST.conf"

# --- Outils requis ----------------------------------------------------------
command -v nginx >/dev/null || { echo "X  nginx introuvable."; exit 1; }
if ! command -v certbot >/dev/null; then
  echo "==> Installation de certbot"
  apt-get update -y && apt-get install -y certbot
fi

# --- 1. Code : clone/pull + build ------------------------------------------
if [[ -d "$DIR/.git" ]]; then
  echo "==> Mise a jour de $HOST"
  git -C "$DIR" fetch --depth 1 origin "$BRANCH"
  git -C "$DIR" reset --hard "origin/$BRANCH"
else
  echo "==> Clone de $HOST"
  git clone --depth 1 -b "$BRANCH" "$GIT" "$DIR"
fi

echo "==> Build Astro"
( cd "$DIR" && npm ci --no-audit --no-fund && npm run build )
[[ -f "$DIR/dist/index.html" ]] || { echo "X  Build sans dist/index.html — abandon."; exit 1; }

# nginx (www-data) doit pouvoir lire les fichiers.
chmod 755 /srv /srv/sites 2>/dev/null || true
chmod -R a+rX "$DIR/dist"

# --- 2. Bloc nginx temporaire (HTTP) pour le challenge ACME -----------------
mkdir -p "$WEBROOT"
if [[ ! -f "/etc/letsencrypt/live/$HOST/fullchain.pem" ]]; then
  echo "==> Bloc HTTP temporaire + certificat Let's Encrypt"
  cat > "$CONF" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $HOST;
    location /.well-known/acme-challenge/ { root $WEBROOT; }
    location / { root $DIR/dist; index index.html; try_files \$uri \$uri/ /index.html; }
}
EOF
  nginx -t && systemctl reload nginx

  EMAIL_ARGS=(--register-unsafely-without-email)
  [[ -n "$LE_EMAIL" ]] && EMAIL_ARGS=(-m "$LE_EMAIL")
  if ! certbot certonly --webroot -w "$WEBROOT" -d "$HOST" \
        --non-interactive --agree-tos "${EMAIL_ARGS[@]}"; then
    echo "X  certbot a echoue. Verifie que le DNS de $HOST est en GRIS (DNS only)"
    echo "   et resout vers cette box, puis relance ce script."
    exit 1
  fi
fi

# --- 3. Bloc final : HTTPS + redirect 80->443 ------------------------------
echo "==> Bloc nginx final (HTTPS)"
cat > "$CONF" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $HOST;
    location /.well-known/acme-challenge/ { root $WEBROOT; }
    location / { return 301 https://\$host\$request_uri; }
}
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $HOST;

    ssl_certificate     /etc/letsencrypt/live/$HOST/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$HOST/privkey.pem;

    root $DIR/dist;
    index index.html;
    location / { try_files \$uri \$uri/ /index.html; }
    location ~* \.(?:css|js|jpg|jpeg|png|webp|svg|ico|woff2?)$ {
        expires 7d; add_header Cache-Control "public";
    }
    access_log /var/log/nginx/$HOST.access.log;
}
EOF

nginx -t || { echo "X  Conf nginx invalide — je n'ai PAS reload. Corrige/retire $CONF."; exit 1; }
systemctl reload nginx

echo ""
echo "OK  $HOST deploye derriere nginx."
echo "    -> https://$HOST"
echo "    (renouvellement du certificat : timer certbot automatique)"
