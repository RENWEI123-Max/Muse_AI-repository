import {defineConfig} from '@playwright/test'
export default defineConfig({testDir:'.',testMatch:'shell-fix.spec.ts',workers:1,retries:0,outputDir:'../test-results/shell-fix',use:{baseURL:'http://127.0.0.1:5315',viewport:{width:375,height:812}},webServer:{command:'npm run preview -- --port 5315 --strictPort',url:'http://127.0.0.1:5315',reuseExistingServer:false}})
