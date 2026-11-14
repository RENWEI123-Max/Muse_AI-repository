import {defineConfig} from '@playwright/test'
export default defineConfig({testDir:'.',testMatch:'r11-audit.spec.ts',workers:1,retries:0,outputDir:'../test-results/r11-audit',use:{baseURL:'http://127.0.0.1:5321',trace:'on'},webServer:{command:'npm run dev -- --port 5321 --strictPort',url:'http://127.0.0.1:5321',reuseExistingServer:false}})
