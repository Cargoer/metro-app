import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import svgLoader from 'vite-svg-loader'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 根据环境变量动态设置 base
  console.log('mode', mode)
  const base = mode === 'production' 
    ? '/metro-app/'      // 生产环境使用 GitHub Pages 子路径
    : '/' 
  return {
    plugins: [
      vue(), 
      svgLoader({
        defaultImport: 'url',
      }),
    ],
    base,
    server: {
      open: true, // 自动打开浏览器
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src') // 将 @ 指向 src 目录
      }
    }
  }
})
