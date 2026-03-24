import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: 'localhost', // Ensure we run on localhost specifically
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    },
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
    }
  }
});

