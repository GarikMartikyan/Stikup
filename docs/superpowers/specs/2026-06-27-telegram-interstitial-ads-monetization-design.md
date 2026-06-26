# Telegram Interstitial Ads — Monetization Design

**Date:** 2026-06-27
**Status:** Approved design — ready for implementation plan
**Topic:** Monetize Stikup by showing an Adsgram interstitial video ad during the
sticker-splitting wait inside the Telegram Mini App.

---

## 1. Goal & Context

Stikup runs as a **Telegram Mini App** (`frontend/src/lib/telegram/webapp.ts`,
`components/telegram/telegram-provider.tsx`, SDK loaded in `app/layout.tsx`) and
also as a public web app at `stikup.app`.

Current generation flow:

1. User picks a ChatGPT grid on `/upload` and taps "Create".
2. `POST /api/packs` runs `split_stickers.py` **synchronously** (~2 s) and
   returns `{ packId }`.
3. Frontend navigates to `/result/[packId]`.

Unlock model: 3 free / 9 locked stickers; quota = 2 base + 2 per referral.

**This design adds the first revenue stream:** an **Adsgram interstitial video
ad** shown at the generation moment, with **no reward tie-in** (the ad simply
gates the result). Web users are funneled into Telegram, where the ad runs.

### Decisions locked in during brainstorming

| Decision              | Choice                                                                  |
| --------------------- | ----------------------------------------------------------------------- |
| Monetization mechanic | **Interstitial during loading** (no reward)                             |
| Ad network            | **Adsgram**                                                             |
| Web behavior          | **Funnel to Telegram** — generation gated, landing/browsing still works |
| Web gate strictness   | **Gate at generation** (soft elsewhere: SEO/landing stay live)          |

Out of scope for this iteration (possible follow-ups): rewarded ads that unlock
stickers, Telegram Stars payments, a separate web ad network, frequency caps.

---

## 2. User Flows

### 2.1 Inside Telegram (primary)

1. User taps **Create** on `/upload`.
2. Two operations start **in parallel**:
   - `POST /api/packs` — server splits the grid (~2 s), returns `packId`.
   - `AdController.show()` — Adsgram interstitial (~15–30 s).
3. The page navigates to `/result/[packId]` only after **both** resolve:
   the pack is ready server-side **and** the ad has closed.
4. The ad naturally covers the wait; the result appears immediately after it.

The pack is generated regardless of the ad — the ad never blocks delivery
(see §5). If the POST is slower than the ad, the user simply waits on the
existing spinner after the ad closes; if faster, the ad fills the time.

### 2.2 On the web (non-Telegram)

- Landing, `/how-to`, browsing, auth — unchanged (keeps SEO and the public demo
  alive).
- The **Create** action is **gated**: when `!isTelegramEnv()`, instead of
  calling `POST /api/packs`, the UI shows an **"Open in Telegram"** call to
  action that deep-links to the Mini App. All sticker generation happens in
  Telegram, where the ad runs.

---

## 3. Components & Changes

### 3.1 Frontend (primary work)

**a) Adsgram SDK** — add a `<Script>` to `app/layout.tsx`, mirroring the existing
Telegram SDK tag (`strategy="afterInteractive"`). The SDK attaches itself to
`window.Adsgram`.

**b) `lib/ads/adsgram.ts`** — a thin, SSR-safe wrapper modeled on
`lib/telegram/webapp.ts`:

- `getAdsgram()` — returns `window.Adsgram` or `undefined` (guarded with
  `typeof window`).
- `showInterstitial(): Promise<AdResult>` — lazily `init({ blockId })` once using
  `NEXT_PUBLIC_ADSGRAM_BLOCK_ID`, then `AdController.show()`. **Never rejects to
  the caller** — resolves to a tagged result (`shown` / `skipped` / `error`) so
  the call site stays simple and generation never breaks on ad failure.
- No-ops to `skipped` when not in Telegram, when the SDK is missing, or when
  `NEXT_PUBLIC_ADSGRAM_BLOCK_ID` is unset.

**c) `app/upload/page.tsx`** — change `submit()`:

- If `!isTelegramEnv()` → do not generate; surface the "Open in Telegram" CTA
  (see §3.3) and return.
- Otherwise run the ad and the request together:
  `await Promise.allSettled([showInterstitial(), createPack()])`, then navigate
  to `/result/[packId]` using the `packId` from the request. Existing error
  handling for 401 / 403 / failure is preserved; the ad result is ignored for
  control flow (best-effort).

