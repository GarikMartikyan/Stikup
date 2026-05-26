import { randomBytes } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import type { Channel } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

const TOKEN_TTL_MS = 5 * 60 * 1000;
const TOKEN_BYTES = 32;

export interface ConsumedToken {
  userId: string;
  issuedVia: Channel;
}

@Injectable()
export class TokenService {
  constructor(private readonly prisma: PrismaService) {}

  async mint(userId: string, issuedVia: Channel): Promise<string> {
    const token = randomBytes(TOKEN_BYTES).toString('base64url');
    await this.prisma.loginToken.create({
      data: {
        token,
        userId,
        issuedVia,
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    });
    return token;
  }

  async consume(token: string): Promise<ConsumedToken | null> {
    const rows = await this.prisma.$queryRaw<
      Array<{ user_id: string; issued_via: Channel }>
    >`
      UPDATE login_tokens
         SET consumed_at = NOW()
       WHERE token = ${token}
         AND consumed_at IS NULL
         AND expires_at > NOW()
      RETURNING user_id, issued_via
    `;

    if (rows.length === 0) return null;
    return { userId: rows[0].user_id, issuedVia: rows[0].issued_via };
  }
}
