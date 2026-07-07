#!/usr/bin/env bash
#
# auto-deploy-cron.sh — redeploiement automatique par polling (sans webhook).
#
# Parcourt tous les sites deployes sous /srv/sites/, et pour chacun : si la
# branche suivie a de nouveaux commits sur origin, fait git pull + rebuild.
#
# >>> NE TOUCHE PAS a nginx. <<< Un changement de contenu = de nouveaux fichiers
# dans dist/, que nginx sert instantanement. Aucun reload -> prod jamais secouee.
# (Le premier deploiement d'un site, lui, passe par deploy-site-nginx.sh : conf
#  + certificat + reload. Ici on ne gere QUE les mises a jour de contenu.)
#
# Concu pour tourner en cron (toutes les ~3 min). Idempotent. Logue dans
# /var/log/justin-autodeploy.log.
#
# Installation (une fois, depuis le repo outil) : voir README § Auto-deploy.
#
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "X  root requis"; exit 1; }

LOG=/var/log/justin-autodeploy.log
ts() { date '+%Y-%m-%d %H:%M:%S'; }

shopt -s nullglob
for dir in /srv/sites/*/; do
  [[ -d "$dir/.git" ]] || continue
  host="$(basename "$dir")"
  branch="$(git -C "$dir" rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)"

  if ! git -C "$dir" fetch --quiet --depth 1 origin "$branch" 2>>"$LOG"; then
    echo "$(ts) [$host] fetch KO" >>"$LOG"
    continue
  fi

  local_sha="$(git -C "$dir" rev-parse HEAD 2>/dev/null || echo x)"
  remote_sha="$(git -C "$dir" rev-parse FETCH_HEAD 2>/dev/null || echo y)"
  [[ "$local_sha" == "$remote_sha" ]] && continue   # rien de neuf

  echo "$(ts) [$host] changement detecte ($local_sha -> $remote_sha), rebuild" >>"$LOG"
  {
    git -C "$dir" reset --hard "$remote_sha"
    cd "$dir"
    npm ci --no-audit --no-fund
    npm run build
    [[ -f "$dir/dist/index.html" ]] || { echo "build sans index.html"; exit 1; }
    chmod -R a+rX "$dir/dist"
  } >>"$LOG" 2>&1 && echo "$(ts) [$host] OK" >>"$LOG" \
                  || echo "$(ts) [$host] ECHEC rebuild (dist precedent conserve)" >>"$LOG"
done
