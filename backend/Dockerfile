# =====================================================================
#  Backend image — build context is the REPO ROOT.
#
#  npm-workspaces monorepo: a single root package-lock.json, and per-
#  workspace binaries (prisma, nest, ...) install into the workspace's
#  own node_modules/.bin. We therefore install AND compile in the same
#  stage, so those workspace-local node_modules are present for the
#  build (a cross-stage copy of only the root node_modules would drop
#  them, which is what broke prisma/nest earlier).
#
#  In docker-compose:
#      build:
#        context: .
#        dockerfile: backend/Dockerfile
# =====================================================================

# ---- build: install all deps + generate Prisma client + compile Nest ----
FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
# npm ci needs the root manifest + every workspace manifest.
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN npm ci --include=dev
# Source copied AFTER install: Docker COPY merges (it does not delete the
# node_modules created above), so the deps layer stays cached and the
# workspace-local node_modules survive.
COPY backend ./backend
# Local prisma (v6) is now on PATH, so npx uses it instead of fetching v7.
RUN cd backend && npx prisma generate && npm run build

# ---- runtime ----
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates python3 python3-pip \
 && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
# Includes backend/node_modules (workspace-local deps) + dist + prisma schema.
COPY --from=build /app/backend ./backend
# Debian 12's python3 is PEP 668 externally-managed; --break-system-packages is the
# leanest fix here (no venv, no extra layers) for a single-purpose container.
RUN pip3 install --no-cache-dir --break-system-packages -r backend/python/requirements.txt
EXPOSE 3131
WORKDIR /app/backend
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
