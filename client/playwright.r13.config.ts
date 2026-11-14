// Prerequisite: VITE_API_BASE_URL=/api npm run build (uses the unchanged D2 API fixtures).
import {defineConfig} from '@playwright/test'
export default defineConfig({testDir:'./tests',workers:1,use:{baseURL:'http://127.0.0.1:5176',viewport:{width:375,height:812}},webServer:{command:'npm run preview -- --port 5176 --strictPort',url:'http://127.0.0.1:5176',reuseExistingServer:false}})
