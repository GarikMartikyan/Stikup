# Stikup — Product Requirements Document

**Status:** Draft for review (pivoted to the ChatGPT-grid model)
**Last updated:** 2026-06-26
**Owner:** Product

---

## 1. Vision

Turn a single photo into a personalized cartoon sticker pack and deliver it straight into the user's Telegram. Stikup does **not** run any image generation itself: the user generates their sticker sheet in **ChatGPT** using a ready-made prompt we hand them, then uploads that finished image back to us. Our job is to **split, clean, and deliver** — cutting the ChatGPT grid into 12 Telegram-ready stickers and creating a real sticker set the user owns.

Stikup is **non-commercial**. There is no payment, no subscription, and no paid tier. A donation option may be added in the future, but nothing in the product is gated behind money.

## 2. Problem & Opportunity

Telegram sticker packs are universal, but the ones available today are generic. People want stickers of _themselves_, and image models like ChatGPT can now produce a usable likeness from one photo. The remaining friction is everything _after_ generation: getting a single grid image cut into 12 properly-sized, background-removed, Telegram-spec stickers and published as an installable set. That post-processing is fiddly and technical.

Stikup removes that friction. The user does the (free, in their own ChatGPT account) generation; we do the boring, error-prone packaging and Telegram delivery.

## 3. Target Audience

**Primary:** Telegram users who want custom stickers of themselves and are comfortable copy-pasting a prompt into ChatGPT.

**Geography:** Russia/CIS (Russian) and global English. Language auto-detects from the Telegram client locale (Mini App) or browser, with a manual override; default fallback is English.

## 4. Core Value Proposition

> "Bring your ChatGPT sticker sheet — we turn it into a real Telegram pack."

Three things define the product:

1. **Zero AI cost to us** — the user generates in their own ChatGPT; we never call a paid image API.
2. **Clean packaging** — we reliably split the 3×4 grid into 12 transparent, Telegram-spec WebP stickers.
3. **Native delivery** — the bot creates a real Telegram sticker set the user owns and shares.

At launch every user works from the same prompt template; only the **art style** varies (Disney, anime, etc.).

## 5. User Flows

### 5.1 Entry points

The Telegram bot is the **primary** entry point; the direct web app at `stikup.app` is secondary. Both converge on the same web app and the same account record.

**A. Telegram Bot → Mini App (primary)**

1. User opens the Stikup bot and taps **Open App** (or `/start`).
2. The Mini App opens already authenticated via Telegram `initData` (see `docs/architecture/login-structure.md`).
3. The user lands on the **style picker** (`/create`).

**B. Direct web (stikup.app, secondary)**

1. User lands on the marketing page.
2. Signs up via Google OAuth, email, or Telegram.
3. Lands on `/create`.
4. Linking a Telegram account is required before the bot can deliver the finished set (automatic if entered via the bot).

Account records are unified through the `channel_identities` table so the same human can arrive via any channel and get a single `users.id`.

### 5.2 The pack flow (happy path)

