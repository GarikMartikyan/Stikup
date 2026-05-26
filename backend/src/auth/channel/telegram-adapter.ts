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
      },
    };
  }
}
