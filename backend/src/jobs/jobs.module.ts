import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { AdminModule } from '../admin/admin.module';
import { AuthCleanupService } from './auth-cleanup.service';
import { HealthWatchdogService } from './health-watchdog.service';
import { PackReaperService } from './pack-reaper.service';

@Module({
  imports: [ScheduleModule.forRoot(), AdminModule],
  providers: [AuthCleanupService, PackReaperService, HealthWatchdogService],
})
export class JobsModule {}
