import { randomBytes } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import type { Channel } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const SESSION_BYTES = 32;

export interface SessionUser {
  userId: string;
}

export interface UserProfile {
  userId: string;
  email: string | null;
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
      select: { id: true, email: true },
    });
    if (!user) return null;
    return { userId: user.id, email: user.email };
  }

  async revoke(sid: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sid, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
