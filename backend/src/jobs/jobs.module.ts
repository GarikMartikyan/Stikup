import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthCleanupService } from './auth-cleanup.service';
import { PackReaperService } from './pack-reaper.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [AuthCleanupService, PackReaperService],
})
export class JobsModule {}
