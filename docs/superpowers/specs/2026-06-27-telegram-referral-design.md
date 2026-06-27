# Telegram-native referral

**Date:** 2026-06-27
**Status:** Approved — ready for implementation plan

## Problem

Referral attribution currently runs through the **website**. A referrer shares
`https://stikup.app/?ref=CODE&pack=PACKID`; the invited friend lands on the web
page, `ReferralCapture` writes cookies, and the friend must **manually register**
(email / Google / Telegram) before `attribute()` credits the referral and unlocks
the referrer's pack.

The app is a Telegram Mini App with automatic login. We want the invite to be
Telegram-native: tapping the link opens the Mini App, the friend is auto-logged-in
via Telegram, lands on the home page, and the referral is credited with no manual
registration step.

## Decisions

- **Remove the web `?ref=` flow entirely.** Referrals are credited only through
  Telegram `start_param`. The web cookie capture and the email/Google cookie
  attribution are deleted.
- **Credit only on new-account creation** (unchanged semantics). If the friend
  already has a StikUp account, nothing is credited.
- **Silent landing.** The friend just lands logged in on the home page; no extra
  UI.
- **Keep the existing unlock notification.** When a referral is attributed, the
  referrer already receives a Telegram message ("🎉 A friend joined through your
  link — your sticker pack is now fully unlocked") plus a sticker-set top-up. This
  lives in `ReferralService.attribute()` and is channel-agnostic, so routing the
  Telegram flow through the same `attribute()` call preserves it unchanged.

## Approach

**Chosen — Mini App direct link with `start_param`.**

The referrer shares `https://t.me/stikup_bot?startapp=<CODE>_<PACKID>`. Telegram
opens the Mini App directly and delivers the payload as `start_param`, which is
included inside the **HMAC-signed `initData`** — so the backend can trust it after
the existing signature check. Auto-login (`POST /auth/telegram/webapp`) creates the
account and attributes the referral. The friend lands on the home page, logged in.

**Rejected — bot `/start` deep link** (`https://t.me/stikup_bot?start=...`): opens
the bot **chat** first, requiring an extra tap to open the Mini App and not landing
on the home page. Worse UX; does not satisfy "see home page, already logged in."

### `start_param` encoding

Pack id is a **UUID** (`schema.prisma:112`) — lowercase hex with dashes. Referral
code is **8 base62 chars** (`referral.service.ts:30`, padded to 8). Neither
contains an underscore, and Telegram permits `A-Za-z0-9_-` (max 512 chars).

- Format: `start_param = "<CODE>_<PACKID>"`
- Parse: split on the **first** `_`. Validate `code` against `^[0-9A-Za-z]{1,64}$`
  and `pack` against the UUID pattern. A malformed or missing payload is ignored
  (auto-login still succeeds; no referral credited).
- A code-only payload (no pack) is tolerated: credits the referral without a
  specific pack unlock. (Not produced by the UI today, but the parser must not
  break on it.)

## Backend changes

1. **`backend/src/auth/channel/telegram-initdata.validator.ts`**
   Add `startParam: string | undefined` to the `{ ok: true }` result, read via
   `params.get('start_param')` (already inside the verified data, after `hash` is
   stripped). No change to the trust boundary.

2. **`backend/src/auth/auth.controller.ts` → `telegramWebApp`**
   On `created`, parse the validated `startParam` into `{ ref, pack }` and call
   `referrals.attribute(userId, ref, 'telegram', pack)`. **Remove** the
   `REF_COOKIE` / `REF_PACK_COOKIE` reads and `clearCookie` calls in this handler.

3. **`backend/src/auth/auth.controller.ts` → email & Google paths**
   Remove the cookie-based `attribute()` calls (lines ~283 and ~375), and remove
   the now-unused `REF_COOKIE` / `REF_PACK_COOKIE` constants and any related
   `clearCookie` calls. The web referral path no longer exists.

4. **`backend/src/referral/referral.service.ts` → `getOrCreateReferralInfo`**
   Drop the web `link` field; return `{ code, referredCount }`. `attribute()` is
   **unchanged** (unlock message + sticker top-up preserved).

## Frontend changes

1. **`frontend/src/lib/telegram/href.ts`**
   Add `telegramReferralHref(code: string, packId: string): string` returning
   `${TELEGRAM_BOT_URL}?startapp=${code}_${packId}`.

2. **`frontend/src/components/result/pack-actions.tsx` → `handleUnlock`**
   Fetch `/api/referral/me`, read `code`, build the deep link with
   `telegramReferralHref(code, packId)` (replacing the web `?ref=` URL), then keep
   the existing Web Share API → clipboard fallback.

3. **Delete the web capture**
   Remove `frontend/src/components/referral-capture.tsx` and its test, and remove
   the `<ReferralCapture />` mount + import from `frontend/src/app/layout.tsx`.

## Components & data flow (target)

```
Referrer (result page)
  └─ tap "Unlock all"
       └─ GET /api/referral/me → { code, referredCount }
            └─ telegramReferralHref(code, packId)
                 → https://t.me/stikup_bot?startapp=<CODE>_<PACKID>
                      └─ share / copy

Friend taps link
  └─ Telegram opens Mini App (start_param = "<CODE>_<PACKID>")
       └─ TelegramProvider auto-login → POST /auth/telegram/webapp { initData }
            └─ validateInitData → { ok, user, startParam }
                 └─ if created: parse startParam → attribute(userId, code, 'telegram', pack)
                      ├─ create Referral row
                      ├─ unlock referrer's pack (pack.unlockedAt)
                      ├─ Telegram message to referrer ("all unlocked")
                      └─ sticker-set top-up
       └─ friend lands on home page, logged in (silent)
```

## Error handling

- Invalid/missing `start_param`: ignored — auto-login still succeeds, no credit.
- `attribute()` is best-effort and never throws (existing behavior); duplicate
  attribution is idempotent via the `P2002` guard.
- Self-referral and already-attributed cases are guarded inside `attribute()`.

## Tests

**Backend**

- `telegram-initdata.validator.spec.ts`: assert `startParam` is returned when
  present and `undefined` when absent.
- `telegram-webapp.controller.spec.ts`: `start_param` → `attribute()` called with
  parsed code + pack on `created`; not called when not `created`; cookies no longer
  read.
- `auth-email-google.controller.spec.ts`: cookie-based attribution removed.
- `referral.service.spec.ts`: `getOrCreateReferralInfo` returns `{ code,
referredCount }` (no `link`).

**Frontend**

- Remove `referral-capture.test.tsx`.
- `pack-actions` test: asserts the shared URL is a `t.me/...?startapp=<code>_<packId>`
  link.
- Add a small test for `telegramReferralHref`.

## Out of scope

- Crediting existing (non-new) users.
- Any landing-page UI signalling the invite.
- Changing the unlock/notification logic itself.
