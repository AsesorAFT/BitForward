import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readdirSync } from 'node:fs';
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';
import legacy from '@vitejs/plugin-legacy';

// https://vitejs.dev/config/
export default defineConfig({
  // Base path para producción
  base: './',

  // Usa el runtime JSX moderno para que cada módulo importe sus dependencias
  // de React y no dependa de una variable global en GitHub Pages.
  esbuild: {
    jsx: 'automatic',
  },

  // Server config para desarrollo
  server: {
    port: 5173,
    host: true,
    open: true,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // Build optimizations
  build: {
    // Output directory
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',

    // Source maps solo en desarrollo
    sourcemap: process.env.NODE_ENV !== 'production',

    // Minification con Terser (más agresiva que esbuild)
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Eliminar console.log en producción
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2, // Dos pasadas de optimización
      },
      format: {
        comments: false, // Eliminar comentarios
      },
    },

    // Configuración de chunks
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        cockpit: resolve(__dirname, 'cockpit.html'),
        curriculum: resolve(__dirname, 'misiones.html'),
        lab: resolve(__dirname, 'laboratorio.html'),
        tutor: resolve(__dirname, 'atf.html'),
        access: resolve(__dirname, 'acceso.html'),
        memberships: resolve(__dirname, 'membresias.html'),
        ...Object.fromEntries(
          readdirSync(resolve(__dirname, 'misiones'))
            .filter(file => file.endsWith('.html'))
            .map(file => [file.replace('.html', ''), resolve(__dirname, 'misiones', file)])
        ),
      },
      output: {
        // Manual chunk splitting para optimización
        manualChunks(id) {
          // 1) Vendors pesados
          if (id.includes('node_modules')) {
            if (
              id.includes('ethers') ||
              id.includes('@solana/web3.js') ||
              id.includes('bitcoinjs-lib') ||
              id.includes('web3')
            ) {
              return 'vendor-web3';
            }
            if (id.includes('apexcharts') || id.includes('chart.js')) {
              return 'vendor-charts';
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            return 'vendor-utils';
          }

          // 2) Chunks por funcionalidad de la app
          if (id.includes('/js/wallet')) return 'wallet';
          if (id.includes('/js/price')) return 'prices';
          if (id.includes('/js/dashboard')) return 'dashboard-core';
          if (id.includes('/js/auth') || id.includes('/js/siwe')) return 'auth';
        },

        // Naming de chunks
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: ({ name }) => {
          if (/\.(css)$/.test(name ?? '')) {
            return 'css/[name]-[hash][extname]';
          }
          if (/\.(png|jpe?g|svg|gif|webp|avif)$/.test(name ?? '')) {
            return 'images/[name]-[hash][extname]';
          }
          if (/\.(woff2?|eot|ttf|otf)$/.test(name ?? '')) {
            return 'fonts/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },

    // Tamaño de chunk warning
    chunkSizeWarningLimit: 600, // 600kb (librerías crypto/chart pueden ser pesadas)

    // Reportar tamaño de chunks
    reportCompressedSize: true,

    // CSS code splitting
    cssCodeSplit: true,
  },

  // Optimización de dependencias
  optimizeDeps: {
    exclude: ['@vite/client', '@vite/env'],
  },

  // Plugins
  plugins: [
    // Soporte para navegadores legacy (opcional)
    legacy({
      targets: ['defaults', 'not IE 11'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
    }),

    // Compresión Gzip
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240, // Solo comprimir archivos > 10kb
      algorithm: 'gzip',
      ext: '.gz',
      deleteOriginFile: false,
    }),

    // Compresión Brotli (mejor que Gzip)
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'brotliCompress',
      ext: '.br',
      deleteOriginFile: false,
    }),

    // El mapa del bundle es una herramienta local y no forma parte del artefacto público.
    ...(process.env.ANALYZE === 'true'
      ? [
          visualizer({
            filename: './.bundle-analysis/stats.html',
            open: false,
            gzipSize: true,
            brotliSize: true,
            template: 'treemap',
          }),
        ]
      : []),
  ],

  // Alias para imports más limpios
  resolve: {
    alias: {
      '@': resolve(__dirname, './js'),
      '@css': resolve(__dirname, './css'),
      '@assets': resolve(__dirname, './assets'),
      '@components': resolve(__dirname, './src/components'),
    },
  },

  // CSS preprocessor
  css: {
    postcss: './postcss.config.js',
    devSourcemap: true,
  },

  // JSON optimizations
  json: {
    namedExports: true,
    stringify: false,
  },

  // Configuración de preview (servidor de producción local)
  preview: {
    port: 4173,
    open: true,
  },

  // Variables de entorno
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '3.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },
});
