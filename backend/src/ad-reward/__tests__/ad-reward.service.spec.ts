import { PrismaService } from '../../prisma/prisma.service';
import { AdRewardService } from '../ad-reward.service';

const OFFER_STUB = {
  baseGenerations: 2,
  referralBonusGenerations: 2,
  unlimitedGenerations: false,
};

function buildPrismaMock() {
  return {
    user: { findUnique: jest.fn() },
    referral: { count: jest.fn().mockResolvedValue(0) },
    adReward: {
      create: jest.fn().mockResolvedValue({}),
      count: jest.fn().mockResolvedValue(0),
    },
  } as unknown as jest.Mocked<PrismaService>;
}

function buildService(
  prisma: jest.Mocked<PrismaService>,
  offer: {
    baseGenerations: number;
    referralBonusGenerations: number;
    unlimitedGenerations: boolean;
  },
) {
  return new AdRewardService(prisma, offer as any);
}

describe('AdRewardService.grantAdReward', () => {
  it('inserts a reward row and returns the new regensLeft', async () => {
    const prisma = buildPrismaMock();
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      generationsUsed: 2,
    });
    (prisma.referral.count as jest.Mock).mockResolvedValue(0);
    // After the insert, the ledger holds 1 row.
    (prisma.adReward.count as jest.Mock).mockResolvedValue(1);

    const service = buildService(prisma, {
      baseGenerations: 2,
      referralBonusGenerations: 2,
      unlimitedGenerations: false,
    });

    const result = await service.grantAdReward('user-1');

    expect(prisma.adReward.create).toHaveBeenCalledWith({
      data: { userId: 'user-1' },
    });
    // cap = 2 + 2*0 + 1 = 3; used 2 → regensLeft 1.
    expect(result).toEqual({ regensLeft: 1 });
  });

  it('does not insert a row when generations are unlimited', async () => {
    const prisma = buildPrismaMock();
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      generationsUsed: 5,
    });
    const service = buildService(prisma, {
      baseGenerations: 2,
      referralBonusGenerations: 2,
      unlimitedGenerations: true,
    });

    const result = await service.grantAdReward('user-1');

    expect(prisma.adReward.create).not.toHaveBeenCalled();
    expect(result.regensLeft).toBeGreaterThan(0);
  });
});

void OFFER_STUB;
