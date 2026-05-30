# Telegram Sticker Sets — Design

**Date:** 2026-05-31
**Status:** Approved (proceeding to implementation)

## Goal

When a user clicks "Get stickers" in Telegram, the bot must create a **real
Telegram sticker set** (not loose files), add all the stickers the user is
entitled to, and send the user the shareable `t.me/addstickers/<name>` link.

The set's visible **title** is `"<username> Stickers by @<BotUsername>"`.

When a referral later unlocks the rest of the pack for a user, the additional
stickers must be appended to that user's **existing** sticker set (creating it
if it does not exist yet).

## Decisions (from brainstorming)

- **Delivery mode:** Replace the current "send N loose stickers" flow. The user
  receives only the shareable pack link (plus the API returns the URL).
- **No-username fallback:** Title becomes `"user<telegramId> Stickers by @<Bot>"`.
- **Emoji:** One default emoji for every sticker (configurable, default `😀`).
- **Set scope:** **One Telegram sticker set per generated `Pack`.** The set
  name + current sticker count are stored on the `Pack` row.
- **Referral top-up scope:** Top up **all** of the referrer's packs that already
  have a set and are below full size (not just the most recent).
- **Re-delivery:** If a pack already has a set, re-triggering delivery re-sends
  the existing link (and tops it up if now unlocked & under full size) instead
  of the current dead-end `alreadyClaimed`.

## Telegram API contract (verified against installed telegraf 4.16.3 / @telegraf/types, Bot API 6.6+)

- `telegram.uploadStickerFile(ownerId, InputFile, 'static')` → returns `File`
  (we use `file.file_id`). Robust upload-first path; avoids batch `attach://`.
- `telegram.createNewStickerSet(ownerId, name, title, { stickers: InputSticker[], sticker_format: 'static', sticker_type?: 'regular' })`
- `telegram.addStickerToSet(ownerId, name, { sticker: InputSticker })`
- `telegram.getStickerSet(name)` → used for idempotency (does the set exist? how
  many stickers already in it?).
- `InputSticker = { sticker: file_id | InputFile, emoji_list: string[] }` (1–20 emoji).
- **Set short-name rules:** only `[a-z0-9_]`, must begin with a letter, no
  consecutive underscores, must end in `_by_<bot_username>` (case-insensitive),
  1–64 chars. Globally unique.
- **Static sticker image rules:** WEBP/PNG, one side exactly 512px, ≤512KB.
  Current placeholder + free assets are already **512×512 RGBA WebP ≤512KB**,
  and the Python pipeline (`fit_into_square`, size=512) also conforms — **no
  resize layer needed.**

## Data model (Prisma migration)

Add to `model Pack`:

```prisma
telegramStickerSetName String? @map("telegram_sticker_set_name")
telegramStickerCount   Int     @default(0) @map("telegram_sticker_count")
```

Migration `prisma/migrations/20260531000000_add_pack_telegram_sticker_set/migration.sql`
(hand-written SQL, matching repo convention — no DB needed at author time):

```sql
ALTER TABLE "packs" ADD COLUMN "telegram_sticker_set_name" TEXT;
ALTER TABLE "packs" ADD COLUMN "telegram_sticker_count" INTEGER NOT NULL DEFAULT 0;
```

Run `npx prisma generate` after editing the schema so the client types include
the new fields (typecheck depends on this).

## New service: `TelegramStickerService`

Location: `backend/src/auth/channel/telegram-sticker.service.ts`.
Provided **and exported** from `AuthModule` (alongside `TelegramBotSender`), so
both `PackService` and `ReferralService` (which already import `AuthModule`) can
inject it. Injects the bot via `@InjectBot()` (same pattern as `TelegramBotSender`).

Config: `STICKER_DEFAULT_EMOJI` env (default `😀`).

### Responsibilities / methods

- `buildSetName(packId, botUsername): string`
  - `p` + packId hex without dashes (lowercased) + `_by_<botUsername>`.
  - Guaranteed valid (starts with letter `p`, no `--`/`__`, ≤64 chars) and
    unique per pack.
- `buildTitle(usernameOrFallback, botUsername): string`
  - `"<username> Stickers by @<botUsername>"`. Caller passes username, or
    `user<telegramId>` when no @username. Clamp to ≤64 chars.
