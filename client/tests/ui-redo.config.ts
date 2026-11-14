import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: '.', testMatch: 'ui-redo.spec.ts', workers: 1, fullyParallel: false,
  timeout: 60000, outputDir: '/tmp/maugo-r04-results', reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:5184', viewport: { width: 375, height: 812 }, deviceScaleFactor: 1, locale: 'en-US', timezoneId: 'UTC', reducedMotion: 'reduce' },
  webServer: { command: 'npm run dev -- --port 5184 --strictPort', cwd: new URL('..', import.meta.url).pathname, url: 'http://127.0.0.1:5184', reuseExistingServer: false },
})
