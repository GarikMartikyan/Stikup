# Stikup — Product Requirements Document

**Status:** Draft for review
**Last updated:** 2026-05-24
**Owner:** Product

---

## 1. Vision

Turn a single selfie into a personalized cartoon sticker pack and deliver it straight into the user's Telegram in under three minutes. Sticker packs are how Gen Z expresses themselves in chat — Stikup makes that expression unmistakably *theirs*.

## 2. Problem & Opportunity

Telegram sticker packs are universal, but the ones available today are generic. Users want stickers of *themselves* but the existing path (find an artist, commission, format for Telegram, upload via Stickers bot) is too slow and expensive. AI image generation has crossed the quality threshold where a usable likeness can be generated from one photo in seconds at a sub-dollar cost.

The opportunity is to package that into a one-tap consumer flow inside Telegram, where the users already live.

## 3. Target Audience

**Primary:** Gen Z (16–24), heavy Telegram users, casual messengers, expressive sticker culture.

**Geography:** Launch markets are Russia/CIS (Russian) and global English. Language is selected by IP geolocation, with a manual override; default fallback is English.

**Willingness to pay:** Impulse range ($3–8 one-time). Price is configurable.

## 4. Core Value Proposition

> "A sticker pack of *you*, in your Telegram, in three minutes."

Three things define the product:

1. **Likeness** — the generated character is recognizably the user.
2. **Speed** — generation completes while the user waits (sync UX, ~1–3 min).
3. **Native delivery** — the bot creates a real Telegram sticker set the user owns and shares.

## 5. User Flows

### 5.1 Entry points

There are two primary entry points; both converge on the same web app.

**A. Direct web (stikup.app)**
1. User lands on marketing page.
2. Signs up via Google OAuth, email + verification, or Telegram Login Widget.
3. Lands in the upload flow.

**B. Telegram Bot → Mini App**
1. User finds or is referred to the Stikup bot.
2. Sends `/start`; bot replies with a "Make your stickers" button that launches the Telegram Mini App (web app embedded in Telegram).
3. Mini App opens with `initData` from Telegram; user is auto-authenticated via Telegram user ID.
4. Lands in the upload flow.

Both flows share the same backend; account records are unified by Telegram user ID where present.

### 5.2 The generation flow (happy path)

