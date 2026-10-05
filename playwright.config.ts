import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright runs against `vite preview` of the production build with the
 * GitHub Pages base, so it tests what ships (SPEC §10). One project per screen
 * the site is designed for. Screenshots are compared with baselines made on CI's
 * Linux image (`mcr.microsoft.com/playwright`, same version as the package),
 * since font rendering differs between machines.
 *
 * Locally, `PLAYWRIGHT_CHROMIUM` can point at an installed Chromium.
 */
const PORT = 4173
const BASE = '/portfolio-website/'

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.002, animations: 'disabled' } },
  use: {
    baseURL: `http://localhost:${PORT}${BASE}`,
    // Sub-pages open held, so screenshots don't depend on the cycle timer
    reducedMotion: 'reduce',
    locale: 'en-GB',
    timezoneId: 'Europe/London',
    trace: 'retain-on-failure',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM } : {},
  },
  projects: [
    { name: 'widescreen-1920x1080', use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } } },
    { name: 'wide-1440x900', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'classic-1024x768', use: { ...devices['Desktop Chrome'], viewport: { width: 1024, height: 768 } } },
    { name: 'portrait-390x844', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, hasTouch: true } },
  ],
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}${BASE}`,
    env: { GITHUB_PAGES: 'true' },
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
