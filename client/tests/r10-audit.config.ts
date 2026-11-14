import {defineConfig} from '@playwright/test'
export default defineConfig({testDir:'.',testMatch:'r10-audit.spec.ts',workers:1,retries:0,outputDir:'../test-results/r10-audit',use:{baseURL:'http://127.0.0.1:5320',trace:'on'},webServer:{command:'npm run dev -- --port 5320 --strictPort',url:'http://127.0.0.1:5320',reuseExistingServer:false}})
