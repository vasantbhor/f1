import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

function devAppEntryPlugin(): Plugin {
  return {
    name: 'dev-app-entry',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url === '/' || req.url === '/index.html') {
          req.url = '/app.html'
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), devAppEntryPlugin()],
  base: './',
  build: {
    cssCodeSplit: false,
    rollupOptions: {
      input: 'app.html',
      output: {
        format: 'iife',
        inlineDynamicImports: true,
      },
    },
  },
})
