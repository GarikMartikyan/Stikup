import {
  BeforeApplicationShutdown,
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';

import { appConfig } from '../config/app.config';
import { AdminAlertService } from './admin-alert.service';

@Injectable()
export class AdminLifecycleService
  implements OnApplicationBootstrap, BeforeApplicationShutdown
{
  private readonly logger = new Logger(AdminLifecycleService.name);

  constructor(
    private readonly alert: AdminAlertService,
    @Inject(appConfig.KEY)
    private readonly appCfg: ConfigType<typeof appConfig>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.alert.info('backend is up (env=' + this.appCfg.appEnv + ')');
    } catch (err) {
      this.logger.warn(
        `Bootstrap alert failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async beforeApplicationShutdown(signal?: string): Promise<void> {
    try {
      await this.alert.info(
        'backend shutting down' + (signal ? ' (' + signal + ')' : ''),
      );
    } catch (err) {
      this.logger.warn(
        `Shutdown alert failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
