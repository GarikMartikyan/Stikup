import { Module } from '@nestjs/common';

import { AdminAlertService } from './admin-alert.service';
import { AdminLifecycleService } from './admin-lifecycle.service';
import { AdminStatsService } from './admin-stats.service';
import { AdminUpdate } from './admin.update';

@Module({
  providers: [
    AdminAlertService,
    AdminStatsService,
    AdminUpdate,
    AdminLifecycleService,
  ],
  exports: [AdminAlertService],
})
export class AdminModule {}
