import { forwardRef, Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { AdRewardController } from './ad-reward.controller';
import { AdRewardService } from './ad-reward.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [AdRewardController],
  providers: [AdRewardService],
})
export class AdRewardModule {}
