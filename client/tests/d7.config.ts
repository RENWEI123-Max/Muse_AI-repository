import { defineConfig } from '@playwright/test'
const preview = process.env.TEST_PREVIEW === '1'
export default defineConfig({
  testDir: '.', testMatch:'d7.spec.ts',
  use: { baseURL: 'http://127.0.0.1:5271', viewport: { width: 375, height: 812 } },
  webServer: [
    { cwd:new URL('..',import.meta.url).pathname, command: '../maugo/node_modules/.bin/tsx tests/d7-server.mjs', url: 'http://127.0.0.1:3171/health', reuseExistingServer: false },
    { cwd:new URL('..',import.meta.url).pathname, command: `npm run ${preview ? 'preview' : 'dev'} -- --port 5271 --strictPort`, url: 'http://127.0.0.1:5271', reuseExistingServer: false,
      env: { MAUGO_API_TARGET: 'http://127.0.0.1:3171' } }
  ]
})
