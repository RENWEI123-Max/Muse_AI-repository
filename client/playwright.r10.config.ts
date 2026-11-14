import { defineConfig } from '@playwright/test'
export default defineConfig({
 testDir:'./tests',workers:1,
 use:{baseURL:'http://127.0.0.1:5174',viewport:{width:375,height:812}},
 webServer:[
  {command:'node --import ../maugo/node_modules/tsx/dist/loader.mjs tests/auth-server.mjs',url:'http://127.0.0.1:3001/health',reuseExistingServer:true},
  {command:'npm run dev -- --port 5174 --strictPort',url:'http://127.0.0.1:5174',env:{MAUGO_API_TARGET:'http://127.0.0.1:3001'}}
 ]
})
