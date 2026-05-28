import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';

import { PrismaService } from '../../prisma/prisma.service';
import type { ChannelEvent } from './channel-event';

@Injectable()
export class EmailAdapter {
  constructor(private readonly prisma: PrismaService) {}

  async register(email: string, password: string): Promise<{ userId: string }> {
    const normalised = email.toLowerCase();

    const existing = await this.prisma.user.findUnique({
      where: { email: normalised },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await argon2.hash(password);

    const user = await this.prisma.user.create({
      data: {
        email: normalised,
        passwordHash,
        identities: {
          create: {
            channel: 'email',
            channelUserId: normalised,
            displayName: normalised.split('@')[0],
          },
        },
      },
      select: { id: true },
    });

    return { userId: user.id };
  }

  async login(email: string, password: string): Promise<{ userId: string }> {
    const normalised = email.toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalised },
      select: { id: true, passwordHash: true },
    });

    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return { userId: user.id };
  }

  toChannelEvent(email: string): ChannelEvent {
    const normalised = email.toLowerCase();
    return {
      channel: 'email',
      channelUserId: normalised,
      profile: { displayName: normalised.split('@')[0] },
    };
  }
}
