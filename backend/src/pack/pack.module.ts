import { forwardRef, Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { QueueModule } from '../queue/queue.module';
import { PackController } from './pack.controller';
import { PackService } from './pack.service';

@Module({
  // forwardRef: TelegramModule now imports PackModule, which closes a module
  // load cycle (AuthModule -> TelegramModule -> PackModule -> AuthModule).
  imports: [forwardRef(() => AuthModule), QueueModule],
  controllers: [PackController],
  providers: [PackService],
  exports: [PackService],
})
export class PackModule {}
