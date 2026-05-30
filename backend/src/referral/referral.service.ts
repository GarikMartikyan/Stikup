import { randomBytes } from 'node:crypto';

import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import type { Channel } from '@prisma/client';
import { Prisma } from '@prisma/client';

import { BOT_SENDER, type BotSender } from '../auth/channel/bot-sender';
import { TelegramStickerService } from '../auth/channel/telegram-sticker.service';
import { frontendConfig } from '../config/frontend.config';
import { offerConfig } from '../config/offer.config';
import { getPlaceholderFiles } from '../pack/sticker-assets';
import { PrismaService } from '../prisma/prisma.service';

const REFERRAL_CODE_BYTES = 6; // 6 bytes → 8 base62 chars
const REFERRAL_UNLOCK_MESSAGE =
  '🎉 Someone joined through your link — all 12 stickers in your pack are now unlocked!';

function toBase62(buf: Buffer): string {
  const alphabet =
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let n = BigInt('0x' + buf.toString('hex'));
  let result = '';
  const base = BigInt(62);
  while (n > 0n) {
    result = alphabet[Number(n % base)] + result;
    n /= base;
  }
  return result.padStart(8, '0');
}

@Injectable()
export class ReferralService {
  private readonly logger = new Logger(ReferralService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(offerConfig.KEY)
    private readonly offer: ConfigType<typeof offerConfig>,
    @Inject(frontendConfig.KEY)
    private readonly frontend: ConfigType<typeof frontendConfig>,
    @Inject(BOT_SENDER) private readonly botSender: BotSender,
    private readonly telegramStickerService: TelegramStickerService,
  ) {}

  async getOrCreateReferralInfo(userId: string): Promise<{
    code: string;
    link: string;
    unlocked: boolean;
    referredCount: number;
  }> {
    let user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { referralCode: true, fullPackUnlockedAt: true },
    });

    if (!user.referralCode) {
      const code = await this.generateUniqueCode();
      user = await this.prisma.user.update({
        where: { id: userId },
        data: { referralCode: code },
        select: { referralCode: true, fullPackUnlockedAt: true },
      });
    }

    const code = user.referralCode!;
    const referredCount = await this.prisma.referral.count({
      where: { referrerId: userId },
    });

    return {
      code,
      link: `${this.frontend.publicAppUrl}/?ref=${code}`,
      unlocked: user.fullPackUnlockedAt != null,
      referredCount,
    };
  }

  /**
   * Attribute a new registration to a referrer identified by `code`.
   * This method is best-effort: it never throws so it cannot break registration.
   */
  async attribute(
    referredUserId: string,
    code: string | null | undefined,
    channel: Channel,
  ): Promise<void> {
    if (!code) return;

    try {
      const referrer = await this.prisma.user.findUnique({
        where: { referralCode: code },
        select: { id: true, fullPackUnlockedAt: true },
      });

      if (!referrer || referrer.id === referredUserId) return;

      await this.prisma.referral.create({
        data: {
          referrerId: referrer.id,
          referredUserId,
          channel,
        },
      });

      if (
        this.offer.referralUnlockEnabled &&
        referrer.fullPackUnlockedAt == null
      ) {
        await this.prisma.user.update({
          where: { id: referrer.id },
          data: { fullPackUnlockedAt: new Date() },
        });

        // Best-effort: notify the referrer via Telegram if they have an identity,
        // and top up any sticker sets that are below full size.
        const tgIdentity = await this.prisma.channelIdentity.findFirst({
          where: { userId: referrer.id, channel: 'telegram' },
          select: { channelUserId: true, username: true },
        });

        if (tgIdentity) {
          // Top-up packs that already have a sticker set but are below full size.
          const packSize = this.offer.packSize;
          const eligiblePacks = await this.prisma.pack.findMany({
            where: {
              userId: referrer.id,
              telegramStickerSetName: { not: null },
              telegramStickerCount: { lt: packSize },
            },
            select: { id: true, telegramStickerCount: true },
          });

          const setLinks: string[] = [];

          if (eligiblePacks.length > 0) {
            const files = getPlaceholderFiles(packSize);
            if (files.length === 0) {
              this.logger.warn(
                `referral top-up: placeholder files unavailable for packSize=${packSize}; skipping top-up`,
              );
            }
            const usernameOrFallback =
              tgIdentity.username ?? `user${tgIdentity.channelUserId}`;

            for (const pack of files.length > 0 ? eligiblePacks : []) {
              try {
                const result = await this.telegramStickerService.ensureSet({
                  channelUserId: tgIdentity.channelUserId,
                  packId: pack.id,
                  usernameOrFallback,
                  files,
                });
                await this.prisma.pack.update({
                  where: { id: pack.id },
                  data: { telegramStickerCount: result.count },
                });
                setLinks.push(result.shareUrl);
              } catch (topUpErr: unknown) {
                this.logger.warn(
                  `referral top-up: ensureSet failed for pack ${pack.id}: ${topUpErr instanceof Error ? topUpErr.message : String(topUpErr)}`,
                );
              }
            }
          }

          const linkText =
            setLinks.length > 0
              ? '\n\nYour updated pack(s):\n' + setLinks.join('\n')
              : '';

          this.botSender
            .sendMessage(
              tgIdentity.channelUserId,
              REFERRAL_UNLOCK_MESSAGE + linkText,
            )
            .catch((err: unknown) => {
              this.logger.warn(
                `referral unlock notification failed for user ${referrer.id}: ${err instanceof Error ? err.message : String(err)}`,
              );
            });
        }
      }
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        // Already attributed — idempotent, silently ignore.
        return;
      }
      this.logger.error(
        `referral attribution failed for referredUserId=${referredUserId} code=${code}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private async generateUniqueCode(): Promise<string> {
    // Retry on the unlikely collision against the unique index.
    for (let attempt = 0; attempt < 10; attempt++) {
      const code = toBase62(randomBytes(REFERRAL_CODE_BYTES));
      const existing = await this.prisma.user.findUnique({
        where: { referralCode: code },
        select: { id: true },
      });
      if (!existing) return code;
    }
    throw new Error(
      'Failed to generate a unique referral code after 10 attempts',
    );
  }
}
