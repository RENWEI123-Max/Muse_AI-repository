import {defineConfig} from '@playwright/test'
export default defineConfig({testDir:'.',testMatch:'legal-copy.spec.ts',workers:1,retries:0,use:{baseURL:'http://127.0.0.1:5316'},webServer:{command:'npm run preview -- --port 5316 --strictPort',url:'http://127.0.0.1:5316',reuseExistingServer:false}})
