# Vite-mini

1. 利用浏览器自带的 moduel import 功能，来实现文件的加载
2. 支持 import vue

原理: 从 node_module 里面获取

- 1. import xx from 'vue' 改造一下 变成 import xx from '/@modules/vue'
- 2. koa 拦截@module 开头的请求，去 node_module 找

3. 支持.vue 单文件组件(只有 js 和 template, 解析.vue 文件，把 script 拿出来)
4. 支持.css，我们可以看下 vite 怎么支持 ts 的，怎么热更新.
