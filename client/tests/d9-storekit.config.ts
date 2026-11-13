import {defineConfig} from '@playwright/test'
export default defineConfig({testDir:'.',testMatch:'d9-storekit.spec.ts',use:{baseURL:'http://127.0.0.1:5277',viewport:{width:375,height:812}},webServer:[
 {cwd:new URL('..',import.meta.url).pathname,command:'npm run dev -- --port 5277 --strictPort',url:'http://127.0.0.1:5277',reuseExistingServer:false}
]})
