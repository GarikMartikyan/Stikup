# =====================================================================
#  Frontend image — build context is the REPO ROOT.
#
#  This is an npm-workspaces monorepo with a single root package-lock.json,
#  so the Docker build must run from the repo root to see the lockfile.
#  In docker-compose this is:
#      build:
#        context: .
#        dockerfile: frontend/Dockerfile
# =====================================================================

# ---- deps: reproducible install from the root lockfile ----
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN npm ci

# ---- build: compile Next.js ----
FROM node:22-bookworm-slim AS build
# NEXT_PUBLIC_* and BACKEND_URL must be present at build time:
# NEXT_PUBLIC_* is inlined into the client bundle; BACKEND_URL is read by next.config.
ARG BACKEND_URL=http://backend:3131
ENV BACKEND_URL=$BACKEND_URL
ARG NEXT_PUBLIC_TELEGRAM_BOT_URL=https://t.me/stikup_bot
ENV NEXT_PUBLIC_TELEGRAM_BOT_URL=$NEXT_PUBLIC_TELEGRAM_BOT_URL
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
# shared/ holds generated OpenAPI types imported by the frontend via a
# repo-root relative path (frontend/src/lib/api-types.ts). It is NOT an
# npm workspace — just a plain dir — so it must be copied explicitly.
COPY shared ./shared
COPY frontend ./frontend
RUN cd frontend && npm run build

# ---- runtime ----
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/frontend ./frontend
EXPOSE 3000
WORKDIR /app/frontend
CMD ["npm", "run", "start"]
