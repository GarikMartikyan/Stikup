import { randomBytes } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import type { Channel } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const SESSION_BYTES = 32;

export interface SessionUser {
  userId: string;
}

export interface ChannelSummary {
  channel: Channel;
  username: string | null;
  displayName: string | null;
}

export interface UserProfile {
  userId: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  channels: ChannelSummary[];
}

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async issue(
    userId: string,
    issuedVia: Channel,
  ): Promise<{ sid: string; expiresAt: Date }> {
    const sid = randomBytes(SESSION_BYTES).toString('base64url');
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await this.prisma.session.create({
      data: { id: sid, userId, issuedVia, expiresAt },
    });
    return { sid, expiresAt };
  }

  async resolve(sid: string | undefined): Promise<SessionUser | null> {
    if (!sid) return null;
    const session = await this.prisma.session.findUnique({
      where: { id: sid },
      select: { userId: true, expiresAt: true, revokedAt: true },
    });
    if (!session) return null;
    if (session.revokedAt) return null;
    if (session.expiresAt.getTime() <= Date.now()) return null;
    return { userId: session.userId };
  }

  async findUser(userId: string): Promise<UserProfile | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        identities: {
          select: {
            displayName: true,
            avatarUrl: true,
            channel: true,
            username: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!user) return null;
    // Prefer the most-recently-linked identity that actually carries each
    // field. A later, richer identity (e.g. Google with name + avatar) should
    // win over an earlier bare one (e.g. email signup, or Telegram which has
    // no avatar) instead of being shadowed by whichever was created first.
    const identitiesNewestFirst = [...user.identities].reverse();
    const displayName =
      identitiesNewestFirst.find((i) => i.displayName)?.displayName ?? null;
    const avatarUrl =
      identitiesNewestFirst.find((i) => i.avatarUrl)?.avatarUrl ?? null;
    const channels: ChannelSummary[] = user.identities.map((i) => ({
      channel: i.channel,
      username: i.username ?? null,
      displayName: i.displayName ?? null,
    }));
    return {
      userId: user.id,
      email: user.email,
      displayName,
      avatarUrl,
      channels,
    };
  }

  async revoke(sid: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sid, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async deleteUser(userId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.packClaim.deleteMany({ where: { userId } }),
      this.prisma.user.delete({ where: { id: userId } }),
    ]);
  }
}
