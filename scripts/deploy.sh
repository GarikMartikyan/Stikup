#!/usr/bin/env bash
# =====================================================================
#  Stikup — production deploy (run on the droplet)
#
#    cd /opt/stikup && bash scripts/deploy.sh
#
#  Pulls the latest code, (re)builds the images, and brings the prod
#  stack up. Reads config from .env.production (committed) overlaid with
#  .env.production.local (server-only secrets).
#
#  Idempotent: safe to re-run for every deploy.
# =====================================================================
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/stikup}"
BRANCH="${BRANCH:-main}"
COMPOSE_FILE="docker-compose.prod.yml"

log() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }

cd "${APP_DIR}"

# --- Preflight: secrets present and filled ---------------------------
if [ ! -f .env.production.local ]; then
  echo "Missing .env.production.local — run scripts/server-bootstrap.sh first and fill in secrets." >&2
  exit 1
fi
for key in POSTGRES_PASSWORD TELEGRAM_BOT_TOKEN GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET ACME_EMAIL; do
  val="$(grep -E "^${key}=" .env.production.local | head -1 | cut -d= -f2-)"
  if [ -z "${val}" ]; then
    echo "Secret ${key} is empty in .env.production.local — fill it in before deploying." >&2
    exit 1
  fi
done

# --- Preflight: domain wired into the committed prod env -------------
if grep -q "YOUR_DOMAIN" .env.production; then
  echo "Placeholder YOUR_DOMAIN still present in .env.production." >&2
  echo "Set your real domain there before deploying (Claude does this with your domain)." >&2
  exit 1
fi

log "Pulling latest code (${BRANCH})"
git fetch origin "${BRANCH}"
git checkout "${BRANCH}"
git pull --ff-only origin "${BRANCH}"

ENV_ARGS=(--env-file .env.production --env-file .env.production.local)

log "Building images"
docker compose "${ENV_ARGS[@]}" -f "${COMPOSE_FILE}" build

log "Starting the stack"
docker compose "${ENV_ARGS[@]}" -f "${COMPOSE_FILE}" up -d

log "Pruning dangling images"
docker image prune -f >/dev/null 2>&1 || true

log "Current status"
docker compose "${ENV_ARGS[@]}" -f "${COMPOSE_FILE}" ps

cat <<NEXT

Deployed. Useful commands:
  docker compose ${ENV_ARGS[*]} -f ${COMPOSE_FILE} logs -f backend
  docker compose ${ENV_ARGS[*]} -f ${COMPOSE_FILE} logs -f caddy     # watch TLS cert issuance
  docker compose ${ENV_ARGS[*]} -f ${COMPOSE_FILE} ps

First boot: Caddy fetches the HTTPS cert from Let's Encrypt (needs DNS
pointing at this droplet + ports 80/443 open). Give it ~30s, then visit
your domain.
NEXT
