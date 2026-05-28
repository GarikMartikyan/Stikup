import { forwardRef, Module } from '@nestjs/common';

import { TelegramModule } from '../telegram/telegram.module';
import { AuthController } from './auth.controller';
import { BOT_SENDER } from './channel/bot-sender';
import { EmailAdapter } from './channel/email-adapter';
import { GoogleAdapter } from './channel/google-adapter';
import { TelegramAdapter } from './channel/telegram-adapter';
import { TelegramBotSender } from './channel/telegram-bot-sender';
import { IdentityService } from './identity.service';
import { SessionService } from './session.service';
import { TokenService } from './token.service';

@Module({
  imports: [forwardRef(() => TelegramModule)],
  controllers: [AuthController],
  providers: [
    TelegramAdapter,
    EmailAdapter,
    GoogleAdapter,
    IdentityService,
    TokenService,
    SessionService,
    { provide: BOT_SENDER, useClass: TelegramBotSender },
  ],
  exports: [
    TelegramAdapter,
    EmailAdapter,
    GoogleAdapter,
    IdentityService,
    TokenService,
    SessionService,
    BOT_SENDER,
  ],
})
export class AuthModule {}
