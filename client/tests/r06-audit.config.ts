import {defineConfig} from '@playwright/test'
export default defineConfig({testDir:'.',testMatch:'r06-audit.spec.ts',workers:1,retries:0,use:{baseURL:'http://127.0.0.1:5317',video:'on',trace:'on'},webServer:{command:'npm run dev -- --port 5317 --strictPort',url:'http://127.0.0.1:5317',reuseExistingServer:false}})
