#!/usr/bin/env bash
# =====================================================================
#  Stikup — one-time server bootstrap (Step 4)
#
#  Run ONCE on a fresh Ubuntu 24.04 DigitalOcean droplet, as root:
#
#    ssh root@YOUR_DROPLET_IP
#    curl -fsSL https://raw.githubusercontent.com/GarikMartikyan/Stikup/main/scripts/server-bootstrap.sh -o bootstrap.sh
#    bash bootstrap.sh
#
#  It installs Docker + compose, configures the firewall, clones the
#  repo, and creates a secrets stub for you to fill in. It does NOT
#  deploy — run scripts/deploy.sh after filling in secrets.
#
#  Idempotent: safe to re-run.
# =====================================================================
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/GarikMartikyan/Stikup.git}"
APP_DIR="${APP_DIR:-/opt/stikup}"
BRANCH="${BRANCH:-main}"

log() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }

if [ "$(id -u)" -ne 0 ]; then
  echo "Please run as root (you are on a fresh droplet: 'ssh root@IP')." >&2
  exit 1
fi

log "Updating apt and installing base packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates curl git ufw

log "Installing Docker Engine + compose plugin"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
else
  echo "Docker already installed: $(docker --version)"
fi
systemctl enable --now docker

log "Configuring firewall (UFW): allow SSH + HTTP + HTTPS"
ufw allow OpenSSH      || ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status verbose || true

log "Cloning the repository into ${APP_DIR}"
if [ -d "${APP_DIR}/.git" ]; then
  echo "Repo already present — pulling latest on ${BRANCH}."
  git -C "${APP_DIR}" fetch origin "${BRANCH}"
  git -C "${APP_DIR}" checkout "${BRANCH}"
  git -C "${APP_DIR}" pull --ff-only origin "${BRANCH}"
else
  git clone --branch "${BRANCH}" "${REPO_URL}" "${APP_DIR}"
fi

log "Preparing backups directory"
mkdir -p "${APP_DIR}/backups"

SECRETS_FILE="${APP_DIR}/.env.production.local"
if [ ! -f "${SECRETS_FILE}" ]; then
  log "Creating secrets stub at ${SECRETS_FILE}"
  cat > "${SECRETS_FILE}" <<'STUB'
# =====================================================================
#  PRODUCTION SECRETS — this file is gitignored. Fill in REAL values.
#  Overrides the placeholders in the committed .env.production.
# =====================================================================

# Postgres password (also used to build DATABASE_URL in compose).
POSTGRES_PASSWORD=

# Telegram bot token from @BotFather.
TELEGRAM_BOT_TOKEN=

# Google OAuth credentials (Google Cloud Console).
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Email for Let's Encrypt expiry notices (used by Caddy).
ACME_EMAIL=
STUB
  chmod 600 "${SECRETS_FILE}"
else
  echo "Secrets file already exists — leaving it untouched."
fi

log "Bootstrap complete."
cat <<NEXT

Next steps:
  1. Fill in real secrets:
       nano ${SECRETS_FILE}
  2. Make sure the committed .env.production has your real DOMAIN wired in
     (Claude does this once you provide the domain).
  3. Deploy:
       cd ${APP_DIR} && bash scripts/deploy.sh

NEXT
