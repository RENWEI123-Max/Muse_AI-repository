import {defineConfig} from '@playwright/test'
export default defineConfig({testDir:'.',testMatch:'r19-audit.spec.ts',workers:1,retries:0,outputDir:'../test-results/r19-audit',use:{baseURL:'http://127.0.0.1:5339',trace:'retain-on-failure'},webServer:{command:'npm run preview -- --port 5339 --strictPort',url:'http://127.0.0.1:5339',reuseExistingServer:false}})
