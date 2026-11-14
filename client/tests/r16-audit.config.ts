import {defineConfig} from '@playwright/test'
export default defineConfig({testDir:'.',testMatch:'r16-audit.spec.ts',workers:1,retries:0,outputDir:'../test-results/r16-audit',use:{baseURL:'http://127.0.0.1:5336',trace:'retain-on-failure'},webServer:{command:'npm run preview -- --port 5336 --strictPort',url:'http://127.0.0.1:5336',reuseExistingServer:false}})
