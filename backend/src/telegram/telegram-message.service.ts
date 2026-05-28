import { Injectable } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';

@Injectable()
export class TelegramMessageService {
  constructor(@InjectBot() private readonly bot: Telegraf<Context>) {}

  async deleteMessage(chatId: bigint, messageId: number): Promise<void> {
    await this.bot.telegram.deleteMessage(chatId.toString(), messageId);
  }

  async deleteMessages(
    chatId: bigint,
    messageIds: Array<number | null | undefined>,
  ): Promise<void> {
    await Promise.all(
      messageIds
        .filter((id): id is number => id != null)
        .map((id) =>
          this.bot.telegram
            .deleteMessage(chatId.toString(), id)
            .catch(() => {}),
        ),
    );
  }
}
