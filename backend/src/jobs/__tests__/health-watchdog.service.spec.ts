import { Logger } from '@nestjs/common';

import { AdminAlertService } from '../../admin/admin-alert.service';
import { PrismaService } from '../../prisma/prisma.service';
import { HealthWatchdogService } from '../health-watchdog.service';

function buildPrismaMock() {
  return {
    $queryRaw: jest.fn(),
  } as unknown as jest.Mocked<PrismaService>;
}

function buildAlertMock() {
  return {
    alert: jest.fn().mockResolvedValue(undefined),
    info: jest.fn().mockResolvedValue(undefined),
    enabled: true,
  } as unknown as jest.Mocked<AdminAlertService>;
}

describe('HealthWatchdogService', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {
      // suppress noise
    });
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not call alert on a healthy check', async () => {
    const prisma = buildPrismaMock();
    const alert = buildAlertMock();
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

    const service = new HealthWatchdogService(prisma, alert);
    await service.check();

    expect(alert.alert).not.toHaveBeenCalled();
    expect(alert.info).not.toHaveBeenCalled();
  });

  it('does not fire alert after only 2 consecutive failures', async () => {
    const prisma = buildPrismaMock();
    const alert = buildAlertMock();
    (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('transient'));

    const service = new HealthWatchdogService(prisma, alert);
    await service.check();
    await service.check();

    expect(alert.alert).not.toHaveBeenCalled();
  });

  it('calls alert.alert exactly once after 3 consecutive failures', async () => {
    const prisma = buildPrismaMock();
    const alert = buildAlertMock();
    (prisma.$queryRaw as jest.Mock).mockRejectedValue(
      new Error('connection refused'),
    );

    const service = new HealthWatchdogService(prisma, alert);
    await service.check();
    await service.check();
    await service.check();

    expect(alert.alert).toHaveBeenCalledTimes(1);
    const [text, opts] = (alert.alert as jest.Mock).mock.calls[0];
    expect(text).toContain('Postgres');
    expect(opts?.dedupeKey).toBe('pg-down');
  });

  it('does not fire alert again on 4th failure when already marked down', async () => {
    const prisma = buildPrismaMock();
    const alert = buildAlertMock();
    (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('still down'));

    const service = new HealthWatchdogService(prisma, alert);
    await service.check();
    await service.check();
    await service.check();
    // 4th failure — already in pgDown state
    await service.check();

    // alert.alert fires once (on 3rd check). The 4th check goes into the
    // dedupe gate inside AdminAlertService (dedupeKey 'pg-down'), but here
    // we verify the service itself doesn't call alert.alert again because
    // pgDown is already true.
    expect(alert.alert).toHaveBeenCalledTimes(1);
  });

  it('calls alert.info with recovery message after success following downtime', async () => {
    const prisma = buildPrismaMock();
    const alert = buildAlertMock();

    // drive to down state
    (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('down'));
    const service = new HealthWatchdogService(prisma, alert);
    await service.check();
    await service.check();
    await service.check();

    // now recover
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);
    await service.check();

    expect(alert.info).toHaveBeenCalledTimes(1);
    const [text] = (alert.info as jest.Mock).mock.calls[0];
    expect(text).toContain('recovered');
  });

  it('counts a hung query (never resolves) as a failure via the ping timeout', async () => {
    jest.useFakeTimers();
    const prisma = buildPrismaMock();
    const alert = buildAlertMock();
    // Query never settles — only the internal timeout should reject it.
    (prisma.$queryRaw as jest.Mock).mockReturnValue(new Promise(() => {}));

    const service = new HealthWatchdogService(prisma, alert);

    for (let i = 0; i < 3; i++) {
      const pending = service.check();
      await jest.advanceTimersByTimeAsync(5_000);
      await pending;
    }

    expect(alert.alert).toHaveBeenCalledTimes(1);
    const [text, opts] = (alert.alert as jest.Mock).mock.calls[0];
    expect(text).toContain('Postgres');
    expect(opts?.dedupeKey).toBe('pg-down');
    jest.useRealTimers();
  });

  it('resets failure count after a successful check (no alert on next isolated failure)', async () => {
    const prisma = buildPrismaMock();
    const alert = buildAlertMock();

    // 2 failures, then success, then 2 more failures — never reaches 3
    (prisma.$queryRaw as jest.Mock)
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce([{ '?column?': 1 }])
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'));

    const service = new HealthWatchdogService(prisma, alert);
    await service.check(); // fail 1
    await service.check(); // fail 2
    await service.check(); // success — resets
    await service.check(); // fail 1
    await service.check(); // fail 2

    expect(alert.alert).not.toHaveBeenCalled();
  });
});
