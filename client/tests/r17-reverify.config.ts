import {defineConfig} from '@playwright/test'
export default defineConfig({testDir:'.',testMatch:'d4-reverify.spec.ts',outputDir:'../docs/ui-redo/r17/reverify-results',workers:1,retries:0,use:{baseURL:'http://127.0.0.1:5173',viewport:{width:375,height:812}}})
