import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { contentPlugin } from './scripts/lib/contentPlugin.ts'

/**
 * Where the site is served from. GitHub Pages serves this repo at
 * `/portfolio-website/`; set `BASE_PATH=/` for a custom domain. Local dev,
 * Storybook and tests stay on `/`.
 */
const base = process.env.BASE_PATH ?? (process.env.GITHUB_PAGES === 'true' ? '/portfolio-website/' : '/')

// Tests build the site as on an ordinary day, whatever special is on (docs/seasonal/README.md)
if (process.env.VITEST && !process.env.SEASON_DATE) process.env.SEASON_DATE = '2026-09-01'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react(), contentPlugin()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
    setupFiles: ['src/test/setup.ts'],
  },
})
