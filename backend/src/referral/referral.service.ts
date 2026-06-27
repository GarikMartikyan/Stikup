import { randomBytes } from 'node:crypto';

import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import type { Channel } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';

import { BOT_SENDER, type BotSender } from '../auth/channel/bot-sender';
import { TelegramStickerService } from '../auth/channel/telegram-sticker.service';
import { offerConfig } from '../config/offer.config';
import { storageConfig } from '../config/storage.config';
import { getPackStickerFiles } from '../pack/sticker-assets';
import { PrismaService } from '../prisma/prisma.service';
import { resolveLang } from '../telegram/telegram-i18n';

const REFERRAL_CODE_BYTES = 6; // 6 bytes → 8 base62 chars
const PENDING_REFERRAL_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

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
    @Inject(BOT_SENDER) private readonly botSender: BotSender,
    private readonly telegramStickerService: TelegramStickerService,
    @Inject(storageConfig.KEY)
    private readonly storage: ConfigType<typeof storageConfig>,
    private readonly i18n: I18nService,
  ) {}

  async getOrCreateReferralInfo(userId: string): Promise<{
    code: string;
    referredCount: number;
  }> {
    let user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { referralCode: true },
    });

    if (!user.referralCode) {
      const code = await this.generateUniqueCode();
      user = await this.prisma.user.update({
        where: { id: userId },
        data: { referralCode: code },
        select: { referralCode: true },
      });
    }

    const code = user.referralCode!;
    const referredCount = await this.prisma.referral.count({
      where: { referrerId: userId },
    });

    return {
      code,
      referredCount,
    };
  }

  /**
   * Attribute a new registration to a referrer identified by `code`.
   * If `packId` is provided and referralUnlockEnabled, unlocks that specific
   * pack for the referrer (per-pack model).
   * This method is best-effort: it never throws so it cannot break registration.
   */
  async attribute(
    referredUserId: string,
    code: string | null | undefined,
    channel: Channel,
    packId?: string | null,
  ): Promise<void> {
    if (!code) return;

    try {
      const referrer = await this.prisma.user.findUnique({
        where: { referralCode: code },
        select: { id: true },
      });

      if (!referrer || referrer.id === referredUserId) return;

      await this.prisma.referral.create({
        data: {
          referrerId: referrer.id,
          referredUserId,
          channel,
        },
      });

      if (this.offer.referralUnlockEnabled && packId) {
        const pack = await this.prisma.pack.findUnique({
          where: { id: packId },
          select: {
            id: true,
            userId: true,
            unlockedAt: true,
            telegramStickerSetName: true,
            telegramStickerCount: true,
          },
        });

        if (pack && pack.userId === referrer.id && pack.unlockedAt == null) {
          await this.prisma.pack.update({
            where: { id: packId },
            data: { unlockedAt: new Date() },
          });

          // Best-effort: notify the referrer via Telegram if they have an
          // identity, and deliver the full sticker set now that the pack is unlocked.
          const tgIdentity = await this.prisma.channelIdentity.findFirst({
            where: { userId: referrer.id, channel: 'telegram' },
            select: { channelUserId: true, username: true, languageCode: true },
          });

          if (tgIdentity) {
            const lang = resolveLang(tgIdentity.languageCode ?? undefined);
            const message = this.i18n.t('telegram.referral.unlocked', {
              lang,
            });
            const packSize = this.offer.packSize;
            const usernameOrFallback =
              tgIdentity.username ?? `user${tgIdentity.channelUserId}`;

            const files = getPackStickerFiles(
              this.storage.stickerDir,
              pack.id,
              packSize,
            );

            let shareUrl: string | undefined;

            if (files.length === 0) {
              this.logger.warn(
                `referral top-up: real stickers unavailable for pack ${pack.id}; skipping`,
              );
            } else {
              try {
                const result = await this.telegramStickerService.ensureSet({
                  channelUserId: tgIdentity.channelUserId,
                  packId: pack.id,
                  usernameOrFallback,
                  files,
                });
                await this.prisma.pack.update({
                  where: { id: pack.id },
                  data: {
                    telegramStickerSetName: result.name,
                    telegramStickerCount: result.count,
                  },
                });
                shareUrl = result.shareUrl;
              } catch (topUpErr: unknown) {
                this.logger.warn(
                  `referral top-up: ensureSet failed for pack ${pack.id}: ${topUpErr instanceof Error ? topUpErr.message : String(topUpErr)}`,
                );
              }
            }

            const text = shareUrl
              ? message +
                '\n\n' +
                this.i18n.t('telegram.referral.your_pack', {
                  lang,
                }) +
                '\n' +
                shareUrl
              : message;

            this.botSender
              .sendMessage(tgIdentity.channelUserId, text)
              .catch((err: unknown) => {
                this.logger.warn(
                  `referral unlock notification failed for user ${referrer.id}: ${err instanceof Error ? err.message : String(err)}`,
                );
              });
          }
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

  /**
   * Record a pending referral for a Telegram user who arrived via the bot's
   * `/start ref_<CODE>_<PACKID>` deep link before registering.
   * Best-effort: never throws, so it cannot break the bot's /start handler.
   */
  async recordPending(
    channel: Channel,
    channelUserId: string,
    code: string,
    packId: string | null | undefined,
  ): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + PENDING_REFERRAL_TTL_MS);
      await this.prisma.pendingReferral.upsert({
        where: { channel_channelUserId: { channel, channelUserId } },
        create: {
          channel,
          channelUserId,
          code,
          packId: packId ?? null,
          expiresAt,
        },
        update: { code, packId: packId ?? null, expiresAt },
      });
    } catch (err) {
      this.logger.warn(
        `recordPending failed for channel=${channel} channelUserId=${channelUserId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * Atomically delete and return the pending referral for the given identity.
   * Returns null when absent (P2025) or when the row has already expired.
   * Best-effort: never throws.
   */
  async consumePending(
    channel: Channel,
    channelUserId: string,
  ): Promise<{ code: string; packId: string | null } | null> {
    try {
      const row = await this.prisma.pendingReferral.delete({
        where: { channel_channelUserId: { channel, channelUserId } },
      });
      // Treat expired rows as absent — they were cleaned up, but stale.
      if (row.expiresAt < new Date()) {
        return null;
      }
      return { code: row.code, packId: row.packId };
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2025'
      ) {
        return null;
      }
      this.logger.warn(
        `consumePending failed for channel=${channel} channelUserId=${channelUserId}: ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
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
