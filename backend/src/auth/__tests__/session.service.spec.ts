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
    user: { create: jest.fn(), findUnique: jest.fn(), delete: jest.fn() },
    packClaim: { deleteMany: jest.fn() },
    $transaction: jest.fn(),
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

  describe('findUser', () => {
    it('returns null when user row is missing', async () => {
      const prisma = buildPrismaMock();
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      const service = new SessionService(prisma);

      const result = await service.findUser('no-such-id');

      expect(result).toBeNull();
    });

    it('returns userId, email, displayName, and avatarUrl when user exists', async () => {
      const prisma = buildPrismaMock();
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'user-7',
        email: 'hello@example.com',
        identities: [{ displayName: 'hello', avatarUrl: null }],
      });
      const service = new SessionService(prisma);

      const result = await service.findUser('user-7');

      expect(result).toEqual({
        userId: 'user-7',
        email: 'hello@example.com',
        displayName: 'hello',
        avatarUrl: null,
      });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-7' },
        select: {
          id: true,
          email: true,
          identities: {
            select: { displayName: true, avatarUrl: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    });

    it('coalesces displayName/avatarUrl from the newest identity that has each', async () => {
      const prisma = buildPrismaMock();
      // identities ordered newest-first: a freshly linked Telegram identity
      // (no avatar) should not shadow an earlier Google identity's avatar.
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'user-10',
        email: 'multi@example.com',
        identities: [
          { displayName: 'Tg User', avatarUrl: null },
          {
            displayName: 'Ada Lovelace',
            avatarUrl: 'https://lh3.googleusercontent.com/a/ada',
          },
        ],
      });
      const service = new SessionService(prisma);

      const result = await service.findUser('user-10');

      expect(result).toEqual({
        userId: 'user-10',
        email: 'multi@example.com',
        displayName: 'Tg User',
        avatarUrl: 'https://lh3.googleusercontent.com/a/ada',
      });
    });

    it('returns displayName and avatarUrl from first identity for Google-only user', async () => {
      const prisma = buildPrismaMock();
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'user-8',
        email: null,
        identities: [
          {
            displayName: 'Ada Lovelace',
            avatarUrl: 'https://lh3.googleusercontent.com/a/ada',
          },
        ],
      });
      const service = new SessionService(prisma);

      const result = await service.findUser('user-8');

      expect(result).toEqual({
        userId: 'user-8',
        email: null,
        displayName: 'Ada Lovelace',
        avatarUrl: 'https://lh3.googleusercontent.com/a/ada',
      });
    });

    it('returns null displayName and avatarUrl when no identity exists', async () => {
      const prisma = buildPrismaMock();
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'user-9',
        email: null,
        identities: [],
      });
      const service = new SessionService(prisma);

      const result = await service.findUser('user-9');

      expect(result).toEqual({
        userId: 'user-9',
        email: null,
        displayName: null,
        avatarUrl: null,
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

  describe('deleteUser', () => {
    it('calls $transaction with packClaim.deleteMany and user.delete for the given userId', async () => {
      const prisma = buildPrismaMock();
      (prisma.$transaction as jest.Mock).mockResolvedValueOnce([]);
      const service = new SessionService(prisma);

      // Capture what the interactive-array form would build
      const deleteManySentinel = Symbol('deleteMany');
      const userDeleteSentinel = Symbol('userDelete');
      (prisma.packClaim.deleteMany as jest.Mock).mockReturnValueOnce(
        deleteManySentinel,
      );
      (prisma.user.delete as jest.Mock).mockReturnValueOnce(userDeleteSentinel);

      await service.deleteUser('user-del');

      expect(prisma.packClaim.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-del' },
      });
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-del' },
      });
      expect(prisma.$transaction).toHaveBeenCalledWith([
        deleteManySentinel,
        userDeleteSentinel,
      ]);
    });
  });
});
