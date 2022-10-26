import Vue from 'vue';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import App from './App.vue';


Vue.use(ElementUI, { size: "mini" });


import UmyUi from 'umy-ui'
import 'umy-ui/lib/theme-chalk/index.css';
Vue.use(UmyUi);


import './assets/icon/iconfont.css'

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
