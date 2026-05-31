import { createHmac } from 'node:crypto';

import { validateInitData } from '../channel/telegram-initdata.validator';

const FAKE_BOT_TOKEN = 'fake:BotToken12345';
const MAX_AGE_SEC = 86400;

/**
 * Build a valid initData string by computing the correct HMAC for the given
 * fields and a known bot token.  This is the canonical way to produce test
 * fixtures: we use the same algorithm the validator trusts so the happy-path
 * test genuinely exercises both the signing and the verification code.
 */
function buildInitData(
  fields: Record<string, string>,
  botToken: string = FAKE_BOT_TOKEN,
  authDateOverride?: number,
): string {
  const authDate = authDateOverride ?? Math.floor(Date.now() / 1000) - 10; // 10 s ago

  const allFields: Record<string, string> = {
    auth_date: String(authDate),
    ...fields,
  };

  // Build data-check-string (sorted, excluding hash/signature).
  const sorted = Object.entries(allFields).sort(([a], [b]) =>
    a < b ? -1 : a > b ? 1 : 0,
  );
  const dataCheckString = sorted.map(([k, v]) => `${k}=${v}`).join('\n');

  const secretKey = createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();
  const hash = createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  const params = new URLSearchParams({ ...allFields, hash });
  return params.toString();
}

const VALID_USER_JSON = JSON.stringify({
  id: 123456,
  first_name: 'Alice',
  last_name: 'Smith',
  username: 'alicesmith',
  photo_url: 'https://t.me/alice.jpg',
  language_code: 'en',
});

