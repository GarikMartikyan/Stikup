# StikUp as a Telegram Mini App — Design

**Date:** 2026-05-31
**Status:** Approved (proceeding to implementation)

## Goal

Make the existing Next.js app open **natively inside Telegram** as a Telegram
Mini App: launched from the bot, instantly signed in (no login screen), themed
to Telegram, full-height. The public website (`stikup.app`, Google/email login)
keeps working unchanged for normal browser visitors — **dual mode, one codebase,
runtime-detected.**

## Decisions (from brainstorming)

- **Depth:** Full Mini App with auto-login via Telegram `initData`.
- **Website:** Dual mode — website unchanged; Mini App behavior only inside Telegram.
- **Launch:** Persistent ☰ menu button **and** `web_app` buttons on `/start` and
  key bot replies. All set programmatically via the bot token (no BotFather steps).
- **Landing inside Telegram:** Smart home — `/my-stickers` if the user has packs,
  else `/upload`. The marketing landing page is skipped inside Telegram.
- **Entry route:** A new **public** `/app` route is the launch target (splash →
  auto-login → smart-home redirect), NOT a session-gated page.
- **Headers:** Add a scoped `frame-ancestors` CSP allowing Telegram to embed.

## Why a client-side entry route

Protected pages use `requireSession()` (`frontend/src/lib/auth/require-session.ts`)
which calls `/auth/me` server-side and `redirect("/login")` when there is no `sid`
cookie. On first Mini App open there is no cookie yet (it is minted by a
client-side `initData` POST). So the launch target must be a **public** route
that auto-logs-in on the client, then navigates. Hence `/app`.

## Architecture (one app, two modes)

```
Telegram client ──opens──> https://stikup.app/app  (menu button / web_app button)
        │
        ▼  (telegram-web-app.js loaded; window.Telegram.WebApp.initData present)
TelegramProvider: WebApp.ready()/expand(), theme sync, auto-login
        │  POST /auth/telegram/webapp { initData }
        ▼
Backend: validate HMAC → resolveOrCreate user → issue `sid` cookie (same as web)
        │
        ▼
/app splash → router.replace(/my-stickers | /upload)   (smart home)
```

A normal browser never has `initData`, so `isTelegramEnv()` is false and the app
behaves exactly as today.

---

## Backend

### 1. `telegram-initdata.validator.ts` (pure, unit-testable)

Location: `backend/src/auth/channel/telegram-initdata.validator.ts`.

`validateInitData(initData: string, botToken: string, maxAgeSec: number): { ok: true; user: TgUser; authDate: Date } | { ok: false; reason: string }`

Algorithm (Telegram Mini App data validation — bot-token HMAC method):

1. Parse `initData` with `URLSearchParams` (values are URL-decoded).
2. Extract and remove `hash`. **Also remove `signature`** (Ed25519 field used
   only for third-party validation; it must NOT be part of the HMAC data-check-string).
3. Build `dataCheckString` = remaining entries as `key=value`, sorted by key
   ascending, joined with `\n` (decoded values).
4. `secretKey = HMAC_SHA256(key="WebAppData", message=botToken)`.
5. `computed = hex(HMAC_SHA256(key=secretKey, message=dataCheckString))`.
6. Constant-time compare `computed` vs `hash` (`crypto.timingSafeEqual`); reject on mismatch.
7. Reject if `auth_date` missing or `now - auth_date*1000 > maxAgeSec*1000`
   (replay/staleness guard).
8. Parse `user` (JSON) → `{ id, first_name?, last_name?, username?, photo_url?, language_code? }`.
   Reject if `user` or `user.id` missing.

Return a normalized `TgUser` mapped to the channel profile shape used by
`TelegramAdapter` (`channelUserId = String(user.id)`, `displayName`,
`username`, `avatarUrl = photo_url`).

### 2. Endpoint `POST /auth/telegram/webapp`

Add to `backend/src/auth/auth.controller.ts` (reuses its `cookieOptions()` +
injected `sessions`/`identity`):

- Body: `{ initData: string }` (DTO + validation pipe; reject empty).
- Rate-limited like the other auth routes.
- `validateInitData(initData, telegramConfig.botToken, maxAgeSec)`; on failure →
  `401 Unauthorized` (`{ ok: false }`, no detail leakage).
- On success → `IdentityService.resolveOrCreate({ channel:'telegram', channelUserId, profile })`
  (same path the bot login uses) → `sessions.issue(userId, 'telegram')` →
  `res.cookie(cookieName, sid, cookieOptions(expiresAt))`.
- Honor the referral cookie if present (mirror the email/google signup paths that
  read `REF_COOKIE` and attribute) so Mini-App first-touch referrals still attribute.
- Return the `UserProfile` (same shape as `/auth/me`) so the client skips an extra round-trip.

Config: `TELEGRAM_INITDATA_MAX_AGE_SEC` (default `86400`) added to the telegram config.

### 3. Bot launch points (`telegram.update.ts`)

In `onModuleInit()` (best-effort, logged on failure):

- `bot.telegram.setChatMenuButton({ menu_button: { type:'web_app', text:'Open StikUp', web_app:{ url: miniAppUrl } } })`.
- Add `Markup.button.webApp('Open StikUp', miniAppUrl)` inline buttons to `/start`
  and the relevant replies (keep existing deep-link login buttons too).

