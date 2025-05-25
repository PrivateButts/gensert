import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

import VueKonva from 'vue-konva';

const app = createApp(App)
  .use(VueKonva)
  .mount('#app');
