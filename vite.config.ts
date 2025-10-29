import { defineConfig } from 'vite';
import { gzipSync, brotliCompressSync } from 'zlib';
import { writeFileSync, readFileSync } from 'fs';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'CookiePlugin',
      fileName: (format) => 'cookie.js',
      formats: ['umd']
    },
    rollupOptions: {
      external: ['js-cookie'],
      output: {
        globals: {
          'js-cookie': 'Cookies'
        },
        // Optimize chunk splitting
        manualChunks: undefined,
        // Minify and optimize
        compact: true,
        // Ensure proper UMD export
        exports: 'named',
        // Fix UMD wrapper to properly expose CookiePlugin
        name: 'CookiePlugin'
      }
    },
    // Use Vite's built-in compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn']
      },
      mangle: {
        safari10: true
      }
    },
    // Enable gzip size reporting (built-in feature)
    reportCompressedSize: true,
    // Don't generate source maps for cleaner dist
    sourcemap: false,
    // Don't generate CSS files - only JS
    cssCodeSplit: false,
    // Target modern browsers for smaller bundle
    target: 'es2015',
    // Clean dist folder before build
    emptyOutDir: true
  },
  plugins: [
    // Plugin to generate gzip and brotli files after build
    {
      name: 'generate-compressed',
      writeBundle() {
        const distPath = resolve(__dirname, 'dist');
        const file = 'cookie.js';
        
        try {
          const filePath = resolve(distPath, file);
          const content = readFileSync(filePath);
          
          // Generate gzip version
          const gzipContent = gzipSync(content);
          writeFileSync(resolve(distPath, `${file}.gz`), gzipContent);
          console.log(`✓ Generated ${file}.gz`);
          
          // Generate brotli version
          const brotliContent = brotliCompressSync(content);
          writeFileSync(resolve(distPath, `${file}.br`), brotliContent);
          console.log(`✓ Generated ${file}.br`);
          
        } catch (error) {
          console.error(`Error generating compressed files:`, error);
        }
      }
    }
  ]
});