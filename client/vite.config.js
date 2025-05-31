import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
//import vueDevTools from 'vite-plugin-vue-devtools'
//bootstrap
import Components from 'unplugin-vue-components/vite'
import { BootstrapVueNextResolver } from 'bootstrap-vue-next'

import dotenv from 'dotenv'
dotenv.config()


// https://vite.dev/config/
export default defineConfig({
  define: {
    __VERSION__: `"${process.env.VITE_APP_VERSION}"`,
    __EXPORT_APP_STATE_FILE_NAME__: `"${process.env.EXPORT_APP_STATE_FILE_NAME}"`,
    __EXPORT_FILE_NAME__: `"${process.env.EXPORT_FILE_NAME}"`,
    __EXPORT_TEXT_NAME__: `"${process.env.EXPORT_TEXT_NAME}"`,
    __UPLOAD_LOGS_TEXT_NAME__: `"${process.env.UPLOAD_LOGS_TEXT_NAME}"`
  },
  esbuild: {
    supported: {
      'top-level-await': true //browsers can handle top-level-await features
    },
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
  },
  plugins: [
    vue(),
    //vueDevTools(),
    Components({
      resolvers: [BootstrapVueNextResolver()],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
    preserveSymlinks: true,
  },
})