- `shareUrl(setName): string` → `https://t.me/addstickers/<setName>`.
- `ensureSet({ channelUserId, packId, title, files }): Promise<{ shareUrl, count }>`
  - `files` is the **full ordered list** of local sticker paths that should be
    in the set (indexes 0..N-1).
  - Resolve `botUsername` (dynamic, via existing cached `getMe`), build `name`.
  - Call `getStickerSet(name)`:
    - **Not found** → upload `files` → `createNewStickerSet` with all of them.
    - **Found with `k` stickers** → upload + `addStickerToSet` for files `[k..N-1]`
      only (skip if `k >= N`). This makes create + top-up idempotent and
      crash-safe regardless of what's persisted on the Pack.
  - Each `InputSticker.emoji_list = [defaultEmoji]`.
  - Returns the share URL and the resulting sticker count.
  - All Telegram calls wrapped; errors bubble up to the caller for rollback.

### Image upload helper

Upload each file with `uploadStickerFile(ownerId, Input.fromLocalFile(path), 'static')`,
collect `file_id`s, then reference them as `InputSticker.sticker`.

## Delivery flow — rewrite `PackService.deliverTelegram(packId, userId)`

1. Resolve `botUrl`, verify pack ownership, resolve Telegram identity
   (`channelUserId`, **and `username`** from `ChannelIdentity`). If no identity →
   `{ delivered:false, needsTelegram:true }` (unchanged).
2. Resolve `unlocked` + `count` (3 free / 12 unlocked) as today.
3. Load the pack's `telegramStickerSetName` / `telegramStickerCount`.
4. **Claim guard (revised):**
   - Try to insert `PackClaim`.
   - If `P2002` (already claimed): this is now a **re-delivery** — do NOT dead-end.
     Continue to ensure/top-up the set and re-send the link.
5. Build `files = getPlaceholderFiles(count)` (indexes 1..count). Abort+rollback
   if empty (unchanged behavior).
6. Call `telegramStickerService.ensureSet({ channelUserId, packId, title, files })`.
   - `title = buildTitle(identity.username ?? 'user'+channelUserId, botUsername)`.
7. On Telegram failure → roll back the claim **only if this call inserted it**
   (don't delete a pre-existing claim on re-delivery), return `{ delivered:false }`.
8. Persist `telegramStickerSetName` + `telegramStickerCount` on the Pack.
9. Send the share URL to the user via `botSender.sendMessage(channelUserId, link)`.
10. Return `{ delivered:true, botUrl, stickerSetUrl }`.

`DeliverTelegramResult` gains `stickerSetUrl?: string`.

Add a `getPlaceholderFiles`-style slice or pass the full list — `ensureSet`
computes the missing range itself via `getStickerSet`, so callers always pass the
full intended file list for the current entitlement.

## Referral top-up — `ReferralService.attribute()`

Inside the existing `referralUnlockEnabled && fullPackUnlockedAt == null` branch,
after setting `fullPackUnlockedAt`:

1. Resolve the referrer's Telegram identity (`channelUserId`, `username`) — already
   partially done for the notification.
2. Find the referrer's packs where `telegramStickerSetName != null` AND
   `telegramStickerCount < packSize`.
3. For each such pack, call `ensureSet` with the **full** packSize file list
   (`getPlaceholderFiles(packSize)`); `ensureSet` appends only the missing
   `[currentCount..packSize-1]` stickers. Persist the new count.
4. Send the referrer a message: existing unlock text **plus** the pack link(s).
5. All best-effort: wrap in try/catch, log failures, never break attribution
   (which is already idempotent on `P2002`).

If the referrer has no set yet, skip — they get the full 12 on next delivery.

## Error handling & edge cases

- Bot username fetched dynamically (Telegram enforces `_by_<bot>` suffix must
  match the real bot username) — reuse `TelegramBotSender`'s cached `getMe`
  approach (or expose it).
- `getStickerSet` throwing "not found" (`400`) is the normal "create" signal —
  distinguish "not found" from other errors so real failures still surface.
- Re-delivery must not double-add stickers (handled by `getStickerSet` count check).
- Claim rollback only for claims this invocation created.

## Out of scope

- Real AI sticker images (pipeline still emits placeholders; this works on
  today's files and upgrades automatically).
- Frontend changes beyond optionally consuming `stickerSetUrl`.
- Non-Telegram channels (sticker sets are Telegram-only).

## Testing

- Unit: `buildSetName` (valid chars, suffix, length, uniqueness), `buildTitle`
  (username vs fallback, ≤64 clamp), `shareUrl`.
- Unit (mocked bot): `ensureSet` create path, top-up path (k>0), already-full
  (k>=N) no-op, not-found vs error distinction.
- Unit (mocked): `deliverTelegram` create + re-delivery + claim-rollback;
  `ReferralService.attribute` top-up across multiple packs + no-set skip.
- Follow existing test conventions in the backend (jest, `*.spec.ts`).
