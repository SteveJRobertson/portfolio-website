import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { contentPlugin } from './scripts/lib/contentPlugin.ts'

/**
 * Where the site is served from. GitHub Pages serves this repo at
 * `/portfolio-website/`; set `BASE_PATH=/` for a custom domain. Local dev,
 * Storybook and tests stay on `/`.
 */
const base = process.env.BASE_PATH ?? (process.env.GITHUB_PAGES === 'true' ? '/portfolio-website/' : '/')

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
