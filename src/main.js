import { createApp } from 'vue'
import './style.scss'
import App from './App.vue'
const app = createApp(App)

// 使用elementplus组件库
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
app.use(ElementPlus, { locale: zhCn })

// 使用路由
import router from './router/index.js'
app.use(router)

// 使用pinia状态管理
import { createPinia } from 'pinia'
const pinia = createPinia()
app.use(pinia)

app.mount('#app')
