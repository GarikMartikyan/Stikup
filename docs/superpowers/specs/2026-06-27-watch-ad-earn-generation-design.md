# Watch‑an‑ad to earn a generation — Design

**Date:** 2026‑06‑27
**Status:** Approved (ready for implementation plan)

## Problem

When a user exhausts their generation quota, the upload page shows a dead‑end
error: **"You've used all your generations."** (`upload.error.no_generations`).
The user has no in‑app way to continue without inviting a friend (referral) —
they are simply stuck.

We want to let users **earn one more generation by watching an ad**. When the
generation limit is reached, the existing "used all your generations" message
gains a **"Watch ad for 1 more generation"** button. After the ad is watched,
one generation is granted and the user can immediately upload their grid. This
is **repeatable with no cap** — each watched ad grants exactly **+1** generation.

## Decisions (confirmed with the user)

- **Reward trust model: client‑confirmed.** After the rewarded ad resolves on
  the client, the frontend calls a **session‑authenticated** backend endpoint
  that grants the credit. We do **not** build Adsgram's server‑to‑server (S2S)
  Reward URL callback now.
  - _Why:_ Adsgram's S2S "Reward URL" is documented as available only to
    publishers with **over 50k daily average users**. stikup.app is days old, so
    S2S cannot be enabled yet. Client‑confirmed ships a working feature today.
- **Button placement: in the existing error banner (reactive).** The user picks
  a grid, taps Upload, the backend returns `403`, and the watch‑ad CTA appears
  on the existing "used all your generations" banner. After the ad, the upload
  auto‑retries with the already‑picked file.
- **Repeat policy: unlimited, 1 ad = +1 generation.** No daily cap. A `@Throttle`
  exists only as an abuse backstop, not a product cap.
- **(a) Credit storage: ledger table `AdReward`** (one row per earned ad), not a
  counter column. The quota cap counts ledger rows, mirroring how `referralCount`
  is already counted. Gives an audit/abuse trail.
- **(b) Ad block: reuse the existing block now.** `adsgramRewardBlockId()` falls
  back to `adsgramBlockId()`, so **no Docker/CI/.env changes are required to
  ship**. A dedicated Adsgram **Reward** block can be created later (an
  interstitial's `show()` resolves even on early close; a Reward block only on
  full watch) and wired via a new `NEXT_PUBLIC_ADSGRAM_REWARD_BLOCK_ID` env var.
- **(c) Skip the second ad on auto‑retry.** The normal flow plays an interstitial
  _during_ generation (`showInterstitial`). After a rewarded unlock we skip that
  interstitial so the user does not see two ads back‑to‑back.

## Confirmed Adsgram contract (from docs.adsgram.ai)

- Block types: **Reward**, **Interstitial**, **Task**.
- Client SDK: `window.Adsgram.init({ blockId, debug?, debugBannerType? })` →
  `AdController.show()` returns a Promise that resolves when the ad is watched
  (or, for interstitials, closed) and rejects on error. An `onReward` event also
  exists; we rely on the `show()` promise to match existing code style.
- S2S "Reward URL": only for publishers > 50k DAU; sends a plain `GET` with one
  macro `[userId]` = Telegram ID; **no signature/hash/unique reward id**. Not
  used in this design (documented here for the future migration path).

## Architecture

### Flow

1. User picks grid → taps **Upload grid** → `POST /api/packs` → backend
   `403 generation_limit_reached`.
2. Frontend sets `quotaBlocked = true` **without discarding the picked file**
   (state stays `"ready"`, so the preview and `File` survive). A dedicated
   no‑generations banner renders with the **Watch ad** button.
3. Tap → `showRewarded()`. On result `"shown"`, `POST /api/ads/reward`.
4. Endpoint inserts one `AdReward` row and returns `{ regensLeft }`. With
   `regensLeft ≥ 1`, the frontend clears `quotaBlocked` and **auto‑retries**
   `submit({ skipInterstitial: true })`, reusing the already‑picked file.
5. Out of quota again → watch again. Unlimited.

If `showRewarded()` returns `"skipped"`/`"error"`, or the POST fails, show
`upload.error.ad_unavailable` and let the user retry.

### Backend

**Schema (Prisma) — new ledger table**

```prisma
model AdReward {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("ad_rewards")
}
```

Add the back‑relation `adRewards AdReward[]` to `model User`. Generate a
migration.

**Quota cap formula (de‑duplicate)**

Today the cap is computed inline in three places in `PackService`
(`generatePack`, `listPacks`, `getPack`):

```
cap = baseGenerations + referralBonusGenerations * referralCount
```

Extract a pure helper:

```ts
function computeCap(offer, referralCount, adRewardCount) {
  return (
    offer.baseGenerations +
    offer.referralBonusGenerations * referralCount +
    adRewardCount
  );
}
```

- `listPacks` / `getPack`: also fetch `adRewardCount = prisma.adReward.count({ where: { userId } })` and pass it in. `regensLeft = max(0, cap - generationsUsed)`.
- `generatePack`: inside the existing `FOR UPDATE` transaction, count ad rewards
  alongside referrals (`tx.adReward.count(...)`) and use `computeCap` for the
  gate. Behavior under `unlimitedGenerations` is unchanged.

