import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
<<<<<<< HEAD
  base: process.env.NODE_ENV === 'production' ? '/solid-cockpit/' : '/',
  build: {
    outDir: 'dist',
  },
  vue: {
    template: {
      compilerOptions: {
        isCustomElement: tag => tag === 'sparql-editor'
      },
    },
  },
=======
  base: process.env.VITE_BASE_URL || './',
  transpileDependencies: true,
  build: {
    outDir: 'dist',
  },
>>>>>>> EDC_active
})