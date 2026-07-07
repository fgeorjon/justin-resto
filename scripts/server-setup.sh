#!/usr/bin/env bash
#
# server-setup.sh — prepare un serveur EXISTANT (reutilise) pour heberger les
# sites resto statiques via Caddy (reverse-proxy + HTTPS automatique).
#
# >>> Concu pour une box DEJA isolee/securisee, avec claude-code dessus. <<<
# Idempotent et NON destructif : n'installe que ce qui manque, ne touche NI au
# SSH, NI au firewall, NI a root. A lancer une fois, en root.
#
#   sudo bash scripts/server-setup.sh
#
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "X  Lance en root (ou: sudo bash $0)"; exit 1; }
export DEBIAN_FRONTEND=noninteractive

echo "==> Node.js 20 (necessaire pour builder Astro)"
node_major="$(command -v node >/dev/null && node -v | sed 's/v\([0-9]*\).*/\1/' || echo 0)"
if [[ "$node_major" -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
echo "    node $(node -v)"

echo "==> Caddy (serveur web + certificats HTTPS auto)"
if ! command -v caddy >/dev/null; then
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update && apt-get install -y caddy
fi
echo "    $(caddy version | head -1)"

echo "==> Arborescence"
mkdir -p /srv/sites /etc/caddy/sites

# Caddyfile de base : importe chaque vhost depuis /etc/caddy/sites/*.caddy.
# On ne l'ecrase PAS s'il importe deja notre dossier (respect d'une conf existante).
if ! grep -q '/etc/caddy/sites/\*.caddy' /etc/caddy/Caddyfile 2>/dev/null; then
  if [[ -s /etc/caddy/Caddyfile ]]; then
    cp /etc/caddy/Caddyfile "/etc/caddy/Caddyfile.bak.$(date +%s 2>/dev/null || echo old)"
    echo "!!  Caddyfile existant sauvegarde en .bak — verifie qu'il n'y a pas de conflit."
  fi
  cat > /etc/caddy/Caddyfile <<'EOF'
{
	# Email pour Let's Encrypt — REMPLACE par le tien.
	email admin@example.com
}

# Chaque resto = un fichier dans /etc/caddy/sites/ (ecrit par deploy-site.sh)
import /etc/caddy/sites/*.caddy
EOF
fi

echo "==> Verification des ports 80/443"
for p in 80 443; do
  if ss -ltnp 2>/dev/null | grep -q ":$p "; then
    echo "!!  Port $p deja utilise :"
    ss -ltnp | grep ":$p " || true
    echo "    Caddy en a besoin. Fais cohabiter/libere avant de servir des sites."
  fi
done

systemctl enable --now caddy
caddy validate --config /etc/caddy/Caddyfile 2>/dev/null && systemctl reload caddy || systemctl restart caddy

echo ""
echo "OK  Serveur pret. Deploie un resto :"
echo "    sudo bash scripts/deploy-site.sh <hostname> <git-url> [branche]"
