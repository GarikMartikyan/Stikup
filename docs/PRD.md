# Stikup — Product Requirements Document

**Status:** Draft for review
**Last updated:** 2026-05-29
**Owner:** Product

---

## 1. Vision

Turn a single selfie into a personalized cartoon sticker pack and deliver it straight into the user's Telegram in under three minutes. Sticker packs are how Gen Z expresses themselves in chat — Stikup makes that expression unmistakably _theirs_.

## 2. Problem & Opportunity

Telegram sticker packs are universal, but the ones available today are generic. Users want stickers of _themselves_ but the existing path (find an artist, commission, format for Telegram, upload via Stickers bot) is too slow and expensive. AI image generation has crossed the quality threshold where a usable likeness can be generated from one photo in seconds at a sub-dollar cost.

The opportunity is to package that into a one-tap consumer flow inside Telegram, where the users already live.

## 3. Target Audience

**Primary:** Gen Z (16–24), heavy Telegram users, casual messengers, expressive sticker culture.

**Geography:** Launch markets are Russia/CIS (Russian) and global English. Language is selected by IP geolocation, with a manual override; default fallback is English.

**Willingness to pay:** Impulse range ($3–8 one-time); the unlock is priced at **$5** by default. Price is configurable. Users who don't want to pay can unlock for free by referring a friend who registers.

## 4. Core Value Proposition

> "A sticker pack of _you_, in your Telegram, in three minutes."

Three things define the product:

1. **Likeness** — the generated character is recognizably the user.
2. **Speed** — generation completes while the user waits (sync UX, ~1–3 min).
3. **Native delivery** — the bot creates a real Telegram sticker set the user owns and shares.

At MVP, every user gets the same single style. Style choice and tiered packs are explicitly out of scope.

## 5. User Flows

### 5.1 Entry points

The Telegram bot is the **primary** entry point. The direct web app at `stikup.app` is a secondary entry for users who arrive via search, ads, or a referral link. Both converge on the same web app and the same account record.

**A. Telegram Bot → Web app (primary)**

1. User finds or is referred to the Stikup bot.
2. Sends `/start`; bot replies with a "Make your stickers" button (URL button containing a single-use login token).
3. Tapping the button opens `stikup.app/auth/exchange?t=<token>` in the in-app browser; backend consumes the token, sets a session cookie, and redirects the user into the upload flow already authenticated.
4. Account is keyed by Telegram user ID via the channel-identity model in `docs/architecture/login-structure.md`.

**B. Direct web (stikup.app, secondary)**

1. User lands on the marketing page.
2. Signs up via Google OAuth, email + verification, or Telegram Login Widget.
3. Lands in the upload flow.
4. Before the bot can deliver the finished sticker set, the user must link a Telegram account (one-tap if they signed up via Telegram; otherwise prompted post-payment).

Both flows share the same backend; account records are unified through the `channel_identities` table so the same human can come in via any channel and get a single `users.id`.

### 5.2 The generation flow (happy path)

1. **Upload** — user selects a single image; client-side check requires a visible face and minimum resolution (512px+). Accepted formats: JPEG, PNG, HEIC. Max 10MB.
2. **Validate** — server runs face detection + NSFW classifier; rejects with a clear error if it fails.
3. **Generate the full 12-sticker pack** — backend issues a **single AI call** that returns one 3×4 grid image containing all 12 stickers in the default style. The Python post-processor splits the grid into 12 individual WebPs (background removed, Telegram-spec encoded). UI shows progress; total wait ~1–3 min.
4. **Show the pack with paywall in-place** — the user lands on a single results screen showing all 12 sticker cards in a grid. **3 cards are fully unlocked** and downloadable; **9 cards are visibly rendered but show a blurred preview with a lock overlay** (the underlying WebPs are real — they exist on the server, just gated by the UI/API). The screen presents **two ways to unlock all 12 stickers** plus other actions:
   - **Take the 3 free stickers** — bot delivers a free 3-sticker pack to Telegram (or download as PNG/WebP if not yet TG-linked).
   - **Unlock all 12 stickers** — two paths to the same result, both surfaced on the paywall:
     - **Refer a friend (free unlock)** — share a unique referral link. As soon as a referred friend **registers** on the platform, the 9 locked cards reveal and the bot delivers the full 12-sticker pack. No payment required.
     - **Pay $5 (instant unlock + 10 generations)** — opens Stripe Checkout. On success, the 9 locked cards reveal instantly (no new AI call), the bot delivers the full 12-sticker pack via `createNewStickerSet`, and the user is credited **10 additional generations** for creating more packs.
   - **Regenerate** — re-rolls a fresh 12-sticker pack from the same uploaded photo. Consumes one generation credit (see §5.3).
