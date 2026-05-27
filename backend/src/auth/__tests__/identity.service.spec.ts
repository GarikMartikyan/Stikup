import type { ChannelEvent } from '../channel/channel-event';
import { IdentityService } from '../identity.service';
import { PrismaService } from '../../prisma/prisma.service';

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

const event: ChannelEvent = {
  channel: 'telegram',
  channelUserId: '123',
  profile: { displayName: 'Ada', username: 'ada' },
};

describe('IdentityService', () => {
  it('creates a user + identity on first contact', async () => {
    const prisma = buildPrismaMock();
    (prisma.channelIdentity.findUnique as jest.Mock).mockResolvedValueOnce(
      null,
    );
    (prisma.user.create as jest.Mock).mockResolvedValueOnce({ id: 'user-new' });
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
      },
    });
  });
});
