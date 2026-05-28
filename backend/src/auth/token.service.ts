import { randomBytes } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import type { Channel } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

const TOKEN_TTL_MS = 5 * 60 * 1000;
const LINK_TOKEN_TTL_MS = 10 * 60 * 1000;
const TOKEN_BYTES = 32;

export interface ConsumedToken {
  userId: string;
  issuedVia: Channel;
  telegramChatId?: bigint;
  telegramMessageId?: number;
  telegramUserMessageId?: number;
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
        purpose: 'login',
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    });
    return token;
  }

  async mintLink(userId: string): Promise<string> {
    const token = randomBytes(TOKEN_BYTES).toString('base64url');
    await this.prisma.loginToken.create({
      data: {
        token,
        userId,
        issuedVia: 'telegram',
        purpose: 'link',
        expiresAt: new Date(Date.now() + LINK_TOKEN_TTL_MS),
      },
    });
    return token;
  }

  async attachTelegramMessage(
    token: string,
    chatId: bigint,
    botMessageId: number,
    userMessageId: number | null,
  ): Promise<void> {
    await this.prisma.loginToken.update({
      where: { token },
      data: {
        telegramChatId: chatId,
        telegramMessageId: botMessageId,
        telegramUserMessageId: userMessageId,
      },
    });
  }

  async consume(token: string): Promise<ConsumedToken | null> {
    const rows = await this.prisma.$queryRaw<
      Array<{
        user_id: string;
        issued_via: Channel;
        telegram_chat_id: bigint | null;
        telegram_message_id: number | null;
        telegram_user_message_id: number | null;
      }>
    >`
      UPDATE login_tokens
         SET consumed_at = NOW()
       WHERE token = ${token}
         AND consumed_at IS NULL
         AND expires_at > NOW()
         AND purpose = 'login'
      RETURNING user_id, issued_via, telegram_chat_id, telegram_message_id, telegram_user_message_id
    `;

    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      userId: row.user_id,
      issuedVia: row.issued_via,
      ...(row.telegram_chat_id != null && {
        telegramChatId: row.telegram_chat_id,
      }),
      ...(row.telegram_message_id != null && {
        telegramMessageId: row.telegram_message_id,
      }),
      ...(row.telegram_user_message_id != null && {
        telegramUserMessageId: row.telegram_user_message_id,
      }),
    };
  }

  async consumeLink(token: string): Promise<{ userId: string } | null> {
    const rows = await this.prisma.$queryRaw<Array<{ user_id: string }>>`
      UPDATE login_tokens
         SET consumed_at = NOW()
       WHERE token = ${token}
         AND consumed_at IS NULL
         AND expires_at > NOW()
         AND purpose = 'link'
      RETURNING user_id
    `;

    if (rows.length === 0) return null;
    return { userId: rows[0].user_id };
  }
}
