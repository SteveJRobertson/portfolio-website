import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { contentPlugin } from './scripts/lib/contentPlugin.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), contentPlugin()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
    setupFiles: ['src/test/setup.ts'],
  },
})
