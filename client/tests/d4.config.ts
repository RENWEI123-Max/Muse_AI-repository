import {defineConfig} from '@playwright/test'
export default defineConfig({testDir:'.',testMatch:'d4.spec.ts',use:{baseURL:'http://127.0.0.1:5173',viewport:{width:375,height:812}},webServer:{command:'npm run dev -- --port 5173 --strictPort',cwd:new URL('..',import.meta.url).pathname,url:'http://127.0.0.1:5173'}})
