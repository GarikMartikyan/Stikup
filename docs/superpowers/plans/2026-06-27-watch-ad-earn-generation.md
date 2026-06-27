# Watch-an-ad to earn a generation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user out of generation quota earn +1 generation by watching a rewarded ad, from a button on the existing "you've used all your generations" banner.

**Architecture:** Reactive + client-confirmed. The upload `POST` still 403s when out of quota; the page now shows a watch-ad banner instead of a dead-end error. After the rewarded ad resolves on the client, the page calls a new session-authenticated `POST /api/ads/reward`, which appends a row to a new `AdReward` ledger table (each row = +1 to the quota cap) and returns the fresh `regensLeft`; the page then auto-retries the upload (skipping the during-generation interstitial). Unlimited: 1 ad = +1, repeatable.

**Tech Stack:** Backend NestJS 11 + Prisma 6 (Postgres) + `@nestjs/throttler`; Frontend Next 16 / React 19 client components + Adsgram Mini-App SDK; tests jest (backend) / vitest + Testing Library (frontend).

## Global Constraints

- **Reward policy:** unlimited, **1 ad = +1 generation**, no daily cap. The endpoint `@Throttle` is an abuse backstop only.
- **Trust model:** client-confirmed. Credit is granted by a **session-authenticated** endpoint after the ad resolves; **no** Adsgram S2S Reward URL is built.
- **Ad block:** reuse the existing block. `adsgramRewardBlockId()` falls back to `adsgramBlockId()`. **No** `.env`/Docker/CI changes in this plan.
- **Skip the second ad:** the rewarded-unlock auto-retry must NOT also play the during-generation interstitial.
- **Quota cap formula (single source of truth):** `cap = baseGenerations + referralBonusGenerations × referralCount + adRewardCount`.
- **NEXT*PUBLIC*\* vars** must be referenced as literal `process.env.NEXT_PUBLIC_*` expressions (Next inlines them at build) — keep the function-wrapper pattern in `lib/config.ts`.
- **Frontend is Next 16** (breaking changes vs training data) — per `frontend/AGENTS.md`, check `node_modules/next/dist/docs/` before introducing any App-Router convention/server-side construct. (This plan only touches client components, a lib helper, JSON, and tests.)
- **Backend env** is loaded from the repo-root `.env` via `envFilePath`; the dev Postgres must be running for the migration step.
- Branch: `feat/watch-ad-earn-generation` (already checked out, spec already committed).

---

## File Structure

**Backend**

- Create `backend/src/common/quota.ts` — pure `computeCap()` helper (shared by PackService + AdRewardService).
- Modify `backend/prisma/schema.prisma` — new `AdReward` model + `User.adRewards` back-relation.
- Create `backend/prisma/migrations/<ts>_add_ad_rewards/migration.sql` — generated.
- Modify `backend/src/pack/pack.service.ts` — use `computeCap`, fold `adRewardCount` into all 3 cap sites.
- Modify `backend/src/pack/__tests__/pack.service.spec.ts` — add `adReward.count` to the prisma mock; add a cap test.
- Create `backend/src/ad-reward/ad-reward.service.ts` — grant + compute `regensLeft`.
- Create `backend/src/ad-reward/ad-reward.controller.ts` — `POST /ads/reward`, session-auth.
- Create `backend/src/ad-reward/ad-reward.module.ts` — wires the above.
- Create `backend/src/ad-reward/__tests__/ad-reward.service.spec.ts` and `ad-reward.controller.spec.ts`.
- Modify `backend/src/app.module.ts` — register `AdRewardModule`.

**Frontend**

- Modify `frontend/src/lib/config.ts` — add `adsgramRewardBlockId()`.
- Modify `frontend/src/lib/ads/adsgram.ts` — extract `runAd()`, add `showRewarded()`.
- Modify `frontend/src/lib/ads/__tests__/adsgram.test.ts` — add `showRewarded` tests.
- Create `frontend/src/components/upload/no-generations-banner.tsx` — banner + watch-ad button.
- Create `frontend/src/components/upload/__tests__/no-generations-banner.test.tsx`.
- Modify `frontend/src/app/upload/page.tsx` — quota-blocked state, watch-ad handler, submit options, render banner.
- Modify `frontend/src/app/upload/__tests__/page.test.tsx` — add the watch-ad flow tests.
- Modify `frontend/src/i18n/messages/en.json` and `ru.json` — `upload.actions.watch_ad`, `upload.error.ad_unavailable`.

---

## Task 1: AdReward Prisma model + migration

**Files:**

- Modify: `backend/prisma/schema.prisma` (`model User`, end of file)
- Create (generated): `backend/prisma/migrations/<timestamp>_add_ad_rewards/migration.sql`

**Interfaces:**

- Produces: Prisma model `AdReward { id, userId, createdAt }` (table `ad_rewards`), client accessor `prisma.adReward` with `.count({ where: { userId } })` and `.create({ data: { userId } })`; `User.adRewards` back-relation.

- [ ] **Step 1: Add the model and back-relation to the schema**

In `backend/prisma/schema.prisma`, add to `model User` (alongside the other relations, e.g. after `packs Pack[]`):

```prisma
  adRewards        AdReward[]
```

Add a new model after `model User` (place it near the other domain models):

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

