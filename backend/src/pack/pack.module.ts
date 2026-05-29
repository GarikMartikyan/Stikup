import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PackController } from './pack.controller';
import { PackService } from './pack.service';

@Module({
  imports: [AuthModule],
  controllers: [PackController],
  providers: [PackService],
  exports: [PackService],
})
export class PackModule {}
