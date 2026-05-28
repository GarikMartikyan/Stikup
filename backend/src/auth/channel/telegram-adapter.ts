import { Injectable } from '@nestjs/common';
import type { Context } from 'telegraf';

import type { ChannelEvent } from './channel-event';

@Injectable()
export class TelegramAdapter {
  fromContext(ctx: Context): ChannelEvent | null {
    const from = ctx.from;
    if (!from) return null;

    const displayName = [from.first_name, from.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();

    return {
      channel: 'telegram',
      channelUserId: String(from.id),
      profile: {
        displayName: displayName || undefined,
        username: from.username,
        // Telegram avatar URLs embed the bot token and expire after ~1h, so we
        // can't safely persist them as-is. Wire this through a backend image
        // proxy (resolve file_id → fresh URL on demand) before populating.
        avatarUrl: undefined,
      },
    };
  }
}
