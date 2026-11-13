import {defineConfig} from '@playwright/test'
export default defineConfig({testDir:'.',testMatch:'d9.spec.ts',use:{baseURL:'http://127.0.0.1:5276',viewport:{width:375,height:812}},webServer:[
 {cwd:new URL('..',import.meta.url).pathname,command:'../maugo/node_modules/.bin/tsx tests/d9-server.mjs',url:'http://127.0.0.1:3176/health',reuseExistingServer:false},
 {cwd:new URL('..',import.meta.url).pathname,command:'npm run dev -- --port 5276 --strictPort',url:'http://127.0.0.1:5276',reuseExistingServer:false,env:{MAUGO_API_TARGET:'http://127.0.0.1:3176'}}
]})
