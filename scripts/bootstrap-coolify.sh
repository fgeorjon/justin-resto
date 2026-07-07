#!/usr/bin/env bash
#
# bootstrap-coolify.sh — prepare un VPS Hetzner (Ubuntu 24.04) pour heberger
# les sites de restaurants via Coolify (PaaS auto-heberge).
#
# >>> A LANCER PAR PAPA, une seule fois, en root, sur un VPS neuf. <<<
#   ssh root@<IP_DU_VPS>
#   bash bootstrap-coolify.sh <ton-email-admin>
#
# Ce que fait le script :
#   1. Met a jour le systeme
#   2. Cree un utilisateur non-root "deploy" (sudo) — on n'utilise plus root
#   3. Durcit SSH (pas de login root, pas de mot de passe — cle uniquement)
#   4. Pare-feu UFW : 22 / 80 / 443 seulement
#   5. Fail2ban (protege le SSH du bruteforce)
#   6. Installe Coolify (qui installe Docker tout seul)
#
set -euo pipefail

ADMIN_EMAIL="${1:-}"
if [[ -z "$ADMIN_EMAIL" ]]; then
  echo "Usage: bash bootstrap-coolify.sh <ton-email-admin>"
  exit 1
fi

echo "==> 1/6 Mise a jour du systeme"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y && apt-get upgrade -y
apt-get install -y ufw fail2ban curl

echo "==> 2/6 Utilisateur non-root 'deploy'"
if ! id deploy &>/dev/null; then
  adduser --disabled-password --gecos "" deploy
  usermod -aG sudo deploy
  mkdir -p /home/deploy/.ssh
  if [[ -f /root/.ssh/authorized_keys ]]; then
    cp /root/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
  fi
  chown -R deploy:deploy /home/deploy/.ssh
  chmod 700 /home/deploy/.ssh
  chmod 600 /home/deploy/.ssh/authorized_keys 2>/dev/null || true
fi

echo "==> 3/6 Durcissement SSH (cle uniquement)"
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh || systemctl restart sshd

echo "==> 4/6 Pare-feu UFW"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "==> 5/6 Fail2ban"
systemctl enable --now fail2ban

echo "==> 6/6 Installation de Coolify"
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

echo ""
echo "======================================================================"
echo " TERMINE."
echo " 1. Ouvre  http://<IP_DU_VPS>:8000  dans ton navigateur"
echo " 2. Cree le compte admin ($ADMIN_EMAIL)"
echo " 3. Configure le DNS wildcard puis ajoute une application par restaurant"
echo "    depuis un depot Git (build 'Static' Astro, dossier de sortie: dist)."
echo " NB : reconnecte-toi desormais en  ssh deploy@<IP>  (root est ferme)."
echo "======================================================================"