1. **Upload** — user selects a single image; client-side check requires a visible face and minimum resolution (512px+). Accepted formats: JPEG, PNG, HEIC. Max 10MB.
2. **Validate** — server runs face detection + NSFW classifier; rejects with a clear error if it fails.
3. **Generate free preview** — backend generates 4 stickers in the default style with the Stikup watermark. UI shows progress; previews stream in as they complete.
4. **Show paywall** — user sees the 4 previews and a "Unlock full pack" CTA with the price and feature list (style choice, no watermark, full pack size, included regeneration).
5. **Pay** — Stripe Checkout (or Stripe Elements inline). On success, backend starts the paid generation job.
6. **Choose style** — paid users pick from the available style variants (one default + N premium styles, defined in config). Free preview was forced to the default.
7. **Generate full pack** — backend generates the entire pack (all configurable stickers, including clean versions of the preview emotions in the user's chosen style). The watermarked previews are replaced. Progress UI shows N of M.
8. **Deliver to Telegram** — backend asks Telegram Bot API to `createNewStickerSet` owned by the user's Telegram user ID. Bot DMs the user the `t.me/addstickers/<pack_name>` install link. Web app also shows the install link and a "share" CTA.

### 5.3 Edge flows

- **Regeneration** — one free regeneration of the full pack is included per purchase. User can request it from their account page within 7 days. Beyond that, treated as a new purchase.
- **Refund** — refunds are issued only when generation failed technically or output is unusable. Email support handles requests case-by-case.
- **Pack expansion** — the referral reward adds 2 additional emotion stickers to an existing pack via `addStickerToSet`. Themed expansion packs are post-MVP.
- **Multiple packs** — users can create unlimited packs over time; each pack is a separate purchase.

## 6. Features — MVP Scope

| Feature | Description |
|---|---|
| Authentication | Three methods: Google OAuth, email + magic link/verification, Telegram Login Widget. All link to a single account record keyed by user. Telegram link is required before delivery (auto if using TG Login or Mini App). |
| i18n | Russian + English. Auto-detect from IP geolocation; user can override. All copy externalized. |
| Photo upload | Single image, face required, server-side face + NSFW detection. |
| Free preview | Default style, "stikup.app" watermark. Sticker count and style set in config (MVP default: 4). |
| Paywall + Stripe checkout | One-time payment unlocks the full pack. Stripe handles cards, Apple Pay, Google Pay. |
| Style choice (paid only) | Default style + ≥1 alternate styles. Set of styles defined in config. Free preview is locked to default. |
| Full pack generation | Configurable pack size (default 16). Static stickers only (WebP, Telegram-spec). |
| Bot delivery | Bot creates a Telegram sticker set owned by the user via `createNewStickerSet`, DMs install link. |
| Included regeneration | One free regeneration of the full pack within 7 days of purchase. |
| Referral | Each user gets a unique referral link. When a referee signs up *and* completes a paid purchase, the referrer's existing pack expands by 2 additional emotion stickers (free). |
| Social share + download | "Share to Instagram / TikTok / Twitter" buttons surface sample stickers with the watermark. Users can also download stickers (PNG/WebP) for use outside Telegram. |
| Notifications (transactional) | Email: receipt, regeneration ready, password/security. Telegram DM: pack ready, payment confirmed, referral credited. |
| Account management | View past packs, request regeneration, request refund, delete account + data (GDPR). |

## 7. Out of Scope (Phase 2 and Beyond)

Priority order based on roadmap input:

1. **Themed expansion packs** — pre-made themes (love, gaming, holidays) the user buys as add-ons to an existing pack.
2. **Animated stickers** — premium tier, video-model-based.
3. **WhatsApp support** — second messenger channel.
4. **Subscription tier** — unlimited regenerations + monthly themed packs.
5. **Group / family packs** — multiple users combined into one pack.

## 8. Brand & Voice

- **Personality:** Playful, emoji-forward, friendly. Reads like a friend who's hyped about your stickers.
- **Bot copy example:** "Your sticker pack is ALIVE! 🎉 Tap to install →"
- **Mini App copy is concise** — mobile-first, short sentences, action verbs.
- **Visual identity:** Bold, vivid colors that echo the Classic Sticker style. Final visual identity defined during design.

## 9. Pricing & Monetization

- **Model:** Free preview + one-time unlock per pack. (Subscription is roadmap.)
- **Price point:** Defined in config (initial target range $4.99–$9.99 USD). Regional pricing supported by config keyed off geolocation/currency.
- **What unlocks:** Full pack size, watermark removal, style choice, included regeneration, social sharing.
- **Payment provider:** Stripe (cards + Apple Pay + Google Pay). Currency selection per market.

## 10. Content Moderation

- **NSFW detection** on every uploaded photo, reject with clear message if positive.
- **Face detection** — single visible face required; reject if missing, multiple, or too low quality.
- **Operator-flagged emotions** — emotions/poses themselves are predefined and curated (no free-form user prompts at MVP), removing the moderation surface for generated output.

## 11. Privacy & Compliance

- **Minimum age:** 13+. Sign-up requires the user to attest.
- **GDPR-compliant from day one:** Terms of Service, Privacy Policy, cookie banner for EU, in-app data export + account deletion.
- **Data retention:** Original uploaded photos and generated stickers are stored. Users can delete their account and all associated data from settings; deletion cascades to storage and the Telegram sticker set (best-effort).
- **Cookie & analytics consent** explicit for EU visitors.

## 12. Notifications

Transactional only at MVP. Marketing emails are post-MVP and require explicit opt-in.

| Event | Channel | Notes |
|---|---|---|
| Sign-up confirmation | Email | If signed up via email/Google |
| Free preview ready | In-app (no push) | Sync UX, user is waiting |
| Payment receipt | Email + Telegram DM | |
| Full pack ready | Telegram DM (with install link) + in-app | Primary success moment |
| Regeneration ready | Telegram DM + in-app | |
| Referral credited (you earned 2 stickers) | Telegram DM + email | |
| Account / password security | Email | |

## 13. Support

- **Channels:** Email (`support@stikup.app`) + Telegram support contact + in-app FAQ.
- **FAQ covers:** "Pack didn't arrive", "How to install in Telegram", "Refunds", "How to delete my data", "Photo rejected — why?", "Regeneration policy".
- **Response SLA at MVP:** Best-effort, 48h target.

## 14. Anti-Abuse & Rate Limits

All limits live in a config file; the values below are MVP defaults.

| Limit | Default | Why |
|---|---|---|
| Free preview generations per account per rolling 7 days | 1 | Prevents free-tier farming |
| Regenerations per account per rolling 7 days | 1 | Prevents abuse of the included free regeneration |
| New accounts per IP per day | 3 | Prevents account-creation farming behind rate limit |
| Max pack size | 30 stickers | Below Telegram's sticker-set ceiling |
| Max upload size | 10 MB | |
| Allowed image formats | JPEG, PNG, HEIC | |

Paid generations are not rate-limited at the account level beyond reasonable abuse-prevention thresholds (e.g., Stripe disputes, anomalous purchase velocity).

## 15. Configurable Parameters (config file)

These parameters MUST live in a config file and be changeable without a deploy:

- Free preview sticker count (default 4)
- Full pack sticker count (default 16)
- Available styles (default style + paid alternates)
- Price points per region/currency
- Referral reward count (default 2)
- Regeneration window (default 7 days)
- Rate limits (see §14)
- Emotion set (list of emotions/poses generated)
- Watermark on/off per tier
- AI provider + model per style

## 16. Success Metrics

**North-star:** **Paid conversion rate** = % of users who complete a free preview and then complete a paid purchase.
- MVP target: 8–15%
- Reported daily and weekly

**Secondary:**
- Time to pack delivery (P50, P95) — UX health
- Free-to-paid funnel: signup → upload → preview → checkout → paid
- Regeneration request rate — quality signal
- Refund rate — quality signal
- Referral participation rate — growth health
- Revenue / ARPU — business health

## 17. Tech Stack (Reference)

Stack-level decisions; full architecture lives in the technical implementation plan.

- **Frontend:** Next.js (App Router), TypeScript, mobile-first responsive. Telegram Mini App SDK integration.
- **Backend:** NestJS, TypeScript.
- **Image generation:** Hosted API (OpenAI gpt-image-1 / Replicate / equivalent). Provider abstracted behind an interface so the model per style is config-driven. **One AI call per pack** — the model returns a single `rows × cols` grid image containing all stickers, sized to the emotion count (e.g. 2×2 for a 4-sticker preview, 4×4 for a 16-sticker full pack).
- **Image post-processing:** Python CLI (Pillow + `rembg`) invoked as a subprocess by the generation worker. Splits the grid into individual cells, removes the background (transparent alpha), optionally applies the watermark, and encodes each cell as a Telegram-spec WebP (512px max edge, ≤512 KB).
- **Payments:** Stripe.
- **Bot:** Telegram Bot API (via `grammY` or `node-telegram-bot-api`).
- **DB & storage:** Relational DB for user/account/pack/order state; object storage for uploaded photos, the raw AI grid image, and final per-sticker WebPs. Specific choices (Postgres, S3-compatible storage) decided in the implementation plan.
- **i18n:** `next-intl` or equivalent, with locale auto-detection via IP.

## 18. Launch Criteria (MVP Ship Bar)

The MVP is ready to launch when:

1. A user can complete the full happy path from `/start` in the bot (or stikup.app sign-up) to receiving an installable Telegram sticker set, in production, on mobile.
2. The same happy path works on the public web app.
3. All three sign-in methods work.
4. Russian + English locales render fully.
5. NSFW + face detection block the documented bad inputs.
6. Stripe payments are live and a successful purchase triggers paid generation.
7. Referrals credit correctly end-to-end.
8. Free regeneration works end-to-end.
9. Account deletion removes all user data.
10. Email + Telegram support inboxes are monitored.

## 19. Risks & Open Questions

- **AI likeness consistency.** Single-photo input limits how recognizable the cartoon is. Mitigation: tight prompt engineering, choice of model, accept that "Classic Sticker style" is the most forgiving option.
- **Telegram sticker pack name uniqueness.** Pack names must be globally unique on Telegram and end in `_by_<bot>`. Naming scheme (e.g., `stikup_<userhash>_<n>`) is decided in implementation.
- **AI provider cost variance.** Per-image cost drives unit economics. Pricing must leave margin under worst-case provider costs.
- **Refund disputes.** "Quality clearly bad" is subjective. We will codify rejection criteria in the FAQ and lean on the included free regeneration to deflect most issues.

---

*Decisions deferred to the technical implementation plan: hosting providers, database choice, object storage, analytics tooling, exact rate-limit infrastructure, observability stack.*
