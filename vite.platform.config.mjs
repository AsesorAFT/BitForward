import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig({
  base: './',
  publicDir: false,
  server: { host: '127.0.0.1', port: 5196, strictPort: true },
  preview: { host: '127.0.0.1', port: 4196, strictPort: true },
  build: {
    outDir: 'platform-dist',
    sourcemap: false,
    rollupOptions: {
      input: { plataforma: resolve('plataforma.html'), tokens: resolve('prototipo-tokens.html') },
    },
  },
});
