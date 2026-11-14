import {defineConfig} from '@playwright/test'
export default defineConfig({testDir:'.',testMatch:'d4.spec.ts',outputDir:'../docs/ui-redo/r18/baseline-r18-regression-results',workers:1,retries:0,use:{baseURL:'http://127.0.0.1:5174',viewport:{width:375,height:812}}})
