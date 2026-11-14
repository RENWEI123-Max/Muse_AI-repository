import {defineConfig} from '@playwright/test'
export default defineConfig({testDir:'.',testMatch:'r14-audit.spec.ts',workers:1,retries:0,outputDir:'../test-results/r14-audit',use:{baseURL:'http://127.0.0.1:5334',trace:'retain-on-failure'},webServer:{command:'npm run preview -- --port 5334 --strictPort',url:'http://127.0.0.1:5334',reuseExistingServer:false}})
