import { defineConfig } from '@playwright/test'
export default defineConfig({
 testDir: '.', testMatch: 'ui-polish.spec.ts', timeout: 90000,
 use: {baseURL:'http://127.0.0.1:5173',viewport:{width:375,height:812},deviceScaleFactor:2},
 webServer: {
  command:'npm run dev -- --port 5173 --strictPort',
  cwd:new URL('..',import.meta.url).pathname,
  url:'http://127.0.0.1:5173'
 }
})
