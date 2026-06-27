import { forwardRef, Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { QueueModule } from '../queue/queue.module';
import { PackController } from './pack.controller';
import { PackService } from './pack.service';
import { StickerFileController } from './sticker-file.controller';

@Module({
  // forwardRef: TelegramModule now imports PackModule, which closes a module
  // load cycle (AuthModule -> TelegramModule -> PackModule -> AuthModule).
  imports: [forwardRef(() => AuthModule), QueueModule],
  controllers: [PackController, StickerFileController],
  providers: [PackService],
  exports: [PackService],
})
export class PackModule {}
