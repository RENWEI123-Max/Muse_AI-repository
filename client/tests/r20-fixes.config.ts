import {defineConfig} from '@playwright/test'
export default defineConfig({testDir:'.',testMatch:'r20-fixes*.spec.ts',workers:1,retries:0,outputDir:'../test-results/r20-fixes',use:{baseURL:'http://127.0.0.1:5341',trace:'retain-on-failure'},webServer:{command:'npm run preview -- --port 5341 --strictPort',url:'http://127.0.0.1:5341',reuseExistingServer:false}})
