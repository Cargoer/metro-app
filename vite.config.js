import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: './',
  server: {
    open: true, // 自动打开浏览器
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src') // 将 @ 指向 src 目录
    }
  }
})
