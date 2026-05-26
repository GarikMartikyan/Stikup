import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { TelegramAdapter } from './channel/telegram-adapter';
import { IdentityService } from './identity.service';
import { SessionService } from './session.service';
import { TokenService } from './token.service';

@Module({
  controllers: [AuthController],
  providers: [TelegramAdapter, IdentityService, TokenService, SessionService],
  exports: [TelegramAdapter, IdentityService, TokenService, SessionService],
})
export class AuthModule {}
