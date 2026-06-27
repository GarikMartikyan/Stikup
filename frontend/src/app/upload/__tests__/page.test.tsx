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

const showRewardedMock = vi.fn();
vi.mock('@/lib/ads/adsgram', () => ({
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
    expect(showRewardedMock).not.toHaveBeenCalled();
  });

  it('Telegram: plays the rewarded ad then POSTs /packs and navigates on success', async () => {
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
    expect(showRewardedMock).toHaveBeenCalledOnce();
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/packs',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('Telegram: does not POST and shows ad-required error when ad is not shown', async () => {
    isTelegramEnvMock.mockReturnValue(true);
    showRewardedMock.mockResolvedValue('skipped');
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<UploadPage />);
    selectGrid();
    fireEvent.click(
      await screen.findByRole('button', { name: /upload\.actions\.generate/ }),
    );

    expect(
      await screen.findByText('upload.error.ad_required'),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('Telegram: 401 redirects to login', async () => {
    isTelegramEnvMock.mockReturnValue(true);
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    }) as unknown as typeof fetch;

    render(<UploadPage />);
    selectGrid();
    fireEvent.click(
      await screen.findByRole('button', { name: /upload\.actions\.generate/ }),
    );

    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith('/login'),
    );
    expect(showRewardedMock).toHaveBeenCalledOnce();
  });
});