5. **Pay** — Stripe Checkout (cards + Apple Pay + Google Pay) for the **$5 unlock**. On success, backend marks the pack as unlocked, unlocks the 9 cards in the UI, credits the user **10 additional generations**, and triggers Telegram delivery.
6. **Deliver to Telegram** — backend asks Telegram Bot API to `createNewStickerSet` owned by the user's Telegram user ID. Bot DMs the user the `t.me/addstickers/<pack_name>` install link. Web app also shows the install link and a "share" CTA.

### 5.3 Edge flows

- **Free-plan quota** — each user gets **1 generation + 1 regeneration**, lifetime, on the free plan. The regeneration consumes the second slot. After that, the user can only keep the 3 free stickers from whichever of the two generations they prefer — to unlock all 12, they must either **refer a friend who registers** on the platform (free unlock) or **pay the $5 unlock**.
- **Paid unlock + generation credits** — the one-time **$5 unlock** reveals all 12 stickers of the current pack and credits the user **10 additional generations**. Each credit produces a fresh 12-sticker pack (from a new photo) or re-rolls an existing one; packs generated with paid credits are delivered fully unlocked, no second payment needed. There is no subscription and no recurring billing — the $5 is a one-time bundle, and once the 10 credits are used the user buys another $5 unlock to continue.
- **Refund** — refunds are issued only when generation failed technically or output is unusable. Email support handles requests case-by-case.
- **Referral unlock** — each user has a unique referral link. When a referred friend **registers** on the platform, the referrer's current locked pack unlocks for free — the 9 locked cards reveal and the bot delivers the full 12-sticker pack via `createNewStickerSet`. This is an alternative to the $5 unlock, not a generation top-up. Themed expansion packs are post-MVP.
- **Multiple packs** — users create more packs over time using their generation credits (10 per $5 unlock). When credits run out, another $5 unlock both reveals the current pack and refills 10 generations.

## 6. Features — MVP Scope

| Feature                       | Description                                                                                                                                                                                                                                                            |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication                | Three methods: Google OAuth, email + magic link/verification, Telegram (Login Widget for direct web, single-use token exchange for bot-initiated entry). All link to a single account record. Telegram link is required before bot delivery (auto if entered via bot). |
| i18n                          | Russian + English. Auto-detect from IP geolocation; user can override. All copy externalized.                                                                                                                                                                          |
| Photo upload                  | Single image, face required, server-side face + NSFW detection.                                                                                                                                                                                                        |
| 12-sticker pack generation    | Single AI call returns a 3×4 grid image; Python post-processor splits into 12 Telegram-spec WebPs. One default style at MVP. No watermark on any sticker.                                                                                                              |
| Locked-card paywall           | All 12 generated stickers are shown in a single grid: 3 fully unlocked + 9 with a blurred preview and lock overlay. Unlock count is config-driven.                                                                                                                     |
| Paywall + Stripe checkout     | One-time **$5** payment unlocks all 12 stickers of the current pack **and credits 10 additional generations**. Stripe handles cards, Apple Pay, Google Pay.                                                                                                            |
| Bot delivery                  | Bot creates a Telegram sticker set owned by the user via `createNewStickerSet`, DMs install link. Free-plan users get a 3-sticker set; unlocked users get a 12-sticker set.                                                                                            |
| Regeneration                  | Re-rolls a fresh 12-sticker pack from the same uploaded photo. Free plan: 1 regen lifetime. After a $5 unlock: each re-roll consumes one of the 10 generation credits.                                                                                                 |
| Referral                      | Each user gets a unique referral link. When a referred friend **registers** on the platform, the referrer's current pack unlocks for free (all 12 stickers) — a no-cost alternative to the $5 unlock.                                                                  |
| Social share + download       | "Share to Instagram / TikTok / Twitter" buttons surface sample stickers. Users can also download stickers (PNG/WebP) for use outside Telegram.                                                                                                                         |
| Notifications (transactional) | Email: receipt, password/security. Telegram DM: pack ready, payment confirmed, referral credited.                                                                                                                                                                      |
| Account management            | View past packs, request regeneration (within paid quota), request refund, delete account + data (GDPR).                                                                                                                                                               |

## 7. Out of Scope (Phase 2 and Beyond)

Priority order based on roadmap input. **Subscription is explicitly out — Stikup is a one-time-purchase product, not now and not later.**

1. **Themed expansion packs** — pre-made themes (love, gaming, holidays) the user buys as one-time add-ons to an existing paid pack.
2. **Style choice** — additional non-default styles, selectable post-payment.
3. **Animated stickers** — premium one-time upsell, video-model-based.
4. **WhatsApp support** — second messenger channel. (The auth/identity layer is already designed for it; see `docs/architecture/login-structure.md`.)
5. **Group / family packs** — multiple users combined into one pack as a one-time bundle.

