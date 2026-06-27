# Telegram-native Referral Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the website-based referral flow with a Telegram-native one: the referrer shares a `t.me` Mini App deep link, the invited friend taps it, is auto-logged-in via Telegram, lands on the home page, and the referral is credited (unlocking the referrer's pack + sending the existing "all unlocked" Telegram message).

**Architecture:** The referral code + pack id ride inside Telegram's `start_param` (`https://t.me/stikup_bot?startapp=<CODE>_<PACKID>`), which is part of the HMAC-signed `initData`. The backend extracts `start_param` after the existing signature check, parses it, and feeds the unchanged `ReferralService.attribute()`. The web `?ref=` cookie flow is removed entirely.

**Tech Stack:** Backend — NestJS 11, Prisma 6, nestjs-telegraf, Jest. Frontend — Next.js 16, React 19, Vitest, Testing Library.

## Global Constraints

- `start_param` encoding: `"<CODE>_<PACKID>"`. Referral code = 8 base62 chars (`[0-9A-Za-z]`). Pack id = UUID (`[0-9a-fA-F]{8}-{4}-{4}-{4}-{12}`). Neither contains `_`; split on the FIRST `_`.
- Telegram `start_param` allows only `A-Za-z0-9_-`, max 512 chars — the encoding above satisfies this.
- Referrals are credited ONLY on new-account creation (existing semantic; unchanged).
- `ReferralService.attribute()` is NOT modified — it already sends the referrer the "🎉 all unlocked" Telegram message and tops up the sticker set.
- Backend bot URL is NOT available to the backend; the Telegram deep link is built on the **frontend** from `code` (the backend `/referral/me` returns only `{ code, referredCount }`).
- Frontend `TELEGRAM_BOT_URL` defaults to `https://t.me/stikup_bot` (`frontend/src/lib/config.ts:29`).
- Commit messages end with the required footer:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- Run backend tests from `backend/` (`npm test`), frontend tests from `frontend/` (`npm test`).

---

## File Structure

**Backend**

- `backend/src/auth/channel/telegram-initdata.validator.ts` — add `startParam` to the validated result (modify).
- `backend/src/referral/parse-referral-start-param.ts` — NEW pure parser `start_param` → `{ ref, pack }`.
- `backend/src/auth/auth.controller.ts` — wire `start_param` in `telegramWebApp`; remove all web `?ref=` cookie attribution + constants (modify).
- `backend/src/referral/referral.service.ts` — `getOrCreateReferralInfo` returns `{ code, referredCount }`; drop the web `link` + the now-unused `frontendConfig` injection (modify).
- `backend/src/referral/referral.controller.ts` — update `me` return type + Swagger schema (modify).

**Frontend**

- `frontend/src/lib/telegram/href.ts` — add `telegramReferralHref(code, packId)` (modify).
- `frontend/src/components/result/pack-actions.tsx` — build the deep link via the new helper (modify).
- `frontend/src/app/layout.tsx` — remove `<ReferralCapture />` + import (modify).
- `frontend/src/components/referral-capture.tsx` — DELETE.

**Tests**

- `backend/src/auth/__tests__/telegram-initdata.validator.spec.ts` (modify)
- `backend/src/referral/__tests__/parse-referral-start-param.spec.ts` (NEW)
- `backend/src/auth/__tests__/telegram-webapp.controller.spec.ts` (modify)
- `backend/src/auth/__tests__/auth-email-google.controller.spec.ts` (modify)
- `backend/src/referral/__tests__/referral.service.spec.ts` (modify)
- `frontend/src/lib/telegram/__tests__/href.test.ts` (NEW)
- `frontend/src/components/result/__tests__/pack-actions.test.tsx` (modify)
- `frontend/src/components/__tests__/referral-capture.test.tsx` — DELETE.

---

## Task 1: `validateInitData` returns `startParam`

**Files:**

- Modify: `backend/src/auth/channel/telegram-initdata.validator.ts`
- Test: `backend/src/auth/__tests__/telegram-initdata.validator.spec.ts`

**Interfaces:**

