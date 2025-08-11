import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    proxy: {
      '/upload': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        logLevel: 'debug',
        onError(err) {
          console.error('Proxy error for /upload:', err);
        },
      },
    },
  },
});