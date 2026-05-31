import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { InjectBot } from 'nestjs-telegraf';
import { Context, Input, Telegraf } from 'telegraf';

import { offerConfig } from '../../config/offer.config';

const MAX_SET_NAME_LENGTH = 64;
const MAX_TITLE_LENGTH = 64;

export interface EnsureSetResult {
  name: string;
  shareUrl: string;
  count: number;
}

@Injectable()
export class TelegramStickerService {
  private readonly logger = new Logger(TelegramStickerService.name);
  private cachedBotUsername: string | null = null;

  /**
   * Per-set-name promise chain to serialize concurrent ensureSet calls for the
   * same sticker set. Keyed by the derived set name so separate packs are
   * independent. Prevents TOCTOU duplicate-create / double-append races.
   */
  private readonly chains = new Map<string, Promise<unknown>>();

  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    @Inject(offerConfig.KEY)
    private readonly offer: ConfigType<typeof offerConfig>,
  ) {}

  /**
   * Build the Telegram sticker-set short name for a given pack.
   * Format: p<packIdHex>_by_<botUsername>
   * Guaranteed to start with 'p', contain only [a-z0-9_], have no consecutive
   * underscores, and be ≤64 chars. The suffix `_by_<botUsername>` is always
   * preserved; the hex portion is clamped when necessary.
   */
  buildSetName(packId: string, botUsername: string): string {
    const hex = packId.replace(/-/g, '').toLowerCase();
    const suffix = `_by_${botUsername.toLowerCase()}`;
    // Reserve 1 char for the leading 'p'; clamp the hex so the suffix always survives.
    const maxHexLen = Math.max(
      0,
      MAX_SET_NAME_LENGTH - 1 /* 'p' */ - suffix.length,
    );
    return `p${hex.slice(0, maxHexLen)}${suffix}`;
  }

  /**
   * Build the visible title of the sticker set.
   * Format: "<usernameOrFallback> by @<botUsername>", clamped to 64 chars.
   */
  buildTitle(usernameOrFallback: string, botUsername: string): string {
    const full = `${usernameOrFallback} by @${botUsername}`;
    return full.slice(0, MAX_TITLE_LENGTH);
  }

  /** Shareable t.me link for a sticker set by name. */
  shareUrl(setName: string): string {
    return `https://t.me/addstickers/${setName}`;
  }

  /**
   * Resolve the bot's own username (cached after first successful call).
   * Exposed so callers that need it separately (e.g. to build a title before
   * calling ensureSet) do not have to duplicate the getMe call.
   */
  async getBotUsername(): Promise<string> {
    if (this.cachedBotUsername) return this.cachedBotUsername;
    const me = await this.bot.telegram.getMe();
    if (!me.username) {
      throw new Error('Telegram bot has no username configured');
    }
    this.cachedBotUsername = me.username;
    return me.username;
  }

  /**
   * Create the sticker set if it does not exist, or append missing stickers if
   * it already exists but has fewer stickers than `files.length`.
   *
   * Calls for the same derived set name are serialized via an in-process
   * promise chain to prevent TOCTOU duplicate-create / double-append races.
   *
   * @param channelUserId  Telegram user ID (string form) who owns the set.
   * @param packId         Pack UUID — used to derive the set name.
   * @param usernameOrFallback  Display name for the set title (e.g. "@alice" or "user123456").
   * @param files          Full ordered list of local file paths that should be
   *                       in the set (indexes 0..N-1). ensureSet appends only
   *                       the range [existingCount..N-1]. Must be a dense list
   *                       of exactly the desired final count.
   * @returns name, shareUrl and resulting sticker count.
   */
  async ensureSet(params: {
    channelUserId: string;
    packId: string;
    usernameOrFallback: string;
    files: string[];
  }): Promise<EnsureSetResult> {
    const { channelUserId, packId, usernameOrFallback, files } = params;

    const botUsername = await this.getBotUsername();
    const name = this.buildSetName(packId, botUsername);

    return this.runExclusive(name, () =>
      this.doEnsureSet(name, channelUserId, usernameOrFallback, files),
    );
  }

  private runExclusive<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const prev = this.chains.get(key) ?? Promise.resolve();
    const next = prev.catch(() => {}).then(fn);
    // The chain entry must never produce an unhandled rejection — store a
    // catch-suppressed version so Node does not fire the unhandledRejection
    // event between when `next` is created and when the caller attaches its
    // own handler. `next` itself is still returned unmodified so the caller
    // gets the real rejection.
    const chainEntry = next.catch(() => {});
    this.chains.set(key, chainEntry);
    void chainEntry.finally(() => {
      if (this.chains.get(key) === chainEntry) this.chains.delete(key);
    });
    return next;
  }

  private async doEnsureSet(
    name: string,
    channelUserId: string,
    usernameOrFallback: string,
    files: string[],
  ): Promise<EnsureSetResult> {
    const ownerId = Number(channelUserId);
    const botUsername = await this.getBotUsername();
    const title = this.buildTitle(usernameOrFallback, botUsername);

    // Determine how many stickers are already in the set (k).
    let existingCount = 0;
    let setExists = false;
    try {
      const existing = await this.bot.telegram.getStickerSet(name);
      existingCount = existing.stickers.length;
      setExists = true;
      this.logger.log(
        `sticker set "${name}" found with ${existingCount} stickers`,
      );
    } catch (err: unknown) {
      if (!isStickerSetNotFound(err)) {
        // Real Telegram error — bubble up so the caller can roll back.
        throw err;
      }
      // Set does not exist yet — we will create it below.
      this.logger.log(`sticker set "${name}" not found, will create`);
    }

    if (setExists && existingCount >= files.length) {
      // Already fully populated (or over-populated) — no-op.
      this.logger.log(
        `sticker set "${name}" already has ${existingCount}/${files.length} stickers, skipping`,
      );
      return { name, shareUrl: this.shareUrl(name), count: existingCount };
    }

    const defaultEmoji = this.offer.stickerDefaultEmoji;

    if (!setExists) {
      // Upload all files, then create the set in one call.
      const fileIds = await this.uploadFiles(ownerId, files);
      await this.bot.telegram.createNewStickerSet(ownerId, name, title, {
        stickers: fileIds.map((id) => ({
          sticker: id,
          emoji_list: [defaultEmoji],
        })),
        sticker_format: 'static',
        sticker_type: 'regular',
      });
      this.logger.log(
        `created sticker set "${name}" with ${fileIds.length} stickers`,
      );
    } else {
      // Append only the missing tail [existingCount..files.length-1].
      const missingFiles = files.slice(existingCount);
      const fileIds = await this.uploadFiles(ownerId, missingFiles);
      for (const id of fileIds) {
        await this.bot.telegram.addStickerToSet(ownerId, name, {
          sticker: { sticker: id, emoji_list: [defaultEmoji] },
        });
      }
      this.logger.log(
        `appended ${fileIds.length} stickers to set "${name}" (now ${files.length} total)`,
      );
    }

    return { name, shareUrl: this.shareUrl(name), count: files.length };
  }

  private async uploadFiles(
    ownerId: number,
    filePaths: string[],
  ): Promise<string[]> {
    const fileIds: string[] = [];
    for (const filePath of filePaths) {
      const file = await this.bot.telegram.uploadStickerFile(
        ownerId,
        Input.fromLocalFile(filePath),
        'static',
      );
      fileIds.push(file.file_id);
    }
    return fileIds;
  }
}

/**
 * Distinguish "sticker set not found" (400 Bad Request / STICKERSET_INVALID)
 * from real Telegram errors so we treat not-found as a create signal.
 */
function isStickerSetNotFound(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as Record<string, unknown>;
  // Telegraf surfaces Telegram errors as { code: 400, description: '...' }
  if (e['code'] !== 400) return false;
  const description =
    typeof e['description'] === 'string' ? e['description'] : '';
  return (
    description.includes('STICKERSET_INVALID') ||
    description.toLowerCase().includes('not found')
  );
}