- Produces: `ValidateInitDataResult` `ok:true` variant now includes `startParam: string | undefined`.

- [ ] **Step 1: Write the failing tests**

Add inside the `describe('happy path', ...)` block in `telegram-initdata.validator.spec.ts`:

```ts
it('returns start_param when present', () => {
  const initData = buildInitData({
    user: VALID_USER_JSON,
    start_param: 'MYCODE_550e8400-e29b-41d4-a716-446655440000',
  });
  const result = validateInitData(initData, FAKE_BOT_TOKEN, MAX_AGE_SEC);

  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.startParam).toBe('MYCODE_550e8400-e29b-41d4-a716-446655440000');
});

it('returns startParam undefined when absent', () => {
  const initData = buildInitData({ user: VALID_USER_JSON });
  const result = validateInitData(initData, FAKE_BOT_TOKEN, MAX_AGE_SEC);

  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.startParam).toBeUndefined();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && npx jest telegram-initdata.validator -t "start_param"`
Expected: FAIL — `startParam` is `undefined`/not on the type (TS error or assertion failure).

- [ ] **Step 3: Implement**

In `telegram-initdata.validator.ts`, change the `ok:true` arm of the result type (around line 11):

```ts
export type ValidateInitDataResult =
  | { ok: true; user: TgUser; authDate: Date; startParam: string | undefined }
  | { ok: false; reason: string };
```

Then change the final success `return` (around line 144) to read and include `start_param` (it survives in `params` because only `hash` was deleted):

```ts
const startParam = params.get('start_param') ?? undefined;

return { ok: true, user, authDate: new Date(authDateSec * 1000), startParam };
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && npx jest telegram-initdata.validator`
Expected: PASS (all existing + 2 new).

- [ ] **Step 5: Commit**

```bash
git add backend/src/auth/channel/telegram-initdata.validator.ts backend/src/auth/__tests__/telegram-initdata.validator.spec.ts
git commit -m "feat(auth): expose start_param from validated Telegram initData

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: `parseReferralStartParam` pure helper

**Files:**

- Create: `backend/src/referral/parse-referral-start-param.ts`
- Test: `backend/src/referral/__tests__/parse-referral-start-param.spec.ts`

**Interfaces:**

- Produces: `parseReferralStartParam(startParam: string | null | undefined): { ref: string; pack: string | undefined } | null`

- [ ] **Step 1: Write the failing test**

Create `backend/src/referral/__tests__/parse-referral-start-param.spec.ts`:

```ts
import { parseReferralStartParam } from '../parse-referral-start-param';

