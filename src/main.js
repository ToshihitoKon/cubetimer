import Vue from 'vue'
import VueRouter from 'vue-router'
import App from './App.vue'

Vue.use(VueRouter)
Vue.config.productionTip = false

const routes = [
  {path: '/', component: App}
]

const router = new VueRouter({
  routes
})

new Vue({
  router,
  el: '#app',
  render: h => h(App) 
})