1. **Pick a style** (`/create`) — the user chooses an art style. The page assembles a copy-paste **ChatGPT prompt** (a fixed template + the chosen style block) and shows an illustrated how-to plus an "Open ChatGPT" link.
2. **Generate in ChatGPT (off-platform)** — the user pastes the prompt into ChatGPT, attaches their photo, and ChatGPT returns **one image**: a 4×3 grid of 12 stickers on a solid green (#00B140) background. The green background and grid layout are mandated by the prompt because our splitter depends on them.
3. **Upload the grid** (`/upload`) — the user uploads that single generated image (not a selfie). Max upload size applies (8 MB).
4. **Split & clean** — a backend worker runs the Python splitter (`split_stickers.py --grid`): it geometrically cuts the grid into 12 cells, chroma-keys the green background to transparent, and encodes each as a Telegram-spec WebP. If the image can't be split into a clean 12 (e.g. a malformed grid), the pack is marked **failed** and the user is told to re-upload a clean 4×3 grid; the consumed generation is refunded.
5. **Show the pack** (`/result/[packId]`) — all 12 stickers render in a grid: **3 are unlocked** and downloadable; **9 are shown as blurred previews with a lock overlay**. The underlying WebPs exist server-side; the lock is applied at the application layer.
6. **Unlock all 12 (referral)** — the only way to reveal the 9 locked stickers is to **refer a friend who registers** on the platform via the user's referral link. On a successful referral the 9 cards reveal, the bot delivers the full 12-sticker set, and the referrer's generation allowance increases (see §5.3).
7. **Deliver to Telegram + download** — the bot creates a Telegram sticker set owned by the user (`createNewStickerSet`) and DMs the install link. Free (un-referred) users get a 3-sticker set; referral-unlocked users get the full 12. Stickers can also be downloaded as WebP/PNG for use outside Telegram.

### 5.3 Generations & limits

- **Base allowance** — every account can create **2 packs** (`OFFER_BASE_GENERATIONS`, default 2). Each pack creation (new or re-roll) consumes one generation.
- **Earning more** — each friend who **registers** via the user's referral link grants **+2 additional generations** (`OFFER_REFERRAL_BONUS_GENERATIONS`, default 2). So the per-account cap = `baseGenerations + referralBonusGenerations × (successful referrals)`.
- **Full-pack unlock** — the first successful referral also unlocks the full 12 stickers (the 9 locked cards reveal) for the user's existing packs and future ones.
- **Abuse protection** — `POST /packs` (the split endpoint) and `POST /auth/register` are rate-limited per IP. New-account-per-IP and per-IP request caps deter farming the free allowance with throwaway accounts.

There is no payment path of any kind.

## 6. Features — Scope

| Feature                | Description                                                                                                                                                                                                                       |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication         | Telegram (Mini App `initData` + Login Widget), Google OAuth, email + password. All link to a single account record. Telegram link required before bot delivery (auto if entered via bot).                                         |
| i18n                   | Russian + English. Auto-detect from Telegram/browser locale; user can override. Copy externalized. (Russian copy for the new flows needs a translation pass — see §15.)                                                           |
| Style picker + prompt  | `/create` offers a set of art styles (Chibi, Disney 3D, Anime, Ghibli, Comic, Pixel, Clay, Pop Art). Each reuses one fixed prompt template; only the style block changes. The page provides Copy + an illustrated ChatGPT how-to. |
| Grid upload            | Single image upload — the user's ChatGPT-generated 4×3 grid (not a selfie).                                                                                                                                                       |
| Split & clean (Python) | `split_stickers.py --grid`: geometric 4×3 split + green chroma-key → 12 Telegram-spec WebPs. Fails gracefully (refund + re-upload prompt) when it can't produce a clean 12. No watermark.                                         |
| Locked-card pack       | All 12 stickers shown: 3 unlocked + 9 blurred with a lock overlay. Counts are config-driven (`OFFER_FREE_STICKER_COUNT`, `OFFER_PACK_SIZE`).                                                                                      |
| Referral unlock        | Each user gets a unique referral link. A referred friend registering reveals all 12 of the referrer's pack **and** grants +N generations. This is the only unlock path.                                                           |
| Bot delivery           | Bot creates a Telegram sticker set via `createNewStickerSet`, DMs the install link. Un-referred users get a 3-sticker set; unlocked users get 12.                                                                                 |
| Re-roll                | Re-creating a pack from a new upload consumes one generation.                                                                                                                                                                     |
| Download               | Download stickers (WebP/PNG) for use outside Telegram.                                                                                                                                                                            |
| Account management     | View past packs, link/unlink Telegram & Google, delete account + data.                                                                                                                                                            |

## 7. Out of Scope

- **Payments / subscriptions** — explicitly out, now and going forward. (A voluntary **donation** option is the only money-related feature ever considered, and it is not built yet.)
- **In-app AI generation** — the app does not and will not call a paid image API; generation happens in the user's ChatGPT.
- Themed expansion packs, animated stickers, WhatsApp delivery, group/family packs — possible later; the auth/identity layer already supports additional channels.

## 8. Brand & Voice

- **Personality:** Playful, friendly, emoji-forward. Reads like a friend who's hyped about your stickers.
- **Bot copy example:** "Your sticker pack is ready! 🎉 Tap to install →"
- **Web copy** is concise and mobile-first (the site opens inside Telegram's in-app browser / Mini App).
- **Visual identity:** Bold, vivid colors.

## 9. Monetization

None. Stikup is free to use. A **donation** prompt may be added in the future as a purely optional way to support the project; it will never gate features. There is no subscription, no one-time purchase, and no paid generation credits.

## 10. Content Moderation

- **Curated prompt set** — the 12 expressions per pack are fixed in the prompt template (no free-form user prompts), limiting the moderation surface of the generated output.
- **Upload hygiene** — uploads are validated as images and size-capped. (Server-side face/NSFW classification of the uploaded grid is a possible future addition; because users generate in their own ChatGPT under OpenAI's policies, the moderation burden largely shifts upstream.)

## 11. Privacy & Compliance

- **Minimum age:** 13+.
- **GDPR:** Terms of Service, Privacy Policy, in-app account + data deletion.
- **Data retention:** Uploaded grid images and generated stickers are stored on the server. Account deletion removes user data and the on-disk pack files (best-effort, including the Telegram set).

## 12. Notifications

Transactional only.

| Event                                     | Channel                                  | Notes                                 |
| ----------------------------------------- | ---------------------------------------- | ------------------------------------- |
| Full pack ready / delivered               | Telegram DM (with install link) + in-app | Primary success moment                |
| Referral credited (your pack is unlocked) | Telegram DM                              | Sent when a referred friend registers |
| Account / security                        | Email                                    | If signed up via email/Google         |

## 13. Support

- **Channels:** Email + Telegram support contact + in-app FAQ.
- **FAQ covers:** "Pack didn't arrive", "How to install in Telegram", "My grid wouldn't split — why?", "How to delete my data", "How referrals unlock the full pack".

## 14. Anti-Abuse & Rate Limits

All limits live in config; defaults below.

| Limit                          | Default                                 | Why                                                  |
| ------------------------------ | --------------------------------------- | ---------------------------------------------------- |
| Base generations per account   | 2 (`OFFER_BASE_GENERATIONS`)            | Everyone gets two packs to start                     |
| Bonus generations per referral | +2 (`OFFER_REFERRAL_BONUS_GENERATIONS`) | Earn more by inviting friends who register           |
| `POST /packs` per IP           | rate-limited                            | Prevents splitter abuse                              |
| `POST /auth/register` per IP   | rate-limited                            | Prevents account-creation farming                    |
| Pack size                      | 12 stickers (`OFFER_PACK_SIZE`)         | 3×4 grid; Telegram allows up to 30 if expanded later |
| Free unlocked count            | 3 (`OFFER_FREE_STICKER_COUNT`)          | Locked-card preview                                  |
| Max upload size                | 8 MB                                    |                                                      |

## 15. Configurable Parameters

Changeable via environment without a code change:

- `OFFER_PACK_SIZE` (default 12) — stickers per pack / expected grid cells
- `OFFER_FREE_STICKER_COUNT` (default 3) — unlocked cards before referral
- `OFFER_BASE_GENERATIONS` (default 2) — packs every new account can make
- `OFFER_REFERRAL_BONUS_GENERATIONS` (default 2) — extra generations per successful referral
- `OFFER_REFERRAL_UNLOCK` (default true) — whether a referral reveals the full 12
- `STICKER_DEFAULT_EMOJI` — default emoji on each Telegram sticker
- `OFFER_UNLIMITED_GENERATIONS` (default false) — local/testing escape hatch

The art-style list and the prompt template live in the frontend (`frontend/src/lib/sticker-styles.ts`).

**Known follow-ups:** Russian translations for the new `/create`, upload, and result copy; real per-style sample art on the style tiles; real ChatGPT screenshots in the `/create` how-to (currently illustrated icon mockups).

## 16. Success Metrics

**North-star:** **Packs delivered** = number of packs successfully split and delivered to Telegram.

**Secondary:**

- Funnel: open `/create` → copy prompt → upload grid → pack ready → delivered/installed
- Split success rate (clean 12 vs failed) — quality signal for prompt + splitter
- Referral participation rate — growth + unlock health
- Time from upload to delivered pack (P50, P95) — UX health

## 17. Tech Stack (Reference)

- **Frontend:** Next.js (App Router), React, TypeScript, mobile-first. Runs as a Telegram Mini App and a public web app (`initData` auto-login).
- **Backend:** NestJS, TypeScript. BullMQ/Redis async pipeline for the split job. Prisma + Postgres for user/account/pack/referral state.
- **Image post-processing:** Python CLI (`split_stickers.py`, OpenCV + NumPy + Pillow) invoked as a subprocess by the worker — geometric 4×3 split, green chroma-key to transparency, Telegram-spec WebP encoding. No watermark. **No paid image API.**
- **Bot:** Telegram Bot API via `nestjs-telegraf`; real sticker sets via `createNewStickerSet`.
- **Storage:** Object/disk storage for uploaded grids and final per-sticker WebPs (local Docker volume in current deployment).
- **i18n:** Custom locale provider (en/ru).

## 18. Launch Criteria

The pivot is ready when:

1. A user can go from `/create` → copy prompt → (generate in ChatGPT) → upload grid → receive an installable Telegram sticker set, in production, on mobile.
2. The same path works on the public web app.
3. All three sign-in methods work, with Telegram Mini App entry being primary.
4. Russian + English locales render (pending the Russian copy pass in §15).
5. The splitter reliably produces a clean 12 from a compliant ChatGPT grid and fails gracefully otherwise.
6. The locked-card pack renders correctly (3 unlocked + 9 locked) and reveals on a successful referral with no second generation.
7. Generation limits (2 base + 2 per referral) and per-IP rate limits are enforced server-side.
8. Referrals credit correctly end-to-end.
9. Account deletion removes all user data.
10. No payment surfaces remain anywhere in the product.

## 19. Risks & Open Questions

- **Grid compliance.** The splitter depends on ChatGPT honoring the prompt (4×3 layout, solid green background, spacing). Non-compliant grids fail to split. Mitigation: a strict, well-tested prompt template; clear failure messaging + re-upload; possible future fallback cleaning (e.g. per-cell background removal).
- **Likeness consistency.** Single-photo input limits how recognizable the result is — but this is now the user's ChatGPT result, not ours.
- **Referral abuse.** A free unlock + bonus generations triggered by a friend _registering_ is cheap to game with throwaway accounts. Mitigation: per-IP register/new-account caps; count a referral once per uniquely-registered account; consider requiring the referee to complete their own first pack before crediting.
- **Storage growth.** Uploaded grids + generated WebPs accumulate on disk with no AI cost ceiling to bound usage; monitor volume and retention.

---

_Decisions deferred to implementation: donation mechanics (if/when added), object-storage migration, observability stack, and the Russian copy pass._
