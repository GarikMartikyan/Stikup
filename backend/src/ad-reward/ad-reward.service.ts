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
