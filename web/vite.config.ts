import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), wasm(), topLevelAwait(), tailwindcss()],
  resolve: {
    alias: {
      '@contracts': path.resolve(__dirname, '../contracts'),
    },
  },
  build: {
    target: 'esnext',
  },
  server: {
    port: 3010,
  },
  optimizeDeps: {
    exclude: ['@midnight-ntwrk/ledger-v8'],
  },
});
