import { forwardRef, Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { QueueModule } from '../queue/queue.module';
import { TelegramMessageService } from './telegram-message.service';
import { TelegramUpdate } from './telegram.update';

@Module({
  imports: [forwardRef(() => AuthModule), QueueModule],
  providers: [TelegramUpdate, TelegramMessageService],
  exports: [TelegramMessageService],
})
export class TelegramModule {}
