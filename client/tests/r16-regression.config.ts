import {defineConfig} from '@playwright/test'
export default defineConfig({testDir:'.',outputDir:'../docs/ui-redo/r16/regression-results',testMatch:'d4.spec.ts',workers:1,retries:0,timeout:30000,use:{baseURL:process.env.R16_BASE_URL||'http://127.0.0.1:5296',viewport:{width:375,height:812}}})
