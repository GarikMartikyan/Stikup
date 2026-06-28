import { Logger } from '@nestjs/common';

import { AdminStatsService } from '../admin-stats.service';
import { AdminUpdate } from '../admin.update';

function buildBotMock() {
  return {
    telegram: {
      setMyCommands: jest.fn().mockResolvedValue({}),
    },
  };
}

function buildTgConfig(adminChatId?: number) {
  return {
    botToken: 'test-token',
    initDataMaxAgeSec: 3600,
    launchBot: false,
    adminChatId,
  };
}

function buildStatsMock() {
  const mock = {
    getUserStats: jest.fn().mockResolvedValue({
      totalUsers: 100,
      newToday: 7,
      byChannel: { telegram: 80, google: 10, email: 5, whatsapp: 5 },
      packsByStatus: { ready: 50, failed: 2, generating: 1 },
    }),
  };
  return mock as unknown as jest.Mocked<AdminStatsService>;
}

function buildCtxMock(userId: number) {
  return {
    from: { id: userId },
    reply: jest.fn().mockResolvedValue({}),
  };
}

describe('AdminUpdate', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {
      // suppress noise
    });
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('replies with stats when caller is the admin', async () => {
    const bot = buildBotMock();
    const tg = buildTgConfig(42);
    const stats = buildStatsMock();
    const update = new AdminUpdate(bot as never, tg, stats);

    const ctx = buildCtxMock(42);
    await update.onUsersCount(ctx as never);

    expect(stats.getUserStats).toHaveBeenCalledTimes(1);
    expect(ctx.reply).toHaveBeenCalledTimes(1);
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText).toContain('100');
    expect(replyText).toContain('7');
    expect(replyText).toContain('80');
  });

  it('does NOT reply when caller is not the admin', async () => {
    const bot = buildBotMock();
    const tg = buildTgConfig(42);
    const stats = buildStatsMock();
    const update = new AdminUpdate(bot as never, tg, stats);

    const ctx = buildCtxMock(999);
    await update.onUsersCount(ctx as never);

    expect(stats.getUserStats).not.toHaveBeenCalled();
    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it('does NOT reply when adminChatId is not configured', async () => {
    const bot = buildBotMock();
    const tg = buildTgConfig(undefined);
    const stats = buildStatsMock();
    const update = new AdminUpdate(bot as never, tg, stats);

    const ctx = buildCtxMock(42);
    await update.onUsersCount(ctx as never);

    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it('onModuleInit skips setMyCommands when adminChatId is unset', async () => {
    const bot = buildBotMock();
    const tg = buildTgConfig(undefined);
    const stats = buildStatsMock();
    const update = new AdminUpdate(bot as never, tg, stats);

    await update.onModuleInit();

    expect(bot.telegram.setMyCommands).not.toHaveBeenCalled();
  });

  it('onModuleInit calls setMyCommands with admin scope when adminChatId is set', async () => {
    const bot = buildBotMock();
    const tg = buildTgConfig(42);
    const stats = buildStatsMock();
    const update = new AdminUpdate(bot as never, tg, stats);

    await update.onModuleInit();

    expect(bot.telegram.setMyCommands).toHaveBeenCalledTimes(1);
    const [, scope] = bot.telegram.setMyCommands.mock.calls[0];
    expect(scope).toEqual({ scope: { type: 'chat', chat_id: 42 } });
  });
});
