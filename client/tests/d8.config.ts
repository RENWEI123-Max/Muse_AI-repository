import { defineConfig } from '@playwright/test'
const preview = process.env.TEST_PREVIEW === '1'
export default defineConfig({
  testDir: '.', testMatch:'d8.spec.ts',
  use: { baseURL: 'http://127.0.0.1:5278', viewport: { width: 375, height: 812 } },
  webServer: [
    { cwd:new URL('..',import.meta.url).pathname, command: '../maugo/node_modules/.bin/tsx tests/d8-server.mjs', url: 'http://127.0.0.1:3178/health', reuseExistingServer: false },
    { cwd:new URL('..',import.meta.url).pathname, command: `npm run ${preview ? 'preview' : 'dev'} -- --port 5278 --strictPort`, url: 'http://127.0.0.1:5278', reuseExistingServer: false,
      env: { MAUGO_API_TARGET: 'http://127.0.0.1:3178' } }
  ]
})
