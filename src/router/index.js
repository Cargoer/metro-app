// src/router/index.js
import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'metro',
    component: () => import('../views/Metro/svgAndD3.vue'),
    meta: { title: '地铁图' }
  },
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes
})

// 根据路由动态修改标题
router.beforeEach((to, from, next) => {
  const title = to.meta.title || '小豆应用' // 从路由 meta 中获取标题
  document.title = title // 设置标题
  next()
})

export default router