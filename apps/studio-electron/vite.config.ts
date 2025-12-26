import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'src/renderer',
  base: './', // important for electron file:// protocol
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer'),
      '@kidmodstudio/core-model': path.resolve(__dirname, '../../packages/core-model/src/index.ts'),
    },
  },
  server: {
    port: 5173,
  }
});
