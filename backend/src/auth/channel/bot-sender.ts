import type { Channel } from '@prisma/client';

export interface BotSender {
  readonly channel: Channel;
  /** Send a sticker by local file path to the channel user identified by channelUserId. */
  sendSticker(channelUserId: string, filePath: string): Promise<void>;
  /** Best-effort outbound URL of the bot landing page (e.g. https://t.me/<bot_username>). */
  getBotUrl(): Promise<string>;
}

export const BOT_SENDER = Symbol('BOT_SENDER');
