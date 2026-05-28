import { ConflictException } from '@nestjs/common';

import type { ChannelEvent } from '../channel/channel-event';
import { IdentityService } from '../identity.service';
import { PrismaService } from '../../prisma/prisma.service';

function buildPrismaMock() {
  const mock = {
    loginToken: { create: jest.fn(), deleteMany: jest.fn() },
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    channelIdentity: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    user: { create: jest.fn() },
    $queryRaw: jest.fn(),
    $transaction: jest.fn(),
  };
  // Interactive transactions run the callback against the same mock client so
  // tx.channelIdentity.* reuses the mocks configured per-test.
  mock.$transaction.mockImplementation((arg: unknown) =>
    typeof arg === 'function'
      ? (arg as (tx: typeof mock) => unknown)(mock)
      : Promise.all(arg as Promise<unknown>[]),
  );
  return mock as unknown as jest.Mocked<PrismaService>;
}

const event: ChannelEvent = {
  channel: 'telegram',
  channelUserId: '123',
  profile: {
    displayName: 'Ada',
    username: 'ada',
    avatarUrl: 'https://cdn.example/ada.png',
  },
};

describe('IdentityService', () => {
  describe('resolveOrCreate', () => {
    it('creates a user + identity on first contact', async () => {
      const prisma = buildPrismaMock();
      (prisma.channelIdentity.findUnique as jest.Mock).mockResolvedValueOnce(
        null,
      );
      (prisma.user.create as jest.Mock).mockResolvedValueOnce({
        id: 'user-new',
      });
      const service = new IdentityService(prisma);

      const result = await service.resolveOrCreate(event);

      expect(result).toEqual({ userId: 'user-new' });
      expect(prisma.user.create).toHaveBeenCalledTimes(1);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          identities: {
            create: {
              channel: 'telegram',
              channelUserId: '123',
              displayName: 'Ada',
              username: 'ada',
              avatarUrl: 'https://cdn.example/ada.png',
            },
          },
        },
        select: { id: true },
      });
      expect(prisma.channelIdentity.update).not.toHaveBeenCalled();
    });

    it('updates displayName + username on returning user and returns existing userId', async () => {
      const prisma = buildPrismaMock();
      (prisma.channelIdentity.findUnique as jest.Mock).mockResolvedValueOnce({
        userId: 'user-existing',
      });
      const service = new IdentityService(prisma);

      const result = await service.resolveOrCreate(event);

      expect(result).toEqual({ userId: 'user-existing' });
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(prisma.channelIdentity.update).toHaveBeenCalledTimes(1);
      expect(prisma.channelIdentity.update).toHaveBeenCalledWith({
        where: {
          channel_channelUserId: {
            channel: 'telegram',
            channelUserId: '123',
          },
        },
        data: {
          displayName: 'Ada',
          username: 'ada',
          avatarUrl: 'https://cdn.example/ada.png',
        },
      });
    });
  });

  describe('linkChannel', () => {
    it('creates a new identity and returns { status: linked } for a new channel', async () => {
      const prisma = buildPrismaMock();
      (prisma.channelIdentity.findUnique as jest.Mock).mockResolvedValueOnce(
        null,
      );
      (prisma.channelIdentity.create as jest.Mock).mockResolvedValueOnce({});
      const service = new IdentityService(prisma);

      const result = await service.linkChannel('user-abc', event);

      expect(result).toEqual({ status: 'linked' });
      expect(prisma.channelIdentity.create).toHaveBeenCalledTimes(1);
      expect(prisma.channelIdentity.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-abc',
          channel: 'telegram',
          channelUserId: '123',
          displayName: 'Ada',
          username: 'ada',
          avatarUrl: 'https://cdn.example/ada.png',
        },
      });
    });

    it('returns { status: already } and updates profile when same user re-links the same channel', async () => {
      const prisma = buildPrismaMock();
      (prisma.channelIdentity.findUnique as jest.Mock).mockResolvedValueOnce({
        userId: 'user-abc',
      });
      (prisma.channelIdentity.update as jest.Mock).mockResolvedValueOnce({});
      const service = new IdentityService(prisma);

      const result = await service.linkChannel('user-abc', event);

      expect(result).toEqual({ status: 'already' });
      expect(prisma.channelIdentity.update).toHaveBeenCalledTimes(1);
      expect(prisma.channelIdentity.create).not.toHaveBeenCalled();
    });

    it('throws ConflictException(channel_taken) when the channel belongs to a different user', async () => {
      const prisma = buildPrismaMock();
      (prisma.channelIdentity.findUnique as jest.Mock).mockResolvedValue({
        userId: 'other-user',
      });
      const service = new IdentityService(prisma);

      await expect(service.linkChannel('user-abc', event)).rejects.toThrow(
        ConflictException,
      );
      await expect(
        service.linkChannel('user-abc', event),
      ).rejects.toMatchObject({ message: 'channel_taken' });
    });
  });

  describe('unlinkChannel', () => {
    it('removes the identity when the user has more than one', async () => {
      const prisma = buildPrismaMock();
      (prisma.channelIdentity.findMany as jest.Mock).mockResolvedValueOnce([
        { id: 'id-1', channel: 'telegram' },
        { id: 'id-2', channel: 'google' },
      ]);
      (prisma.channelIdentity.deleteMany as jest.Mock).mockResolvedValueOnce({
        count: 1,
      });
      const service = new IdentityService(prisma);

      await service.unlinkChannel('user-abc', 'telegram');

      expect(prisma.channelIdentity.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-abc', channel: 'telegram' },
      });
    });

    it('runs inside a transaction and locks the user row before deleting', async () => {
      const prisma = buildPrismaMock();
      (prisma.channelIdentity.findMany as jest.Mock).mockResolvedValueOnce([
        { id: 'id-1', channel: 'telegram' },
        { id: 'id-2', channel: 'google' },
      ]);
      (prisma.channelIdentity.deleteMany as jest.Mock).mockResolvedValueOnce({
        count: 1,
      });
      const service = new IdentityService(prisma);

      await service.unlinkChannel('user-abc', 'telegram');

      // The check + delete must be serialized against concurrent unlinks via a
      // SELECT ... FOR UPDATE on the owning user row inside the transaction.
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      const lockCall = (prisma.$queryRaw as jest.Mock).mock.calls[0];
      const lockSql = (lockCall[0] as TemplateStringsArray).join('?');
      expect(lockSql).toContain('FROM users');
      expect(lockSql).toContain('FOR UPDATE');
    });

    it('throws ConflictException(last_login_method) when the user has only one identity', async () => {
      const prisma = buildPrismaMock();
      (prisma.channelIdentity.findMany as jest.Mock).mockResolvedValue([
        { id: 'id-1', channel: 'telegram' },
      ]);
      const service = new IdentityService(prisma);

      await expect(
        service.unlinkChannel('user-abc', 'telegram'),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.unlinkChannel('user-abc', 'telegram'),
      ).rejects.toMatchObject({ message: 'last_login_method' });
      expect(prisma.channelIdentity.deleteMany).not.toHaveBeenCalled();
    });

    it('is a no-op (does not throw) when the target channel identity is absent', async () => {
      const prisma = buildPrismaMock();
      (prisma.channelIdentity.findMany as jest.Mock).mockResolvedValueOnce([
        { id: 'id-2', channel: 'google' },
        { id: 'id-3', channel: 'email' },
      ]);
      const service = new IdentityService(prisma);

      await expect(
        service.unlinkChannel('user-abc', 'telegram'),
      ).resolves.toBeUndefined();
      expect(prisma.channelIdentity.deleteMany).not.toHaveBeenCalled();
    });

    it('is a no-op (not a last_login_method conflict) when the sole identity is a different channel', async () => {
      const prisma = buildPrismaMock();
      (prisma.channelIdentity.findMany as jest.Mock).mockResolvedValueOnce([
        { id: 'id-1', channel: 'google' },
      ]);
      const service = new IdentityService(prisma);

      // Removing a channel the user never had must not report a misleading
      // "last login method" conflict, even on a single-identity account.
      await expect(
        service.unlinkChannel('user-abc', 'telegram'),
      ).resolves.toBeUndefined();
      expect(prisma.channelIdentity.deleteMany).not.toHaveBeenCalled();
    });
  });
});
