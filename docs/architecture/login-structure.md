# Universal Login Structure — Telegram + WhatsApp

A single auth flow that works for both messaging platforms. The web app does not know or care which channel delivered the user.

---

## 1. Design principle

WhatsApp has **no signed identity handoff**. Telegram has `login_url` (OAuth-like). To work on both, the system is built for WhatsApp's floor — **deep-link token exchange** — with Telegram's `login_url` available as an optional fast-path.

A **channel-abstraction layer** normalizes platform-specific webhooks into a single `ChannelEvent` shape. Everything downstream (identity, tokens, sessions) is channel-agnostic.

---

## 2. Capability matrix

|                                  | Telegram                   | WhatsApp                          |
| -------------------------------- | -------------------------- | --------------------------------- |
| Signed identity to URL           | Yes (`login_url`, HMAC)    | No                                |
| Native "Sign in with X"          | Login Widget               | None                              |
| Identity signal from webhook     | `user_id`, `username`      | E.164 phone, `profile.name`       |
| URL button in message            | Inline keyboard `url`      | Interactive CTA URL button        |
| Cold-send (outside 24h window)   | Anytime                    | Only pre-approved templates       |
| OAuth 2.0 for end users          | No                         | No                                |

Lowest common denominator → token-exchange via URL button. Always available, identical UX.

---

## 3. Data model

```sql
-- Application user (channel-independent)
users (
  id          uuid primary key,
  created_at  timestamptz not null default now()
);

-- One user ↔ many channel identities (TG + WA + email + …)
channel_identities (
  id              uuid primary key,
  user_id         uuid not null references users(id),
  channel         text not null check (channel in ('telegram','whatsapp')),
  channel_user_id text not null,           -- TG numeric id  OR  WA E.164 phone
  display_name    text,
  username        text,                    -- Telegram only, nullable
  created_at      timestamptz not null default now(),
  unique (channel, channel_user_id)
);

-- One-time login tokens (issued by bot, consumed by web app)
login_tokens (
  token        text primary key,           -- 32+ random bytes, url-safe
  user_id      uuid not null references users(id),
  issued_via   text not null check (issued_via in ('telegram','whatsapp')),
  expires_at   timestamptz not null,       -- now() + interval '5 minutes'
  consumed_at  timestamptz                 -- non-null ⇒ already used
);
create index on login_tokens (expires_at);
```

---

## 4. Universal flow

1. **Inbound message.** User sends `/start` (or any message) to the bot. Platform fires a webhook to our server.
2. **Normalize.** The matching **Channel Adapter** parses the webhook into:
   ```ts
   type ChannelEvent = {
     channel: 'telegram' | 'whatsapp';
     channel_user_id: string;
     profile: { display_name?: string; username?: string };
   };
   ```
3. **Resolve identity.** **Identity Service** upserts `channel_identities`, returns `user_id`. Creates a new `users` row on first contact.
4. **Mint token.** **Token Service** generates a 32-byte random url-safe token, stores it with `user_id`, `issued_via`, `expires_at = now() + 5 min`.
5. **Send link.** **Bot Sender** sends `https://app.example.com/auth/exchange?t=<token>` via the originating channel (URL button on TG, CTA URL button on WA).
6. **Exchange.** User taps the button → browser opens `GET /auth/exchange?t=…`.
7. **Validate + consume.** **Auth Service** atomically consumes the token (single-use), validates `expires_at`, sets the session cookie, and `302` redirects to `/dashboard`.

### Telegram fast-path (optional)

Replace steps 4–6 with a Telegram `login_url` inline button pointing at `/auth/telegram-callback`. Telegram appends signed user data to the URL. The Auth Service:

1. Verifies the `hash` field with HMAC-SHA256 using `SHA256(bot_token)` as the key.
2. Rejects if `auth_date` is older than ~1 day.
3. Maps the verified `telegram user_id` via the same Identity Service.
4. Issues a session.

Token table is not touched. Telegram still falls back to the universal flow if `login_url` is not configured.

---

## 5. Components

| Component | Responsibility | Why it exists |
| --- | --- | --- |
| **Telegram Adapter** | Parse TG webhook → `ChannelEvent` | Isolates Bot API quirks |
| **WhatsApp Adapter** | Parse WA Cloud API webhook → `ChannelEvent` | Isolates Meta API quirks |
| **Identity Service** | `(channel, channel_user_id)` → `user_id`; create + link | Single source of truth for identity |
| **Token Service** | Mint / validate / atomically consume short-lived tokens | Channel-agnostic auth primitive |
| **Bot Sender** | Send outbound messages via the right platform API | Hides 24h window + button-format differences |
| **Auth Service** | Validate token (or TG hash), issue session, redirect | The only thing the browser talks to |
| **Web App** | Reads session cookie; doesn't know about TG/WA | Channel-independent product surface |

---

## 6. Architecture diagram