- [ ] **Step 2: Ensure the dev Postgres is running**

Run: `npm run -w backend prisma:status`
Expected: it connects (lists migration status). If it errors with a connection refused, start the dev DB first (e.g. `docker compose -f docker-compose.dev.yml up -d`) and re-run.

- [ ] **Step 3: Create and apply the migration**

Run: `npm run -w backend prisma:migrate -- --name add_ad_rewards`
Expected: Prisma creates `backend/prisma/migrations/<ts>_add_ad_rewards/`, applies it, and regenerates the client. The generated `migration.sql` should `CREATE TABLE "ad_rewards"` with a FK to `users(id)` and an index on `user_id`.

- [ ] **Step 4: Verify the client typechecks against the new model**

Run: `npm run -w backend typecheck`
Expected: PASS (no type errors; `prisma.adReward` now exists).

- [ ] **Step 5: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations
git commit -m "feat(db): add AdReward ledger table for ad-earned generations

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: computeCap helper + fold adRewardCount into PackService

**Files:**

- Create: `backend/src/common/quota.ts`
- Modify: `backend/src/pack/pack.service.ts` (`generatePack` ~108-114, `listPacks` ~226-257, `getPack` ~289-314)
- Test: `backend/src/pack/__tests__/pack.service.spec.ts`

**Interfaces:**

- Produces: `computeCap(offer: { baseGenerations: number; referralBonusGenerations: number }, referralCount: number, adRewardCount: number): number`.
- Consumes: `prisma.adReward.count({ where: { userId } })` (Task 1).

- [ ] **Step 1: Write the failing test (getPack cap includes ad rewards)**

In `backend/src/pack/__tests__/pack.service.spec.ts`, first extend `buildPrismaMock()` so the new model exists on the mock — add this block inside the `mock` object (next to `referral`):

```ts
    adReward: {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue({}),
    },
```

Then add a test (in the `getPack`/relevant describe block — if unsure, add a new `describe('quota cap', () => { ... })` at the end of the file):

```ts
describe('quota cap with ad rewards', () => {
  it('extends regensLeft by the ad-reward count', async () => {
    const prisma = buildPrismaMock();
    const service = buildService(prisma, buildBotSenderMock());

    // base=2, referralBonus=2, referrals=0 → base cap 2; used 2 → normally locked.
    (prisma.pack.findUnique as jest.Mock).mockResolvedValue({
      id: 'pack-1',
      status: 'ready',
      userId: 'user-1',
      sourceImageUrl: null,
      stickers: [],
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      fullPackUnlockedAt: null,
      generationsUsed: 2,
    });
    (prisma.referral.count as jest.Mock).mockResolvedValue(0);
    (prisma.adReward.count as jest.Mock).mockResolvedValue(2); // +2 from ads

    const pack = await service.getPack('pack-1', 'user-1');

    // cap = 2 + 2*0 + 2 = 4; used 2 → regensLeft 2, not locked.
    expect(pack?.regensLeft).toBe(2);
    expect(pack?.locked).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -w backend -- pack.service`
Expected: FAIL — current `getPack` ignores `adReward.count`, so `regensLeft` is `0` and `locked` is `true`.

- [ ] **Step 3: Create the helper**

Create `backend/src/common/quota.ts`:

```ts
/**
 * Per-user generation cap.
 *
 * Single source of truth for the quota formula, shared by PackService (the
 * generation gate + display) and AdRewardService (granting ad-earned credits).
 *
 *   cap = baseGenerations
 *       + referralBonusGenerations * referralCount   // friends who signed up
 *       + adRewardCount                              // ads watched (1 each)
 */
export function computeCap(
  offer: { baseGenerations: number; referralBonusGenerations: number },
  referralCount: number,
  adRewardCount: number,
): number {
  return (
    offer.baseGenerations +
    offer.referralBonusGenerations * referralCount +
    adRewardCount
  );
}
```

- [ ] **Step 4: Wire it into PackService**

In `backend/src/pack/pack.service.ts`, add the import near the other local imports:

```ts
import { computeCap } from '../common/quota';
```

In `generatePack`, inside the `if (!this.offer.unlimitedGenerations) {` block, replace the referral-count + cap lines:

```ts
const referralCount = await tx.referral.count({
  where: { referrerId: userId },
});
const adRewardCount = await tx.adReward.count({
  where: { userId },
});
const cap = computeCap(this.offer, referralCount, adRewardCount);
```

In `listPacks`, add the ad-reward count to the existing `Promise.all` (after the `referral.count` entry):

```ts
      this.prisma.referral.count({ where: { referrerId: userId } }),
      this.prisma.adReward.count({ where: { userId } }),
```

Update the destructure to `const [packs, user, referralCount, adRewardCount] = ...` and replace the inline cap calc with:

```ts
const cap = computeCap(this.offer, referralCount, adRewardCount);
```

In `getPack`, add to its `Promise.all`:

```ts
      this.prisma.referral.count({ where: { referrerId: userId } }),
      this.prisma.adReward.count({ where: { userId } }),
```

Update the destructure to `const [user, referralCount, adRewardCount] = ...` and replace the inline cap calc with:

```ts
const cap = computeCap(this.offer, referralCount, adRewardCount);
```

