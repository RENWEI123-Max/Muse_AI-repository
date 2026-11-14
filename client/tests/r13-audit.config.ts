import {defineConfig} from '@playwright/test'
export default defineConfig({testDir:'.',testMatch:'r13-audit.spec.ts',workers:1,retries:0,outputDir:'../test-results/r13-audit',use:{baseURL:'http://127.0.0.1:5333',trace:'retain-on-failure'},webServer:{command:'npm run preview -- --port 5333 --strictPort',url:'http://127.0.0.1:5333',reuseExistingServer:false}})
