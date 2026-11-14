import {defineConfig} from '@playwright/test'
export default defineConfig({testDir:'.',testMatch:'r17-audit.spec.ts',workers:1,retries:0,outputDir:'../test-results/r17-audit',use:{baseURL:'http://127.0.0.1:5337',trace:'retain-on-failure'},webServer:{command:'npm run preview -- --port 5337 --strictPort',url:'http://127.0.0.1:5337',reuseExistingServer:false}})
