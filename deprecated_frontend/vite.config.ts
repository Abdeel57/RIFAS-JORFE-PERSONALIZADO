import { defineConfig, loadEnv, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }): UserConfig => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      // Target modern browsers (evita polyfills extras)
      target: 'es2020',
      minify: 'esbuild',
      reportCompressedSize: true,
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Separar el virtualizer en su propio chunk (es la dependencia más pesada)
            if (id.includes('@tanstack/react-virtual')) {
              return 'vendor-virtual';
            }
            // Separar el SDK de Gemini si se usa (es muy pesado)
            if (id.includes('@google/genai')) {
              return 'vendor-gemini';
            }
          },
        },
      },
    },
  };
});
