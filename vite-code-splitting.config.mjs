/**
 * BitForward - Vite Code Splitting Configuration
 * 
 * Performance Optimization - Phase B
 * Configuración avanzada de code splitting para reducir bundle size
 * 
 * Estrategias:
 * 1. Route-based splitting
 * 2. Vendor splitting (node_modules)
 * 3. Component-level splitting
 * 4. Dynamic imports
 * 5. Manual chunks optimization
 */

import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  build: {
    // Output directory
    outDir: 'dist',
    
    // Enable source maps for debugging
    sourcemap: true,
    
    // Target modern browsers for smaller bundles
    target: 'es2020',
    
    // Minify with terser for better compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      format: {
        comments: false, // Remove comments
      },
    },
    
    // Rollup options for advanced code splitting
    rollupOptions: {
      // Entry points
      input: {
        main: './index.html',
        dashboard: './dashboard.html',
        lending: './lending.html',
        enterprise: './enterprise.html',
      },
      
      // Output configuration
      output: {
        // Manual chunks for better code splitting
        manualChunks: (id) => {
          // Vendor chunks (node_modules)
          if (id.includes('node_modules')) {
            // Separate large libraries
            if (id.includes('ethers')) {
              return 'vendor-ethers';
            }
            if (id.includes('web3')) {
              return 'vendor-web3';
            }
            if (id.includes('chart')) {
              return 'vendor-charts';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-animations';
            }
            
            // All other vendors
            return 'vendor';
          }
          
          // Route-based chunks
          if (id.includes('/js/dashboard')) {
            return 'route-dashboard';
          }
          if (id.includes('/js/lending')) {
            return 'route-lending';
          }
          if (id.includes('/js/wallet')) {
            return 'route-wallet';
          }
          
          // Component chunks
          if (id.includes('/components/')) {
            return 'components';
          }
          
          // Utility chunks
          if (id.includes('/utils/')) {
            return 'utils';
          }
          
          // Blockchain-related code
          if (id.includes('/js/blockchain') || id.includes('/js/bitforward-web3')) {
            return 'blockchain';
          }
          
          // UI/Theme chunks
          if (id.includes('/js/rocket-theme') || id.includes('/js/enhancements')) {
            return 'ui-theme';
          }
        },
        
        // Chunk file naming
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          } else if (/woff2?|ttf|eot/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          } else if (/css/i.test(ext)) {
            return `css/[name]-[hash][extname]`;
          }
          
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
    
    // Chunk size warnings
    chunkSizeWarningLimit: 500, // KB
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Asset inlining threshold (10KB)
    assetsInlineLimit: 10240,
  },
  
  // Optimizations
  optimizeDeps: {
    include: [
      // Pre-bundle these dependencies
      'ethers',
    ],
    exclude: [
      // Don't pre-bundle these (load on demand)
      'web3',
    ],
  },
  
  // Server configuration for development
  server: {
    port: 3000,
    open: true,
    cors: true,
    hmr: {
      overlay: true,
    },
  },
  
  // Preview configuration
  preview: {
    port: 8080,
  },
  
  // Plugins
  plugins: [
    // Bundle visualizer
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap', // sunburst, treemap, network
    }),
  ],
  
  // Performance budgets
  performance: {
    maxEntrypointSize: 300000, // 300KB
    maxAssetSize: 200000, // 200KB
  },
});