```
   ┌──────────────────┐                       ┌──────────────────┐
   │  Telegram User   │                       │  WhatsApp User   │
   └────────┬─────────┘                       └────────┬─────────┘
            │ message                                  │ message
            ▼                                          ▼
   ┌──────────────────┐                       ┌──────────────────┐
   │  Telegram Bot    │                       │ WhatsApp Cloud   │
   │      API         │                       │      API         │
   └────────┬─────────┘                       └────────┬─────────┘
            │ webhook                                  │ webhook
            ▼                                          ▼
   ╔══════════════════════════════════════════════════════════════╗
   ║                  CHANNEL ADAPTER LAYER                       ║
   ║   ┌─────────────────┐            ┌──────────────────┐        ║
   ║   │ TelegramAdapter │            │ WhatsAppAdapter  │        ║
   ║   └────────┬────────┘            └────────┬─────────┘        ║
   ║            └───────────────┬──────────────┘                  ║
   ║                            ▼                                 ║
   ║   ChannelEvent { channel, channel_user_id, profile }         ║
   ╚════════════════════════════╤═════════════════════════════════╝
                                ▼
   ╔══════════════════════════════════════════════════════════════╗
   ║                    IDENTITY SERVICE                          ║
   ║   upsert channel_identities → resolve/create users.id        ║
   ╚════════════════════════════╤═════════════════════════════════╝
                                ▼
   ╔══════════════════════════════════════════════════════════════╗
   ║                     TOKEN SERVICE                            ║
   ║   mint one-time token  (TTL 5 min, single-use)               ║
   ║   store: token → user_id, expires_at, consumed_at            ║
   ╚════════════════════════════╤═════════════════════════════════╝
                                ▼
   ╔══════════════════════════════════════════════════════════════╗
   ║                      BOT SENDER                              ║
   ║   sends https://app.example.com/auth/exchange?t=XXX          ║
   ║   via the originating channel's API                          ║
   ╚═════════════════╤════════════════════════╤═══════════════════╝
                     ▼                        ▼
            ┌──────────────────┐    ┌────────────────────┐
            │ Telegram chat    │    │ WhatsApp chat      │
            │ (URL button)     │    │ (CTA URL button)   │
            └────────┬─────────┘    └─────────┬──────────┘
                     │ tap                    │ tap
                     └────────────┬───────────┘
                                  ▼
                ┌──────────────────────────────────┐
                │   GET /auth/exchange?t=XXX       │
                │   ┌──────────────────────────┐   │
                │   │      AUTH SERVICE        │   │
                │   │  1. validate token       │   │
                │   │  2. mark consumed_at     │   │
                │   │  3. issue session        │   │
                │   │     (JWT / cookie)       │   │
                │   └────────────┬─────────────┘   │
                │                ▼                 │
                │     Set-Cookie: sid=…            │
                │     302 → /dashboard             │
                └────────────────┬─────────────────┘
                                 ▼
                ┌──────────────────────────────────┐
                │      Web App (authenticated)     │
                └──────────────────────────────────┘
```

### Sequence (compressed)

```
User           → Platform API  : "/start"
Platform API   → Adapter       : webhook
Adapter        → Identity      : normalize + upsert
Identity       → Token         : (user_id)
Token          → BotSender     : "https://app.example.com/auth/exchange?t=XYZ"
BotSender      → Platform API  : sendMessage(button = URL)
Platform API   → User          : chat message with button
User           → Web App       : GET /auth/exchange?t=XYZ
Web App        → Token         : validate + consume
Token          → Auth          : ok(user_id)
Auth           → User          : Set-Cookie + 302 /dashboard
```

---

## 7. Security checklist

- **Token entropy:** ≥ 128 bits, base64url. Never sequential or guessable.
- **Atomic single-use consume:**
  ```sql
  update login_tokens
     set consumed_at = now()
   where token = $1
     and consumed_at is null
     and expires_at > now()
  returning user_id;
  ```
  If `0` rows returned → reject. Two parallel clicks cannot both succeed.
- **Short TTL:** 5 minutes is plenty for a tap. Tighter is fine.
- **Channel binding (defense-in-depth):** record `issued_via`; refuse cross-channel replay.
- **Telegram `login_url` verification:** HMAC-SHA256 with `SHA256(bot_token)` as key over `auth_date\n…` payload, constant-time compare. Reject if `auth_date` is older than ~24h.
- **Phone trust (WhatsApp):** the phone in the webhook is Meta-verified for *messaging*, not KYC. Treat it as a channel identity, not a verified personal phone.
- **Account linking:** if a `users` row already exists with a different channel email/phone, prompt the user with an explicit "link account" step in the web app. Never silently merge identities.
- **HTTPS only**, `Secure` + `HttpOnly` + `SameSite=Lax` cookies. Token in URL is single-use and short-lived, but still avoid logging the full URL.
- **Rate limit** inbound webhooks and the `/auth/exchange` endpoint per IP and per channel identity.

---

## 8. Platform-specific notes

### Telegram

- Bot must have a domain set via `/setdomain` in **@BotFather** for `login_url` to work.
- Inline keyboard button shape:
  ```json
  {
    "text": "Log in",
    "url": "https://app.example.com/auth/exchange?t=XYZ"
  }
  ```
  Or for the fast-path:
  ```json
  {
    "text": "Log in",
    "login_url": {
      "url": "https://app.example.com/auth/telegram-callback",
      "request_write_access": true
    }
  }
  ```

### WhatsApp Cloud API

- The `/auth/exchange` link must be sent **inside the 24-hour conversation window**, or via a pre-approved template message with a URL button.
- Interactive CTA URL button:
  ```json
  {
    "type": "cta_url",
    "action": {
      "name": "cta_url",
      "parameters": {
        "display_text": "Log in",
        "url": "https://app.example.com/auth/exchange?t=XYZ"
      }
    }
  }
  ```
- The phone number in the webhook is the user's identity; there is no `username`.

---

## 9. Extending to more channels

The abstraction is built for it. To add Email (magic link), Discord, Slack, etc.:

1. Add a new `ChannelAdapter` that emits the same `ChannelEvent` shape.
2. Add the channel to the `channel` enum on `channel_identities`.
3. Add a new `BotSender` strategy for outbound delivery.
4. Identity, Token, and Auth services do not change.
