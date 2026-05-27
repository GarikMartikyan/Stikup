import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  use: { baseURL: 'http://localhost:3000' },
  webServer: {
    // Force port 3000 — the repo-root `.env` exports `PORT=3131` (the backend
    // port) which Next picks up via dotenv-cli, so we override here.
    command: 'npm run dev -- -p 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
