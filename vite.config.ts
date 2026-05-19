import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  optimizeDeps: {
    include: ['pdfjs-dist/build/pdf.worker.min.mjs']
  },
  worker: {
    format: 'es'
  },
  server: {
    port: 5173,
    host: true
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf': ['pdfjs-dist', 'pdf-lib'],
          'canvas': ['konva'],
          'vuetify': ['vuetify']
        }
      }
    }
  }
})
