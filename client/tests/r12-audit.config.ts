import {defineConfig} from '@playwright/test'
export default defineConfig({testDir:'.',testMatch:'r12-audit.spec.ts',workers:1,retries:0,outputDir:'../test-results/r12-audit',use:{baseURL:'http://127.0.0.1:5322',trace:'on'},webServer:{command:'npm run dev -- --port 5322 --strictPort',url:'http://127.0.0.1:5322',reuseExistingServer:false}})
