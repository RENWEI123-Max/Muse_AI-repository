import {defineConfig} from '@playwright/test'
export default defineConfig({testDir:'.',outputDir:'/tmp/maugo-d11-task80-results',testMatch:'d11.spec.ts',workers:1,timeout:120000,use:{baseURL:'http://127.0.0.1:5280',viewport:{width:375,height:812},video:'on'},webServer:[
 {cwd:new URL('..',import.meta.url).pathname,command:'../maugo/node_modules/.bin/tsx tests/d11-server.mjs',url:'http://127.0.0.1:3180/health',reuseExistingServer:false},
 {cwd:new URL('..',import.meta.url).pathname,command:'npm run dev -- --port 5280 --strictPort',url:'http://127.0.0.1:5280',reuseExistingServer:false,env:{MAUGO_API_TARGET:'http://127.0.0.1:3180'}}
]})