(Leave the `unlimited`/`regensLeft`/`locked` lines below each cap as they are.)

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test -w backend -- pack.service`
Expected: PASS — the new cap test plus all existing pack.service tests (the mock now provides `adReward.count` defaulting to 0, so unchanged cases still compute the same cap).

- [ ] **Step 6: Commit**

```bash
git add backend/src/common/quota.ts backend/src/pack/pack.service.ts backend/src/pack/__tests__/pack.service.spec.ts
git commit -m "feat(pack): fold ad-reward count into the generation cap

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: AdRewardService

**Files:**

- Create: `backend/src/ad-reward/ad-reward.service.ts`
- Test: `backend/src/ad-reward/__tests__/ad-reward.service.spec.ts`

**Interfaces:**

- Consumes: `PrismaService`, `offerConfig` (`ConfigType<typeof offerConfig>`), `computeCap` (Task 2).
- Produces: `class AdRewardService { grantAdReward(userId: string): Promise<{ regensLeft: number }> }`.

- [ ] **Step 1: Write the failing test**

Create `backend/src/ad-reward/__tests__/ad-reward.service.spec.ts`:

```ts
import { PrismaService } from '../../prisma/prisma.service';
import { AdRewardService } from '../ad-reward.service';

const OFFER_STUB = {
  baseGenerations: 2,
  referralBonusGenerations: 2,
  unlimitedGenerations: false,
} as unknown as Parameters<typeof buildService>[1];

function buildPrismaMock() {
  return {
    user: { findUnique: jest.fn() },
    referral: { count: jest.fn().mockResolvedValue(0) },
    adReward: {
      create: jest.fn().mockResolvedValue({}),
      count: jest.fn().mockResolvedValue(0),
    },
  } as unknown as jest.Mocked<PrismaService>;
}

function buildService(
  prisma: jest.Mocked<PrismaService>,
  offer: {
    baseGenerations: number;
    referralBonusGenerations: number;
    unlimitedGenerations: boolean;
  },
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new AdRewardService(prisma, offer as any);
}

describe('AdRewardService.grantAdReward', () => {
  it('inserts a reward row and returns the new regensLeft', async () => {
    const prisma = buildPrismaMock();
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      generationsUsed: 2,
    });
    (prisma.referral.count as jest.Mock).mockResolvedValue(0);
    // After the insert, the ledger holds 1 row.
    (prisma.adReward.count as jest.Mock).mockResolvedValue(1);

    const service = buildService(prisma, {
      baseGenerations: 2,
      referralBonusGenerations: 2,
      unlimitedGenerations: false,
    });

    const result = await service.grantAdReward('user-1');

    expect(prisma.adReward.create).toHaveBeenCalledWith({
      data: { userId: 'user-1' },
    });
    // cap = 2 + 2*0 + 1 = 3; used 2 → regensLeft 1.
    expect(result).toEqual({ regensLeft: 1 });
  });

  it('does not insert a row when generations are unlimited', async () => {
    const prisma = buildPrismaMock();
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      generationsUsed: 5,
    });
    const service = buildService(prisma, {
      baseGenerations: 2,
      referralBonusGenerations: 2,
      unlimitedGenerations: true,
    });

    const result = await service.grantAdReward('user-1');

    expect(prisma.adReward.create).not.toHaveBeenCalled();
    expect(result.regensLeft).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -w backend -- ad-reward.service`
Expected: FAIL with "Cannot find module '../ad-reward.service'".

- [ ] **Step 3: Implement the service**

Create `backend/src/ad-reward/ad-reward.service.ts`:

```ts
import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';

import { computeCap } from '../common/quota';
import { offerConfig } from '../config/offer.config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdRewardService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(offerConfig.KEY)
    private readonly offer: ConfigType<typeof offerConfig>,
  ) {}

  /**
   * Grant one ad-earned generation to the user and return their fresh
   * remaining-generations count. Client-confirmed: the caller invokes this
   * only after a rewarded ad has resolved on the client (see the upload page).
   *
   * Under `unlimitedGenerations` the quota gate is bypassed entirely, so we
   * skip the ledger insert — the credit is irrelevant.
   */
  async grantAdReward(userId: string): Promise<{ regensLeft: number }> {
    if (!this.offer.unlimitedGenerations) {
      await this.prisma.adReward.create({ data: { userId } });
    }
    return { regensLeft: await this.computeRegensLeft(userId) };
  }

  private async computeRegensLeft(userId: string): Promise<number> {
    const [user, referralCount, adRewardCount] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { generationsUsed: true },
      }),
      this.prisma.referral.count({ where: { referrerId: userId } }),
      this.prisma.adReward.count({ where: { userId } }),
    ]);

    const cap = computeCap(this.offer, referralCount, adRewardCount);
    if (this.offer.unlimitedGenerations) return cap;
    const generationsUsed = user?.generationsUsed ?? 0;
    return Math.max(0, cap - generationsUsed);
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -w backend -- ad-reward.service`
Expected: PASS (both cases).

- [ ] **Step 5: Commit**

