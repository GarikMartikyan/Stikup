import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Command, Ctx, InjectBot, Update } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';

import { telegramConfig } from '../config/telegram.config';
import { AdminStatsService } from './admin-stats.service';

@Update()
@Injectable()
export class AdminUpdate implements OnModuleInit {
  private readonly logger = new Logger(AdminUpdate.name);

  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    @Inject(telegramConfig.KEY)
    private readonly tg: ConfigType<typeof telegramConfig>,
    private readonly stats: AdminStatsService,
  ) {}

  private isAdmin(ctx: Context): boolean {
    const id = ctx.from?.id;
    return (
      id != null &&
      this.tg.adminChatId != null &&
      String(id) === String(this.tg.adminChatId)
    );
  }

  @Command('userscount')
  async onUsersCount(@Ctx() ctx: Context): Promise<void> {
    if (!this.isAdmin(ctx)) return;

    try {
      const s = await this.stats.getUserStats();
      const text =
        `\u{1F465} Users: ${s.totalUsers} total (+${s.newToday} today)\n` +
        `• Telegram: ${s.byChannel.telegram}\n` +
        `• Google: ${s.byChannel.google}\n` +
        `• Email: ${s.byChannel.email}\n` +
        `• WhatsApp: ${s.byChannel.whatsapp}\n` +
        `\n` +
        `\u{1F4E6} Packs: ${s.packsByStatus.ready} ready · ${s.packsByStatus.failed} failed · ${s.packsByStatus.generating} generating`;
      await ctx.reply(text);
    } catch (err) {
      this.logger.error(
        `/userscount failed: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err.stack : undefined,
      );
      await ctx.reply('Failed to fetch stats. Check backend logs.');
    }
  }

  async onModuleInit(): Promise<void> {
    if (this.tg.adminChatId == null) return;

    try {
      await this.bot.telegram.setMyCommands(
        [
          { command: 'userscount', description: 'Registered users count' },
          { command: 'receive', description: 'Get my sticker packs' },
        ],
        { scope: { type: 'chat', chat_id: this.tg.adminChatId } },
      );
    } catch (err) {
      this.logger.warn(
        `setMyCommands for admin chat failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
