# =====================================================================
#  Backend image — build context is the REPO ROOT.
#
#  This is an npm-workspaces monorepo with a single root package-lock.json,
#  so the Docker build must run from the repo root to see the lockfile.
#  In docker-compose this is:
#      build:
#        context: .
#        dockerfile: backend/Dockerfile
# =====================================================================

# ---- deps: reproducible install from the root lockfile ----
FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
# npm ci with workspaces needs the root manifest + every workspace manifest.
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN npm ci

# ---- build: generate Prisma client + compile Nest ----
FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY backend ./backend
RUN cd backend \
 && npx prisma generate \
 && npm run build

# ---- runtime ----
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates python3 python3-pip \
 && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/backend ./backend
# Debian 12's python3 is PEP 668 externally-managed; --break-system-packages is the
# leanest fix here (no venv to source, no extra layers) for a single-purpose container.
RUN pip3 install --no-cache-dir --break-system-packages -r backend/python/requirements.txt
EXPOSE 3131
WORKDIR /app/backend
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
