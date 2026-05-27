import { Channel } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { SessionService } from '../session.service';

function buildPrismaMock() {
  return {
    loginToken: { create: jest.fn(), deleteMany: jest.fn() },
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    channelIdentity: { findUnique: jest.fn(), update: jest.fn() },
    user: { create: jest.fn() },
    $queryRaw: jest.fn(),
  } as unknown as jest.Mocked<PrismaService>;
}

describe('SessionService', () => {
  describe('issue', () => {
    it('returns { sid, expiresAt } and writes a row', async () => {
      const prisma = buildPrismaMock();
      const service = new SessionService(prisma);

      const before = Date.now();
      const result = await service.issue('user-1', Channel.telegram);
      const after = Date.now();

      expect(typeof result.sid).toBe('string');
      expect(result.sid).toHaveLength(43);
      expect(result.sid).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(result.expiresAt).toBeInstanceOf(Date);

      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(
        before + thirtyDays - 5,
      );
      expect(result.expiresAt.getTime()).toBeLessThanOrEqual(
        after + thirtyDays + 5,
      );

      expect(prisma.session.create).toHaveBeenCalledTimes(1);
      const arg = (prisma.session.create as jest.Mock).mock.calls[0][0];
      expect(arg.data).toEqual({
        id: result.sid,
        userId: 'user-1',
        issuedVia: Channel.telegram,
        expiresAt: result.expiresAt,
      });
    });
  });

  describe('resolve', () => {
    it('returns null for undefined sid', async () => {
      const prisma = buildPrismaMock();
      const service = new SessionService(prisma);

      const result = await service.resolve(undefined);

      expect(result).toBeNull();
      expect(prisma.session.findUnique).not.toHaveBeenCalled();
    });

    it('returns null when session row is missing', async () => {
      const prisma = buildPrismaMock();
      (prisma.session.findUnique as jest.Mock).mockResolvedValueOnce(null);
      const service = new SessionService(prisma);

      const result = await service.resolve('sid-x');

      expect(result).toBeNull();
    });

    it('returns null when session is revoked', async () => {
      const prisma = buildPrismaMock();
      (prisma.session.findUnique as jest.Mock).mockResolvedValueOnce({
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: new Date(),
      });
      const service = new SessionService(prisma);

      const result = await service.resolve('sid-x');

      expect(result).toBeNull();
    });

    it('returns null when session is expired', async () => {
      const prisma = buildPrismaMock();
      (prisma.session.findUnique as jest.Mock).mockResolvedValueOnce({
        userId: 'user-1',
        expiresAt: new Date(Date.now() - 1_000),
        revokedAt: null,
      });
      const service = new SessionService(prisma);

      const result = await service.resolve('sid-x');

      expect(result).toBeNull();
    });

    it('returns { userId } for a valid active session', async () => {
      const prisma = buildPrismaMock();
      (prisma.session.findUnique as jest.Mock).mockResolvedValueOnce({
        userId: 'user-42',
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: null,
      });
      const service = new SessionService(prisma);

      const result = await service.resolve('sid-x');

      expect(result).toEqual({ userId: 'user-42' });
      expect(prisma.session.findUnique).toHaveBeenCalledWith({
        where: { id: 'sid-x' },
        select: { userId: true, expiresAt: true, revokedAt: true },
      });
    });
  });

  describe('revoke', () => {
    it('calls updateMany with the correct where + data shape', async () => {
      const prisma = buildPrismaMock();
      const service = new SessionService(prisma);

      const before = Date.now();
      await service.revoke('sid-z');
      const after = Date.now();

      expect(prisma.session.updateMany).toHaveBeenCalledTimes(1);
      const arg = (prisma.session.updateMany as jest.Mock).mock.calls[0][0];
      expect(arg.where).toEqual({ id: 'sid-z', revokedAt: null });
      expect(arg.data.revokedAt).toBeInstanceOf(Date);
      const ts = (arg.data.revokedAt as Date).getTime();
      expect(ts).toBeGreaterThanOrEqual(before - 5);
      expect(ts).toBeLessThanOrEqual(after + 5);
    });
  });
});
