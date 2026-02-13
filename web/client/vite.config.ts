import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5174,
    proxy: {
      '/ws': {
        target: 'ws://localhost:3456',
        ws: true,
      },
    },
  },
});
