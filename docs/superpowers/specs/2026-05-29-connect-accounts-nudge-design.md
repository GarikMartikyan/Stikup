# Connect-Accounts Nudge — Design

**Date:** 2026-05-29
**Status:** Approved

## Problem

When a signed-in user has not linked one or both of their secondary auth
channels (Telegram, Google), nothing prompts them to do so. We want a gentle,
trail-of-breadcrumbs nudge that leads them from the header to Settings and then
to the specific Connect button(s) they still need to act on.

## Goal

Guide the user along this path when at least one of Telegram/Google is
unconnected:

1. A pulsing dot appears on the header user avatar.
2. Opening the user drawer shows the same pulsing dot on the **Settings** link.
3. On the Settings page, the relevant **Connect** button(s) pulse persistently
   until that provider is linked.

## Trigger condition

Show the nudge whenever **at least one** of Telegram / Google is not connected.
It disappears only once **both** are linked. (Email-only or single-provider
users still see it.)

## Components

### 1. `useConnectionStatus()` hook — shared detection

**File:** `frontend/src/lib/hooks/use-connection-status.ts`

Reads `useGetMeQuery()` and derives connection state from `me.channels`:

```ts
const channels = me?.channels ?? [];
const telegramConnected = channels.some((c) => c.channel === 'telegram');
const googleConnected = channels.some((c) => c.channel === 'google');
const hasUnconnected = !telegramConnected || !googleConnected;
return { telegramConnected, googleConnected, hasUnconnected };
```

Single source of truth for the header cue; unit-testable in isolation. Returns
all `false` / `hasUnconnected: true` while loading or on error — acceptable,
since the dot simply won't mislead a fully-connected user (their cached
`channels` resolves quickly and removes it).

### 2. Header dot — avatar + drawer Settings link

**Files:** `frontend/src/components/app-header.tsx`,
`frontend/src/components/auth/user-drawer.tsx`

- Avatar trigger wrapper becomes `relative`; render a small pulsing brand-pink
  dot at the top-right corner when `hasUnconnected`.
- The same dot renders next to the **Settings** entry inside the drawer.
- The avatar click continues to open the existing drawer (Settings / My
  Stickers / Logout preserved) — we do **not** hijack it to navigate directly.

### 3. Settings Connect-button pulse

**Files:** `frontend/src/components/settings/telegram-connection-setting.tsx`,
`frontend/src/components/settings/google-connection-setting.tsx`

Each component already renders the Connect button only when that provider is
unlinked (and a Disconnect button when linked). Apply a persistent pulse-ring
class to the Connect button. Because the button is only present when
unconnected, this automatically yields "only unconnected, persistent" with no
extra state or query parameter.

### 4. Styling

**File:** `frontend/src/app/globals.css`

Reuse the existing `pulse-ring` keyframe (already brand-pink,
`rgba(224, 52, 154, …)`). Add:

- `.connect-dot` — small absolutely-positioned brand dot with a scaled pulse
  ring, for the avatar/drawer.
- `.connect-pulse` — pulse-ring applied to the Settings Connect button.

### 5. Accessibility & i18n

The avatar dot carries an `sr-only` label from a new next-intl key
`header.connect_reminder` ("Connect your accounts" / Russian equivalent), added
to both `frontend/src/i18n/messages/en.json` and `…/ru.json`.

## Testing

Vitest:

- `useConnectionStatus` — all four channel combinations (neither, telegram-only,
  google-only, both) assert correct `hasUnconnected`.
- Header render test — dot present when a provider is missing, absent when both
  are linked.

## Out of scope (YAGNI)

- No dismiss / snooze.
- No persistence beyond the live `channels` data.
- No nudge for the email provider.
