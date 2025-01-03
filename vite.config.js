import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '169.254.107.67',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://169.254.107.67:5000',
        changeOrigin: true,
      }
    }
  }
});
