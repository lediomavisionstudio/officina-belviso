import { defineConfig, devices } from '@playwright/test'

const testConsent = encodeURIComponent(JSON.stringify({
  version: '2',
  necessary: true,
  preferences: false,
  analytics: false,
  marketing: false,
  externalMedia: true,
  consentId: 'playwright-external-media-enabled',
  updatedAt: '2026-08-21T00:00:00.000Z',
}))

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  workers: 2,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    storageState: {
      cookies: [
        {
          name: 'belviso_cookie_consent',
          value: testConsent,
          domain: '127.0.0.1',
          path: '/',
          expires: -1,
          httpOnly: false,
          secure: false,
          sameSite: 'Lax',
        },
      ],
      origins: [],
    },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'pnpm dev --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
  },
})
