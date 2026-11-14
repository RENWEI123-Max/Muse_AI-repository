import {defineConfig} from '@playwright/test'
export default defineConfig({testDir:'.',testMatch:'d5.spec.ts',workers:1,retries:0,outputDir:'../docs/ui-redo/r19/d5-results',use:{baseURL:process.env.R19_BASE_URL||'http://127.0.0.1:5169',viewport:{width:375,height:812}}})
