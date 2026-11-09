import { defineConfig, devices } from '@playwright/test';

/**
 * Stage 0.5 regression safety net (see CLAUDE.md / e2e/README.md).
 *
 * - Runs the Vite dev server on a dedicated port so it never collides with `npm run dev` (3000).
 * - All Seoul Open API calls are intercepted with fixtures in `e2e/fixtures/`, so no API key,
 *   live data or network access to openapi.seoul.go.kr is needed.
 * - Tests tagged `@known-issue` are expected to FAIL (`test.fail()`) and document open bugs from
 *   DESIGN.md §7. When a bug is fixed, the corresponding test starts "unexpectedly passing" and
 *   the suite turns red as a reminder to remove the `test.fail()` marker.
 */
const PORT = 4310;
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
    },
  ],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort --host 127.0.0.1`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
