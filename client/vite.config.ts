import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
export default defineConfig({ plugins: [vue()], server: {proxy: {'/api': {target: process.env.MAUGO_API_TARGET || 'http://127.0.0.1:3000', changeOrigin: true, rewrite: path => path.replace(/^\/api/, '')}}}, build: { assetsInlineLimit: 0 } })
