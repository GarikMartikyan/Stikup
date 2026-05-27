import { registerAs } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { IsNotEmpty, IsString, validateSync } from 'class-validator';

export class TelegramConfigSchema {
  @IsString()
  @IsNotEmpty()
  botToken!: string;
}

export const telegramConfig = registerAs(
  'telegram',
  (): TelegramConfigSchema => {
    const raw = {
      botToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
    };

    const instance = plainToInstance(TelegramConfigSchema, raw);
    const errors = validateSync(instance, { whitelist: true });
    if (errors.length) {
      throw new Error(
        'Invalid TELEGRAM config:\n' +
          errors.map((e) => e.toString()).join('\n'),
      );
    }
    return instance;
  },
);
