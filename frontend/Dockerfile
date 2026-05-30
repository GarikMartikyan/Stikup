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
# Tailwind v4's engine (@tailwindcss/oxide) ships its native binary as a
# PLATFORM-SPECIFIC optional dependency. The committed package-lock.json
# is generated on macOS/arm64, so it pins those optionals to darwin-arm64.
# Both `npm ci` and `npm install` HONOR that locked tree when the lockfile
# is present — so the linux-x64 native (oxide-linux-x64-gnu/*.node) is
# never installed and `next build` crashes with "Cannot find module".
# Removing the lockfile lets npm re-resolve optionals for THIS build
# platform (amd64 on the droplet). Reproducibility within the image is
# unaffected — we build one image per platform. Verified: this produces
# @tailwindcss/oxide-linux-x64-gnu/tailwindcss-oxide.linux-x64-gnu.node.
RUN rm -f package-lock.json \
 && npm install --include=dev --workspaces --include-workspace-root --no-audit --no-fund
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
