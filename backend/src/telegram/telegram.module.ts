import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { TelegramUpdate } from './telegram.update';

@Module({
  imports: [AuthModule],
  providers: [TelegramUpdate],
})
export class TelegramModule {}
