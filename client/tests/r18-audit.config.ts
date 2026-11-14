import {defineConfig} from '@playwright/test'
export default defineConfig({testDir:'.',testMatch:'r18-audit.spec.ts',workers:1,retries:0,outputDir:'../test-results/r18-audit',use:{baseURL:'http://127.0.0.1:5338',trace:'retain-on-failure'},webServer:{command:'npm run preview -- --port 5338 --strictPort',url:'http://127.0.0.1:5338',reuseExistingServer:false}})
