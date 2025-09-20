import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'terser',
    rollupOptions: {
      input: {
        main: 'index.html',
        login: 'phoenix/login.html',
        contracts: 'phoenix/guardian-contracts.html',
        lending: 'phoenix/lending.html',
        enterprise: 'enterprise.html'
      }
    }
  },
  css: {
    postcss: './postcss.config.js'
  }
})