## 8. Brand & Voice

- **Personality:** Playful, emoji-forward, friendly. Reads like a friend who's hyped about your stickers.
- **Bot copy example:** "Your sticker pack is ALIVE! 🎉 Tap to install →"
- **Web copy is concise** — mobile-first, short sentences, action verbs (the user lands on the site from Telegram's in-app browser via the bot's URL button).
- **Visual identity:** Bold, vivid colors that echo the Classic Sticker style. Final visual identity defined during design.

## 9. Pricing & Monetization

- **Model:** Pure one-time impulse. A single **$5 unlock** that bundles the current pack plus 10 generation credits. **No subscription, ever** — not at MVP, not later.
- **Price point:** Single unlock price, defined in config (**default $5 USD**). Regional pricing supported via a config table keyed off geolocation/currency (CIS markets priced lower in local currency).
- **What the payment unlocks:** All 12 stickers of the current pack (the 9 locked cards reveal instantly, no new generation needed) + **10 additional generations** (each produces a fully unlocked pack or a re-roll) + Telegram delivery via `createNewStickerSet`.
- **Free unlock alternative:** Users can unlock a pack at no cost by referring a friend who **registers** on the platform — a growth lever and a price-sensitive escape hatch.
- **What requires another purchase:** Another $5 unlock once the 10 generation credits are used up. There is no "unlimited" mode and no recurring billing.
- **Payment provider:** Stripe (cards + Apple Pay + Google Pay). Currency selection per market.

## 10. Content Moderation

- **NSFW detection** on every uploaded photo, reject with clear message if positive.
- **Face detection** — single visible face required; reject if missing, multiple, or too low quality.
- **Curated emotion set** — the 12 emotions/poses generated per pack are predefined in config (no free-form user prompts at MVP), removing the moderation surface for generated output.

## 11. Privacy & Compliance

- **Minimum age:** 13+. Sign-up requires the user to attest.
- **GDPR-compliant from day one:** Terms of Service, Privacy Policy, cookie banner for EU, in-app data export + account deletion.
- **Data retention:** Original uploaded photos and generated stickers are stored. Users can delete their account and all associated data from settings; deletion cascades to storage and the Telegram sticker set (best-effort).
- **Cookie & analytics consent** explicit for EU visitors.

## 12. Notifications

Transactional only at MVP. Marketing emails are post-MVP and require explicit opt-in.

| Event                                     | Channel                                  | Notes                         |
| ----------------------------------------- | ---------------------------------------- | ----------------------------- |
| Sign-up confirmation                      | Email                                    | If signed up via email/Google |
| Free preview ready                        | In-app (no push)                         | Sync UX, user is waiting      |
| Payment receipt                           | Email + Telegram DM                      |                               |
| Full pack ready                           | Telegram DM (with install link) + in-app | Primary success moment        |
| Regeneration ready                        | Telegram DM + in-app                     |                               |
| Referral credited (your pack is unlocked) | Telegram DM + email                      |                               |
| Account / password security               | Email                                    |                               |

## 13. Support

- **Channels:** Email (`support@stikup.app`) + Telegram support contact + in-app FAQ.
- **FAQ covers:** "Pack didn't arrive", "How to install in Telegram", "Refunds", "How to delete my data", "Photo rejected — why?", "Regeneration policy".
- **Response SLA at MVP:** Best-effort, 48h target.

## 14. Anti-Abuse & Rate Limits

All limits live in a config file; the values below are MVP defaults.

| Limit                               | Default                                   | Why                                                                                                   |
| ----------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Free-plan generations per account   | 1 lifetime                                | Each free user gets exactly one initial 12-sticker generation                                         |
| Free-plan regenerations per account | 1 lifetime                                | Each free user gets one re-roll on top of their initial generation                                    |
| Generations per $5 unlock           | 10                                        | Each $5 unlock reveals the current pack and credits 10 additional generations (new packs or re-rolls) |
| New accounts per IP per day         | 3                                         | Prevents account-creation farming behind the lifetime free quota                                      |
| Max pack size                       | 12 stickers (MVP) / 30 (Telegram ceiling) | MVP fixed at 12; Telegram allows up to 30 if expanded later                                           |
| Max upload size                     | 10 MB                                     |                                                                                                       |
| Allowed image formats               | JPEG, PNG, HEIC                           |                                                                                                       |

Paid generations are not rate-limited at the account level beyond reasonable abuse-prevention thresholds (e.g., Stripe disputes, anomalous purchase velocity).

## 15. Configurable Parameters (config file)

These parameters MUST live in a config file and be changeable without a deploy:

- Pack size (default 12 stickers, generated as a 3×4 grid)
- Free unlocked sticker count (default 3 of 12)
- Price points per region/currency (default $5 unlock, single tier)
- Referral unlock (default: a referred friend registering unlocks the referrer's current pack — all 12 stickers — for free)
- Free-plan quota (default: 1 generation + 1 regeneration per account, lifetime)
- Paid unlock credits (default: 10 generations per $5 unlock)
- Rate limits (see §14)
- Emotion set (list of 12 emotions/poses generated per pack)
- AI provider + model

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

- **Frontend:** Next.js (App Router), TypeScript, mobile-first responsive. The site loads inside Telegram's in-app browser when entered via the bot's URL button — no Telegram Mini App SDK required; auth comes from the token-exchange flow defined in `docs/architecture/login-structure.md`.
- **Backend:** NestJS, TypeScript.
- **Image generation:** Hosted API (OpenAI gpt-image-1 / Replicate / equivalent). Provider abstracted behind an interface so the model is config-driven. **One AI call per pack** — the model returns a single 3×4 grid image containing all 12 stickers in the default MVP style. The same image is used for both free and paid users; the locked-card UI gates the 9 paid stickers at the application layer.
- **Image post-processing:** Python CLI (Pillow + `rembg`) invoked as a subprocess by the generation worker. Splits the 3×4 grid into 12 individual cells, removes the background (transparent alpha), and encodes each cell as a Telegram-spec WebP (512px max edge, ≤512 KB). No watermark.
- **Payments:** Stripe.
- **Bot:** Telegram Bot API (via `grammY` or `node-telegram-bot-api`).
- **DB & storage:** Relational DB for user/account/pack/order state; object storage for uploaded photos, the raw AI grid image, and final per-sticker WebPs. Specific choices (Postgres, S3-compatible storage) decided in the implementation plan.
- **i18n:** `next-intl` or equivalent, with locale auto-detection via IP.

## 18. Launch Criteria (MVP Ship Bar)

The MVP is ready to launch when:

1. A user can complete the full happy path from `/start` in the bot (or stikup.app sign-up) to receiving an installable Telegram sticker set, in production, on mobile.
2. The same happy path works on the public web app.
3. All three sign-in methods work, with bot-initiated entry being the primary flow.
4. Russian + English locales render fully.
5. NSFW + face detection block the documented bad inputs.
6. The 12-sticker generation + locked-card paywall renders correctly: 3 unlocked + 9 with a clear lock overlay; locked cards reveal instantly on successful payment with no second AI call.
7. Stripe payments are live; a successful $5 purchase unlocks all 12 stickers, credits 10 additional generations, and triggers `createNewStickerSet` delivery.
8. Free-plan quota (1 generate + 1 regen lifetime) and paid generation credits (10 per $5 unlock) are enforced server-side.
9. Referrals credit correctly end-to-end: a referred friend registering unlocks the referrer's current pack (all 12 stickers) for free.
10. Account deletion removes all user data.
11. Email + Telegram support inboxes are monitored.

## 19. Risks & Open Questions

- **AI likeness consistency.** Single-photo input limits how recognizable the cartoon is. Mitigation: tight prompt engineering and model choice — the default MVP style should be the most forgiving for likeness.
- **Locked-card UX tuning.** The blur level on the 9 locked cards is the single biggest conversion lever. Too much blur and users can't tell what they'd get — too little and they screenshot instead of paying. Requires visual tuning and A/B testing post-launch.
- **AI cost on free users.** Because we generate all 12 stickers upfront for every free user, free-tier AI cost is identical to paid-tier AI cost. At low conversion rates this can dominate unit economics. Mitigation: enforce the 1-generation lifetime free quota strictly, and monitor blended cost per paying customer closely.
- **Telegram sticker pack name uniqueness.** Pack names must be globally unique on Telegram and end in `_by_<bot>`. Naming scheme (e.g., `stikup_<userhash>_<n>`) is decided in implementation.
- **AI provider cost variance.** Per-image cost drives unit economics. Pricing must leave margin under worst-case provider costs.
- **Refund disputes.** "Quality clearly bad" is subjective. We will codify rejection criteria in the FAQ and lean on the included generation credits to deflect most issues.
- **Referral-unlock abuse.** A free unlock triggered by a friend _registering_ (no purchase required) is cheap to game with throwaway accounts. Mitigation: count a referral only once per uniquely-verified new account, reuse the per-IP new-account cap (§14), and consider requiring the referee to complete their own free preview before the unlock credits. Exact qualifying conditions are an open question for implementation.

---

_Decisions deferred to the technical implementation plan: hosting providers, database choice, object storage, analytics tooling, exact rate-limit infrastructure, observability stack._