**d) Web "Open in Telegram" CTA (§3.3)** — a small component shown by the upload
page in the web/non-Telegram case. Deep-links to the Mini App using the existing
bot URL config (`lib/config.ts` → `NEXT_PUBLIC_TELEGRAM_BOT_URL`, default
`https://t.me/stikup_bot`), with `?startapp` so it opens the Mini App directly.

### 3.2 Backend

**No required changes.** A non-rewarded interstitial needs no server-to-server
verification (that is only required for rewarded ads to prevent reward fraud).
The pack is generated exactly as today.

_Optional (not in MVP):_ emit an analytics event when an ad is shown, for fill /
revenue tracking. Deferred.

### 3.3 Web → Telegram deep link

Reuse `NEXT_PUBLIC_TELEGRAM_BOT_URL`. The CTA links to
`${botUrl}?startapp` (e.g. `https://t.me/stikup_bot?startapp`) so the click opens
the Mini App, landing the user on the upload flow inside Telegram.

### 3.4 i18n

Add strings to `i18n/messages/en.json` and `i18n/messages/ru.json` for the
"Open in Telegram" CTA (title + button). No other copy changes.

---

## 4. Configuration & Ops (user action required)

1. Register at **adsgram.ai**, create an app, link the bot / Mini App domain,
   and obtain an **interstitial Block ID**.
2. Provide a **TON wallet** for payouts.
3. Set `NEXT_PUBLIC_ADSGRAM_BLOCK_ID` in:
   - local `.env` (repo root, loaded via `envFilePath`),
   - the production droplet `.env`,
   - rebuild the frontend on deploy (`scripts/deploy.sh`).

If `NEXT_PUBLIC_ADSGRAM_BLOCK_ID` is absent, the wrapper degrades to `skipped`
and the app behaves exactly as today — safe to ship before the account is live.

---

## 5. Edge Cases & Resilience

| Situation                              | Behavior                                                                       |
| -------------------------------------- | ------------------------------------------------------------------------------ |
| Ad fails to load / no fill / SDK error | **Do not block.** Navigate to the result as soon as the pack is ready.         |
| Not in Telegram (web)                  | No ad call; show "Open in Telegram" CTA at the Create step.                    |
| `NEXT_PUBLIC_ADSGRAM_BLOCK_ID` unset   | Wrapper returns `skipped`; behaves like today.                                 |
| Pack generation fails (401/403/5xx)    | Existing error handling unchanged; no navigation. The ad result is irrelevant. |
| Ad closes before pack is ready         | Spinner stays until `POST /api/packs` resolves, then navigate.                 |
| Pack ready before ad closes            | Wait for ad to close (it covers the perceived wait), then navigate.            |

**Invariant:** a generated pack is always reachable by the user; the ad is
best-effort and can never strand a paid-for (free) result.

### Frequency

MVP shows the interstitial on **every generation** (the loading moment is the ad
moment). Frequency capping is a deferred follow-up if it proves annoying.

---

## 6. Testing

- **`lib/ads/adsgram.ts` unit tests** (mirror `lib/telegram/__tests__/webapp.test.ts`):
  - SSR guard (no `window`) → `skipped`.
  - SDK missing → `skipped`.
  - Block ID unset → `skipped`.
  - `show()` resolves → `shown`.
  - `show()` rejects → `error` (never throws to caller).
- **`upload/page.tsx` branch test:**
  - Non-Telegram env → no `POST /api/packs`; CTA visible.
  - Telegram env → ad + request run in parallel; navigation uses the returned
    `packId`; ad failure still navigates.
- **Manual / e2e:** verify inside the Telegram Mini App that the interstitial
  shows and the result appears afterward (Adsgram has a test mode for this).

---

## 7. Risks & Notes

- **Short split vs long ad:** the ad gates the result rather than filling a long
  wait. Framing is "watch an ad to reveal your pack," which is standard for Mini
  Apps and acceptable; revisit if drop-off rises.
- **Adsgram SDK signature** (`init` / `show` shape, block-type naming) must be
  confirmed against current Adsgram docs at implementation time — the wrapper
  isolates this so only one file changes if the API differs.
- **Web funnel cost:** gating generation on the web removes the no-Telegram path
  to stickers. Landing/SEO stay live, so discovery is unaffected; only the final
  generate step requires Telegram.
