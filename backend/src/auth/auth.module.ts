import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { BOT_SENDER } from './channel/bot-sender';
import { TelegramAdapter } from './channel/telegram-adapter';
import { TelegramBotSender } from './channel/telegram-bot-sender';
import { IdentityService } from './identity.service';
import { SessionService } from './session.service';
import { TokenService } from './token.service';

@Module({
  controllers: [AuthController],
  providers: [
    TelegramAdapter,
    IdentityService,
    TokenService,
    SessionService,
    { provide: BOT_SENDER, useClass: TelegramBotSender },
  ],
  exports: [
    TelegramAdapter,
    IdentityService,
    TokenService,
    SessionService,
    BOT_SENDER,
  ],
})
export class AuthModule {}