`miniAppUrl`: derive `${frontend.publicAppUrl}/app`; allow override via
`TELEGRAM_MINI_APP_URL`. Must be HTTPS in prod (already validated by
`frontend.config.ts`).

---

## Frontend

### 1. SDK load — `layout.tsx`

Add `<Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" />`
(Telegram's official CDN script; keeps the API current). No npm SDK.

> Implementation note: `afterInteractive` (not `beforeInteractive`) is used —
> `beforeInteractive` is not recommended for third-party scripts in Next 16. To
> remove the resulting "SDK maybe-not-attached on first effect" race, the
> `TelegramProvider` polls for `window.Telegram.WebApp` for up to 2s and exposes a
> `telegramResolved` flag; consumers (the `/app` page) wait for it before acting
> on `isTelegram`. `isTelegram` is `false` on the first render (SSR + client) and
> only flips after detection, avoiding hydration mismatch.

### 2. `lib/telegram/webapp.ts`

Thin typed wrapper: a minimal `TelegramWebApp` type, `getWebApp()` (reads
`window.Telegram?.WebApp`), and `isTelegramEnv()` (true iff `WebApp.initData` is a
non-empty string). Safe on the server (returns false / undefined).

### 3. `components/telegram/telegram-provider.tsx` (client)

Placed in `layout.tsx` inside `StoreProvider` (needs the auth API), wrapping the
existing children. On mount, when `isTelegramEnv()`:

- `WebApp.ready()`, `WebApp.expand()`.
- Sync theme: apply `WebApp.colorScheme` via `ThemeProvider.setTheme`; subscribe to
  `themeChanged`. Set `WebApp.setHeaderColor` / `setBackgroundColor` to brand bg.
- Auto-login: if `/auth/me` returns 401, `POST /auth/telegram/webapp { initData: WebApp.initData }`;
  on success refetch `/auth/me` (RTK Query invalidation). Expose status.
- Exposes context `{ isTelegram, user, status }`.
  Outside Telegram it is a passthrough (renders children, does nothing).

### 4. `/app` entry route — `app/app/page.tsx` (public)

Minimal splash. Client logic:

- If not `isTelegramEnv()` → `router.replace('/')`.
- Wait for the provider's auto-login to resolve.
  - Success → fetch `/api/packs`; redirect `/my-stickers` if non-empty else `/upload`.
  - Failure (invalid/expired initData → 401) → show a short "couldn't sign you in"
    message with a Retry action and a link to `/login`.

### 5. Chrome adjustments

`AppHeader` renders `null` when `isTelegram` (Telegram supplies its own header).
Wire `WebApp.BackButton` to drive in-app back navigation (`router.back()`), shown
on non-home routes inside Telegram. Marketing landing is never shown inside
Telegram because the launch target is `/app`.

### 6. Headers — `next.config.ts`

Add a scoped response header:
`Content-Security-Policy: frame-ancestors 'self' https://*.telegram.org`
so Telegram Desktop/Web can iframe-embed the Mini App while removing the
incidental clickjacking exposure elsewhere. (Telegram mobile uses a native
webview, unaffected.) Reversible config-only change.

---

## Error handling & edge cases

- Invalid / tampered / expired `initData` → backend `401` → `/app` shows retry + `/login` fallback.
- `telegram-web-app.js` blocked / absent → `isTelegramEnv()` false → behaves as website (graceful).
- Already-authenticated in Telegram (valid `sid`) → skip login, straight to smart home.
- Same-origin: the `initData` POST and `sid` cookie are first-party to `stikup.app`
  (the Mini App loads our origin in the webview), so `SameSite=Lax` is sufficient —
  no cookie-policy changes.
- Launch points all target `/app`; deep `web_app` links to session-gated pages are
  out of scope for now (would need the same client-login treatment).

## Security notes

- HMAC validation is the trust boundary: constant-time compare, correct secret
  derivation (`key="WebAppData"`), exclude both `hash` and `signature` from the
  data-check-string, enforce `auth_date` freshness to bound replay.
- Endpoint returns no validation detail on failure; rate-limited.
- `frame-ancestors` scoped to Telegram + self.

## Testing

- **Backend unit:** `validateInitData` — valid passes; tampered hash fails; stale
  `auth_date` fails; missing/!id `user` fails; malformed string fails; `signature`
  present is ignored correctly. Endpoint: happy-path issues cookie + returns
  profile; invalid initData → 401 (mock identity/session).
- **Frontend unit:** `isTelegramEnv()`; provider auto-login effect (mock
  `window.Telegram.WebApp` + fetch); `/app` redirect branches (no-telegram,
  success→packs vs no-packs, failure).
- **Live (manual):** real menu-button launch in Telegram against deployed HTTPS.

## Dev-testing caveat

Telegram requires **HTTPS** for `web_app` URLs; `localhost` will not open in real
Telegram. Local end-to-end testing needs a tunnel (cloudflared/ngrok) with
`PUBLIC_APP_URL` / `TELEGRAM_MINI_APP_URL` pointed at it. Prod (`stikup.app`) is HTTPS.

## Out of scope

AI sticker pipeline (still a stub — the Mini App wraps the existing flow), Telegram
payments, WhatsApp, advanced SDK features (haptics, cloud storage, settings button).
