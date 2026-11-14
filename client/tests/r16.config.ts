import {defineConfig} from '@playwright/test'
export default defineConfig({testDir:'.',outputDir:'../docs/ui-redo/r16/isolated-results',testMatch:'r16-person.spec.ts',workers:1,retries:0,use:{baseURL:'http://127.0.0.1:5296',viewport:{width:375,height:812}}})
