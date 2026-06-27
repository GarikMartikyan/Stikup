import { forwardRef, Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PackModule } from '../pack/pack.module';
import { QueueModule } from '../queue/queue.module';
import { ReferralModule } from '../referral/referral.module';
import { TelegramAvatarController } from './telegram-avatar.controller';
import { TelegramMessageService } from './telegram-message.service';
import { TelegramUpdate } from './telegram.update';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => PackModule),
    forwardRef(() => ReferralModule),
    QueueModule,
  ],
  controllers: [TelegramAvatarController],
  providers: [TelegramUpdate, TelegramMessageService],
  exports: [TelegramMessageService],
})
export class TelegramModule {}
