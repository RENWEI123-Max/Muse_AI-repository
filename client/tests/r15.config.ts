import {defineConfig} from '@playwright/test'
export default defineConfig({testDir:'.',use:{baseURL:'http://127.0.0.1:5295',viewport:{width:375,height:812}},webServer:{cwd:new URL('..',import.meta.url).pathname,command:'npm run preview -- --port 5295 --strictPort',url:'http://127.0.0.1:5295',reuseExistingServer:false,env:{MAUGO_API_TARGET:'http://127.0.0.1:3000'}}})
