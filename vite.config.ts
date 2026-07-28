import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    // The editor is the bulk of the bundle; keep it in its own long-lived chunk.
    rollupOptions: {
      output: {
        manualChunks: {
          editor: ['@codemirror/view', '@codemirror/state', '@codemirror/language', '@codemirror/lang-markdown'],
          markdown: ['marked', 'dompurify'],
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    setupFiles: ['./src/test/setup.ts'],
  },
})
