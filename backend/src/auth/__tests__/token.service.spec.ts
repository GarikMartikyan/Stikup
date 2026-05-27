import { Channel } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { TokenService } from '../token.service';

function buildPrismaMock() {
  return {
    loginToken: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    channelIdentity: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: { create: jest.fn() },
    $queryRaw: jest.fn(),
  } as unknown as jest.Mocked<PrismaService>;
}

describe('TokenService', () => {
  const FIVE_MIN_MS = 5 * 60 * 1000;

  describe('mint', () => {
    it('returns a base64url string of the expected length and writes a row', async () => {
      const prisma = buildPrismaMock();
      const service = new TokenService(prisma);

      const before = Date.now();
      const token = await service.mint('user-1', Channel.telegram);
      const after = Date.now();

      expect(typeof token).toBe('string');
      // 32 bytes -> base64url length = ceil(32/3)*4 = 44 minus padding; base64url has no padding -> 43 chars
      expect(token).toHaveLength(43);
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);

      expect(prisma.loginToken.create).toHaveBeenCalledTimes(1);
      const arg = (prisma.loginToken.create as jest.Mock).mock.calls[0][0];
      expect(arg.data.token).toBe(token);
      expect(arg.data.userId).toBe('user-1');
      expect(arg.data.issuedVia).toBe(Channel.telegram);

      const expectedMin = before + FIVE_MIN_MS;
      const expectedMax = after + FIVE_MIN_MS;
      const expiresAtMs = (arg.data.expiresAt as Date).getTime();
      expect(expiresAtMs).toBeGreaterThanOrEqual(expectedMin - 5);
      expect(expiresAtMs).toBeLessThanOrEqual(expectedMax + 5);
    });
  });

  describe('consume', () => {
    it('returns { userId, issuedVia } when $queryRaw returns one row', async () => {
      const prisma = buildPrismaMock();
      (prisma.$queryRaw as jest.Mock).mockResolvedValueOnce([
        { user_id: 'user-7', issued_via: Channel.telegram },
      ]);
      const service = new TokenService(prisma);

      const result = await service.consume('tok-abc');

      expect(result).toEqual({
        userId: 'user-7',
        issuedVia: Channel.telegram,
      });
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
      // $queryRaw is invoked as a tagged template; first arg is the
      // TemplateStringsArray, subsequent args are the interpolated values.
      const call = (prisma.$queryRaw as jest.Mock).mock.calls[0];
      expect(Array.isArray(call[0])).toBe(true);
      expect(call.slice(1)).toContain('tok-abc');
    });

    it('returns null when $queryRaw returns an empty array', async () => {
      const prisma = buildPrismaMock();
      (prisma.$queryRaw as jest.Mock).mockResolvedValueOnce([]);
      const service = new TokenService(prisma);

      const result = await service.consume('missing-token');

      expect(result).toBeNull();
    });
  });
});