describe('validateInitData', () => {
  describe('happy path', () => {
    it('returns ok:true with the correct user profile for a valid initData', () => {
      const initData = buildInitData({ user: VALID_USER_JSON });
      const result = validateInitData(initData, FAKE_BOT_TOKEN, MAX_AGE_SEC);

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.user.channelUserId).toBe('123456');
      expect(result.user.displayName).toBe('Alice Smith');
      expect(result.user.username).toBe('alicesmith');
      expect(result.user.avatarUrl).toBe('https://t.me/alice.jpg');
      expect(result.authDate).toBeInstanceOf(Date);
    });

    it('handles a user with only first_name (no last_name)', () => {
      const userJson = JSON.stringify({ id: 7, first_name: 'Bob' });
      const initData = buildInitData({ user: userJson });
      const result = validateInitData(initData, FAKE_BOT_TOKEN, MAX_AGE_SEC);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.user.displayName).toBe('Bob');
    });

    it('handles a user with no name fields (displayName is undefined)', () => {
      const userJson = JSON.stringify({ id: 8 });
      const initData = buildInitData({ user: userJson });
      const result = validateInitData(initData, FAKE_BOT_TOKEN, MAX_AGE_SEC);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.user.displayName).toBeUndefined();
    });

    it('ignores a signature field — a valid initData with signature still passes', () => {
      // Build normally, then append &signature=someed25519sig to the string.
      const base = buildInitData({ user: VALID_USER_JSON });
      const withSignature = `${base}&signature=someed25519sigvalue`;
      const result = validateInitData(
        withSignature,
        FAKE_BOT_TOKEN,
        MAX_AGE_SEC,
      );
      expect(result.ok).toBe(true);
    });
  });

  describe('hash validation', () => {
    it('returns ok:false when the hash is tampered', () => {
      const initData = buildInitData({ user: VALID_USER_JSON });
      // Flip the last character of the hash.
      const tampered = initData.replace(/hash=([0-9a-f]+)$/, (_m, h) => {
        const flipped = h.slice(0, -1) + (h.endsWith('a') ? 'b' : 'a');
        return `hash=${flipped}`;
      });
      const result = validateInitData(tampered, FAKE_BOT_TOKEN, MAX_AGE_SEC);
      expect(result.ok).toBe(false);
    });

    it('returns ok:false when the bot token is wrong', () => {
      const initData = buildInitData({ user: VALID_USER_JSON });
      const result = validateInitData(initData, 'wrong:BotToken', MAX_AGE_SEC);
      expect(result.ok).toBe(false);
    });

    it('returns ok:false when hash is missing', () => {
      const params = new URLSearchParams({
        auth_date: String(Math.floor(Date.now() / 1000)),
        user: VALID_USER_JSON,
      });
      const result = validateInitData(
        params.toString(),
        FAKE_BOT_TOKEN,
        MAX_AGE_SEC,
      );
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe('missing_hash');
    });
  });

  describe('staleness guard', () => {
    it('returns ok:false when auth_date is older than maxAgeSec', () => {
      const staleDate = Math.floor(Date.now() / 1000) - MAX_AGE_SEC - 1;
      const initData = buildInitData(
        { user: VALID_USER_JSON },
        FAKE_BOT_TOKEN,
        staleDate,
      );
      const result = validateInitData(initData, FAKE_BOT_TOKEN, MAX_AGE_SEC);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe('stale');
    });

    it('returns ok:true when auth_date is exactly at the boundary', () => {
      const freshDate = Math.floor(Date.now() / 1000) - MAX_AGE_SEC + 10;
      const initData = buildInitData(
        { user: VALID_USER_JSON },
        FAKE_BOT_TOKEN,
        freshDate,
      );
      const result = validateInitData(initData, FAKE_BOT_TOKEN, MAX_AGE_SEC);
      expect(result.ok).toBe(true);
    });

    it('returns ok:false when auth_date is materially in the future (beyond clock-skew tolerance)', () => {
      // 2 minutes in the future exceeds the 60s CLOCK_SKEW_MS tolerance.
      const futureDate = Math.floor(Date.now() / 1000) + 120;
      const initData = buildInitData(
        { user: VALID_USER_JSON },
        FAKE_BOT_TOKEN,
        futureDate,
      );
      const result = validateInitData(initData, FAKE_BOT_TOKEN, MAX_AGE_SEC);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe('future_auth_date');
    });

    it('returns ok:true when auth_date is slightly in the future within clock-skew tolerance', () => {
      // 30 seconds in the future is within the 60s CLOCK_SKEW_MS tolerance.
      const nearFutureDate = Math.floor(Date.now() / 1000) + 30;
      const initData = buildInitData(
        { user: VALID_USER_JSON },
        FAKE_BOT_TOKEN,
        nearFutureDate,
      );
      const result = validateInitData(initData, FAKE_BOT_TOKEN, MAX_AGE_SEC);
      expect(result.ok).toBe(true);
    });
  });

  describe('user field validation', () => {
    it('returns ok:false when user field is missing', () => {
      // Build a valid initData but with no user field.
      const authDate = Math.floor(Date.now() / 1000) - 10;
      const fields = { auth_date: String(authDate) };
      const sorted = Object.entries(fields).sort(([a], [b]) =>
        a < b ? -1 : a > b ? 1 : 0,
      );
      const dataCheckString = sorted.map(([k, v]) => `${k}=${v}`).join('\n');
      const secretKey = createHmac('sha256', 'WebAppData')
        .update(FAKE_BOT_TOKEN)
        .digest();
      const hash = createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');
      const params = new URLSearchParams({ ...fields, hash });

      const result = validateInitData(
        params.toString(),
        FAKE_BOT_TOKEN,
        MAX_AGE_SEC,
      );
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe('missing_user');
    });

    it('returns ok:false when user JSON has no id', () => {
      const userWithoutId = JSON.stringify({ first_name: 'Ghost' });
      const initData = buildInitData({ user: userWithoutId });
      const result = validateInitData(initData, FAKE_BOT_TOKEN, MAX_AGE_SEC);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe('missing_user_id');
    });

    it('returns ok:false when user field is invalid JSON', () => {
      const initData = buildInitData({ user: '{not-valid-json' });
      const result = validateInitData(initData, FAKE_BOT_TOKEN, MAX_AGE_SEC);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe('invalid_user_json');
    });
  });

  describe('malformed input', () => {
    it('returns ok:false for an empty string', () => {
      const result = validateInitData('', FAKE_BOT_TOKEN, MAX_AGE_SEC);
      expect(result.ok).toBe(false);
    });

    it('returns ok:false for a non-URL-encoded garbage string', () => {
      const result = validateInitData('!!!###', FAKE_BOT_TOKEN, MAX_AGE_SEC);
      expect(result.ok).toBe(false);
    });

    it('returns ok:false for a string that is only whitespace', () => {
      const result = validateInitData('   ', FAKE_BOT_TOKEN, MAX_AGE_SEC);
      expect(result.ok).toBe(false);
    });
  });
});
