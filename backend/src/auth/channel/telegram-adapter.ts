import { Injectable } from '@nestjs/common';
import type { Context } from 'telegraf';

import type { ChannelEvent } from './channel-event';

@Injectable()
export class TelegramAdapter {
  async fromContext(ctx: Context): Promise<ChannelEvent | null> {
    const from = ctx.from;
    if (!from) return null;

    const displayName = [from.first_name, from.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();

    let avatarUrl: string | undefined;
    try {
      const photos = await ctx.telegram.getUserProfilePhotos(from.id, 0, 1);
      if (photos.total_count > 0) {
        avatarUrl = `/api/telegram/avatar/${String(from.id)}`;
      }
    } catch {
      // Treat any failure to fetch profile photos as no photo available.
    }

    return {
      channel: 'telegram',
      channelUserId: String(from.id),
      profile: {
        displayName: displayName || undefined,
        username: from.username,
        avatarUrl,
      },
    };
  }
}