describe('parseReferralStartParam', () => {
  const PACK = '550e8400-e29b-41d4-a716-446655440000';

  it('returns null for empty / nullish input', () => {
    expect(parseReferralStartParam(undefined)).toBeNull();
    expect(parseReferralStartParam(null)).toBeNull();
    expect(parseReferralStartParam('')).toBeNull();
  });

  it('parses "<code>_<packUuid>" into ref + pack', () => {
    expect(parseReferralStartParam(`Ab3Xy9Qz_${PACK}`)).toEqual({
      ref: 'Ab3Xy9Qz',
      pack: PACK,
    });
  });

  it('returns code with undefined pack when there is no pack segment', () => {
    expect(parseReferralStartParam('Ab3Xy9Qz')).toEqual({
      ref: 'Ab3Xy9Qz',
      pack: undefined,
    });
  });

  it('drops an invalid pack id but keeps the code', () => {
    expect(parseReferralStartParam('Ab3Xy9Qz_not-a-uuid')).toEqual({
      ref: 'Ab3Xy9Qz',
      pack: undefined,
    });
  });

  it('returns null when the code is invalid', () => {
    expect(parseReferralStartParam(`bad!code_${PACK}`)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest parse-referral-start-param`
Expected: FAIL — cannot find module `../parse-referral-start-param`.

- [ ] **Step 3: Implement**

Create `backend/src/referral/parse-referral-start-param.ts`:

```ts
const CODE_RE = /^[0-9A-Za-z]{1,64}$/;
const UUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export interface ParsedReferralStartParam {
  ref: string;
  pack: string | undefined;
}

/**
 * Parse a Telegram Mini App `start_param` of the form `<CODE>_<PACKID>` into a
 * referral code and optional pack id.
 *
 * - Splits on the FIRST underscore (referral codes are base62 and pack ids are
 *   UUIDs — neither contains `_`, so this is unambiguous).
 * - Returns `null` when there is no valid referral code (caller skips
 *   attribution entirely).
 * - Drops an invalid pack id but keeps the code (credits the referral without a
 *   specific pack unlock).
 */
export function parseReferralStartParam(
  startParam: string | null | undefined,
): ParsedReferralStartParam | null {
  if (!startParam) return null;

  const idx = startParam.indexOf('_');
  const ref = idx === -1 ? startParam : startParam.slice(0, idx);
  const packRaw = idx === -1 ? undefined : startParam.slice(idx + 1);

  if (!CODE_RE.test(ref)) return null;

  const pack = packRaw && UUID_RE.test(packRaw) ? packRaw : undefined;
  return { ref, pack };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx jest parse-referral-start-param`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/referral/parse-referral-start-param.ts backend/src/referral/__tests__/parse-referral-start-param.spec.ts
git commit -m "feat(referral): add start_param parser for Telegram deep links

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Telegram webapp controller credits referral from `start_param`

**Files:**

- Modify: `backend/src/auth/auth.controller.ts` (`telegramWebApp`, ~lines 461-508; add import)
- Test: `backend/src/auth/__tests__/telegram-webapp.controller.spec.ts`

**Interfaces:**

- Consumes: `result.startParam` (Task 1), `parseReferralStartParam` (Task 2), `ReferralService.attribute(userId, ref, channel, packId?)` (existing).

- [ ] **Step 1: Update the controller spec**

In `telegram-webapp.controller.spec.ts`, add a pack-uuid constant near `VALID_USER_JSON` (after line 50):

```ts
const PACK_UUID = '550e8400-e29b-41d4-a716-446655440000';
```

Replace the test `'attributes referral and clears REF_COOKIE when user is newly created'` (lines 192-238) with:

```ts
it('attributes referral from start_param when user is newly created', async () => {
  const controller = await buildController();
  const identity = (
    controller as unknown as { identity: jest.Mocked<IdentityService> }
  ).identity;
  const sessions = (
    controller as unknown as { sessions: jest.Mocked<SessionService> }
  ).sessions;
  const referrals = (
    controller as unknown as { referrals: jest.Mocked<ReferralService> }
  ).referrals;

  (identity.resolveOrCreate as jest.Mock).mockResolvedValueOnce({
    userId: 'u-new',
    created: true,
  });
  (sessions.issue as jest.Mock).mockResolvedValueOnce({
    sid: 'sess-new',
    expiresAt: new Date(Date.now() + 60_000),
  });
  (sessions.findUser as jest.Mock).mockResolvedValueOnce({
    userId: 'u-new',
    email: null,
    displayName: null,
    avatarUrl: null,
    channels: [],
  });

  const initData = buildInitData({
    user: VALID_USER_JSON,
    start_param: `MYCODE_${PACK_UUID}`,
  });
  const req = { cookies: {} } as unknown as import('express').Request;
  const res = buildResMock();

  await controller.telegramWebApp({ initData }, req, res);

  expect(referrals.attribute).toHaveBeenCalledWith(
    'u-new',
    'MYCODE',
    'telegram',
    PACK_UUID,
  );
});

it('does not attribute when newly created but start_param is absent', async () => {
  const controller = await buildController();
  const identity = (
    controller as unknown as { identity: jest.Mocked<IdentityService> }
  ).identity;
  const sessions = (
    controller as unknown as { sessions: jest.Mocked<SessionService> }
  ).sessions;
  const referrals = (
    controller as unknown as { referrals: jest.Mocked<ReferralService> }
  ).referrals;

  (identity.resolveOrCreate as jest.Mock).mockResolvedValueOnce({
    userId: 'u-new-noref',
    created: true,
  });
  (sessions.issue as jest.Mock).mockResolvedValueOnce({
    sid: 'sess-new-noref',
    expiresAt: new Date(Date.now() + 60_000),
  });
  (sessions.findUser as jest.Mock).mockResolvedValueOnce({
    userId: 'u-new-noref',
    email: null,
    displayName: null,
    avatarUrl: null,
    channels: [],
  });

  const initData = buildInitData({ user: VALID_USER_JSON });
  const req = { cookies: {} } as unknown as import('express').Request;
  const res = buildResMock();

  await controller.telegramWebApp({ initData }, req, res);

  expect(referrals.attribute).not.toHaveBeenCalled();
});
```

In the test `'does not attribute referral when user already existed'` (lines 240-278), change the `req` to carry a `start_param` instead of a cookie so it proves "existing user is never credited even with a payload". Replace its `initData`/`req` setup (lines 268-272) with:

```ts
const initData = buildInitData({
  user: VALID_USER_JSON,
  start_param: `MYCODE_${PACK_UUID}`,
});
const req = { cookies: {} } as unknown as import('express').Request;
const res = buildResMock();
```

and DELETE the now-irrelevant assertion line `expect(res.clearCookie).not.toHaveBeenCalled();` (line 277) — clearCookie is no longer part of this flow.

- [ ] **Step 2: Run the spec to verify it fails**

Run: `cd backend && npx jest telegram-webapp.controller`
Expected: FAIL — controller still reads cookies; `attribute` called with `(…, undefined, 'telegram', undefined)` not the parsed `start_param`.

- [ ] **Step 3: Implement the controller change**

In `auth.controller.ts`, add the import next to the other `./channel`/`../referral` imports (after line 38):

```ts
import { parseReferralStartParam } from '../referral/parse-referral-start-param';
```

In `telegramWebApp`, change the success destructure (line 477) from `const { user } = result;` to:

```ts
const { user, startParam } = result;
```

Replace the `if (created) { … }` block (lines 488-497) with:

```ts
if (created) {
  const parsed = parseReferralStartParam(startParam);
  if (parsed) {
    await this.referrals.attribute(userId, parsed.ref, 'telegram', parsed.pack);
  }
}
```

(The `@Req() req: Request` parameter stays — it precedes the used `@Res() res`, so `args: 'after-used'` does not flag it. `req` is no longer read here.)

- [ ] **Step 4: Run the spec to verify it passes**

Run: `cd backend && npx jest telegram-webapp.controller`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/auth/auth.controller.ts backend/src/auth/__tests__/telegram-webapp.controller.spec.ts
git commit -m "feat(auth): credit referral from Telegram start_param on signup

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Remove the web `?ref=` cookie attribution

**Files:**

- Modify: `backend/src/auth/auth.controller.ts` (`register` ~271-291, `googleCallback` ~371-380, constants 47-48)
- Test: `backend/src/auth/__tests__/auth-email-google.controller.spec.ts`

**Interfaces:**

- Consumes: nothing new. Removes the `REF_COOKIE`/`REF_PACK_COOKIE` constants.

- [ ] **Step 1: Add a regression test locking the new behavior**

In `auth-email-google.controller.spec.ts`, inside `describe('POST /auth/register', ...)`, add after the existing success test (after line 155):

```ts
it('does not attribute a referral on email registration', async () => {
  const controller = await buildController();
  const emailAdapter = (
    controller as unknown as { emailAdapter: jest.Mocked<EmailAdapter> }
  ).emailAdapter;
  const sessions = (
    controller as unknown as { sessions: jest.Mocked<SessionService> }
  ).sessions;
  const referrals = (
    controller as unknown as { referrals: jest.Mocked<ReferralService> }
  ).referrals;

  (emailAdapter.register as jest.Mock).mockResolvedValueOnce({
    userId: 'u-email',
  });
  (sessions.issue as jest.Mock).mockResolvedValueOnce({
    sid: 'sess-email',
    expiresAt: new Date(Date.now() + 60_000),
  });

  const req = {
    cookies: { stikup_ref: 'shouldBeIgnored' },
  } as unknown as import('express').Request;
  const res = buildResMock();

  await controller.register(
    { email: 'a@b.com', password: 'password123' },
    req,
    res,
  );

  expect(referrals.attribute).not.toHaveBeenCalled();
});
```

> Confirm `EmailAdapter` and `ReferralService` are imported at the top of this spec (they are: lines ~12). If `buildController`'s signature differs, match the existing success test's setup in this file.

- [ ] **Step 2: Run to verify it fails**

Run: `cd backend && npx jest auth-email-google.controller -t "does not attribute"`
Expected: FAIL — `attribute` is still called from `register`.

- [ ] **Step 3: Implement the removals**

In `auth.controller.ts`:

Delete the two constants (lines 47-48):

```ts
const REF_COOKIE = 'stikup_ref';
const REF_PACK_COOKIE = 'stikup_ref_pack';
```

In `register`, replace the body between `emailAdapter.register(...)` and `sessions.issue(...)` (lines 280-287) so it reads:

```ts
const { userId } = await this.emailAdapter.register(dto.email, dto.password);
const { sid, expiresAt } = await this.sessions.issue(userId, 'email');
res.cookie(this.session.cookieName, sid, this.cookieOptions(expiresAt));
res.status(204).send();
```

(The `@Req() req: Request` parameter stays — it precedes the used `@Res() res`.)

In `googleCallback`'s non-link branch, replace the `else { … }` block (lines 370-382) so the `created` ref block is gone and `created` is no longer destructured:

```ts
      } else {
        const { userId } = await this.identity.resolveOrCreate(event);
        const { sid, expiresAt } = await this.sessions.issue(userId, 'google');
        res.cookie(this.session.cookieName, sid, this.cookieOptions(expiresAt));
        res.redirect(
```

(Leave the lines after `res.redirect(` unchanged.)

- [ ] **Step 4: Run the full auth suite + lint to verify green**

Run: `cd backend && npx jest auth && npm run lint`
Expected: PASS — no unused-var errors for `created`/constants; the regression test passes; Task 3 telegram tests still green.

- [ ] **Step 5: Commit**

```bash
git add backend/src/auth/auth.controller.ts backend/src/auth/__tests__/auth-email-google.controller.spec.ts
git commit -m "refactor(auth): drop web ref-cookie attribution (Telegram-only referrals)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: `getOrCreateReferralInfo` returns `{ code, referredCount }`

**Files:**

- Modify: `backend/src/referral/referral.service.ts` (constructor + `getOrCreateReferralInfo`)
- Modify: `backend/src/referral/referral.controller.ts` (`me` return type + Swagger)
- Test: `backend/src/referral/__tests__/referral.service.spec.ts` (constructor wiring)

**Interfaces:**

- Produces: `getOrCreateReferralInfo(userId): Promise<{ code: string; referredCount: number }>`.

- [ ] **Step 1: Update the service spec's constructor wiring**

In `referral.service.spec.ts`, remove the now-unused stub (line 70):

```ts
const FRONTEND_STUB = { publicAppUrl: 'https://app.example.com' };
```

and update `buildService` (lines 77-84) to drop the frontend positional arg:

```ts
const service = new ReferralService(
  prisma,
  OFFER_STUB,
  botSender,
  stickerSvc ?? buildStickerServiceMock(),
  { stickerDir: '/tmp/stikup-test-packs' },
);
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd backend && npx jest referral.service`
Expected: FAIL — TS arity/type mismatch (constructor still expects the `frontend` arg).

- [ ] **Step 3: Implement the service change**

In `referral.service.ts`:

Remove the import (line 10):

```ts
import { frontendConfig } from '../config/frontend.config';
```

Remove the constructor injection (lines 41-42):

```ts
    @Inject(frontendConfig.KEY)
    private readonly frontend: ConfigType<typeof frontendConfig>,
```

Change `getOrCreateReferralInfo`'s return type (lines 49-53) to:

```ts
  async getOrCreateReferralInfo(userId: string): Promise<{
    code: string;
    referredCount: number;
  }> {
```

Change the final `return` (lines 73-77) to:

```ts
return {
  code,
  referredCount,
};
```

- [ ] **Step 4: Update the controller return type + Swagger**

In `referral.controller.ts`, change the `@ApiOkResponse` schema (lines 31-40) so `link` is gone:

```ts
  @ApiOkResponse({
    schema: {
      properties: {
        code: { type: 'string' },
        referredCount: { type: 'integer' },
      },
      required: ['code', 'referredCount'],
    },
  })
```

and change the `me` return type (lines 42-46) to:

```ts
  async me(@Req() req: Request): Promise<{
    code: string;
    referredCount: number;
  }> {
```

- [ ] **Step 5: Run service tests + typecheck**

Run: `cd backend && npx jest referral && npm run lint`
Expected: PASS — no unused `frontendConfig`/`ConfigType` import errors.

> If `ConfigType` becomes unused in `referral.service.ts` after removing the injection, remove it from the `@nestjs/config` import too. Verify with lint.

- [ ] **Step 6: Commit**

```bash
git add backend/src/referral/referral.service.ts backend/src/referral/referral.controller.ts backend/src/referral/__tests__/referral.service.spec.ts
git commit -m "refactor(referral): return code only from /referral/me (drop web link)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Frontend `telegramReferralHref` helper

**Files:**

- Modify: `frontend/src/lib/telegram/href.ts`
- Test: `frontend/src/lib/telegram/__tests__/href.test.ts` (NEW)

**Interfaces:**

- Produces: `telegramReferralHref(code: string, packId: string): string` → `${TELEGRAM_BOT_URL}?startapp=${code}_${packId}`.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/lib/telegram/__tests__/href.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { telegramReferralHref } from '../href';

describe('telegramReferralHref', () => {
  it('builds a startapp deep link encoding code and pack id', () => {
    const url = telegramReferralHref(
      'MYCODE',
      '550e8400-e29b-41d4-a716-446655440000',
    );
    expect(url).toBe(
      'https://t.me/stikup_bot?startapp=MYCODE_550e8400-e29b-41d4-a716-446655440000',
    );
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd frontend && npx vitest run src/lib/telegram/__tests__/href.test.ts`
Expected: FAIL — `telegramReferralHref` is not exported.

- [ ] **Step 3: Implement**

In `frontend/src/lib/telegram/href.ts`, append:

```ts
/**
 * Deep link that opens the Mini App and carries a referral payload.
 * `start_param` arrives inside the signed `initData`, so the backend trusts it.
 * Format: `<referralCode>_<packId>` (split on the first `_` server-side).
 */
export function telegramReferralHref(code: string, packId: string): string {
  return `${TELEGRAM_BOT_URL}?startapp=${code}_${packId}`;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd frontend && npx vitest run src/lib/telegram/__tests__/href.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/telegram/href.ts frontend/src/lib/telegram/__tests__/href.test.ts
git commit -m "feat(frontend): add telegramReferralHref deep-link builder

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: `pack-actions` shares the Telegram deep link

**Files:**

- Modify: `frontend/src/components/result/pack-actions.tsx` (`handleUnlock`, lines 34-66; add import)
- Test: `frontend/src/components/result/__tests__/pack-actions.test.tsx`

**Interfaces:**

- Consumes: `telegramReferralHref` (Task 6); `/api/referral/me` now returns `{ code, referredCount }`.

- [ ] **Step 1: Update the test fixtures + assertion**

In `pack-actions.test.tsx`:

Replace the link constants (lines 30-32) with:

```ts
const EXPECTED_PACK_LINK = `https://t.me/stikup_bot?startapp=${REFERRAL_CODE}_${PACK_ID}`;
```

Replace `MOCK_REFERRAL_RESPONSE` (lines 34-38) with:

```ts
const MOCK_REFERRAL_RESPONSE = {
  code: REFERRAL_CODE,
  referredCount: 0,
};
```

Replace the body of the test `'appends &pack=<packId> to the generic referral link'` (lines 96-109) with a renamed test:

```ts
it('shares a t.me startapp deep link encoding code and pack id', async () => {
  const shareSpy = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('navigator', { ...global.navigator, share: shareSpy });

  const user = userEvent.setup();
  await renderPackActions({ unlocked: false });

  await user.click(screen.getByRole('button', { name: /unlock all/i }));
  await waitFor(() => expect(shareSpy).toHaveBeenCalled());

  const sharedUrl: string = shareSpy.mock.calls[0][0].url;
  expect(sharedUrl).toBe(EXPECTED_PACK_LINK);
  expect(sharedUrl).toContain(`startapp=${REFERRAL_CODE}_${PACK_ID}`);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd frontend && npx vitest run src/components/result/__tests__/pack-actions.test.tsx`
Expected: FAIL — component still builds the old `?ref=` URL from `data.link`.

- [ ] **Step 3: Implement the component change**

In `pack-actions.tsx`, add the import after the existing imports (after line 8):

```ts
import { telegramReferralHref } from '@/lib/telegram/href';
```

Replace the parse + url construction inside `handleUnlock` (lines 40-44) with:

```ts
const res = await fetch('/api/referral/me', { credentials: 'include' });
if (!res.ok) throw new Error(`referral/me ${res.status}`);
const data = (await res.json()) as { code: string; referredCount: number };

// Telegram deep link: tapping it opens the Mini App, auto-logs-in the
// friend, and credits the referral via start_param.
const url = telegramReferralHref(data.code, packId);
```

- [ ] **Step 4: Run the pack-actions suite to verify it passes**

Run: `cd frontend && npx vitest run src/components/result/__tests__/pack-actions.test.tsx`
Expected: PASS (share + clipboard + referral/me suites all green).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/result/pack-actions.tsx frontend/src/components/result/__tests__/pack-actions.test.tsx
git commit -m "feat(frontend): share Telegram deep link instead of web ref URL

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Remove the web `ReferralCapture` cookie writer

**Files:**

- Delete: `frontend/src/components/referral-capture.tsx`
- Delete: `frontend/src/components/__tests__/referral-capture.test.tsx`
- Modify: `frontend/src/app/layout.tsx` (remove import line 9 + mount line 74)

**Interfaces:**

- None. Pure removal of the dead web capture path.

- [ ] **Step 1: Delete the component and its test**

```bash
git rm frontend/src/components/referral-capture.tsx frontend/src/components/__tests__/referral-capture.test.tsx
```

- [ ] **Step 2: Remove the mount + import from `layout.tsx`**

Delete the import (line 9):

```ts
import { ReferralCapture } from '@/components/referral-capture';
```

Delete the mount (line 74):

```tsx
<ReferralCapture />
```

- [ ] **Step 3: Run typecheck + full frontend suite**

Run: `cd frontend && npm run lint && npm test`
Expected: PASS — no dangling import of `ReferralCapture`; referral-capture test no longer collected.

- [ ] **Step 4: Run the full backend suite (final integration check)**

Run: `cd backend && npm test`
Expected: PASS — all referral/auth specs green.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(frontend): remove dead web ReferralCapture cookie writer

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Final verification

- [ ] `cd backend && npm run lint && npm test` → all green.
- [ ] `cd frontend && npm run lint && npm test` → all green.
- [ ] Manual smoke (in Telegram): on a result page tap **Unlock all** → confirm the shared/copied URL is `https://t.me/stikup_bot?startapp=<code>_<packId>`. Open that link from a second Telegram account → it lands logged-in on the home page; the first account receives the "🎉 all unlocked" message and the pack shows unlocked.

## Spec coverage check

- Remove web `?ref=` flow entirely → Tasks 4 (backend cookie attribution + constants) + 8 (frontend capture) + 5 (drop web `link`).
- Telegram `start_param` carries ref+pack, trusted via signed initData → Tasks 1 + 2 + 3.
- Credit only new accounts; unchanged `attribute()` (unlock msg + top-up) → Task 3 (gated on `created`, calls existing `attribute`).
- Frontend shares the deep link → Tasks 6 + 7.
- Silent landing → no UI task needed (auto-login already lands on home).
