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
// Render the title too: the heading is exactly where the image gets blamed
// (default 'photo_not_accepted' vs the neutral 'upload_failed_title'), so the
// "does not blame the image" assertions must be able to observe it.
vi.mock('@/components/upload/error-banner', () => ({
  ErrorBanner: ({ message, title }: { message: string; title?: string }) => (
    <div role="alert">
      <span data-testid="error-heading">
        {title ?? 'upload.error.photo_not_accepted'}
      </span>
      <span data-testid="error-message">{message}</span>
    </div>
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
    // Pre-flight /auth/me succeeds so the ad gate (not auth) is what blocks.
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<UploadPage />);
    selectGrid();
    fireEvent.click(
      await screen.findByRole('button', { name: /upload\.actions\.generate/ }),
    );

    expect(
      await screen.findByText('upload.error.ad_required'),
    ).toBeInTheDocument();
    // The ad was not watched, so no pack is created.
    expect(fetchMock).not.toHaveBeenCalledWith(
      '/api/packs',
      expect.anything(),
    );
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('Telegram: pre-flight auth 401 redirects to login WITHOUT spending an ad', async () => {
    isTelegramEnvMock.mockReturnValue(true);
    // /auth/me returns 401 — the session is gone, so we must bounce to login
    // before the rewarded ad plays (never waste a watched ad on a dead session).
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

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/login'));
    expect(showRewardedMock).not.toHaveBeenCalled();
  });

  it('Telegram: POST 401 (session expired after pre-flight) redirects to login', async () => {
    isTelegramEnvMock.mockReturnValue(true);
    // Pre-flight /auth/me passes, ad plays, but the pack POST then 401s.
    global.fetch = vi.fn().mockImplementation((url: string) =>
      url === '/auth/me'
        ? Promise.resolve({ ok: true, status: 200, json: async () => ({}) })
        : Promise.resolve({ ok: false, status: 401, json: async () => ({}) }),
    ) as unknown as typeof fetch;

    render(<UploadPage />);
    selectGrid();
    fireEvent.click(
      await screen.findByRole('button', { name: /upload\.actions\.generate/ }),
    );

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/login'));
    expect(showRewardedMock).toHaveBeenCalledOnce();
  });

  it('Telegram: POST 429 shows a rate-limit message, keeps the image, and does not blame it', async () => {
    isTelegramEnvMock.mockReturnValue(true);
    global.fetch = vi.fn().mockImplementation((url: string) =>
      url === '/auth/me'
        ? Promise.resolve({ ok: true, status: 200, json: async () => ({}) })
        : Promise.resolve({ ok: false, status: 429, json: async () => ({}) }),
    ) as unknown as typeof fetch;

    render(<UploadPage />);
    selectGrid();
    fireEvent.click(
      await screen.findByRole('button', { name: /upload\.actions\.generate/ }),
    );

    expect(
      await screen.findByText('upload.error.rate_limited'),
    ).toBeInTheDocument();
    // Neutral heading, NOT the image-blaming default.
    expect(screen.getByTestId('error-heading')).toHaveTextContent(
      'upload.error.upload_failed_title',
    );
    // The grid is preserved so the user can retry without re-picking it.
    expect(
      screen.getByRole('button', { name: /upload\.actions\.generate/ }),
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('Telegram: a 5xx is a single POST (no retry), shown as a server error, image kept', async () => {
    isTelegramEnvMock.mockReturnValue(true);
    let packAttempts = 0;
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/auth/me') {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
      }
      packAttempts++;
      return Promise.resolve({ ok: false, status: 500, json: async () => ({}) });
    }) as unknown as typeof fetch;

    render(<UploadPage />);
    selectGrid();
    fireEvent.click(
      await screen.findByRole('button', { name: /upload\.actions\.generate/ }),
    );

    expect(
      await screen.findByText('upload.error.server_error'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('error-heading')).toHaveTextContent(
      'upload.error.upload_failed_title',
    );
    expect(
      screen.queryByText('upload.error.generation_failed'),
    ).not.toBeInTheDocument();
    // The non-idempotent POST is sent exactly once — no auto-retry.
    expect(packAttempts).toBe(1);
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('Telegram: a network failure is shown as a server error, not an image error', async () => {
    isTelegramEnvMock.mockReturnValue(true);
    global.fetch = vi.fn().mockImplementation((url: string) =>
      url === '/auth/me'
        ? Promise.resolve({ ok: true, status: 200, json: async () => ({}) })
        : Promise.reject(new Error('network down')),
    ) as unknown as typeof fetch;

    render(<UploadPage />);
    selectGrid();
    fireEvent.click(
      await screen.findByRole('button', { name: /upload\.actions\.generate/ }),
    );

    expect(
      await screen.findByText('upload.error.server_error'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('error-heading')).toHaveTextContent(
      'upload.error.upload_failed_title',
    );
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('Telegram: retrying after an our-side failure does NOT watch a second ad', async () => {
    isTelegramEnvMock.mockReturnValue(true);
    let packAttempts = 0;
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/auth/me') {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
      }
      packAttempts++;
      return packAttempts === 1
        ? Promise.resolve({ ok: false, status: 500, json: async () => ({}) })
        : Promise.resolve({
            ok: true,
            status: 201,
            json: async () => ({ packId: 'pack-ok' }),
          });
    }) as unknown as typeof fetch;

    render(<UploadPage />);
    selectGrid();
    fireEvent.click(
      await screen.findByRole('button', { name: /upload\.actions\.generate/ }),
    );

    // First attempt fails on our side; exactly one ad was watched.
    expect(
      await screen.findByText('upload.error.server_error'),
    ).toBeInTheDocument();
    expect(showRewardedMock).toHaveBeenCalledOnce();

    // Retry the same grid — no second ad, and it succeeds.
    fireEvent.click(
      await screen.findByRole('button', { name: /upload\.actions\.generate/ }),
    );
    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith('/result/pack-ok'),
    );
    expect(showRewardedMock).toHaveBeenCalledOnce();
    expect(packAttempts).toBe(2);
  });

  it('Telegram: a genuine 4xx blames the image and clears it for a fresh pick', async () => {
    isTelegramEnvMock.mockReturnValue(true);
    global.fetch = vi.fn().mockImplementation((url: string) =>
      url === '/auth/me'
        ? Promise.resolve({ ok: true, status: 200, json: async () => ({}) })
        : Promise.resolve({ ok: false, status: 400, json: async () => ({}) }),
    ) as unknown as typeof fetch;

    render(<UploadPage />);
    selectGrid();
    fireEvent.click(
      await screen.findByRole('button', { name: /upload\.actions\.generate/ }),
    );

    expect(
      await screen.findByText('upload.error.generation_failed'),
    ).toBeInTheDocument();
    // Image error keeps the image-blaming heading...
    expect(screen.getByTestId('error-heading')).toHaveTextContent(
      'upload.error.photo_not_accepted',
    );
    // ...and drops the file, so the only action left is to pick a new one.
    expect(
      screen.queryByRole('button', { name: /upload\.actions\.generate/ }),
    ).not.toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('Telegram: a stray submit after a successful navigation does not create a second pack', async () => {
    isTelegramEnvMock.mockReturnValue(true);
    let packAttempts = 0;
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/auth/me') {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
      }
      packAttempts++;
      return Promise.resolve({
        ok: true,
        status: 201,
        json: async () => ({ packId: 'pack-1' }),
      });
    }) as unknown as typeof fetch;

    render(<UploadPage />);
    selectGrid();
    const btn = await screen.findByRole('button', {
      name: /upload\.actions\.generate/,
    });
    fireEvent.click(btn);
    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith('/result/pack-1'),
    );

    // Once navigation has started, a stray re-invocation must be a no-op — it
    // must NOT skip the ad (adWatched is still true) and create a second pack.
    fireEvent.click(btn);
    await new Promise((r) => setTimeout(r, 0));
    expect(packAttempts).toBe(1);
    expect(showRewardedMock).toHaveBeenCalledOnce();
  });
});
