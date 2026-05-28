/**
 * Frontend runtime configuration.
 *
 * All env vars are loaded from the repo-root `.env` via `dotenv-cli` (wired
 * into the workspace npm scripts). Do not create `frontend/.env`.
 */

/**
 * Backend origin used by server components (SSR) for direct fetches.
 * In the browser, the rewrites in `next.config.ts` handle this via
 * `/auth/*` and `/api/*`, so the browser should NOT hit BACKEND_URL directly.
 */
export const BACKEND_URL =
  process.env.BACKEND_URL ?? "http://localhost:3131";

/**
 * Name of the session cookie set by the backend.
 * Mirrors `cookieName` in `backend/src/config/session.config.ts`
 * (env var: `SESSION_COOKIE_NAME`, default `sid`). Keep in sync.
 */
export const SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME ?? "sid";

/**
 * Telegram bot URL shown on the login/register pages.
 * Must be a NEXT_PUBLIC_ var so the browser can read it.
 * Falls back to a sensible stub so the button renders in dev without config.
 */
export const TELEGRAM_BOT_URL =
  process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL ?? "https://t.me/stikup_bot";
