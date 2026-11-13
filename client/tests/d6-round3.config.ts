import {defineConfig} from '@playwright/test'
import config from './d6-recommendation.config'
process.env.D6_API_ROOT='http://127.0.0.1:3179'
export default defineConfig({...config,testMatch:['d6.spec.ts','d6-followup.spec.ts','d6-recommendation.spec.ts','d6-feedback.spec.ts'],workers:1})
