import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UploadPage from '../page';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

// Passthrough translator so buttons render their keys verbatim.
vi.mock('@/components/language-provider', () => ({
  useT: () => (k: string) => k,
}));

// Trim heavy presentational children; keep UploadActions real for the button.
vi.mock('@/components/upload/upload-intro', () => ({
  UploadIntro: () => null,
}));
vi.mock('@/components/upload/tips-panel', () => ({ TipsPanel: () => null }));
vi.mock('@/components/upload/drop-zone', () => ({ DropZone: () => null }));
vi.mock('@/components/upload/error-banner', () => ({
  ErrorBanner: ({ message }: { message: string }) => (
    <div role="alert">{message}</div>
  ),
}));

const isTelegramEnvMock = vi.fn();
vi.mock('@/lib/telegram/webapp', () => ({
  isTelegramEnv: () => isTelegramEnvMock(),
}));

const showInterstitialMock = vi.fn();
const showRewardedMock = vi.fn();
vi.mock('@/lib/ads/adsgram', () => ({
  showInterstitial: () => showInterstitialMock(),
  showRewarded: () => showRewardedMock(),
}));

function selectGrid() {
  const input = document.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;
  const file = new File(['x'], 'grid.png', { type: 'image/png' });
  fireEvent.change(input, { target: { files: [file] } });
}

beforeEach(() => {
  // jsdom lacks object-URL support; acceptFile() calls createObjectURL.
  URL.createObjectURL = vi.fn(() => 'blob:mock');
  URL.revokeObjectURL = vi.fn();
  pushMock.mockReset();
  isTelegramEnvMock.mockReset();
  showInterstitialMock.mockReset().mockResolvedValue('shown');
  showRewardedMock.mockReset().mockResolvedValue('shown');
});

afterEach(() => {
  vi.restoreAllMocks();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (global as any).fetch;
});

describe('UploadPage submit', () => {
  it('web (non-Telegram): gates generation, shows the Open-in-Telegram CTA, no POST', async () => {
    isTelegramEnvMock.mockReturnValue(false);
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<UploadPage />);
    selectGrid();
    fireEvent.click(
      await screen.findByRole('button', { name: /upload\.actions\.generate/ }),
    );

    expect(
      await screen.findByRole('link', { name: /telegram_gate\.button/ }),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(showInterstitialMock).not.toHaveBeenCalled();
  });

  it('Telegram: creates the pack, plays the ad, then navigates to the result', async () => {
    isTelegramEnvMock.mockReturnValue(true);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ packId: 'pack-123' }),
    }) as unknown as typeof fetch;

    render(<UploadPage />);
    selectGrid();
    fireEvent.click(
      await screen.findByRole('button', { name: /upload\.actions\.generate/ }),
    );

    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith('/result/pack-123'),
    );
    expect(showInterstitialMock).toHaveBeenCalledOnce();
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/packs',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('Telegram: still navigates when the ad errors (best-effort)', async () => {
    isTelegramEnvMock.mockReturnValue(true);
    showInterstitialMock.mockResolvedValue('error');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ packId: 'pack-789' }),
    }) as unknown as typeof fetch;

    render(<UploadPage />);
    selectGrid();
    fireEvent.click(
      await screen.findByRole('button', { name: /upload\.actions\.generate/ }),
    );

    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith('/result/pack-789'),
    );
  });

  it('Telegram: 403 shows the watch-ad banner, no navigation, no interstitial', async () => {
    isTelegramEnvMock.mockReturnValue(true);
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({}),
    }) as unknown as typeof fetch;

    render(<UploadPage />);
    selectGrid();
    fireEvent.click(
      await screen.findByRole('button', { name: /upload\.actions\.generate/ }),
    );

    expect(
      await screen.findByRole('button', { name: /upload\.actions\.watch_ad/ }),
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
    expect(showInterstitialMock).not.toHaveBeenCalled();
  });

  it('Telegram: watching the ad grants a generation and auto-retries the upload', async () => {
    isTelegramEnvMock.mockReturnValue(true);
    let packsCalls = 0;
    global.fetch = vi.fn((url: string) => {
      if (url === '/api/ads/reward') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ regensLeft: 1 }),
        });
      }
      // /api/packs: first call 403 (out of quota), second call succeeds.
      packsCalls += 1;
      if (packsCalls === 1) {
        return Promise.resolve({ ok: false, status: 403, json: async () => ({}) });
      }
      return Promise.resolve({
        ok: true,
        status: 201,
        json: async () => ({ packId: 'pack-ad' }),
      });
    }) as unknown as typeof fetch;

    render(<UploadPage />);
    selectGrid();
    fireEvent.click(
      await screen.findByRole('button', { name: /upload\.actions\.generate/ }),
    );

    fireEvent.click(
      await screen.findByRole('button', { name: /upload\.actions\.watch_ad/ }),
    );

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/result/pack-ad'));
    expect(showRewardedMock).toHaveBeenCalledOnce();
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/ads/reward',
      expect.objectContaining({ method: 'POST' }),
    );
    // The rewarded unlock must NOT also play the during-generation interstitial.
    expect(showInterstitialMock).not.toHaveBeenCalled();
  });

  it('Telegram: shows ad_unavailable when the rewarded ad does not complete', async () => {
    isTelegramEnvMock.mockReturnValue(true);
    showRewardedMock.mockResolvedValue('error');
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({}),
    }) as unknown as typeof fetch;

    render(<UploadPage />);
    selectGrid();
    fireEvent.click(
      await screen.findByRole('button', { name: /upload\.actions\.generate/ }),
    );
    fireEvent.click(
      await screen.findByRole('button', { name: /upload\.actions\.watch_ad/ }),
    );

    expect(
      await screen.findByText('upload.error.ad_unavailable'),
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
