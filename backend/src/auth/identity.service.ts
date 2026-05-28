import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import type { ChannelEvent } from './channel/channel-event';

@Injectable()
export class IdentityService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveOrCreate(event: ChannelEvent): Promise<{ userId: string }> {
    const existing = await this.prisma.channelIdentity.findUnique({
      where: {
        channel_channelUserId: {
          channel: event.channel,
          channelUserId: event.channelUserId,
        },
      },
      select: { userId: true },
    });

    if (existing) {
      await this.prisma.channelIdentity.update({
        where: {
          channel_channelUserId: {
            channel: event.channel,
            channelUserId: event.channelUserId,
          },
        },
        data: {
          displayName: event.profile.displayName,
          username: event.profile.username,
          avatarUrl: event.profile.avatarUrl,
        },
      });
      return { userId: existing.userId };
    }

    const user = await this.prisma.user.create({
      data: {
        identities: {
          create: {
            channel: event.channel,
            channelUserId: event.channelUserId,
            displayName: event.profile.displayName,
            username: event.profile.username,
            avatarUrl: event.profile.avatarUrl,
          },
        },
      },
      select: { id: true },
    });

    return { userId: user.id };
  }
}
