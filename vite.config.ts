import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/XI-SAI/',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
});