**Endpoint — new `AdRewardModule`**

- `POST /api/ads/reward`
  - Session‑authenticated via the same cookie/`resolveSession` pattern used by
    `PackController` (extract/share the helper or replicate minimally).
  - `401` when no session.
  - Inserts one `AdReward` row for the user, returns `{ regensLeft: number }`
    computed via `computeCap` − `generationsUsed`.
  - `@Throttle({ default: { limit: 60, ttl: 3_600_000 } })` as an abuse backstop
    (tunable; not a product cap).
  - Under `unlimitedGenerations`, still returns a sensible `regensLeft` and may
    skip inserting a row (credit is irrelevant when the gate is bypassed).
- Files: `backend/src/ad-reward/ad-reward.module.ts`,
  `ad-reward.controller.ts`, `ad-reward.service.ts`; register module in
  `app.module.ts`.

### Frontend

**Config** (`frontend/src/lib/config.ts`)

```ts
export function adsgramRewardBlockId(): string {
  return process.env.NEXT_PUBLIC_ADSGRAM_REWARD_BLOCK_ID ?? adsgramBlockId();
}
```

(References to `process.env.NEXT_PUBLIC_*` must be literal for Next's build‑time
inlining — see `frontend/AGENTS.md`.)

**Ad wrapper** (`frontend/src/lib/ads/adsgram.ts`)

Add `showRewarded(): Promise<AdResult>` — identical best‑effort/timeout pattern
to `showInterstitial()`, but uses `adsgramRewardBlockId()`. `"shown"` ⇒ grant.

**Upload page** (`frontend/src/app/upload/page.tsx`)

- New state: `quotaBlocked: boolean`, `watchingAd: boolean`.
- On `403`: `setQuotaBlocked(true)` **and keep `state` as `"ready"`** (do not
  overwrite with an error state) so the file/preview persist for auto‑retry.
- `submit` gains an options arg: `submit({ skipInterstitial }: { skipInterstitial?: boolean } = {})`. When `skipInterstitial` is true, do not call
  `showInterstitial()`.
- `onWatchAd`: `setWatchingAd(true)` → `showRewarded()` →
  - `"shown"`: `POST /api/ads/reward`; on success (`regensLeft ≥ 1`)
    `setQuotaBlocked(false)` and `await submit({ skipInterstitial: true })`.
  - otherwise: show `upload.error.ad_unavailable`.
  - `finally`: `setWatchingAd(false)`.
- `reset()` also clears `quotaBlocked`.

**New component** (`frontend/src/components/upload/no-generations-banner.tsx`)

Renders the `upload.error.no_generations` message plus a primary **Watch ad**
button (`upload.actions.watch_ad`) with a loading/disabled state while
`watchingAd`. Styled like the existing banners/CTAs. Rendered from
`upload/page.tsx` when `quotaBlocked` (replaces showing the generic
`ErrorBanner` for this case).

**i18n** (`en.json` + `ru.json`, `upload` namespace)

- `upload.actions.watch_ad` — e.g. "Watch ad for 1 more generation" / RU.
- `upload.error.ad_unavailable` — e.g. "Ad couldn't load. Please try again." / RU.
- Reuse existing `upload.error.no_generations`.

## Edge cases & trade‑offs

- **Forgeable credit (accepted):** a logged‑in user can call
  `POST /api/ads/reward` directly to farm generations. Mitigated by session‑auth
  - throttle; the cost is extra pack compute, not a security breach. Auto‑hardens
    if S2S is adopted at 50k DAU.
- **Early‑close on interstitial block:** because we reuse the interstitial block,
  `show()` resolves even if the user closes early. Acceptable for now; creating a
  Reward block later closes this gap.
- **Ad unavailable outside Telegram / SDK missing:** `showRewarded()` returns
  `"skipped"`; we show `ad_unavailable` and grant nothing. (The upload page is
  already gated to Telegram for generation.)
- **Failure refund unaffected:** `markPackFailed` still decrements
  `generationsUsed`; the `AdReward` ledger is independent (cap side), so no
  interaction bug.
- **No new GET quota endpoint needed:** the reward POST returns the fresh
  `regensLeft`, so the client never polls.

## Testing

**Backend**

- `AdRewardService`: grants +1 (inserts a row), returns correct `regensLeft`,
  respects `unlimitedGenerations`.
- `AdRewardController`: `401` without session; success path returns
  `{ regensLeft }`.
- `computeCap` unit test (base + referral + adReward).
- Existing `pack.service.spec` stays green (`adRewardCount` defaults to 0).

**Frontend**

- Extend `adsgram.test.ts` with `showRewarded` (skipped outside Telegram /
  without SDK; `"shown"` on resolve).
- Extend `upload/__tests__/page.test.tsx`: `403` → no‑generations banner with
  Watch‑ad button; clicking → `showRewarded` + reward POST + auto‑retry submit
  (with interstitial skipped).

## Out of scope

- Adsgram S2S Reward URL callback and the dedicated Reward block (future, at 50k
  DAU). The env‑var fallback leaves a clean migration path.
- Any change to the referral‑based unlock or the during‑generation interstitial
  for normal (in‑quota) generations.
