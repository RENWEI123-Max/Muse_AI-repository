import { defineConfig } from '@playwright/test'
const preview = process.env.TEST_PREVIEW === '1'
export default defineConfig({
  testDir: './tests',
  use: { baseURL: 'http://127.0.0.1:5173', viewport: { width: 375, height: 812 } },
  webServer: {
    command: `npm run ${preview ? 'preview' : 'dev'} -- --port 5173 --strictPort`,
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: false
  }
})
