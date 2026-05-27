import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthCleanupService } from './auth-cleanup.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [AuthCleanupService],
})
export class JobsModule {}