```bash
git add backend/src/ad-reward/ad-reward.service.ts backend/src/ad-reward/__tests__/ad-reward.service.spec.ts
git commit -m "feat(ads): AdRewardService grants an ad-earned generation

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: AdRewardController + module + registration

**Files:**

- Create: `backend/src/ad-reward/ad-reward.controller.ts`
- Create: `backend/src/ad-reward/ad-reward.module.ts`
- Modify: `backend/src/app.module.ts`
- Test: `backend/src/ad-reward/__tests__/ad-reward.controller.spec.ts`

**Interfaces:**

- Consumes: `SessionService.resolve(sid)` (from `AuthModule`), `sessionConfig` (`cookieName`), `AdRewardService.grantAdReward` (Task 3).
- Produces: route `POST /ads/reward` → `{ regensLeft: number }` (reached from the browser as `/api/ads/reward` via the Next rewrite `/api/:path* → backend/:path*`). `401` without a valid session.

- [ ] **Step 1: Write the failing controller test**

Create `backend/src/ad-reward/__tests__/ad-reward.controller.spec.ts`:

```ts
import { UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

import type { SessionService } from '../../auth/session.service';
import type { AdRewardService } from '../ad-reward.service';
import { AdRewardController } from '../ad-reward.controller';

function buildController(resolveResult: { userId: string } | null) {
  const sessions = {
    resolve: jest.fn().mockResolvedValue(resolveResult),
  } as unknown as jest.Mocked<SessionService>;
  const adRewards = {
    grantAdReward: jest.fn().mockResolvedValue({ regensLeft: 1 }),
  } as unknown as jest.Mocked<AdRewardService>;
  const controller = new AdRewardController(sessions, adRewards, {
    cookieName: 'sid',
  } as never);
  return { controller, sessions, adRewards };
}

function reqWithCookie(sid?: string): Request {
  return { cookies: sid ? { sid } : {} } as unknown as Request;
}

describe('AdRewardController.reward', () => {
  it('throws Unauthorized without a session', async () => {
    const { controller } = buildController(null);
    await expect(controller.reward(reqWithCookie())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('grants the reward and returns regensLeft for a valid session', async () => {
    const { controller, adRewards } = buildController({ userId: 'user-1' });
    const result = await controller.reward(reqWithCookie('sid-token'));
    expect(adRewards.grantAdReward).toHaveBeenCalledWith('user-1');
    expect(result).toEqual({ regensLeft: 1 });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -w backend -- ad-reward.controller`
Expected: FAIL with "Cannot find module '../ad-reward.controller'".

- [ ] **Step 3: Implement the controller**

Create `backend/src/ad-reward/ad-reward.controller.ts`:

```ts
import {
  Controller,
  HttpCode,
  Inject,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import {
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';

import { SessionService } from '../auth/session.service';
import { sessionConfig } from '../config/session.config';
import { AdRewardService } from './ad-reward.service';

@ApiTags('ads')
@Controller('ads')
export class AdRewardController {
  constructor(
    private readonly sessions: SessionService,
    private readonly adRewards: AdRewardService,
    @Inject(sessionConfig.KEY)
    private readonly session: ConfigType<typeof sessionConfig>,
  ) {}

  // Abuse backstop only — NOT a product cap. The reward policy is unlimited
  // (1 ad = +1 generation); a human cannot watch more than a few dozen
  // ~15-30s ads per hour, so 60/hr never bothers a real user.
  @Throttle({ default: { limit: 60, ttl: 3_600_000 } })
  @Post('reward')
  @HttpCode(200)
  @ApiOkResponse({
    schema: {
      properties: { regensLeft: { type: 'integer' } },
      required: ['regensLeft'],
    },
  })
  @ApiUnauthorizedResponse()
  async reward(@Req() req: Request): Promise<{ regensLeft: number }> {
    const cookies = (req.cookies ?? {}) as Record<string, string | undefined>;
    const sid = cookies[this.session.cookieName];
    const session = await this.sessions.resolve(sid);
    if (!session) throw new UnauthorizedException();

    return this.adRewards.grantAdReward(session.userId);
  }
}
```

- [ ] **Step 4: Implement the module**

Create `backend/src/ad-reward/ad-reward.module.ts`:

```ts
import { forwardRef, Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { AdRewardController } from './ad-reward.controller';
import { AdRewardService } from './ad-reward.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [AdRewardController],
  providers: [AdRewardService],
})
export class AdRewardModule {}
```

- [ ] **Step 5: Register the module**

In `backend/src/app.module.ts`, add the import and include it in the `imports` array (next to `ReferralModule`):

```ts
import { AdRewardModule } from './ad-reward/ad-reward.module';
```

```ts
    PackModule,
    ReferralModule,
    AdRewardModule,
```

- [ ] **Step 6: Run the controller test + typecheck**

Run: `npm test -w backend -- ad-reward.controller`
Expected: PASS (both cases).

Run: `npm run -w backend typecheck`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/src/ad-reward backend/src/app.module.ts
git commit -m "feat(ads): POST /ads/reward endpoint (session-auth, throttled)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Frontend ad wrapper — adsgramRewardBlockId + showRewarded

**Files:**

- Modify: `frontend/src/lib/config.ts` (after `adsgramBlockId`, ~40)
- Modify: `frontend/src/lib/ads/adsgram.ts`
- Test: `frontend/src/lib/ads/__tests__/adsgram.test.ts`

**Interfaces:**

- Produces: `adsgramRewardBlockId(): string` and `showRewarded(): Promise<AdResult>` (`AdResult = "shown" | "skipped" | "error"`, already exported).

- [ ] **Step 1: Write the failing tests**

In `frontend/src/lib/ads/__tests__/adsgram.test.ts`, update the import line:

```ts
import { showInterstitial, showRewarded } from '../adsgram';
```

Add a new describe block at the end of the file:

```ts
describe('showRewarded', () => {
  it("returns 'shown' and inits with the reward block id when set", async () => {
    setTelegram(true);
    vi.stubEnv('NEXT_PUBLIC_ADSGRAM_REWARD_BLOCK_ID', 'rew-1');
    const init = vi.fn(() => ({ show: () => Promise.resolve() }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Adsgram = { init };
    expect(await showRewarded()).toBe('shown');
    expect(init).toHaveBeenCalledWith({ blockId: 'rew-1' });
  });

  it('falls back to the interstitial block id when the reward var is unset', async () => {
    setTelegram(true);
    vi.stubEnv('NEXT_PUBLIC_ADSGRAM_BLOCK_ID', 'int-36357');
    const init = vi.fn(() => ({ show: () => Promise.resolve() }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Adsgram = { init };
    await showRewarded();
    expect(init).toHaveBeenCalledWith({ blockId: 'int-36357' });
  });

  it("returns 'skipped' when not in Telegram", async () => {
    setTelegram(false);
    vi.stubEnv('NEXT_PUBLIC_ADSGRAM_REWARD_BLOCK_ID', 'rew-1');
    expect(await showRewarded()).toBe('skipped');
  });

  it("returns 'error' when the ad rejects", async () => {
    setTelegram(true);
    vi.stubEnv('NEXT_PUBLIC_ADSGRAM_REWARD_BLOCK_ID', 'rew-1');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Adsgram = {
      init: () => ({ show: () => Promise.reject(new Error('no fill')) }),
    };
    expect(await showRewarded()).toBe('error');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -w frontend -- adsgram`
Expected: FAIL — `showRewarded` is not exported.

- [ ] **Step 3: Add the config helper**

In `frontend/src/lib/config.ts`, add after `adsgramBlockId`:

```ts
/**
 * Adsgram block id used for the rewarded "watch ad to earn a generation" flow.
 * Falls back to the interstitial block id so the feature ships without a new
 * env var / Docker build-arg. Set `NEXT_PUBLIC_ADSGRAM_REWARD_BLOCK_ID` to a
 * dedicated Adsgram "Reward" block later for stricter full-watch semantics.
 */
export function adsgramRewardBlockId(): string {
  return process.env.NEXT_PUBLIC_ADSGRAM_REWARD_BLOCK_ID ?? adsgramBlockId();
}
```

- [ ] **Step 4: Refactor the wrapper and add showRewarded**

In `frontend/src/lib/ads/adsgram.ts`, update the import:

```ts
import { adsgramBlockId, adsgramRewardBlockId } from '@/lib/config';
```

Replace the single `showInterstitial` function with a shared `runAd` plus two thin entry points (keep the file's existing doc comments and `AD_TIMEOUT_MS`/types above):

```ts
/**
 * Best-effort: always resolves to a tagged result, never rejects, and is
 * bounded by AD_TIMEOUT_MS so a hung ad can never block the caller.
 *
 * - "skipped": outside Telegram, SDK not loaded, or no block id configured.
 * - "shown": the ad played and closed (for rewarded blocks, was watched).
 * - "error": the SDK rejected, or the ad failed to settle within AD_TIMEOUT_MS.
 */
async function runAd(blockId: string): Promise<AdResult> {
  if (!isTelegramEnv()) return 'skipped';
  if (typeof window === 'undefined') return 'skipped';

  const sdk = window.Adsgram;
  if (!sdk || !blockId) return 'skipped';

  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const controller = sdk.init({ blockId });
    const shown = controller.show().then<AdResult>(() => 'shown');
    const timedOut = new Promise<AdResult>((resolve) => {
      timer = setTimeout(() => resolve('error'), AD_TIMEOUT_MS);
    });
    return await Promise.race([shown, timedOut]);
  } catch {
    return 'error';
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Show an interstitial ad (best-effort) during normal generation. */
export function showInterstitial(): Promise<AdResult> {
  return runAd(adsgramBlockId());
}

/**
 * Show a rewarded ad. "shown" means the user watched it and the caller may
 * grant the reward (the upload page calls POST /api/ads/reward on "shown").
 */
export function showRewarded(): Promise<AdResult> {
  return runAd(adsgramRewardBlockId());
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test -w frontend -- adsgram`
Expected: PASS — all existing `showInterstitial` tests plus the new `showRewarded` tests.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/config.ts frontend/src/lib/ads/adsgram.ts frontend/src/lib/ads/__tests__/adsgram.test.ts
git commit -m "feat(ads): showRewarded() wrapper with reward block-id fallback

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: NoGenerationsBanner component (+ watch_ad i18n)

**Files:**

- Create: `frontend/src/components/upload/no-generations-banner.tsx`
- Modify: `frontend/src/i18n/messages/en.json` (`upload.actions`), `frontend/src/i18n/messages/ru.json` (`upload.actions`)
- Test: `frontend/src/components/upload/__tests__/no-generations-banner.test.tsx`

**Interfaces:**

- Produces: `NoGenerationsBanner({ watchingAd, adError, onWatchAd }: { watchingAd: boolean; adError: string | null; onWatchAd: () => void })`. Uses i18n keys `upload.error.no_generations` (exists), `upload.actions.watch_ad` (added here).

- [ ] **Step 1: Add the i18n string**

In `frontend/src/i18n/messages/en.json`, inside `upload.actions`, add:

```json
    "watch_ad": "Watch ad for 1 more generation"
```

In `frontend/src/i18n/messages/ru.json`, inside `upload.actions`, add:

```json
    "watch_ad": "Посмотреть рекламу за +1 генерацию"
```

(Add a comma on the preceding key so the JSON stays valid.)

- [ ] **Step 2: Write the failing component test**

Create `frontend/src/components/upload/__tests__/no-generations-banner.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NoGenerationsBanner } from '../no-generations-banner';

vi.mock('@/components/language-provider', () => ({
  useT: () => (k: string) => k,
}));

describe('NoGenerationsBanner', () => {
  it('shows the message and calls onWatchAd when the button is clicked', () => {
    const onWatchAd = vi.fn();
    render(
      <NoGenerationsBanner
        watchingAd={false}
        adError={null}
        onWatchAd={onWatchAd}
      />,
    );
    expect(screen.getByText('upload.error.no_generations')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: /upload\.actions\.watch_ad/ }),
    );
    expect(onWatchAd).toHaveBeenCalledOnce();
  });

  it('disables the button and surfaces adError while watching', () => {
    render(
      <NoGenerationsBanner
        watchingAd={true}
        adError={'upload.error.ad_unavailable'}
        onWatchAd={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('button', { name: /upload\.actions\.watch_ad/ }),
    ).toBeDisabled();
    expect(screen.getByText('upload.error.ad_unavailable')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -w frontend -- no-generations-banner`
Expected: FAIL — module does not exist.

- [ ] **Step 4: Implement the component**

Create `frontend/src/components/upload/no-generations-banner.tsx`:

```tsx
'use client';

import { Clapperboard, RefreshCw } from 'lucide-react';
import { useT } from '@/components/language-provider';

type NoGenerationsBannerProps = {
  watchingAd: boolean;
  adError: string | null;
  onWatchAd: () => void;
};

/**
 * Shown on the upload page when the user is out of generations. Offers a
 * rewarded ad that grants +1 generation (client-confirmed via POST
 * /api/ads/reward), then the upload auto-retries.
 */
export function NoGenerationsBanner({
  watchingAd,
  adError,
  onWatchAd,
}: NoGenerationsBannerProps) {
  const t = useT();
  return (
    <div className="mt-3 rounded-2xl border border-[var(--color-brand)]/40 bg-[var(--color-brand)]/10 p-4">
      <p className="text-sm font-semibold text-[var(--color-ink)]">
        {t('upload.error.no_generations')}
      </p>
      {adError && (
        <p className="mt-1 text-sm text-[var(--color-danger)]">{adError}</p>
      )}
      <button
        type="button"
        onClick={onWatchAd}
        disabled={watchingAd}
        className="shimmer group mt-3 inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] px-6 py-3 text-base font-bold text-white shadow-[0_18px_40px_-12px_rgba(224,52,154,0.55)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-80"
      >
        {watchingAd ? (
          <RefreshCw className="h-5 w-5 animate-spin" />
        ) : (
          <Clapperboard className="h-5 w-5" />
        )}
        <span>{t('upload.actions.watch_ad')}</span>
      </button>
    </div>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -w frontend -- no-generations-banner`
Expected: PASS (both cases).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/upload/no-generations-banner.tsx frontend/src/components/upload/__tests__/no-generations-banner.test.tsx frontend/src/i18n/messages/en.json frontend/src/i18n/messages/ru.json
git commit -m "feat(upload): NoGenerationsBanner with watch-ad CTA

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Wire the watch-ad flow into the upload page (+ ad_unavailable i18n)

**Files:**

- Modify: `frontend/src/app/upload/page.tsx`
- Modify: `frontend/src/i18n/messages/en.json` (`upload.error`), `frontend/src/i18n/messages/ru.json` (`upload.error`)
- Test: `frontend/src/app/upload/__tests__/page.test.tsx`

**Interfaces:**

- Consumes: `showRewarded` (Task 5), `NoGenerationsBanner` (Task 6), `POST /api/ads/reward` → `{ regensLeft: number }` (Task 4).
- Behavior produced: on `403`, render `NoGenerationsBanner` (keep the picked file); watch-ad → reward POST → auto-retry `submit({ skipInterstitial: true })`; the interstitial is NOT shown on a request that 403s nor on the rewarded-unlock retry.

- [ ] **Step 1: Add the i18n string**

In `frontend/src/i18n/messages/en.json`, inside `upload.error`, add:

```json
    "ad_unavailable": "Ad couldn't load. Please try again."
```

In `frontend/src/i18n/messages/ru.json`, inside `upload.error`, add:

```json
    "ad_unavailable": "Не удалось загрузить рекламу. Попробуйте ещё раз."
```

(Add a comma on the preceding key so the JSON stays valid.)

- [ ] **Step 2: Write the failing page tests**

In `frontend/src/app/upload/__tests__/page.test.tsx`, extend the adsgram mock and `beforeEach`:

Replace the adsgram mock block with:

```ts
const showInterstitialMock = vi.fn();
const showRewardedMock = vi.fn();
vi.mock('@/lib/ads/adsgram', () => ({
  showInterstitial: () => showInterstitialMock(),
  showRewarded: () => showRewardedMock(),
}));
```

In `beforeEach`, after the existing `showInterstitialMock` line add:

```ts
showRewardedMock.mockReset().mockResolvedValue('shown');
```

Add these tests inside `describe('UploadPage submit', ...)`:

```ts
  it('Telegram: 403 shows the watch-ad banner, no navigation, no interstitial', async () => {
    isTelegramEnvMock.mockReturnValue(true);
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({}),
    }) as unknown as typeof fetch;

    render(<UploadPage />);
    selectGrid();
    fireEvent.click(
      await screen.findByRole('button', { name: /upload\.actions\.generate/ }),
    );

    expect(
      await screen.findByRole('button', { name: /upload\.actions\.watch_ad/ }),
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
    expect(showInterstitialMock).not.toHaveBeenCalled();
  });

  it('Telegram: watching the ad grants a generation and auto-retries the upload', async () => {
    isTelegramEnvMock.mockReturnValue(true);
    let packsCalls = 0;
    global.fetch = vi.fn((url: string) => {
      if (url === '/api/ads/reward') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ regensLeft: 1 }),
        });
      }
      // /api/packs: first call 403 (out of quota), second call succeeds.
      packsCalls += 1;
      if (packsCalls === 1) {
        return Promise.resolve({ ok: false, status: 403, json: async () => ({}) });
      }
      return Promise.resolve({
        ok: true,
        status: 201,
        json: async () => ({ packId: 'pack-ad' }),
      });
    }) as unknown as typeof fetch;

    render(<UploadPage />);
    selectGrid();
    fireEvent.click(
      await screen.findByRole('button', { name: /upload\.actions\.generate/ }),
    );

    fireEvent.click(
      await screen.findByRole('button', { name: /upload\.actions\.watch_ad/ }),
    );

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/result/pack-ad'));
    expect(showRewardedMock).toHaveBeenCalledOnce();
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/ads/reward',
      expect.objectContaining({ method: 'POST' }),
    );
    // The rewarded unlock must NOT also play the during-generation interstitial.
    expect(showInterstitialMock).not.toHaveBeenCalled();
  });

  it('Telegram: shows ad_unavailable when the rewarded ad does not complete', async () => {
    isTelegramEnvMock.mockReturnValue(true);
    showRewardedMock.mockResolvedValue('error');
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({}),
    }) as unknown as typeof fetch;

    render(<UploadPage />);
    selectGrid();
    fireEvent.click(
      await screen.findByRole('button', { name: /upload\.actions\.generate/ }),
    );
    fireEvent.click(
      await screen.findByRole('button', { name: /upload\.actions\.watch_ad/ }),
    );

    expect(
      await screen.findByText('upload.error.ad_unavailable'),
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm test -w frontend -- upload/__tests__/page`
Expected: FAIL — the watch-ad button never appears (page doesn't render the banner yet); also `showRewarded` mock unused.

- [ ] **Step 4: Implement the page changes**

In `frontend/src/app/upload/page.tsx`:

(a) Update imports:

```ts
import { showInterstitial, showRewarded } from '@/lib/ads/adsgram';
import { NoGenerationsBanner } from '@/components/upload/no-generations-banner';
```

(b) Add state next to the existing `useState` calls:

```ts
const [quotaBlocked, setQuotaBlocked] = useState(false);
const [watchingAd, setWatchingAd] = useState(false);
const [adError, setAdError] = useState<string | null>(null);
```

(c) In `reset`, also clear the new state:

```ts
const reset = useCallback(() => {
  if (state.kind === 'ready') URL.revokeObjectURL(state.url);
  setState({ kind: 'idle' });
  setGated(false);
  setQuotaBlocked(false);
  setAdError(null);
  if (galleryRef.current) galleryRef.current.value = '';
}, [state]);
```

(d) Replace the whole `submit` callback. The 403 branch now sets `quotaBlocked` instead of an error state (so the picked file/preview survive for the retry), and the interstitial is awaited only for a successful, non-skipped generation — so a request that 403s no longer plays a wasted ad:

```ts
const submit = useCallback(
  async ({ skipInterstitial = false }: { skipInterstitial?: boolean } = {}) => {
    if (state.kind !== 'ready') return;
    const file = state.file;

    // Web (outside Telegram): don't generate — funnel the user into Telegram,
    // where the interstitial ad runs.
    if (!isTelegramEnv()) {
      setGated(true);
      return;
    }

    setSubmitting(true);

    const createPack = async (): Promise<string | null> => {
      try {
        const form = new FormData();
        form.append('image', file);
        const res = await fetch('/api/packs', {
          method: 'POST',
          body: form,
          credentials: 'include',
        });
        if (res.status === 401) {
          router.push('/login');
          return null;
        }
        if (res.status === 403) {
          // Out of quota — offer the watch-ad path. Keep `state` as "ready"
          // so the file and preview persist for the post-ad auto-retry.
          setQuotaBlocked(true);
          return null;
        }
        if (!res.ok) {
          setState({
            kind: 'error',
            message: t('upload.error.generation_failed'),
          });
          return null;
        }
        const { packId } = (await res.json()) as { packId: string };
        return packId;
      } catch {
        setState({
          kind: 'error',
          message: t('upload.error.generation_failed'),
        });
        return null;
      }
    };

    const packId = await createPack();
    if (!packId) {
      setSubmitting(false);
      return;
    }

    // Play the interstitial only on a real generation, and skip it entirely
    // when this submit is the auto-retry right after a rewarded unlock.
    if (!skipInterstitial) await showInterstitial();
    router.push(`/result/${packId}`);
  },
  [state, router, t],
);
```

(e) Add the watch-ad handler after `submit`:

```ts
const onWatchAd = useCallback(async () => {
  setWatchingAd(true);
  setAdError(null);
  try {
    const result = await showRewarded();
    if (result !== 'shown') {
      setAdError(t('upload.error.ad_unavailable'));
      return;
    }
    let regensLeft = 0;
    try {
      const res = await fetch('/api/ads/reward', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('reward request failed');
      ({ regensLeft } = (await res.json()) as { regensLeft: number });
    } catch {
      setAdError(t('upload.error.ad_unavailable'));
      return;
    }
    if (regensLeft >= 1) {
      setQuotaBlocked(false);
      await submit({ skipInterstitial: true });
    } else {
      setAdError(t('upload.error.ad_unavailable'));
    }
  } finally {
    setWatchingAd(false);
  }
}, [t, submit]);
```

(f) In the JSX, replace the `<UploadActions ... />` block so the banner takes over when out of quota, and pass an arg-free submit:

```tsx
{
  quotaBlocked ? (
    <NoGenerationsBanner
      watchingAd={watchingAd}
      adError={adError}
      onWatchAd={() => void onWatchAd()}
    />
  ) : (
    <UploadActions
      fileReady={fileReady}
      submitting={submitting}
      onPickGallery={() => galleryRef.current?.click()}
      onSubmit={() => void submit()}
    />
  );
}
```

- [ ] **Step 5: Run the page tests to verify they pass**

Run: `npm test -w frontend -- upload/__tests__/page`
Expected: PASS — the three new tests plus the three existing ones (web-gate, parallel-generation, ad-errors). The existing tests still pass: `createPack` resolves the packId fast, then the interstitial is awaited and `push` fires.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/upload/page.tsx frontend/src/app/upload/__tests__/page.test.tsx frontend/src/i18n/messages/en.json frontend/src/i18n/messages/ru.json
git commit -m "feat(upload): watch an ad to earn a generation when out of quota

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Typecheck the whole repo**

Run: `npm run typecheck`
Expected: PASS (backend + frontend).

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 3: Run all tests**

Run: `npm test -w backend && npm test -w frontend`
Expected: PASS for both workspaces.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: PASS (backend nest build + frontend next build). The frontend build inlines `NEXT_PUBLIC_ADSGRAM_REWARD_BLOCK_ID` (unset → falls back to the interstitial block).

- [ ] **Step 5: Final commit (only if any lint/format fixups were applied)**

```bash
git add -A
git commit -m "chore: verification fixups for watch-ad-earn-generation

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage**

- Reactive 403 → watch-ad banner, file preserved: Task 7 (`quotaBlocked`, keep `"ready"`). ✓
- Client-confirmed session-auth credit: Task 4 (`POST /ads/reward`, `sessions.resolve`). ✓
- Unlimited 1 ad = +1 via `AdReward` ledger: Tasks 1, 3. ✓
- Cap formula de-duplicated incl. `adRewardCount`: Task 2 (`computeCap`, all 3 sites). ✓
- `adsgramRewardBlockId()` fallback, no Docker/CI changes: Task 5. ✓
- `showRewarded()` best-effort wrapper: Task 5. ✓
- Skip the second/interstitial ad on auto-retry: Task 7 (`skipInterstitial`), asserted in the page test. ✓
- Wasted-interstitial-on-403 fix (improve code we touch): Task 7 (await createPack before interstitial). ✓
- i18n en + ru: Tasks 6, 7. ✓
- Tests: backend service/controller/cap (Tasks 2-4), frontend wrapper/component/page (Tasks 5-7). ✓
- Forgeable-credit trade-off accepted; throttle backstop: Task 4. ✓

**Placeholder scan:** none — every code/step is concrete.

**Type consistency:** `computeCap(offer, referralCount, adRewardCount)` used identically in Tasks 2 & 3. `grantAdReward(userId) → { regensLeft }` consistent across Tasks 3, 4. `showRewarded(): Promise<AdResult>` and `AdResult` reused from the existing file. `NoGenerationsBanner` prop names (`watchingAd`, `adError`, `onWatchAd`) match between Tasks 6 & 7. Reward route is `@Controller('ads') + @Post('reward')` → browser path `/api/ads/reward` (Next rewrite), consistent in Tasks 4 & 7.

**Out of scope (unchanged):** Adsgram S2S Reward URL + dedicated Reward block (future, 50k DAU); referral unlock; the interstitial for normal in-quota generations.
