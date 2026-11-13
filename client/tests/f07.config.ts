import { defineConfig } from '@playwright/test'
const preview = process.env.TEST_PREVIEW === '1'
export default defineConfig({
  testDir: '.', testMatch:'f07.spec.ts',
  use: { baseURL: 'http://127.0.0.1:5272', viewport: { width: 375, height: 812 } },
  webServer: [
    { cwd:new URL('..',import.meta.url).pathname, command: 'node --import ../maugo/node_modules/tsx/dist/loader.mjs tests/d6-followup-server.mjs', env:{D6_PORT:'3172'}, url: 'http://127.0.0.1:3172/health', reuseExistingServer: false },
    { cwd:new URL('..',import.meta.url).pathname, command: `npm run ${preview ? 'preview' : 'dev'} -- --port 5272 --strictPort`, url: 'http://127.0.0.1:5272', reuseExistingServer: false,
      env: { MAUGO_API_TARGET: 'http://127.0.0.1:3172' } }
  ]
})
