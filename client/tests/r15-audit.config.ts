import {defineConfig} from '@playwright/test'
export default defineConfig({testDir:'.',testMatch:'r15-audit.spec.ts',workers:1,retries:0,outputDir:'../test-results/r15-audit',use:{baseURL:'http://127.0.0.1:5335',trace:'retain-on-failure'},webServer:{command:'npm run preview -- --port 5335 --strictPort',url:'http://127.0.0.1:5335',reuseExistingServer:false}})
