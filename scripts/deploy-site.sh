#!/usr/bin/env bash
#
# deploy-site.sh <hostname> <git-url> [branche]
#
# Clone (ou met a jour) un repo resto, le build, et le sert via Caddy sur
# <hostname> avec HTTPS automatique. IDEMPOTENT : relance = mise a jour.
# C'est aussi la commande de "redeploiement" quand Justin a commit un changement.
#
#   sudo bash scripts/deploy-site.sh mon-resto.sites.tondomaine.fr \
#        https://github.com/fgeorjon/justin-resto main
#
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "X  Lance en root (ou: sudo bash $0 ...)"; exit 1; }

HOST="${1:-}"; GIT="${2:-}"; BRANCH="${3:-main}"
if [[ -z "$HOST" || -z "$GIT" ]]; then
  echo "Usage: deploy-site.sh <hostname> <git-url> [branche]"
  exit 1
fi

DIR="/srv/sites/$HOST"

if [[ -d "$DIR/.git" ]]; then
  echo "==> Mise a jour de $HOST"
  git -C "$DIR" fetch --depth 1 origin "$BRANCH"
  git -C "$DIR" reset --hard "origin/$BRANCH"
else
  echo "==> Clone de $HOST"
  git clone --depth 1 -b "$BRANCH" "$GIT" "$DIR"
fi

echo "==> Build Astro"
cd "$DIR"
npm ci --no-audit --no-fund
npm run build
[[ -f "$DIR/dist/index.html" ]] || { echo "X  Build sans dist/index.html — abandon."; exit 1; }

echo "==> Vhost Caddy pour $HOST"
cat > "/etc/caddy/sites/$HOST.caddy" <<EOF
$HOST {
	root * $DIR/dist
	encode gzip
	try_files {path} {path}/ /index.html
	file_server
}
EOF

caddy validate --config /etc/caddy/Caddyfile 2>/dev/null || { echo "X  Caddyfile invalide — vhost non applique."; exit 1; }
systemctl reload caddy

echo ""
echo "OK  $HOST deploye."
echo "    -> https://$HOST  (le certificat s'emet des que le DNS pointe sur cette box)"
