import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';

import { PrismaService } from '../../prisma/prisma.service';
import { EmailAdapter } from '../channel/email-adapter';

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
    user: { create: jest.fn(), findUnique: jest.fn() },
    $queryRaw: jest.fn(),
  } as unknown as jest.Mocked<PrismaService>;
}

describe('EmailAdapter', () => {
  describe('register', () => {
    it('creates a user and returns userId on happy path', async () => {
      const prisma = buildPrismaMock();
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      (prisma.user.create as jest.Mock).mockResolvedValueOnce({
        id: 'user-new',
      });

      const adapter = new EmailAdapter(prisma);
      const result = await adapter.register('Test@Example.com', 'password123');

      expect(result).toEqual({ userId: 'user-new' });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: { id: true },
      });
      const createArg = (prisma.user.create as jest.Mock).mock.calls[0][0];
      expect(createArg.data.email).toBe('test@example.com');
      expect(typeof createArg.data.passwordHash).toBe('string');
      expect(createArg.data.identities.create.channel).toBe('email');
      expect(createArg.data.identities.create.channelUserId).toBe(
        'test@example.com',
      );
    });

    it('throws ConflictException when email already registered', async () => {
      const prisma = buildPrismaMock();
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'existing',
      });

      const adapter = new EmailAdapter(prisma);

      await expect(
        adapter.register('existing@example.com', 'password123'),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('stores a valid argon2 hash (verifiable by argon2.verify)', async () => {
      const prisma = buildPrismaMock();
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      (prisma.user.create as jest.Mock).mockResolvedValueOnce({ id: 'u1' });

      const adapter = new EmailAdapter(prisma);
      await adapter.register('a@b.com', 'supersecret99');

      const createArg = (prisma.user.create as jest.Mock).mock.calls[0][0];
      const hash: string = createArg.data.passwordHash;
      const valid = await argon2.verify(hash, 'supersecret99');
      expect(valid).toBe(true);
    });
  });

  describe('login', () => {
    it('returns userId for correct credentials', async () => {
      const hash = await argon2.hash('correctpassword');
      const prisma = buildPrismaMock();
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'user-42',
        passwordHash: hash,
      });

      const adapter = new EmailAdapter(prisma);
      const result = await adapter.login('user@example.com', 'correctpassword');

      expect(result).toEqual({ userId: 'user-42' });
    });

    it('throws UnauthorizedException on wrong password', async () => {
      const hash = await argon2.hash('correctpassword');
      const prisma = buildPrismaMock();
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'user-42',
        passwordHash: hash,
      });

      const adapter = new EmailAdapter(prisma);

      await expect(
        adapter.login('user@example.com', 'wrongpassword'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws UnauthorizedException when user not found', async () => {
      const prisma = buildPrismaMock();
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const adapter = new EmailAdapter(prisma);

      await expect(
        adapter.login('nobody@example.com', 'password123'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws UnauthorizedException when user has no passwordHash (OAuth-only user)', async () => {
      const prisma = buildPrismaMock();
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'google-user',
        passwordHash: null,
      });

      const adapter = new EmailAdapter(prisma);

      await expect(
        adapter.login('oauth@example.com', 'password123'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('normalises email to lowercase before lookup', async () => {
      const hash = await argon2.hash('pass12345');
      const prisma = buildPrismaMock();
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'u1',
        passwordHash: hash,
      });

      const adapter = new EmailAdapter(prisma);
      await adapter.login('UPPER@EXAMPLE.COM', 'pass12345');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'upper@example.com' },
        select: { id: true, passwordHash: true },
      });
    });
  });
});
