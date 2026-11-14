import {defineConfig} from '@playwright/test'
export default defineConfig({testDir:'.',testMatch:'r20-moments.spec.ts',workers:1,retries:0,outputDir:'../docs/ui-redo/r20/measurement-results',use:{baseURL:'http://127.0.0.1:5169',viewport:{width:375,height:812}}})
