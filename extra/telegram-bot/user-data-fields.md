# Telegram Bot — User Data You Can Collect

What Telegram's Bot API exposes about a user interacting with your bot. Field sources are shown so you know where to read them in a `telegraf` `Context`.

## Automatic — present on every message (`ctx.from`)

- `id` — numeric Telegram user ID (stable, unique).
- `is_bot` — boolean.
- `first_name` — required.
- `last_name` — optional.
- `username` — optional (the `@handle`, without `@`).
- `language_code` — IETF tag like `"en"`, `"ru"`, `"hy"`. Hint only — set from the user's Telegram app language.
- `is_premium` — true if Telegram Premium.
- `added_to_attachment_menu` — true if they added your bot to their attachment menu.

## From the chat (`ctx.chat`)

- `id` — chat ID (equals `from.id` in private chats).
- `type` — `"private" | "group" | "supergroup" | "channel"`.
- For groups/channels: `title`, optional `username`.

## Message metadata (`ctx.message`)

- `message_id`, `date` (unix ts).
- `text` / `caption`, `entities` (mentions, links, hashtags, bot commands, etc.).
- `reply_to_message`, `forward_origin` (if forwarded — may reveal who they forwarded from, subject to that user's privacy).
- Media: `photo`, `video`, `audio`, `voice`, `video_note`, `document`, `sticker`, `animation`, `dice`, `poll`.
- `location` / `venue` — only if the user explicitly sends a location.
- `contact` — only if the user explicitly shares a contact (can include their `phone_number`).

## Only available if the user actively grants it

- **Phone number** — only via a `KeyboardButton` with `request_contact: true`. The user must tap it. You then get `phone_number`, `first_name`, `last_name`, `user_id` in `ctx.message.contact`.
- **Live/precise location** — via `request_location: true` button, or if they manually send a location.
- **Profile photo** — fetch with `ctx.telegram.getUserProfilePhotos(userId)`. Subject to their privacy settings; may be empty.
- **Chat member info** in a group — `ctx.telegram.getChatMember(chatId, userId)` returns `status` (`creator | administrator | member | restricted | left | kicked`) and per-role permissions.
- **Web App `initData`** — when the user opens your Mini App via a `web_app` button, the WebApp sends signed `initData` containing `user` (same fields as above plus `allows_write_to_pm`), `auth_date`, `hash`, `query_id`, `chat_instance`, `start_param`. Verify the `hash` against your bot token before trusting it.
- **`/start` deep-link payload** — `/start <payload>` (e.g. from `t.me/yourbot?start=ref_123`). Available in the message text; useful for attribution.
- **Login via Telegram Login Widget** — outside the bot, returns the same user fields plus `auth_date` and `hash`.

## Inferable (not first-class fields)

- **Approximate locale/timezone** — from `language_code` and message timestamps.
- **Activity patterns** — you can log message times yourself; Telegram doesn't expose "last seen".

## Things you CANNOT get

- Email address.
- Real name beyond what they've set in their profile.
- Phone number without `request_contact`.
- Other chats the user is in, their contacts, or their message history outside your bot.
- "Last seen" / online status.
- Any data about users who haven't messaged your bot.

## Practical access in this codebase

In any handler, `ctx.from`, `ctx.chat`, and `ctx.message` give you the bulk of it without extra calls. For example, in `onStart`:

```ts
this.logger.log(
  `user ${ctx.from?.id} (${ctx.from?.username ?? ctx.from?.first_name}) lang=${ctx.from?.language_code}`,
);
```
