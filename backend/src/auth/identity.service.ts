import { ConflictException, Injectable } from '@nestjs/common';
import type { Channel } from '@prisma/client';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import type { ChannelEvent } from './channel/channel-event';

@Injectable()
export class IdentityService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveOrCreate(
    event: ChannelEvent,
  ): Promise<{ userId: string; created: boolean }> {
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
      return { userId: existing.userId, created: false };
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

    return { userId: user.id, created: true };
  }

  async linkChannel(
    userId: string,
    event: ChannelEvent,
  ): Promise<{ status: 'linked' | 'already' }> {
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
      if (existing.userId !== userId) {
        throw new ConflictException('channel_taken');
      }
      // Same user — refresh profile fields and return idempotent status.
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
      return { status: 'already' };
    }

    try {
      await this.prisma.channelIdentity.create({
        data: {
          userId,
          channel: event.channel,
          channelUserId: event.channelUserId,
          displayName: event.profile.displayName,
          username: event.profile.username,
          avatarUrl: event.profile.avatarUrl,
        },
      });
    } catch (err) {
      // Two concurrent link requests for the same channel identity can both
      // pass the findUnique check above and race to create. The unique
      // constraint on (channel, channelUserId) lets only one win; surface the
      // loser as the same conflict-reject the sequential path returns rather
      // than leaking a raw 500.
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('channel_taken');
      }
      throw err;
    }
    return { status: 'linked' };
  }

  async unlinkChannel(userId: string, channel: Channel): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Lock the owning user row so two concurrent unlink requests for the same
      // user serialize. Without this, requests to remove two different channels
      // could both read identities.length === 2, both pass the guard below, and
      // both delete — leaving the account with zero login methods.
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;

      const identities = await tx.channelIdentity.findMany({
        where: { userId },
        select: { id: true, channel: true },
      });

      const target = identities.find((i) => i.channel === channel);
      if (!target) {
        // The channel isn't linked — DELETE is idempotent, so this is a no-op
        // regardless of how many other identities exist. Checked before the
        // last-login-method guard so removing an absent channel never reports a
        // misleading "last login method" conflict.
        return;
      }

      if (identities.length <= 1) {
        throw new ConflictException('last_login_method');
      }

      await tx.channelIdentity.deleteMany({
        where: { userId, channel },
      });
    });
  }
}
