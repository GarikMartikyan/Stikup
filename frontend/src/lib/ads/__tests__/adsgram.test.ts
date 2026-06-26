import { describe, it, expect, afterEach, vi } from 'vitest';
import { showInterstitial } from '../adsgram';

function setTelegram(on: boolean) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).Telegram = on ? { WebApp: { initData: 'x' } } : undefined;
}

afterEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).Telegram;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).Adsgram;
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('showInterstitial', () => {
  it("returns 'skipped' when not in Telegram", async () => {
    setTelegram(false);
    vi.stubEnv('NEXT_PUBLIC_ADSGRAM_BLOCK_ID', 'int-36357');
    expect(await showInterstitial()).toBe('skipped');
  });

  it("returns 'skipped' when the SDK is absent", async () => {
    setTelegram(true);
    vi.stubEnv('NEXT_PUBLIC_ADSGRAM_BLOCK_ID', 'int-36357');
    expect(await showInterstitial()).toBe('skipped');
  });

  it("returns 'skipped' when no block id is configured", async () => {
    setTelegram(true);
    vi.stubEnv('NEXT_PUBLIC_ADSGRAM_BLOCK_ID', '');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Adsgram = {
      init: () => ({ show: () => Promise.resolve() }),
    };
    expect(await showInterstitial()).toBe('skipped');
  });

  it("returns 'shown' when the ad resolves", async () => {
    setTelegram(true);
    vi.stubEnv('NEXT_PUBLIC_ADSGRAM_BLOCK_ID', 'int-36357');
    const show = vi.fn(() => Promise.resolve());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Adsgram = { init: vi.fn(() => ({ show })) };
    expect(await showInterstitial()).toBe('shown');
    expect(show).toHaveBeenCalledOnce();
  });

  it("returns 'error' when the ad rejects", async () => {
    setTelegram(true);
    vi.stubEnv('NEXT_PUBLIC_ADSGRAM_BLOCK_ID', 'int-36357');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Adsgram = {
      init: () => ({ show: () => Promise.reject(new Error('no fill')) }),
    };
    expect(await showInterstitial()).toBe('error');
  });

  it("returns 'error' if the ad never settles within the timeout", async () => {
    setTelegram(true);
    vi.stubEnv("NEXT_PUBLIC_ADSGRAM_BLOCK_ID", "int-36357");
    vi.useFakeTimers();
    // show() returns a promise that never resolves or rejects.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Adsgram = { init: () => ({ show: () => new Promise(() => {}) }) };
    const pending = showInterstitial();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(await pending).toBe("error");
  });

  it('passes the configured block id to init', async () => {
    setTelegram(true);
    vi.stubEnv('NEXT_PUBLIC_ADSGRAM_BLOCK_ID', 'int-36357');
    const init = vi.fn(() => ({ show: () => Promise.resolve() }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Adsgram = { init };
    await showInterstitial();
    expect(init).toHaveBeenCalledWith({ blockId: 'int-36357' });
  });
});
