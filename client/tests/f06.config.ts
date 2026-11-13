import { defineConfig } from '@playwright/test'
const preview = process.env.TEST_PREVIEW === '1'
export default defineConfig({
  testDir: '.', testMatch:'f06.spec.ts',
  use: { baseURL: 'http://127.0.0.1:5296', viewport: { width: 375, height: 812 } },
  webServer: [
    { cwd:new URL('..',import.meta.url).pathname, command: '../maugo/node_modules/.bin/tsx tests/f06-server.mjs', url: 'http://127.0.0.1:3196/health', reuseExistingServer: false },
    { cwd:new URL('..',import.meta.url).pathname, command: `npm run ${preview ? 'preview' : 'dev'} -- --port 5296 --strictPort`, url: 'http://127.0.0.1:5296', reuseExistingServer: false,
      env: { MAUGO_API_TARGET: 'http://127.0.0.1:3196' } }
  ]
})
