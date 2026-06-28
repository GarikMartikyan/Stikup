import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { InjectBot } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';

import { telegramConfig } from '../config/telegram.config';

interface AlertOptions {
  dedupeKey?: string;
  cooldownMs?: number;
}

@Injectable()
export class AdminAlertService {
  private readonly logger = new Logger(AdminAlertService.name);
  private readonly cooldowns = new Map<string, number>();

  // Dedupe keys are normalised (route patterns / fixed strings) so cardinality
  // is naturally small, but cap the map regardless so no key source can ever
  // leak memory over the process lifetime.
  private static readonly MAX_COOLDOWN_ENTRIES = 1000;

  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    @Inject(telegramConfig.KEY)
    private readonly tg: ConfigType<typeof telegramConfig>,
  ) {}

  get enabled(): boolean {
    return this.tg.adminChatId != null;
  }

  async alert(text: string, opts?: AlertOptions): Promise<void> {
    if (!this.enabled) return;

    if (opts?.dedupeKey) {
      const now = Date.now();
      const last = this.cooldowns.get(opts.dedupeKey);
      const cooldownMs = opts.cooldownMs ?? 5 * 60 * 1000;
      if (last !== undefined && now - last < cooldownMs) return;
      this.rememberCooldown(opts.dedupeKey, now);
    }

    try {
      await this.bot.telegram.sendMessage(
        this.tg.adminChatId!,
        '\u{1F6A8} ' + text,
      );
    } catch (err) {
      this.logger.warn(
        `Failed to send admin alert: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async info(text: string): Promise<void> {
    if (!this.enabled) return;

    try {
      await this.bot.telegram.sendMessage(this.tg.adminChatId!, 'ℹ️ ' + text);
    } catch (err) {
      this.logger.warn(
        `Failed to send admin info: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * Record a cooldown timestamp, evicting the oldest entries once the map
   * exceeds its cap. A Map preserves insertion order, so iterating its keys
   * yields oldest-first.
   */
  private rememberCooldown(key: string, now: number): void {
    this.cooldowns.set(key, now);
    if (this.cooldowns.size <= AdminAlertService.MAX_COOLDOWN_ENTRIES) return;
    const overflow =
      this.cooldowns.size - AdminAlertService.MAX_COOLDOWN_ENTRIES;
    let removed = 0;
    for (const k of this.cooldowns.keys()) {
      this.cooldowns.delete(k);
      if (++removed >= overflow) break;
    }
  }
}
