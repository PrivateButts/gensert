import { defineConfig } from 'vite'
import tailwindcss from "@tailwindcss/vite";
import Components from 'unplugin-vue-components/vite'


import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), vue(), Components({ /* options */ }),],
})
