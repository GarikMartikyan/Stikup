import { UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

import type { SessionService } from '../../auth/session.service';
import type { AdRewardService } from '../ad-reward.service';
import { AdRewardController } from '../ad-reward.controller';

function buildController(resolveResult: { userId: string } | null) {
  const sessions = {
    resolve: jest.fn().mockResolvedValue(resolveResult),
  } as unknown as jest.Mocked<SessionService>;
  const adRewards = {
    grantAdReward: jest.fn().mockResolvedValue({ regensLeft: 1 }),
  } as unknown as jest.Mocked<AdRewardService>;
  const controller = new AdRewardController(sessions, adRewards, {
    cookieName: 'sid',
  } as never);
  return { controller, sessions, adRewards };
}

function reqWithCookie(sid?: string): Request {
  return { cookies: sid ? { sid } : {} } as unknown as Request;
}

describe('AdRewardController.reward', () => {
  it('throws Unauthorized without a session', async () => {
    const { controller } = buildController(null);
    await expect(controller.reward(reqWithCookie())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('grants the reward and returns regensLeft for a valid session', async () => {
    const { controller, adRewards } = buildController({ userId: 'user-1' });
    const result = await controller.reward(reqWithCookie('sid-token'));
    expect(adRewards.grantAdReward).toHaveBeenCalledWith('user-1');
    expect(result).toEqual({ regensLeft: 1 });
  });
});
