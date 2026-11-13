import { defineConfig } from '@playwright/test'
const preview = process.env.TEST_PREVIEW === '1'
export default defineConfig({
  testDir: '.', testMatch:'d6-followup.spec.ts',
  use: { baseURL: 'http://127.0.0.1:5279', viewport: { width: 375, height: 812 } },
  webServer: [
    { cwd:new URL('..',import.meta.url).pathname, command: 'node --import ../maugo/node_modules/tsx/dist/loader.mjs tests/d6-followup-server.mjs', url: 'http://127.0.0.1:3179/health', reuseExistingServer: false },
    { cwd:new URL('..',import.meta.url).pathname, command: `npm run ${preview ? 'preview' : 'dev'} -- --port 5279 --strictPort`, url: 'http://127.0.0.1:5279', reuseExistingServer: false,
      env: { MAUGO_API_TARGET: 'http://127.0.0.1:3179' } }
  ]
})
