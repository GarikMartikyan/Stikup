import { createHmac, timingSafeEqual } from 'node:crypto';

export interface TgUser {
  channelUserId: string;
  displayName: string | undefined;
  username: string | undefined;
  avatarUrl: string | undefined;
}

export type ValidateInitDataResult =
  | { ok: true; user: TgUser; authDate: Date }
  | { ok: false; reason: string };

/**
 * Validates Telegram Mini App `initData` using the bot-token HMAC method.
 *
 * The algorithm is the security trust boundary: never throw on bad input —
 * always return `{ ok: false }` so callers can uniformly issue a 401 without
 * worrying about exception paths leaking details.
 */
export function validateInitData(
  initData: string,
  botToken: string,
  maxAgeSec: number,
): ValidateInitDataResult {
  try {
    return _validate(initData, botToken, maxAgeSec);
  } catch {
    return { ok: false, reason: 'unexpected_error' };
  }
}

function _validate(
  initData: string,
  botToken: string,
  maxAgeSec: number,
): ValidateInitDataResult {
  if (!initData || typeof initData !== 'string') {
    return { ok: false, reason: 'empty_initdata' };
  }

  let params: URLSearchParams;
  try {
    params = new URLSearchParams(initData);
  } catch {
    return { ok: false, reason: 'parse_error' };
  }

  const hash = params.get('hash');
  if (!hash) {
    return { ok: false, reason: 'missing_hash' };
  }

  // Remove ONLY `hash`. For the bot-token HMAC method, the data-check-string is
  // "all received fields" except `hash` — the `signature` field IS included and
  // is covered by the hash (https://core.telegram.org/bots/webapps). Stripping
  // `signature` (which every modern client sends) would hash fewer fields than
  // Telegram signed, guaranteeing a mismatch. (`signature` is only excluded for
  // the separate Ed25519 third-party validation method, which we do not use.)
  params.delete('hash');

  // Build sorted key=value pairs joined with newline.
  const entries = [...params.entries()].sort(([a], [b]) =>
    a < b ? -1 : a > b ? 1 : 0,
  );
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n');

  // secretKey = HMAC-SHA256(key="WebAppData", message=botToken)
  const secretKey = createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  // computed = hex(HMAC-SHA256(key=secretKey, message=dataCheckString))
  const computed = createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  // Constant-time compare — guard length first (different lengths => reject,
  // never pass unequal-length Buffers to timingSafeEqual).
  if (computed.length !== hash.length) {
    return { ok: false, reason: 'hash_mismatch' };
  }
  const computedBuf = Buffer.from(computed, 'utf8');
  const receivedBuf = Buffer.from(hash, 'utf8');
  if (!timingSafeEqual(computedBuf, receivedBuf)) {
    return { ok: false, reason: 'hash_mismatch' };
  }

  // Staleness guard.
  const authDateRaw = params.get('auth_date');
  if (!authDateRaw) {
    return { ok: false, reason: 'missing_auth_date' };
  }
  const authDateSec = parseInt(authDateRaw, 10);
  if (!Number.isFinite(authDateSec)) {
    return { ok: false, reason: 'invalid_auth_date' };
  }
  const ageMs = Date.now() - authDateSec * 1000;
  // Tolerate minor clock skew but reject tokens dated materially in the future,
  // which would otherwise extend the valid window beyond maxAgeSec.
  const CLOCK_SKEW_MS = 60_000;
  if (ageMs < -CLOCK_SKEW_MS) {
    return { ok: false, reason: 'future_auth_date' };
  }
  if (ageMs > maxAgeSec * 1000) {
    return { ok: false, reason: 'stale' };
  }

  // Parse user JSON.
  const userRaw = params.get('user');
  if (!userRaw) {
    return { ok: false, reason: 'missing_user' };
  }

  let tgUser: {
    id?: number | string;
    first_name?: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    language_code?: string;
  };
  try {
    tgUser = JSON.parse(userRaw) as typeof tgUser;
  } catch {
    return { ok: false, reason: 'invalid_user_json' };
  }

  if (!tgUser.id) {
    return { ok: false, reason: 'missing_user_id' };
  }

  const nameParts = [tgUser.first_name, tgUser.last_name].filter(Boolean);
  const displayName =
    nameParts.length > 0 ? nameParts.join(' ').trim() || undefined : undefined;

  const user: TgUser = {
    channelUserId: String(tgUser.id),
    displayName,
    username: tgUser.username,
    avatarUrl: tgUser.photo_url,
  };

  return { ok: true, user, authDate: new Date(authDateSec * 1000) };
}
