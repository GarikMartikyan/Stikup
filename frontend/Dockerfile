# =====================================================================
#  Frontend image — build context is the REPO ROOT.
#
#  npm-workspaces monorepo: a single root package-lock.json, and per-
#  workspace binaries (next, dotenv-cli, ...) install into the
#  workspace's own node_modules/.bin. We install AND build in the same
#  stage so those binaries are present for `next build` (a cross-stage
#  copy of only the root node_modules would drop them — that caused the
#  earlier "dotenv: not found" failure).
#
#  In docker-compose:
#      build:
#        context: .
#        dockerfile: frontend/Dockerfile
# =====================================================================

# ---- build: install all deps + compile Next.js ----
FROM node:22-bookworm-slim AS build
# NEXT_PUBLIC_* is inlined into the client bundle; BACKEND_URL is read by next.config.
ARG BACKEND_URL=http://backend:3131
ENV BACKEND_URL=$BACKEND_URL
ARG NEXT_PUBLIC_TELEGRAM_BOT_URL=https://t.me/stikup_bot
ENV NEXT_PUBLIC_TELEGRAM_BOT_URL=$NEXT_PUBLIC_TELEGRAM_BOT_URL
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
# Install the full dependency tree from the lockfile (integrity-checked).
# Then add ONLY the platform-specific Tailwind v4 native engine: the
# committed package-lock.json is generated on macOS/arm64, so npm ci
# omits the linux-x64 optional (@tailwindcss/oxide-linux-x64-gnu), and
# `next build` would crash with "Cannot find module
# ./tailwindcss-oxide.linux-x64-gnu.node". Add the missing native for
# this (amd64) build platform with --no-save, matching the version npm ci
# installed, so the lockfile still governs the rest of the graph.
RUN npm ci --include=dev --no-audit --no-fund \
 && OXIDE_VERSION="$(node -p "require('/app/frontend/node_modules/@tailwindcss/oxide/package.json').version")" \
 && npm install --no-save --no-audit --no-fund "@tailwindcss/oxide-linux-x64-gnu@${OXIDE_VERSION}"
# shared/ holds generated OpenAPI types imported by the frontend via a
# repo-root relative path (frontend/src/lib/api-types.ts) — copy it too.
COPY shared ./shared
COPY frontend ./frontend
RUN cd frontend && npm run build

# ---- runtime ----
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
# Includes frontend/node_modules (workspace-local: next, dotenv-cli) + .next.
COPY --from=build /app/frontend ./frontend
EXPOSE 3000
WORKDIR /app/frontend
CMD ["npm", "run", "start"]
