import {defineConfig} from '@playwright/test'
export default defineConfig({testDir:'.',testMatch:'r09-audit.spec.ts',workers:1,retries:0,outputDir:'../test-results/r09-audit',use:{baseURL:'http://127.0.0.1:5319',trace:'on'},webServer:{command:'npm run dev -- --port 5319 --strictPort',url:'http://127.0.0.1:5319',reuseExistingServer:false}})
