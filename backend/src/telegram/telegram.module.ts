import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { ImageProcessingModule } from '../image-processing/image-processing.module';
import { TelegramUpdate } from './telegram.update';

@Module({
  imports: [AuthModule, ImageProcessingModule],
  providers: [TelegramUpdate],
})
export class TelegramModule {}
