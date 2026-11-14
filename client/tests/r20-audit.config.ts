import {defineConfig} from '@playwright/test'
export default defineConfig({testDir:'.',testMatch:'r20-audit.spec.ts',workers:1,retries:0,outputDir:'../test-results/r20-audit',use:{baseURL:'http://127.0.0.1:5340',trace:'retain-on-failure'},webServer:{command:'npm run preview -- --port 5340 --strictPort',url:'http://127.0.0.1:5340',reuseExistingServer:false}})
