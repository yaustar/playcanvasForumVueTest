import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import * as pc from 'playcanvas';
Vue.prototype.$pc = pc
createApp(App).mount('#app')
