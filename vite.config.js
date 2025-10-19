import { defineConfig } from 'vite';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';
import legacy from '@vitejs/plugin-legacy';

// https://vitejs.dev/config/
export default defineConfig({
  // Base path para producción
  base: './',
  
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
      }
    }
  },
  
  // Build optimizations
  build: {
    // Output directory
    outDir: 'dist',
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
        dashboard: resolve(__dirname, 'dashboard.html'),
        lending: resolve(__dirname, 'lending.html'),
        diagnostico: resolve(__dirname, 'diagnostico.html'),
        enterprise: resolve(__dirname, 'enterprise.html'),
        'test-suite': resolve(__dirname, 'test-suite.html'),
        'test-auth': resolve(__dirname, 'test-auth.html'),
        // Phoenix pages
        login: resolve(__dirname, 'phoenix/login.html'),
        contracts: resolve(__dirname, 'phoenix/guardian-contracts.html'),
        'phoenix-lending': resolve(__dirname, 'phoenix/lending.html'),
      },
      output: {
        // Manual chunk splitting para optimización
        manualChunks(id) {
          // Vendor chunks (librerías externas)
          if (id.includes('node_modules')) {
            if (id.includes('ethers')) {
              return 'vendor-web3';
            }
            if (id.includes('react')) {
              return 'vendor-react';
            }
            return 'vendor';
          }
          
          // App chunks por funcionalidad
          if (id.includes('/js/wallet')) {
            return 'wallet';
          }
          if (id.includes('/js/price')) {
            return 'prices';
          }
          if (id.includes('/js/dashboard')) {
            return 'dashboard';
          }
          if (id.includes('/js/auth') || id.includes('/js/siwe')) {
            return 'auth';
          }
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
    chunkSizeWarningLimit: 500, // 500kb
    
    // Reportar tamaño de chunks
    reportCompressedSize: true,
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Target para navegadores modernos
    target: 'es2015',
  },
  
  // Optimización de dependencias
  optimizeDeps: {
    include: [
      'ethers',
      'sortablejs',
    ],
    exclude: [
      '@vite/client',
      '@vite/env',
    ],
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
    
    // Visualizador de bundle (solo en build)
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap', // 'sunburst', 'treemap', 'network'
    }),
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
  },
});
