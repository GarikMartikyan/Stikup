import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { QueueModule } from '../queue/queue.module';
import { TelegramUpdate } from './telegram.update';

@Module({
  imports: [AuthModule, QueueModule],
  providers: [TelegramUpdate],
})
export class TelegramModule {}
